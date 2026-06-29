/**
 * Subscription Watchdog v1
 * Monitors subscription health, grace period aging, and churn risks
 */

import { prisma } from '@/lib/prisma'
import { AlertDeliveryService } from '../alert-delivery.service'
import { CooldownService } from './cooldown.service'
import type { WatchdogAlert, WatchdogResult } from './types'

export class SubscriptionWatchdogService {
  /**
   * Run Subscription Watchdog checks
   */
  static async run(): Promise<WatchdogResult> {
    const startTime = Date.now()
    const alerts: WatchdogAlert[] = []
    const errors: string[] = []

    try {
      // Check 1: Grace period aging
      const graceAlerts = await this.checkGracePeriodAging()
      alerts.push(...graceAlerts)

      // Check 2: Failed renewals
      const renewalAlerts = await this.checkFailedRenewals()
      alerts.push(...renewalAlerts)

      // Check 3: Churn spike detection
      const churnAlerts = await this.checkChurnSpike()
      alerts.push(...churnAlerts)

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
      console.error('[SubscriptionWatchdog] Execution error:', error)
    }

    return {
      watchdog: 'SUBSCRIPTION',
      executedAt: new Date(),
      duration: Date.now() - startTime,
      alertsGenerated: alerts.length,
      errors: errors.length > 0 ? errors : undefined,
    }
  }

  /**
   * Check grace period aging (3-day, 7-day, 14-day milestones)
   */
  private static async checkGracePeriodAging(): Promise<WatchdogAlert[]> {
    const alerts: WatchdogAlert[] = []

    // Get subscriptions in grace period
    const graceSubscriptions = await prisma.subscription.findMany({
      where: {
        status: {
          in: ['GRACE', 'PAST_DUE'],
        },
      },
      select: {
        id: true,
        status: true,
        currentPeriodEnd: true,
        plan: {
          select: {
            name: true,
            price: true,
          },
        },
      },
    })

    if (graceSubscriptions.length === 0) return alerts

    const now = Date.now()
    const threeDayAgo = now - 3 * 24 * 60 * 60 * 1000
    const sevenDayAgo = now - 7 * 24 * 60 * 60 * 1000
    const fourteenDayAgo = now - 14 * 24 * 60 * 60 * 1000

    // Count subscriptions by aging milestone
    const aging3Days = graceSubscriptions.filter(
      (s) => s.currentPeriodEnd && s.currentPeriodEnd.getTime() < threeDayAgo
    )
    const aging7Days = graceSubscriptions.filter(
      (s) => s.currentPeriodEnd && s.currentPeriodEnd.getTime() < sevenDayAgo
    )
    const aging14Days = graceSubscriptions.filter(
      (s) => s.currentPeriodEnd && s.currentPeriodEnd.getTime() < fourteenDayAgo
    )

    // Calculate revenue at risk
    const revenueAtRisk3Day = aging3Days.reduce((sum, s) => sum + (s.plan?.price || 0), 0)
    const revenueAtRisk7Day = aging7Days.reduce((sum, s) => sum + (s.plan?.price || 0), 0)
    const revenueAtRisk14Day = aging14Days.reduce((sum, s) => sum + (s.plan?.price || 0), 0)

    // Alert on 14-day aging (CRITICAL - likely to churn)
    if (aging14Days.length > 0) {
      alerts.push({
        severity: 'CRITICAL',
        watchdog: 'SUBSCRIPTION',
        source: 'grace-aging-14d',
        timestamp: new Date(),
        environment: process.env.NODE_ENV || 'development',
        summary: `${aging14Days.length} subscriptions in grace ≥14 days (high churn risk)`,
        details: {
          count: aging14Days.length,
          agingMilestone: '14 days',
          revenueAtRisk: revenueAtRisk14Day,
          subscriptionIds: aging14Days.map((s) => s.id).slice(0, 10), // First 10
        },
        recommendedAction:
          'URGENT: High churn risk. Initiate rescue campaigns immediately. Review payment failure reasons.',
        currentValue: aging14Days.length,
        cooldownMinutes: 360, // 6 hours
      })
    }

    // Alert on 7-day aging (ERROR - intervention needed)
    if (aging7Days.length > 5) {
      alerts.push({
        severity: 'ERROR',
        watchdog: 'SUBSCRIPTION',
        source: 'grace-aging-7d',
        timestamp: new Date(),
        environment: process.env.NODE_ENV || 'development',
        summary: `${aging7Days.length} subscriptions in grace ≥7 days`,
        details: {
          count: aging7Days.length,
          agingMilestone: '7 days',
          revenueAtRisk: revenueAtRisk7Day,
          subscriptionIds: aging7Days.map((s) => s.id).slice(0, 10),
        },
        recommendedAction:
          'Initiate rescue campaigns. Review payment retry logic and customer communication.',
        threshold: 5,
        currentValue: aging7Days.length,
        cooldownMinutes: 360, // 6 hours
      })
    }

    // Alert on 3-day aging (WARN - early warning)
    if (aging3Days.length > 10) {
      alerts.push({
        severity: 'WARN',
        watchdog: 'SUBSCRIPTION',
        source: 'grace-aging-3d',
        timestamp: new Date(),
        environment: process.env.NODE_ENV || 'development',
        summary: `${aging3Days.length} subscriptions in grace ≥3 days`,
        details: {
          count: aging3Days.length,
          agingMilestone: '3 days',
          revenueAtRisk: revenueAtRisk3Day,
        },
        recommendedAction:
          'Monitor grace period subscriptions. Prepare rescue campaigns if aging continues.',
        threshold: 10,
        currentValue: aging3Days.length,
        cooldownMinutes: 1440, // 24 hours
      })
    }

    return alerts
  }

  /**
   * Check failed renewals (last 24 hours)
   */
  private static async checkFailedRenewals(): Promise<WatchdogAlert[]> {
    const alerts: WatchdogAlert[] = []
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

    // Count subscriptions that failed renewal in last 24h
    // Assuming status changed to GRACE/PAST_DUE recently
    const failedRenewals = await prisma.subscription.count({
      where: {
        status: {
          in: ['GRACE', 'PAST_DUE'],
        },
        updatedAt: {
          gte: oneDayAgo,
        },
      },
    })

    // Thresholds
    const warnThreshold = 5
    const errorThreshold = 15

    if (failedRenewals >= errorThreshold) {
      alerts.push({
        severity: 'ERROR',
        watchdog: 'SUBSCRIPTION',
        source: 'failed-renewals',
        timestamp: new Date(),
        environment: process.env.NODE_ENV || 'development',
        summary: `High renewal failure rate: ${failedRenewals} in last 24h`,
        details: {
          failedRenewals,
          window: '24 hours',
          threshold: errorThreshold,
        },
        recommendedAction:
          'Investigate renewal payment failures. Check payment provider health and retry logic.',
        threshold: errorThreshold,
        currentValue: failedRenewals,
        cooldownMinutes: 360, // 6 hours
      })
    } else if (failedRenewals >= warnThreshold) {
      alerts.push({
        severity: 'WARN',
        watchdog: 'SUBSCRIPTION',
        source: 'failed-renewals',
        timestamp: new Date(),
        environment: process.env.NODE_ENV || 'development',
        summary: `Elevated renewal failures: ${failedRenewals} in last 24h`,
        details: {
          failedRenewals,
          window: '24 hours',
          threshold: warnThreshold,
        },
        recommendedAction: 'Monitor renewal failure rate. Review payment error codes and patterns.',
        threshold: warnThreshold,
        currentValue: failedRenewals,
        cooldownMinutes: 1440, // 24 hours
      })
    }

    return alerts
  }

  /**
   * Check churn spike (last 7 days vs previous 7 days)
   */
  private static async checkChurnSpike(): Promise<WatchdogAlert[]> {
    const alerts: WatchdogAlert[] = []

    const now = Date.now()
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000)
    const fourteenDaysAgo = new Date(now - 14 * 24 * 60 * 60 * 1000)

    // Count cancellations in last 7 days
    const recentCancellations = await prisma.subscription.count({
      where: {
        status: 'CANCELLED',
        updatedAt: {
          gte: sevenDaysAgo,
        },
      },
    })

    // Count cancellations in previous 7 days (for comparison)
    const previousCancellations = await prisma.subscription.count({
      where: {
        status: 'CANCELLED',
        updatedAt: {
          gte: fourteenDaysAgo,
          lt: sevenDaysAgo,
        },
      },
    })

    // Calculate churn spike (2× or 3× baseline)
    const baseline = previousCancellations || 1 // Avoid division by zero
    const spikeRatio = recentCancellations / baseline

    // Thresholds
    const warnThreshold = 2 // 2× baseline
    const criticalThreshold = 3 // 3× baseline

    if (spikeRatio >= criticalThreshold && recentCancellations > 5) {
      alerts.push({
        severity: 'CRITICAL',
        watchdog: 'SUBSCRIPTION',
        source: 'churn-spike',
        timestamp: new Date(),
        environment: process.env.NODE_ENV || 'development',
        summary: `Churn spike detected: ${recentCancellations} cancellations (${spikeRatio.toFixed(1)}× baseline)`,
        details: {
          recentCancellations,
          previousCancellations,
          spikeRatio: spikeRatio.toFixed(2),
          window: '7 days',
        },
        recommendedAction:
          'URGENT: Investigate churn spike. Review customer feedback, product issues, and competitive threats.',
        threshold: criticalThreshold,
        currentValue: spikeRatio,
        cooldownMinutes: 1440, // 24 hours
      })
    } else if (spikeRatio >= warnThreshold && recentCancellations > 3) {
      alerts.push({
        severity: 'WARN',
        watchdog: 'SUBSCRIPTION',
        source: 'churn-spike',
        timestamp: new Date(),
        environment: process.env.NODE_ENV || 'development',
        summary: `Elevated churn rate: ${recentCancellations} cancellations (${spikeRatio.toFixed(1)}× baseline)`,
        details: {
          recentCancellations,
          previousCancellations,
          spikeRatio: spikeRatio.toFixed(2),
          window: '7 days',
        },
        recommendedAction: 'Monitor churn rate. Review cancellation reasons and customer satisfaction.',
        threshold: warnThreshold,
        currentValue: spikeRatio,
        cooldownMinutes: 10080, // 7 days (weekly check)
      })
    }

    return alerts
  }

  /**
   * Get overall subscription health status for CEO Dashboard
   * Returns: HEALTHY, WARNING, or CRITICAL
   */
  static async getHealth(): Promise<'HEALTHY' | 'WARNING' | 'CRITICAL'> {
    try {
      // Check grace period count
      const gracePeriodCount = await prisma.subscription.count({
        where: { status: 'GRACE_PERIOD' }
      })

      const totalActive = await prisma.subscription.count({
        where: { status: { in: ['ACTIVE', 'GRACE_PERIOD'] } }
      })

      const gracePeriodPercent = totalActive > 0 ? (gracePeriodCount / totalActive) * 100 : 0

      // Determine health status
      if (gracePeriodPercent > 20 || gracePeriodCount > 50) return 'CRITICAL'
      if (gracePeriodPercent > 10 || gracePeriodCount > 20) return 'WARNING'
      return 'HEALTHY'
    } catch (error) {
      console.error('Error getting subscription health:', error)
      return 'CRITICAL'
    }
  }
}
