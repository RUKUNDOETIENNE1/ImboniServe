import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

// Public endpoint to fetch kitchen -> customer messages for an order
// GET /api/public/order/messages?orderId=...
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { orderId } = req.query as { orderId?: string }
    if (!orderId) return res.status(400).json({ error: 'orderId is required' })

    // Ensure order exists
    const order = await prisma.sale.findUnique({ where: { id: orderId }, select: { id: true } })
    if (!order) return res.status(404).json({ error: 'Order not found' })

    const messages = await prisma.waiterCall.findMany({
      where: { orderId, direction: 'kitchen_to_customer' },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        customMessage: true,
        createdAt: true,
      }
    })

    return res.status(200).json({
      messages: messages.map((m: { id: string; customMessage: string | null; createdAt: Date }) => ({
        id: m.id,
        message: m.customMessage,
        createdAt: m.createdAt
      }))
    })
  } catch (error) {
    console.error('Order messages error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
