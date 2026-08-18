import { persistenceFactory } from '@/lib/die/persistence/factory'

/**
 * Historical Trend Analyzer
 * 
 * Responsibilities:
 * - Analyze historical intelligence snapshots
 * - Compute health trends
 * - Detect degradation patterns
 * 
 * Constraints:
 * - Read-only analysis
 * - No automatic actions
 */
export class TrendAnalyzer {
  private readonly controlPlaneRepo = persistenceFactory.getControlPlaneRepository()

  /**
   * Compute system health trend
   */
  async computeHealthTrend(
    lookbackCount: number = 10
  ): Promise<{
    current: number
    previous: number
    trend: 'IMPROVING' | 'STABLE' | 'DEGRADING'
    changePercent: number
  }> {
    try {
      const snapshots = await this.controlPlaneRepo.listSnapshots(lookbackCount)

      if (snapshots.length === 0) {
        return {
          current: 0,
          previous: 0,
          trend: 'STABLE',
          changePercent: 0,
        }
      }

      const current = snapshots[0]?.governanceHealthScore || 0
      const previous = snapshots[1]?.governanceHealthScore || current

      const changePercent = previous === 0 ? 0 : ((current - previous) / previous) * 100

      let trend: 'IMPROVING' | 'STABLE' | 'DEGRADING' = 'STABLE'
      if (changePercent > 5) trend = 'IMPROVING'
      else if (changePercent < -5) trend = 'DEGRADING'

      return {
        current,
        previous,
        trend,
        changePercent: Math.round(changePercent * 10) / 10,
      }
    } catch (error) {
      console.error('[TrendAnalyzer] Failed to compute health trend:', error)
      return {
        current: 0,
        previous: 0,
        trend: 'STABLE',
        changePercent: 0,
      }
    }
  }

  /**
   * Compute governance trend
   */
  async computeGovernanceTrend(
    lookbackCount: number = 10
  ): Promise<{
    currentScore: number
    averageScore: number
    trend: 'IMPROVING' | 'STABLE' | 'DEGRADING'
  }> {
    try {
      const snapshots = await this.controlPlaneRepo.listSnapshots(lookbackCount)

      if (snapshots.length === 0) {
        return {
          currentScore: 0,
          averageScore: 0,
          trend: 'STABLE',
        }
      }

      const currentScore = snapshots[0]?.lifecycleConsistencyScore || 0
      const scores = snapshots.map((s) => s.lifecycleConsistencyScore)
      const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length

      let trend: 'IMPROVING' | 'STABLE' | 'DEGRADING' = 'STABLE'
      if (currentScore > averageScore + 5) trend = 'IMPROVING'
      else if (currentScore < averageScore - 5) trend = 'DEGRADING'

      return {
        currentScore,
        averageScore: Math.round(averageScore * 10) / 10,
        trend,
      }
    } catch (error) {
      console.error('[TrendAnalyzer] Failed to compute governance trend:', error)
      return {
        currentScore: 0,
        averageScore: 0,
        trend: 'STABLE',
      }
    }
  }

  /**
   * Compute anomaly trend
   */
  async computeAnomalyTrend(
    lookbackCount: number = 10
  ): Promise<{
    currentCount: number
    averageCount: number
    trend: 'IMPROVING' | 'STABLE' | 'DEGRADING'
  }> {
    try {
      const snapshots = await this.controlPlaneRepo.listSnapshots(lookbackCount)

      if (snapshots.length === 0) {
        return {
          currentCount: 0,
          averageCount: 0,
          trend: 'STABLE',
        }
      }

      const currentCount = snapshots[0]?.runtimeWarnings?.length || 0
      const counts = snapshots.map((s) => s.runtimeWarnings?.length || 0)
      const averageCount = counts.reduce((sum, count) => sum + count, 0) / counts.length

      let trend: 'IMPROVING' | 'STABLE' | 'DEGRADING' = 'STABLE'
      if (currentCount < averageCount - 2) trend = 'IMPROVING'
      else if (currentCount > averageCount + 2) trend = 'DEGRADING'

      return {
        currentCount,
        averageCount: Math.round(averageCount * 10) / 10,
        trend,
      }
    } catch (error) {
      console.error('[TrendAnalyzer] Failed to compute anomaly trend:', error)
      return {
        currentCount: 0,
        averageCount: 0,
        trend: 'STABLE',
      }
    }
  }

  /**
   * Get comprehensive trend summary
   */
  async getTrendSummary(): Promise<{
    health: {
      current: number
      previous: number
      trend: 'IMPROVING' | 'STABLE' | 'DEGRADING'
      changePercent: number
    }
    governance: {
      currentScore: number
      averageScore: number
      trend: 'IMPROVING' | 'STABLE' | 'DEGRADING'
    }
    anomalies: {
      currentCount: number
      averageCount: number
      trend: 'IMPROVING' | 'STABLE' | 'DEGRADING'
    }
  }> {
    const [health, governance, anomalies] = await Promise.all([
      this.computeHealthTrend(),
      this.computeGovernanceTrend(),
      this.computeAnomalyTrend(),
    ])

    return {
      health,
      governance,
      anomalies,
    }
  }
}

export const trendAnalyzer = new TrendAnalyzer()
