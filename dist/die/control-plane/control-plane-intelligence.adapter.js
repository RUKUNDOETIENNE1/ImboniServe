"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.controlPlaneIntelligenceAdapter = exports.ControlPlaneIntelligenceAdapter = void 0;
const intelligence_snapshot_builder_1 = require("../../die/intelligence-core/intelligence-snapshot.builder");
/**
 * Control Plane Intelligence Adapter
 * Feeds Control Plane with Intelligence Core insights
 * NON-BREAKING: Extends Control Plane without modifying core services
 */
class ControlPlaneIntelligenceAdapter {
    /**
     * Get enriched system snapshot with intelligence overlay
     */
    async getEnrichedSnapshot() {
        const [snapshot, correlations] = await Promise.all([
            intelligence_snapshot_builder_1.intelligenceSnapshotBuilder.buildSnapshot(),
            intelligence_snapshot_builder_1.intelligenceSnapshotBuilder.buildCorrelationReport(),
        ]);
        const riskScore = this.computeRiskScore(snapshot, correlations);
        const recommendations = this.generateRecommendations(snapshot, correlations);
        return {
            snapshot,
            correlations,
            riskScore,
            recommendations,
        };
    }
    /**
     * Compute overall system risk score (0-100)
     */
    computeRiskScore(snapshot, correlations) {
        let risk = 0;
        if (snapshot.systemHealth.status === 'CRITICAL')
            risk += 50;
        else if (snapshot.systemHealth.status === 'DEGRADED')
            risk += 25;
        risk += Math.min(20, correlations.hotspots.filter((h) => h.severity === 'CRITICAL').length * 10);
        risk += Math.min(15, correlations.riskSignals.length * 5);
        risk += Math.min(10, correlations.inefficiencies.filter((i) => i.impact === 'HIGH').length * 5);
        return Math.min(100, risk);
    }
    /**
     * Generate actionable recommendations
     */
    generateRecommendations(snapshot, correlations) {
        const recommendations = [];
        if (snapshot.systemHealth.status === 'CRITICAL') {
            recommendations.push('URGENT: System health is critical - review governance anomalies immediately');
        }
        if (correlations.hotspots.length > 0) {
            recommendations.push(`Address ${correlations.hotspots.length} system hotspot(s) to improve stability`);
        }
        if (snapshot.correlations.highRiskPlugins.length > 0) {
            recommendations.push(`Review ${snapshot.correlations.highRiskPlugins.length} high-risk plugin(s) for potential issues`);
        }
        if (snapshot.correlations.underutilizedPlugins.length > 0) {
            recommendations.push(`Consider enabling or removing ${snapshot.correlations.underutilizedPlugins.length} underutilized plugin(s)`);
        }
        if (snapshot.marketplace.categoryCoverage < 80) {
            recommendations.push('Improve marketplace metadata coverage for better plugin discoverability');
        }
        if (correlations.inefficiencies.length > 0) {
            recommendations.push(`Optimize ${correlations.inefficiencies.length} identified inefficiency area(s)`);
        }
        return recommendations;
    }
    /**
     * Get system health trend (future: compare with historical snapshots)
     */
    async getHealthTrend() {
        const snapshot = await intelligence_snapshot_builder_1.intelligenceSnapshotBuilder.buildSnapshot();
        return {
            current: snapshot.systemHealth.overallScore,
            trend: 'STABLE',
            changePercent: 0,
        };
    }
}
exports.ControlPlaneIntelligenceAdapter = ControlPlaneIntelligenceAdapter;
exports.controlPlaneIntelligenceAdapter = new ControlPlaneIntelligenceAdapter();
