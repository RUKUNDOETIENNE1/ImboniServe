import { controlPlane } from '@/lib/die/control-plane/control-plane.service'
import { governanceEngine } from '@/lib/die/governance/governance-engine.service'
import { pluginRunner } from '@/lib/die/plugins/runtime/plugin-runner'
import { listMarketplacePlugins } from '@/lib/die/plugins/marketplace/registry'
import type {
  SystemIntelligenceSnapshot,
  GovernanceSummary,
  MarketplaceSummary,
  PluginSystemSummary,
  SystemCorrelation,
} from './types'

export class SystemIntelligenceService {
  /**
   * Generate unified system intelligence snapshot
   * Aggregates data from all DIE subsystems
   */
  async generateSnapshot(): Promise<SystemIntelligenceSnapshot> {
    const [controlPlaneSnapshot, governanceSummary, marketplaceSummary, pluginSummary, correlations] =
      await Promise.all([
        this.getControlPlaneData(),
        this.getGovernanceSummary(),
        this.getMarketplaceSummary(),
        this.getPluginSystemSummary(),
        this.computeCorrelations(),
      ])

    const overallScore = this.computeOverallHealthScore(
      controlPlaneSnapshot.governanceHealthScore,
      controlPlaneSnapshot.lifecycleConsistencyScore,
      governanceSummary.lifecycleConsistencyScore
    )

    const status = this.determineSystemStatus(overallScore)

    return {
      timestamp: new Date().toISOString(),
      systemHealth: {
        overallScore,
        status,
      },
      governance: governanceSummary,
      controlPlane: controlPlaneSnapshot,
      marketplace: marketplaceSummary,
      plugins: pluginSummary,
      correlations,
    }
  }

  /**
   * Get Control Plane data (reuse existing cache)
   */
  private async getControlPlaneData() {
    return await controlPlane.generateSnapshot()
  }

  /**
   * Aggregate Governance layer summary
   */
  private async getGovernanceSummary(): Promise<GovernanceSummary> {
    const allStates = governanceEngine.getAllStates()
    const recentEvents = governanceEngine.getRecentAuditEvents(100)
    const anomalies = recentEvents.filter((e) => e.eventType === 'ANOMALY_DETECTED')

    const activePlugins = allStates.filter((s) => s.lifecycleState === 'ENABLED').length
    const disabledPlugins = allStates.filter((s) => s.lifecycleState === 'DISABLED').length
    const discoveredPlugins = allStates.filter((s) => s.lifecycleState === 'DISCOVERED').length

    let consistencyScore = 100
    for (const state of allStates) {
      if (state.enableCount > state.installCount + 2) consistencyScore -= 5
      if (state.disableCount > state.enableCount + 2) consistencyScore -= 5
    }
    consistencyScore = Math.max(0, consistencyScore)

    return {
      totalStates: allStates.length,
      activePlugins,
      disabledPlugins,
      discoveredPlugins,
      totalAuditEvents: recentEvents.length,
      recentAnomalies: anomalies.length,
      lifecycleConsistencyScore: consistencyScore,
    }
  }

  /**
   * Aggregate Marketplace layer summary
   */
  private async getMarketplaceSummary(): Promise<MarketplaceSummary> {
    const plugins = listMarketplacePlugins()

    const categoryCounts: Record<string, number> = {}
    const pricingCounts: Record<string, number> = {}
    let totalCapabilities = 0

    for (const plugin of plugins) {
      if (plugin.category) {
        categoryCounts[plugin.category] = (categoryCounts[plugin.category] || 0) + 1
      }
      if (plugin.pricingModel) {
        pricingCounts[plugin.pricingModel] = (pricingCounts[plugin.pricingModel] || 0) + 1
      }
      totalCapabilities += plugin.capabilities?.length || 0
    }

    const categoryCoverage = plugins.filter((p) => p.category).length / Math.max(plugins.length, 1)
    const averageCapabilityCount = totalCapabilities / Math.max(plugins.length, 1)

    const topCategories = Object.entries(categoryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([category, count]) => ({ category, count }))

    return {
      totalPlugins: plugins.length,
      categoryCoverage: Math.round(categoryCoverage * 100),
      pricingModelDistribution: pricingCounts,
      averageCapabilityCount: Math.round(averageCapabilityCount * 10) / 10,
      topCategories,
    }
  }

  /**
   * Aggregate Plugin System summary
   */
  private async getPluginSystemSummary(): Promise<PluginSystemSummary> {
    const plugins = pluginRunner.list()

    const typeCounts: Record<string, number> = {}
    let businessScopedCount = 0
    let globalScopedCount = 0

    for (const plugin of plugins) {
      typeCounts[plugin.type] = (typeCounts[plugin.type] || 0) + 1
      if (plugin.businessScoped) {
        businessScopedCount++
      } else {
        globalScopedCount++
      }
    }

    return {
      totalRegistered: plugins.length,
      businessScopedCount,
      globalScopedCount,
      averageVersion: '1.0.0',
      typeDistribution: typeCounts,
    }
  }

  /**
   * Compute cross-layer correlations
   */
  private async computeCorrelations(): Promise<SystemCorrelation> {
    const allStates = governanceEngine.getAllStates()
    const plugins = pluginRunner.list()
    const recentEvents = governanceEngine.getRecentAuditEvents(100)

    const usageCounts: Record<string, number> = {}
    const anomalyCounts: Record<string, number> = {}

    for (const event of recentEvents) {
      usageCounts[event.pluginId] = (usageCounts[event.pluginId] || 0) + 1
      if (event.eventType === 'ANOMALY_DETECTED') {
        anomalyCounts[event.pluginId] = (anomalyCounts[event.pluginId] || 0) + 1
      }
    }

    const sortedByUsage = Object.entries(usageCounts).sort(([, a], [, b]) => b - a)
    const mostUsedPlugins = sortedByUsage.slice(0, 5).map(([id]) => id)
    const leastUsedPlugins = sortedByUsage.slice(-5).map(([id]) => id)

    const anomalyClusters = Object.entries(anomalyCounts)
      .filter(([, count]) => count > 3)
      .map(([id]) => id)

    const highRiskPlugins = plugins
      .filter((p) => {
        const state = allStates.find((s) => s.pluginId === p.id)
        return state && state.enableCount > 10 && (anomalyCounts[p.id] || 0) > 5
      })
      .map((p) => p.id)

    const underutilizedPlugins = plugins
      .filter((p) => {
        const state = allStates.find((s) => s.pluginId === p.id)
        return state && state.lifecycleState === 'INSTALLED' && state.enableCount === 0
      })
      .map((p) => p.id)

    return {
      slowPlugins: [],
      mostUsedPlugins,
      leastUsedPlugins,
      anomalyClusters,
      highRiskPlugins,
      underutilizedPlugins,
    }
  }

  /**
   * Compute overall system health score
   */
  private computeOverallHealthScore(
    governanceHealth: number,
    lifecycleConsistency: number,
    governanceSummaryConsistency: number
  ): number {
    const weights = {
      governance: 0.4,
      lifecycle: 0.3,
      summary: 0.3,
    }

    const weighted =
      governanceHealth * weights.governance +
      lifecycleConsistency * weights.lifecycle +
      governanceSummaryConsistency * weights.summary

    return Math.round(weighted)
  }

  /**
   * Determine system status from score
   */
  private determineSystemStatus(score: number): 'HEALTHY' | 'DEGRADED' | 'CRITICAL' {
    if (score >= 80) return 'HEALTHY'
    if (score >= 50) return 'DEGRADED'
    return 'CRITICAL'
  }
}

export const systemIntelligence = new SystemIntelligenceService()
