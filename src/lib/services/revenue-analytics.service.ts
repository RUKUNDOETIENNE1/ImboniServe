import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

/**
 * Revenue Analytics Service
 * Advanced analytics for Revenue Operations
 */

export class RevenueAnalyticsService {
  /**
   * Get conversion funnel data
   */
  static async getConversionFunnel(params?: {
    startDate?: Date
    endDate?: Date
    marketerId?: string
  }) {
    try {
      const where: any = {}
      if (params?.marketerId) where.marketerId = params.marketerId
      if (params?.startDate || params?.endDate) {
        where.createdAt = {}
        if (params.startDate) where.createdAt.gte = params.startDate
        if (params.endDate) where.createdAt.lte = params.endDate
      }

      const [
        totalAttributions,
        signupBonuses,
        recurringCommissions,
        payoutRequests,
        paidPayouts
      ] = await Promise.all([
        prisma.marketerAttribution.count({ where }),
        prisma.marketerCommission.count({ where: { ...where, type: 'SIGNUP_BONUS' } }),
        prisma.marketerCommission.count({ where: { ...where, type: 'RECURRING_COMMISSION' } }),
        prisma.marketerPayout.count({ where }),
        prisma.marketerPayout.count({ where: { ...where, status: 'PAID' } })
      ])

      return {
        stages: [
          { name: 'Attributions', count: totalAttributions, percentage: 100 },
          { name: 'Signup Bonuses', count: signupBonuses, percentage: totalAttributions > 0 ? (signupBonuses / totalAttributions) * 100 : 0 },
          { name: 'Recurring Commissions', count: recurringCommissions, percentage: totalAttributions > 0 ? (recurringCommissions / totalAttributions) * 100 : 0 },
          { name: 'Payout Requests', count: payoutRequests, percentage: totalAttributions > 0 ? (payoutRequests / totalAttributions) * 100 : 0 },
          { name: 'Paid Payouts', count: paidPayouts, percentage: totalAttributions > 0 ? (paidPayouts / totalAttributions) * 100 : 0 }
        ],
        conversionRate: totalAttributions > 0 ? (paidPayouts / totalAttributions) * 100 : 0
      }
    } catch (error) {
      logger.error('Failed to get conversion funnel', { error })
      throw new Error('Failed to get conversion funnel')
    }
  }

  /**
   * Get top marketers leaderboard
   */
  static async getTopMarketers(params?: {
    limit?: number
    metric?: 'earnings' | 'payouts' | 'referrals'
    startDate?: Date
    endDate?: Date
  }) {
    try {
      const limit = params?.limit || 10
      const metric = params?.metric || 'earnings'

      const marketers = await prisma.professionalMarketer.findMany({
        where: { status: 'ACTIVE' },
        include: {
          wallet: true,
          _count: {
            select: {
              referredBusinesses: true,
              commissions: true,
              payouts: true
            }
          }
        },
        take: 100 // Get more for sorting
      })

      // Sort based on metric
      const sorted = marketers.sort((a, b) => {
        if (metric === 'earnings') {
          return (b.wallet?.totalEarnedCents || 0) - (a.wallet?.totalEarnedCents || 0)
        } else if (metric === 'payouts') {
          return (b.wallet?.totalPaidOutCents || 0) - (a.wallet?.totalPaidOutCents || 0)
        } else {
          return b._count.referredBusinesses - a._count.referredBusinesses
        }
      }).slice(0, limit)

      return sorted.map((m, index) => ({
        rank: index + 1,
        id: m.id,
        name: m.name,
        email: m.email,
        referralCode: m.referralCode,
        totalEarned: m.wallet?.totalEarnedCents || 0,
        totalPaidOut: m.wallet?.totalPaidOutCents || 0,
        availableBalance: m.wallet?.availableBalanceCents || 0,
        referralsCount: m._count.referredBusinesses,
        commissionsCount: m._count.commissions,
        payoutsCount: m._count.payouts
      }))
    } catch (error) {
      logger.error('Failed to get top marketers', { error })
      throw new Error('Failed to get top marketers')
    }
  }

  /**
   * Get revenue by source/campaign
   */
  static async getRevenueBySource(params?: {
    startDate?: Date
    endDate?: Date
  }) {
    try {
      const where: any = {}
      if (params?.startDate || params?.endDate) {
        where.createdAt = {}
        if (params.startDate) where.createdAt.gte = params.startDate
        if (params.endDate) where.createdAt.lte = params.endDate
      }

      const attributions = await prisma.marketerAttribution.findMany({
        where,
        select: {
          source: true,
          campaign: true,
          utmSource: true,
          utmMedium: true,
          utmCampaign: true
        }
      })

      // Group by source
      const sourceMap = new Map<string, number>()
      attributions.forEach(attr => {
        const source = attr.utmSource || attr.source || 'direct'
        sourceMap.set(source, (sourceMap.get(source) || 0) + 1)
      })

      // Group by campaign
      const campaignMap = new Map<string, number>()
      attributions.forEach(attr => {
        const campaign = attr.utmCampaign || attr.campaign || 'none'
        campaignMap.set(campaign, (campaignMap.get(campaign) || 0) + 1)
      })

      return {
        bySource: Array.from(sourceMap.entries()).map(([source, count]) => ({
          source,
          count,
          percentage: (count / attributions.length) * 100
        })).sort((a, b) => b.count - a.count),
        byCampaign: Array.from(campaignMap.entries()).map(([campaign, count]) => ({
          campaign,
          count,
          percentage: (count / attributions.length) * 100
        })).sort((a, b) => b.count - a.count)
      }
    } catch (error) {
      logger.error('Failed to get revenue by source', { error })
      throw new Error('Failed to get revenue by source')
    }
  }

  /**
   * Get cohort analysis (marketers by signup month)
   */
  static async getCohortAnalysis() {
    try {
      const marketers = await prisma.professionalMarketer.findMany({
        include: {
          wallet: true,
          _count: {
            select: {
              referredBusinesses: true,
              commissions: true,
              payouts: true
            }
          }
        }
      })

      // Group by month
      const cohortMap = new Map<string, any[]>()
      marketers.forEach(m => {
        const month = new Date(m.createdAt).toISOString().slice(0, 7) // YYYY-MM
        if (!cohortMap.has(month)) cohortMap.set(month, [])
        cohortMap.get(month)!.push(m)
      })

      return Array.from(cohortMap.entries()).map(([month, cohort]) => ({
        month,
        marketersCount: cohort.length,
        totalEarned: cohort.reduce((sum, m) => sum + (m.wallet?.totalEarnedCents || 0), 0),
        avgEarned: cohort.reduce((sum, m) => sum + (m.wallet?.totalEarnedCents || 0), 0) / cohort.length,
        totalReferrals: cohort.reduce((sum, m) => sum + m._count.referredBusinesses, 0),
        avgReferrals: cohort.reduce((sum, m) => sum + m._count.referredBusinesses, 0) / cohort.length,
        activeMarketers: cohort.filter(m => m.status === 'ACTIVE').length
      })).sort((a, b) => b.month.localeCompare(a.month))
    } catch (error) {
      logger.error('Failed to get cohort analysis', { error })
      throw new Error('Failed to get cohort analysis')
    }
  }

  /**
   * Get LTV (Lifetime Value) calculation
   */
  static async getLTV(marketerId?: string) {
    try {
      const where = marketerId ? { marketerId } : {}

      const [commissions, payouts] = await Promise.all([
        prisma.marketerCommission.aggregate({
          where,
          _sum: { amountCents: true },
          _avg: { amountCents: true },
          _count: true
        }),
        prisma.marketerPayout.aggregate({
          where,
          _sum: { amountCents: true },
          _count: true
        })
      ])

      const totalEarned = commissions._sum.amountCents || 0
      const totalPaidOut = payouts._sum.amountCents || 0
      const avgCommission = commissions._avg.amountCents || 0
      const commissionsCount = commissions._count || 0

      return {
        totalEarned,
        totalPaidOut,
        netRevenue: totalEarned - totalPaidOut,
        avgCommission,
        commissionsCount,
        estimatedLTV: avgCommission * 12 // Assume 12 months average
      }
    } catch (error) {
      logger.error('Failed to get LTV', { error })
      throw new Error('Failed to get LTV')
    }
  }

  /**
   * Get churn prediction (simple heuristic)
   */
  static async getChurnPrediction() {
    try {
      const marketers = await prisma.professionalMarketer.findMany({
        where: { status: 'ACTIVE' },
        include: {
          commissions: {
            orderBy: { createdAt: 'desc' },
            take: 1
          },
          payouts: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      })

      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

      const atRisk = marketers.filter(m => {
        const lastCommission = m.commissions[0]?.createdAt
        const lastPayout = m.payouts[0]?.createdAt
        const lastActivity = lastCommission && lastPayout 
          ? new Date(Math.max(lastCommission.getTime(), lastPayout.getTime()))
          : lastCommission || lastPayout

        return lastActivity && lastActivity < thirtyDaysAgo
      })

      const churned = marketers.filter(m => {
        const lastCommission = m.commissions[0]?.createdAt
        const lastPayout = m.payouts[0]?.createdAt
        const lastActivity = lastCommission && lastPayout 
          ? new Date(Math.max(lastCommission.getTime(), lastPayout.getTime()))
          : lastCommission || lastPayout

        return lastActivity && lastActivity < sixtyDaysAgo
      })

      return {
        total: marketers.length,
        atRisk: atRisk.length,
        churned: churned.length,
        churnRate: (churned.length / marketers.length) * 100,
        atRiskList: atRisk.slice(0, 10).map(m => ({
          id: m.id,
          name: m.name,
          email: m.email,
          lastActivity: m.commissions[0]?.createdAt || m.payouts[0]?.createdAt
        }))
      }
    } catch (error) {
      logger.error('Failed to get churn prediction', { error })
      throw new Error('Failed to get churn prediction')
    }
  }

  /**
   * Get time-series revenue data
   */
  static async getRevenueTimeSeries(params?: {
    startDate?: Date
    endDate?: Date
    interval?: 'day' | 'week' | 'month'
  }) {
    try {
      const interval = params?.interval || 'day'
      const where: any = {}
      if (params?.startDate || params?.endDate) {
        where.createdAt = {}
        if (params.startDate) where.createdAt.gte = params.startDate
        if (params.endDate) where.createdAt.lte = params.endDate
      }

      const commissions = await prisma.marketerCommission.findMany({
        where,
        select: {
          createdAt: true,
          amountCents: true
        },
        orderBy: { createdAt: 'asc' }
      })

      // Group by interval
      const dataMap = new Map<string, number>()
      commissions.forEach(c => {
        let key: string
        const date = new Date(c.createdAt)
        
        if (interval === 'day') {
          key = date.toISOString().slice(0, 10) // YYYY-MM-DD
        } else if (interval === 'week') {
          const weekStart = new Date(date)
          weekStart.setDate(date.getDate() - date.getDay())
          key = weekStart.toISOString().slice(0, 10)
        } else {
          key = date.toISOString().slice(0, 7) // YYYY-MM
        }

        dataMap.set(key, (dataMap.get(key) || 0) + c.amountCents)
      })

      return Array.from(dataMap.entries()).map(([date, amount]) => ({
        date,
        amount,
        count: commissions.filter(c => {
          let key: string
          const d = new Date(c.createdAt)
          if (interval === 'day') {
            key = d.toISOString().slice(0, 10)
          } else if (interval === 'week') {
            const weekStart = new Date(d)
            weekStart.setDate(d.getDate() - d.getDay())
            key = weekStart.toISOString().slice(0, 10)
          } else {
            key = d.toISOString().slice(0, 7)
          }
          return key === date
        }).length
      })).sort((a, b) => a.date.localeCompare(b.date))
    } catch (error) {
      logger.error('Failed to get revenue time series', { error })
      throw new Error('Failed to get revenue time series')
    }
  }
}
