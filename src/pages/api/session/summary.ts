/**
 * Session Summary API
 * Get group order summary for a table session
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sessionId } = req.query;

    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    const session = await prisma.tableSession.findUnique({
      where: { id: sessionId },
      include: {
        table: {
          select: { number: true },
        },
        participants: {
          include: {
            orders: {
              where: {
                status: { not: 'CANCELLED' },
              },
              include: {
                items: {
                  include: {
                    menuItem: {
                      select: { name: true },
                    },
                  },
                },
              },
            },
          },
        },
        orders: {
          where: {
            status: { not: 'CANCELLED' },
          },
          include: {
            items: {
              include: {
                menuItem: {
                  select: { name: true },
                },
              },
            },
            participant: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Calculate totals
    const totalAmountCents = session.orders.reduce((sum, order) => sum + order.totalAmountCents, 0);
    const totalOrders = session.orders.length;
    const participantCount = session.participants.length;

    // Group orders by participant
    const ordersByParticipant = session.participants.map(participant => ({
      participantId: participant.id,
      participantName: participant.name,
      orders: participant.orders.map(order => ({
        orderId: order.id,
        orderNumber: order.orderNumber,
        totalAmountCents: order.totalAmountCents,
        kitchenStatus: order.kitchenStatus,
        items: order.items.map(item => ({
          name: item.menuItem.name,
          quantity: item.quantity,
          priceCents: item.unitPriceCents,
        })),
      })),
      totalSpent: participant.orders.reduce((sum, order) => sum + order.totalAmountCents, 0),
    }));

    return res.status(200).json({
      sessionId: session.id,
      tableNumber: session.table.number,
      status: session.status,
      participantCount,
      totalOrders,
      totalAmountCents,
      ordersByParticipant,
      allOrders: session.orders.map(order => ({
        orderId: order.id,
        orderNumber: order.orderNumber,
        participantName: order.participant?.name || 'Unknown',
        totalAmountCents: order.totalAmountCents,
        kitchenStatus: order.kitchenStatus,
        createdAt: order.createdAt,
        items: order.items.map(item => ({
          name: item.menuItem.name,
          quantity: item.quantity,
          priceCents: item.unitPriceCents,
        })),
      })),
    });
  } catch (error) {
    console.error('Error getting session summary:', error);
    return res.status(500).json({ error: 'Failed to get session summary' });
  }
}
