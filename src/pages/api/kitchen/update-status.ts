/**
 * Kitchen Order Status Update API
 * Updates order status from kitchen dashboard
 * 
 * MIGRATED TO SaleItemStatusService (Phase 2 Kitchen Consumption Engine)
 * All item status transitions now flow through the authoritative service chain:
 * SaleItemStatusService → ConsumptionEngineService → InventoryLedgerService
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/middleware/permission.middleware'
import { resolveBusinessContext } from '@/lib/api/business-context'
import { triggerEvent } from '@/lib/pusher-server'
import { TicketEventService } from '@/lib/services/ticket-event.service'
import { SaleItemStatusService } from '@/lib/services/sale-item-status.service'
import type { ItemStatus } from '@prisma/client'
import { ingestKDSShadowEvent } from '@/lib/die/business-as-plugin/kds/kds.shadow'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const ctx = await resolveBusinessContext(req, res)
    if (!ctx) return
    const { orderId, newStatus } = req.body

    if (!orderId || !newStatus) {
      return res.status(400).json({ error: 'orderId and newStatus are required' })
    }

    const validStatuses = ['pending', 'accepted', 'preparing', 'almost_ready', 'ready', 'served']
    if (!validStatuses.includes(newStatus)) {
      return res.status(400).json({ error: 'Invalid status' })
    }

    // Get current order
    const order = await prisma.sale.findUnique({
      where: { id: orderId },
      select: { id: true, kitchenStatus: true, businessId: true, orderNumber: true, createdAt: true },
    })

    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }

    // Enforce cross-business access
    const isAdmin = (ctx.roles || []).includes('ADMIN')
    if (!isAdmin && ctx.businessId && order.businessId !== ctx.businessId) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    // Enforce valid status transitions (no skipping steps)
    const allowedTransitions: Record<string, string[]> = {
      'pending':      ['accepted', 'preparing'],
      'accepted':     ['preparing'],
      'preparing':    ['almost_ready', 'ready'],
      'almost_ready': ['ready'],
      'ready':        ['served'],
      'served':       [],
    }

    const currentStatus = order.kitchenStatus || 'pending'
    const allowed = allowedTransitions[currentStatus] || []
    if (!allowed.includes(newStatus)) {
      return res.status(400).json({
        error: `Cannot transition from "${currentStatus}" to "${newStatus}". Allowed: ${allowed.join(', ') || 'none'}`,
      })
    }

    // Prepare update data with timestamps
    const updateData: any = {
      kitchenStatus: newStatus,
    }

    const now = new Date()

    // Set appropriate timestamps based on status
    switch (newStatus) {
      case 'accepted':
        updateData.acceptedAt = now
        break
      case 'preparing':
        updateData.preparingAt = now
        if (currentStatus === 'pending') {
          updateData.acceptedAt = now // Auto-accept if moving from pending
        }
        break
      case 'almost_ready':
        updateData.almostReadyAt = now
        break
      case 'ready':
        updateData.readyAt = now
        break
      case 'served':
        updateData.servedAt = now
        break
    }

    // Map order status to item status
    const itemStatusMap: Record<string, ItemStatus> = {
      'pending': 'NEW',
      'accepted': 'NEW',
      'preparing': 'PREPARING',
      'almost_ready': 'PREPARING',
      'ready': 'READY',
      'served': 'DELIVERED',
    }

    const itemStatus = itemStatusMap[newStatus]

    // ─────────────────────────────────────────────────────────────────────────
    // PHASE 2 MIGRATION: Use SaleItemStatusService for all item status transitions
    // This ensures consumption is triggered on NEW → PREPARING
    // and reversal is triggered on PREPARING/READY → CANCELED
    // ─────────────────────────────────────────────────────────────────────────

    // Update order and all items in a transaction
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Update order-level status
      const orderResult = await tx.sale.update({
        where: { id: orderId },
        data: updateData,
        include: {
          items: {
            include: {
              menuItem: {
                select: { name: true },
              },
            },
          },
          table: {
            select: { number: true },
          },
          participant: {
            select: { name: true },
          },
        },
      })

      // Update all items to match order status via SaleItemStatusService
      if (itemStatus) {
        const transitionResults = []

        for (const item of orderResult.items) {
          // Skip items that are already in the target state or beyond
          // This handles partial order updates gracefully
          if (item.itemStatus === itemStatus) {
            continue
          }

          // Skip cancelled items
          if (item.itemStatus === 'CANCELED') {
            continue
          }

          // Skip items that have progressed beyond the target state
          // (e.g., don't move DELIVERED back to READY)
          const stateOrder: ItemStatus[] = ['NEW', 'PREPARING', 'READY', 'DELIVERED']
          const currentIndex = stateOrder.indexOf(item.itemStatus)
          const targetIndex = stateOrder.indexOf(itemStatus)
          if (currentIndex >= targetIndex && currentIndex !== -1) {
            continue
          }

          try {
            const result = await SaleItemStatusService.transitionTx(tx, {
              saleItemId: item.id,
              newStatus: itemStatus,
              actorUserId: ctx.userId,
              metadata: {
                source: 'kitchen-order-api',
                orderNumber: orderResult.orderNumber,
                bulkUpdate: true,
              },
            })
            transitionResults.push(result)
          } catch (transitionError) {
            // Log but don't fail the entire order update
            // Individual item failures shouldn't block order-level status change
            console.warn(
              `[Kitchen Update] Item ${item.id} transition failed:`,
              transitionError
            )
          }
        }

        // Log consumption summary if any occurred
        const consumptionCount = transitionResults.filter(r => r.consumptionResult).length
        if (consumptionCount > 0) {
          console.log(
            `[Kitchen Update] Order ${orderId}: ${consumptionCount} items consumed`
          )
        }
      }

      return orderResult
    })

    // Record event (async, non-blocking)
    TicketEventService.recordEvent({
      saleId: orderId,
      eventType: 'ORDER_UPDATED',
      actorId: ctx.userId,
      actorName: undefined,
      previousState: currentStatus,
      newState: newStatus,
      metadata: {
        orderNumber: updatedOrder.orderNumber,
        itemCount: updatedOrder.items.length,
      },
    }).catch((err) => console.error('[TicketEvent] Record failed:', err))

    // Emit real-time events (single emit, no duplicates)
    try {
      const businessId = updatedOrder.businessId

      // Notify kitchen dashboard
      await triggerEvent(`private-kitchen-${businessId}`, 'order.updated', {
        orderId: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        kitchenStatus: newStatus,
        tableNumber: updatedOrder.table?.number,
        participantName: updatedOrder.participant?.name,
      })

      // Notify customer UI via order-specific channel
      await triggerEvent(`private-order-${updatedOrder.id}`, 'status.changed', {
        kitchenStatus: newStatus,
        timestamp: now.toISOString(),
      })
    } catch (eventError) {
      console.error('Failed to emit status update event:', eventError)
    }

    // Shadow taps (feature-flagged, non-blocking)
    ingestKDSShadowEvent({
      type: 'ORDER_UPDATED',
      businessId: order.businessId,
      saleId: orderId,
      orderNumber: order.orderNumber,
      stage: newStatus === 'preparing' ? 'PREPARING' : newStatus === 'ready' ? 'READY' : newStatus === 'served' ? 'DELIVERED' : 'PREPARING',
    }).catch(() => {})

    if (newStatus === 'served') {
      ingestKDSShadowEvent({
        type: 'ORDER_COMPLETED',
        businessId: order.businessId,
        saleId: orderId,
        orderNumber: order.orderNumber,
      }).catch(() => {})
    }

    if (newStatus === 'ready') {
      const createdAt = order.createdAt as Date | undefined
      if (createdAt) {
        const delayMs = Date.now() - new Date(createdAt).getTime()
        const thresholdMs = 45 * 60 * 1000
        if (delayMs > thresholdMs) {
          ingestKDSShadowEvent({
            type: 'ORDER_DELAYED',
            businessId: order.businessId,
            saleId: orderId,
            orderNumber: order.orderNumber,
            delayMs,
          }).catch(() => {})
        }
      }
    }

    return res.status(200).json({
      success: true,
      order: updatedOrder,
    })
  } catch (error) {
    console.error('Error updating kitchen status:', error)
    return res.status(500).json({ error: 'Failed to update status' })
  }
}

export default requirePermission('orders.update')(handler)
