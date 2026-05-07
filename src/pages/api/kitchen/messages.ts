import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/middleware/permission.middleware'
import { resolveBusinessContext } from '@/lib/api/business-context'
import { triggerEvent } from '@/lib/pusher-server'

// Minimal kitchen -> customer messaging API (reuses WaiterCall)
// POST /api/kitchen/messages
// Body: { orderId: string, type?: 'PLEASE_WAIT'|'ITEM_UNAVAILABLE'|'ALMOST_READY'|'READY'|'CUSTOM', message?: string }
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const ctx = await resolveBusinessContext(req, res)
    if (!ctx) return

    const { orderId, type, message } = req.body as { orderId?: string; type?: string; message?: string }

    if (!orderId) {
      return res.status(400).json({ error: 'orderId is required' })
    }

    // Load order and validate access
    const order = await prisma.sale.findUnique({ where: { id: orderId } })
    if (!order) return res.status(404).json({ error: 'Order not found' })

    const isAdmin = (ctx.roles || []).includes('ADMIN')
    if (!isAdmin && ctx.businessId && order.businessId !== ctx.businessId) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    // Render message text
    const templates: Record<string, (o: any) => string> = {
      PLEASE_WAIT: () => 'Your order is being prepared. Please wait a few more minutes.',
      ITEM_UNAVAILABLE: () => 'One of your items is currently unavailable. Please contact the waiter for alternatives.',
      ALMOST_READY: () => 'Good news! Your order is almost ready.',
      READY: () => 'Your order is ready. A waiter will serve you shortly.',
      CUSTOM: () => (message || '').slice(0, 300)
    }

    const key = (type || 'CUSTOM').toUpperCase()
    const text = (templates[key] || templates.CUSTOM)(order)
    if (!text) return res.status(400).json({ error: 'Message is required' })

    // Persist as WaiterCall (direction = kitchen_to_customer)
    const call = await prisma.waiterCall.create({
      data: {
        tableId: order.tableId || '',
        sessionId: order.tableSessionId || null,
        businessId: order.businessId,
        reason: 'other',
        customMessage: text,
        status: 'pending',
        priority: 1,
        orderId: order.id,
        direction: 'kitchen_to_customer'
      }
    })

    // Notify customer UI via order channel
    try {
      await triggerEvent(`private-order-${order.id}`, 'kitchen.message', {
        orderId: order.id,
        sessionId: order.tableSessionId,
        tableId: order.tableId,
        message: text,
        createdAt: call.createdAt.toISOString()
      })
    } catch (e) {
      // non-fatal
      console.warn('Failed to trigger kitchen.message event', e)
    }

    return res.status(201).json({ success: true, id: call.id })
  } catch (error) {
    console.error('Kitchen message error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export default requirePermission('orders.update')(handler)
