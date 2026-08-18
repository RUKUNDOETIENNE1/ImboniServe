import { intelligenceSnapshotBuilder } from '@/lib/die/intelligence-core/intelligence-snapshot.builder'
import { controlPlane } from '@/lib/die/control-plane/control-plane.service'
import { persistenceFactory } from '@/lib/die/persistence/factory'
import type { SystemIntelligenceSnapshot } from '@/lib/die/intelligence-core/types'

/**
 * Continuous Intelligence Snapshot Collector
 * 
 * Responsibilities:
 * - Periodically collect system intelligence snapshots
 * - Persist snapshots for historical analysis
 * - Enable trend tracking
 * 
 * Constraints:
 * - Read-only observation
 * - No automatic remediation
 * - Non-blocking persistence
 */
export class SnapshotCollector {
  private readonly controlPlaneRepo = persistenceFactory.getControlPlaneRepository()

  /**
   * Collect and persist current system intelligence snapshot
   */
  async collectSnapshot(): Promise<void> {
    try {
      console.info('[SnapshotCollector] Collecting system intelligence snapshot...')

      // Generate unified intelligence snapshot
      const intelligenceSnapshot = await intelligenceSnapshotBuilder.buildSnapshot()

      // Persist Control Plane snapshot (already includes intelligence data)
      await this.persistControlPlaneSnapshot(intelligenceSnapshot)

      console.info('[SnapshotCollector] Snapshot collected successfully', {
        timestamp: intelligenceSnapshot.timestamp,
        healthScore: intelligenceSnapshot.systemHealth.overallScore,
        status: intelligenceSnapshot.systemHealth.status,
      })
    } catch (error) {
      console.error('[SnapshotCollector] Failed to collect snapshot:', error)
      // Non-blocking: errors do not propagate
    }
  }

  /**
   * Persist Control Plane snapshot to database
   */
  private async persistControlPlaneSnapshot(snapshot: SystemIntelligenceSnapshot): Promise<void> {
    try {
      await this.controlPlaneRepo.createSnapshot({
        totalPlugins: snapshot.controlPlane.totalPlugins,
        activePlugins: snapshot.controlPlane.activePlugins,
        disabledPlugins: snapshot.controlPlane.disabledPlugins,
        discoveredPlugins: snapshot.controlPlane.discoveredPlugins,
        marketplaceCoverage: snapshot.controlPlane.marketplaceCoverage,
        governanceHealthScore: snapshot.controlPlane.governanceHealthScore,
        lifecycleConsistencyScore: snapshot.controlPlane.lifecycleConsistencyScore,
        qrMenuStatus: snapshot.controlPlane.qrMenuStatus,
        runtimeWarnings: snapshot.controlPlane.runtimeWarnings,
        generatedAt: snapshot.timestamp,
      })
    } catch (error) {
      console.error('[SnapshotCollector] Failed to persist snapshot:', error)
      // Non-blocking: continue even if persistence fails
    }
  }

  /**
   * Get recent snapshots for trend analysis
   */
  async getRecentSnapshots(limit: number = 10): Promise<any[]> {
    try {
      return await this.controlPlaneRepo.listSnapshots(limit)
    } catch (error) {
      console.error('[SnapshotCollector] Failed to retrieve snapshots:', error)
      return []
    }
  }
}

export const snapshotCollector = new SnapshotCollector()
