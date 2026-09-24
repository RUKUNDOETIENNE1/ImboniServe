import type { DIEPluginManifest } from '@/lib/die/plugins/core/plugin-manifest'
import { BaseDomainPluginAdapter } from '@/lib/die/business-as-plugin/conversion/adapter.base'
import type { DomainAdapterMeta, GovernanceMapping, MarketplaceSignals, IntelligenceMetrics, UnifiedFeedSignal } from '@/lib/die/business-as-plugin/conversion/types'
import type { RoomServiceEvent } from './room-service.contract'

export class RoomServicePluginAdapter extends BaseDomainPluginAdapter {
  meta(): DomainAdapterMeta {
    return {
      pluginId: 'room-service',
      name: 'Hotel Room Service',
      version: '0.1.0',
      category: 'Hospitality',
      businessScoped: true,
      pricingModel: 'enterprise',
      visibility: 'enterprise',
      tags: ['hotel', 'room-service'],
    }
  }

  manifest(): DIEPluginManifest {
    return { routes: { public: [], api: [], dashboard: [] }, permissions: ['room-service:view'], metadata: { domain: 'room-service' } }
  }

  mapEventToGovernance(ev: RoomServiceEvent): GovernanceMapping | null {
    if (ev.type === 'DELAY_ALERT') return { eventType: 'ANOMALY_DETECTED' }
    return { eventType: 'ENABLE' }
  }

  mapEventToMarketplace(ev: RoomServiceEvent): MarketplaceSignals | null {
    return { usageFrequency: 1, lastUsedAt: ev.timestamp, trendDirection: 'STABLE', activityScore: 2 }
  }

  mapEventToIntelligence(ev: RoomServiceEvent): IntelligenceMetrics | null {
    if (ev.type === 'DELAY_ALERT') return { anomalyRate: 1 }
    return null
  }

  mapEventToFeed(ev: RoomServiceEvent): UnifiedFeedSignal | null {
    if (ev.type === 'DELAY_ALERT') return { code: 'ROOM_SERVICE_DELAY', message: 'Room service delay', severity: 'WARN', data: ev.data as any }
    return null
  }
}
