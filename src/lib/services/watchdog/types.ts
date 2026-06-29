/**
 * Watchdog Alert Types
 * Standardized alert format for all watchdogs
 */

export type AlertSeverity = 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL'

export type WatchdogName =
  | 'PAYMENT'
  | 'QUEUE'
  | 'RECONCILIATION'
  | 'SUBSCRIPTION'
  | 'REVENUE'
  | 'CUSTOMER'
  | 'EXECUTIVE_KPI'
  | 'DATA_QUALITY'
  | 'STAFFING'
  | 'SERVICE_QUALITY'
  | 'INCIDENT'

export interface WatchdogAlert {
  severity: AlertSeverity
  watchdog: WatchdogName
  source: string // specific component or check
  timestamp: Date
  environment: string // production, staging, development
  summary: string
  details?: Record<string, any>
  recommendedAction: string
  threshold?: number
  currentValue?: number
  cooldownMinutes?: number
}

export interface WatchdogResult {
  watchdog: WatchdogName
  executedAt: Date
  duration: number
  alertsGenerated: number
  errors?: string[]
}
