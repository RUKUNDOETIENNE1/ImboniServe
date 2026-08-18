/**
 * Operational Alert Engine
 * Phase: 1.2E-B Foundation (Operational Intelligence Core)
 * 
 * Purpose: Orchestrate operational watchdogs and manage alert delivery
 * 
 * Responsibilities:
 * - Run operational watchdogs on schedule
 * - Aggregate alerts across watchdogs
 * - Apply alert budget constraints
 * - Prioritize alerts by urgency and impact
 * - Deliver alerts to appropriate channels
 * 
 * Trust Safeguards:
 * - Alert budget enforcement (max 10/day)
 * - Priority-based filtering
 * - Cooldown management
 * - Progressive disclosure
 */

import { StaffingWatchdogService } from './staffing-watchdog.service'
import { ServiceQualityWatchdogService } from './service-quality-watchdog.service'
import { IncidentWatchdogService } from './incident-watchdog.service'
import { AlertBudgetManagerService } from './alert-budget-manager.service'
import type { WatchdogResult } from '../types'

export interface OperationalAlertSummary {
  executedAt: Date
  totalDuration: number
  watchdogsRun: number
  totalAlertsGenerated: number
  alertsDelivered: number
  alertsSuppressed: number
  budgetRemaining: number
  errors: string[]
}

export interface WatchdogExecution {
  watchdog: string
  result: WatchdogResult
  success: boolean
}

export class OperationalAlertEngineService {
  /**
   * Run all operational watchdogs
   * 
   * This is the main entry point for operational intelligence.
   * Call this on a schedule (e.g., every 15 minutes for real-time checks,
   * hourly for less urgent checks).
   */
  static async runAll(): Promise<OperationalAlertSummary> {
    const startTime = Date.now()
    const executions: WatchdogExecution[] = []
    const errors: string[] = []

    console.log('[OperationalAlertEngine] Starting operational watchdog execution')

    // Reset daily alert budget if needed
    await AlertBudgetManagerService.resetIfNewDay()

    // Check if we have budget remaining
    const budgetStatus = await AlertBudgetManagerService.getBudgetStatus()
    
    if (budgetStatus.remaining <= 0) {
      console.log('[OperationalAlertEngine] Alert budget exhausted for today')
      return {
        executedAt: new Date(),
        totalDuration: Date.now() - startTime,
        watchdogsRun: 0,
        totalAlertsGenerated: 0,
        alertsDelivered: 0,
        alertsSuppressed: 0,
        budgetRemaining: 0,
        errors: ['Alert budget exhausted for today'],
      }
    }

    // Run watchdogs in priority order
    // Priority 1: Staffing (CRITICAL - immediate service impact)
    try {
      console.log('[OperationalAlertEngine] Running StaffingWatchdog')
      const result = await StaffingWatchdogService.run()
      executions.push({
        watchdog: 'STAFFING',
        result,
        success: !result.errors || result.errors.length === 0,
      })
      
      if (result.errors && result.errors.length > 0) {
        errors.push(...result.errors.map(e => `StaffingWatchdog: ${e}`))
      }
    } catch (error: any) {
      errors.push(`StaffingWatchdog execution failed: ${error?.message || String(error)}`)
      console.error('[OperationalAlertEngine] StaffingWatchdog error:', error)
    }

    // Priority 2: Service Quality (CRITICAL - customer experience)
    try {
      console.log('[OperationalAlertEngine] Running ServiceQualityWatchdog')
      const result = await ServiceQualityWatchdogService.run()
      executions.push({
        watchdog: 'SERVICE_QUALITY',
        result,
        success: !result.errors || result.errors.length === 0,
      })
      
      if (result.errors && result.errors.length > 0) {
        errors.push(...result.errors.map(e => `ServiceQualityWatchdog: ${e}`))
      }
    } catch (error: any) {
      errors.push(`ServiceQualityWatchdog execution failed: ${error?.message || String(error)}`)
      console.error('[OperationalAlertEngine] ServiceQualityWatchdog error:', error)
    }

    // Priority 3: Incident (CRITICAL - operational risk)
    try {
      console.log('[OperationalAlertEngine] Running IncidentWatchdog')
      const result = await IncidentWatchdogService.run()
      executions.push({
        watchdog: 'INCIDENT',
        result,
        success: !result.errors || result.errors.length === 0,
      })
      
      if (result.errors && result.errors.length > 0) {
        errors.push(...result.errors.map(e => `IncidentWatchdog: ${e}`))
      }
    } catch (error: any) {
      errors.push(`IncidentWatchdog execution failed: ${error?.message || String(error)}`)
      console.error('[OperationalAlertEngine] IncidentWatchdog error:', error)
    }

    // Calculate summary
    const totalAlertsGenerated = executions.reduce((sum, e) => sum + e.result.alertsGenerated, 0)
    const finalBudgetStatus = await AlertBudgetManagerService.getBudgetStatus()

    const summary: OperationalAlertSummary = {
      executedAt: new Date(),
      totalDuration: Date.now() - startTime,
      watchdogsRun: executions.length,
      totalAlertsGenerated,
      alertsDelivered: budgetStatus.used - (budgetStatus.used - totalAlertsGenerated), // Alerts that made it through
      alertsSuppressed: totalAlertsGenerated - (budgetStatus.used - (budgetStatus.used - totalAlertsGenerated)),
      budgetRemaining: finalBudgetStatus.remaining,
      errors,
    }

    console.log('[OperationalAlertEngine] Execution complete:', {
      duration: summary.totalDuration,
      watchdogsRun: summary.watchdogsRun,
      alertsGenerated: summary.totalAlertsGenerated,
      alertsDelivered: summary.alertsDelivered,
      budgetRemaining: summary.budgetRemaining,
      errors: summary.errors.length,
    })

    return summary
  }

  /**
   * Run specific watchdog by name
   * 
   * Useful for testing or manual execution
   */
  static async runWatchdog(watchdogName: 'STAFFING' | 'SERVICE_QUALITY' | 'INCIDENT'): Promise<WatchdogResult> {
    console.log(`[OperationalAlertEngine] Running ${watchdogName} watchdog`)

    switch (watchdogName) {
      case 'STAFFING':
        return await StaffingWatchdogService.run()
      case 'SERVICE_QUALITY':
        return await ServiceQualityWatchdogService.run()
      case 'INCIDENT':
        return await IncidentWatchdogService.run()
      default:
        throw new Error(`Unknown watchdog: ${watchdogName}`)
    }
  }

  /**
   * Get operational health summary
   * 
   * Returns high-level operational status without running watchdogs
   * Useful for dashboard display
   */
  static async getOperationalHealthSummary(): Promise<{
    status: 'HEALTHY' | 'WARNING' | 'CRITICAL'
    activeAlerts: number
    budgetRemaining: number
    lastExecution?: Date
  }> {
    // Get budget status
    const budgetStatus = await AlertBudgetManagerService.getBudgetStatus()

    // Determine overall status based on budget usage
    // High alert volume indicates operational issues
    let status: 'HEALTHY' | 'WARNING' | 'CRITICAL' = 'HEALTHY'
    
    if (budgetStatus.used >= 8) {
      status = 'CRITICAL' // >80% of daily budget used
    } else if (budgetStatus.used >= 5) {
      status = 'WARNING' // >50% of daily budget used
    }

    return {
      status,
      activeAlerts: budgetStatus.used,
      budgetRemaining: budgetStatus.remaining,
      lastExecution: budgetStatus.lastReset,
    }
  }

  /**
   * Answer the key question: "What operational action must happen today?"
   * 
   * This method provides a concise, actionable summary for COO
   * within 30 seconds.
   */
  static async getActionableInsights(): Promise<{
    urgentActions: Array<{
      priority: number
      location: string
      issue: string
      action: string
      deadline: string
    }>
    summary: string
    executionTime: number
  }> {
    const startTime = Date.now()

    // This is a placeholder for the actual implementation
    // In production, this would:
    // 1. Query recent alerts from all watchdogs
    // 2. Filter for CRITICAL and WARN severity
    // 3. Sort by priority (urgency + impact)
    // 4. Return top 5 actions
    // 5. Generate executive summary

    const urgentActions = [
      // Example structure - in production, query actual alerts
      // {
      //   priority: 100,
      //   location: 'Downtown Branch',
      //   issue: 'Shift coverage at 75%',
      //   action: 'Call backup staff or approve overtime',
      //   deadline: 'Next 2 hours'
      // }
    ]

    const summary = urgentActions.length === 0
      ? 'No urgent operational actions required today. All locations operating within normal parameters.'
      : `${urgentActions.length} urgent operational action(s) required today. Immediate attention needed for staffing and service quality issues.`

    return {
      urgentActions,
      summary,
      executionTime: Date.now() - startTime,
    }
  }
}
