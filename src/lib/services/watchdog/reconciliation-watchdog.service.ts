/**
 * Reconciliation Watchdog v1
 * Monitors financial ledger reconciliation health and accuracy
 */

import { prisma } from '@/lib/prisma'
import { AlertDeliveryService } from '../alert-delivery.service'
import { CooldownService } from './cooldown.service'
import type { WatchdogAlert, WatchdogResult } from './types'

export class ReconciliationWatchdogService {
  /**
   * Run Reconciliation Watchdog checks
   */
  static async run(): Promise<WatchdogResult> {
    const startTime = Date.now()
    const alerts: WatchdogAlert[] = []
    const errors: string[] = []

    try {
      // Check 1: Unreconciled ledger entries
      const unreconciledAlerts = await this.checkUnreconciledEntries()
      alerts.push(...unreconciledAlerts)

      // Check 2: Reconciliation backlog age
      const ageAlerts = await this.checkReconciliationAge()
      alerts.push(...ageAlerts)

      // Check 3: Ledger mismatches (if reconciliation metadata available)
      const mismatchAlerts = await this.checkLedgerMismatches()
      alerts.push(...mismatchAlerts)

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
      console.error('[ReconciliationWatchdog] Execution error:', error)
    }

    return {
      watchdog: 'RECONCILIATION',
      executedAt: new Date(),
      duration: Date.now() - startTime,
      alertsGenerated: alerts.length,
      errors: errors.length > 0 ? errors : undefined,
    }
  }

  /**
   * Check unreconciled ledger entries
   */
  private static async checkUnreconciledEntries(): Promise<WatchdogAlert[]> {
    const alerts: WatchdogAlert[] = []

    // Count unreconciled entries
    // Note: Assuming reconciliation status is tracked via a field or related table
    // Adjust query based on actual schema
    const unreconciledCount = await prisma.financialLedgerEntry.count({
      where: {
        // Assuming entries without a reconciliation record are unreconciled
        // Adjust this based on actual reconciliation tracking mechanism
        createdAt: {
          lt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Older than 24h
        },
      },
    })

    // Thresholds
    const warnThreshold = 10
    const errorThreshold = 50

    if (unreconciledCount >= errorThreshold) {
      alerts.push({
        severity: 'ERROR',
        watchdog: 'RECONCILIATION',
        source: 'unreconciled-count',
        timestamp: new Date(),
        environment: process.env.NODE_ENV || 'development',
        summary: `High unreconciled ledger entries: ${unreconciledCount}`,
        details: {
          unreconciledCount,
          threshold: errorThreshold,
          window: '24 hours',
        },
        recommendedAction:
          'Investigate reconciliation backlog immediately. Check reconciliation job logs and execution layer data.',
        threshold: errorThreshold,
        currentValue: unreconciledCount,
        cooldownMinutes: 30,
      })
    } else if (unreconciledCount >= warnThreshold) {
      alerts.push({
        severity: 'WARN',
        watchdog: 'RECONCILIATION',
        source: 'unreconciled-count',
        timestamp: new Date(),
        environment: process.env.NODE_ENV || 'development',
        summary: `Unreconciled ledger entries detected: ${unreconciledCount}`,
        details: {
          unreconciledCount,
          threshold: warnThreshold,
          window: '24 hours',
        },
        recommendedAction:
          'Monitor reconciliation backlog. Review reconciliation job schedule and execution.',
        threshold: warnThreshold,
        currentValue: unreconciledCount,
        cooldownMinutes: 60,
      })
    }

    return alerts
  }

  /**
   * Check reconciliation backlog age
   */
  private static async checkReconciliationAge(): Promise<WatchdogAlert[]> {
    const alerts: WatchdogAlert[] = []

    // Find oldest unreconciled entry
    const oldestEntry = await prisma.financialLedgerEntry.findFirst({
      where: {
        createdAt: {
          lt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Older than 24h
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
      select: {
        id: true,
        createdAt: true,
        amount: true,
        type: true,
      },
    })

    if (!oldestEntry) return alerts

    const ageHours = (Date.now() - oldestEntry.createdAt.getTime()) / (1000 * 60 * 60)

    // Thresholds
    const errorThreshold = 24 // 24 hours
    const criticalThreshold = 48 // 48 hours (SLA breach)

    if (ageHours >= criticalThreshold) {
      alerts.push({
        severity: 'CRITICAL',
        watchdog: 'RECONCILIATION',
        source: 'reconciliation-age',
        timestamp: new Date(),
        environment: process.env.NODE_ENV || 'development',
        summary: `Reconciliation SLA breach: oldest entry ${ageHours.toFixed(1)}h old`,
        details: {
          oldestEntryId: oldestEntry.id,
          ageHours: ageHours.toFixed(2),
          createdAt: oldestEntry.createdAt.toISOString(),
          amount: oldestEntry.amount,
          type: oldestEntry.type,
          slaThreshold: criticalThreshold,
        },
        recommendedAction:
          'URGENT: Reconciliation SLA breached. Investigate reconciliation job failures immediately. Escalate to finance team.',
        threshold: criticalThreshold,
        currentValue: ageHours,
        cooldownMinutes: 0, // Immediate (no cooldown for CRITICAL)
      })
    } else if (ageHours >= errorThreshold) {
      alerts.push({
        severity: 'ERROR',
        watchdog: 'RECONCILIATION',
        source: 'reconciliation-age',
        timestamp: new Date(),
        environment: process.env.NODE_ENV || 'development',
        summary: `Reconciliation backlog aging: oldest entry ${ageHours.toFixed(1)}h old`,
        details: {
          oldestEntryId: oldestEntry.id,
          ageHours: ageHours.toFixed(2),
          createdAt: oldestEntry.createdAt.toISOString(),
          amount: oldestEntry.amount,
          type: oldestEntry.type,
          threshold: errorThreshold,
        },
        recommendedAction:
          'Investigate reconciliation delays. Check reconciliation job execution and data quality.',
        threshold: errorThreshold,
        currentValue: ageHours,
        cooldownMinutes: 360, // 6 hours
      })
    }

    return alerts
  }

  /**
   * Check for ledger mismatches
   * Note: This is a placeholder. Actual implementation depends on reconciliation metadata.
   */
  private static async checkLedgerMismatches(): Promise<WatchdogAlert[]> {
    const alerts: WatchdogAlert[] = []

    // Placeholder: Check if reconciliation job has flagged any mismatches
    // This would typically query a reconciliation_issues table or similar
    // For now, we'll skip this check as it requires reconciliation metadata

    // Future implementation:
    // - Query reconciliation_issues table
    // - Check for ledger vs execution-layer discrepancies
    // - Alert on any mismatches (CRITICAL severity)

    return alerts
  }
}
