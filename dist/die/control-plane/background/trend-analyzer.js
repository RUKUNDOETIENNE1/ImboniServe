"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trendAnalyzer = exports.TrendAnalyzer = void 0;
const factory_1 = require("../../../die/persistence/factory");
/**
 * Historical Trend Analyzer
 *
 * Responsibilities:
 * - Analyze historical intelligence snapshots
 * - Compute health trends
 * - Detect degradation patterns
 *
 * Constraints:
 * - Read-only analysis
 * - No automatic actions
 */
class TrendAnalyzer {
    constructor() {
        this.controlPlaneRepo = factory_1.persistenceFactory.getControlPlaneRepository();
    }
    /**
     * Compute system health trend
     */
    async computeHealthTrend(lookbackCount = 10) {
        try {
            const snapshots = await this.controlPlaneRepo.listSnapshots(lookbackCount);
            if (snapshots.length === 0) {
                return {
                    current: 0,
                    previous: 0,
                    trend: 'STABLE',
                    changePercent: 0,
                };
            }
            const current = snapshots[0]?.governanceHealthScore || 0;
            const previous = snapshots[1]?.governanceHealthScore || current;
            const changePercent = previous === 0 ? 0 : ((current - previous) / previous) * 100;
            let trend = 'STABLE';
            if (changePercent > 5)
                trend = 'IMPROVING';
            else if (changePercent < -5)
                trend = 'DEGRADING';
            return {
                current,
                previous,
                trend,
                changePercent: Math.round(changePercent * 10) / 10,
            };
        }
        catch (error) {
            console.error('[TrendAnalyzer] Failed to compute health trend:', error);
            return {
                current: 0,
                previous: 0,
                trend: 'STABLE',
                changePercent: 0,
            };
        }
    }
    /**
     * Compute governance trend
     */
    async computeGovernanceTrend(lookbackCount = 10) {
        try {
            const snapshots = await this.controlPlaneRepo.listSnapshots(lookbackCount);
            if (snapshots.length === 0) {
                return {
                    currentScore: 0,
                    averageScore: 0,
                    trend: 'STABLE',
                };
            }
            const currentScore = snapshots[0]?.lifecycleConsistencyScore || 0;
            const scores = snapshots.map((s) => s.lifecycleConsistencyScore);
            const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
            let trend = 'STABLE';
            if (currentScore > averageScore + 5)
                trend = 'IMPROVING';
            else if (currentScore < averageScore - 5)
                trend = 'DEGRADING';
            return {
                currentScore,
                averageScore: Math.round(averageScore * 10) / 10,
                trend,
            };
        }
        catch (error) {
            console.error('[TrendAnalyzer] Failed to compute governance trend:', error);
            return {
                currentScore: 0,
                averageScore: 0,
                trend: 'STABLE',
            };
        }
    }
    /**
     * Compute anomaly trend
     */
    async computeAnomalyTrend(lookbackCount = 10) {
        try {
            const snapshots = await this.controlPlaneRepo.listSnapshots(lookbackCount);
            if (snapshots.length === 0) {
                return {
                    currentCount: 0,
                    averageCount: 0,
                    trend: 'STABLE',
                };
            }
            const currentCount = snapshots[0]?.runtimeWarnings?.length || 0;
            const counts = snapshots.map((s) => s.runtimeWarnings?.length || 0);
            const averageCount = counts.reduce((sum, count) => sum + count, 0) / counts.length;
            let trend = 'STABLE';
            if (currentCount < averageCount - 2)
                trend = 'IMPROVING';
            else if (currentCount > averageCount + 2)
                trend = 'DEGRADING';
            return {
                currentCount,
                averageCount: Math.round(averageCount * 10) / 10,
                trend,
            };
        }
        catch (error) {
            console.error('[TrendAnalyzer] Failed to compute anomaly trend:', error);
            return {
                currentCount: 0,
                averageCount: 0,
                trend: 'STABLE',
            };
        }
    }
    /**
     * Get comprehensive trend summary
     */
    async getTrendSummary() {
        const [health, governance, anomalies] = await Promise.all([
            this.computeHealthTrend(),
            this.computeGovernanceTrend(),
            this.computeAnomalyTrend(),
        ]);
        return {
            health,
            governance,
            anomalies,
        };
    }
}
exports.TrendAnalyzer = TrendAnalyzer;
exports.trendAnalyzer = new TrendAnalyzer();
