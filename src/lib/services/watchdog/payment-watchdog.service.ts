/**
 * Payment Watchdog v1
 * Monitors payment provider failures, webhook validation, and processing errors
 */

import { prisma } from '@/lib/prisma'
import { AlertDeliveryService } from '../alert-delivery.service'
import { CooldownService } from './cooldown.service'
import { SuppressionService } from './suppression.service'
import type { WatchdogAlert, WatchdogResult } from './types'

export class PaymentWatchdogService {
  /**
   * Run Payment Watchdog checks
   */
  static async run(): Promise<WatchdogResult> {
    const startTime = Date.now()
    const alerts: WatchdogAlert[] = []
    const errors: string[] = []

    try {
      // Check 1: Provider failure rate (1-hour rolling window)
      const providerFailureAlerts = await this.checkProviderFailureRate()
      alerts.push(...providerFailureAlerts)

      // Check 2: Webhook validation failures
      const webhookAlerts = await this.checkWebhookValidationFailures()
      alerts.push(...webhookAlerts)

      // Check 3: Payment latency (p95)
      const latencyAlerts = await this.checkPaymentLatency()
      alerts.push(...latencyAlerts)

      // Deliver alerts (with cooldown and suppression)
      for (const alert of alerts) {
        // Check suppression first
        const suppression = await SuppressionService.shouldSuppress(
          alert.watchdog,
          alert.severity,
          alert.source
        )

        if (suppression.suppressed) {
          console.log(`[PaymentWatchdog] Alert suppressed: ${alert.source} - ${suppression.reason}`)
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
          
          // Register as root cause if CRITICAL or ERROR
          if (alert.severity === 'CRITICAL' || alert.severity === 'ERROR') {
            await SuppressionService.registerRootCause(alert.watchdog, alert.severity)
          }
        }
      }
    } catch (error: any) {
      errors.push(error?.message || String(error))
      console.error('[PaymentWatchdog] Execution error:', error)
    }

    return {
      watchdog: 'PAYMENT',
      executedAt: new Date(),
      duration: Date.now() - startTime,
      alertsGenerated: alerts.length,
      errors: errors.length > 0 ? errors : undefined,
    }
  }

  /**
   * Check provider failure rate (1-hour rolling window)
   */
  private static async checkProviderFailureRate(): Promise<WatchdogAlert[]> {
    const alerts: WatchdogAlert[] = []
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

    // Get payment transactions in last hour by provider
    const providers = ['INTOUCH', 'IREMBOPAY']

    for (const provider of providers) {
      const transactions = await prisma.paymentTransaction.findMany({
        where: {
          provider,
          createdAt: { gte: oneHourAgo },
        },
        select: {
          status: true,
        },
      })

      if (transactions.length === 0) continue

      const total = transactions.length
      const failed = transactions.filter((t) => t.status === 'FAILED').length
      const failureRate = (failed / total) * 100

      // Thresholds
      const warnThreshold = 1 // 1%
      const errorThreshold = 3 // 3%
      const criticalThreshold = 10 // 10%

      if (failureRate >= criticalThreshold) {
        alerts.push({
          severity: 'CRITICAL',
          watchdog: 'PAYMENT',
          source: `provider-failure-${provider}`,
          timestamp: new Date(),
          environment: process.env.NODE_ENV || 'development',
          summary: `${provider} payment failure rate CRITICAL: ${failureRate.toFixed(1)}%`,
          details: {
            provider,
            failureRate: failureRate.toFixed(2),
            failed,
            total,
            window: '1 hour',
          },
          recommendedAction: `Investigate ${provider} provider health immediately. Consider failover if sustained.`,
          threshold: criticalThreshold,
          currentValue: failureRate,
          cooldownMinutes: 5,
        })
      } else if (failureRate >= errorThreshold) {
        alerts.push({
          severity: 'ERROR',
          watchdog: 'PAYMENT',
          source: `provider-failure-${provider}`,
          timestamp: new Date(),
          environment: process.env.NODE_ENV || 'development',
          summary: `${provider} payment failure rate elevated: ${failureRate.toFixed(1)}%`,
          details: {
            provider,
            failureRate: failureRate.toFixed(2),
            failed,
            total,
            window: '1 hour',
          },
          recommendedAction: `Monitor ${provider} provider closely. Review error codes and patterns.`,
          threshold: errorThreshold,
          currentValue: failureRate,
          cooldownMinutes: 15,
        })
      } else if (failureRate >= warnThreshold) {
        alerts.push({
          severity: 'WARN',
          watchdog: 'PAYMENT',
          source: `provider-failure-${provider}`,
          timestamp: new Date(),
          environment: process.env.NODE_ENV || 'development',
          summary: `${provider} payment failure rate above baseline: ${failureRate.toFixed(1)}%`,
          details: {
            provider,
            failureRate: failureRate.toFixed(2),
            failed,
            total,
            window: '1 hour',
          },
          recommendedAction: `Review ${provider} error logs for patterns. Early warning signal.`,
          threshold: warnThreshold,
          currentValue: failureRate,
          cooldownMinutes: 30,
        })
      }
    }

    return alerts
  }

  /**
   * Check webhook validation failures
   */
  private static async checkWebhookValidationFailures(): Promise<WatchdogAlert[]> {
    const alerts: WatchdogAlert[] = []
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

    // Check for webhook validation failures (webhookVerified = false)
    const failedWebhooks = await prisma.paymentTransaction.count({
      where: {
        createdAt: { gte: oneHourAgo },
        webhookVerified: false,
        status: { not: 'PENDING' }, // Exclude pending (not yet received webhook)
      },
    })

    if (failedWebhooks > 0) {
      alerts.push({
        severity: 'ERROR',
        watchdog: 'PAYMENT',
        source: 'webhook-validation',
        timestamp: new Date(),
        environment: process.env.NODE_ENV || 'development',
        summary: `Webhook validation failures detected: ${failedWebhooks} in last hour`,
        details: {
          failedCount: failedWebhooks,
          window: '1 hour',
        },
        recommendedAction: 'Check webhook signature validation logic. Verify provider webhook configuration.',
        currentValue: failedWebhooks,
        cooldownMinutes: 60,
      })
    }

    return alerts
  }

  /**
   * Check payment latency (p95)
   * Note: This is a simplified version. Full implementation would calculate p95 from timestamps.
   */
  private static async checkPaymentLatency(): Promise<WatchdogAlert[]> {
    const alerts: WatchdogAlert[] = []
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

    // Get completed payments with timestamps
    const payments = await prisma.paymentTransaction.findMany({
      where: {
        createdAt: { gte: oneHourAgo },
        status: 'PAID',
        paidAt: { not: null },
      },
      select: {
        createdAt: true,
        paidAt: true,
      },
    })

    if (payments.length < 10) return alerts // Need sufficient sample

    // Calculate latencies in seconds
    const latencies = payments
      .map((p) => {
        if (!p.paidAt) return null
        return (p.paidAt.getTime() - p.createdAt.getTime()) / 1000
      })
      .filter((l): l is number => l !== null)
      .sort((a, b) => a - b)

    if (latencies.length === 0) return alerts

    // Calculate p95
    const p95Index = Math.floor(latencies.length * 0.95)
    const p95Latency = latencies[p95Index]

    // Threshold: 2× expected SLA (assume 30s SLA, so 60s threshold)
    const slaThreshold = 60 // seconds

    if (p95Latency > slaThreshold) {
      alerts.push({
        severity: 'WARN',
        watchdog: 'PAYMENT',
        source: 'payment-latency',
        timestamp: new Date(),
        environment: process.env.NODE_ENV || 'development',
        summary: `Payment latency p95 exceeds SLA: ${p95Latency.toFixed(1)}s`,
        details: {
          p95Latency: p95Latency.toFixed(2),
          slaThreshold,
          sampleSize: latencies.length,
          window: '1 hour',
        },
        recommendedAction: 'Review provider performance. Check for network issues or provider degradation.',
        threshold: slaThreshold,
        currentValue: p95Latency,
        cooldownMinutes: 60,
      })
    }

    return alerts
  }

  /**
   * Get overall payment health status for CEO Dashboard
   * Returns: HEALTHY, WARNING, or CRITICAL
   */
  static async getHealth(): Promise<'HEALTHY' | 'WARNING' | 'CRITICAL'> {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

      // Get payment success rate
      const payments = await prisma.paymentTransaction.groupBy({
        by: ['status'],
        where: {
          createdAt: { gte: oneHourAgo }
        },
        _count: true
      })

      const total = payments.reduce((sum, p) => sum + p._count, 0)
      if (total === 0) return 'HEALTHY' // No payments = no issues

      const successful = payments.find(p => p.status === 'SUCCESS')?._count || 0
      const successRate = (successful / total) * 100

      // Check provider failure rate
      const failureRate = await this.getFailureRate()

      // Determine health status
      if (successRate < 90 || failureRate > 10) return 'CRITICAL'
      if (successRate < 95 || failureRate > 3) return 'WARNING'
      return 'HEALTHY'
    } catch (error) {
      console.error('Error getting payment health:', error)
      return 'CRITICAL'
    }
  }

  /**
   * Get provider failure rate for CEO Dashboard
   */
  static async getFailureRate(): Promise<number> {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

      const payments = await prisma.paymentTransaction.groupBy({
        by: ['status'],
        where: {
          createdAt: { gte: oneHourAgo }
        },
        _count: true
      })

      const total = payments.reduce((sum, p) => sum + p._count, 0)
      if (total === 0) return 0

      const failed = payments.find(p => p.status === 'FAILED')?._count || 0
      return (failed / total) * 100
    } catch (error) {
      console.error('Error getting failure rate:', error)
      return 0
    }
  }
}
