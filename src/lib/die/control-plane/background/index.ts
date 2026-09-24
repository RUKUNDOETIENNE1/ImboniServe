import { backgroundScheduler } from './scheduler'
import { snapshotCollector } from './snapshot-collector'
import { ecosystemMonitor } from './ecosystem-monitor'

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

const SNAPSHOT_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes
const MONITOR_INTERVAL_MS = 10 * 60 * 1000 // 10 minutes

/**
 * Initialize background jobs
 * Safe to call multiple times - idempotent
 */
export function initializeBackgroundJobs(): void {
  // Register snapshot collection job
  backgroundScheduler.register(
    'snapshot-collector',
    async () => {
      await snapshotCollector.collectSnapshot()
    },
    SNAPSHOT_INTERVAL_MS
  )

  // Register ecosystem monitoring job
  backgroundScheduler.register(
    'ecosystem-monitor',
    async () => {
      await ecosystemMonitor.evaluateHealth()
    },
    MONITOR_INTERVAL_MS
  )

  console.info('[ControlPlane] Background jobs initialized (not started)')
}

/**
 * Start background jobs
 * Must be called explicitly - not automatic
 */
export function startBackgroundJobs(): void {
  backgroundScheduler.start()
  console.info('[ControlPlane] Background jobs started')
}

/**
 * Stop background jobs
 */
export function stopBackgroundJobs(): void {
  backgroundScheduler.stop()
  console.info('[ControlPlane] Background jobs stopped')
}

/**
 * Get background job status
 */
export function getBackgroundJobStatus(): Array<{
  id: string
  enabled: boolean
  intervalMs: number
  status: { enabled: boolean; lastRun: Date | null; nextRun: Date | null } | null
}> {
  const jobs = backgroundScheduler.listJobs()
  return jobs.map((job) => ({
    ...job,
    status: backgroundScheduler.getStatus(job.id),
  }))
}

// Export components for direct access if needed
export { backgroundScheduler, snapshotCollector, ecosystemMonitor }
export { trendAnalyzer } from './trend-analyzer'
