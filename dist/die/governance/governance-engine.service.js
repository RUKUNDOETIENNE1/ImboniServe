"use strict";
// DIE Governance Engine — lifecycle event recording and state management
Object.defineProperty(exports, "__esModule", { value: true });
exports.governanceEngine = exports.GovernanceEngineService = void 0;
const governance_state_service_1 = require("./governance-state.service");
const factory_1 = require("../../die/persistence/factory");
class GovernanceEngineService {
    constructor() {
        this.adapter = factory_1.persistenceFactory.getGovernanceAdapter();
        this.stateService = new governance_state_service_1.GovernanceStateService();
    }
    /**
     * Record plugin installation
     */
    async recordInstall(pluginId, businessId = null) {
        // Delegate to persistence adapter (memory-first, async durable write)
        await this.adapter.recordInstall(pluginId, businessId);
        console.info(`[GovernanceEngine] recordInstall: ${pluginId} (business: ${businessId ?? 'global'})`);
    }
    /**
     * Record plugin enable
     */
    async recordEnable(pluginId, businessId = null) {
        await this.adapter.recordEnable(pluginId, businessId);
        console.info(`[GovernanceEngine] recordEnable: ${pluginId} (business: ${businessId ?? 'global'})`);
    }
    /**
     * Record plugin disable
     */
    async recordDisable(pluginId, businessId = null) {
        await this.adapter.recordDisable(pluginId, businessId);
        console.info(`[GovernanceEngine] recordDisable: ${pluginId} (business: ${businessId ?? 'global'})`);
    }
    /**
     * Get current state for a plugin
     */
    getState(pluginId, businessId = null) {
        return this.adapter.getState(pluginId, businessId);
    }
    /**
     * Get all states for a plugin across all businesses
     */
    getAllStatesForPlugin(pluginId) {
        return this.stateService.getAllStatesForPlugin(pluginId);
    }
    /**
     * Get all states for a business
     */
    getAllStatesForBusiness(businessId) {
        return this.stateService.getAllStatesForBusiness(businessId);
    }
    /**
     * Get all global states
     */
    getAllGlobalStates() {
        return this.stateService.getAllGlobalStates();
    }
    /**
     * Get audit trail for a plugin
     */
    getAuditTrail(pluginId, businessId = null) {
        return this.adapter.getAuditTrail(pluginId, businessId);
    }
    /**
     * Get recent audit events
     */
    getRecentAuditEvents(limit = 100) {
        return this.adapter.getRecentAuditEvents(limit);
    }
    /**
     * Get audit trail for a business
     */
    getAuditTrailForBusiness(businessId) {
        return this.stateService.getAuditTrailForBusiness(businessId);
    }
    /**
     * Get all states (for control plane consumption)
     */
    getAllStates() {
        return this.adapter.getAllStates();
    }
}
exports.GovernanceEngineService = GovernanceEngineService;
// Singleton instance
exports.governanceEngine = new GovernanceEngineService();
