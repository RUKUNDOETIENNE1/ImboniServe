import { systemIntelligence } from '@/lib/die/intelligence-core/system-intelligence.service'
import { intelligenceSnapshotBuilder } from '@/lib/die/intelligence-core/intelligence-snapshot.builder'
import { marketplaceIntelligence } from '@/lib/die/marketplace/intelligence/marketplace-intelligence.service'
import { trendAnalyzer } from '@/lib/die/control-plane/background/trend-analyzer'
import { persistenceFactory } from '@/lib/die/persistence/factory'
import { nanoid } from 'nanoid'
import type {
  UnifiedFeedItem,
  UnifiedSeverity,
  UnifiedSource,
  UnifiedIntelligencePayload,
  ExecutiveIntelligenceSnapshot,
  CrossDomainCorrelationLayer,
  PersistenceMetricsSummary,
} from './types'

export class UnifiedIntelligenceService {
  private controlPlaneRepo = persistenceFactory.getControlPlaneRepository()

  /**
   * Build the unified system intelligence payload
   */
  async buildUnifiedPayload(): Promise<UnifiedIntelligencePayload & { persistence: PersistenceMetricsSummary }> {
    const [intelligence, marketAll, trends, recentSnapshots] = await Promise.all([
      intelligenceSnapshotBuilder.buildSnapshot(),
      Promise.resolve(marketplaceIntelligence.computeAll()),
      trendAnalyzer.getTrendSummary(),
      this.controlPlaneRepo.listSnapshots(5),
    ])

    const feed = this.buildUnifiedFeed(intelligence, marketAll, trends)
    const executive = this.buildExecutiveSnapshot(intelligence, marketAll, trends)
    const correlations = this.buildCrossDomainCorrelations(marketAll, intelligence, trends)

    const persistence: PersistenceMetricsSummary = {
      lastSnapshotAt: recentSnapshots[0]?.generatedAt ?? null,
      lastSnapshotAgeMs: recentSnapshots[0]?.generatedAt ? Date.now() - new Date(recentSnapshots[0].generatedAt).getTime() : null,
      snapshotsReturned: recentSnapshots.length,
    }

    return { feed, executive, correlations, persistence }
  }

  /**
   * Build the unified feed (timestamped observations with severity and source)
   */
  private buildUnifiedFeed(intel: any, marketplace: any[], trends: any): UnifiedFeedItem[] {
    const items: UnifiedFeedItem[] = []

    const push = (source: UnifiedSource, severity: UnifiedSeverity, code: string, message: string, data?: any) => {
      items.push({ id: nanoid(12), timestamp: new Date().toISOString(), source, severity, code, message, data })
    }

    // Control Plane + Governance health
    push(
      'control-plane',
      intel.systemHealth.status === 'CRITICAL' ? 'CRITICAL' : intel.systemHealth.status === 'DEGRADED' ? 'WARN' : 'INFO',
      'CONTROL_PLANE_HEALTH',
      `Control plane health status: ${intel.systemHealth.status} (score=${intel.systemHealth.overallScore})`,
      { overallScore: intel.systemHealth.overallScore }
    )

    // Marketplace signals
    for (const p of marketplace) {
      if (p.usage.trendDirection === 'UP') {
        push('marketplace', 'INFO', 'PLUGIN_TREND_UP', `Plugin ${p.pluginId} trending up`, { pluginId: p.pluginId })
      } else if (p.usage.trendDirection === 'DOWN') {
        push('marketplace', 'WARN', 'PLUGIN_TREND_DOWN', `Plugin ${p.pluginId} trending down`, { pluginId: p.pluginId })
      }

      if (p.stability.governanceRiskScore >= 80) {
        push('governance', 'CRITICAL', 'PLUGIN_HIGH_RISK', `Plugin ${p.pluginId} high governance risk`, {
          pluginId: p.pluginId,
          risk: p.stability.governanceRiskScore,
        })
      } else if (p.stability.governanceRiskScore >= 50) {
        push('governance', 'WARN', 'PLUGIN_RISK_ELEVATED', `Plugin ${p.pluginId} elevated risk`, {
          pluginId: p.pluginId,
          risk: p.stability.governanceRiskScore,
        })
      }

      if (p.adoption.adoptionScore >= 80) {
        push('marketplace', 'INFO', 'PLUGIN_HIGH_ADOPTION', `Plugin ${p.pluginId} high adoption`, {
          pluginId: p.pluginId,
          adoptionScore: p.adoption.adoptionScore,
        })
      }
    }

    // Trends summary
    push('trends', 'INFO', 'HEALTH_TREND', `Health trend: ${trends.health.trend} (${trends.health.changePercent}%)`, trends.health)
    push('trends', 'INFO', 'GOVERNANCE_TREND', `Governance trend: ${trends.governance.trend}`, trends.governance)
    push('trends', 'INFO', 'ANOMALY_TREND', `Anomaly trend: ${trends.anomalies.trend}`, trends.anomalies)

    return items
  }

  /**
   * Build executive snapshot with consolidated scores
   */
  private buildExecutiveSnapshot(intel: any, marketplace: any[], trends: any): ExecutiveIntelligenceSnapshot {
    const platformHealth = intel.systemHealth.overallScore
    const governanceHealth = intel.controlPlane.governanceHealthScore

    const marketplaceHealth = Math.round(
      marketplace.reduce((acc, p) => acc + (p.stability.stabilityScore + p.adoption.adoptionScore) / 2, 0) /
        Math.max(marketplace.length, 1)
    )

    const ecosystemHealth = Math.max(0, Math.min(100, 100 - (trends.anomalies.currentCount * 5)))

    // Overall risk: invert combined health + add risk pressure from marketplace high risk signals
    const avgHealth = (platformHealth + governanceHealth + marketplaceHealth + ecosystemHealth) / 4
    const riskPressure = marketplace.filter((p) => p.stability.governanceRiskScore >= 80).length * 5
    const overallRiskScore = Math.min(100, Math.round((100 - avgHealth) + riskPressure))

    return {
      timestamp: new Date().toISOString(),
      platformHealth,
      governanceHealth,
      marketplaceHealth,
      ecosystemHealth,
      overallRiskScore,
    }
  }

  /**
   * Build cross-domain correlations across marketplace and intelligence core
   */
  private buildCrossDomainCorrelations(marketplace: any[], intel: any, trends: any): CrossDomainCorrelationLayer {
    const highAdoptionHighRisk = marketplace
      .filter((p) => p.adoption.adoptionScore >= 70 && p.stability.governanceRiskScore >= 70)
      .map((p) => p.pluginId)

    const highGrowthLowStability = marketplace
      .filter((p) => p.usage.trendDirection === 'UP' && p.stability.stabilityScore < 60)
      .map((p) => p.pluginId)

    const lowAdoptionHighStability = marketplace
      .filter((p) => p.adoption.adoptionScore < 30 && p.stability.stabilityScore >= 80)
      .map((p) => p.pluginId)

    const trendsVsAnomalies = marketplace.map((p) => ({
      pluginId: p.pluginId,
      trend: p.usage.trendDirection,
      anomalies: intel.controlPlane.runtimeWarnings?.length ?? 0,
    }))

    const adoptionVsStability = marketplace.map((p) => ({
      pluginId: p.pluginId,
      adoptionScore: p.adoption.adoptionScore,
      stabilityScore: p.stability.stabilityScore,
    }))

    return {
      highAdoptionHighRisk,
      highGrowthLowStability,
      lowAdoptionHighStability,
      trendsVsAnomalies,
      adoptionVsStability,
    }
  }
}

export const unifiedIntelligence = new UnifiedIntelligenceService()
