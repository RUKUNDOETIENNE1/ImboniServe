import { governanceEngine } from '@/lib/die/governance/governance-engine.service'
import { listMarketplacePlugins } from '@/lib/die/plugins/marketplace/registry'
import type { GovernanceAuditEvent } from '@/lib/die/governance/types'
import type {
  AdoptionMetrics,
  UsageMetrics,
  StabilityMetrics,
  MarketplacePluginIntelligence,
  MarketplaceRankings,
  TrendDirection,
} from './types'

function toMillis(ts: string | null | undefined): number | null {
  if (!ts) return null
  const t = new Date(ts).getTime()
  return isNaN(t) ? null : t
}

export class MarketplaceIntelligenceService {
  /**
   * Compute adoption metrics for a plugin across all businesses
   */
  computeAdoptionMetrics(pluginId: string): AdoptionMetrics {
    const states = governanceEngine.getAllStates().filter((s) => s.pluginId === pluginId)

    const byBusiness = new Map<string | null, typeof states[0]>()
    for (const s of states) {
      const key = s.businessId
      if (!byBusiness.has(key)) {
        byBusiness.set(key, s)
      } else {
        // If duplicates exist, keep the one with latest updatedAt
        const prev = byBusiness.get(key)!
        if (toMillis(s.updatedAt)! > toMillis(prev.updatedAt)!) byBusiness.set(key, s)
      }
    }

    const businessStates = Array.from(byBusiness.values())
    const businessAdoptionCount = businessStates.filter((s) => s.installCount > 0).length

    const totalInstalls = businessStates.reduce((acc, s) => acc + s.installCount, 0)
    const totalEnables = businessStates.reduce((acc, s) => acc + s.enableCount, 0)

    const installToEnableRatio = totalInstalls === 0 ? 0 : Math.min(1, totalEnables / totalInstalls)

    const installedBusinesses = businessStates.filter((s) => s.installCount > 0).length
    const activeBusinesses = businessStates.filter((s) => s.lifecycleState === 'ENABLED').length
    const activationRate = installedBusinesses === 0 ? 0 : activeBusinesses / installedBusinesses

    // Adoption score weights: adoption breadth (50%), activation rate (30%), enable over installs (20%)
    const adoptionScore = Math.round(
      Math.min(100, businessAdoptionCount * 10) * 0.5 + activationRate * 100 * 0.3 + installToEnableRatio * 100 * 0.2
    )

    return {
      adoptionScore,
      installToEnableRatio,
      businessAdoptionCount,
      activationRate,
    }
  }

  /**
   * Compute usage metrics for a plugin using recent audit events
   */
  computeUsageMetrics(pluginId: string, lookbackMinutes: number = 60): UsageMetrics {
    const recent: GovernanceAuditEvent[] = governanceEngine.getRecentAuditEvents(200).filter((e) => e.pluginId === pluginId)

    let lastUsedAt: string | null = null
    if (recent.length > 0) {
      const maxTs = recent.reduce((max, e) => Math.max(max, new Date(e.timestamp).getTime()), 0)
      lastUsedAt = new Date(maxTs).toISOString()
    }

    const now = Date.now()
    const windowMs = lookbackMinutes * 60 * 1000

    const recentWindow = recent.filter((e) => now - new Date(e.timestamp).getTime() <= windowMs)
    const priorWindow = recent.filter((e) => {
      const dt = now - new Date(e.timestamp).getTime()
      return dt > windowMs && dt <= windowMs * 2
    })

    // Activity weighting: ENABLE=3, INSTALL=2, DISABLE=1, ANOMALY=1
    const weight = (e: GovernanceAuditEvent) => (e.eventType === 'ENABLE' ? 3 : e.eventType === 'INSTALL' ? 2 : 1)

    const scoreFor = (events: GovernanceAuditEvent[]) => events.reduce((acc, e) => acc + weight(e), 0)

    const recentScore = scoreFor(recentWindow)
    const priorScore = scoreFor(priorWindow)

    let trendDirection: TrendDirection = 'STABLE'
    if (recentScore > priorScore * 1.2) trendDirection = 'UP'
    else if (recentScore < priorScore * 0.8) trendDirection = 'DOWN'

    // Normalize usage frequency and activity score to 0-100 based on recency and volume
    const usageFrequency = Math.min(100, Math.round((recentWindow.length / Math.max(recent.length, 1)) * 100))
    const activityScore = Math.min(100, Math.round((recentScore / Math.max(recent.length, 1)) * 100))

    return {
      usageFrequency,
      lastUsedAt,
      trendDirection,
      activityScore,
    }
  }

  /**
   * Compute stability metrics using lifecycle churn and anomaly signals
   */
  computeStabilityMetrics(pluginId: string): StabilityMetrics {
    const states = governanceEngine.getAllStates().filter((s) => s.pluginId === pluginId)
    const recent: GovernanceAuditEvent[] = governanceEngine.getRecentAuditEvents(200).filter((e) => e.pluginId === pluginId)

    const anomalies = recent.filter((e) => e.eventType === 'ANOMALY_DETECTED').length
    const anomalyRate = recent.length === 0 ? 0 : anomalies / recent.length

    const totalEnables = states.reduce((acc, s) => acc + s.enableCount, 0)
    const totalDisables = states.reduce((acc, s) => acc + s.disableCount, 0)
    const churnRatio = totalEnables === 0 ? 0 : totalDisables / totalEnables
    const churnScore = Math.min(100, Math.round(churnRatio * 100))

    // Stability: start at 100, penalize anomalies and churn
    const stabilityPenalty = Math.min(60, Math.round(anomalyRate * 100 * 0.6)) + Math.min(40, Math.round(churnScore * 0.4))
    const stabilityScore = Math.max(0, 100 - stabilityPenalty)

    // Governance risk: lifecycle inconsistency + anomaly pressure
    let inconsistencyPenalty = 0
    for (const s of states) {
      if (s.enableCount > s.installCount + 2) inconsistencyPenalty += 10
      if (s.disableCount > s.enableCount + 2) inconsistencyPenalty += 10
    }
    const governanceRiskScore = Math.min(100, Math.round(anomalyRate * 100) + inconsistencyPenalty)

    return {
      anomalyRate,
      churnScore,
      stabilityScore,
      governanceRiskScore,
    }
  }

  /**
   * Compute full marketplace intelligence for all registered plugins
   */
  computeAll(): MarketplacePluginIntelligence[] {
    const plugins = listMarketplacePlugins()
    return plugins.map((p) => {
      const adoption = this.computeAdoptionMetrics(p.id)
      const usage = this.computeUsageMetrics(p.id)
      const stability = this.computeStabilityMetrics(p.id)
      return {
        pluginId: p.id,
        name: p.name,
        category: p.category,
        pricingModel: p.pricingModel,
        adoption,
        usage,
        stability,
      }
    })
  }

  /**
   * Compute marketplace rankings from intelligence metrics
   */
  computeRankings(): MarketplaceRankings {
    const all = this.computeAll()

    const mostAdopted = [...all]
      .sort((a, b) => b.adoption.adoptionScore - a.adoption.adoptionScore)
      .slice(0, 10)
      .map((p) => ({ pluginId: p.pluginId, score: p.adoption.adoptionScore }))

    const fastestGrowing = [...all]
      .sort((a, b) => {
        const growthA = a.usage.trendDirection === 'UP' ? 1 : a.usage.trendDirection === 'DOWN' ? -1 : 0
        const growthB = b.usage.trendDirection === 'UP' ? 1 : b.usage.trendDirection === 'DOWN' ? -1 : 0
        return growthB - growthA || b.usage.activityScore - a.usage.activityScore
      })
      .slice(0, 10)
      .map((p) => ({ pluginId: p.pluginId, score: p.usage.activityScore }))

    const mostStable = [...all]
      .sort((a, b) => b.stability.stabilityScore - a.stability.stabilityScore)
      .slice(0, 10)
      .map((p) => ({ pluginId: p.pluginId, score: p.stability.stabilityScore }))

    const highestRisk = [...all]
      .sort((a, b) => b.stability.governanceRiskScore - a.stability.governanceRiskScore)
      .slice(0, 10)
      .map((p) => ({ pluginId: p.pluginId, score: p.stability.governanceRiskScore }))

    return { mostAdopted, fastestGrowing, mostStable, highestRisk }
  }

  /**
   * Compute metrics for a specific plugin
   */
  computeForPlugin(pluginId: string): MarketplacePluginIntelligence | null {
    const match = listMarketplacePlugins().find((p) => p.id === pluginId)
    if (!match) return null
    return {
      pluginId: match.id,
      name: match.name,
      category: match.category,
      pricingModel: match.pricingModel,
      adoption: this.computeAdoptionMetrics(pluginId),
      usage: this.computeUsageMetrics(pluginId),
      stability: this.computeStabilityMetrics(pluginId),
    }
  }
}

export const marketplaceIntelligence = new MarketplaceIntelligenceService()
