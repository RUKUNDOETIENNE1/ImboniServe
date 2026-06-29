// DIE Alert Framework Types

export type AlertType =
  | 'SYSTEM_HEALTH_LOW'
  | 'GOVERNANCE_ANOMALY'
  | 'LIFECYCLE_DRIFT'
  | 'PLUGIN_FAILURE'
  | 'MARKETPLACE_INCONSISTENCY'

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical'

export type AlertChannel = 'console' | 'webhook' | 'email' | 'slack'

export interface Alert {
  id: string
  type: AlertType
  severity: AlertSeverity
  title: string
  message: string
  metadata?: Record<string, unknown>
  timestamp: string
}

export interface AlertDeliveryResult {
  channel: AlertChannel
  success: boolean
  error?: string
  deliveredAt?: string
}

export interface AlertAdapter {
  readonly channel: AlertChannel
  readonly enabled: boolean
  deliver(alert: Alert): Promise<AlertDeliveryResult>
}
