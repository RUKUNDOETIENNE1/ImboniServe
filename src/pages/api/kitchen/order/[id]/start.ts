import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/middleware/permission.middleware'
import { resolveBusinessContext } from '@/lib/api/business-context'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { id } = req.query
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Missing order id' })
  }

  try {
    const ctx = await resolveBusinessContext(req, res)
    if (!ctx) return
    const userBusinessId = ctx.businessId
    const userRoles: string[] = ctx.roles || []

    const sale = await prisma.sale.findUnique({ where: { id } })
    if (!sale) return res.status(404).json({ error: 'Order not found' })

    const isAdmin = userRoles.includes('ADMIN')
    if (!isAdmin && userBusinessId && sale.businessId !== userBusinessId) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    if (sale.paymentStatus !== 'PAID') {
      return res.status(409).json({ error: 'Order not paid' })
    }

    const now = new Date()
    const updated = await prisma.sale.update({
      where: { id },
      data: {
        prepStartedAt: sale.prepStartedAt ?? now,
        kitchenReleasedAt: sale.kitchenReleasedAt ?? now,
      },
      select: {
        id: true,
        orderNumber: true,
        orderSource: true,
        prepStartedAt: true,
        kitchenReleasedAt: true,
        readyAt: true,
      }
    })

    return res.status(200).json({ success: true, order: updated })
  } catch (error) {
    console.error('Kitchen start error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export default requirePermission('orders.update')(handler)
