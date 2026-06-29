import type { DIEPlugin } from '@/lib/die/plugins/core/plugin-types'
import type { DIEPluginManifest } from '@/lib/die/plugins/core/plugin-manifest'
import type { TrendDirection } from '@/lib/die/marketplace/intelligence/types'

export interface DomainEvent {
  domain: string
  type: string
  timestamp: string
  businessId?: string | null
  data?: Record<string, unknown>
  severity?: 'INFO' | 'WARN' | 'CRITICAL'
}

export interface DomainAdapterMeta {
  pluginId: string
  name: string
  version: string
  category: string
  businessScoped: boolean
  pricingModel?: 'free' | 'freemium' | 'paid' | 'enterprise'
  visibility?: 'public' | 'private' | 'enterprise'
  tags?: string[]
}

export interface GovernanceMapping {
  eventType: 'INSTALL' | 'ENABLE' | 'DISABLE' | 'ANOMALY_DETECTED'
  metadata?: Record<string, unknown>
}

export interface MarketplaceSignals {
  adoptionScore?: number
  usageFrequency?: number
  lastUsedAt?: string | null
  trendDirection?: TrendDirection
  activityScore?: number
}

export interface IntelligenceMetrics {
  stabilityScore?: number
  anomalyRate?: number
  governanceRiskScore?: number
  lifecycleConsistencyScore?: number
  stockRiskScore?: number
  shortageRiskScore?: number
  procurementRiskScore?: number
  fulfillmentRiskScore?: number
  delayRiskScore?: number
  procurementEfficiencyScore?: number
  deliveryRiskScore?: number
  completionRate?: number
}

export interface UnifiedFeedSignal {
  code: string
  message: string
  severity: 'INFO' | 'WARN' | 'CRITICAL'
  data?: Record<string, unknown>
}

export interface DomainPluginAdapter {
  meta(): DomainAdapterMeta
  manifest(): DIEPluginManifest
  mapEventToGovernance(ev: DomainEvent): GovernanceMapping | null
  mapEventToMarketplace(ev: DomainEvent): MarketplaceSignals | null
  mapEventToIntelligence(ev: DomainEvent): IntelligenceMetrics | null
  mapEventToFeed(ev: DomainEvent): UnifiedFeedSignal | null
  buildPlugin(): DIEPlugin
}
