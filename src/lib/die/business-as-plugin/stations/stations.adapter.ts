import type { DIEPluginManifest } from '@/lib/die/plugins/core/plugin-manifest'
import { BaseDomainPluginAdapter } from '@/lib/die/business-as-plugin/conversion/adapter.base'
import type { DomainAdapterMeta, GovernanceMapping, MarketplaceSignals, IntelligenceMetrics, UnifiedFeedSignal } from '@/lib/die/business-as-plugin/conversion/types'
import type { StationEvent } from './stations.contract'

export class StationsPluginAdapter extends BaseDomainPluginAdapter {
  meta(): DomainAdapterMeta {
    return {
      pluginId: 'stations',
      name: 'Stations & Routing',
      version: '1.0.0',
      category: 'Operations',
      businessScoped: true,
      pricingModel: 'enterprise',
      visibility: 'enterprise',
      tags: ['stations', 'routing'],
    }
  }

  manifest(): DIEPluginManifest {
    return { routes: { public: [], api: [], dashboard: [] }, permissions: ['stations:view'], metadata: { domain: 'stations' } }
  }

  mapEventToGovernance(ev: StationEvent): GovernanceMapping | null {
    if (ev.type === 'ROUTE_FAILED') return { eventType: 'ANOMALY_DETECTED' }
    if (ev.type === 'STATION_CREATED') return { eventType: 'INSTALL' }
    return { eventType: 'ENABLE' }
  }

  mapEventToMarketplace(ev: StationEvent): MarketplaceSignals | null {
    return { usageFrequency: 1, lastUsedAt: ev.timestamp, trendDirection: 'STABLE', activityScore: 1 }
  }

  mapEventToIntelligence(ev: StationEvent): IntelligenceMetrics | null {
    if (ev.type === 'ROUTE_FAILED') return { anomalyRate: 1, governanceRiskScore: 15 }
    return null
  }

  mapEventToFeed(ev: StationEvent): UnifiedFeedSignal | null {
    if (ev.type === 'ROUTE_FAILED') return { code: 'ROUTE_FAILED', message: 'Station routing failed', severity: 'WARN', data: ev.data as any }
    return null
  }
}
