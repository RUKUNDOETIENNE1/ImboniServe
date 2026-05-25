/**
 * Station Snapshot API
 * Returns authoritative state for reconciliation after reconnect
 * Phase 3: Operational Hardening
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

    const { stationId, since } = req.query

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

    // Parse since timestamp for incremental sync
    const sinceDate = since && typeof since === 'string' ? new Date(since) : null

    // Get active orders with items for this station
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    const sales = await prisma.sale.findMany({
      where: {
        businessId: station.businessId,
        createdAt: { gte: startOfDay },
        kitchenStatus: { not: 'served' },
        items: {
          some: {
            stationId: stationId,
          },
        },
        ...(sinceDate && {
          updatedAt: { gte: sinceDate },
        }),
      },
      include: {
        items: {
          where: {
            stationId: stationId,
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
        participant: {
          select: { name: true },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    // Get recent events for this station (for conflict detection)
    const recentEvents = await prisma.ticketEvent.findMany({
      where: {
        stationId: stationId,
        ...(sinceDate && {
          createdAt: { gte: sinceDate },
        }),
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
      select: {
        id: true,
        saleId: true,
        saleItemId: true,
        eventType: true,
        previousState: true,
        newState: true,
        createdAt: true,
        sequenceNumber: true,
        idempotencyKey: true,
      },
    })

    // Transform to snapshot format
    const snapshot = sales.map((sale) => ({
      id: sale.id,
      orderNumber: sale.orderNumber,
      table: sale.table?.number || sale.participant?.name || 'Unknown',
      items: sale.items.map((item) => ({
        id: item.id,
        name: item.menuItem.name,
        quantity: item.quantity,
        itemStatus: item.itemStatus,
        prepStartedAt: item.prepStartedAt,
        readyAt: item.readyAt,
        deliveredAt: item.deliveredAt,
        stationId: item.stationId,
        routedAt: item.routedAt,
        updatedAt: item.updatedAt,
      })),
      kitchenStatus: sale.kitchenStatus,
      createdAt: sale.createdAt,
      updatedAt: sale.updatedAt,
    }))

    return res.status(200).json({
      success: true,
      station: {
        id: stationId,
        name: station.name,
        code: station.code,
      },
      snapshot,
      events: recentEvents,
      snapshotTime: new Date().toISOString(),
      isIncremental: !!sinceDate,
      count: snapshot.length,
    })
  } catch (error) {
    console.error('Error generating station snapshot:', error)
    return res.status(500).json({ error: 'Failed to generate snapshot' })
  }
}

export default requirePermission('orders.view')(handler)
