/**
 * Customer Watchdog v1
 * Monitors customer health, dormancy, and churn risks
 */

import { prisma } from '@/lib/prisma'
import { AlertDeliveryService } from '../alert-delivery.service'
import { CooldownService } from './cooldown.service'
import { SuppressionService } from './suppression.service'
import type { WatchdogAlert, WatchdogResult } from './types'
import { subDays } from 'date-fns'

export class CustomerWatchdogService {
  /**
   * Run Customer Watchdog checks
   */
  static async run(): Promise<WatchdogResult> {
    const startTime = Date.now()
    const alerts: WatchdogAlert[] = []
    const errors: string[] = []

    try {
      // Check 1: High-value customer dormancy
      const dormancyAlerts = await this.checkHighValueDormancy()
      alerts.push(...dormancyAlerts)

      // Check 2: Rapid activity decline
      const declineAlerts = await this.checkActivityDecline()
      alerts.push(...declineAlerts)

      // Check 3: Churn risk signals
      const churnAlerts = await this.checkChurnRiskSignals()
      alerts.push(...churnAlerts)

      // Deliver alerts (with cooldown and suppression)
      for (const alert of alerts) {
        // Check suppression first
        const suppression = await SuppressionService.shouldSuppress(
          alert.watchdog,
          alert.severity,
          alert.source
        )

        if (suppression.suppressed) {
          console.log(`[CustomerWatchdog] Alert suppressed: ${alert.source} - ${suppression.reason}`)
          continue
        }

        // Check cooldown
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
      console.error('[CustomerWatchdog] Execution error:', error)
    }

    return {
      watchdog: 'CUSTOMER',
      executedAt: new Date(),
      duration: Date.now() - startTime,
      alertsGenerated: alerts.length,
      errors: errors.length > 0 ? errors : undefined,
    }
  }

  /**
   * Check high-value customer dormancy
   * High-value = top 20% by lifetime spend
   */
  private static async checkHighValueDormancy(): Promise<WatchdogAlert[]> {
    const alerts: WatchdogAlert[] = []

    // Define dormancy thresholds
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)

    // Get all customers with their lifetime spend
    const allCustomers = await prisma.customer.findMany({
      select: {
        id: true,
        name: true,
        lifetimeSpendCents: true,
        lastVisit: true,
        businessId: true,
      },
      orderBy: {
        lifetimeSpendCents: 'desc',
      },
    })

    if (allCustomers.length === 0) return alerts

    // Calculate top 20% threshold
    const top20Index = Math.floor(allCustomers.length * 0.2)
    const highValueCustomers = allCustomers.slice(0, Math.max(top20Index, 10)) // At least 10 customers

    // Check dormancy for high-value customers
    const dormant30Days = highValueCustomers.filter(
      (c) => c.lastVisit && c.lastVisit < thirtyDaysAgo
    )
    const dormant60Days = highValueCustomers.filter(
      (c) => c.lastVisit && c.lastVisit < sixtyDaysAgo
    )
    const dormant90Days = highValueCustomers.filter(
      (c) => c.lastVisit && c.lastVisit < ninetyDaysAgo
    )

    // Calculate revenue at risk
    const revenueAtRisk30 = dormant30Days.reduce((sum, c) => sum + c.lifetimeSpendCents, 0)
    const revenueAtRisk60 = dormant60Days.reduce((sum, c) => sum + c.lifetimeSpendCents, 0)
    const revenueAtRisk90 = dormant90Days.reduce((sum, c) => sum + c.lifetimeSpendCents, 0)

    // Alert on 90-day dormancy (CRITICAL - likely churned)
    if (dormant90Days.length > 0) {
      alerts.push({
        severity: 'CRITICAL',
        watchdog: 'CUSTOMER',
        source: 'high-value-dormancy-90d',
        timestamp: new Date(),
        environment: process.env.NODE_ENV || 'development',
        summary: `${dormant90Days.length} high-value customers dormant ≥90 days`,
        details: {
          count: dormant90Days.length,
          dormancyThreshold: '90 days',
          revenueAtRisk: revenueAtRisk90,
          customerIds: dormant90Days.map((c) => c.id).slice(0, 10),
        },
        recommendedAction:
          'URGENT: High-value customers likely churned. Initiate win-back campaigns immediately.',
        currentValue: dormant90Days.length,
        cooldownMinutes: 10080, // 7 days
      })
    }

    // Alert on 60-day dormancy (ERROR - intervention needed)
    if (dormant60Days.length > 3) {
      alerts.push({
        severity: 'ERROR',
        watchdog: 'CUSTOMER',
        source: 'high-value-dormancy-60d',
        timestamp: new Date(),
        environment: process.env.NODE_ENV || 'development',
        summary: `${dormant60Days.length} high-value customers dormant ≥60 days`,
        details: {
          count: dormant60Days.length,
          dormancyThreshold: '60 days',
          revenueAtRisk: revenueAtRisk60,
          customerIds: dormant60Days.map((c) => c.id).slice(0, 10),
        },
        recommendedAction:
          'Initiate re-engagement campaigns. Review customer satisfaction and service quality.',
        threshold: 3,
        currentValue: dormant60Days.length,
        cooldownMinutes: 10080, // 7 days
      })
    }

    // Alert on 30-day dormancy (WARN - early warning)
    if (dormant30Days.length > 5) {
      alerts.push({
        severity: 'WARN',
        watchdog: 'CUSTOMER',
        source: 'high-value-dormancy-30d',
        timestamp: new Date(),
        environment: process.env.NODE_ENV || 'development',
        summary: `${dormant30Days.length} high-value customers dormant ≥30 days`,
        details: {
          count: dormant30Days.length,
          dormancyThreshold: '30 days',
          revenueAtRisk: revenueAtRisk30,
        },
        recommendedAction:
          'Monitor high-value customer engagement. Prepare re-engagement campaigns.',
        threshold: 5,
        currentValue: dormant30Days.length,
        cooldownMinutes: 10080, // 7 days
      })
    }

    return alerts
  }

  /**
   * Check rapid activity decline (visit count drop)
   */
  private static async checkActivityDecline(): Promise<WatchdogAlert[]> {
    const alerts: WatchdogAlert[] = []

    // Get customers with recent activity
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)

    // Count sales per customer in last 30 days vs previous 30 days
    const recentSales = await prisma.sale.groupBy({
      by: ['customerId'],
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
        customerId: {
          not: null,
        },
      },
      _count: {
        id: true,
      },
    })

    const previousSales = await prisma.sale.groupBy({
      by: ['customerId'],
      where: {
        createdAt: {
          gte: sixtyDaysAgo,
          lt: thirtyDaysAgo,
        },
        customerId: {
          not: null,
        },
      },
      _count: {
        id: true,
      },
    })

    // Create maps for comparison
    const recentMap = new Map(recentSales.map((s) => [s.customerId, s._count.id]))
    const previousMap = new Map(previousSales.map((s) => [s.customerId, s._count.id]))

    // Find customers with significant decline (>50% drop)
    const decliningCustomers: Array<{ customerId: string; decline: number }> = []

    for (const [customerId, previousCount] of previousMap.entries()) {
      const recentCount = recentMap.get(customerId) || 0
      const declinePercent = ((previousCount - recentCount) / previousCount) * 100

      if (declinePercent >= 50 && previousCount >= 3) {
        // Only alert if they had meaningful activity (≥3 visits)
        decliningCustomers.push({ customerId: customerId!, decline: declinePercent })
      }
    }

    // Alert if significant number of customers declining
    if (decliningCustomers.length > 10) {
      alerts.push({
        severity: 'ERROR',
        watchdog: 'CUSTOMER',
        source: 'activity-decline',
        timestamp: new Date(),
        environment: process.env.NODE_ENV || 'development',
        summary: `${decliningCustomers.length} customers with ≥50% activity decline`,
        details: {
          count: decliningCustomers.length,
          declineThreshold: '50%',
          period: '30 days vs previous 30 days',
          topDecliners: decliningCustomers.slice(0, 10),
        },
        recommendedAction:
          'Investigate customer satisfaction issues. Review service quality and competitive threats.',
        threshold: 10,
        currentValue: decliningCustomers.length,
        cooldownMinutes: 10080, // 7 days
      })
    } else if (decliningCustomers.length > 5) {
      alerts.push({
        severity: 'WARN',
        watchdog: 'CUSTOMER',
        source: 'activity-decline',
        timestamp: new Date(),
        environment: process.env.NODE_ENV || 'development',
        summary: `${decliningCustomers.length} customers with ≥50% activity decline`,
        details: {
          count: decliningCustomers.length,
          declineThreshold: '50%',
          period: '30 days vs previous 30 days',
        },
        recommendedAction: 'Monitor customer engagement trends. Review customer feedback.',
        threshold: 5,
        currentValue: decliningCustomers.length,
        cooldownMinutes: 10080, // 7 days
      })
    }

    return alerts
  }

  /**
   * Check churn risk signals (failed payments, grace period, etc.)
   */
  private static async checkChurnRiskSignals(): Promise<WatchdogAlert[]> {
    const alerts: WatchdogAlert[] = []

    // Get customers with failed payments in last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const failedPayments = await prisma.paymentTransaction.findMany({
      where: {
        status: 'FAILED',
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      select: {
        businessId: true,
        amountCents: true,
      },
    })

    // Group by business to identify customers with payment issues
    const businessFailures = new Map<string, number>()
    let totalRevenueAtRisk = 0

    for (const payment of failedPayments) {
      businessFailures.set(
        payment.businessId,
        (businessFailures.get(payment.businessId) || 0) + 1
      )
      totalRevenueAtRisk += payment.amountCents
    }

    const customersAtRisk = businessFailures.size

    // Alert on high number of customers with payment failures
    if (customersAtRisk > 20) {
      alerts.push({
        severity: 'ERROR',
        watchdog: 'CUSTOMER',
        source: 'churn-risk-payment-failures',
        timestamp: new Date(),
        environment: process.env.NODE_ENV || 'development',
        summary: `${customersAtRisk} customers with failed payments (churn risk)`,
        details: {
          customersAtRisk,
          failedPaymentCount: failedPayments.length,
          revenueAtRisk: totalRevenueAtRisk,
          period: '7 days',
        },
        recommendedAction:
          'Investigate payment failure patterns. Review payment provider health and customer communication.',
        threshold: 20,
        currentValue: customersAtRisk,
        cooldownMinutes: 1440, // 24 hours
      })
    } else if (customersAtRisk > 10) {
      alerts.push({
        severity: 'WARN',
        watchdog: 'CUSTOMER',
        source: 'churn-risk-payment-failures',
        timestamp: new Date(),
        environment: process.env.NODE_ENV || 'development',
        summary: `${customersAtRisk} customers with failed payments (churn risk)`,
        details: {
          customersAtRisk,
          failedPaymentCount: failedPayments.length,
          revenueAtRisk: totalRevenueAtRisk,
          period: '7 days',
        },
        recommendedAction: 'Monitor payment failure trends. Prepare customer support outreach.',
        threshold: 10,
        currentValue: customersAtRisk,
        cooldownMinutes: 1440, // 24 hours
      })
    }

    return alerts
  }

  /**
   * Get overall customer health status for CEO Dashboard
   * Returns: HEALTHY, WARNING, or CRITICAL
   */
  static async getHealth(): Promise<'HEALTHY' | 'WARNING' | 'CRITICAL'> {
    try {
      // Check dormant customer rate
      const totalCustomers = await prisma.customer.count()
      const dormantCustomers = await prisma.customer.count({
        where: {
          lastVisit: { lte: subDays(new Date(), 30) }
        }
      })

      const dormantRate = totalCustomers > 0 ? (dormantCustomers / totalCustomers) * 100 : 0

      // Determine health status
      if (dormantRate > 50) return 'CRITICAL'
      if (dormantRate > 30) return 'WARNING'
      return 'HEALTHY'
    } catch (error) {
      console.error('Error getting customer health:', error)
      return 'CRITICAL'
    }
  }
}
