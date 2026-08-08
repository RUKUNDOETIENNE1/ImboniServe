// DIE Governance Layer Types — persistent state tracking without schema changes

export type GovernanceLifecycleState = 'DISCOVERED' | 'INSTALLED' | 'ENABLED' | 'DISABLED'

export type GovernanceEventType = 'INSTALL' | 'ENABLE' | 'DISABLE' | 'ANOMALY_DETECTED'

export interface GovernancePluginState {
  pluginId: string
  businessId: string | null // null = global scope
  lifecycleState: GovernanceLifecycleState
  installCount: number
  enableCount: number
  disableCount: number
  firstInstalledAt: string | null
  lastInstalledAt: string | null
  lastEnabledAt: string | null
  lastDisabledAt: string | null
  lastStateChangeAt: string
  createdAt: string
  updatedAt: string
}

export interface GovernanceAuditEvent {
  id: string
  pluginId: string
  businessId: string | null
  eventType: GovernanceEventType
  timestamp: string
  metadata?: {
    previousState?: GovernanceLifecycleState
    newState?: GovernanceLifecycleState
    anomalyType?: string
    anomalyDetails?: string
    [key: string]: unknown
  }
}

export interface GovernanceAnomaly {
  pluginId: string
  businessId: string | null
  anomalyType: 'ENABLE_WITHOUT_INSTALL' | 'REPEATED_LIFECYCLE_INCONSISTENCY' | 'UNUSUAL_STATE_TRANSITION'
  detectedAt: string
  details: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
}
