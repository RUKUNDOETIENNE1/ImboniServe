import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const session = await getServerSession(req, res, authOptions)
  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const businessId = (session.user as any).businessId
  if (!businessId) {
    return res.status(400).json({ error: 'Business ID required' })
  }

  try {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterdayStart = new Date(todayStart)
    yesterdayStart.setDate(yesterdayStart.getDate() - 1)

    // Today's revenue (only completed/paid sales)
    const todaySales = await prisma.sale.aggregate({
      where: {
        businessId,
        createdAt: { gte: todayStart },
        paymentStatus: 'COMPLETED'
      },
      _sum: { totalAmountCents: true },
      _count: true
    })

    // Yesterday's revenue for comparison
    const yesterdaySales = await prisma.sale.aggregate({
      where: {
        businessId,
        createdAt: { gte: yesterdayStart, lt: todayStart },
        paymentStatus: 'COMPLETED'
      },
      _sum: { totalAmountCents: true }
    })

    // Active orders (pending, preparing, ready) based on kitchen status
    const activeOrders = await prisma.sale.count({
      where: {
        businessId,
        kitchenStatus: { in: ['pending', 'preparing', 'ready'] }
      }
    })

    // Unique customers today
    const customersToday = await prisma.sale.findMany({
      where: {
        businessId,
        createdAt: { gte: todayStart }
      },
      distinct: ['customerId'],
      select: { customerId: true }
    })

    // Unique customers yesterday
    const customersYesterday = await prisma.sale.findMany({
      where: {
        businessId,
        createdAt: { gte: yesterdayStart, lt: todayStart }
      },
      distinct: ['customerId'],
      select: { customerId: true }
    })

    const todayRevenue = ((todaySales._sum.totalAmountCents ?? 0) as number) / 100
    const yesterdayRevenue = ((yesterdaySales._sum.totalAmountCents ?? 0) as number) / 100
    const revenueChange = yesterdayRevenue > 0 
      ? Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100)
      : 0

    const customerChange = customersYesterday.length > 0
      ? Math.round(((customersToday.length - customersYesterday.length) / customersYesterday.length) * 100)
      : 0

    const avgOrderValue = todaySales._count > 0
      ? Math.round(todayRevenue / todaySales._count)
      : 0

    return res.status(200).json({
      todayRevenue: Math.round(todayRevenue),
      revenueChange,
      activeOrders,
      customersToday: customersToday.length,
      customerChange,
      avgOrderValue
    })
  } catch (error: any) {
    console.error('Live metrics error:', error)
    return res.status(500).json({ error: 'Failed to fetch live metrics' })
  }
}
