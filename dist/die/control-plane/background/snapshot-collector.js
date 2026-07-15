"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.snapshotCollector = exports.SnapshotCollector = void 0;
const intelligence_snapshot_builder_1 = require("../../../die/intelligence-core/intelligence-snapshot.builder");
const factory_1 = require("../../../die/persistence/factory");
/**
 * Continuous Intelligence Snapshot Collector
 *
 * Responsibilities:
 * - Periodically collect system intelligence snapshots
 * - Persist snapshots for historical analysis
 * - Enable trend tracking
 *
 * Constraints:
 * - Read-only observation
 * - No automatic remediation
 * - Non-blocking persistence
 */
class SnapshotCollector {
    constructor() {
        this.controlPlaneRepo = factory_1.persistenceFactory.getControlPlaneRepository();
    }
    /**
     * Collect and persist current system intelligence snapshot
     */
    async collectSnapshot() {
        try {
            console.info('[SnapshotCollector] Collecting system intelligence snapshot...');
            // Generate unified intelligence snapshot
            const intelligenceSnapshot = await intelligence_snapshot_builder_1.intelligenceSnapshotBuilder.buildSnapshot();
            // Persist Control Plane snapshot (already includes intelligence data)
            await this.persistControlPlaneSnapshot(intelligenceSnapshot);
            console.info('[SnapshotCollector] Snapshot collected successfully', {
                timestamp: intelligenceSnapshot.timestamp,
                healthScore: intelligenceSnapshot.systemHealth.overallScore,
                status: intelligenceSnapshot.systemHealth.status,
            });
        }
        catch (error) {
            console.error('[SnapshotCollector] Failed to collect snapshot:', error);
            // Non-blocking: errors do not propagate
        }
    }
    /**
     * Persist Control Plane snapshot to database
     */
    async persistControlPlaneSnapshot(snapshot) {
        try {
            await this.controlPlaneRepo.createSnapshot({
                totalPlugins: snapshot.controlPlane.totalPlugins,
                activePlugins: snapshot.controlPlane.activePlugins,
                disabledPlugins: snapshot.controlPlane.disabledPlugins,
                discoveredPlugins: snapshot.controlPlane.discoveredPlugins,
                marketplaceCoverage: snapshot.controlPlane.marketplaceCoverage,
                governanceHealthScore: snapshot.controlPlane.governanceHealthScore,
                lifecycleConsistencyScore: snapshot.controlPlane.lifecycleConsistencyScore,
                qrMenuStatus: snapshot.controlPlane.qrMenuStatus,
                runtimeWarnings: snapshot.controlPlane.runtimeWarnings,
                generatedAt: snapshot.timestamp,
            });
        }
        catch (error) {
            console.error('[SnapshotCollector] Failed to persist snapshot:', error);
            // Non-blocking: continue even if persistence fails
        }
    }
    /**
     * Get recent snapshots for trend analysis
     */
    async getRecentSnapshots(limit = 10) {
        try {
            return await this.controlPlaneRepo.listSnapshots(limit);
        }
        catch (error) {
            console.error('[SnapshotCollector] Failed to retrieve snapshots:', error);
            return [];
        }
    }
}
exports.SnapshotCollector = SnapshotCollector;
exports.snapshotCollector = new SnapshotCollector();
