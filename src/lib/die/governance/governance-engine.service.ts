// DIE Governance Engine — lifecycle event recording and state management

import { GovernanceStateService } from './governance-state.service'
import type { GovernancePluginState, GovernanceAuditEvent } from './types'
import { persistenceFactory } from '@/lib/die/persistence/factory'

export class GovernanceEngineService {
  private readonly stateService: GovernanceStateService
  private readonly adapter = persistenceFactory.getGovernanceAdapter()

  constructor() {
    this.stateService = new GovernanceStateService()
  }

  /**
   * Record plugin installation
   */
  async recordInstall(pluginId: string, businessId: string | null = null): Promise<void> {
    // Delegate to persistence adapter (memory-first, async durable write)
    await this.adapter.recordInstall(pluginId, businessId)
    console.info(`[GovernanceEngine] recordInstall: ${pluginId} (business: ${businessId ?? 'global'})`)
  }

  /**
   * Record plugin enable
   */
  async recordEnable(pluginId: string, businessId: string | null = null): Promise<void> {
    await this.adapter.recordEnable(pluginId, businessId)
    console.info(`[GovernanceEngine] recordEnable: ${pluginId} (business: ${businessId ?? 'global'})`)
  }

  /**
   * Record plugin disable
   */
  async recordDisable(pluginId: string, businessId: string | null = null): Promise<void> {
    await this.adapter.recordDisable(pluginId, businessId)
    console.info(`[GovernanceEngine] recordDisable: ${pluginId} (business: ${businessId ?? 'global'})`)
  }

  /**
   * Get current state for a plugin
   */
  getState(pluginId: string, businessId: string | null = null): GovernancePluginState | null {
    return this.adapter.getState(pluginId, businessId)
  }

  /**
   * Get all states for a plugin across all businesses
   */
  getAllStatesForPlugin(pluginId: string): GovernancePluginState[] {
    return this.stateService.getAllStatesForPlugin(pluginId)
  }

  /**
   * Get all states for a business
   */
  getAllStatesForBusiness(businessId: string): GovernancePluginState[] {
    return this.stateService.getAllStatesForBusiness(businessId)
  }

  /**
   * Get all global states
   */
  getAllGlobalStates(): GovernancePluginState[] {
    return this.stateService.getAllGlobalStates()
  }

  /**
   * Get audit trail for a plugin
   */
  getAuditTrail(pluginId: string, businessId: string | null = null): GovernanceAuditEvent[] {
    return this.adapter.getAuditTrail(pluginId, businessId)
  }

  /**
   * Get recent audit events
   */
  getRecentAuditEvents(limit: number = 100): GovernanceAuditEvent[] {
    return this.adapter.getRecentAuditEvents(limit)
  }

  /**
   * Get audit trail for a business
   */
  getAuditTrailForBusiness(businessId: string): GovernanceAuditEvent[] {
    return this.stateService.getAuditTrailForBusiness(businessId)
  }

  /**
   * Get all states (for control plane consumption)
   */
  getAllStates(): GovernancePluginState[] {
    return this.adapter.getAllStates()
  }
}

// Singleton instance
export const governanceEngine = new GovernanceEngineService()
