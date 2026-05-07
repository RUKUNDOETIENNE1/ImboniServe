import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/middleware/permission.middleware'
import { resolveBusinessContext } from '@/lib/api/business-context'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const ctx = await resolveBusinessContext(req, res)
  if (!ctx) return

  const { businessId } = ctx

  try {
    if (req.method === 'GET') {
      const { status, limit = '50', page = '1' } = req.query
      const limitInt = Math.min(parseInt(limit as string, 10) || 50, 200)
      const pageInt = Math.max(parseInt(page as string, 10) || 1, 1)
      const skip = (pageInt - 1) * limitInt

      const where: any = { businessId }
      if (status && status !== 'all') {
        where.paymentStatus = status.toString().toUpperCase()
      }

      const [transactions, total] = await Promise.all([
        prisma.sale.findMany({
          where,
          include: {
            user: { select: { name: true } },
            customer: { select: { name: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: limitInt,
          skip,
        }),
        prisma.sale.count({ where }),
      ])

      const formatted = transactions.map(t => ({
        id: t.orderNumber,
        date: t.createdAt.toISOString(),
        type: 'sale',
        method: t.paymentMethod,
        amount: t.totalAmountCents / 100,
        status: t.paymentStatus.toLowerCase(),
        customer: t.customer?.name || 'Walk-in Customer',
        reference: t.paymentReference
      }))

      return res.status(200).json({
        transactions: formatted,
        pagination: { page: pageInt, limit: limitInt, total, pages: Math.ceil(total / limitInt) },
      })
    }

    return res.status(405).json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' })
  } catch (error) {
    console.error('Transactions API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export default requirePermission('payments.read')(handler)
