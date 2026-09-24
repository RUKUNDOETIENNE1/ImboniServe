/**
 * Cooldown Service
 * Prevents alert storms by enforcing cooldown periods per watchdog/severity/condition
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

export class CooldownService {
  /**
   * Check if an alert should be delivered based on cooldown status
   * @returns true if alert should be sent, false if still in cooldown
   */
  static async shouldAlert(
    watchdog: WatchdogName,
    severity: AlertSeverity,
    condition: string
  ): Promise<boolean> {
    const key = `cooldown:${watchdog}:${severity}:${condition}`
    const exists = await connection.exists(key)
    
    if (exists) {
      // Still in cooldown
      return false
    }
    
    // Set cooldown
    const cooldownSeconds = this.getCooldownDuration(watchdog, severity)
    await connection.setex(key, cooldownSeconds, '1')
    
    return true
  }

  /**
   * Get cooldown duration in seconds based on watchdog and severity
   */
  private static getCooldownDuration(watchdog: WatchdogName, severity: AlertSeverity): number {
    // Cooldown matrix (in seconds)
    const cooldowns: Record<AlertSeverity, number> = {
      INFO: 24 * 60 * 60, // 24 hours
      WARN: 30 * 60, // 30 minutes (default)
      ERROR: 15 * 60, // 15 minutes
      CRITICAL: 5 * 60, // 5 minutes
    }

    // Watchdog-specific overrides
    if (watchdog === 'PAYMENT' && severity === 'CRITICAL') {
      return 5 * 60 // 5 min for payment critical
    }
    
    if (watchdog === 'QUEUE' && severity === 'WARN') {
      return 60 * 60 // 1 hour for queue warnings
    }
    
    if (watchdog === 'RECONCILIATION' && severity === 'CRITICAL') {
      return 0 // Immediate for ledger mismatches
    }

    return cooldowns[severity]
  }

  /**
   * Reset cooldown for a specific condition (for testing or manual override)
   */
  static async resetCooldown(
    watchdog: WatchdogName,
    severity: AlertSeverity,
    condition: string
  ): Promise<void> {
    const key = `cooldown:${watchdog}:${severity}:${condition}`
    await connection.del(key)
  }

  /**
   * Get remaining cooldown time in seconds
   */
  static async getRemainingCooldown(
    watchdog: WatchdogName,
    severity: AlertSeverity,
    condition: string
  ): Promise<number> {
    const key = `cooldown:${watchdog}:${severity}:${condition}`
    const ttl = await connection.ttl(key)
    return ttl > 0 ? ttl : 0
  }
}
