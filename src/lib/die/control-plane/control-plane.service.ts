// DIE Control Plane Core — central orchestration brain

import { pluginRunner } from '../plugins/runtime/plugin-runner'
import { governanceEngine } from '../governance/governance-engine.service'
import { listMarketplacePlugins } from '../plugins/marketplace/registry'
import type { ControlPlaneSnapshot, PluginEcosystemSummary, SystemHealthReport } from './types'

export class ControlPlaneService {
  /**
   * Generate system snapshot (high-level overview)
   */
  async generateSnapshot(): Promise<ControlPlaneSnapshot> {
    const plugins = pluginRunner.list()
    const governanceStates = governanceEngine.getAllStates()
    const marketplacePlugins = listMarketplacePlugins()

    // Count plugin states
    const totalPlugins = plugins.length
    const activePlugins = governanceStates.filter((s) => s.lifecycleState === 'ENABLED').length
    const disabledPlugins = governanceStates.filter((s) => s.lifecycleState === 'DISABLED').length
    const discoveredPlugins = totalPlugins - activePlugins - disabledPlugins

    // Marketplace coverage
    const pluginsWithMarketplaceMetadata = marketplacePlugins.filter(
      (p) => p.category && p.pricingModel
    ).length
    const marketplaceCoverage = totalPlugins > 0 ? (pluginsWithMarketplaceMetadata / totalPlugins) * 100 : 0

    // Governance health score (based on anomaly count and state consistency)
    const recentAuditEvents = governanceEngine.getRecentAuditEvents(100)
    const anomalyCount = recentAuditEvents.filter((e) => e.eventType === 'ANOMALY_DETECTED').length
    const governanceHealthScore = Math.max(0, 100 - anomalyCount * 5)

    // Lifecycle consistency score (based on install/enable/disable ratios)
    let lifecycleConsistencyScore = 100
    for (const state of governanceStates) {
      if (state.enableCount > state.installCount + 2) {
        lifecycleConsistencyScore -= 5
      }
      if (state.disableCount > state.enableCount + 2) {
        lifecycleConsistencyScore -= 5
      }
    }
    lifecycleConsistencyScore = Math.max(0, lifecycleConsistencyScore)

    // QR Menu status
    const qrMenuPlugin = plugins.find((p) => p.id === 'qr-menu')
    const qrMenuGovernanceState = governanceEngine.getState('qr-menu')
    let qrMenuStatus: 'healthy' | 'degraded' | 'unknown' = 'unknown'
    if (qrMenuPlugin) {
      if (qrMenuGovernanceState?.lifecycleState === 'ENABLED') {
        qrMenuStatus = 'healthy'
      } else if (qrMenuGovernanceState) {
        qrMenuStatus = 'degraded'
      }
    }

    // Runtime warnings
    const runtimeWarnings: string[] = []
    if (anomalyCount > 10) {
      runtimeWarnings.push(`High anomaly count detected: ${anomalyCount} anomalies in recent history`)
    }
    if (marketplaceCoverage < 50) {
      runtimeWarnings.push(`Low marketplace coverage: only ${marketplaceCoverage.toFixed(1)}% of plugins have metadata`)
    }
    if (qrMenuStatus === 'degraded') {
      runtimeWarnings.push('QR Menu plugin is not enabled')
    }

    return {
      totalPlugins,
      activePlugins,
      disabledPlugins,
      discoveredPlugins,
      marketplaceCoverage: Math.round(marketplaceCoverage * 10) / 10,
      governanceHealthScore,
      lifecycleConsistencyScore,
      qrMenuStatus,
      runtimeWarnings,
      generatedAt: new Date().toISOString(),
    }
  }

  /**
   * Get plugin ecosystem summary (detailed plugin-by-plugin view)
   */
  async getPluginEcosystemSummary(): Promise<PluginEcosystemSummary[]> {
    const plugins = pluginRunner.list()
    const marketplacePlugins = listMarketplacePlugins()

    const summaries: PluginEcosystemSummary[] = []

    for (const plugin of plugins) {
      const governanceState = governanceEngine.getState(plugin.id)
      const marketplaceEntry = marketplacePlugins.find((p) => p.id === plugin.id)
      const auditTrail = governanceEngine.getAuditTrail(plugin.id)
      const anomalies = auditTrail.filter((e) => e.eventType === 'ANOMALY_DETECTED')

      summaries.push({
        pluginId: plugin.id,
        name: plugin.name,
        version: plugin.version,
        type: plugin.type,
        businessScoped: plugin.businessScoped,
        governanceState: governanceState
          ? {
              lifecycleState: governanceState.lifecycleState,
              installCount: governanceState.installCount,
              enableCount: governanceState.enableCount,
              disableCount: governanceState.disableCount,
              lastStateChangeAt: governanceState.lastStateChangeAt,
            }
          : null,
        marketplaceMetadata: {
          category: marketplaceEntry?.category ?? 'unknown',
          pricingModel: marketplaceEntry?.pricingModel ?? 'FREE',
          tags: marketplaceEntry?.tags ?? [],
          capabilities: marketplaceEntry?.capabilities ?? [],
        },
        healthIndicators: {
          hasAnomalies: anomalies.length > 0,
          anomalyCount: anomalies.length,
          isStable: anomalies.length === 0 && (governanceState?.enableCount ?? 0) < 10,
        },
      })
    }

    return summaries
  }

  /**
   * Get system health report
   */
  async getSystemHealthReport(): Promise<SystemHealthReport> {
    const snapshot = await this.generateSnapshot()
    const ecosystemSummary = await this.getPluginEcosystemSummary()

    // Determine overall health
    let overallScore = 100
    const issues: SystemHealthReport['issues'] = []

    // Check plugin runtime health
    const pluginRuntimeHealth: 'healthy' | 'degraded' | 'critical' =
      snapshot.totalPlugins > 0 ? 'healthy' : 'critical'
    if (pluginRuntimeHealth === 'critical') {
      overallScore -= 50
      issues.push({
        severity: 'critical',
        component: 'Plugin Runtime',
        message: 'No plugins registered in the system',
        detectedAt: new Date().toISOString(),
      })
    }

    // Check governance layer health
    const governanceLayerHealth: 'healthy' | 'degraded' | 'critical' =
      snapshot.governanceHealthScore >= 80
        ? 'healthy'
        : snapshot.governanceHealthScore >= 50
        ? 'degraded'
        : 'critical'
    if (governanceLayerHealth === 'degraded') {
      overallScore -= 15
      issues.push({
        severity: 'medium',
        component: 'Governance Layer',
        message: `Governance health score is ${snapshot.governanceHealthScore}/100`,
        detectedAt: new Date().toISOString(),
      })
    } else if (governanceLayerHealth === 'critical') {
      overallScore -= 30
      issues.push({
        severity: 'high',
        component: 'Governance Layer',
        message: `Critical governance health score: ${snapshot.governanceHealthScore}/100`,
        detectedAt: new Date().toISOString(),
      })
    }

    // Check marketplace layer health
    const marketplaceLayerHealth: 'healthy' | 'degraded' | 'critical' =
      snapshot.marketplaceCoverage >= 80 ? 'healthy' : snapshot.marketplaceCoverage >= 50 ? 'degraded' : 'critical'
    if (marketplaceLayerHealth === 'degraded') {
      overallScore -= 10
      issues.push({
        severity: 'low',
        component: 'Marketplace Layer',
        message: `Marketplace coverage is ${snapshot.marketplaceCoverage}%`,
        detectedAt: new Date().toISOString(),
      })
    } else if (marketplaceLayerHealth === 'critical') {
      overallScore -= 20
      issues.push({
        severity: 'medium',
        component: 'Marketplace Layer',
        message: `Low marketplace coverage: ${snapshot.marketplaceCoverage}%`,
        detectedAt: new Date().toISOString(),
      })
    }

    // Check for plugin-specific issues
    for (const plugin of ecosystemSummary) {
      if (plugin.healthIndicators.anomalyCount > 5) {
        overallScore -= 5
        issues.push({
          severity: 'medium',
          component: `Plugin: ${plugin.pluginId}`,
          message: `High anomaly count: ${plugin.healthIndicators.anomalyCount} anomalies detected`,
          detectedAt: new Date().toISOString(),
        })
      }
    }

    overallScore = Math.max(0, Math.min(100, overallScore))

    const overallHealth: 'healthy' | 'degraded' | 'critical' =
      overallScore >= 80 ? 'healthy' : overallScore >= 50 ? 'degraded' : 'critical'

    // Generate recommendations
    const recommendations: string[] = []
    if (snapshot.marketplaceCoverage < 80) {
      recommendations.push('Add marketplace metadata to all plugins for better discoverability')
    }
    if (snapshot.governanceHealthScore < 80) {
      recommendations.push('Review and resolve governance anomalies to improve system stability')
    }
    if (snapshot.qrMenuStatus !== 'healthy') {
      recommendations.push('Enable QR Menu plugin for full functionality')
    }

    return {
      overallHealth,
      score: overallScore,
      components: {
        pluginRuntime: pluginRuntimeHealth,
        governanceLayer: governanceLayerHealth,
        marketplaceLayer: marketplaceLayerHealth,
      },
      issues,
      recommendations,
    }
  }
}

// Singleton instance
export const controlPlane = new ControlPlaneService()
