/**
 * Order Feedback API
 * Collects post-order feedback
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

interface FeedbackRequest {
  orderId: string;
  rating: 'positive' | 'negative';
  comment?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { orderId, rating, comment } = req.body as FeedbackRequest;

    if (!orderId || !rating) {
      return res.status(400).json({ error: 'orderId and rating are required' });
    }

    // Verify order exists
    const order = await prisma.sale.findUnique({
      where: { id: orderId },
      select: { id: true, businessId: true },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Store feedback (using AuditLog for now, could create dedicated Feedback model)
    await prisma.auditLog.create({
      data: {
        action: 'ORDER_FEEDBACK',
        entityType: 'Sale',
        entityId: orderId,
        metadata: {
          rating,
          comment: comment || null,
          businessId: order.businessId,
          timestamp: new Date().toISOString(),
        },
      },
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return res.status(500).json({ error: 'Failed to submit feedback' });
  }
}
