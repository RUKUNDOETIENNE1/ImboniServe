"use strict";
// DIE Governance State Service — persistent tracking without schema changes
// Uses in-memory storage with global scope (future: persist to file/cache layer)
Object.defineProperty(exports, "__esModule", { value: true });
exports.GovernanceStateService = void 0;
const nanoid_1 = require("nanoid");
// In-memory state store (global scope for v1)
const globalScope = globalThis;
if (!globalScope.__dieGovernance) {
    globalScope.__dieGovernance = {
        states: new Map(),
        auditTrail: [],
    };
}
function stateKey(pluginId, businessId) {
    return businessId ? `${pluginId}:${businessId}` : `${pluginId}:global`;
}
function getStatesMap() {
    return globalScope.__dieGovernance.states;
}
function getAuditTrail() {
    return globalScope.__dieGovernance.auditTrail;
}
class GovernanceStateService {
    /**
     * Get current state for a plugin (optionally scoped to business)
     */
    getState(pluginId, businessId = null) {
        const key = stateKey(pluginId, businessId);
        return getStatesMap().get(key) ?? null;
    }
    /**
     * Get all states for a plugin across all businesses
     */
    getAllStatesForPlugin(pluginId) {
        const states = getStatesMap();
        const results = [];
        for (const [key, state] of states.entries()) {
            if (state.pluginId === pluginId) {
                results.push(state);
            }
        }
        return results;
    }
    /**
     * Get all states for a business
     */
    getAllStatesForBusiness(businessId) {
        const states = getStatesMap();
        const results = [];
        for (const [key, state] of states.entries()) {
            if (state.businessId === businessId) {
                results.push(state);
            }
        }
        return results;
    }
    /**
     * Get all global states (not business-scoped)
     */
    getAllGlobalStates() {
        const states = getStatesMap();
        const results = [];
        for (const [key, state] of states.entries()) {
            if (state.businessId === null) {
                results.push(state);
            }
        }
        return results;
    }
    /**
     * Initialize or update state
     */
    setState(pluginId, businessId, newState) {
        const key = stateKey(pluginId, businessId);
        const states = getStatesMap();
        const existing = states.get(key);
        const now = new Date().toISOString();
        if (!existing) {
            const state = {
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
            };
            states.set(key, state);
            return state;
        }
        // Update existing state
        const updated = {
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
        };
        if (newState === 'INSTALLED' && !existing.firstInstalledAt) {
            updated.firstInstalledAt = now;
        }
        states.set(key, updated);
        return updated;
    }
    /**
     * Append audit event
     */
    appendAuditEvent(event) {
        const auditEvent = {
            id: (0, nanoid_1.nanoid)(16),
            timestamp: new Date().toISOString(),
            ...event,
        };
        getAuditTrail().push(auditEvent);
        return auditEvent;
    }
    /**
     * Get audit trail for a plugin
     */
    getAuditTrailForPlugin(pluginId, businessId = null) {
        const trail = getAuditTrail();
        return trail.filter((event) => {
            if (event.pluginId !== pluginId)
                return false;
            if (businessId !== null && event.businessId !== businessId)
                return false;
            return true;
        });
    }
    /**
     * Get recent audit events (last N)
     */
    getRecentAuditEvents(limit = 100) {
        const trail = getAuditTrail();
        return trail.slice(-limit).reverse();
    }
    /**
     * Get all audit events for a business
     */
    getAuditTrailForBusiness(businessId) {
        const trail = getAuditTrail();
        return trail.filter((event) => event.businessId === businessId);
    }
    /**
     * Clear all state (for testing only)
     */
    clearAll() {
        getStatesMap().clear();
        getAuditTrail().length = 0;
    }
}
exports.GovernanceStateService = GovernanceStateService;
