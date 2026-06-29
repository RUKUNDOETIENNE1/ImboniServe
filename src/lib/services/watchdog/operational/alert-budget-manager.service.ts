/**
 * Alert Budget Manager
 * Phase: 1.2E-B Foundation (Operational Intelligence Core)
 * 
 * Purpose: Enforce alert budget to prevent alert fatigue
 * 
 * Trust Safeguard: Alert Budget
 * - Maximum 10 alerts per day
 * - Maximum 3 IMMEDIATE/CRITICAL alerts per week
 * - Progressive disclosure (show most important first)
 * - Budget resets daily at midnight
 * 
 * Constraints:
 * - Deterministic rules only
 * - No ML/AI
 * - Simple, auditable logic
 */

import { prisma } from '@/lib/prisma'
import { startOfDay, subDays } from 'date-fns'

export interface AlertBudgetStatus {
  dailyLimit: number
  weeklyImmediateLimit: number
  used: number
  remaining: number
  immediateUsedThisWeek: number
  immediateRemainingThisWeek: number
  lastReset: Date
  canSendAlert: boolean
  canSendImmediate: boolean
}

export interface AlertBudgetConfig {
  dailyLimit: number
  weeklyImmediateLimit: number
}

export class AlertBudgetManagerService {
  // Configuration
  private static readonly DEFAULT_DAILY_LIMIT = 10
  private static readonly DEFAULT_WEEKLY_IMMEDIATE_LIMIT = 3

  /**
   * Check if an alert can be sent within budget
   * 
   * @param severity - Alert severity (CRITICAL/ERROR = immediate)
   * @returns true if alert can be sent, false if budget exhausted
   */
  static async canSendAlert(severity: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL'): Promise<boolean> {
    const status = await this.getBudgetStatus()

    // Check daily budget
    if (status.remaining <= 0) {
      console.log('[AlertBudgetManager] Daily alert budget exhausted')
      return false
    }

    // Check weekly immediate budget for CRITICAL/ERROR
    const isImmediate = severity === 'CRITICAL' || severity === 'ERROR'
    if (isImmediate && status.immediateRemainingThisWeek <= 0) {
      console.log('[AlertBudgetManager] Weekly immediate alert budget exhausted')
      return false
    }

    return true
  }

  /**
   * Record an alert being sent
   * 
   * @param severity - Alert severity
   * @param watchdog - Watchdog name
   * @param source - Alert source
   */
  static async recordAlert(
    severity: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL',
    watchdog: string,
    source: string
  ): Promise<void> {
    const today = startOfDay(new Date())
    const isImmediate = severity === 'CRITICAL' || severity === 'ERROR'

    // Record in database
    // Note: This requires a new table to track alert budget
    // For now, we'll use a simple in-memory approach
    // In production, create an AlertBudgetLog table

    try {
      // Placeholder: In production, insert into AlertBudgetLog table
      /*
      await prisma.alertBudgetLog.create({
        data: {
          date: today,
          severity,
          watchdog,
          source,
          isImmediate,
          createdAt: new Date(),
        },
      })
      */

      console.log('[AlertBudgetManager] Alert recorded:', {
        severity,
        watchdog,
        source,
        isImmediate,
      })
    } catch (error) {
      console.error('[AlertBudgetManager] Failed to record alert:', error)
      // Don't throw - recording failure shouldn't block alert delivery
    }
  }

  /**
   * Get current budget status
   */
  static async getBudgetStatus(): Promise<AlertBudgetStatus> {
    const today = startOfDay(new Date())
    const sevenDaysAgo = subDays(today, 7)

    // Get configuration
    const config = await this.getConfig()

    // Count alerts sent today
    // Placeholder: In production, query AlertBudgetLog table
    const usedToday = 0 // await this.countAlertsToday()
    const immediateUsedThisWeek = 0 // await this.countImmediateAlertsThisWeek()

    return {
      dailyLimit: config.dailyLimit,
      weeklyImmediateLimit: config.weeklyImmediateLimit,
      used: usedToday,
      remaining: Math.max(0, config.dailyLimit - usedToday),
      immediateUsedThisWeek,
      immediateRemainingThisWeek: Math.max(0, config.weeklyImmediateLimit - immediateUsedThisWeek),
      lastReset: today,
      canSendAlert: usedToday < config.dailyLimit,
      canSendImmediate: immediateUsedThisWeek < config.weeklyImmediateLimit,
    }
  }

  /**
   * Reset budget if new day
   * 
   * Called at the start of each watchdog run
   */
  static async resetIfNewDay(): Promise<void> {
    // Budget resets automatically by date-based queries
    // No explicit reset needed with database approach
    
    // If using in-memory cache, reset here
    const today = startOfDay(new Date())
    
    // Placeholder: In production, check if we need to reset cache
    console.log('[AlertBudgetManager] Budget check for date:', today.toISOString())
  }

  /**
   * Get alert budget configuration
   * 
   * In production, this could be configurable per organization
   * For now, use defaults
   */
  private static async getConfig(): Promise<AlertBudgetConfig> {
    // In production, query from settings table
    // For now, return defaults
    return {
      dailyLimit: this.DEFAULT_DAILY_LIMIT,
      weeklyImmediateLimit: this.DEFAULT_WEEKLY_IMMEDIATE_LIMIT,
    }
  }

  /**
   * Count alerts sent today
   * 
   * Placeholder: In production, query AlertBudgetLog table
   */
  private static async countAlertsToday(): Promise<number> {
    const today = startOfDay(new Date())

    // Placeholder implementation
    // In production:
    /*
    const count = await prisma.alertBudgetLog.count({
      where: {
        date: today,
      },
    })
    return count
    */

    return 0
  }

  /**
   * Count immediate alerts sent this week
   * 
   * Placeholder: In production, query AlertBudgetLog table
   */
  private static async countImmediateAlertsThisWeek(): Promise<number> {
    const sevenDaysAgo = subDays(new Date(), 7)

    // Placeholder implementation
    // In production:
    /*
    const count = await prisma.alertBudgetLog.count({
      where: {
        createdAt: { gte: sevenDaysAgo },
        isImmediate: true,
      },
    })
    return count
    */

    return 0
  }

  /**
   * Get alert priority score
   * 
   * Used to determine which alerts to send when budget is limited
   * Higher score = higher priority
   * 
   * Priority factors:
   * - Severity (CRITICAL > ERROR > WARN > INFO)
   * - Customer impact
   * - Operational risk
   * - Urgency
   */
  static calculateAlertPriority(
    severity: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL',
    customerImpact: 'NONE' | 'MINOR' | 'MODERATE' | 'SEVERE',
    operationalRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  ): number {
    let priority = 0

    // Severity weight (0-40 points)
    switch (severity) {
      case 'CRITICAL':
        priority += 40
        break
      case 'ERROR':
        priority += 30
        break
      case 'WARN':
        priority += 20
        break
      case 'INFO':
        priority += 10
        break
    }

    // Customer impact weight (0-30 points)
    switch (customerImpact) {
      case 'SEVERE':
        priority += 30
        break
      case 'MODERATE':
        priority += 20
        break
      case 'MINOR':
        priority += 10
        break
      case 'NONE':
        priority += 0
        break
    }

    // Operational risk weight (0-30 points)
    switch (operationalRisk) {
      case 'CRITICAL':
        priority += 30
        break
      case 'HIGH':
        priority += 20
        break
      case 'MEDIUM':
        priority += 10
        break
      case 'LOW':
        priority += 0
        break
    }

    return priority // 0-100 scale
  }

  /**
   * Filter alerts by budget
   * 
   * When budget is limited, only send highest priority alerts
   * 
   * @param alerts - All alerts to consider
   * @param maxAlerts - Maximum number to send
   * @returns Filtered alerts (highest priority first)
   */
  static filterAlertsByBudget<T extends { severity: string; priority?: number }>(
    alerts: T[],
    maxAlerts: number
  ): T[] {
    // Sort by priority (if available) or severity
    const sorted = [...alerts].sort((a, b) => {
      // Use priority if available
      if (a.priority !== undefined && b.priority !== undefined) {
        return b.priority - a.priority
      }

      // Otherwise sort by severity
      const severityOrder = { CRITICAL: 4, ERROR: 3, WARN: 2, INFO: 1 }
      const aSeverity = severityOrder[a.severity as keyof typeof severityOrder] || 0
      const bSeverity = severityOrder[b.severity as keyof typeof severityOrder] || 0
      return bSeverity - aSeverity
    })

    // Return top N alerts
    return sorted.slice(0, maxAlerts)
  }

  /**
   * Get budget usage report
   * 
   * Useful for monitoring and optimization
   */
  static async getBudgetReport(): Promise<{
    today: {
      used: number
      limit: number
      percentage: number
    }
    thisWeek: {
      immediateUsed: number
      immediateLimit: number
      percentage: number
    }
    trend: 'INCREASING' | 'STABLE' | 'DECREASING'
  }> {
    const status = await this.getBudgetStatus()

    // Calculate percentages
    const todayPercentage = (status.used / status.dailyLimit) * 100
    const weekPercentage = (status.immediateUsedThisWeek / status.weeklyImmediateLimit) * 100

    // Determine trend (placeholder - in production, compare to previous days)
    const trend: 'INCREASING' | 'STABLE' | 'DECREASING' = 'STABLE'

    return {
      today: {
        used: status.used,
        limit: status.dailyLimit,
        percentage: todayPercentage,
      },
      thisWeek: {
        immediateUsed: status.immediateUsedThisWeek,
        immediateLimit: status.weeklyImmediateLimit,
        percentage: weekPercentage,
      },
      trend,
    }
  }
}
