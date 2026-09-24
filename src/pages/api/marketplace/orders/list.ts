import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/middleware/permission.middleware'
import { resolveBusinessContext } from '@/lib/api/business-context'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const ctx = await resolveBusinessContext(req, res)
    if (!ctx) return

    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    const orders = await prisma.supplierOrder.findMany({
      where: { businessId: ctx.businessId },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        },
        items: {
          select: {
            id: true,
            productId: true,
            quantity: true,
            unitPriceCents: true,
            totalPriceCents: true,
            product: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    })

    return res.status(200).json({ orders })
  } catch (error) {
    console.error('Order list API error:', error)
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    })
  }
}

export default requirePermission('orders.read')(handler)
