import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/middleware/permission.middleware'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' })
  }
 
  try {
    const session = await getServerSession(req, res, authOptions)
    if (!session?.user?.email) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, businessId: true, roles: true },
    })

    if (!user || !user.businessId) {
      return res.status(400).json({ error: 'No business associated', code: 'NO_BUSINESS' })
    }

    // Get today's date range
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Fetch today's stats
    const [todayTransactions, pendingCount, failedCount, recentPayments] = await Promise.all([
      // Today's completed transactions
      prisma.paymentTransaction.aggregate({
        where: {
          businessId: user.businessId,
          status: 'COMPLETED',
          createdAt: {
            gte: today,
            lt: tomorrow,
          },
        },
        _sum: {
          amountCents: true,
        },
        _count: true,
      }),

      // Pending transactions count
      prisma.paymentTransaction.count({
        where: {
          businessId: user.businessId,
          status: { in: ['PENDING', 'INITIATED'] },
        },
      }),

      // Failed transactions count (last 24 hours)
      prisma.paymentTransaction.count({
        where: {
          businessId: user.businessId,
          status: 'FAILED',
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      }),

      // Recent 20 transactions
      prisma.paymentTransaction.findMany({
        where: {
          businessId: user.businessId,
        },
        select: {
          id: true,
          amountCents: true,
          paymentMethod: true,
          status: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 20,
      }),
    ])

    return res.status(200).json({
      todayTotal: todayTransactions._sum.amountCents || 0,
      todayCount: todayTransactions._count || 0,
      pendingCount,
      failedCount,
      recentPayments: recentPayments.map((payment: any) => ({
        id: payment.id,
        amount: payment.amountCents,
        method: payment.paymentMethod,
        status: payment.status,
        createdAt: payment.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('Payment monitor stats error:', error)
    return res.status(500).json({ error: 'Failed to fetch payment stats' })
  }
}

export default requirePermission('reports.view')(handler)
