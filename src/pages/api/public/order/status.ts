import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { formatDateTimeRW } from '@/utils/datetimeRW';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { orderId } = req.query;

    if (!orderId || typeof orderId !== 'string') {
      return res.status(400).json({ error: 'orderId is required' });
    }

    const sale = await prisma.sale.findUnique({
      where: { id: orderId },
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
        paymentTransaction: {
          select: {
            status: true,
            paymentLinkUrl: true
          }
        },
        business: {
          select: {
            name: true,
            address: true,
            phone: true
          }
        },
        table: {
          select: {
            number: true
          }
        }
      }
    });

    if (!sale) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Calculate ETA
    let eta = '15-20 minutes';
    if (sale.scheduledAt) {
      eta = formatDateTimeRW(sale.scheduledAt, 'en');
    } else if (sale.kitchenReleasedAt) {
      const elapsed = Date.now() - sale.kitchenReleasedAt.getTime();
      const remaining = Math.max(0, 1200000 - elapsed); // 20 min in ms
      eta = `${Math.ceil(remaining / 60000)} minutes`;
    }

    return res.status(200).json({
      orderId: sale.id,
      orderNumber: sale.orderNumber,
      status: sale.status,
      orderSource: sale.orderSource,
      paymentStatus: sale.paymentStatus,
      paymentLinkUrl: sale.paymentTransaction?.paymentLinkUrl,
      scheduledAt: sale.scheduledAt,
      prepStarted: !!sale.prepStartedAt,
      kitchenReleased: !!sale.kitchenReleasedAt,
      readyForPickup: !!sale.readyAt,
      eta,
      business: {
        name: sale.business.name,
        address: sale.business.address,
        phone: sale.business.phone
      },
      table: sale.table ? sale.table.number : 'Remote',
      items: sale.items.map(item => ({
        name: item.menuItem.name,
        quantity: item.quantity,
        totalCents: item.totalPriceCents
      })),
      totalAmountCents: sale.totalAmountCents,
      depositCents: sale.depositCents
    });
  } catch (error) {
    console.error('Error fetching order status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
