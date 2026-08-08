export type TrendDirection = 'UP' | 'STABLE' | 'DOWN'

export interface AdoptionMetrics {
  adoptionScore: number // 0-100
  installToEnableRatio: number // 0..1
  businessAdoptionCount: number
  activationRate: number // 0..1
}

export interface UsageMetrics {
  usageFrequency: number // 0-100
  lastUsedAt: string | null
  trendDirection: TrendDirection
  activityScore: number // 0-100
}

export interface StabilityMetrics {
  anomalyRate: number // 0..1
  churnScore: number // 0-100 (higher = more churn)
  stabilityScore: number // 0-100 (higher = more stable)
  governanceRiskScore: number // 0-100 (higher = more risky)
}

export interface MarketplacePluginIntelligence {
  pluginId: string
  name: string
  category: string
  pricingModel: string
  adoption: AdoptionMetrics
  usage: UsageMetrics
  stability: StabilityMetrics
}

export interface MarketplaceRankings {
  mostAdopted: { pluginId: string; score: number }[]
  fastestGrowing: { pluginId: string; score: number }[]
  mostStable: { pluginId: string; score: number }[]
  highestRisk: { pluginId: string; score: number }[]
}
