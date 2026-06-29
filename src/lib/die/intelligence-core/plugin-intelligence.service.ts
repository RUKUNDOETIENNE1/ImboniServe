import { governanceEngine } from '@/lib/die/governance/governance-engine.service'
import { pluginRunner } from '@/lib/die/plugins/runtime/plugin-runner'
import type { PluginIntelligenceMetrics } from './types'

/**
 * Plugin Intelligence Service
 * Computes read-only intelligence metrics for individual plugins
 * Does NOT persist - purely derived/computed
 */
export class PluginIntelligenceService {
  /**
   * Compute intelligence metrics for a specific plugin
   */
  async computeMetrics(pluginId: string, businessId: string | null = null): Promise<PluginIntelligenceMetrics> {
    const state = governanceEngine.getState(pluginId, businessId)
    const auditTrail = governanceEngine.getAuditTrail(pluginId, businessId)
    const plugin = pluginRunner.list().find((p) => p.id === pluginId)

    if (!state || !plugin) {
      return {
        pluginId,
        usageFrequency: 0,
        performanceImpactScore: 0,
        anomalyAssociationScore: 0,
        adoptionScore: 0,
        stabilityScore: 0,
      }
    }

    const usageFrequency = this.computeUsageFrequency(state, auditTrail)
    const performanceImpactScore = this.computePerformanceImpact(state)
    const anomalyAssociationScore = this.computeAnomalyScore(auditTrail)
    const adoptionScore = this.computeAdoptionScore(state)
    const stabilityScore = this.computeStabilityScore(state, auditTrail)

    return {
      pluginId,
      usageFrequency,
      performanceImpactScore,
      anomalyAssociationScore,
      adoptionScore,
      stabilityScore,
    }
  }

  /**
   * Compute usage frequency (0-100)
   */
  private computeUsageFrequency(state: any, auditTrail: any[]): number {
    const totalEvents = auditTrail.length
    const enableEvents = auditTrail.filter((e) => e.eventType === 'ENABLE').length

    if (totalEvents === 0) return 0

    const frequency = (enableEvents / totalEvents) * 100
    return Math.min(100, Math.round(frequency))
  }

  /**
   * Compute performance impact score (0-100)
   * Higher = more impact (more operations, more churn)
   */
  private computePerformanceImpact(state: any): number {
    const totalOps = state.installCount + state.enableCount + state.disableCount
    const impactScore = Math.min(100, totalOps * 2)
    return Math.round(impactScore)
  }

  /**
   * Compute anomaly association score (0-100)
   * Higher = more anomalies detected
   */
  private computeAnomalyScore(auditTrail: any[]): number {
    const anomalies = auditTrail.filter((e) => e.eventType === 'ANOMALY_DETECTED').length
    const score = Math.min(100, anomalies * 10)
    return Math.round(score)
  }

  /**
   * Compute adoption score (0-100)
   * Based on install/enable ratio and usage
   */
  private computeAdoptionScore(state: any): number {
    if (state.installCount === 0) return 0

    const enableRatio = state.enableCount / state.installCount
    const adoptionScore = Math.min(100, enableRatio * 100)
    return Math.round(adoptionScore)
  }

  /**
   * Compute stability score (0-100)
   * Higher = more stable (fewer anomalies, consistent lifecycle)
   */
  private computeStabilityScore(state: any, auditTrail: any[]): number {
    let score = 100

    const anomalies = auditTrail.filter((e) => e.eventType === 'ANOMALY_DETECTED').length
    score -= Math.min(50, anomalies * 5)

    if (state.enableCount > state.installCount + 2) score -= 20
    if (state.disableCount > state.enableCount + 2) score -= 20

    const churnRatio = state.disableCount / Math.max(state.enableCount, 1)
    if (churnRatio > 0.5) score -= 10

    return Math.max(0, Math.round(score))
  }

  /**
   * Compute metrics for all plugins
   */
  async computeAllMetrics(): Promise<PluginIntelligenceMetrics[]> {
    const plugins = pluginRunner.list()
    const metrics: PluginIntelligenceMetrics[] = []

    for (const plugin of plugins) {
      const pluginMetrics = await this.computeMetrics(plugin.id)
      metrics.push(pluginMetrics)
    }

    return metrics
  }
}

export const pluginIntelligence = new PluginIntelligenceService()
