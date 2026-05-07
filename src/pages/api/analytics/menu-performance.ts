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

  // Calculate date range
  const now = new Date()
  let startDate = new Date()
  
  if (period === '7d') {
    startDate.setDate(now.getDate() - 7)
  } else if (period === '30d') {
    startDate.setDate(now.getDate() - 30)
  } else if (period === '90d') {
    startDate.setDate(now.getDate() - 90)
  }

  // Get sales items with menu items
  const salesItems = await prisma.saleItem.findMany({
    where: {
      sale: {
        businessId,
        createdAt: { gte: startDate },
        status: { in: ['COMPLETED', 'PAID'] }
      }
    },
    include: {
      menuItem: {
        select: {
          id: true,
          name: true,
          category: true,
          priceCents: true
        }
      }
    }
  })

  // Aggregate performance by menu item
  const performanceMap = new Map<string, any>()

  for (const item of salesItems) {
    if (!item.menuItem) continue

    const key = item.menuItem.id
    if (!performanceMap.has(key)) {
      performanceMap.set(key, {
        id: item.menuItem.id,
        name: item.menuItem.name,
        category: item.menuItem.category || 'Uncategorized',
        totalSold: 0,
        revenue: 0,
        avgPrice: item.menuItem.priceCents,
        trend: 0
      })
    }

    const perf = performanceMap.get(key)
    perf.totalSold += item.quantity
    perf.revenue += item.totalPriceCents
  }

  // Calculate trends (simplified - compare to previous period)
  const previousStartDate = new Date(startDate)
  const periodDays = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  previousStartDate.setDate(previousStartDate.getDate() - periodDays)

  const previousSalesItems = await prisma.saleItem.findMany({
    where: {
      sale: {
        businessId,
        createdAt: { gte: previousStartDate, lt: startDate },
        status: { in: ['COMPLETED', 'PAID'] }
      }
    },
    include: {
      menuItem: { select: { id: true } }
    }
  })

  const previousMap = new Map<string, number>()
  for (const item of previousSalesItems) {
    if (!item.menuItem) continue
    const current = previousMap.get(item.menuItem.id) || 0
    previousMap.set(item.menuItem.id, current + item.quantity)
  }

  // Calculate trend percentages
  for (const [id, perf] of performanceMap.entries()) {
    const previousSold = previousMap.get(id) || 0
    if (previousSold > 0) {
      perf.trend = Math.round(((perf.totalSold - previousSold) / previousSold) * 100)
    } else if (perf.totalSold > 0) {
      perf.trend = 100
    }
  }

  const performance = Array.from(performanceMap.values())

  return res.status(200).json(successResponse(performance))
}

export default withErrorHandler(handler)
