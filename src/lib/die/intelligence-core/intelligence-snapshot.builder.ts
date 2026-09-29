import { systemIntelligence } from './system-intelligence.service'
import { correlationEngine } from './correlation-engine.service'
import type { SystemIntelligenceSnapshot, SystemCorrelationReport } from './types'

export class IntelligenceSnapshotBuilder {
  private snapshotCache: { snapshot: SystemIntelligenceSnapshot; expiresAt: number } | null = null
  private correlationCache: { report: SystemCorrelationReport; expiresAt: number } | null = null
  private readonly CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

  /**
   * Build unified intelligence snapshot with caching
   * Target: <200ms (reuses existing caches from subsystems)
   */
  async buildSnapshot(): Promise<SystemIntelligenceSnapshot> {
    const now = Date.now()

    if (this.snapshotCache && this.snapshotCache.expiresAt > now) {
      return this.snapshotCache.snapshot
    }

    const snapshot = await systemIntelligence.generateSnapshot()

    this.snapshotCache = {
      snapshot,
      expiresAt: now + this.CACHE_TTL_MS,
    }

    return snapshot
  }

  /**
   * Build correlation report with caching
   * Target: <200ms
   */
  async buildCorrelationReport(): Promise<SystemCorrelationReport> {
    const now = Date.now()

    if (this.correlationCache && this.correlationCache.expiresAt > now) {
      return this.correlationCache.report
    }

    const report = await correlationEngine.generateReport()

    this.correlationCache = {
      report,
      expiresAt: now + this.CACHE_TTL_MS,
    }

    return report
  }

  /**
   * Clear all caches (for testing or forced refresh)
   */
  clearCache(): void {
    this.snapshotCache = null
    this.correlationCache = null
  }
}

export const intelligenceSnapshotBuilder = new IntelligenceSnapshotBuilder()
