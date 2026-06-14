import { Queue, type JobsOptions } from 'bullmq'
import IORedis from 'ioredis'

if (!process.env.REDIS_URL) {
  throw new Error('REDIS_URL is not set. Please configure Upstash Redis URL in .env')
}

const connection = new IORedis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  tls: {
    rejectUnauthorized: false,
  },
})

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

// Dead Letter Queue for failed jobs (moved after final attempt)
export const extractDLQ = new Queue('die_extract_dlq', { connection })

// Redis-based global metrics tracking
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

// DLQ inspection utility
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

// Health check function
export async function checkQueueHealth() {
  try {
    const pong = await connection.ping()
    return { status: pong ? 'healthy' : 'unhealthy' }
  } catch (e: any) {
    return { status: 'unhealthy', error: e?.message || String(e) }
  }
}
