/**
 * Revenue Watchdog v1
 * Monitors revenue trends and anomalies using FinancialLedgerEntry as source of truth
 */

import { prisma } from '@/lib/prisma'
import { AlertDeliveryService } from '../alert-delivery.service'
import { CooldownService } from './cooldown.service'
import type { WatchdogAlert, WatchdogResult } from './types'
import { startOfMonth, subDays } from 'date-fns'

export class RevenueWatchdogService {
  /**
   * Run Revenue Watchdog checks
   */
  static async run(): Promise<WatchdogResult> {
    const startTime = Date.now()
    const alerts: WatchdogAlert[] = []
    const errors: string[] = []

    try {
      // Check 1: Daily revenue decline
      const dailyAlerts = await this.checkDailyRevenue()
      alerts.push(...dailyAlerts)

      // Check 2: Weekly revenue decline
      const weeklyAlerts = await this.checkWeeklyRevenue()
      alerts.push(...weeklyAlerts)

      // Check 3: Revenue concentration risk
      const concentrationAlerts = await this.checkRevenueConcentration()
      alerts.push(...concentrationAlerts)

      // Deliver alerts (with cooldown)
      for (const alert of alerts) {
        const shouldSend = await CooldownService.shouldAlert(
          alert.watchdog,
          alert.severity,
          alert.source
        )

        if (shouldSend) {
          await AlertDeliveryService.deliverWatchdogAlert(alert)
        }
      }
    } catch (error: any) {
      errors.push(error?.message || String(error))
      console.error('[RevenueWatchdog] Execution error:', error)
    }

    return {
      watchdog: 'REVENUE',
      executedAt: new Date(),
      duration: Date.now() - startTime,
      alertsGenerated: alerts.length,
      errors: errors.length > 0 ? errors : undefined,
    }
  }

  /**
   * Check daily revenue decline (compare today vs yesterday)
   */
  private static async checkDailyRevenue(): Promise<WatchdogAlert[]> {
    const alerts: WatchdogAlert[] = []

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000)
    const twoDaysAgoStart = new Date(yesterdayStart.getTime() - 24 * 60 * 60 * 1000)

    // Get today's revenue (so far)
    const todayRevenue = await this.getRevenueForPeriod(todayStart, now)

    // Get yesterday's revenue (full day)
    const yesterdayRevenue = await this.getRevenueForPeriod(yesterdayStart, todayStart)

    // Get day before yesterday (for baseline comparison)
    const twoDaysAgoRevenue = await this.getRevenueForPeriod(twoDaysAgoStart, yesterdayStart)

    // Calculate baseline (average of yesterday and day before)
    const baseline = (yesterdayRevenue + twoDaysAgoRevenue) / 2

    if (baseline === 0) return alerts // No baseline to compare

    // Calculate decline percentage
    const declinePercent = ((baseline - yesterdayRevenue) / baseline) * 100

    // Thresholds
    const warnThreshold = 15 // 15% decline
    const errorThreshold = 30 // 30% decline
    const criticalThreshold = 50 // 50% decline

    if (declinePercent >= criticalThreshold) {
      alerts.push({
        severity: 'CRITICAL',
        watchdog: 'REVENUE',
        source: 'daily-revenue-decline',
        timestamp: new Date(),
        environment: process.env.NODE_ENV || 'development',
        summary: `Severe daily revenue decline: ${declinePercent.toFixed(1)}% below baseline`,
        details: {
          yesterdayRevenue,
          baseline: baseline.toFixed(2),
          declinePercent: declinePercent.toFixed(2),
          todayRevenue, // Current day progress
          period: 'daily',
        },
        recommendedAction:
          'URGENT: Investigate severe revenue decline. Check payment provider, system outages, and customer activity.',
        threshold: criticalThreshold,
        currentValue: declinePercent,
        cooldownMinutes: 360, // 6 hours
      })
    } else if (declinePercent >= errorThreshold) {
      alerts.push({
        severity: 'ERROR',
        watchdog: 'REVENUE',
        source: 'daily-revenue-decline',
        timestamp: new Date(),
        environment: process.env.NODE_ENV || 'development',
        summary: `Significant daily revenue decline: ${declinePercent.toFixed(1)}% below baseline`,
        details: {
          yesterdayRevenue,
          baseline: baseline.toFixed(2),
          declinePercent: declinePercent.toFixed(2),
          todayRevenue,
          period: 'daily',
        },
        recommendedAction:
          'Investigate revenue decline. Review transaction volume, average order value, and customer activity.',
        threshold: errorThreshold,
        currentValue: declinePercent,
        cooldownMinutes: 1440, // 24 hours
      })
    } else if (declinePercent >= warnThreshold) {
      alerts.push({
        severity: 'WARN',
        watchdog: 'REVENUE',
        source: 'daily-revenue-decline',
        timestamp: new Date(),
        environment: process.env.NODE_ENV || 'development',
        summary: `Daily revenue decline: ${declinePercent.toFixed(1)}% below baseline`,
        details: {
          yesterdayRevenue,
          baseline: baseline.toFixed(2),
          declinePercent: declinePercent.toFixed(2),
          todayRevenue,
          period: 'daily',
        },
        recommendedAction: 'Monitor revenue trends. Review daily metrics for anomalies.',
        threshold: warnThreshold,
        currentValue: declinePercent,
        cooldownMinutes: 1440, // 24 hours
      })
    }

    return alerts
  }

  /**
   * Check weekly revenue decline (compare last 7 days vs previous 7 days)
   */
  private static async checkWeeklyRevenue(): Promise<WatchdogAlert[]> {
    const alerts: WatchdogAlert[] = []

    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

    // Get last 7 days revenue
    const recentRevenue = await this.getRevenueForPeriod(sevenDaysAgo, now)

    // Get previous 7 days revenue (for comparison)
    const previousRevenue = await this.getRevenueForPeriod(fourteenDaysAgo, sevenDaysAgo)

    if (previousRevenue === 0) return alerts // No baseline to compare

    // Calculate decline percentage
    const declinePercent = ((previousRevenue - recentRevenue) / previousRevenue) * 100

    // Thresholds
    const warnThreshold = 10 // 10% decline
    const errorThreshold = 20 // 20% decline
    const criticalThreshold = 35 // 35% decline

    if (declinePercent >= criticalThreshold) {
      alerts.push({
        severity: 'CRITICAL',
        watchdog: 'REVENUE',
        source: 'weekly-revenue-decline',
        timestamp: new Date(),
        environment: process.env.NODE_ENV || 'development',
        summary: `Severe weekly revenue decline: ${declinePercent.toFixed(1)}% below baseline`,
        details: {
          recentRevenue,
          previousRevenue,
          declinePercent: declinePercent.toFixed(2),
          period: 'weekly (7 days)',
        },
        recommendedAction:
          'URGENT: Investigate sustained revenue decline. Review strategic metrics, customer retention, and market conditions.',
        threshold: criticalThreshold,
        currentValue: declinePercent,
        cooldownMinutes: 10080, // 7 days (weekly check)
      })
    } else if (declinePercent >= errorThreshold) {
      alerts.push({
        severity: 'ERROR',
        watchdog: 'REVENUE',
        source: 'weekly-revenue-decline',
        timestamp: new Date(),
        environment: process.env.NODE_ENV || 'development',
        summary: `Significant weekly revenue decline: ${declinePercent.toFixed(1)}% below baseline`,
        details: {
          recentRevenue,
          previousRevenue,
          declinePercent: declinePercent.toFixed(2),
          period: 'weekly (7 days)',
        },
        recommendedAction:
          'Investigate sustained revenue decline. Review customer activity, churn, and product performance.',
        threshold: errorThreshold,
        currentValue: declinePercent,
        cooldownMinutes: 10080, // 7 days
      })
    } else if (declinePercent >= warnThreshold) {
      alerts.push({
        severity: 'WARN',
        watchdog: 'REVENUE',
        source: 'weekly-revenue-decline',
        timestamp: new Date(),
        environment: process.env.NODE_ENV || 'development',
        summary: `Weekly revenue decline: ${declinePercent.toFixed(1)}% below baseline`,
        details: {
          recentRevenue,
          previousRevenue,
          declinePercent: declinePercent.toFixed(2),
          period: 'weekly (7 days)',
        },
        recommendedAction: 'Monitor weekly revenue trends. Review customer acquisition and retention.',
        threshold: warnThreshold,
        currentValue: declinePercent,
        cooldownMinutes: 10080, // 7 days
      })
    }

    return alerts
  }

  /**
   * Check revenue concentration risk (top customer/branch dependency)
   */
  private static async checkRevenueConcentration(): Promise<WatchdogAlert[]> {
    const alerts: WatchdogAlert[] = []

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    // Get total revenue for last 30 days
    const totalRevenue = await this.getRevenueForPeriod(thirtyDaysAgo, new Date())

    if (totalRevenue === 0) return alerts

    // Get top customer revenue (if customerId is tracked)
    // Note: This assumes FinancialLedgerEntry has customerId or similar field
    // Adjust based on actual schema
    const topCustomerRevenue = await prisma.financialLedgerEntry.groupBy({
      by: ['customerId'],
      where: {
        type: 'REVENUE',
        createdAt: {
          gte: thirtyDaysAgo,
        },
        customerId: {
          not: null,
        },
      },
      _sum: {
        amount: true,
      },
      orderBy: {
        _sum: {
          amount: 'desc',
        },
      },
      take: 1,
    })

    if (topCustomerRevenue.length === 0) return alerts

    const topRevenue = topCustomerRevenue[0]._sum.amount || 0
    const concentrationPercent = (topRevenue / totalRevenue) * 100

    // Thresholds
    const warnThreshold = 25 // 25% concentration
    const errorThreshold = 40 // 40% concentration
    const criticalThreshold = 60 // 60% concentration

    if (concentrationPercent >= criticalThreshold) {
      alerts.push({
        severity: 'CRITICAL',
        watchdog: 'REVENUE',
        source: 'revenue-concentration',
        timestamp: new Date(),
        environment: process.env.NODE_ENV || 'development',
        summary: `Severe revenue concentration: ${concentrationPercent.toFixed(1)}% from top customer`,
        details: {
          concentrationPercent: concentrationPercent.toFixed(2),
          topCustomerRevenue: topRevenue,
          totalRevenue,
          period: '30 days',
        },
        recommendedAction:
          'URGENT: High revenue concentration risk. Diversify customer base and reduce dependency.',
        threshold: criticalThreshold,
        currentValue: concentrationPercent,
        cooldownMinutes: 43200, // 30 days (monthly check)
      })
    } else if (concentrationPercent >= errorThreshold) {
      alerts.push({
        severity: 'ERROR',
        watchdog: 'REVENUE',
        source: 'revenue-concentration',
        timestamp: new Date(),
        environment: process.env.NODE_ENV || 'development',
        summary: `High revenue concentration: ${concentrationPercent.toFixed(1)}% from top customer`,
        details: {
          concentrationPercent: concentrationPercent.toFixed(2),
          topCustomerRevenue: topRevenue,
          totalRevenue,
          period: '30 days',
        },
        recommendedAction:
          'Monitor revenue concentration risk. Develop customer diversification strategy.',
        threshold: errorThreshold,
        currentValue: concentrationPercent,
        cooldownMinutes: 43200, // 30 days
      })
    } else if (concentrationPercent >= warnThreshold) {
      alerts.push({
        severity: 'WARN',
        watchdog: 'REVENUE',
        source: 'revenue-concentration',
        timestamp: new Date(),
        environment: process.env.NODE_ENV || 'development',
        summary: `Elevated revenue concentration: ${concentrationPercent.toFixed(1)}% from top customer`,
        details: {
          concentrationPercent: concentrationPercent.toFixed(2),
          topCustomerRevenue: topRevenue,
          totalRevenue,
          period: '30 days',
        },
        recommendedAction: 'Monitor revenue concentration. Consider customer diversification.',
        threshold: warnThreshold,
        currentValue: concentrationPercent,
        cooldownMinutes: 43200, // 30 days
      })
    }

    return alerts
  }

  /**
   * Get total revenue for a period from FinancialLedgerEntry
   */
  private static async getRevenueForPeriod(start: Date, end: Date): Promise<number> {
    const result = await prisma.financialLedgerEntry.aggregate({
      where: {
        type: 'REVENUE',
        createdAt: {
          gte: start,
          lt: end,
        },
      },
      _sum: {
        amount: true,
      },
    })

    return result._sum.amount || 0
  }

  /**
   * Get overall revenue health status for CEO Dashboard
   * Returns: HEALTHY, WARNING, or CRITICAL
   */
  static async getHealth(): Promise<'HEALTHY' | 'WARNING' | 'CRITICAL'> {
    try {
      // Check MRR decline
      const currentMonthStart = startOfMonth(new Date())
      const lastMonthStart = startOfMonth(subDays(new Date(), 30))

      const [currentMRR, lastMRR] = await Promise.all([
        prisma.financialLedgerEntry.aggregate({
          where: {
            eventType: 'SUBSCRIPTION_CHARGE',
            occurredAt: { gte: currentMonthStart }
          },
          _sum: { amountCents: true }
        }),
        prisma.financialLedgerEntry.aggregate({
          where: {
            eventType: 'SUBSCRIPTION_CHARGE',
            occurredAt: { gte: lastMonthStart, lte: currentMonthStart }
          },
          _sum: { amountCents: true }
        })
      ])

      const mrr = (currentMRR._sum.amountCents || 0) / 100
      const lastMrr = (lastMRR._sum.amountCents || 0) / 100
      const mrrChange = lastMrr > 0 ? ((mrr - lastMrr) / lastMrr) * 100 : 0

      // Determine health status
      if (mrrChange < -10) return 'CRITICAL'
      if (mrrChange < -5) return 'WARNING'
      return 'HEALTHY'
    } catch (error) {
      console.error('Error getting revenue health:', error)
      return 'CRITICAL'
    }
  }
}
