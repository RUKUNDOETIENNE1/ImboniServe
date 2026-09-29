/**
 * Service Replay™ - Events API
 * 
 * Retrieves operational events for replay playback.
 * Supports filtering, pagination, and time range queries.
 * 
 * GET /api/service-replay/events
 * 
 * Query Parameters:
 * - startTime: ISO timestamp (required)
 * - endTime: ISO timestamp (required)
 * - cursor: Pagination cursor
 * - limit: Number of events (default 100, max 500)
 * - orderId: Filter by order
 * - tableId: Filter by table
 * - stationId: Filter by station
 * - eventTypes: Comma-separated event types
 * - categories: Comma-separated categories
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { resolveBusinessContext } from '@/lib/api/business-context'
import { transformTicketEvents } from '@/lib/service-replay/transformer'
import { calculateStatistics } from '@/lib/service-replay/statistics'
import type { ReplayEventsResponse, ReplayFilters, ReplayEventType, ReplayEventCategory } from '@/lib/service-replay/types'

const ALLOWED_ROLES = new Set(['OWNER', 'MANAGER', 'ADMIN', 'SUPERVISOR'])
const DEFAULT_LIMIT = 100
const MAX_LIMIT = 500

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ReplayEventsResponse | { error: string }>
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
      startTime,
      endTime,
      cursor,
      limit: limitStr,
      orderId,
      tableId,
      stationId,
      waiterId,
      eventTypes,
      categories,
    } = req.query

    // Validate required parameters
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

    // Build filters
    const filters: ReplayFilters = {}
    if (orderId) filters.orderId = orderId as string
    if (tableId) filters.tableId = tableId as string
    if (stationId) filters.stationId = stationId as string
    if (waiterId) filters.waiterId = waiterId as string
    if (eventTypes) {
      filters.eventTypes = (eventTypes as string).split(',') as ReplayEventType[]
    }
    if (categories) {
      filters.categories = (categories as string).split(',') as ReplayEventCategory[]
    }

    // Build Prisma where clause
    const where: any = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      sale: {
        businessId,
      },
    }

    // Apply filters
    if (filters.orderId) {
      where.saleId = filters.orderId
    }
    if (filters.stationId) {
      where.stationId = filters.stationId
    }
    if (filters.eventTypes && filters.eventTypes.length > 0) {
      where.eventType = { in: filters.eventTypes }
    }

    // Handle cursor-based pagination
    if (cursor) {
      where.id = { gt: cursor }
    }

    // Fetch events with relations
    const ticketEvents = await prisma.ticketEvent.findMany({
      where,
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
      take: limit + 1, // Fetch one extra to check if there are more
    })

    // Check if there are more results
    const hasMore = ticketEvents.length > limit
    const eventsToReturn = hasMore ? ticketEvents.slice(0, limit) : ticketEvents

    // Transform to ReplayEvent format
    const replayEvents = transformTicketEvents(eventsToReturn)

    // Apply additional filters that couldn't be done at DB level
    let filteredEvents = replayEvents
    
    if (filters.tableId) {
      filteredEvents = filteredEvents.filter(e => e.tableId === filters.tableId)
    }
    if (filters.waiterId) {
      filteredEvents = filteredEvents.filter(e => e.waiterId === filters.waiterId)
    }
    if (filters.categories && filters.categories.length > 0) {
      filteredEvents = filteredEvents.filter(e => filters.categories!.includes(e.category))
    }

    // Get total count for the time range
    const totalCount = await prisma.ticketEvent.count({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        sale: {
          businessId,
        },
      },
    })

    // Calculate statistics at the end of the returned events
    const statistics = calculateStatistics(
      filteredEvents,
      filteredEvents.length - 1,
      filteredEvents[filteredEvents.length - 1]?.timestamp
    )

    // Determine next cursor
    const nextCursor = hasMore ? eventsToReturn[eventsToReturn.length - 1].id : undefined

    const response: ReplayEventsResponse = {
      events: filteredEvents,
      totalCount,
      hasMore,
      nextCursor,
      statistics,
    }

    return res.status(200).json(response)
  } catch (error) {
    console.error('[ServiceReplay] Events API error:', error)
    return res.status(500).json({ error: 'Failed to fetch replay events' })
  }
}
