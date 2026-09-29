import type { GovernanceMapping, MarketplaceSignals, IntelligenceMetrics, UnifiedFeedSignal, DomainEvent } from './types'

export interface GovernanceIntegrationContract {
  recordLifecycle(event: GovernanceMapping & { pluginId: string; businessId?: string | null; timestamp?: string }): Promise<void>
}

export interface MarketplaceIntegrationContract {
  recordUsage(signals: MarketplaceSignals & { pluginId: string; businessId?: string | null; timestamp?: string }): Promise<void>
}

export interface IntelligenceIntegrationContract {
  recordMetrics(metrics: IntelligenceMetrics & { pluginId: string; businessId?: string | null; timestamp?: string }): Promise<void>
}

export interface ObservabilityIntegrationContract {
  emitFeed(signal: UnifiedFeedSignal & { pluginId: string; timestamp?: string }): Promise<void>
}

export interface DomainEventIngestor {
  ingest(ev: DomainEvent): Promise<void>
}

export interface DomainAdapterBindings {
  governance?: GovernanceIntegrationContract
  marketplace?: MarketplaceIntegrationContract
  intelligence?: IntelligenceIntegrationContract
  observability?: ObservabilityIntegrationContract
}
