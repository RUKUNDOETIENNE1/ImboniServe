import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

import { requirePermission } from '@/lib/middleware/permission.middleware'
import { resolveBusinessContext } from '@/lib/api/business-context'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { branchId } = req.query as { branchId?: string }
    const ctx = await resolveBusinessContext(req, res)
    if (!ctx) return
    const { businessId: userBusinessId, roles: userRoles } = ctx

    const now = new Date()
    const start = new Date(now)
    start.setHours(0, 0, 0, 0)

    const where: any = {
      createdAt: { gte: start },
      status: { not: 'CANCELLED' },
    }

    const isAdmin = userRoles.includes('ADMIN')

    if (branchId) {
      if (!isAdmin && userBusinessId && branchId !== userBusinessId) {
        return res.status(403).json({ error: 'Forbidden' })
      }
      where.businessId = branchId
    } else if (userBusinessId) {
      where.businessId = userBusinessId
    }

    const orders = await prisma.sale.findMany({
      where,
      include: {
        items: { include: { menuItem: true } },
        business: { select: { id: true, name: true } },
        table: { select: { id: true, number: true } },
        tableSession: {
          select: {
            id: true,
            participants: {
              select: { id: true, name: true },
            },
          },
        },
        participant: {
          select: { id: true, name: true },
        },
      },
      orderBy: [
        { createdAt: 'asc' },
      ],
    })

    // Group by kitchen status
    const grouped = {
      pending: orders.filter(o => o.kitchenStatus === 'pending'),
      accepted: orders.filter(o => o.kitchenStatus === 'accepted'),
      preparing: orders.filter(o => o.kitchenStatus === 'preparing'),
      almost_ready: orders.filter(o => o.kitchenStatus === 'almost_ready'),
      ready: orders.filter(o => o.kitchenStatus === 'ready'),
      served: orders.filter(o => o.kitchenStatus === 'served'),
    }

    return res.status(200).json({ orders, grouped })
  } catch (error) {
    console.error('Kitchen orders error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export default requirePermission('orders.read')(handler)
