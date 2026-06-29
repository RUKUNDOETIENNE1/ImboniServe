import { GovernanceStateService } from '@/lib/die/governance/governance-state.service'
import type { GovernanceAuditEvent, GovernanceLifecycleState, GovernancePluginState } from '@/lib/die/governance/types'
import type { IGovernanceRepository } from '@/lib/die/persistence/repositories/igovernance-repository'
import type { IAuditRepository } from '@/lib/die/persistence/repositories/iaudit-repository'
import type { ILifecycleRepository } from '@/lib/die/persistence/repositories/ilifecycle-repository'

/**
 * GovernancePersistenceAdapter
 * - Memory is the primary read/write path (fast)
 * - Database is the durable path (async, non-blocking)
 * - Reads: cache-first, DB fallback (and hydrate cache)
 */
export class GovernancePersistenceAdapter {
  private readonly memory: GovernanceStateService
  private readonly govRepo: IGovernanceRepository
  private readonly auditRepo: IAuditRepository
  private readonly lifecycleRepo: ILifecycleRepository

  constructor(
    memory: GovernanceStateService,
    govRepo: IGovernanceRepository,
    auditRepo: IAuditRepository,
    lifecycleRepo: ILifecycleRepository
  ) {
    this.memory = memory
    this.govRepo = govRepo
    this.auditRepo = auditRepo
    this.lifecycleRepo = lifecycleRepo
  }

  // --- Write paths (dual-write) ---
  async recordInstall(pluginId: string, businessId: string | null = null): Promise<void> {
    const previous = this.memory.getState(pluginId, businessId)
    const state = this.memory.setState(pluginId, businessId, 'INSTALLED')
    const event = this.memory.appendAuditEvent({ pluginId, businessId, eventType: 'INSTALL', metadata: { previousState: previous?.lifecycleState, newState: state.lifecycleState } })
    this.fireAndForget(async () => {
      await this.govRepo.upsertState(pluginId, businessId, 'INSTALLED', { installCount: state.installCount }, {
        firstInstalledAt: state.firstInstalledAt ?? null,
        lastInstalledAt: state.lastInstalledAt,
        lastStateChangeAt: state.lastStateChangeAt,
      })
      await this.auditRepo.append({ pluginId, businessId, eventType: 'INSTALL', metadata: event.metadata })
      await this.lifecycleRepo.create({ pluginId, businessId, fromState: previous?.lifecycleState ?? null, toState: 'INSTALLED', reason: 'install', metadata: {} })
    })
  }

  async recordEnable(pluginId: string, businessId: string | null = null): Promise<void> {
    const previous = this.memory.getState(pluginId, businessId)
    const state = this.memory.setState(pluginId, businessId, 'ENABLED')
    const event = this.memory.appendAuditEvent({ pluginId, businessId, eventType: 'ENABLE', metadata: { previousState: previous?.lifecycleState, newState: state.lifecycleState } })
    this.fireAndForget(async () => {
      await this.govRepo.upsertState(pluginId, businessId, 'ENABLED', { enableCount: state.enableCount }, { lastEnabledAt: state.lastEnabledAt, lastStateChangeAt: state.lastStateChangeAt })
      await this.auditRepo.append({ pluginId, businessId, eventType: 'ENABLE', metadata: event.metadata })
      await this.lifecycleRepo.create({ pluginId, businessId, fromState: previous?.lifecycleState ?? null, toState: 'ENABLED', reason: 'enable', metadata: {} })
    })
  }

  async recordDisable(pluginId: string, businessId: string | null = null): Promise<void> {
    const previous = this.memory.getState(pluginId, businessId)
    const state = this.memory.setState(pluginId, businessId, 'DISABLED')
    const event = this.memory.appendAuditEvent({ pluginId, businessId, eventType: 'DISABLE', metadata: { previousState: previous?.lifecycleState, newState: state.lifecycleState } })
    this.fireAndForget(async () => {
      await this.govRepo.upsertState(pluginId, businessId, 'DISABLED', { disableCount: state.disableCount }, { lastDisabledAt: state.lastDisabledAt, lastStateChangeAt: state.lastStateChangeAt })
      await this.auditRepo.append({ pluginId, businessId, eventType: 'DISABLE', metadata: event.metadata })
      await this.lifecycleRepo.create({ pluginId, businessId, fromState: previous?.lifecycleState ?? null, toState: 'DISABLED', reason: 'disable', metadata: {} })
    })
  }

  // --- Read paths (cache-first, DB fallback) ---
  getState(pluginId: string, businessId: string | null = null): GovernancePluginState | null {
    const cached = this.memory.getState(pluginId, businessId)
    return cached
  }

  async getStateWithFallback(pluginId: string, businessId: string | null = null): Promise<GovernancePluginState | null> {
    const cached = this.memory.getState(pluginId, businessId)
    if (cached) return cached
    const row = await this.govRepo.findByPlugin(pluginId, businessId)
    if (row) {
      // hydrate memory with durable state (best-effort)
      this.memory.setState(pluginId, businessId, row.lifecycleState as GovernanceLifecycleState)
      return row
    }
    return null
  }

  getAllStates(): GovernancePluginState[] {
    const map: Map<string, GovernancePluginState> | undefined = (this.memory as any).getStatesMap?.()
    if (map) return Array.from(map.values())
    // Fallback (should rarely happen): return empty list — callers can still compute, or use async fallback if wired
    return []
  }

  getAuditTrail(pluginId: string, businessId: string | null = null): GovernanceAuditEvent[] {
    return this.memory.getAuditTrailForPlugin(pluginId, businessId)
  }

  getRecentAuditEvents(limit = 100): GovernanceAuditEvent[] {
    return this.memory.getRecentAuditEvents(limit)
  }

  // --- Helpers ---
  private fireAndForget(task: () => Promise<void>, attempt = 1): void {
    task().catch((err) => {
      if (attempt >= 3) {
        console.error(`[GovernancePersistenceAdapter] durable write failed after ${attempt} attempts`, err)
        return
      }
      const backoff = Math.min(500 * attempt, 1500)
      setTimeout(() => this.fireAndForget(task, attempt + 1), backoff)
    })
  }
}
