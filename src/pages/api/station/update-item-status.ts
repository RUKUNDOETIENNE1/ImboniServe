/**
 * Station Item Status Update API
 * Updates individual item status within a station context
 * Phase 2: Station Execution Layer
 * 
 * MIGRATED TO SaleItemStatusService (Phase 2 Kitchen Consumption Engine)
 * All status transitions now flow through the authoritative service chain:
 * SaleItemStatusService → ConsumptionEngineService → InventoryLedgerService
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/middleware/permission.middleware'
import { resolveBusinessContext } from '@/lib/api/business-context'
import { triggerEvent } from '@/lib/pusher-server'
import { IdempotencyService } from '@/lib/services/idempotency.service'
import {
  SaleItemStatusService,
  InvalidTransitionError,
  SaleItemNotFoundError,
  StationMismatchError,
} from '@/lib/services/sale-item-status.service'
import type { ItemStatus } from '@prisma/client'
import { ingestKDSShadowEvent } from '@/lib/die/business-as-plugin/kds/kds.shadow'

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

    // Pre-fetch item for business access validation (before service call)
    const item = await prisma.saleItem.findUnique({
      where: { id: itemId },
      include: {
        sale: {
          select: {
            id: true,
            businessId: true,
            orderNumber: true,
            createdAt: true,
          },
        },
        menuItem: {
          select: { name: true },
        },
      },
    })

    if (!item) {
      if (idempotencyKey) {
        await IdempotencyService.storeResponse(idempotencyKey, 404, { error: 'Item not found' })
      }
      return res.status(404).json({ error: 'Item not found' })
    }

    // Verify business access
    const isAdmin = (ctx.roles || []).includes('ADMIN')
    if (!isAdmin && ctx.businessId && item.sale.businessId !== ctx.businessId) {
      if (idempotencyKey) {
        await IdempotencyService.storeResponse(idempotencyKey, 403, { error: 'Forbidden' })
      }
      return res.status(403).json({ error: 'Forbidden' })
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PHASE 2 MIGRATION: Use SaleItemStatusService for all status transitions
    // This ensures consumption is triggered on NEW → PREPARING
    // and reversal is triggered on PREPARING/READY → CANCELED
    // ─────────────────────────────────────────────────────────────────────────

    try {
      const result = await SaleItemStatusService.transition({
        saleItemId: itemId,
        newStatus,
        stationId: stationId || undefined,
        actorUserId: ctx.userId,
        idempotencyKey,
        metadata: {
          source: 'station-api',
          itemName: item.menuItem.name,
          orderNumber: item.sale.orderNumber,
        },
      })

      const now = new Date()

      // Handle idempotent case
      if (result.idempotent) {
        if (idempotencyKey) {
          await IdempotencyService.storeResponse(idempotencyKey, 200, {
            success: true,
            item: result.saleItem,
            idempotent: true,
          })
        }

        return res.status(200).json({
          success: true,
          item: result.saleItem,
          idempotent: true,
        })
      }

      // Emit real-time events (post-commit, non-blocking)
      try {
        const businessId = item.sale.businessId

        // Emit to station channel
        if (item.stationId) {
          await triggerEvent(`private-station-${item.stationId}`, 'item.updated', {
            itemId: result.saleItem.id,
            saleId: item.sale.id,
            orderNumber: item.sale.orderNumber,
            itemStatus: newStatus,
            timestamp: now.toISOString(),
            consumptionTriggered: !!result.consumptionResult,
            reversalTriggered: !!result.reversalResult,
          })
        }

        // Emit to kitchen channel (backward compatibility)
        await triggerEvent(`private-kitchen-${businessId}`, 'item.updated', {
          itemId: result.saleItem.id,
          saleId: item.sale.id,
          orderNumber: item.sale.orderNumber,
          itemStatus: newStatus,
          timestamp: now.toISOString(),
        })

        // Emit to order channel
        await triggerEvent(`private-order-${item.sale.id}`, 'item.status.changed', {
          itemId: result.saleItem.id,
          itemStatus: newStatus,
          timestamp: now.toISOString(),
        })
      } catch (eventError) {
        console.error('Failed to emit item status update event:', eventError)
      }

      // Shadow taps (feature-flagged, non-blocking)
      const stageMap: Record<string, 'PREPARING' | 'READY' | 'DELIVERED'> = {
        PREPARING: 'PREPARING',
        READY: 'READY',
        DELIVERED: 'DELIVERED',
        CANCELED: 'PREPARING',
        NEW: 'PREPARING',
      }

      ingestKDSShadowEvent({
        type: 'ORDER_UPDATED',
        businessId: item.sale.businessId,
        saleId: item.sale.id,
        orderNumber: item.sale.orderNumber,
        stationId: item.stationId || undefined,
        itemId: itemId,
        stage: stageMap[newStatus] || 'PREPARING',
      }).catch(() => {})

      // ORDER_COMPLETED: when all items delivered
      if (newStatus === 'DELIVERED') {
        try {
          const remaining = await prisma.saleItem.count({
            where: { saleId: item.sale.id, itemStatus: { not: 'DELIVERED' } },
          })
          if (remaining === 0) {
            ingestKDSShadowEvent({
              type: 'ORDER_COMPLETED',
              businessId: item.sale.businessId,
              saleId: item.sale.id,
              orderNumber: item.sale.orderNumber,
            }).catch(() => {})
          }
        } catch {}
      }

      // ORDER_DELAYED: if ready after threshold
      if (newStatus === 'READY') {
        const createdAt = item.sale.createdAt as Date | undefined
        if (createdAt) {
          const delayMs = Date.now() - new Date(createdAt).getTime()
          const thresholdMs = 45 * 60 * 1000
          if (delayMs > thresholdMs) {
            ingestKDSShadowEvent({
              type: 'ORDER_DELAYED',
              businessId: item.sale.businessId,
              saleId: item.sale.id,
              orderNumber: item.sale.orderNumber,
              stationId: item.stationId || undefined,
              itemId: itemId,
              delayMs,
            }).catch(() => {})
          }
        }
      }

      // Store idempotency response
      if (idempotencyKey) {
        await IdempotencyService.storeResponse(idempotencyKey, 200, {
          success: true,
          item: result.saleItem,
          consumptionResult: result.consumptionResult
            ? {
                state: result.consumptionResult.state,
                totalCostCents: result.consumptionResult.totalCostCents,
              }
            : undefined,
          reversalResult: result.reversalResult
            ? {
                totalReversedCostCents: result.reversalResult.totalReversedCostCents,
              }
            : undefined,
        })
      }

      return res.status(200).json({
        success: true,
        item: result.saleItem,
        previousStatus: result.previousStatus,
        consumptionResult: result.consumptionResult
          ? {
              state: result.consumptionResult.state,
              totalCostCents: result.consumptionResult.totalCostCents,
              lineCount: result.consumptionResult.lines.length,
            }
          : undefined,
        reversalResult: result.reversalResult
          ? {
              totalReversedCostCents: result.reversalResult.totalReversedCostCents,
            }
          : undefined,
      })
    } catch (error) {
      // Handle known service errors
      if (error instanceof InvalidTransitionError) {
        if (idempotencyKey) {
          await IdempotencyService.storeResponse(idempotencyKey, 400, {
            error: error.message,
            allowedTransitions: error.allowedTransitions,
          })
        }
        return res.status(400).json({
          error: error.message,
          allowedTransitions: error.allowedTransitions,
        })
      }

      if (error instanceof SaleItemNotFoundError) {
        if (idempotencyKey) {
          await IdempotencyService.storeResponse(idempotencyKey, 404, { error: error.message })
        }
        return res.status(404).json({ error: error.message })
      }

      if (error instanceof StationMismatchError) {
        if (idempotencyKey) {
          await IdempotencyService.storeResponse(idempotencyKey, 400, { error: error.message })
        }
        return res.status(400).json({ error: error.message })
      }

      // Re-throw unknown errors
      throw error
    }
  } catch (error) {
    console.error('Error updating item status:', error)
    return res.status(500).json({ error: 'Failed to update status' })
  }
}

export default requirePermission('orders.update')(handler)
