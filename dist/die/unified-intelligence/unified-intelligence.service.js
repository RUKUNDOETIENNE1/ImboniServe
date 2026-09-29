"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unifiedIntelligence = exports.UnifiedIntelligenceService = void 0;
const intelligence_snapshot_builder_1 = require("../../die/intelligence-core/intelligence-snapshot.builder");
const marketplace_intelligence_service_1 = require("../../die/marketplace/intelligence/marketplace-intelligence.service");
const trend_analyzer_1 = require("../../die/control-plane/background/trend-analyzer");
const factory_1 = require("../../die/persistence/factory");
const nanoid_1 = require("nanoid");
class UnifiedIntelligenceService {
    constructor() {
        this.controlPlaneRepo = factory_1.persistenceFactory.getControlPlaneRepository();
    }
    /**
     * Build the unified system intelligence payload
     */
    async buildUnifiedPayload() {
        const [intelligence, marketAll, trends, recentSnapshots] = await Promise.all([
            intelligence_snapshot_builder_1.intelligenceSnapshotBuilder.buildSnapshot(),
            Promise.resolve(marketplace_intelligence_service_1.marketplaceIntelligence.computeAll()),
            trend_analyzer_1.trendAnalyzer.getTrendSummary(),
            this.controlPlaneRepo.listSnapshots(5),
        ]);
        const feed = this.buildUnifiedFeed(intelligence, marketAll, trends);
        const executive = this.buildExecutiveSnapshot(intelligence, marketAll, trends);
        const correlations = this.buildCrossDomainCorrelations(marketAll, intelligence, trends);
        const persistence = {
            lastSnapshotAt: recentSnapshots[0]?.generatedAt ?? null,
            lastSnapshotAgeMs: recentSnapshots[0]?.generatedAt ? Date.now() - new Date(recentSnapshots[0].generatedAt).getTime() : null,
            snapshotsReturned: recentSnapshots.length,
        };
        return { feed, executive, correlations, persistence };
    }
    /**
     * Build the unified feed (timestamped observations with severity and source)
     */
    buildUnifiedFeed(intel, marketplace, trends) {
        const items = [];
        const push = (source, severity, code, message, data) => {
            items.push({ id: (0, nanoid_1.nanoid)(12), timestamp: new Date().toISOString(), source, severity, code, message, data });
        };
        // Control Plane + Governance health
        push('control-plane', intel.systemHealth.status === 'CRITICAL' ? 'CRITICAL' : intel.systemHealth.status === 'DEGRADED' ? 'WARN' : 'INFO', 'CONTROL_PLANE_HEALTH', `Control plane health status: ${intel.systemHealth.status} (score=${intel.systemHealth.overallScore})`, { overallScore: intel.systemHealth.overallScore });
        // Marketplace signals
        for (const p of marketplace) {
            if (p.usage.trendDirection === 'UP') {
                push('marketplace', 'INFO', 'PLUGIN_TREND_UP', `Plugin ${p.pluginId} trending up`, { pluginId: p.pluginId });
            }
            else if (p.usage.trendDirection === 'DOWN') {
                push('marketplace', 'WARN', 'PLUGIN_TREND_DOWN', `Plugin ${p.pluginId} trending down`, { pluginId: p.pluginId });
            }
            if (p.stability.governanceRiskScore >= 80) {
                push('governance', 'CRITICAL', 'PLUGIN_HIGH_RISK', `Plugin ${p.pluginId} high governance risk`, {
                    pluginId: p.pluginId,
                    risk: p.stability.governanceRiskScore,
                });
            }
            else if (p.stability.governanceRiskScore >= 50) {
                push('governance', 'WARN', 'PLUGIN_RISK_ELEVATED', `Plugin ${p.pluginId} elevated risk`, {
                    pluginId: p.pluginId,
                    risk: p.stability.governanceRiskScore,
                });
            }
            if (p.adoption.adoptionScore >= 80) {
                push('marketplace', 'INFO', 'PLUGIN_HIGH_ADOPTION', `Plugin ${p.pluginId} high adoption`, {
                    pluginId: p.pluginId,
                    adoptionScore: p.adoption.adoptionScore,
                });
            }
        }
        // Trends summary
        push('trends', 'INFO', 'HEALTH_TREND', `Health trend: ${trends.health.trend} (${trends.health.changePercent}%)`, trends.health);
        push('trends', 'INFO', 'GOVERNANCE_TREND', `Governance trend: ${trends.governance.trend}`, trends.governance);
        push('trends', 'INFO', 'ANOMALY_TREND', `Anomaly trend: ${trends.anomalies.trend}`, trends.anomalies);
        return items;
    }
    /**
     * Build executive snapshot with consolidated scores
     */
    buildExecutiveSnapshot(intel, marketplace, trends) {
        const platformHealth = intel.systemHealth.overallScore;
        const governanceHealth = intel.controlPlane.governanceHealthScore;
        const marketplaceHealth = Math.round(marketplace.reduce((acc, p) => acc + (p.stability.stabilityScore + p.adoption.adoptionScore) / 2, 0) /
            Math.max(marketplace.length, 1));
        const ecosystemHealth = Math.max(0, Math.min(100, 100 - (trends.anomalies.currentCount * 5)));
        // Overall risk: invert combined health + add risk pressure from marketplace high risk signals
        const avgHealth = (platformHealth + governanceHealth + marketplaceHealth + ecosystemHealth) / 4;
        const riskPressure = marketplace.filter((p) => p.stability.governanceRiskScore >= 80).length * 5;
        const overallRiskScore = Math.min(100, Math.round((100 - avgHealth) + riskPressure));
        return {
            timestamp: new Date().toISOString(),
            platformHealth,
            governanceHealth,
            marketplaceHealth,
            ecosystemHealth,
            overallRiskScore,
        };
    }
    /**
     * Build cross-domain correlations across marketplace and intelligence core
     */
    buildCrossDomainCorrelations(marketplace, intel, trends) {
        const highAdoptionHighRisk = marketplace
            .filter((p) => p.adoption.adoptionScore >= 70 && p.stability.governanceRiskScore >= 70)
            .map((p) => p.pluginId);
        const highGrowthLowStability = marketplace
            .filter((p) => p.usage.trendDirection === 'UP' && p.stability.stabilityScore < 60)
            .map((p) => p.pluginId);
        const lowAdoptionHighStability = marketplace
            .filter((p) => p.adoption.adoptionScore < 30 && p.stability.stabilityScore >= 80)
            .map((p) => p.pluginId);
        const trendsVsAnomalies = marketplace.map((p) => ({
            pluginId: p.pluginId,
            trend: p.usage.trendDirection,
            anomalies: intel.controlPlane.runtimeWarnings?.length ?? 0,
        }));
        const adoptionVsStability = marketplace.map((p) => ({
            pluginId: p.pluginId,
            adoptionScore: p.adoption.adoptionScore,
            stabilityScore: p.stability.stabilityScore,
        }));
        return {
            highAdoptionHighRisk,
            highGrowthLowStability,
            lowAdoptionHighStability,
            trendsVsAnomalies,
            adoptionVsStability,
        };
    }
}
exports.UnifiedIntelligenceService = UnifiedIntelligenceService;
exports.unifiedIntelligence = new UnifiedIntelligenceService();
