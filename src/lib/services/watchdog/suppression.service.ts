/**
 * Alert Suppression Service
 * Implements root-cause-first alerting to prevent cascade alert storms
 */

import IORedis from 'ioredis'
import type { WatchdogName, AlertSeverity } from './types'

const connection = new IORedis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  tls: {
    rejectUnauthorized: true,
  },
})

/**
 * Suppression rules define which alerts should be suppressed when a root cause is active
 */
interface SuppressionRule {
  rootCauseWatchdog: WatchdogName
  rootCauseSeverity: AlertSeverity
  suppressWatchdogs: WatchdogName[]
  suppressSources?: string[] // Optional: specific sources to suppress
  durationMinutes: number
  reason: string
}

/**
 * Suppression rules configuration
 */
const SUPPRESSION_RULES: SuppressionRule[] = [
  {
    // Rule 1: Payment CRITICAL suppresses queue alerts
    rootCauseWatchdog: 'PAYMENT',
    rootCauseSeverity: 'CRITICAL',
    suppressWatchdogs: ['QUEUE'],
    suppressSources: ['backlog-extract', 'backlog-intelligence', 'dlq-extract', 'dlq-intelligence'],
    durationMinutes: 30,
    reason: 'Payment provider outage likely causing queue backlog and DLQ events',
  },
  {
    // Rule 2: Payment ERROR suppresses queue DLQ alerts
    rootCauseWatchdog: 'PAYMENT',
    rootCauseSeverity: 'ERROR',
    suppressWatchdogs: ['QUEUE'],
    suppressSources: ['dlq-extract', 'dlq-intelligence'],
    durationMinutes: 15,
    reason: 'Payment failures likely causing DLQ events',
  },
  {
    // Rule 3: Queue CRITICAL suppresses queue WARN/ERROR
    rootCauseWatchdog: 'QUEUE',
    rootCauseSeverity: 'CRITICAL',
    suppressWatchdogs: ['QUEUE'],
    suppressSources: ['backlog-extract', 'backlog-intelligence', 'dlq-extract', 'dlq-intelligence'],
    durationMinutes: 15,
    reason: 'Queue stall is root cause; backlog/DLQ alerts are symptoms',
  },
]

export class SuppressionService {
  /**
   * Check if an alert should be suppressed based on active root causes
   * @returns true if alert should be suppressed, false if it should be sent
   */
  static async shouldSuppress(
    watchdog: WatchdogName,
    severity: AlertSeverity,
    source: string
  ): Promise<{ suppressed: boolean; reason?: string }> {
    // Check each suppression rule
    for (const rule of SUPPRESSION_RULES) {
      // Check if there's an active root cause for this rule
      const rootCauseKey = `suppression:root-cause:${rule.rootCauseWatchdog}:${rule.rootCauseSeverity}`
      const rootCauseActive = await connection.exists(rootCauseKey)

      if (!rootCauseActive) continue

      // Check if this alert matches the suppression criteria
      const watchdogMatches = rule.suppressWatchdogs.includes(watchdog)
      const sourceMatches = !rule.suppressSources || rule.suppressSources.includes(source)

      if (watchdogMatches && sourceMatches) {
        return {
          suppressed: true,
          reason: rule.reason,
        }
      }
    }

    return { suppressed: false }
  }

  /**
   * Register a root cause alert (to trigger suppression of related alerts)
   */
  static async registerRootCause(
    watchdog: WatchdogName,
    severity: AlertSeverity
  ): Promise<void> {
    // Find matching suppression rules
    const matchingRules = SUPPRESSION_RULES.filter(
      (rule) => rule.rootCauseWatchdog === watchdog && rule.rootCauseSeverity === severity
    )

    if (matchingRules.length === 0) return

    // Set root cause flag with TTL (use longest duration from matching rules)
    const maxDuration = Math.max(...matchingRules.map((rule) => rule.durationMinutes))
    const key = `suppression:root-cause:${watchdog}:${severity}`
    await connection.setex(key, maxDuration * 60, '1')

    console.log(`[Suppression] Root cause registered: ${watchdog} ${severity} (${maxDuration}min)`)
  }

  /**
   * Clear a root cause (manual override or for testing)
   */
  static async clearRootCause(
    watchdog: WatchdogName,
    severity: AlertSeverity
  ): Promise<void> {
    const key = `suppression:root-cause:${watchdog}:${severity}`
    await connection.del(key)
  }

  /**
   * Get active suppression rules (for debugging/monitoring)
   */
  static async getActiveSuppressions(): Promise<
    Array<{ watchdog: WatchdogName; severity: AlertSeverity; ttl: number }>
  > {
    const active: Array<{ watchdog: WatchdogName; severity: AlertSeverity; ttl: number }> = []

    for (const rule of SUPPRESSION_RULES) {
      const key = `suppression:root-cause:${rule.rootCauseWatchdog}:${rule.rootCauseSeverity}`
      const ttl = await connection.ttl(key)

      if (ttl > 0) {
        active.push({
          watchdog: rule.rootCauseWatchdog,
          severity: rule.rootCauseSeverity,
          ttl,
        })
      }
    }

    return active
  }

  /**
   * Get suppression rules (for documentation/debugging)
   */
  static getSuppressionRules(): SuppressionRule[] {
    return SUPPRESSION_RULES
  }
}
