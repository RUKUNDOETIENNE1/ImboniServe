/**
 * Station Orders API
 * Returns orders filtered by station with item-level details
 * Phase 2: Station Execution Layer
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/middleware/permission.middleware'
import { resolveBusinessContext } from '@/lib/api/business-context'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const ctx = await resolveBusinessContext(req, res)
    if (!ctx) return

    const { stationId } = req.query

    if (!stationId || typeof stationId !== 'string') {
      return res.status(400).json({ error: 'stationId is required' })
    }

    // Verify station belongs to business
    const station = await prisma.station.findUnique({
      where: { id: stationId },
      select: { businessId: true, isActive: true, name: true, code: true },
    })

    if (!station) {
      return res.status(404).json({ error: 'Station not found' })
    }

    const isAdmin = (ctx.roles || []).includes('ADMIN')
    if (!isAdmin && ctx.businessId && station.businessId !== ctx.businessId) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    if (!station.isActive) {
      return res.status(400).json({ error: 'Station is inactive' })
    }

    // Get today's orders that have items assigned to this station
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    const sales = await prisma.sale.findMany({
      where: {
        businessId: station.businessId,
        createdAt: { gte: startOfDay },
        kitchenStatus: { not: 'served' }, // Exclude completed orders
        items: {
          some: {
            stationId: stationId,
          },
        },
      },
      include: {
        items: {
          where: {
            stationId: stationId, // Only items for this station
          },
          include: {
            menuItem: {
              select: {
                name: true,
                category: true,
              },
            },
          },
        },
        table: {
          select: { number: true },
        },
        tableSession: {
          select: {
            id: true,
          },
        },
        participant: {
          select: { name: true },
        },
        business: {
          select: { name: true },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    // Transform to station-friendly format
    const stationOrders = sales.map((sale) => {
      const elapsedMinutes = Math.floor(
        (Date.now() - sale.createdAt.getTime()) / 60000
      )

      // Determine priority based on elapsed time
      let priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' = 'NORMAL'
      if (elapsedMinutes > 15) priority = 'URGENT'
      else if (elapsedMinutes > 10) priority = 'HIGH'
      else if (elapsedMinutes < 5) priority = 'LOW'

      // Aggregate item statuses to determine order status for this station
      const itemStatuses = sale.items.map((i) => i.itemStatus)
      let stationOrderStatus: 'NEW' | 'PREPARING' | 'READY' | 'SERVED' = 'NEW'

      if (itemStatuses.every((s) => s === 'DELIVERED')) {
        stationOrderStatus = 'SERVED'
      } else if (itemStatuses.some((s) => s === 'READY')) {
        stationOrderStatus = 'READY'
      } else if (itemStatuses.some((s) => s === 'PREPARING')) {
        stationOrderStatus = 'PREPARING'
      }

      return {
        id: sale.id,
        orderNumber: sale.orderNumber,
        table: sale.table?.number || sale.participant?.name || 'Unknown',
        items: sale.items.map((item) => ({
          id: item.id,
          name: item.menuItem.name,
          quantity: item.quantity,
          notes: item.instructions
            ? typeof item.instructions === 'object' && item.instructions !== null
              ? (item.instructions as any).notes?.join(', ')
              : undefined
            : undefined,
          modifiers: item.instructionTags,
          itemStatus: item.itemStatus,
          prepStartedAt: item.prepStartedAt,
          readyAt: item.readyAt,
          deliveredAt: item.deliveredAt,
        })),
        status: stationOrderStatus,
        priority,
        orderTime: sale.createdAt,
        prepTime: 15, // Could be calculated from menuItem.prepTimeMinutes
        server: 'Staff', // Could be from user relation if available
        orderSource: sale.orderSource,
      }
    })

    return res.status(200).json({
      success: true,
      station: {
        id: station.businessId,
        name: station.name,
        code: station.code,
      },
      orders: stationOrders,
      count: stationOrders.length,
    })
  } catch (error) {
    console.error('Error fetching station orders:', error)
    return res.status(500).json({ error: 'Failed to fetch station orders' })
  }
}

export default requirePermission('orders.view')(handler)
