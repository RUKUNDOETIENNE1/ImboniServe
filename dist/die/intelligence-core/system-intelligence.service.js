"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.systemIntelligence = exports.SystemIntelligenceService = void 0;
const control_plane_service_1 = require("../../die/control-plane/control-plane.service");
const governance_engine_service_1 = require("../../die/governance/governance-engine.service");
const plugin_runner_1 = require("../../die/plugins/runtime/plugin-runner");
const registry_1 = require("../../die/plugins/marketplace/registry");
class SystemIntelligenceService {
    /**
     * Generate unified system intelligence snapshot
     * Aggregates data from all DIE subsystems
     */
    async generateSnapshot() {
        const [controlPlaneSnapshot, governanceSummary, marketplaceSummary, pluginSummary, correlations] = await Promise.all([
            this.getControlPlaneData(),
            this.getGovernanceSummary(),
            this.getMarketplaceSummary(),
            this.getPluginSystemSummary(),
            this.computeCorrelations(),
        ]);
        const overallScore = this.computeOverallHealthScore(controlPlaneSnapshot.governanceHealthScore, controlPlaneSnapshot.lifecycleConsistencyScore, governanceSummary.lifecycleConsistencyScore);
        const status = this.determineSystemStatus(overallScore);
        return {
            timestamp: new Date().toISOString(),
            systemHealth: {
                overallScore,
                status,
            },
            governance: governanceSummary,
            controlPlane: controlPlaneSnapshot,
            marketplace: marketplaceSummary,
            plugins: pluginSummary,
            correlations,
        };
    }
    /**
     * Get Control Plane data (reuse existing cache)
     */
    async getControlPlaneData() {
        return await control_plane_service_1.controlPlane.generateSnapshot();
    }
    /**
     * Aggregate Governance layer summary
     */
    async getGovernanceSummary() {
        const allStates = governance_engine_service_1.governanceEngine.getAllStates();
        const recentEvents = governance_engine_service_1.governanceEngine.getRecentAuditEvents(100);
        const anomalies = recentEvents.filter((e) => e.eventType === 'ANOMALY_DETECTED');
        const activePlugins = allStates.filter((s) => s.lifecycleState === 'ENABLED').length;
        const disabledPlugins = allStates.filter((s) => s.lifecycleState === 'DISABLED').length;
        const discoveredPlugins = allStates.filter((s) => s.lifecycleState === 'DISCOVERED').length;
        let consistencyScore = 100;
        for (const state of allStates) {
            if (state.enableCount > state.installCount + 2)
                consistencyScore -= 5;
            if (state.disableCount > state.enableCount + 2)
                consistencyScore -= 5;
        }
        consistencyScore = Math.max(0, consistencyScore);
        return {
            totalStates: allStates.length,
            activePlugins,
            disabledPlugins,
            discoveredPlugins,
            totalAuditEvents: recentEvents.length,
            recentAnomalies: anomalies.length,
            lifecycleConsistencyScore: consistencyScore,
        };
    }
    /**
     * Aggregate Marketplace layer summary
     */
    async getMarketplaceSummary() {
        const plugins = (0, registry_1.listMarketplacePlugins)();
        const categoryCounts = {};
        const pricingCounts = {};
        let totalCapabilities = 0;
        for (const plugin of plugins) {
            if (plugin.category) {
                categoryCounts[plugin.category] = (categoryCounts[plugin.category] || 0) + 1;
            }
            if (plugin.pricingModel) {
                pricingCounts[plugin.pricingModel] = (pricingCounts[plugin.pricingModel] || 0) + 1;
            }
            totalCapabilities += plugin.capabilities?.length || 0;
        }
        const categoryCoverage = plugins.filter((p) => p.category).length / Math.max(plugins.length, 1);
        const averageCapabilityCount = totalCapabilities / Math.max(plugins.length, 1);
        const topCategories = Object.entries(categoryCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([category, count]) => ({ category, count }));
        return {
            totalPlugins: plugins.length,
            categoryCoverage: Math.round(categoryCoverage * 100),
            pricingModelDistribution: pricingCounts,
            averageCapabilityCount: Math.round(averageCapabilityCount * 10) / 10,
            topCategories,
        };
    }
    /**
     * Aggregate Plugin System summary
     */
    async getPluginSystemSummary() {
        const plugins = plugin_runner_1.pluginRunner.list();
        const typeCounts = {};
        let businessScopedCount = 0;
        let globalScopedCount = 0;
        for (const plugin of plugins) {
            typeCounts[plugin.type] = (typeCounts[plugin.type] || 0) + 1;
            if (plugin.businessScoped) {
                businessScopedCount++;
            }
            else {
                globalScopedCount++;
            }
        }
        return {
            totalRegistered: plugins.length,
            businessScopedCount,
            globalScopedCount,
            averageVersion: '1.0.0',
            typeDistribution: typeCounts,
        };
    }
    /**
     * Compute cross-layer correlations
     */
    async computeCorrelations() {
        const allStates = governance_engine_service_1.governanceEngine.getAllStates();
        const plugins = plugin_runner_1.pluginRunner.list();
        const recentEvents = governance_engine_service_1.governanceEngine.getRecentAuditEvents(100);
        const usageCounts = {};
        const anomalyCounts = {};
        for (const event of recentEvents) {
            usageCounts[event.pluginId] = (usageCounts[event.pluginId] || 0) + 1;
            if (event.eventType === 'ANOMALY_DETECTED') {
                anomalyCounts[event.pluginId] = (anomalyCounts[event.pluginId] || 0) + 1;
            }
        }
        const sortedByUsage = Object.entries(usageCounts).sort(([, a], [, b]) => b - a);
        const mostUsedPlugins = sortedByUsage.slice(0, 5).map(([id]) => id);
        const leastUsedPlugins = sortedByUsage.slice(-5).map(([id]) => id);
        const anomalyClusters = Object.entries(anomalyCounts)
            .filter(([, count]) => count > 3)
            .map(([id]) => id);
        const highRiskPlugins = plugins
            .filter((p) => {
            const state = allStates.find((s) => s.pluginId === p.id);
            return state && state.enableCount > 10 && (anomalyCounts[p.id] || 0) > 5;
        })
            .map((p) => p.id);
        const underutilizedPlugins = plugins
            .filter((p) => {
            const state = allStates.find((s) => s.pluginId === p.id);
            return state && state.lifecycleState === 'INSTALLED' && state.enableCount === 0;
        })
            .map((p) => p.id);
        return {
            slowPlugins: [],
            mostUsedPlugins,
            leastUsedPlugins,
            anomalyClusters,
            highRiskPlugins,
            underutilizedPlugins,
        };
    }
    /**
     * Compute overall system health score
     */
    computeOverallHealthScore(governanceHealth, lifecycleConsistency, governanceSummaryConsistency) {
        const weights = {
            governance: 0.4,
            lifecycle: 0.3,
            summary: 0.3,
        };
        const weighted = governanceHealth * weights.governance +
            lifecycleConsistency * weights.lifecycle +
            governanceSummaryConsistency * weights.summary;
        return Math.round(weighted);
    }
    /**
     * Determine system status from score
     */
    determineSystemStatus(score) {
        if (score >= 80)
            return 'HEALTHY';
        if (score >= 50)
            return 'DEGRADED';
        return 'CRITICAL';
    }
}
exports.SystemIntelligenceService = SystemIntelligenceService;
exports.systemIntelligence = new SystemIntelligenceService();
