/**
 * Service Replay™ - Event Detail API
 * 
 * Retrieves full details for a single event.
 * 
 * GET /api/service-replay/event/[id]
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { resolveBusinessContext } from '@/lib/api/business-context'
import { transformTicketEvent } from '@/lib/service-replay/transformer'
import type { ReplayEvent } from '@/lib/service-replay/types'

const ALLOWED_ROLES = new Set(['OWNER', 'MANAGER', 'ADMIN', 'SUPERVISOR'])

interface EventDetailResponse {
  event: ReplayEvent
  relatedEvents: ReplayEvent[]
  orderDetails?: {
    id: string
    orderNumber: string
    status: string
    kitchenStatus: string | null
    totalAmountCents: number
    paymentStatus: string
    paymentMethod: string
    createdAt: string
    items: Array<{
      id: string
      name: string
      quantity: number
      status: string | null
    }>
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<EventDetailResponse | { error: string }>
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

    const { id } = req.query

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Event ID is required' })
    }

    // Fetch the event with full relations
    const ticketEvent = await prisma.ticketEvent.findUnique({
      where: { id },
      include: {
        sale: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            kitchenStatus: true,
            totalAmountCents: true,
            paymentStatus: true,
            paymentMethod: true,
            createdAt: true,
            businessId: true,
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
            items: {
              select: {
                id: true,
                quantity: true,
                itemStatus: true,
                menuItem: {
                  select: {
                    name: true,
                  },
                },
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
    })

    if (!ticketEvent) {
      return res.status(404).json({ error: 'Event not found' })
    }

    // Verify business access
    if (ticketEvent.sale?.businessId !== businessId) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // Transform to ReplayEvent
    const event = transformTicketEvent(ticketEvent)

    // Fetch related events (same order, within 1 hour)
    const eventTime = ticketEvent.createdAt
    const windowStart = new Date(eventTime.getTime() - 30 * 60 * 1000) // 30 min before
    const windowEnd = new Date(eventTime.getTime() + 30 * 60 * 1000) // 30 min after

    const relatedTicketEvents = await prisma.ticketEvent.findMany({
      where: {
        saleId: ticketEvent.saleId,
        id: { not: id },
        createdAt: {
          gte: windowStart,
          lte: windowEnd,
        },
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
      take: 20,
    })

    const relatedEvents = relatedTicketEvents.map(e => transformTicketEvent(e))

    // Build order details if available
    let orderDetails: EventDetailResponse['orderDetails'] = undefined
    if (ticketEvent.sale) {
      const sale = ticketEvent.sale
      orderDetails = {
        id: sale.id,
        orderNumber: sale.orderNumber,
        status: sale.status,
        kitchenStatus: sale.kitchenStatus,
        totalAmountCents: sale.totalAmountCents,
        paymentStatus: sale.paymentStatus,
        paymentMethod: sale.paymentMethod,
        createdAt: sale.createdAt.toISOString(),
        items: sale.items.map(item => ({
          id: item.id,
          name: item.menuItem?.name || 'Unknown Item',
          quantity: item.quantity,
          status: item.itemStatus,
        })),
      }
    }

    const response: EventDetailResponse = {
      event,
      relatedEvents,
      orderDetails,
    }

    return res.status(200).json(response)
  } catch (error) {
    console.error('[ServiceReplay] Event Detail API error:', error)
    return res.status(500).json({ error: 'Failed to fetch event details' })
  }
}
