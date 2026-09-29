/**
 * Safe Background Job Scheduler
 * 
 * Design principles:
 * - Optional and non-blocking
 * - No automatic remediation
 * - Observation only
 * - Preserves existing runtime behavior
 * - Can be disabled via environment variable
 */

type JobHandler = () => Promise<void>

interface ScheduledJob {
  id: string
  handler: JobHandler
  intervalMs: number
  enabled: boolean
  lastRun: Date | null
  nextRun: Date | null
  timer: NodeJS.Timeout | null
}

export class BackgroundScheduler {
  private jobs = new Map<string, ScheduledJob>()
  private isRunning = false
  private readonly enabled: boolean

  constructor() {
    // Scheduler can be disabled via environment variable
    this.enabled = process.env.DIE_BACKGROUND_JOBS !== 'false'
  }

  /**
   * Register a background job
   * Jobs are NOT started automatically - call start() explicitly
   */
  register(id: string, handler: JobHandler, intervalMs: number): void {
    if (this.jobs.has(id)) {
      console.warn(`[BackgroundScheduler] Job ${id} already registered`)
      return
    }

    this.jobs.set(id, {
      id,
      handler,
      intervalMs,
      enabled: true,
      lastRun: null,
      nextRun: null,
      timer: null,
    })

    console.info(`[BackgroundScheduler] Registered job: ${id} (interval: ${intervalMs}ms)`)
  }

  /**
   * Start all registered jobs
   * Safe to call multiple times - idempotent
   */
  start(): void {
    if (!this.enabled) {
      console.info('[BackgroundScheduler] Background jobs disabled via environment')
      return
    }

    if (this.isRunning) {
      console.warn('[BackgroundScheduler] Already running')
      return
    }

    this.isRunning = true
    console.info('[BackgroundScheduler] Starting background jobs...')

    for (const job of this.jobs.values()) {
      if (job.enabled) {
        this.startJob(job)
      }
    }
  }

  /**
   * Stop all running jobs
   * Safe to call multiple times - idempotent
   */
  stop(): void {
    if (!this.isRunning) {
      return
    }

    console.info('[BackgroundScheduler] Stopping background jobs...')

    for (const job of this.jobs.values()) {
      this.stopJob(job)
    }

    this.isRunning = false
  }

  /**
   * Enable a specific job
   */
  enable(id: string): void {
    const job = this.jobs.get(id)
    if (!job) {
      console.warn(`[BackgroundScheduler] Job ${id} not found`)
      return
    }

    job.enabled = true
    if (this.isRunning) {
      this.startJob(job)
    }
  }

  /**
   * Disable a specific job
   */
  disable(id: string): void {
    const job = this.jobs.get(id)
    if (!job) {
      console.warn(`[BackgroundScheduler] Job ${id} not found`)
      return
    }

    job.enabled = false
    this.stopJob(job)
  }

  /**
   * Get job status
   */
  getStatus(id: string): { enabled: boolean; lastRun: Date | null; nextRun: Date | null } | null {
    const job = this.jobs.get(id)
    if (!job) return null

    return {
      enabled: job.enabled,
      lastRun: job.lastRun,
      nextRun: job.nextRun,
    }
  }

  /**
   * List all registered jobs
   */
  listJobs(): Array<{ id: string; enabled: boolean; intervalMs: number }> {
    return Array.from(this.jobs.values()).map((job) => ({
      id: job.id,
      enabled: job.enabled,
      intervalMs: job.intervalMs,
    }))
  }

  /**
   * Start a specific job
   */
  private startJob(job: ScheduledJob): void {
    if (job.timer) {
      return // Already running
    }

    const runJob = async () => {
      try {
        job.lastRun = new Date()
        await job.handler()
        job.nextRun = new Date(Date.now() + job.intervalMs)
      } catch (error) {
        console.error(`[BackgroundScheduler] Job ${job.id} failed:`, error)
        // Non-blocking: continue scheduling despite errors
      }
    }

    // Run immediately on start
    void runJob()

    // Schedule recurring execution
    job.timer = setInterval(() => {
      void runJob()
    }, job.intervalMs)

    console.info(`[BackgroundScheduler] Started job: ${job.id}`)
  }

  /**
   * Stop a specific job
   */
  private stopJob(job: ScheduledJob): void {
    if (job.timer) {
      clearInterval(job.timer)
      job.timer = null
      job.nextRun = null
      console.info(`[BackgroundScheduler] Stopped job: ${job.id}`)
    }
  }
}

// Singleton instance
export const backgroundScheduler = new BackgroundScheduler()
