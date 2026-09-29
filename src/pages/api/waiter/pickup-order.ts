/**
 * Waiter Pickup Order API
 * Marks an order as picked up by waiter
 * 
 * Workflow:
 * 1. Validate order is ready for pickup
 * 2. Update expo status to EXPO_CONFIRMED
 * 3. Publish ORDER_PICKED_UP event via Heart Pulse
 * 4. Notify all connected interfaces
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
  type OrderPickedUpPayload,
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

    // Validate order is ready for pickup
    if (order.kitchenStatus !== 'ready') {
      return res.status(400).json({
        error: 'Order is not ready for pickup',
        currentStatus: order.kitchenStatus,
      })
    }

    // Update order status
    const now = new Date()
    const updatedOrder = await prisma.sale.update({
      where: { id: orderId },
      data: {
        expoStatus: 'EXPO_CONFIRMED',
        expoConfirmedAt: now,
      },
    })

    // Generate correlation ID for this workflow
    const correlationId = generateCorrelationId()

    // Publish Heart Pulse event
    try {
      const payload: OrderPickedUpPayload = {
        orderId: order.id,
        orderNumber: order.orderNumber,
        pickedUpBy: ctx.userId,
        pickedUpAt: now.toISOString(),
      }

      // Notify business-wide channel
      await publishHeartPulseEvent(
        HeartPulseChannel.business(order.businessId),
        HeartPulseEventType.ORDER_PICKED_UP,
        order.businessId,
        payload,
        {
          correlationId,
          actor: { userId: ctx.userId, source: 'user' },
        }
      )

      // Notify order-specific channel
      await publishHeartPulseEvent(
        HeartPulseChannel.order(order.id),
        HeartPulseEventType.ORDER_PICKED_UP,
        order.businessId,
        payload,
        {
          correlationId,
          actor: { userId: ctx.userId, source: 'user' },
        }
      )
    } catch (eventError) {
      console.error('Failed to emit pickup event:', eventError)
    }

    return res.status(200).json({
      success: true,
      order: updatedOrder,
    })
  } catch (error) {
    console.error('Error picking up order:', error)
    return res.status(500).json({ error: 'Failed to pickup order' })
  }
}

export default requirePermission('orders.update')(baseHandler)
