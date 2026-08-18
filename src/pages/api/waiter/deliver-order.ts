/**
 * Waiter Deliver Order API
 * Marks an order as delivered to customer
 * 
 * Workflow:
 * 1. Validate order has been picked up
 * 2. Update kitchen status to 'served'
 * 3. Update expo status to SERVED_CONFIRMED
 * 4. Update all items to DELIVERED
 * 5. Publish ORDER_DELIVERED event via Heart Pulse
 * 6. Complete operational workflow
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/middleware/permission.middleware'
import { resolveBusinessContext } from '@/lib/api/business-context'
import {
  publishHeartPulseEvent,
  generateCorrelationId,
  HeartPulseEventType,
  HeartPulseChannel,
  type OrderDeliveredPayload,
} from '@/lib/heart-pulse'

async function baseHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const ctx = await resolveBusinessContext(req, res)
    if (!ctx) return

    const { orderId } = req.body

    if (!orderId) {
      return res.status(400).json({ error: 'orderId is required' })
    }

    // Fetch order
    const order = await prisma.sale.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        businessId: true,
        kitchenStatus: true,
        expoStatus: true,
        table: {
          select: { number: true },
        },
        items: {
          select: { id: true, itemStatus: true },
        },
      },
    })

    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }

    // Enforce cross-business access
    const isAdmin = (ctx.roles || []).includes('ADMIN')
    if (!isAdmin && ctx.businessId && order.businessId !== ctx.businessId) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    // Validate order has been picked up (or is ready)
    if (order.kitchenStatus !== 'ready' && order.expoStatus !== 'EXPO_CONFIRMED') {
      return res.status(400).json({
        error: 'Order must be picked up before delivery',
        currentStatus: {
          kitchen: order.kitchenStatus,
          expo: order.expoStatus,
        },
      })
    }

    // Update order and items in transaction
    const now = new Date()
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Update order status
      const orderResult = await tx.sale.update({
        where: { id: orderId },
        data: {
          kitchenStatus: 'served',
          servedAt: now,
          expoStatus: 'SERVED_CONFIRMED',
          servedConfirmedAt: now,
        },
        include: {
          table: {
            select: { number: true },
          },
        },
      })

      // Update all items to DELIVERED
      await tx.saleItem.updateMany({
        where: {
          saleId: orderId,
          itemStatus: {
            not: 'DELIVERED',
          },
        },
        data: {
          itemStatus: 'DELIVERED',
          deliveredAt: now,
        },
      })

      return orderResult
    })

    // Generate correlation ID for this workflow
    const correlationId = generateCorrelationId()

    // Publish Heart Pulse event
    try {
      const payload: OrderDeliveredPayload = {
        orderId: order.id,
        orderNumber: order.orderNumber,
        deliveredBy: ctx.userId,
        deliveredAt: now.toISOString(),
        tableNumber: order.table?.number,
      }

      // Notify business-wide channel
      await publishHeartPulseEvent(
        HeartPulseChannel.business(order.businessId),
        HeartPulseEventType.ORDER_DELIVERED,
        order.businessId,
        payload,
        {
          correlationId,
          actor: { userId: ctx.userId, source: 'user' },
        }
      )

      // Notify order-specific channel (for customer view)
      await publishHeartPulseEvent(
        HeartPulseChannel.order(order.id),
        HeartPulseEventType.ORDER_DELIVERED,
        order.businessId,
        payload,
        {
          correlationId,
          actor: { userId: ctx.userId, source: 'user' },
        }
      )

      // Notify kitchen channel
      await publishHeartPulseEvent(
        HeartPulseChannel.kitchen(order.businessId),
        HeartPulseEventType.ORDER_DELIVERED,
        order.businessId,
        payload,
        {
          correlationId,
          actor: { userId: ctx.userId, source: 'user' },
        }
      )
    } catch (eventError) {
      console.error('Failed to emit delivery event:', eventError)
    }

    return res.status(200).json({
      success: true,
      order: updatedOrder,
    })
  } catch (error) {
    console.error('Error delivering order:', error)
    return res.status(500).json({ error: 'Failed to deliver order' })
  }
}

export default requirePermission('orders.update')(baseHandler)
