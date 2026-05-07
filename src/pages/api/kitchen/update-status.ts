/**
 * Kitchen Order Status Update API
 * Updates order status from kitchen dashboard
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/middleware/permission.middleware';
import { resolveBusinessContext } from '@/lib/api/business-context';
import { triggerEvent } from '@/lib/pusher-server';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const ctx = await resolveBusinessContext(req, res);
    if (!ctx) return;
    const { orderId, newStatus } = req.body;

    if (!orderId || !newStatus) {
      return res.status(400).json({ error: 'orderId and newStatus are required' });
    }

    const validStatuses = ['pending', 'accepted', 'preparing', 'almost_ready', 'ready', 'served'];
    if (!validStatuses.includes(newStatus)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Get current order
    const order = await prisma.sale.findUnique({
      where: { id: orderId },
      select: { id: true, kitchenStatus: true, businessId: true },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Enforce cross-business access
    const isAdmin = (ctx.roles || []).includes('ADMIN');
    if (!isAdmin && ctx.businessId && order.businessId !== ctx.businessId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Enforce valid status transitions (no skipping steps)
    const allowedTransitions: Record<string, string[]> = {
      'pending':      ['accepted', 'preparing'],
      'accepted':     ['preparing'],
      'preparing':    ['almost_ready', 'ready'],
      'almost_ready': ['ready'],
      'ready':        ['served'],
      'served':       [],
    };

    const currentStatus = order.kitchenStatus || 'pending';
    const allowed = allowedTransitions[currentStatus] || [];
    if (!allowed.includes(newStatus)) {
      return res.status(400).json({
        error: `Cannot transition from "${currentStatus}" to "${newStatus}". Allowed: ${allowed.join(', ') || 'none'}`,
      });
    }

    // Prepare update data with timestamps
    const updateData: any = {
      kitchenStatus: newStatus,
    };

    const now = new Date();

    // Set appropriate timestamps based on status
    switch (newStatus) {
      case 'accepted':
        updateData.acceptedAt = now;
        break;
      case 'preparing':
        updateData.preparingAt = now;
        if (currentStatus === 'pending') {
          updateData.acceptedAt = now; // Auto-accept if moving from pending
        }
        break;
      case 'almost_ready':
        updateData.almostReadyAt = now;
        break;
      case 'ready':
        updateData.readyAt = now;
        break;
      case 'served':
        updateData.servedAt = now;
        break;
    }

    // Update order
    const updatedOrder = await prisma.sale.update({
      where: { id: orderId },
      data: updateData,
      include: {
        items: {
          include: {
            menuItem: {
              select: { name: true },
            },
          },
        },
        table: {
          select: { number: true },
        },
        participant: {
          select: { name: true },
        },
      },
    });

    // Emit real-time events (single emit, no duplicates)
    try {
      const businessId = updatedOrder.businessId;

      // Notify kitchen dashboard
      await triggerEvent(`private-kitchen-${businessId}`, 'order.updated', {
        orderId: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        kitchenStatus: newStatus,
        tableNumber: updatedOrder.table?.number,
        participantName: updatedOrder.participant?.name,
      });

      // Notify customer UI via order-specific channel
      await triggerEvent(`private-order-${updatedOrder.id}`, 'status.changed', {
        kitchenStatus: newStatus,
        timestamp: now.toISOString(),
      });
    } catch (eventError) {
      console.error('Failed to emit status update event:', eventError);
    }

    return res.status(200).json({
      success: true,
      order: updatedOrder,
    });
  } catch (error) {
    console.error('Error updating kitchen status:', error);
    return res.status(500).json({ error: 'Failed to update status' });
  }
}

export default requirePermission('orders.update')(handler);
