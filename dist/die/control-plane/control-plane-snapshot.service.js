"use strict";
// DIE Control Plane Snapshot Service — system intelligence snapshot generation
Object.defineProperty(exports, "__esModule", { value: true });
exports.controlPlaneSnapshot = exports.ControlPlaneSnapshotService = void 0;
const control_plane_service_1 = require("./control-plane.service");
const factory_1 = require("../../die/persistence/factory");
class ControlPlaneSnapshotService {
    constructor() {
        /**
         * Generate snapshot with caching (5-minute TTL)
         */
        this.snapshotCache = null;
        this.CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
        this.repo = factory_1.persistenceFactory.getControlPlaneRepository();
    }
    /**
     * Generate a fresh system snapshot
     */
    async generate() {
        return await control_plane_service_1.controlPlane.generateSnapshot();
    }
    async generateCached() {
        const now = Date.now();
        if (this.snapshotCache && this.snapshotCache.expiresAt > now) {
            return this.snapshotCache.snapshot;
        }
        // Try to read latest persisted snapshot (if any) and within TTL
        try {
            const latest = await this.repo.findLatestSnapshot();
            if (latest) {
                const generatedAtMs = new Date(latest.generatedAt).getTime();
                if (generatedAtMs + this.CACHE_TTL_MS > now) {
                    const persisted = {
                        totalPlugins: latest.totalPlugins,
                        activePlugins: latest.activePlugins,
                        disabledPlugins: latest.disabledPlugins,
                        discoveredPlugins: latest.discoveredPlugins,
                        marketplaceCoverage: latest.marketplaceCoverage,
                        governanceHealthScore: latest.governanceHealthScore,
                        lifecycleConsistencyScore: latest.lifecycleConsistencyScore,
                        qrMenuStatus: latest.qrMenuStatus,
                        runtimeWarnings: latest.runtimeWarnings,
                        generatedAt: latest.generatedAt,
                    };
                    this.snapshotCache = { snapshot: persisted, expiresAt: generatedAtMs + this.CACHE_TTL_MS };
                    return persisted;
                }
            }
        }
        catch (e) {
            // Non-blocking: fall through to generation path on any failure
        }
        const snapshot = await this.generate();
        this.snapshotCache = {
            snapshot,
            expiresAt: now + this.CACHE_TTL_MS,
        };
        return snapshot;
    }
    /**
     * Clear snapshot cache
     */
    clearCache() {
        this.snapshotCache = null;
    }
    /**
     * Get snapshot summary (lightweight version)
     */
    async getSummary() {
        const snapshot = await this.generateCached();
        return {
            totalPlugins: snapshot.totalPlugins,
            activePlugins: snapshot.activePlugins,
            governanceHealthScore: snapshot.governanceHealthScore,
            qrMenuStatus: snapshot.qrMenuStatus,
            generatedAt: snapshot.generatedAt,
        };
    }
}
exports.ControlPlaneSnapshotService = ControlPlaneSnapshotService;
// Singleton instance
exports.controlPlaneSnapshot = new ControlPlaneSnapshotService();
