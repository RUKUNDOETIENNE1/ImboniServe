import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { orderId, confirmed } = req.body

    if (!orderId || typeof confirmed !== 'boolean') {
      return res.status(400).json({ error: 'Order ID and confirmation status required' })
    }

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
