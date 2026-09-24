"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pluginIntelligence = exports.PluginIntelligenceService = void 0;
const governance_engine_service_1 = require("../../die/governance/governance-engine.service");
const plugin_runner_1 = require("../../die/plugins/runtime/plugin-runner");
/**
 * Plugin Intelligence Service
 * Computes read-only intelligence metrics for individual plugins
 * Does NOT persist - purely derived/computed
 */
class PluginIntelligenceService {
    /**
     * Compute intelligence metrics for a specific plugin
     */
    async computeMetrics(pluginId, businessId = null) {
        const state = governance_engine_service_1.governanceEngine.getState(pluginId, businessId);
        const auditTrail = governance_engine_service_1.governanceEngine.getAuditTrail(pluginId, businessId);
        const plugin = plugin_runner_1.pluginRunner.list().find((p) => p.id === pluginId);
        if (!state || !plugin) {
            return {
                pluginId,
                usageFrequency: 0,
                performanceImpactScore: 0,
                anomalyAssociationScore: 0,
                adoptionScore: 0,
                stabilityScore: 0,
            };
        }
        const usageFrequency = this.computeUsageFrequency(state, auditTrail);
        const performanceImpactScore = this.computePerformanceImpact(state);
        const anomalyAssociationScore = this.computeAnomalyScore(auditTrail);
        const adoptionScore = this.computeAdoptionScore(state);
        const stabilityScore = this.computeStabilityScore(state, auditTrail);
        return {
            pluginId,
            usageFrequency,
            performanceImpactScore,
            anomalyAssociationScore,
            adoptionScore,
            stabilityScore,
        };
    }
    /**
     * Compute usage frequency (0-100)
     */
    computeUsageFrequency(state, auditTrail) {
        const totalEvents = auditTrail.length;
        const enableEvents = auditTrail.filter((e) => e.eventType === 'ENABLE').length;
        if (totalEvents === 0)
            return 0;
        const frequency = (enableEvents / totalEvents) * 100;
        return Math.min(100, Math.round(frequency));
    }
    /**
     * Compute performance impact score (0-100)
     * Higher = more impact (more operations, more churn)
     */
    computePerformanceImpact(state) {
        const totalOps = state.installCount + state.enableCount + state.disableCount;
        const impactScore = Math.min(100, totalOps * 2);
        return Math.round(impactScore);
    }
    /**
     * Compute anomaly association score (0-100)
     * Higher = more anomalies detected
     */
    computeAnomalyScore(auditTrail) {
        const anomalies = auditTrail.filter((e) => e.eventType === 'ANOMALY_DETECTED').length;
        const score = Math.min(100, anomalies * 10);
        return Math.round(score);
    }
    /**
     * Compute adoption score (0-100)
     * Based on install/enable ratio and usage
     */
    computeAdoptionScore(state) {
        if (state.installCount === 0)
            return 0;
        const enableRatio = state.enableCount / state.installCount;
        const adoptionScore = Math.min(100, enableRatio * 100);
        return Math.round(adoptionScore);
    }
    /**
     * Compute stability score (0-100)
     * Higher = more stable (fewer anomalies, consistent lifecycle)
     */
    computeStabilityScore(state, auditTrail) {
        let score = 100;
        const anomalies = auditTrail.filter((e) => e.eventType === 'ANOMALY_DETECTED').length;
        score -= Math.min(50, anomalies * 5);
        if (state.enableCount > state.installCount + 2)
            score -= 20;
        if (state.disableCount > state.enableCount + 2)
            score -= 20;
        const churnRatio = state.disableCount / Math.max(state.enableCount, 1);
        if (churnRatio > 0.5)
            score -= 10;
        return Math.max(0, Math.round(score));
    }
    /**
     * Compute metrics for all plugins
     */
    async computeAllMetrics() {
        const plugins = plugin_runner_1.pluginRunner.list();
        const metrics = [];
        for (const plugin of plugins) {
            const pluginMetrics = await this.computeMetrics(plugin.id);
            metrics.push(pluginMetrics);
        }
        return metrics;
    }
}
exports.PluginIntelligenceService = PluginIntelligenceService;
exports.pluginIntelligence = new PluginIntelligenceService();
