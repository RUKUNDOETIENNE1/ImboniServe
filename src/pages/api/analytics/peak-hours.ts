import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { successResponse, unauthorizedResponse } from '@/lib/api/response-helpers'
import { withErrorHandler } from '@/lib/middleware/error-handler.middleware'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  const businessId = (session?.user as any)?.businessId

  if (!session?.user || !businessId) {
    return res.status(401).json(unauthorizedResponse())
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { period = '7d' } = req.query

  const now = new Date()
  let startDate = new Date()
  
  if (period === '7d') {
    startDate.setDate(now.getDate() - 7)
  } else if (period === '30d') {
    startDate.setDate(now.getDate() - 30)
  } else if (period === '90d') {
    startDate.setDate(now.getDate() - 90)
  }

  const sales = await prisma.sale.findMany({
    where: {
      businessId,
      createdAt: { gte: startDate },
      paymentStatus: 'COMPLETED'
    },
    select: {
      createdAt: true,
      totalAmountCents: true
    }
  })

  // Aggregate by hour (0-23)
  const hourlyMap = new Map<number, { orders: number; revenue: number }>()
  for (let i = 0; i < 24; i++) {
    hourlyMap.set(i, { orders: 0, revenue: 0 })
  }

  // Aggregate by day of week
  const dailyMap = new Map<string, { orders: number; revenue: number }>()
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  days.forEach(day => dailyMap.set(day, { orders: 0, revenue: 0 }))

  for (const sale of sales) {
    const hour = sale.createdAt.getHours()
    const dayName = days[sale.createdAt.getDay()]

    const hourData = hourlyMap.get(hour)!
    hourData.orders++
    hourData.revenue += sale.totalAmountCents

    const dayData = dailyMap.get(dayName)!
    dayData.orders++
    dayData.revenue += sale.totalAmountCents
  }

  const hourly = Array.from(hourlyMap.entries()).map(([hour, data]) => ({
    hour,
    orders: data.orders,
    revenue: data.revenue,
    avgOrderValue: data.orders > 0 ? Math.round(data.revenue / data.orders) : 0
  }))

  const daily = Array.from(dailyMap.entries()).map(([day, data]) => ({
    day,
    orders: data.orders,
    revenue: data.revenue
  }))

  return res.status(200).json(successResponse({ hourly, daily }))
}

export default withErrorHandler(handler)
