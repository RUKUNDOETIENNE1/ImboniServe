import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ingestDeliveryShadowEvent } from '@/lib/die/business-as-plugin/delivery/delivery.shadow'
import { withRateLimit } from '@/lib/middleware/withRateLimit'
import { withCsrf } from '@/lib/middleware/csrf'
import { KitchenDispatchService } from '@/lib/services/kitchen-dispatch.service'

const confirmOrderSchema = z.object({
  orderId: z.string().min(1).max(100),
  confirmed: z.boolean(),
})

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const parseResult = confirmOrderSchema.safeParse(req.body)
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Invalid request', details: parseResult.error.flatten() })
    }

    const { orderId, confirmed } = parseResult.data

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
        }
      }
    })

    // Shadow: delivery created signal for remote-type flows can be inferred later; emit generic created signal here
    try {
      ingestDeliveryShadowEvent({
        type: 'DELIVERY_CREATED',
        businessId: (await prisma.sale.findUnique({ where: { id: orderId }, select: { businessId: true } }))?.businessId || '',
        orderId,
        orderNumber: updated.orderNumber || undefined,
      }).catch(() => {})
    } catch {}

    // Dispatch order to kitchen — routes items to stations, emits real-time Pusher event,
    // records TicketEvent audit trail, and shadows KDS. This makes the "sent to kitchen"
    // message truthful and ensures the kitchen receives real-time notification.
    try {
      const saleForDispatch = await prisma.sale.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          businessId: true,
          orderNumber: true,
          orderSource: true,
          tableId: true,
          customerPhone: true,
          customerName: true,
          scheduledAt: true,
          table: { select: { number: true } },
          participant: { select: { name: true } },
          items: {
            include: {
              menuItem: { select: { name: true } },
            },
          },
        },
      })

      if (saleForDispatch) {
        await KitchenDispatchService.dispatchToKitchen({
          saleId: saleForDispatch.id,
          businessId: saleForDispatch.businessId,
          orderNumber: saleForDispatch.orderNumber || orderId,
          orderSource: saleForDispatch.orderSource || 'QR_IN_VENUE',
          tableId: saleForDispatch.tableId || undefined,
          tableNumber: saleForDispatch.table?.number,
          participantName: saleForDispatch.participant?.name || undefined,
          items: saleForDispatch.items.map(item => ({
            menuItemName: item.menuItem.name,
            quantity: item.quantity,
            unitPriceCents: item.unitPriceCents,
          })),
          scheduledAt: saleForDispatch.scheduledAt || undefined,
          customerPhone: saleForDispatch.customerPhone || undefined,
          customerName: saleForDispatch.customerName || undefined,
        })
      }
    } catch (dispatchError) {
      // Dispatch failure is non-critical — kitchen display polls every 5-15s as fallback.
      // Log so operations team can investigate, but don't fail the confirmation.
      console.error('[Order Confirm] Kitchen dispatch failed (kitchen display will poll):', dispatchError)
    }

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

export default withCsrf(withRateLimit(handler, {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 20, // 20 confirmations per minute per IP
}))
