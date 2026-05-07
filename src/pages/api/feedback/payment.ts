import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const feedbackSchema = z.object({
  orderId: z.string().cuid(),
  orderNumber: z.string(),
  paymentMethod: z.string(),
  rating: z.enum(['positive', 'negative']),
  stars: z.number().min(0).max(5).optional(),
  issues: z.array(z.string()).optional(),
  comment: z.string().optional()
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const data = feedbackSchema.parse(req.body)

    // Get order to validate it exists and get business
    const order = await prisma.sale.findUnique({
      where: { id: data.orderId },
      select: { businessId: true }
    })

    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }

    // Log feedback into ActivityLog (store payload as JSON string in details)
    const payload = {
      type: 'PAYMENT_FEEDBACK',
      orderId: data.orderId,
      orderNumber: data.orderNumber,
      paymentMethod: data.paymentMethod,
      rating: data.rating,
      stars: data.stars ?? null,
      issues: data.issues ?? [],
      comment: data.comment ?? null
    }

    const log = await prisma.activityLog.create({
      data: {
        businessId: order.businessId,
        actorId: null,
        action: 'PAYMENT_FEEDBACK',
        details: JSON.stringify(payload)
      }
    })

    return res.status(201).json({
      success: true,
      feedbackId: log.id
    })

  } catch (error: any) {
    console.error('[Payment Feedback] Error:', error)
    
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid feedback data', details: error.errors })
    }

    return res.status(500).json({ error: 'Failed to save feedback' })
  }
}
