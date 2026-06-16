import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/middleware/permission.middleware'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
 
  try {
    const session = await getServerSession(req, res, authOptions)
    if (!session?.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const businessId = (session.user as any).businessId
    if (!businessId) {
      return res.status(400).json({ error: 'Business ID required' })
    }

    const { days = '7' } = req.query
    const daysInt = parseInt(days as string)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - daysInt)

    // Get all paid orders in date range
    const orders = await prisma.sale.findMany({
      where: {
        businessId,
        paymentStatus: 'PAID',
        createdAt: {
          gte: startDate
        }
      },
      include: {
        paymentTransaction: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    // Calculate total stats
    const totalOrders = orders.length
    const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmountCents, 0)
    const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0

    // Group by payment method
    const methodGroups = orders.reduce((acc, order) => {
      const method = order.paymentMethod || 'OTHER'
      if (!acc[method]) {
        acc[method] = {
          method,
          count: 0,
          revenue: 0
        }
      }
      acc[method].count++
      acc[method].revenue += order.totalAmountCents
      return acc
    }, {} as Record<string, { method: string; count: number; revenue: number }>)

    const methodBreakdown = Object.values(methodGroups).map(m => ({
      ...m,
      percentage: totalOrders > 0 ? (m.count / totalOrders) * 100 : 0
    }))

    // Calculate success rates
    const transactions = await prisma.paymentTransaction.findMany({
      where: {
        sale: {
          businessId
        },
        createdAt: {
          gte: startDate
        }
      }
    })

    const successRateGroups = transactions.reduce((acc, tx) => {
      const method = tx.paymentMethod || 'OTHER'
      if (!acc[method]) {
        acc[method] = {
          method,
          total: 0,
          successful: 0,
          failed: 0
        }
      }
      acc[method].total++
      if (tx.status === 'SUCCESS') {
        acc[method].successful++
      } else if (tx.status === 'FAILED') {
        acc[method].failed++
      }
      return acc
    }, {} as Record<string, { method: string; total: number; successful: number; failed: number }>)

    const successRates = Object.values(successRateGroups).map(sr => ({
      ...sr,
      rate: sr.total > 0 ? (sr.successful / sr.total) * 100 : 0
    }))

    // Calculate fee savings
    const momoOrders = orders.filter(o => 
      ['MTN_MOBILE_MONEY', 'AIRTEL_MONEY'].includes(o.paymentMethod || '')
    )
    const momoRevenue = momoOrders.reduce((sum, o) => sum + o.totalAmountCents, 0)
    
    // IremboPay fees: 3.42% + 18% VAT = ~4.04%
    const iremboFeeRate = 0.0404
    const directMomoFeeRate = 0.01

    const wouldHavePaid = Math.round(momoRevenue * iremboFeeRate)
    const actuallyPaid = Math.round(momoRevenue * directMomoFeeRate)
    const saved = wouldHavePaid - actuallyPaid
    const savingsRate = wouldHavePaid > 0 ? (saved / wouldHavePaid) * 100 : 0

    // Calculate confirmation times
    const paidOrders = orders.filter(o => o.kitchenReleasedAt)
    const confirmationTimeGroups = paidOrders.reduce((acc, order) => {
      const method = order.paymentMethod || 'OTHER'
      const seconds = order.kitchenReleasedAt && order.createdAt
        ? (new Date(order.kitchenReleasedAt).getTime() - new Date(order.createdAt).getTime()) / 1000
        : 0

      if (!acc[method]) {
        acc[method] = {
          method,
          times: []
        }
      }
      if (seconds > 0 && seconds < 3600) { // Only count reasonable times (< 1 hour)
        acc[method].times.push(seconds)
      }
      return acc
    }, {} as Record<string, { method: string; times: number[] }>)

    const confirmationTimes = Object.values(confirmationTimeGroups)
      .filter(ct => ct.times.length > 0)
      .map(ct => ({
        method: ct.method,
        avgSeconds: ct.times.reduce((sum, t) => sum + t, 0) / ct.times.length,
        minSeconds: Math.min(...ct.times),
        maxSeconds: Math.max(...ct.times)
      }))

    // Daily trends
    const dailyGroups = orders.reduce((acc, order) => {
      const date = new Date(order.createdAt).toISOString().split('T')[0]
      if (!acc[date]) {
        acc[date] = {
          date,
          orders: 0,
          revenue: 0
        }
      }
      acc[date].orders++
      acc[date].revenue += order.totalAmountCents
      return acc
    }, {} as Record<string, { date: string; orders: number; revenue: number }>)

    const dailyTrends = Object.values(dailyGroups).sort((a, b) => 
      a.date.localeCompare(b.date)
    )

    return res.status(200).json({
      totalOrders,
      totalRevenue,
      avgOrderValue,
      methodBreakdown,
      successRates,
      feeSavings: {
        wouldHavePaid,
        actuallyPaid,
        saved,
        savingsRate
      },
      confirmationTimes,
      dailyTrends
    })

  } catch (error: any) {
    console.error('[Payment Analytics] Error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export default requirePermission('reports.view')(handler)
