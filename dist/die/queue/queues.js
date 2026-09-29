"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractDLQ = exports.extractQueue = void 0;
exports.markJobActive = markJobActive;
exports.markJobCompleted = markJobCompleted;
exports.markJobFailed = markJobFailed;
exports.getQueueMetrics = getQueueMetrics;
exports.getFailedJobs = getFailedJobs;
exports.checkQueueHealth = checkQueueHealth;
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
if (!process.env.REDIS_URL) {
    throw new Error('REDIS_URL is not set. Please configure Upstash Redis URL in .env');
}
const connection = new ioredis_1.default(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    tls: {
        rejectUnauthorized: false,
    },
});
exports.extractQueue = new bullmq_1.Queue('die_extract', {
    connection,
    defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 1000,
        removeOnFail: 2000,
    },
});
// Dead Letter Queue for failed jobs (moved after final attempt)
exports.extractDLQ = new bullmq_1.Queue('die_extract_dlq', { connection });
// Redis-based global metrics tracking
const METRICS_KEY = 'queue:die_extract:metrics';
async function markJobActive() {
    await connection.hincrby(METRICS_KEY, 'active', 1);
}
async function markJobCompleted() {
    const multi = connection.multi();
    multi.hincrby(METRICS_KEY, 'processed', 1);
    multi.hincrby(METRICS_KEY, 'active', -1);
    await multi.exec();
}
async function markJobFailed() {
    const multi = connection.multi();
    multi.hincrby(METRICS_KEY, 'failed', 1);
    multi.hincrby(METRICS_KEY, 'active', -1);
    await multi.exec();
}
async function getQueueMetrics() {
    const raw = await connection.hgetall(METRICS_KEY);
    const toNum = (v) => (v ? parseInt(v, 10) : 0);
    return {
        processed: toNum(raw.processed),
        failed: toNum(raw.failed),
        active: toNum(raw.active),
    };
}
// DLQ inspection utility
async function getFailedJobs(limit = 50) {
    const jobs = await exports.extractDLQ.getJobs(['wait', 'delayed', 'paused', 'waiting', 'active'], 0, Math.max(0, limit - 1));
    return jobs.map((job) => ({
        id: job.id,
        data: job.data,
        failedReason: job.failedReason || job.data?.error || 'unknown',
    }));
}
// Health check function
async function checkQueueHealth() {
    try {
        const pong = await connection.ping();
        return { status: pong ? 'healthy' : 'unhealthy' };
    }
    catch (e) {
        return { status: 'unhealthy', error: e?.message || String(e) };
    }
}
