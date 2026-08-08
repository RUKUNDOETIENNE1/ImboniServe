/**
 * Kitchen Dispatch Service
 * MANDATORY kitchen order dispatch system
 * 
 * CRITICAL RULE: Every order MUST be dispatched to kitchen
 * This is NOT optional - it's a core requirement
 */

import { prisma } from '@/lib/prisma'
import { triggerEvent } from '@/lib/pusher-server'
import { RoutingService } from './routing.service'
import { TicketEventService } from './ticket-event.service'
import { ingestKDSShadowEvent } from '@/lib/die/business-as-plugin/kds/kds.shadow'

export interface KitchenOrderItem {
  menuItemName: string
  quantity: number
  unitPriceCents: number
  notes?: string
  instructionTags?: string[]
}

export interface DispatchToKitchenInput {
  saleId: string
  businessId: string
  orderNumber: string
  orderSource: string
  tableId?: string
  tableNumber?: string
  participantName?: string
  items: KitchenOrderItem[]
  scheduledAt?: Date
  customerPhone?: string
  customerName?: string
}

export class KitchenDispatchService {
  /**
   * Dispatch order to kitchen - MANDATORY for all orders
   * This function MUST be called for every order
   */
  static async dispatchToKitchen(input: DispatchToKitchenInput): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      // 1. Update Sale with kitchen dispatch status
      await prisma.sale.update({
        where: { id: input.saleId },
        data: {
          kitchenDispatchedAt: new Date(),
          kitchenDispatchStatus: 'dispatched',
          kitchenReleasedAt: new Date(), // Mark as released to kitchen
        },
      })

      // 2. Route items to stations (Phase 1: best-effort, non-blocking)
      try {
        const sale = await prisma.sale.findUnique({
          where: { id: input.saleId },
          include: {
            items: {
              include: {
                menuItem: {
                  select: { id: true, category: true },
                },
              },
            },
          },
        })

        if (sale?.items) {
          const stationMap = new Map<string, string[]>() // stationId -> itemIds

          for (const item of sale.items) {
            const route = await RoutingService.resolveStation({
              businessId: input.businessId,
              menuItemId: item.menuItem.id,
              category: item.menuItem.category || undefined,
            })

            if (route.stationId) {
              // Update item with station assignment
              // NOTE: Setting itemStatus: 'NEW' is the initial state assignment, not a transition.
              // This does NOT trigger consumption (which only happens on NEW → PREPARING).
              // This is intentional - consumption should only occur when kitchen starts preparing.
              await prisma.saleItem.update({
                where: { id: item.id },
                data: {
                  stationId: route.stationId,
                  routedAt: new Date(),
                  itemStatus: 'NEW',
                },
              })

              // Group items by station for event emission
              if (!stationMap.has(route.stationId)) {
                stationMap.set(route.stationId, [])
              }
              stationMap.get(route.stationId)!.push(item.id)

              // Record routing event
              TicketEventService.recordEvent({
                saleId: input.saleId,
                saleItemId: item.id,
                stationId: route.stationId,
                eventType: 'ITEM_ROUTED',
                metadata: {
                  routeSource: route.routeSource,
                  stationCode: route.stationCode,
                },
              }).catch(() => {})
            }
          }

          // Emit station-specific events
          for (const [stationId, itemIds] of stationMap.entries()) {
            try {
              await triggerEvent(`private-station-${stationId}`, 'items.routed', {
                orderId: input.saleId,
                orderNumber: input.orderNumber,
                itemIds,
                timestamp: new Date().toISOString(),
              })
            } catch {}
          }
        }
      } catch (routingError) {
        // Routing failure is non-critical - log but don't fail dispatch
        console.warn('[Kitchen Dispatch] Station routing failed:', routingError)
      }

      // 3. Trigger real-time kitchen notification via Pusher (backward compatible)
      const kitchenChannel = `private-kitchen-${input.businessId}`
      
      try {
        await triggerEvent(kitchenChannel, 'order.created', {
          orderId: input.saleId,
          orderNumber: input.orderNumber,
          orderSource: input.orderSource,
          tableNumber: input.tableNumber,
          participantName: input.participantName,
          items: input.items,
          scheduledAt: input.scheduledAt,
          timestamp: new Date().toISOString(),
        })
      } catch (pusherError) {
        // Pusher failure is non-critical - log but don't fail
        console.warn('[Kitchen Dispatch] Pusher notification failed:', pusherError)
      }

      // Shadow tap: KDS ORDER_RECEIVED (feature-flagged, non-blocking)
      ingestKDSShadowEvent({
        type: 'ORDER_RECEIVED',
        businessId: input.businessId,
        saleId: input.saleId,
        orderNumber: input.orderNumber,
      }).catch(() => {})

      // 4. Record order creation event
      TicketEventService.recordEvent({
        saleId: input.saleId,
        eventType: 'ORDER_CREATED',
        metadata: {
          orderNumber: input.orderNumber,
          orderSource: input.orderSource,
          itemCount: input.items.length,
        },
      }).catch(() => {})

      // 3. Log success
      console.log(`[Kitchen Dispatch] ✅ Order ${input.orderNumber} dispatched to kitchen`, {
        saleId: input.saleId,
        businessId: input.businessId,
        itemCount: input.items.length,
      })

      return { success: true }
    } catch (error: any) {
      // 4. Log failure and update Sale
      console.error('[Kitchen Dispatch] ❌ FAILED:', error)

      try {
        await prisma.sale.update({
          where: { id: input.saleId },
          data: {
            kitchenDispatchStatus: 'failed',
            kitchenDispatchError: error.message || 'Unknown error',
          },
        })
      } catch (updateError) {
        console.error('[Kitchen Dispatch] Failed to update error status:', updateError)
      }

      return {
        success: false,
        error: error.message || 'Kitchen dispatch failed',
      }
    }
  }

  /**
   * Retry failed kitchen dispatch
   */
  static async retryDispatch(saleId: string): Promise<{
    success: boolean
    error?: string
  }> {
    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
        table: true,
        participant: true,
      },
    })

    if (!sale) {
      return { success: false, error: 'Order not found' }
    }

    if (sale.kitchenDispatchStatus === 'dispatched') {
      return { success: true } // Already dispatched
    }

    // Reconstruct dispatch input
    const input: DispatchToKitchenInput = {
      saleId: sale.id,
      businessId: sale.businessId,
      orderNumber: sale.orderNumber,
      orderSource: sale.orderSource,
      tableId: sale.tableId || undefined,
      tableNumber: sale.table?.number,
      participantName: sale.participant?.name || undefined,
      items: sale.items.map((item) => ({
        menuItemName: item.menuItem.name,
        quantity: item.quantity,
        unitPriceCents: item.unitPriceCents,
        notes: typeof item.instructions === 'object' && item.instructions !== null
          ? (item.instructions as any).notes?.join(', ')
          : undefined,
        instructionTags: item.instructionTags,
      })),
      scheduledAt: sale.scheduledAt || undefined,
      customerPhone: sale.customerPhone || undefined,
      customerName: sale.customerName || undefined,
    }

    return await this.dispatchToKitchen(input)
  }

  /**
   * Get failed dispatches for a business
   */
  static async getFailedDispatches(businessId: string) {
    return await prisma.sale.findMany({
      where: {
        businessId,
        kitchenDispatchStatus: 'failed',
        status: { not: 'CANCELLED' },
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
        table: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  /**
   * Get pending dispatches (not yet dispatched)
   */
  static async getPendingDispatches(businessId: string) {
    return await prisma.sale.findMany({
      where: {
        businessId,
        kitchenDispatchStatus: 'pending',
        status: { not: 'CANCELLED' },
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
        table: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    })
  }

  /**
   * Validate that order was dispatched
   */
  static async validateDispatch(saleId: string): Promise<boolean> {
    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      select: { kitchenDispatchStatus: true },
    })

    return sale?.kitchenDispatchStatus === 'dispatched'
  }

  /**
   * Get dispatch statistics for a business
   */
  static async getDispatchStats(businessId: string, startDate?: Date, endDate?: Date) {
    const where: any = {
      businessId,
      status: { not: 'CANCELLED' },
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = startDate
      if (endDate) where.createdAt.lte = endDate
    }

    const [total, dispatched, failed, pending] = await Promise.all([
      prisma.sale.count({ where }),
      prisma.sale.count({ where: { ...where, kitchenDispatchStatus: 'dispatched' } }),
      prisma.sale.count({ where: { ...where, kitchenDispatchStatus: 'failed' } }),
      prisma.sale.count({ where: { ...where, kitchenDispatchStatus: 'pending' } }),
    ])

    return {
      total,
      dispatched,
      failed,
      pending,
      successRate: total > 0 ? (dispatched / total) * 100 : 0,
    }
  }
}
