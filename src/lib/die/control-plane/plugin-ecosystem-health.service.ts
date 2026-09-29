// DIE Plugin Ecosystem Health Engine — lifecycle drift, usage patterns, stability analysis

import { pluginRunner } from '../plugins/runtime/plugin-runner'
import { governanceEngine } from '../governance/governance-engine.service'
import { GovernanceGuardService } from '../governance/governance-guard.service'
import type { PluginHealthMetrics } from './types'

export class PluginEcosystemHealthService {
  private readonly governanceGuard: GovernanceGuardService

  constructor() {
    this.governanceGuard = new GovernanceGuardService(governanceEngine)
  }

  /**
   * Compute health metrics for a specific plugin
   */
  async computePluginHealth(pluginId: string, businessId: string | null = null): Promise<PluginHealthMetrics> {
    const plugin = pluginRunner.list().find((p) => p.id === pluginId)
    const governanceState = governanceEngine.getState(pluginId, businessId)
    const auditTrail = governanceEngine.getAuditTrail(pluginId, businessId)
    const anomalies = auditTrail.filter((e) => e.eventType === 'ANOMALY_DETECTED')

    // Lifecycle consistency
    const installCount = governanceState?.installCount ?? 0
    const enableCount = governanceState?.enableCount ?? 0
    const disableCount = governanceState?.disableCount ?? 0

    const isConsistent = enableCount <= installCount + 2 && disableCount <= enableCount + 2
    const hasRepeatedCycles = enableCount > 5 && disableCount > 5

    // Usage analysis
    const isActive = governanceState?.lifecycleState === 'ENABLED'
    const lastUsedAt = governanceState?.lastStateChangeAt ?? null
    const isUnused = !governanceState || governanceState.lifecycleState === 'DISCOVERED'

    // Stability analysis
    const isStable = anomalies.length === 0 && !hasRepeatedCycles
    const recentAnomalies = anomalies.slice(-5).map((a) => a.metadata?.anomalyType as string ?? 'UNKNOWN')

    // Compute health score (0-100)
    let healthScore = 100

    if (!isConsistent) healthScore -= 20
    if (hasRepeatedCycles) healthScore -= 15
    if (isUnused) healthScore -= 10
    if (anomalies.length > 0) healthScore -= Math.min(30, anomalies.length * 5)
    if (!isStable) healthScore -= 10

    healthScore = Math.max(0, Math.min(100, healthScore))

    return {
      pluginId,
      healthScore,
      lifecycle: {
        isConsistent,
        hasRepeatedCycles,
        installCount,
        enableCount,
        disableCount,
      },
      usage: {
        isActive,
        lastUsedAt,
        isUnused,
      },
      stability: {
        isStable,
        anomalyCount: anomalies.length,
        recentAnomalies,
      },
    }
  }

  /**
   * Compute health metrics for all plugins
   */
  async computeAllPluginHealth(): Promise<PluginHealthMetrics[]> {
    const plugins = pluginRunner.list()
    const metrics: PluginHealthMetrics[] = []

    for (const plugin of plugins) {
      const health = await this.computePluginHealth(plugin.id)
      metrics.push(health)
    }

    return metrics
  }

  /**
   * Detect lifecycle drift (plugins with inconsistent state transitions)
   */
  async detectLifecycleDrift(): Promise<{
    pluginId: string
    driftType: 'ENABLE_WITHOUT_INSTALL' | 'EXCESSIVE_REINSTALLS' | 'REPEATED_CYCLES'
    severity: 'LOW' | 'MEDIUM' | 'HIGH'
    details: string
  }[]> {
    const plugins = pluginRunner.list()
    const drifts: {
      pluginId: string
      driftType: 'ENABLE_WITHOUT_INSTALL' | 'EXCESSIVE_REINSTALLS' | 'REPEATED_CYCLES'
      severity: 'LOW' | 'MEDIUM' | 'HIGH'
      details: string
    }[] = []

    for (const plugin of plugins) {
      const state = governanceEngine.getState(plugin.id)
      if (!state) continue

      // Detect enable without install
      if (state.enableCount > state.installCount + 1) {
        drifts.push({
          pluginId: plugin.id,
          driftType: 'ENABLE_WITHOUT_INSTALL',
          severity: 'MEDIUM',
          details: `Plugin has ${state.enableCount} enables but only ${state.installCount} installs`,
        })
      }

      // Detect excessive reinstalls
      if (state.installCount > 5) {
        drifts.push({
          pluginId: plugin.id,
          driftType: 'EXCESSIVE_REINSTALLS',
          severity: 'MEDIUM',
          details: `Plugin has been installed ${state.installCount} times`,
        })
      }

      // Detect repeated cycles
      if (state.enableCount > 10 && state.disableCount > 10) {
        drifts.push({
          pluginId: plugin.id,
          driftType: 'REPEATED_CYCLES',
          severity: 'HIGH',
          details: `Plugin has ${state.enableCount} enables and ${state.disableCount} disables`,
        })
      }
    }

    return drifts
  }

  /**
   * Detect unused plugins
   */
  async detectUnusedPlugins(): Promise<{
    pluginId: string
    name: string
    reason: string
  }[]> {
    const plugins = pluginRunner.list()
    const unused: { pluginId: string; name: string; reason: string }[] = []

    for (const plugin of plugins) {
      const state = governanceEngine.getState(plugin.id)

      if (!state) {
        unused.push({
          pluginId: plugin.id,
          name: plugin.name,
          reason: 'Never installed or enabled',
        })
        continue
      }

      if (state.lifecycleState === 'DISCOVERED') {
        unused.push({
          pluginId: plugin.id,
          name: plugin.name,
          reason: 'Discovered but never installed',
        })
        continue
      }

      if (state.lifecycleState === 'DISABLED' && state.disableCount > 0) {
        const daysSinceLastChange = state.lastStateChangeAt
          ? (Date.now() - new Date(state.lastStateChangeAt).getTime()) / (1000 * 60 * 60 * 24)
          : 999

        if (daysSinceLastChange > 30) {
          unused.push({
            pluginId: plugin.id,
            name: plugin.name,
            reason: `Disabled for ${Math.round(daysSinceLastChange)} days`,
          })
        }
      }
    }

    return unused
  }

  /**
   * Detect overused plugins (potential performance concerns)
   */
  async detectOverusedPlugins(): Promise<{
    pluginId: string
    name: string
    usageMetrics: {
      installCount: number
      enableCount: number
      disableCount: number
    }
    concern: string
  }[]> {
    const plugins = pluginRunner.list()
    const overused: {
      pluginId: string
      name: string
      usageMetrics: { installCount: number; enableCount: number; disableCount: number }
      concern: string
    }[] = []

    for (const plugin of plugins) {
      const state = governanceEngine.getState(plugin.id)
      if (!state) continue

      const totalOperations = state.installCount + state.enableCount + state.disableCount

      if (totalOperations > 50) {
        overused.push({
          pluginId: plugin.id,
          name: plugin.name,
          usageMetrics: {
            installCount: state.installCount,
            enableCount: state.enableCount,
            disableCount: state.disableCount,
          },
          concern: `High lifecycle operation count: ${totalOperations} total operations`,
        })
      }
    }

    return overused
  }

  /**
   * Detect unstable plugins (frequent state changes)
   */
  async detectUnstablePlugins(): Promise<{
    pluginId: string
    name: string
    anomalyCount: number
    recentAnomalies: string[]
  }[]> {
    const plugins = pluginRunner.list()
    const unstable: {
      pluginId: string
      name: string
      anomalyCount: number
      recentAnomalies: string[]
    }[] = []

    for (const plugin of plugins) {
      const auditTrail = governanceEngine.getAuditTrail(plugin.id)
      const anomalies = auditTrail.filter((e) => e.eventType === 'ANOMALY_DETECTED')

      if (anomalies.length > 3) {
        unstable.push({
          pluginId: plugin.id,
          name: plugin.name,
          anomalyCount: anomalies.length,
          recentAnomalies: anomalies.slice(-5).map((a) => a.metadata?.anomalyType as string ?? 'UNKNOWN'),
        })
      }
    }

    return unstable
  }

  /**
   * Get ecosystem health summary
   */
  async getEcosystemHealthSummary(): Promise<{
    totalPlugins: number
    healthyPlugins: number
    degradedPlugins: number
    criticalPlugins: number
    averageHealthScore: number
    topIssues: string[]
  }> {
    const allHealth = await this.computeAllPluginHealth()

    const totalPlugins = allHealth.length
    const healthyPlugins = allHealth.filter((h) => h.healthScore >= 80).length
    const degradedPlugins = allHealth.filter((h) => h.healthScore >= 50 && h.healthScore < 80).length
    const criticalPlugins = allHealth.filter((h) => h.healthScore < 50).length

    const averageHealthScore =
      totalPlugins > 0 ? allHealth.reduce((sum, h) => sum + h.healthScore, 0) / totalPlugins : 0

    const topIssues: string[] = []
    const drifts = await this.detectLifecycleDrift()
    const unused = await this.detectUnusedPlugins()
    const unstable = await this.detectUnstablePlugins()

    if (drifts.length > 0) {
      topIssues.push(`${drifts.length} plugin(s) with lifecycle drift detected`)
    }
    if (unused.length > 0) {
      topIssues.push(`${unused.length} unused plugin(s) detected`)
    }
    if (unstable.length > 0) {
      topIssues.push(`${unstable.length} unstable plugin(s) detected`)
    }

    return {
      totalPlugins,
      healthyPlugins,
      degradedPlugins,
      criticalPlugins,
      averageHealthScore: Math.round(averageHealthScore * 10) / 10,
      topIssues,
    }
  }
}

// Singleton instance
export const pluginEcosystemHealth = new PluginEcosystemHealthService()
