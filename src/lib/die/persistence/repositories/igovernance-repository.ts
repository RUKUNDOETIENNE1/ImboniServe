import type { GovernanceLifecycleState, GovernancePluginState } from '@/lib/die/governance/types'

export interface IGovernanceRepository {
  // Create or update current state for a plugin (business-scoped or global)
  upsertState(
    pluginId: string,
    businessId: string | null,
    lifecycleState: GovernanceLifecycleState,
    counters?: Partial<Pick<GovernancePluginState, 'installCount' | 'enableCount' | 'disableCount'>>,
    timestamps?: Partial<Pick<GovernancePluginState, 'firstInstalledAt' | 'lastInstalledAt' | 'lastEnabledAt' | 'lastDisabledAt' | 'lastStateChangeAt'>>
  ): Promise<GovernancePluginState>

  // Reads
  findByPlugin(pluginId: string, businessId: string | null): Promise<GovernancePluginState | null>
  listByBusiness(businessId: string): Promise<GovernancePluginState[]>
  listGlobal(): Promise<GovernancePluginState[]>
  listAll(): Promise<GovernancePluginState[]>

  // Maintenance
  deleteByPlugin(pluginId: string, businessId: string | null): Promise<void>
}
