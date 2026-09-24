// DIE Governance Repository Interface — persistence abstraction

import type { GovernancePluginState, GovernanceAuditEvent, GovernanceLifecycleState } from '../types'

/**
 * Governance Repository Interface
 * 
 * Defines the contract for persisting governance state and audit events.
 * Implementations can use in-memory storage, database, Redis, or other backends.
 * 
 * v1.5: Interface only (architectural preparation)
 * v2.0: Add Prisma/Redis implementations
 */
export interface GovernanceRepository {
  // State Management
  getState(pluginId: string, businessId: string | null): Promise<GovernancePluginState | null>
  setState(pluginId: string, businessId: string | null, lifecycleState: GovernanceLifecycleState): Promise<GovernancePluginState>
  getAllStatesForPlugin(pluginId: string): Promise<GovernancePluginState[]>
  getAllStatesForBusiness(businessId: string): Promise<GovernancePluginState[]>
  getAllGlobalStates(): Promise<GovernancePluginState[]>
  getAllStates(): Promise<GovernancePluginState[]>

  // Audit Trail Management
  appendAuditEvent(event: Omit<GovernanceAuditEvent, 'id' | 'timestamp'>): Promise<GovernanceAuditEvent>
  getAuditTrailForPlugin(pluginId: string, businessId: string | null): Promise<GovernanceAuditEvent[]>
  getRecentAuditEvents(limit: number): Promise<GovernanceAuditEvent[]>
  getAuditTrailForBusiness(businessId: string): Promise<GovernanceAuditEvent[]>

  // Cleanup (for testing)
  clearAll(): Promise<void>
}
