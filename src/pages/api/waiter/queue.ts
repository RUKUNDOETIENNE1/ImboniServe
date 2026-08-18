/**
 * Waiter Queue API
 * Provides real-time operational queue for waiters
 * 
 * Returns orders grouped by workflow stage:
 * - Waiting for Preparation
 * - Preparing
 * - Ready for Pickup
 * - Picked Up
 * - Delivered
 * 
 * Integrates with Heart Pulse for live updates
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/middleware/permission.middleware'
import { resolveBusinessContext } from '@/lib/api/business-context'
import { getBusinessDayBoundary } from '@/lib/utils/timezone'

interface StationProgress {
  stationId: string
  stationName: string
  itemCount: number
  readyCount: number
  allReady: boolean
}

interface QueueOrder {
  id: string
  orderNumber: string
  tableNumber?: string
  participantName?: string
  customerPhone?: string
  customerId?: string
  kitchenStatus: string
  expoStatus: string | null
  createdAt: string
  readyAt?: string
  pickedUpAt?: string
  deliveredAt?: string
  itemCount: number
  stationProgress: StationProgress[]
  priority: 'normal' | 'urgent' | 'delayed'
  waitTimeMinutes: number
}

interface WaiterQueue {
  waitingForPreparation: QueueOrder[]
  preparing: QueueOrder[]
  readyForPickup: QueueOrder[]
  pickedUp: QueueOrder[]
  delivered: QueueOrder[]
}

async function baseHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const ctx = await resolveBusinessContext(req, res)
    if (!ctx) return

    const businessId = ctx.businessId

    // Fetch business timezone for timezone-aware day boundary
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { timezone: true },
    })
    const { start: dayStart } = getBusinessDayBoundary(new Date(), business?.timezone)

    // Fetch active orders with their items and station assignments
    const orders = await prisma.sale.findMany({
      where: {
        businessId,
        kitchenDispatchStatus: 'dispatched',
        kitchenStatus: {
          in: ['pending', 'accepted', 'preparing', 'almost_ready', 'ready', 'served'],
        },
        // Only show orders from today (operational view)
        createdAt: {
          gte: dayStart,
        },
      },
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
        customer: {
          select: { id: true, phone: true },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    // Fetch station names for progress tracking
    const stationIds = [...new Set(orders.flatMap(o => o.items.map(i => i.stationId).filter(Boolean)))] as string[]
    const stations = await prisma.station.findMany({
      where: { id: { in: stationIds } },
      select: { id: true, name: true },
    })
    const stationMap = new Map(stations.map(s => [s.id, s.name]))

    // Calculate priority and wait time
    const now = new Date()
    const URGENT_THRESHOLD_MINUTES = 15
    const DELAYED_THRESHOLD_MINUTES = 30

    const calculatePriority = (createdAt: Date, kitchenStatus: string): 'normal' | 'urgent' | 'delayed' => {
      const waitMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60)
      
      if (kitchenStatus === 'ready' && waitMinutes > URGENT_THRESHOLD_MINUTES) {
        return 'delayed'
      }
      if (waitMinutes > DELAYED_THRESHOLD_MINUTES) {
        return 'delayed'
      }
      if (waitMinutes > URGENT_THRESHOLD_MINUTES) {
        return 'urgent'
      }
      return 'normal'
    }

    // Build station progress for each order
    const buildStationProgress = (items: any[]): StationProgress[] => {
      const stationGroups = new Map<string, { total: number; ready: number }>()
      
      items.forEach(item => {
        if (!item.stationId) return
        
        const current = stationGroups.get(item.stationId) || { total: 0, ready: 0 }
        current.total += item.quantity
        if (item.itemStatus === 'READY' || item.itemStatus === 'DELIVERED') {
          current.ready += item.quantity
        }
        stationGroups.set(item.stationId, current)
      })

      return Array.from(stationGroups.entries()).map(([stationId, counts]) => ({
        stationId,
        stationName: stationMap.get(stationId) || 'Unknown Station',
        itemCount: counts.total,
        readyCount: counts.ready,
        allReady: counts.ready === counts.total,
      }))
    }

    // Transform orders into queue format
    const queueOrders: QueueOrder[] = orders.map(order => {
      const waitTimeMinutes = Math.floor((now.getTime() - order.createdAt.getTime()) / (1000 * 60))
      const stationProgress = buildStationProgress(order.items)

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        tableNumber: order.table?.number?.toString(),
        participantName: order.participant?.name || undefined,
        customerPhone: (order as any).customer?.phone || order.customerPhone || undefined,
        customerId: (order as any).customer?.id || order.customerId || undefined,
        kitchenStatus: order.kitchenStatus || 'pending',
        expoStatus: order.expoStatus,
        createdAt: order.createdAt.toISOString(),
        readyAt: order.readyAt?.toISOString(),
        pickedUpAt: order.expoConfirmedAt?.toISOString(),
        deliveredAt: order.servedConfirmedAt?.toISOString(),
        itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
        stationProgress,
        priority: calculatePriority(order.createdAt, order.kitchenStatus || 'pending'),
        waitTimeMinutes,
      }
    })

    // Group orders by workflow stage
    const queue: WaiterQueue = {
      waitingForPreparation: queueOrders.filter(o => 
        ['pending', 'accepted'].includes(o.kitchenStatus)
      ),
      preparing: queueOrders.filter(o => 
        ['preparing', 'almost_ready'].includes(o.kitchenStatus)
      ),
      readyForPickup: queueOrders.filter(o => 
        o.kitchenStatus === 'ready' && 
        (o.expoStatus === 'READY_FOR_EXPO' || o.expoStatus === 'PENDING')
      ),
      pickedUp: queueOrders.filter(o => 
        o.expoStatus === 'EXPO_CONFIRMED' && 
        o.kitchenStatus !== 'served'
      ),
      delivered: queueOrders.filter(o => 
        o.kitchenStatus === 'served' || 
        o.expoStatus === 'SERVED_CONFIRMED'
      ),
    }

    return res.status(200).json({
      success: true,
      queue,
      summary: {
        total: queueOrders.length,
        waitingForPreparation: queue.waitingForPreparation.length,
        preparing: queue.preparing.length,
        readyForPickup: queue.readyForPickup.length,
        pickedUp: queue.pickedUp.length,
        delivered: queue.delivered.length,
        urgent: queueOrders.filter(o => o.priority === 'urgent').length,
        delayed: queueOrders.filter(o => o.priority === 'delayed').length,
      },
    })
  } catch (error) {
    console.error('Error fetching waiter queue:', error)
    return res.status(500).json({ error: 'Failed to fetch waiter queue' })
  }
}

export default requirePermission('orders.view')(baseHandler)
