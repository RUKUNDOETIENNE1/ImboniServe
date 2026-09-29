import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/middleware/permission.middleware'
import { requiresFeature } from '@/lib/middleware/withFeatureCheck'
import { getBusinessDayBoundary } from '@/lib/utils/timezone'

async function baseHandler(req: NextApiRequest, res: NextApiResponse) {
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

    // Get business timezone for timezone-aware day boundary
    const business = await prisma.business.findUnique({
      where: { id: user.businessId },
      select: { timezone: true },
    })
    // Get today's date range
    const { start: today, end: todayEnd } = getBusinessDayBoundary(new Date(), business?.timezone)
    const tomorrow = new Date(todayEnd.getTime() + 1)

    // Fetch today's stats
    const [todayTransactions, pendingCount, failedCount, recentPayments] = await Promise.all([
      // Today's completed transactions
      prisma.paymentTransaction.aggregate({
        where: {
          businessId: user.businessId,
          status: 'SUCCESS',
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
          status: { in: ['PENDING', 'PROCESSING'] },
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
      todayTotal: todayTransactions._sum?.amountCents || 0,
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

// Apply commercial enforcement: Payment Monitor requires Professional plan or higher
const handler = requiresFeature('hasPaymentMonitor')(baseHandler)

export default requirePermission('reports.view')(handler)
