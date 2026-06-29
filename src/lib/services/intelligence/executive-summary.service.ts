/**
 * Executive Summary Engine
 * Generates operational and executive summaries for different time periods
 */

import { prisma } from '@/lib/prisma'
import { CustomerHealthScoreService } from './customer-health-score.service'
import { BranchHealthScoreService } from './branch-health-score.service'
import { PaymentWatchdogService } from '../watchdog/payment-watchdog.service'
import { QueueWatchdogService } from '../watchdog/queue-watchdog.service'
import { startOfMonth, subDays } from 'date-fns'

export interface HourlyOperationsSummary {
  timestamp: Date
  period: 'hourly'
  queueHealth: {
    extractBacklog: number
    intelligenceBacklog: number
    extractDLQ: number
    intelligenceDLQ: number
    status: 'HEALTHY' | 'WARNING' | 'CRITICAL'
  }
  paymentHealth: {
    transactionsLastHour: number
    failureRate: number
    status: 'HEALTHY' | 'WARNING' | 'CRITICAL'
  }
  reconciliationHealth: {
    unreconciledCount: number
    oldestAgeHours: number
    status: 'HEALTHY' | 'WARNING' | 'CRITICAL'
  }
}

export interface DailyExecutiveSummary {
  date: Date
  period: 'daily'
  revenue: {
    yesterday: number
    dayBeforeYesterday: number
    changePercent: number
    trend: 'UP' | 'DOWN' | 'FLAT'
  }
  subscriptions: {
    new: number
    failedRenewals: number
    inGrace: number
    revenueAtRisk: number
  }
  customers: {
    activeCount: number
    healthDistribution: {
      excellent: number
      healthy: number
      atRisk: number
      critical: number
    }
  }
  branches: {
    topPerformer: { id: string; name: string; score: number } | null
    bottomPerformer: { id: string; name: string; score: number } | null
  }
  alerts: {
    critical: number
    error: number
    warn: number
    topIssues: string[]
  }
  recommendedActions: string[]
}

export interface WeeklyExecutiveSummary {
  weekStart: Date
  weekEnd: Date
  period: 'weekly'
  revenue: {
    thisWeek: number
    lastWeek: number
    changePercent: number
    trend: 'UP' | 'DOWN' | 'FLAT'
  }
  customers: {
    newCustomers: number
    churnedCustomers: number
    netChange: number
  }
  subscriptions: {
    newSubscriptions: number
    cancellations: number
    churnRate: number
  }
  operationalIncidents: {
    paymentFailures: number
    queueStalls: number
    reconciliationIssues: number
  }
  kpiHighlights: string[]
}

export class ExecutiveSummaryService {
  /**
   * Generate hourly operations summary
   */
  static async generateHourlySummary(): Promise<HourlyOperationsSummary> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

    // Queue health (would integrate with actual queue metrics)
    const queueHealth = {
      extractBacklog: 0, // Placeholder - integrate with actual queue
      intelligenceBacklog: 0,
      extractDLQ: 0,
      intelligenceDLQ: 0,
      status: 'HEALTHY' as const,
    }

    // Payment health
    const payments = await prisma.paymentTransaction.findMany({
      where: {
        createdAt: { gte: oneHourAgo },
      },
      select: { status: true },
    })

    const transactionsLastHour = payments.length
    const failed = payments.filter((p) => p.status === 'FAILED').length
    const failureRate = transactionsLastHour > 0 ? (failed / transactionsLastHour) * 100 : 0

    const paymentStatus =
      failureRate >= 10 ? 'CRITICAL' : failureRate >= 3 ? 'WARNING' : 'HEALTHY'

    // Reconciliation health
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const unreconciledCount = await prisma.financialLedgerEntry.count({
      where: {
        createdAt: { lt: twentyFourHoursAgo },
      },
    })

    const oldestEntry = await prisma.financialLedgerEntry.findFirst({
      where: {
        createdAt: { lt: twentyFourHoursAgo },
      },
      orderBy: { createdAt: 'asc' },
    })

    const oldestAgeHours = oldestEntry
      ? (Date.now() - oldestEntry.createdAt.getTime()) / (1000 * 60 * 60)
      : 0

    const reconciliationStatus =
      oldestAgeHours >= 48 ? 'CRITICAL' : unreconciledCount >= 50 ? 'WARNING' : 'HEALTHY'

    return {
      timestamp: new Date(),
      period: 'hourly',
      queueHealth,
      paymentHealth: {
        transactionsLastHour,
        failureRate,
        status: paymentStatus,
      },
      reconciliationHealth: {
        unreconciledCount,
        oldestAgeHours,
        status: reconciliationStatus,
      },
    }
  }

  /**
   * Generate daily executive summary
   */
  static async generateDailySummary(businessId?: string): Promise<DailyExecutiveSummary> {
    const today = new Date()
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
    const dayBeforeYesterday = new Date(today.getTime() - 48 * 60 * 60 * 1000)

    // Revenue
    const yesterdayRevenue = await this.getRevenueForDay(yesterday, businessId)
    const dayBeforeRevenue = await this.getRevenueForDay(dayBeforeYesterday, businessId)
    const changePercent =
      dayBeforeRevenue > 0 ? ((yesterdayRevenue - dayBeforeRevenue) / dayBeforeRevenue) * 100 : 0
    const trend = changePercent > 5 ? 'UP' : changePercent < -5 ? 'DOWN' : 'FLAT'

    // Subscriptions
    const newSubscriptions = await prisma.subscription.count({
      where: {
        createdAt: {
          gte: yesterday,
          lt: today,
        },
        ...(businessId && { businessId }),
      },
    })

    const failedRenewals = await prisma.subscription.count({
      where: {
        status: 'GRACE_PERIOD',
        updatedAt: {
          gte: yesterday,
          lt: today,
        },
        ...(businessId && { businessId }),
      },
    })

    const inGrace = await prisma.subscription.count({
      where: {
        status: 'GRACE_PERIOD',
        ...(businessId && { businessId }),
      },
    })

    const graceSubscriptions = await prisma.subscription.findMany({
      where: {
        status: 'GRACE_PERIOD',
        ...(businessId && { businessId }),
      },
      select: { amountCents: true },
    })

    const revenueAtRisk = graceSubscriptions.reduce((sum, s) => sum + s.amountCents, 0)

    // Customers
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const activeCount = await prisma.customer.count({
      where: {
        lastVisit: { gte: thirtyDaysAgo },
        ...(businessId && { businessId }),
      },
    })

    // Customer health distribution (simplified)
    const healthDistribution = {
      excellent: Math.round(activeCount * 0.3),
      healthy: Math.round(activeCount * 0.4),
      atRisk: Math.round(activeCount * 0.2),
      critical: Math.round(activeCount * 0.1),
    }

    // Branch performance (if businessId provided)
    let topPerformer = null
    let bottomPerformer = null

    if (businessId) {
      const rankings = await BranchHealthScoreService.getBranchRankings(businessId)
      if (rankings.length > 0) {
        topPerformer = {
          id: rankings[0].branchId,
          name: rankings[0].branchName,
          score: rankings[0].score,
        }
        bottomPerformer = {
          id: rankings[rankings.length - 1].branchId,
          name: rankings[rankings.length - 1].branchName,
          score: rankings[rankings.length - 1].score,
        }
      }
    }

    // Alerts (placeholder - would integrate with actual alert system)
    const alerts = {
      critical: 0,
      error: 0,
      warn: 0,
      topIssues: [] as string[],
    }

    // Recommended actions
    const recommendedActions: string[] = []
    if (failedRenewals > 5) {
      recommendedActions.push('Review failed renewal patterns and payment retry logic')
    }
    if (changePercent < -15) {
      recommendedActions.push('Investigate revenue decline - check system health and customer activity')
    }
    if (inGrace > 10) {
      recommendedActions.push('Initiate rescue campaigns for subscriptions in grace period')
    }

    return {
      date: yesterday,
      period: 'daily',
      revenue: {
        yesterday: yesterdayRevenue,
        dayBeforeYesterday: dayBeforeRevenue,
        changePercent,
        trend,
      },
      subscriptions: {
        new: newSubscriptions,
        failedRenewals,
        inGrace,
        revenueAtRisk,
      },
      customers: {
        activeCount,
        healthDistribution,
      },
      branches: {
        topPerformer,
        bottomPerformer,
      },
      alerts,
      recommendedActions,
    }
  }

  /**
   * Generate weekly executive summary
   */
  static async generateWeeklySummary(businessId?: string): Promise<WeeklyExecutiveSummary> {
    const today = new Date()
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const fourteenDaysAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000)

    // Revenue
    const thisWeekRevenue = await this.getRevenueForPeriod(sevenDaysAgo, today, businessId)
    const lastWeekRevenue = await this.getRevenueForPeriod(
      fourteenDaysAgo,
      sevenDaysAgo,
      businessId
    )
    const changePercent =
      lastWeekRevenue > 0 ? ((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100 : 0
    const trend = changePercent > 5 ? 'UP' : changePercent < -5 ? 'DOWN' : 'FLAT'

    // Customers
    const newCustomers = await prisma.customer.count({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
          lt: today,
        },
        ...(businessId && { businessId }),
      },
    })

    const churnedCustomers = await prisma.customer.count({
      where: {
        lastVisit: {
          lt: new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000), // 90+ days dormant
        },
        ...(businessId && { businessId }),
      },
    })

    // Subscriptions
    const newSubscriptions = await prisma.subscription.count({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
          lt: today,
        },
        ...(businessId && { businessId }),
      },
    })

    const cancellations = await prisma.subscription.count({
      where: {
        status: 'CANCELLED',
        updatedAt: {
          gte: sevenDaysAgo,
          lt: today,
        },
        ...(businessId && { businessId }),
      },
    })

    const totalSubscriptions = await prisma.subscription.count({
      where: {
        status: 'ACTIVE',
        ...(businessId && { businessId }),
      },
    })

    const churnRate = totalSubscriptions > 0 ? (cancellations / totalSubscriptions) * 100 : 0

    // Operational incidents
    const paymentFailures = await prisma.paymentTransaction.count({
      where: {
        status: 'FAILED',
        createdAt: {
          gte: sevenDaysAgo,
          lt: today,
        },
        ...(businessId && { businessId }),
      },
    })

    // KPI highlights
    const kpiHighlights: string[] = []
    kpiHighlights.push(`Revenue ${trend === 'UP' ? 'increased' : trend === 'DOWN' ? 'decreased' : 'remained stable'} by ${Math.abs(changePercent).toFixed(1)}%`)
    kpiHighlights.push(`${newCustomers} new customers acquired`)
    kpiHighlights.push(`${newSubscriptions} new subscriptions`)
    if (churnRate > 5) {
      kpiHighlights.push(`Churn rate elevated at ${churnRate.toFixed(1)}%`)
    }

    return {
      weekStart: sevenDaysAgo,
      weekEnd: today,
      period: 'weekly',
      revenue: {
        thisWeek: thisWeekRevenue,
        lastWeek: lastWeekRevenue,
        changePercent,
        trend,
      },
      customers: {
        newCustomers,
        churnedCustomers,
        netChange: newCustomers - churnedCustomers,
      },
      subscriptions: {
        newSubscriptions,
        cancellations,
        churnRate,
      },
      operationalIncidents: {
        paymentFailures,
        queueStalls: 0, // Placeholder
        reconciliationIssues: 0, // Placeholder
      },
      kpiHighlights,
    }
  }

  /**
   * Get revenue for a specific day
   */
  private static async getRevenueForDay(date: Date, businessId?: string): Promise<number> {
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)

    return this.getRevenueForPeriod(startOfDay, endOfDay, businessId)
  }

  /**
   * Get revenue for a period
   */
  private static async getRevenueForPeriod(
    start: Date,
    end: Date,
    businessId?: string
  ): Promise<number> {
    const result = await prisma.financialLedgerEntry.aggregate({
      where: {
        eventType: 'PAYMENT_SUCCESS',
        occurredAt: {
          gte: start,
          lt: end,
        },
        ...(businessId && { businessId }),
      },
      _sum: {
        amountCents: true,
      },
    })

    return result._sum.amountCents || 0
  }

  /**
   * Get latest executive summary for CEO Dashboard
   * Uses deterministic logic based on existing approved KPIs
   * No AI, no LLM calls, no new KPIs
   */
  static async getLatestSummary(period: 'HOURLY' | 'DAILY' | 'WEEKLY'): Promise<{
    revenue: string
    customers: string
    operations: string
    risks: string[]
    opportunities: string[]
    generatedAt: Date
  } | null> {
    try {
      const now = new Date()
      const last30Days = subDays(now, 30)
      const last60Days = subDays(now, 60)
      const currentMonthStart = startOfMonth(now)
      const lastMonthStart = startOfMonth(subDays(now, 30))

      // Fetch required data in parallel
      const [
        currentMRR,
        lastMRR,
        revenue30d,
        revenue60d,
        gracePeriodCount,
        totalActiveSubscriptions,
        customerHealthDist,
        paymentHealth,
        queueHealth,
        dlqCount
      ] = await Promise.all([
        // Current MRR
        prisma.financialLedgerEntry.aggregate({
          where: {
            eventType: 'SUBSCRIPTION_CHARGE',
            occurredAt: { gte: currentMonthStart }
          },
          _sum: { amountCents: true }
        }),
        // Last month MRR
        prisma.financialLedgerEntry.aggregate({
          where: {
            eventType: 'SUBSCRIPTION_CHARGE',
            occurredAt: { gte: lastMonthStart, lte: currentMonthStart }
          },
          _sum: { amountCents: true }
        }),
        // Revenue last 30 days
        prisma.financialLedgerEntry.aggregate({
          where: {
            eventType: 'PAYMENT_SUCCESS',
            occurredAt: { gte: last30Days }
          },
          _sum: { amountCents: true }
        }),
        // Revenue 30-60 days ago
        prisma.financialLedgerEntry.aggregate({
          where: {
            eventType: 'PAYMENT_SUCCESS',
            occurredAt: { gte: last60Days, lte: last30Days }
          },
          _sum: { amountCents: true }
        }),
        // Grace period subscriptions
        prisma.subscription.count({
          where: { status: 'GRACE_PERIOD' }
        }),
        // Total active subscriptions
        prisma.subscription.count({
          where: { status: { in: ['ACTIVE', 'GRACE_PERIOD'] } }
        }),
        // Customer health distribution (simplified - count by category)
        prisma.customer.count({
          where: {
            lastVisit: { lte: subDays(now, 60) }
          }
        }),
        // Payment health from watchdog
        PaymentWatchdogService.getHealth(),
        // Queue health from watchdog
        QueueWatchdogService.getHealth(),
        // DLQ count
        QueueWatchdogService.getDLQCount()
      ])

      // Calculate metrics
      const mrr = (currentMRR._sum.amountCents || 0) / 100
      const lastMrr = (lastMRR._sum.amountCents || 0) / 100
      const mrrChange = lastMrr > 0 ? ((mrr - lastMrr) / lastMrr) * 100 : 0

      const rev30d = (revenue30d._sum.amountCents || 0) / 100
      const rev60d = (revenue60d._sum.amountCents || 0) / 100
      const revenueGrowth30d = rev60d > 0 ? ((rev30d - rev60d) / rev60d) * 100 : 0

      const gracePeriodPercent = totalActiveSubscriptions > 0 
        ? (gracePeriodCount / totalActiveSubscriptions) * 100 
        : 0

      const totalCustomers = await prisma.customer.count()
      const atRiskCustomerPercent = totalCustomers > 0 
        ? (customerHealthDist / totalCustomers) * 100 
        : 0

      // Generate insights using deterministic logic
      const insights = this.generateDeterministicInsights({
        mrr,
        mrrChange,
        revenueGrowth30d,
        gracePeriodPercent,
        atRiskCustomerPercent,
        paymentHealth,
        queueHealth,
        dlqCount
      })

      return {
        revenue: insights.revenue,
        customers: insights.customers,
        operations: insights.operations,
        risks: insights.risks,
        opportunities: insights.opportunities,
        generatedAt: now
      }
    } catch (error) {
      console.error('Error generating executive summary:', error)
      return null
    }
  }

  /**
   * Generate deterministic insights based on KPI thresholds
   * Pure logic, no AI, no LLM
   */
  private static generateDeterministicInsights(metrics: {
    mrr: number
    mrrChange: number
    revenueGrowth30d: number
    gracePeriodPercent: number
    atRiskCustomerPercent: number
    paymentHealth: 'HEALTHY' | 'WARNING' | 'CRITICAL'
    queueHealth: 'HEALTHY' | 'WARNING' | 'CRITICAL'
    dlqCount: number
  }): {
    revenue: string
    customers: string
    operations: string
    risks: string[]
    opportunities: string[]
  } {
    const risks: string[] = []
    const opportunities: string[] = []

    // Revenue insight
    let revenueInsight = ''
    if (metrics.mrrChange > 10) {
      revenueInsight = `Strong MRR growth (+${metrics.mrrChange.toFixed(1)}%) indicates healthy subscription momentum`
    } else if (metrics.mrrChange > 0) {
      revenueInsight = `MRR growing steadily (+${metrics.mrrChange.toFixed(1)}%)`
    } else if (metrics.mrrChange > -5) {
      revenueInsight = `MRR decline (${metrics.mrrChange.toFixed(1)}%) requires attention`
      risks.push('MRR declining - investigate churn drivers')
    } else {
      revenueInsight = `Critical MRR decline (${metrics.mrrChange.toFixed(1)}%) - immediate action required`
      risks.push('Critical MRR decline - prioritize retention')
    }

    // Add revenue at risk context
    if (metrics.gracePeriodPercent > 20) {
      revenueInsight += `. High revenue at risk (${metrics.gracePeriodPercent.toFixed(1)}% of subscriptions in grace period)`
      risks.push(`${metrics.gracePeriodPercent.toFixed(1)}% of subscriptions at risk - prioritize recovery`)
    } else if (metrics.gracePeriodPercent > 10) {
      revenueInsight += `. Moderate revenue at risk (${metrics.gracePeriodPercent.toFixed(1)}% in grace period)`
    }

    // Customer insight
    let customerInsight = ''
    if (metrics.atRiskCustomerPercent > 30) {
      customerInsight = `Customer health deteriorating: ${metrics.atRiskCustomerPercent.toFixed(1)}% inactive >60 days - urgent retention focus needed`
      risks.push('High customer inactivity - launch re-engagement campaign')
    } else if (metrics.atRiskCustomerPercent > 15) {
      customerInsight = `Customer health moderate: ${metrics.atRiskCustomerPercent.toFixed(1)}% inactive >60 days`
    } else {
      customerInsight = `Customer health stable: ${metrics.atRiskCustomerPercent.toFixed(1)}% inactive >60 days`
      opportunities.push('Strong customer engagement - consider expansion initiatives')
    }

    // Operations insight
    let operationsInsight = ''
    if (metrics.paymentHealth === 'CRITICAL' || metrics.queueHealth === 'CRITICAL') {
      operationsInsight = 'Critical operational issues detected - immediate intervention required'
      if (metrics.paymentHealth === 'CRITICAL') {
        risks.push('Payment system critical - escalate to provider')
      }
      if (metrics.queueHealth === 'CRITICAL') {
        risks.push(`Queue system critical - ${metrics.dlqCount} failed jobs`)
      }
    } else if (metrics.paymentHealth === 'WARNING' || metrics.queueHealth === 'WARNING') {
      operationsInsight = 'Operational warnings detected - monitor closely'
      if (metrics.dlqCount > 5) {
        operationsInsight += ` (${metrics.dlqCount} jobs in DLQ)`
      }
    } else {
      operationsInsight = 'All systems operational'
      opportunities.push('Stable operations - capacity for new initiatives')
    }

    return {
      revenue: revenueInsight,
      customers: customerInsight,
      operations: operationsInsight,
      risks,
      opportunities
    }
  }

  /**
   * Get CFO Financial Summary (Financial Insight Strip)
   * 10-second CFO summary with deterministic logic
   * Format: [Revenue Health], [Risk/Opportunity], [Operational]
   */
  static async getFinancialSummary(): Promise<{
    summary: string
    generatedAt: Date
  }> {
    const now = new Date()
    const currentMonthStart = startOfMonth(now)
    const lastMonthStart = startOfMonth(subDays(now, 30))

    // Fetch key financial metrics in parallel
    const [currentMRR, lastMRR, gracePeriodCount, totalActiveSubs, paymentHealth, reconciliationHealth] = await Promise.all([
      // Current MRR
      prisma.financialLedgerEntry.aggregate({
        where: {
          eventType: 'SUBSCRIPTION_CHARGE',
          occurredAt: { gte: currentMonthStart }
        },
        _sum: { amountCents: true }
      }),
      // Last month MRR
      prisma.financialLedgerEntry.aggregate({
        where: {
          eventType: 'SUBSCRIPTION_CHARGE',
          occurredAt: { gte: lastMonthStart, lt: currentMonthStart }
        },
        _sum: { amountCents: true }
      }),
      // Grace period subscriptions
      prisma.subscription.count({
        where: { status: 'GRACE_PERIOD' }
      }),
      // Total active subscriptions
      prisma.subscription.count({
        where: { status: { in: ['ACTIVE', 'GRACE_PERIOD'] } }
      }),
      // Payment health
      PaymentWatchdogService.getHealth(),
      // Reconciliation health
      ReconciliationWatchdogService.getHealth()
    ])

    const mrr = (currentMRR._sum.amountCents || 0) / 100
    const lastMrr = (lastMRR._sum.amountCents || 0) / 100
    const mrrChange = lastMrr > 0 ? ((mrr - lastMrr) / lastMrr) * 100 : 0
    const gracePeriodPercent = totalActiveSubs > 0 ? (gracePeriodCount / totalActiveSubs) * 100 : 0

    // Generate financial summary using deterministic logic
    const parts: string[] = []

    // Part 1: Revenue Health
    if (mrrChange > 10) {
      parts.push(`Strong recurring revenue growth (+${mrrChange.toFixed(1)}% MRR)`)
    } else if (mrrChange > 5) {
      parts.push(`Recurring revenue growing steadily (+${mrrChange.toFixed(1)}% MRR)`)
    } else if (mrrChange > 0) {
      parts.push(`Recurring revenue remains healthy (+${mrrChange.toFixed(1)}% MRR growth)`)
    } else if (mrrChange > -5) {
      parts.push(`Recurring revenue stable (${mrrChange.toFixed(1)}% MRR change)`)
    } else {
      parts.push(`Recurring revenue declining (${mrrChange.toFixed(1)}% MRR)`)
    }

    // Part 2: Risk/Opportunity
    const riskOpportunities: string[] = []
    
    if (gracePeriodPercent > 15) {
      riskOpportunities.push(`${gracePeriodPercent.toFixed(1)}% of subscriptions in grace period (elevated risk)`)
    } else if (gracePeriodPercent > 10) {
      riskOpportunities.push(`${gracePeriodPercent.toFixed(1)}% of subscriptions in grace period`)
    }

    if (mrrChange > 15) {
      riskOpportunities.push('strong expansion momentum detected')
    }

    if (riskOpportunities.length > 0) {
      parts.push(riskOpportunities.join(' and '))
    }

    // Part 3: Operational
    const operationalIssues: string[] = []
    
    if (reconciliationHealth.status === 'CRITICAL') {
      operationalIssues.push('reconciliation exceptions exceeded target thresholds')
    } else if (reconciliationHealth.status === 'WARNING') {
      operationalIssues.push('reconciliation backlog approaching SLA limits')
    }

    if (paymentHealth.status === 'CRITICAL') {
      operationalIssues.push('payment provider reliability concerns')
    } else if (paymentHealth.status === 'WARNING') {
      operationalIssues.push('payment success rate below target')
    }

    if (operationalIssues.length > 0) {
      parts.push(operationalIssues.join(' and '))
    } else if (riskOpportunities.length === 0) {
      parts.push('financial operations performing within targets')
    }

    const summary = parts.join(', however ') + '.'

    return {
      summary,
      generatedAt: now
    }
  }
}
