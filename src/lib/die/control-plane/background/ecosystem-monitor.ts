import { governanceEngine } from '@/lib/die/governance/governance-engine.service'
import { pluginRunner } from '@/lib/die/plugins/runtime/plugin-runner'
import { correlationEngine } from '@/lib/die/intelligence-core/correlation-engine.service'

/**
 * Periodic Ecosystem Health Monitor
 * 
 * Responsibilities:
 * - Monitor plugin ecosystem health
 * - Detect anomaly patterns
 * - Track governance consistency
 * 
 * Constraints:
 * - Observation only
 * - No automatic actions
 * - No plugin mutations
 */
export class EcosystemMonitor {
  /**
   * Run periodic ecosystem health evaluation
   */
  async evaluateHealth(): Promise<void> {
    try {
      console.info('[EcosystemMonitor] Evaluating ecosystem health...')

      const [governanceHealth, correlationReport] = await Promise.all([
        this.evaluateGovernanceHealth(),
        this.evaluateCorrelations(),
      ])

      console.info('[EcosystemMonitor] Health evaluation complete', {
        governanceScore: governanceHealth.score,
        anomalyCount: governanceHealth.anomalyCount,
        hotspotCount: correlationReport.hotspotCount,
        riskSignalCount: correlationReport.riskSignalCount,
      })
    } catch (error) {
      console.error('[EcosystemMonitor] Health evaluation failed:', error)
      // Non-blocking: errors do not propagate
    }
  }

  /**
   * Evaluate governance layer health
   */
  private async evaluateGovernanceHealth(): Promise<{
    score: number
    anomalyCount: number
    consistencyScore: number
  }> {
    const allStates = governanceEngine.getAllStates()
    const recentEvents = governanceEngine.getRecentAuditEvents(100)
    const anomalies = recentEvents.filter((e) => e.eventType === 'ANOMALY_DETECTED')

    let consistencyScore = 100
    for (const state of allStates) {
      if (state.enableCount > state.installCount + 2) consistencyScore -= 5
      if (state.disableCount > state.enableCount + 2) consistencyScore -= 5
    }
    consistencyScore = Math.max(0, consistencyScore)

    const score = Math.max(0, 100 - anomalies.length * 5)

    return {
      score,
      anomalyCount: anomalies.length,
      consistencyScore,
    }
  }

  /**
   * Evaluate system correlations
   */
  private async evaluateCorrelations(): Promise<{
    hotspotCount: number
    riskSignalCount: number
    inefficiencyCount: number
  }> {
    const report = await correlationEngine.generateReport()

    return {
      hotspotCount: report.hotspots.length,
      riskSignalCount: report.riskSignals.length,
      inefficiencyCount: report.inefficiencies.length,
    }
  }

  /**
   * Get plugin health summary
   */
  async getPluginHealthSummary(): Promise<{
    totalPlugins: number
    healthyPlugins: number
    degradedPlugins: number
    criticalPlugins: number
  }> {
    const plugins = pluginRunner.list()
    const allStates = governanceEngine.getAllStates()
    const recentEvents = governanceEngine.getRecentAuditEvents(100)

    const anomalyCounts: Record<string, number> = {}
    for (const event of recentEvents) {
      if (event.eventType === 'ANOMALY_DETECTED') {
        anomalyCounts[event.pluginId] = (anomalyCounts[event.pluginId] || 0) + 1
      }
    }

    let healthyPlugins = 0
    let degradedPlugins = 0
    let criticalPlugins = 0

    for (const plugin of plugins) {
      const anomalyCount = anomalyCounts[plugin.id] || 0

      if (anomalyCount === 0) {
        healthyPlugins++
      } else if (anomalyCount < 10) {
        degradedPlugins++
      } else {
        criticalPlugins++
      }
    }

    return {
      totalPlugins: plugins.length,
      healthyPlugins,
      degradedPlugins,
      criticalPlugins,
    }
  }
}

export const ecosystemMonitor = new EcosystemMonitor()
