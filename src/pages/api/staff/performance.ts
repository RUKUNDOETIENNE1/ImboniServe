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

  const { period = 'week' } = req.query

  try {
    const now = new Date()
    let startDate: Date

    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    }

    // Fetch all staff with their sales
    const staffMembers = await prisma.user.findMany({
      where: {
        businessId,
        roles: { hasSome: ['WAITER', 'CASHIER', 'MANAGER'] }
      },
      include: {
        sales: {
          where: {
            createdAt: { gte: startDate },
            status: { in: ['COMPLETED', 'PAID'] }
          },
          select: {
            id: true,
            totalCents: true,
            tipCents: true,
            createdAt: true,
            completedAt: true
          }
        }
      }
    })

    // Calculate performance metrics for each staff member
    const staffWithMetrics = staffMembers.map(staff => {
      const sales = staff.sales
      const totalOrders = sales.length
      const totalSales = sales.reduce((sum, s) => sum + (s.totalCents || 0), 0) / 100
      const totalTips = sales.reduce((sum, s) => sum + (s.tipCents || 0), 0) / 100
      const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0

      // Calculate average service time (order to completion)
      const serviceTimes = sales
        .filter(s => s.completedAt)
        .map(s => {
          const orderTime = new Date(s.createdAt).getTime()
          const completeTime = new Date(s.completedAt!).getTime()
          return (completeTime - orderTime) / (1000 * 60) // minutes
        })
      const avgServiceTime = serviceTimes.length > 0
        ? serviceTimes.reduce((sum, t) => sum + t, 0) / serviceTimes.length
        : 0

      // Mock customer rating (would come from feedback system)
      const customerRating = 4.0 + Math.random() * 1.0

      // Calculate performance score (0-100)
      let score = 0
      
      // Sales volume (40 points)
      const salesScore = Math.min((totalSales / 50000) * 40, 40)
      score += salesScore

      // Order count (30 points)
      const orderScore = Math.min((totalOrders / 50) * 30, 30)
      score += orderScore

      // Customer rating (20 points)
      const ratingScore = (customerRating / 5) * 20
      score += ratingScore

      // Service speed (10 points) - faster is better
      const speedScore = avgServiceTime > 0 ? Math.max(10 - (avgServiceTime / 10), 0) : 5
      score += speedScore

      score = Math.round(score)

      // Assign badge based on score
      let badge: 'Gold' | 'Silver' | 'Bronze' | 'Rising Star' | 'Rookie'
      if (score >= 80) badge = 'Gold'
      else if (score >= 60) badge = 'Silver'
      else if (score >= 40) badge = 'Bronze'
      else if (totalOrders >= 10 && score >= 30) badge = 'Rising Star'
      else badge = 'Rookie'

      return {
        id: staff.id,
        name: staff.name || 'Unknown',
        role: staff.roles[0] || 'STAFF',
        stats: {
          totalSales: Math.round(totalSales),
          totalOrders,
          avgOrderValue: Math.round(avgOrderValue),
          avgServiceTime: Math.round(avgServiceTime),
          customerRating: Math.round(customerRating * 10) / 10,
          totalTips: Math.round(totalTips),
          ordersToday: sales.filter(s => {
            const saleDate = new Date(s.createdAt)
            return saleDate.toDateString() === now.toDateString()
          }).length,
          salesThisWeek: Math.round(totalSales)
        },
        performance: {
          score,
          rank: 0, // Will be set after sorting
          badge,
          trend: 'stable' as const
        }
      }
    })

    // Sort by score and assign ranks
    staffWithMetrics.sort((a, b) => b.performance.score - a.performance.score)
    staffWithMetrics.forEach((staff, index) => {
      staff.performance.rank = index + 1
    })

    return res.status(200).json({
      staff: staffWithMetrics
    })
  } catch (error: any) {
    console.error('Staff performance error:', error)
    return res.status(500).json({ error: 'Failed to fetch staff performance' })
  }
}
