/**
 * Station Item Status Update API
 * Updates individual item status within a station context
 * Phase 2: Station Execution Layer
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/middleware/permission.middleware'
import { resolveBusinessContext } from '@/lib/api/business-context'
import { triggerEvent } from '@/lib/pusher-server'
import { TicketEventService } from '@/lib/services/ticket-event.service'
import { StateMachineService } from '@/lib/services/state-machine.service'
import { IdempotencyService } from '@/lib/services/idempotency.service'
import type { ItemStatus } from '@prisma/client'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const ctx = await resolveBusinessContext(req, res)
    if (!ctx) return

    const { itemId, newStatus, stationId, idempotencyKey } = req.body

    // Phase 3: Check idempotency
    if (idempotencyKey) {
      const idempotencyCheck = await IdempotencyService.checkAndLock(
        idempotencyKey,
        ctx.businessId!,
        '/api/station/update-item-status',
        req.body
      )

      if (!idempotencyCheck.isNew && idempotencyCheck.existingResponse) {
        return res
          .status(idempotencyCheck.existingResponse.statusCode)
          .json(idempotencyCheck.existingResponse.body)
      }
    }

    if (!itemId || !newStatus) {
      return res.status(400).json({ error: 'itemId and newStatus are required' })
    }

    const validStatuses: ItemStatus[] = ['NEW', 'PREPARING', 'READY', 'DELIVERED', 'CANCELED']
    if (!validStatuses.includes(newStatus)) {
      return res.status(400).json({ error: 'Invalid status' })
    }

    // Get item with sale info
    const item = await prisma.saleItem.findUnique({
      where: { id: itemId },
      include: {
        sale: {
          select: {
            id: true,
            businessId: true,
            orderNumber: true,
          },
        },
        menuItem: {
          select: { name: true },
        },
      },
    })

    if (!item) {
      return res.status(404).json({ error: 'Item not found' })
    }

    // Verify business access
    const isAdmin = (ctx.roles || []).includes('ADMIN')
    if (!isAdmin && ctx.businessId && item.sale.businessId !== ctx.businessId) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    // Verify station if provided
    if (stationId && item.stationId !== stationId) {
      return res.status(400).json({ error: 'Item does not belong to this station' })
    }

    const previousStatus = item.itemStatus
    const now = new Date()

    // Phase 3: Validate state transition
    const validation = StateMachineService.validateAndExplain(
      previousStatus as ItemStatus | null,
      newStatus,
      {
        itemId: item.id,
        orderId: item.sale.id,
        stationId: item.stationId || undefined,
      }
    )

    if (!validation.isValid) {
      // Log invalid transition attempt
      TicketEventService.recordEvent({
        saleId: item.sale.id,
        saleItemId: itemId,
        stationId: item.stationId || undefined,
        eventType: 'INVALID_TRANSITION',
        actorId: ctx.userId,
        previousState: previousStatus || undefined,
        newState: newStatus,
        metadata: {
          error: validation.error,
          allowedTransitions: validation.allowedTransitions,
          contextMessage: validation.contextMessage,
        },
        idempotencyKey: idempotencyKey
          ? `invalid-${idempotencyKey}`
          : undefined,
      }).catch(() => {})

      // Store idempotency response
      if (idempotencyKey) {
        await IdempotencyService.storeResponse(idempotencyKey, 400, {
          error: validation.error,
          allowedTransitions: validation.allowedTransitions,
        })
      }

      return res.status(400).json({
        error: validation.error,
        allowedTransitions: validation.allowedTransitions,
      })
    }

    // If same state (idempotent), return success without update
    if (previousStatus === newStatus) {
      if (idempotencyKey) {
        await IdempotencyService.storeResponse(idempotencyKey, 200, {
          success: true,
          item: item,
          idempotent: true,
        })
      }

      return res.status(200).json({
        success: true,
        item: item,
        idempotent: true,
      })
    }

    // Prepare update data with timestamps
    const updateData: any = {
      itemStatus: newStatus,
    }

    switch (newStatus) {
      case 'PREPARING':
        updateData.prepStartedAt = now
        break
      case 'READY':
        updateData.readyAt = now
        break
      case 'DELIVERED':
        updateData.deliveredAt = now
        break
    }

    // Update item
    const updatedItem = await prisma.saleItem.update({
      where: { id: itemId },
      data: updateData,
    })

    // Record event with idempotency
    const eventTypeMap: Record<string, any> = {
      PREPARING: 'ITEM_PREPARING',
      READY: 'ITEM_READY',
      DELIVERED: 'ITEM_DELIVERED',
      CANCELED: 'ITEM_CANCELED',
    }

    TicketEventService.recordEvent({
      saleId: item.sale.id,
      saleItemId: itemId,
      stationId: item.stationId || undefined,
      eventType: eventTypeMap[newStatus] || 'ITEM_UPDATED',
      actorId: ctx.userId,
      previousState: previousStatus || undefined,
      newState: newStatus,
      metadata: {
        itemName: item.menuItem.name,
        orderNumber: item.sale.orderNumber,
      },
      idempotencyKey: idempotencyKey ? `event-${idempotencyKey}` : undefined,
    }).catch(() => {})

    // Emit real-time events
    try {
      const businessId = item.sale.businessId

      // Emit to station channel
      if (item.stationId) {
        await triggerEvent(`private-station-${item.stationId}`, 'item.updated', {
          itemId: updatedItem.id,
          saleId: item.sale.id,
          orderNumber: item.sale.orderNumber,
          itemStatus: newStatus,
          timestamp: now.toISOString(),
        })
      }

      // Emit to kitchen channel (backward compatibility)
      await triggerEvent(`private-kitchen-${businessId}`, 'item.updated', {
        itemId: updatedItem.id,
        saleId: item.sale.id,
        orderNumber: item.sale.orderNumber,
        itemStatus: newStatus,
        timestamp: now.toISOString(),
      })

      // Emit to order channel
      await triggerEvent(`private-order-${item.sale.id}`, 'item.status.changed', {
        itemId: updatedItem.id,
        itemStatus: newStatus,
        timestamp: now.toISOString(),
      })
    } catch (eventError) {
      console.error('Failed to emit item status update event:', eventError)
    }

    // Store idempotency response
    const response = {
      success: true,
      item: updatedItem,
    }

    if (idempotencyKey) {
      await IdempotencyService.storeResponse(idempotencyKey, 200, response)
    }

    return res.status(200).json(response)
  } catch (error) {
    console.error('Error updating item status:', error)
    return res.status(500).json({ error: 'Failed to update item status' })
  }
}

export default requirePermission('orders.update')(handler)
