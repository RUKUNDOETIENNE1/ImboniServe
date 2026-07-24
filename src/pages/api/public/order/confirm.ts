import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { ingestDeliveryShadowEvent } from '@/lib/die/business-as-plugin/delivery/delivery.shadow'
import {
  publishHeartPulseEvent,
  HeartPulseEventType,
  HeartPulseChannel,
  generateCorrelationId,
  type OrderCreatedPayload,
} from '@/lib/heart-pulse'
import { TicketEventService } from '@/lib/services/ticket-event.service'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { orderId, confirmed } = req.body

    if (!orderId || typeof confirmed !== 'boolean') {
      return res.status(400).json({ error: 'Order ID and confirmation status required' })
    }

    const sale = await prisma.sale.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        customerConfirmedAt: true
      }
    })

    if (!sale) {
      return res.status(404).json({ error: 'Order not found' })
    }

    if (sale.customerConfirmedAt) {
      return res.status(400).json({ error: 'Order already confirmed' })
    }

    if (!confirmed) {
      await prisma.sale.update({
        where: { id: orderId },
        data: { status: 'CANCELLED' }
      })

      // Shadow: mark delivery cancelled (read-only)
      try {
        const o = await prisma.sale.findUnique({ where: { id: orderId }, select: { businessId: true, orderNumber: true } })
        if (o?.businessId) {
          ingestDeliveryShadowEvent({
            type: 'DELIVERY_CANCELLED',
            businessId: o.businessId,
            orderId,
            orderNumber: o.orderNumber || undefined,
          }).catch(() => {})
        }
      } catch {}

      return res.status(200).json({
        message: 'Order cancelled',
        orderId
      })
    }

    const updated = await prisma.sale.update({
      where: { id: orderId },
      data: {
        customerConfirmedAt: new Date(),
        status: 'ACTIVE'
      },
      include: {
        items: {
          include: {
            menuItem: {
              select: {
                name: true
              }
            }
          }
        },
        table: true,
        participant: true
      }
    })

    // Generate correlation ID for this order workflow
    const correlationId = generateCorrelationId()

    // Publish Heart Pulse ORDER_CREATED event
    try {
      const payload: OrderCreatedPayload = {
        orderId: updated.id,
        orderNumber: updated.orderNumber,
        orderSource: updated.orderSource || 'UNKNOWN',
        tableNumber: updated.table?.number ?? undefined,
        participantName: updated.participant?.name ?? undefined,
        items: updated.items.map(item => ({
          menuItemName: item.menuItem.name,
          quantity: item.quantity,
          unitPriceCents: item.unitPriceCents,
          notes: typeof item.instructions === 'string' ? item.instructions : undefined,
          instructionTags: item.instructionTags.length > 0 ? item.instructionTags : undefined,
        })),
        scheduledAt: updated.scheduledAt?.toISOString(),
      }

      // Notify business-wide channel
      await publishHeartPulseEvent(
        HeartPulseChannel.business(updated.businessId),
        HeartPulseEventType.ORDER_CREATED,
        updated.businessId,
        payload,
        {
          correlationId,
          actor: { source: 'api' },
        }
      )

      // Notify kitchen channel
      await publishHeartPulseEvent(
        HeartPulseChannel.kitchen(updated.businessId),
        HeartPulseEventType.ORDER_CREATED,
        updated.businessId,
        payload,
        {
          correlationId,
          actor: { source: 'api' },
        }
      )

      // Notify order-specific channel (for customer tracking)
      await publishHeartPulseEvent(
        HeartPulseChannel.order(updated.id),
        HeartPulseEventType.ORDER_CREATED,
        updated.businessId,
        payload,
        {
          correlationId,
          actor: { source: 'api' },
        }
      )
    } catch (eventError) {
      console.error('[HeartPulse] Failed to publish ORDER_CREATED:', eventError)
    }

    // Record TicketEvent for Service Replay
    TicketEventService.recordEvent({
      saleId: updated.id,
      eventType: 'ORDER_CREATED',
      previousState: 'DRAFT',
      newState: 'ACTIVE',
      metadata: {
        orderNumber: updated.orderNumber,
        orderSource: updated.orderSource,
        itemCount: updated.items.length,
        correlationId,
      },
    }).catch((err) => console.error('[TicketEvent] Failed to record ORDER_CREATED:', err))

    // Shadow: delivery created signal for remote-type flows can be inferred later; emit generic created signal here
    try {
      ingestDeliveryShadowEvent({
        type: 'DELIVERY_CREATED',
        businessId: updated.businessId,
        orderId,
        orderNumber: updated.orderNumber || undefined,
      }).catch(() => {})
    } catch {}

    return res.status(200).json({
      message: 'Order confirmed and sent to kitchen',
      order: {
        id: updated.id,
        orderNumber: updated.orderNumber,
        status: updated.status,
        confirmedAt: updated.customerConfirmedAt,
        items: updated.items.map(item => ({
          name: item.menuItem.name,
          quantity: item.quantity
        }))
      }
    })
  } catch (error) {
    console.error('Order confirmation error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
