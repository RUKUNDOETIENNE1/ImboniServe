"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.intelligenceSnapshotBuilder = exports.IntelligenceSnapshotBuilder = void 0;
const system_intelligence_service_1 = require("./system-intelligence.service");
const correlation_engine_service_1 = require("./correlation-engine.service");
class IntelligenceSnapshotBuilder {
    constructor() {
        this.snapshotCache = null;
        this.correlationCache = null;
        this.CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
    }
    /**
     * Build unified intelligence snapshot with caching
     * Target: <200ms (reuses existing caches from subsystems)
     */
    async buildSnapshot() {
        const now = Date.now();
        if (this.snapshotCache && this.snapshotCache.expiresAt > now) {
            return this.snapshotCache.snapshot;
        }
        const snapshot = await system_intelligence_service_1.systemIntelligence.generateSnapshot();
        this.snapshotCache = {
            snapshot,
            expiresAt: now + this.CACHE_TTL_MS,
        };
        return snapshot;
    }
    /**
     * Build correlation report with caching
     * Target: <200ms
     */
    async buildCorrelationReport() {
        const now = Date.now();
        if (this.correlationCache && this.correlationCache.expiresAt > now) {
            return this.correlationCache.report;
        }
        const report = await correlation_engine_service_1.correlationEngine.generateReport();
        this.correlationCache = {
            report,
            expiresAt: now + this.CACHE_TTL_MS,
        };
        return report;
    }
    /**
     * Clear all caches (for testing or forced refresh)
     */
    clearCache() {
        this.snapshotCache = null;
        this.correlationCache = null;
    }
}
exports.IntelligenceSnapshotBuilder = IntelligenceSnapshotBuilder;
exports.intelligenceSnapshotBuilder = new IntelligenceSnapshotBuilder();
