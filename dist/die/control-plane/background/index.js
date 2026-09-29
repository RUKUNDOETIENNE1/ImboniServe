"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trendAnalyzer = exports.ecosystemMonitor = exports.snapshotCollector = exports.backgroundScheduler = void 0;
exports.initializeBackgroundJobs = initializeBackgroundJobs;
exports.startBackgroundJobs = startBackgroundJobs;
exports.stopBackgroundJobs = stopBackgroundJobs;
exports.getBackgroundJobStatus = getBackgroundJobStatus;
const scheduler_1 = require("./scheduler");
Object.defineProperty(exports, "backgroundScheduler", { enumerable: true, get: function () { return scheduler_1.backgroundScheduler; } });
const snapshot_collector_1 = require("./snapshot-collector");
Object.defineProperty(exports, "snapshotCollector", { enumerable: true, get: function () { return snapshot_collector_1.snapshotCollector; } });
const ecosystem_monitor_1 = require("./ecosystem-monitor");
Object.defineProperty(exports, "ecosystemMonitor", { enumerable: true, get: function () { return ecosystem_monitor_1.ecosystemMonitor; } });
/**
 * Control Plane Background Jobs
 *
 * Initializes and manages continuous intelligence collection
 *
 * Jobs:
 * - snapshot-collector: Collect system intelligence snapshots every 5 minutes
 * - ecosystem-monitor: Evaluate ecosystem health every 10 minutes
 *
 * All jobs are:
 * - Optional (can be disabled via environment)
 * - Non-blocking
 * - Observation-only (no automatic actions)
 */
const SNAPSHOT_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const MONITOR_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
/**
 * Initialize background jobs
 * Safe to call multiple times - idempotent
 */
function initializeBackgroundJobs() {
    // Register snapshot collection job
    scheduler_1.backgroundScheduler.register('snapshot-collector', async () => {
        await snapshot_collector_1.snapshotCollector.collectSnapshot();
    }, SNAPSHOT_INTERVAL_MS);
    // Register ecosystem monitoring job
    scheduler_1.backgroundScheduler.register('ecosystem-monitor', async () => {
        await ecosystem_monitor_1.ecosystemMonitor.evaluateHealth();
    }, MONITOR_INTERVAL_MS);
    console.info('[ControlPlane] Background jobs initialized (not started)');
}
/**
 * Start background jobs
 * Must be called explicitly - not automatic
 */
function startBackgroundJobs() {
    scheduler_1.backgroundScheduler.start();
    console.info('[ControlPlane] Background jobs started');
}
/**
 * Stop background jobs
 */
function stopBackgroundJobs() {
    scheduler_1.backgroundScheduler.stop();
    console.info('[ControlPlane] Background jobs stopped');
}
/**
 * Get background job status
 */
function getBackgroundJobStatus() {
    const jobs = scheduler_1.backgroundScheduler.listJobs();
    return jobs.map((job) => ({
        ...job,
        status: scheduler_1.backgroundScheduler.getStatus(job.id),
    }));
}
var trend_analyzer_1 = require("./trend-analyzer");
Object.defineProperty(exports, "trendAnalyzer", { enumerable: true, get: function () { return trend_analyzer_1.trendAnalyzer; } });
