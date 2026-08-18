import type { TrendDirection } from '@/lib/die/marketplace/intelligence/types'

export type UnifiedSource =
  | 'governance'
  | 'marketplace'
  | 'control-plane'
  | 'intelligence-core'
  | 'trends'
  | 'persistence'

export type UnifiedSeverity = 'INFO' | 'WARN' | 'CRITICAL'

export interface UnifiedFeedItem {
  id: string
  timestamp: string
  source: UnifiedSource
  severity: UnifiedSeverity
  code: string
  message: string
  data?: Record<string, unknown>
}

export interface ExecutiveIntelligenceSnapshot {
  timestamp: string
  platformHealth: number // 0-100
  governanceHealth: number // 0-100
  marketplaceHealth: number // 0-100
  ecosystemHealth: number // 0-100
  overallRiskScore: number // 0-100 (higher = more risky)
}

export interface CrossDomainCorrelationLayer {
  highAdoptionHighRisk: string[]
  highGrowthLowStability: string[]
  lowAdoptionHighStability: string[]
  trendsVsAnomalies: Array<{ pluginId: string; trend: TrendDirection; anomalies: number }>
  adoptionVsStability: Array<{ pluginId: string; adoptionScore: number; stabilityScore: number }>
}

export interface UnifiedIntelligencePayload {
  feed: UnifiedFeedItem[]
  executive: ExecutiveIntelligenceSnapshot
  correlations: CrossDomainCorrelationLayer
}

export interface PersistenceMetricsSummary {
  lastSnapshotAt: string | null
  lastSnapshotAgeMs: number | null
  snapshotsReturned: number
}
