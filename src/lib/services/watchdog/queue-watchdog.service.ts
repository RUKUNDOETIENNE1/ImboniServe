/**
 * Queue Watchdog v1
 * Monitors queue backlog, DLQ events, and worker health
 */

import {
  extractQueue,
  intelligenceQueue,
  extractDLQ,
  intelligenceDLQ,
  getQueueMetrics,
  getIntelligenceQueueMetrics,
} from '@/lib/die/queue/queues'
import { AlertDeliveryService } from '../alert-delivery.service'
import { CooldownService } from './cooldown.service'
import { SuppressionService } from './suppression.service'
import type { WatchdogAlert, WatchdogResult } from './types'

export class QueueWatchdogService {
  /**
   * Run Queue Watchdog checks
   */
  static async run(): Promise<WatchdogResult> {
    const startTime = Date.now()
    const alerts: WatchdogAlert[] = []
    const errors: string[] = []

    try {
      // Check 1: DLQ events
      const dlqAlerts = await this.checkDLQEvents()
      alerts.push(...dlqAlerts)

      // Check 2: Backlog growth
      const backlogAlerts = await this.checkBacklogGrowth()
      alerts.push(...backlogAlerts)

      // Check 3: Queue stall detection
      const stallAlerts = await this.checkQueueStall()
      alerts.push(...stallAlerts)

      // Deliver alerts (with cooldown and suppression)
      for (const alert of alerts) {
        // Check suppression first
        const suppression = await SuppressionService.shouldSuppress(
          alert.watchdog,
          alert.severity,
          alert.source
        )

        if (suppression.suppressed) {
          console.log(`[QueueWatchdog] Alert suppressed: ${alert.source} - ${suppression.reason}`)
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
          
          // Register as root cause if CRITICAL
          if (alert.severity === 'CRITICAL') {
            await SuppressionService.registerRootCause(alert.watchdog, alert.severity)
          }
        }
      }
    } catch (error: any) {
      errors.push(error?.message || String(error))
      console.error('[QueueWatchdog] Execution error:', error)
    }

    return {
      watchdog: 'QUEUE',
      executedAt: new Date(),
      duration: Date.now() - startTime,
      alertsGenerated: alerts.length,
      errors: errors.length > 0 ? errors : undefined,
    }
  }

  /**
   * Check DLQ events
   */
  private static async checkDLQEvents(): Promise<WatchdogAlert[]> {
    const alerts: WatchdogAlert[] = []

    // Check extract DLQ
    const extractDLQCount = await extractDLQ.count()
    if (extractDLQCount > 0) {
      const severity = extractDLQCount > 3 ? 'ERROR' : 'WARN'
      alerts.push({
        severity,
        watchdog: 'QUEUE',
        source: 'dlq-extract',
        timestamp: new Date(),
        environment: process.env.NODE_ENV || 'development',
        summary: `Extract DLQ has ${extractDLQCount} failed jobs`,
        details: {
          queue: 'die_extract_dlq',
          count: extractDLQCount,
        },
        recommendedAction:
          extractDLQCount > 3
            ? 'Investigate DLQ jobs immediately. Check for systemic failures.'
            : 'Review DLQ jobs. May be transient failures.',
        currentValue: extractDLQCount,
        cooldownMinutes: severity === 'ERROR' ? 30 : 60,
      })
    }

    // Check intelligence DLQ
    const intelligenceDLQCount = await intelligenceDLQ.count()
    if (intelligenceDLQCount > 0) {
      const severity = intelligenceDLQCount > 3 ? 'ERROR' : 'WARN'
      alerts.push({
        severity,
        watchdog: 'QUEUE',
        source: 'dlq-intelligence',
        timestamp: new Date(),
        environment: process.env.NODE_ENV || 'development',
        summary: `Intelligence DLQ has ${intelligenceDLQCount} failed jobs`,
        details: {
          queue: 'die_intelligence_dlq',
          count: intelligenceDLQCount,
        },
        recommendedAction:
          intelligenceDLQCount > 3
            ? 'Investigate DLQ jobs immediately. Check for systemic failures.'
            : 'Review DLQ jobs. May be transient failures.',
        currentValue: intelligenceDLQCount,
        cooldownMinutes: severity === 'ERROR' ? 30 : 60,
      })
    }

    return alerts
  }

  /**
   * Check backlog growth
   */
  private static async checkBacklogGrowth(): Promise<WatchdogAlert[]> {
    const alerts: WatchdogAlert[] = []

    // Check extract queue backlog
    const extractWaiting = await extractQueue.getWaitingCount()
    const extractActive = await extractQueue.getActiveCount()
    const extractBacklog = extractWaiting + extractActive

    if (extractBacklog > 100) {
      const severity = extractBacklog > 500 ? 'ERROR' : 'WARN'
      alerts.push({
        severity,
        watchdog: 'QUEUE',
        source: 'backlog-extract',
        timestamp: new Date(),
        environment: process.env.NODE_ENV || 'development',
        summary: `Extract queue backlog: ${extractBacklog} jobs`,
        details: {
          queue: 'die_extract',
          waiting: extractWaiting,
          active: extractActive,
          total: extractBacklog,
        },
        recommendedAction:
          severity === 'ERROR'
            ? 'Backlog is high. Check worker health and consider scaling.'
            : 'Backlog growing. Monitor for continued growth.',
        threshold: severity === 'ERROR' ? 500 : 100,
        currentValue: extractBacklog,
        cooldownMinutes: 30,
      })
    }

    // Check intelligence queue backlog
    const intelligenceWaiting = await intelligenceQueue.getWaitingCount()
    const intelligenceActive = await intelligenceQueue.getActiveCount()
    const intelligenceBacklog = intelligenceWaiting + intelligenceActive

    if (intelligenceBacklog > 100) {
      const severity = intelligenceBacklog > 500 ? 'ERROR' : 'WARN'
      alerts.push({
        severity,
        watchdog: 'QUEUE',
        source: 'backlog-intelligence',
        timestamp: new Date(),
        environment: process.env.NODE_ENV || 'development',
        summary: `Intelligence queue backlog: ${intelligenceBacklog} jobs`,
        details: {
          queue: 'die_intelligence',
          waiting: intelligenceWaiting,
          active: intelligenceActive,
          total: intelligenceBacklog,
        },
        recommendedAction:
          severity === 'ERROR'
            ? 'Backlog is high. Check worker health and consider scaling.'
            : 'Backlog growing. Monitor for continued growth.',
        threshold: severity === 'ERROR' ? 500 : 100,
        currentValue: intelligenceBacklog,
        cooldownMinutes: 30,
      })
    }

    return alerts
  }

  /**
   * Check queue stall detection
   * Detects if queue has jobs but no progress is being made
   */
  private static async checkQueueStall(): Promise<WatchdogAlert[]> {
    const alerts: WatchdogAlert[] = []

    // Get metrics
    const extractMetrics = await getQueueMetrics()
    const intelligenceMetrics = await getIntelligenceQueueMetrics()

    // Check extract queue: if active > 0 but no recent completions, may be stalled
    // Note: This is a simplified check. Full implementation would track completion rate over time.
    const extractWaiting = await extractQueue.getWaitingCount()
    if (extractMetrics.active > 0 && extractWaiting > 50) {
      // Potential stall: active jobs but large waiting queue suggests no progress
      alerts.push({
        severity: 'CRITICAL',
        watchdog: 'QUEUE',
        source: 'stall-extract',
        timestamp: new Date(),
        environment: process.env.NODE_ENV || 'development',
        summary: `Extract queue may be stalled: ${extractMetrics.active} active, ${extractWaiting} waiting`,
        details: {
          queue: 'die_extract',
          active: extractMetrics.active,
          waiting: extractWaiting,
          processed: extractMetrics.processed,
          failed: extractMetrics.failed,
        },
        recommendedAction: 'Check worker health immediately. Queue may be stalled. Restart workers if needed.',
        cooldownMinutes: 15,
      })
    }

    // Check intelligence queue
    const intelligenceWaiting = await intelligenceQueue.getWaitingCount()
    if (intelligenceMetrics.active > 0 && intelligenceWaiting > 50) {
      alerts.push({
        severity: 'CRITICAL',
        watchdog: 'QUEUE',
        source: 'stall-intelligence',
        timestamp: new Date(),
        environment: process.env.NODE_ENV || 'development',
        summary: `Intelligence queue may be stalled: ${intelligenceMetrics.active} active, ${intelligenceWaiting} waiting`,
        details: {
          queue: 'die_intelligence',
          active: intelligenceMetrics.active,
          waiting: intelligenceWaiting,
          processed: intelligenceMetrics.processed,
          failed: intelligenceMetrics.failed,
        },
        recommendedAction: 'Check worker health immediately. Queue may be stalled. Restart workers if needed.',
        cooldownMinutes: 15,
      })
    }

    return alerts
  }

  /**
   * Get overall queue health status for CEO Dashboard
   * Returns: HEALTHY, WARNING, or CRITICAL
   */
  static async getHealth(): Promise<'HEALTHY' | 'WARNING' | 'CRITICAL'> {
    try {
      const extractQueue = getQueue('die_extract')
      const intelligenceQueue = getQueue('die_intelligence')

      const [extractMetrics, intelligenceMetrics] = await Promise.all([
        extractQueue.getJobCounts(),
        intelligenceQueue.getJobCounts()
      ])

      const totalDLQ = (extractMetrics.failed || 0) + (intelligenceMetrics.failed || 0)
      const totalWaiting = (extractMetrics.waiting || 0) + (intelligenceMetrics.waiting || 0)

      // Determine health status
      if (totalDLQ > 10 || totalWaiting > 100) return 'CRITICAL'
      if (totalDLQ > 5 || totalWaiting > 50) return 'WARNING'
      return 'HEALTHY'
    } catch (error) {
      console.error('Error getting queue health:', error)
      return 'CRITICAL'
    }
  }

  /**
   * Get DLQ count for CEO Dashboard
   */
  static async getDLQCount(): Promise<number> {
    try {
      const extractQueue = getQueue('die_extract')
      const intelligenceQueue = getQueue('die_intelligence')

      const [extractMetrics, intelligenceMetrics] = await Promise.all([
        extractQueue.getJobCounts(),
        intelligenceQueue.getJobCounts()
      ])

      return (extractMetrics.failed || 0) + (intelligenceMetrics.failed || 0)
    } catch (error) {
      console.error('Error getting DLQ count:', error)
      return 0
    }
  }
}
