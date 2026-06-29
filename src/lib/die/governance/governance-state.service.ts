// DIE Governance State Service — persistent tracking without schema changes
// Uses in-memory storage with global scope (future: persist to file/cache layer)

import type { GovernancePluginState, GovernanceAuditEvent, GovernanceLifecycleState } from './types'
import { nanoid } from 'nanoid'

// In-memory state store (global scope for v1)
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

export class GovernanceStateService {
  /**
   * Get current state for a plugin (optionally scoped to business)
   */
  getState(pluginId: string, businessId: string | null = null): GovernancePluginState | null {
    const key = stateKey(pluginId, businessId)
    return getStatesMap().get(key) ?? null
  }

  /**
   * Get all states for a plugin across all businesses
   */
  getAllStatesForPlugin(pluginId: string): GovernancePluginState[] {
    const states = getStatesMap()
    const results: GovernancePluginState[] = []
    for (const [key, state] of states.entries()) {
      if (state.pluginId === pluginId) {
        results.push(state)
      }
    }
    return results
  }

  /**
   * Get all states for a business
   */
  getAllStatesForBusiness(businessId: string): GovernancePluginState[] {
    const states = getStatesMap()
    const results: GovernancePluginState[] = []
    for (const [key, state] of states.entries()) {
      if (state.businessId === businessId) {
        results.push(state)
      }
    }
    return results
  }

  /**
   * Get all global states (not business-scoped)
   */
  getAllGlobalStates(): GovernancePluginState[] {
    const states = getStatesMap()
    const results: GovernancePluginState[] = []
    for (const [key, state] of states.entries()) {
      if (state.businessId === null) {
        results.push(state)
      }
    }
    return results
  }

  /**
   * Initialize or update state
   */
  setState(pluginId: string, businessId: string | null, newState: GovernanceLifecycleState): GovernancePluginState {
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

  /**
   * Append audit event
   */
  appendAuditEvent(event: Omit<GovernanceAuditEvent, 'id' | 'timestamp'>): GovernanceAuditEvent {
    const auditEvent: GovernanceAuditEvent = {
      id: nanoid(16),
      timestamp: new Date().toISOString(),
      ...event,
    }
    getAuditTrail().push(auditEvent)
    return auditEvent
  }

  /**
   * Get audit trail for a plugin
   */
  getAuditTrailForPlugin(pluginId: string, businessId: string | null = null): GovernanceAuditEvent[] {
    const trail = getAuditTrail()
    return trail.filter((event) => {
      if (event.pluginId !== pluginId) return false
      if (businessId !== null && event.businessId !== businessId) return false
      return true
    })
  }

  /**
   * Get recent audit events (last N)
   */
  getRecentAuditEvents(limit: number = 100): GovernanceAuditEvent[] {
    const trail = getAuditTrail()
    return trail.slice(-limit).reverse()
  }

  /**
   * Get all audit events for a business
   */
  getAuditTrailForBusiness(businessId: string): GovernanceAuditEvent[] {
    const trail = getAuditTrail()
    return trail.filter((event) => event.businessId === businessId)
  }

  /**
   * Clear all state (for testing only)
   */
  clearAll(): void {
    getStatesMap().clear()
    getAuditTrail().length = 0
  }
}
