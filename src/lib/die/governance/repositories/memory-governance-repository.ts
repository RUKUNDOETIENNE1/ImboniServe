// Memory Governance Repository — v1.5 default implementation

import { nanoid } from 'nanoid'
import type { GovernanceRepository } from './governance-repository.interface'
import type { GovernancePluginState, GovernanceAuditEvent, GovernanceLifecycleState } from '../types'

/**
 * In-Memory Governance Repository
 * 
 * Preserves existing v1.0 behavior using globalThis storage.
 * State is ephemeral (lost on server restart).
 * 
 * This is the default implementation for v1.5.
 * Future implementations (Prisma, Redis) will implement the same interface.
 */

// Global scope storage (preserves existing behavior)
const globalScope = globalThis as typeof globalThis & {
  __dieGovernance?: {
    states: Map<string, GovernancePluginState>
    auditTrail: GovernanceAuditEvent[]
  }
}

if (!globalScope.__dieGovernance) {
  globalScope.__dieGovernance = {
    states: new Map(),
    auditTrail: [],
  }
}

function stateKey(pluginId: string, businessId: string | null): string {
  return businessId ? `${pluginId}:${businessId}` : `${pluginId}:global`
}

function getStatesMap(): Map<string, GovernancePluginState> {
  return globalScope.__dieGovernance!.states
}

function getAuditTrail(): GovernanceAuditEvent[] {
  return globalScope.__dieGovernance!.auditTrail
}

export class MemoryGovernanceRepository implements GovernanceRepository {
  async getState(pluginId: string, businessId: string | null = null): Promise<GovernancePluginState | null> {
    const key = stateKey(pluginId, businessId)
    return getStatesMap().get(key) ?? null
  }

  async setState(
    pluginId: string,
    businessId: string | null,
    newState: GovernanceLifecycleState
  ): Promise<GovernancePluginState> {
    const key = stateKey(pluginId, businessId)
    const states = getStatesMap()
    const existing = states.get(key)
    const now = new Date().toISOString()

    if (!existing) {
      const state: GovernancePluginState = {
        pluginId,
        businessId,
        lifecycleState: newState,
        installCount: newState === 'INSTALLED' ? 1 : 0,
        enableCount: newState === 'ENABLED' ? 1 : 0,
        disableCount: newState === 'DISABLED' ? 1 : 0,
        firstInstalledAt: newState === 'INSTALLED' ? now : null,
        lastInstalledAt: newState === 'INSTALLED' ? now : null,
        lastEnabledAt: newState === 'ENABLED' ? now : null,
        lastDisabledAt: newState === 'DISABLED' ? now : null,
        lastStateChangeAt: now,
        createdAt: now,
        updatedAt: now,
      }
      states.set(key, state)
      return state
    }

    // Update existing state
    const updated: GovernancePluginState = {
      ...existing,
      lifecycleState: newState,
      installCount: newState === 'INSTALLED' ? existing.installCount + 1 : existing.installCount,
      enableCount: newState === 'ENABLED' ? existing.enableCount + 1 : existing.enableCount,
      disableCount: newState === 'DISABLED' ? existing.disableCount + 1 : existing.disableCount,
      lastInstalledAt: newState === 'INSTALLED' ? now : existing.lastInstalledAt,
      lastEnabledAt: newState === 'ENABLED' ? now : existing.lastEnabledAt,
      lastDisabledAt: newState === 'DISABLED' ? now : existing.lastDisabledAt,
      lastStateChangeAt: now,
      updatedAt: now,
    }

    if (newState === 'INSTALLED' && !existing.firstInstalledAt) {
      updated.firstInstalledAt = now
    }

    states.set(key, updated)
    return updated
  }

  async getAllStatesForPlugin(pluginId: string): Promise<GovernancePluginState[]> {
    const states = getStatesMap()
    const results: GovernancePluginState[] = []
    for (const [key, state] of states.entries()) {
      if (state.pluginId === pluginId) {
        results.push(state)
      }
    }
    return results
  }

  async getAllStatesForBusiness(businessId: string): Promise<GovernancePluginState[]> {
    const states = getStatesMap()
    const results: GovernancePluginState[] = []
    for (const [key, state] of states.entries()) {
      if (state.businessId === businessId) {
        results.push(state)
      }
    }
    return results
  }

  async getAllGlobalStates(): Promise<GovernancePluginState[]> {
    const states = getStatesMap()
    const results: GovernancePluginState[] = []
    for (const [key, state] of states.entries()) {
      if (state.businessId === null) {
        results.push(state)
      }
    }
    return results
  }

  async getAllStates(): Promise<GovernancePluginState[]> {
    const states = getStatesMap()
    return Array.from(states.values())
  }

  async appendAuditEvent(event: Omit<GovernanceAuditEvent, 'id' | 'timestamp'>): Promise<GovernanceAuditEvent> {
    const auditEvent: GovernanceAuditEvent = {
      id: nanoid(16),
      timestamp: new Date().toISOString(),
      ...event,
    }
    getAuditTrail().push(auditEvent)
    return auditEvent
  }

  async getAuditTrailForPlugin(pluginId: string, businessId: string | null = null): Promise<GovernanceAuditEvent[]> {
    const trail = getAuditTrail()
    return trail.filter((event) => {
      if (event.pluginId !== pluginId) return false
      if (businessId !== null && event.businessId !== businessId) return false
      return true
    })
  }

  async getRecentAuditEvents(limit: number = 100): Promise<GovernanceAuditEvent[]> {
    const trail = getAuditTrail()
    return trail.slice(-limit).reverse()
  }

  async getAuditTrailForBusiness(businessId: string): Promise<GovernanceAuditEvent[]> {
    const trail = getAuditTrail()
    return trail.filter((event) => event.businessId === businessId)
  }

  async clearAll(): Promise<void> {
    getStatesMap().clear()
    getAuditTrail().length = 0
  }
}
