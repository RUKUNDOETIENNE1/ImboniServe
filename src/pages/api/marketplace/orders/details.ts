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

    const { ids } = req.query

    if (!ids || typeof ids !== 'string') {
      return res.status(400).json({ error: 'Order IDs required' })
    }

    const orderIds = ids.split(',')
    const isAdmin = (ctx.roles || []).includes('ADMIN')

    const orders = await prisma.supplierOrder.findMany({
      where: {
        id: { in: orderIds },
        ...(isAdmin ? {} : { businessId: ctx.businessId }),
      },
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
      }
    })

    return res.status(200).json({ orders })
  } catch (error) {
    console.error('Order details API error:', error)
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    })
  }
}

export default requirePermission('orders.read')(handler)
