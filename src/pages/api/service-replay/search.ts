/**
 * Service Replay™ - Search API
 * 
 * Full-text search across replay events.
 * Searches order numbers, table numbers, item names, actor names, etc.
 * 
 * GET /api/service-replay/search
 * 
 * Query Parameters:
 * - q: Search query (required)
 * - startTime: ISO timestamp (required)
 * - endTime: ISO timestamp (required)
 * - limit: Number of results (default 50, max 100)
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { resolveBusinessContext } from '@/lib/api/business-context'
import { transformTicketEvents } from '@/lib/service-replay/transformer'
import type { ReplaySearchResponse } from '@/lib/service-replay/types'

const ALLOWED_ROLES = new Set(['OWNER', 'MANAGER', 'ADMIN', 'SUPERVISOR'])
const DEFAULT_LIMIT = 50
const MAX_LIMIT = 100

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ReplaySearchResponse | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Authenticate and authorize
    const ctx = await resolveBusinessContext(req, res)
    if (!ctx) return

    const userRoles = ctx.roles || []
    const hasAccess = userRoles.some((r: string) => ALLOWED_ROLES.has(r))
    
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied. Manager role required.' })
    }

    const businessId = ctx.businessId
    if (!businessId) {
      return res.status(400).json({ error: 'Business context required' })
    }

    // Parse query parameters
    const {
      q: query,
      startTime,
      endTime,
      limit: limitStr,
    } = req.query

    // Validate required parameters
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({ error: 'Search query (q) is required' })
    }

    if (!startTime || !endTime) {
      return res.status(400).json({ error: 'startTime and endTime are required' })
    }

    const startDate = new Date(startTime as string)
    const endDate = new Date(endTime as string)

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' })
    }

    // Parse limit
    let limit = DEFAULT_LIMIT
    if (limitStr) {
      limit = Math.min(Math.max(1, parseInt(limitStr as string, 10) || DEFAULT_LIMIT), MAX_LIMIT)
    }

    const searchTerm = query.trim().toLowerCase()

    // Search strategy:
    // 1. Search by order number (exact or partial)
    // 2. Search by table number
    // 3. Search by actor name
    // 4. Search by item name (in metadata)
    // 5. Search by event type

    // First, find matching sales (orders)
    const matchingSales = await prisma.sale.findMany({
      where: {
        businessId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        OR: [
          { orderNumber: { contains: searchTerm, mode: 'insensitive' } },
          { customerName: { contains: searchTerm, mode: 'insensitive' } },
          { table: { number: { contains: searchTerm, mode: 'insensitive' } } },
        ],
      },
      select: { id: true },
      take: 100,
    })

    const matchingSaleIds = matchingSales.map(s => s.id)

    // Find matching actors
    const matchingActors = await prisma.user.findMany({
      where: {
        businessId,
        name: { contains: searchTerm, mode: 'insensitive' },
      },
      select: { id: true },
      take: 50,
    })

    const matchingActorIds = matchingActors.map(a => a.id)

    // Find matching stations
    const matchingStations = await prisma.station.findMany({
      where: {
        businessId,
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { code: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      select: { id: true },
      take: 20,
    })

    const matchingStationIds = matchingStations.map(s => s.id)

    // Check if search term matches event types
    const eventTypeMatches = [
      'ORDER_CREATED', 'ORDER_UPDATED', 'ORDER_COMPLETED', 'ORDER_CANCELED',
      'ITEM_ROUTED', 'ITEM_ACCEPTED', 'ITEM_PREPARING', 'ITEM_READY', 'ITEM_DELIVERED', 'ITEM_CANCELED',
      'SLA_WARNING', 'SLA_BREACH', 'STATION_CHANGED', 'MANUAL_OVERRIDE',
    ].filter(type => type.toLowerCase().includes(searchTerm))

    // Build OR conditions
    const orConditions: any[] = []

    if (matchingSaleIds.length > 0) {
      orConditions.push({ saleId: { in: matchingSaleIds } })
    }

    if (matchingActorIds.length > 0) {
      orConditions.push({ actorId: { in: matchingActorIds } })
    }

    if (matchingStationIds.length > 0) {
      orConditions.push({ stationId: { in: matchingStationIds } })
    }

    if (eventTypeMatches.length > 0) {
      orConditions.push({ eventType: { in: eventTypeMatches } })
    }

    // If no matches found in related entities, return empty
    if (orConditions.length === 0) {
      return res.status(200).json({
        events: [],
        totalCount: 0,
        query: query.trim(),
      })
    }

    // Fetch matching events
    const ticketEvents = await prisma.ticketEvent.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        sale: {
          businessId,
        },
        OR: orConditions,
      },
      include: {
        sale: {
          select: {
            id: true,
            orderNumber: true,
            tableId: true,
            customerId: true,
            customerName: true,
            table: {
              select: {
                id: true,
                number: true,
                assignedWaiterId: true,
                assignedWaiter: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            customer: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        saleItem: {
          select: {
            id: true,
            menuItem: {
              select: {
                name: true,
              },
            },
          },
        },
        station: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        actor: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: limit,
    })

    // Transform to ReplayEvent format
    const replayEvents = transformTicketEvents(ticketEvents)

    // Additional filtering: search in description and metadata
    const filteredEvents = replayEvents.filter(event => {
      const searchableText = [
        event.description,
        event.orderNumber,
        event.tableNumber,
        event.waiterName,
        event.stationName,
        event.customerName,
        event.actorName,
        (event.metadata as any)?.itemName,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return searchableText.includes(searchTerm)
    })

    const response: ReplaySearchResponse = {
      events: filteredEvents.slice(0, limit),
      totalCount: filteredEvents.length,
      query: query.trim(),
    }

    return res.status(200).json(response)
  } catch (error) {
    console.error('[ServiceReplay] Search API error:', error)
    return res.status(500).json({ error: 'Failed to search replay events' })
  }
}
