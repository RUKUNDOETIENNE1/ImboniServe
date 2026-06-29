// DIE Control Plane Snapshot Service — system intelligence snapshot generation

import { controlPlane } from './control-plane.service'
import { persistenceFactory } from '@/lib/die/persistence/factory'
import type { ControlPlaneSnapshot } from './types'

export class ControlPlaneSnapshotService {
  /**
   * Generate a fresh system snapshot
   */
  async generate(): Promise<ControlPlaneSnapshot> {
    return await controlPlane.generateSnapshot()
  }

  /**
   * Generate snapshot with caching (5-minute TTL)
   */
  private snapshotCache: { snapshot: ControlPlaneSnapshot; expiresAt: number } | null = null
  private readonly CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes
  private readonly repo = persistenceFactory.getControlPlaneRepository()

  async generateCached(): Promise<ControlPlaneSnapshot> {
    const now = Date.now()
    
    if (this.snapshotCache && this.snapshotCache.expiresAt > now) {
      return this.snapshotCache.snapshot
    }

    // Try to read latest persisted snapshot (if any) and within TTL
    try {
      const latest = await this.repo.findLatestSnapshot()
      if (latest) {
        const generatedAtMs = new Date(latest.generatedAt).getTime()
        if (generatedAtMs + this.CACHE_TTL_MS > now) {
          const persisted: ControlPlaneSnapshot = {
            totalPlugins: latest.totalPlugins,
            activePlugins: latest.activePlugins,
            disabledPlugins: latest.disabledPlugins,
            discoveredPlugins: latest.discoveredPlugins,
            marketplaceCoverage: latest.marketplaceCoverage,
            governanceHealthScore: latest.governanceHealthScore,
            lifecycleConsistencyScore: latest.lifecycleConsistencyScore,
            qrMenuStatus: latest.qrMenuStatus as any,
            runtimeWarnings: latest.runtimeWarnings,
            generatedAt: latest.generatedAt,
          }
          this.snapshotCache = { snapshot: persisted, expiresAt: generatedAtMs + this.CACHE_TTL_MS }
          return persisted
        }
      }
    } catch (e) {
      // Non-blocking: fall through to generation path on any failure
    }

    const snapshot = await this.generate()
    this.snapshotCache = {
      snapshot,
      expiresAt: now + this.CACHE_TTL_MS,
    }

    return snapshot
  }

  /**
   * Clear snapshot cache
   */
  clearCache(): void {
    this.snapshotCache = null
  }

  /**
   * Get snapshot summary (lightweight version)
   */
  async getSummary(): Promise<{
    totalPlugins: number
    activePlugins: number
    governanceHealthScore: number
    qrMenuStatus: string
    generatedAt: string
  }> {
    const snapshot = await this.generateCached()
    return {
      totalPlugins: snapshot.totalPlugins,
      activePlugins: snapshot.activePlugins,
      governanceHealthScore: snapshot.governanceHealthScore,
      qrMenuStatus: snapshot.qrMenuStatus,
      generatedAt: snapshot.generatedAt,
    }
  }
}

// Singleton instance
export const controlPlaneSnapshot = new ControlPlaneSnapshotService()
