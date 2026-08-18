import { Queue, type JobsOptions } from 'bullmq'
import IORedis from 'ioredis'

if (!process.env.REDIS_URL) {
  throw new Error('REDIS_URL is not set. Please configure Upstash Redis URL in .env')
}

const connection = new IORedis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  tls: {
    rejectUnauthorized: true,
  },
})

// ---------------------------------------------------------------------------
// die_extract — OCR extraction queue (Block 3)
// ---------------------------------------------------------------------------

export type ExtractJobData = {
  scanJobId: string
  fileKey: string
  mime: string
  documentType: 'SUPPLIER_INVOICE' | 'DELIVERY_NOTE' | 'GENERIC'
}

export const extractQueue = new Queue<ExtractJobData>('die_extract', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: 1000,
    removeOnFail: 2000,
  } as JobsOptions,
})

// Dead Letter Queue for failed extraction jobs (moved after final attempt)
export const extractDLQ = new Queue('die_extract_dlq', { connection })

// ---------------------------------------------------------------------------
// die_intelligence — post-extraction intelligence queue (Block 4)
//
// Job is keyed by scannedDocumentId so BullMQ naturally deduplicates:
// a second enqueue with the same jobId is a no-op if the job is still
// pending/active, preventing double-processing on worker retry.
// ---------------------------------------------------------------------------

export type IntelligenceJobData = {
  scannedDocumentId: string
  scanJobId: string
}

export const intelligenceQueue = new Queue<IntelligenceJobData>('die_intelligence', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 3000 },
    removeOnComplete: 1000,
    removeOnFail: 2000,
  } as JobsOptions,
})

// Dead Letter Queue for failed intelligence jobs
export const intelligenceDLQ = new Queue('die_intelligence_dlq', { connection })

// ---------------------------------------------------------------------------
// Redis-based global metrics tracking — extract queue
// ---------------------------------------------------------------------------
const METRICS_KEY = 'queue:die_extract:metrics'

export async function markJobActive(): Promise<void> {
  await connection.hincrby(METRICS_KEY, 'active', 1)
}

export async function markJobCompleted(): Promise<void> {
  const multi = connection.multi()
  multi.hincrby(METRICS_KEY, 'processed', 1)
  multi.hincrby(METRICS_KEY, 'active', -1)
  await multi.exec()
}

export async function markJobFailed(): Promise<void> {
  const multi = connection.multi()
  multi.hincrby(METRICS_KEY, 'failed', 1)
  multi.hincrby(METRICS_KEY, 'active', -1)
  await multi.exec()
}

export async function getQueueMetrics(): Promise<{ processed: number; failed: number; active: number }> {
  const raw = await connection.hgetall(METRICS_KEY)
  const toNum = (v?: string) => (v ? parseInt(v, 10) : 0)
  return {
    processed: toNum(raw.processed),
    failed: toNum(raw.failed),
    active: toNum(raw.active),
  }
}

// ---------------------------------------------------------------------------
// Redis-based global metrics tracking — intelligence queue
// ---------------------------------------------------------------------------
const INTEL_METRICS_KEY = 'queue:die_intelligence:metrics'

export async function markIntelJobActive(): Promise<void> {
  await connection.hincrby(INTEL_METRICS_KEY, 'active', 1)
}

export async function markIntelJobCompleted(): Promise<void> {
  const multi = connection.multi()
  multi.hincrby(INTEL_METRICS_KEY, 'processed', 1)
  multi.hincrby(INTEL_METRICS_KEY, 'active', -1)
  await multi.exec()
}

export async function markIntelJobFailed(): Promise<void> {
  const multi = connection.multi()
  multi.hincrby(INTEL_METRICS_KEY, 'failed', 1)
  multi.hincrby(INTEL_METRICS_KEY, 'active', -1)
  await multi.exec()
}

export async function getIntelligenceQueueMetrics(): Promise<{ processed: number; failed: number; active: number }> {
  const raw = await connection.hgetall(INTEL_METRICS_KEY)
  const toNum = (v?: string) => (v ? parseInt(v, 10) : 0)
  return {
    processed: toNum(raw.processed),
    failed: toNum(raw.failed),
    active: toNum(raw.active),
  }
}

// ---------------------------------------------------------------------------
// DLQ inspection utilities
// ---------------------------------------------------------------------------

export async function getFailedJobs(limit = 50) {
  const jobs = await extractDLQ.getJobs(
    ['wait', 'delayed', 'paused', 'waiting', 'active'],
    0,
    Math.max(0, limit - 1)
  )
  return jobs.map((job) => ({
    id: job.id,
    data: job.data,
    failedReason: (job as any).failedReason || (job.data as any)?.error || 'unknown',
  }))
}

export async function getFailedIntelligenceJobs(limit = 50) {
  const jobs = await intelligenceDLQ.getJobs(
    ['wait', 'delayed', 'paused', 'waiting', 'active'],
    0,
    Math.max(0, limit - 1)
  )
  return jobs.map((job) => ({
    id: job.id,
    data: job.data,
    failedReason: (job as any).failedReason || (job.data as any)?.error || 'unknown',
  }))
}

// Health check function
export async function checkQueueHealth() {
  try {
    const pong = await connection.ping()
    return { status: pong ? 'healthy' : 'unhealthy' }
  } catch (e: any) {
    return { status: 'unhealthy', error: e?.message || String(e) }
  }
}
