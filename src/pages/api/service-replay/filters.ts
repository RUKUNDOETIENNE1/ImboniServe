/**
 * Service Replay™ - Filters API
 * 
 * Returns available filter options for a time range.
 * Provides lists of orders, tables, waiters, stations, etc.
 * 
 * GET /api/service-replay/filters
 * 
 * Query Parameters:
 * - startTime: ISO timestamp (required)
 * - endTime: ISO timestamp (required)
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { resolveBusinessContext } from '@/lib/api/business-context'

const ALLOWED_ROLES = new Set(['OWNER', 'MANAGER', 'ADMIN', 'SUPERVISOR'])

interface FilterOption {
  id: string
  label: string
  count?: number
}

interface FiltersResponse {
  orders: FilterOption[]
  tables: FilterOption[]
  waiters: FilterOption[]
  stations: FilterOption[]
  eventTypes: FilterOption[]
  timeRange: {
    start: string
    end: string
    totalEvents: number
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<FiltersResponse | { error: string }>
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
    const { startTime, endTime } = req.query

    if (!startTime || !endTime) {
      return res.status(400).json({ error: 'startTime and endTime are required' })
    }

    const startDate = new Date(startTime as string)
    const endDate = new Date(endTime as string)

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' })
    }

    // Get orders with events in the time range
    const ordersWithEvents = await prisma.sale.findMany({
      where: {
        businessId,
        ticketEvents: {
          some: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        },
      },
      select: {
        id: true,
        orderNumber: true,
        _count: {
          select: {
            ticketEvents: {
              where: {
                createdAt: {
                  gte: startDate,
                  lte: endDate,
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    })

    const orders: FilterOption[] = ordersWithEvents.map(o => ({
      id: o.id,
      label: `#${o.orderNumber}`,
      count: o._count.ticketEvents,
    }))

    // Get tables with events in the time range
    const tablesWithEvents = await prisma.table.findMany({
      where: {
        businessId,
        sales: {
          some: {
            ticketEvents: {
              some: {
                createdAt: {
                  gte: startDate,
                  lte: endDate,
                },
              },
            },
          },
        },
      },
      select: {
        id: true,
        number: true,
      },
      orderBy: {
        number: 'asc',
      },
    })

    const tables: FilterOption[] = tablesWithEvents.map(t => ({
      id: t.id,
      label: `Table ${t.number}`,
    }))

    // Get waiters who have events in the time range
    const waitersWithEvents = await prisma.user.findMany({
      where: {
        businessId,
        OR: [
          {
            assignedTables: {
              some: {
                sales: {
                  some: {
                    ticketEvents: {
                      some: {
                        createdAt: {
                          gte: startDate,
                          lte: endDate,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          {
            ticketEvents: {
              some: {
                createdAt: {
                  gte: startDate,
                  lte: endDate,
                },
              },
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    })

    const waiters: FilterOption[] = waitersWithEvents.map(w => ({
      id: w.id,
      label: w.name,
    }))

    // Get stations with events in the time range
    const stationsWithEvents = await prisma.station.findMany({
      where: {
        businessId,
        ticketEvents: {
          some: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
        code: true,
        _count: {
          select: {
            ticketEvents: {
              where: {
                createdAt: {
                  gte: startDate,
                  lte: endDate,
                },
              },
            },
          },
        },
      },
      orderBy: {
        displayOrder: 'asc',
      },
    })

    const stations: FilterOption[] = stationsWithEvents.map(s => ({
      id: s.id,
      label: s.name,
      count: s._count.ticketEvents,
    }))

    // Get event type counts
    const eventTypeCounts = await prisma.ticketEvent.groupBy({
      by: ['eventType'],
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        sale: {
          businessId,
        },
      },
      _count: {
        eventType: true,
      },
      orderBy: {
        _count: {
          eventType: 'desc',
        },
      },
    })

    const eventTypes: FilterOption[] = eventTypeCounts.map(e => ({
      id: e.eventType,
      label: e.eventType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase()),
      count: e._count.eventType,
    }))

    // Get total event count
    const totalEvents = await prisma.ticketEvent.count({
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

    const response: FiltersResponse = {
      orders,
      tables,
      waiters,
      stations,
      eventTypes,
      timeRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        totalEvents,
      },
    }

    return res.status(200).json(response)
  } catch (error) {
    console.error('[ServiceReplay] Filters API error:', error)
    return res.status(500).json({ error: 'Failed to fetch filter options' })
  }
}
