import type { DIEPluginManifest } from '@/lib/die/plugins/core/plugin-manifest'
import { BaseDomainPluginAdapter } from '@/lib/die/business-as-plugin/conversion/adapter.base'
import type { DomainAdapterMeta, GovernanceMapping, MarketplaceSignals, IntelligenceMetrics, UnifiedFeedSignal } from '@/lib/die/business-as-plugin/conversion/types'
import type { HotelRoomEvent } from './hotel-rooms.contract'

export class HotelRoomsPluginAdapter extends BaseDomainPluginAdapter {
  meta(): DomainAdapterMeta {
    return {
      pluginId: 'hotel-rooms',
      name: 'Hotel Rooms',
      version: '0.1.0',
      category: 'Hospitality',
      businessScoped: true,
      pricingModel: 'enterprise',
      visibility: 'enterprise',
      tags: ['hotel', 'rooms'],
    }
  }

  manifest(): DIEPluginManifest {
    return { routes: { public: [], api: [], dashboard: [] }, permissions: ['hotel-rooms:view'], metadata: { domain: 'hotel-rooms' } }
  }

  mapEventToGovernance(ev: HotelRoomEvent): GovernanceMapping | null {
    if (ev.type === 'MAINTENANCE_SCHEDULED') return { eventType: 'ANOMALY_DETECTED' }
    if (ev.type === 'ROOM_CREATED') return { eventType: 'INSTALL' }
    return { eventType: 'ENABLE' }
  }

  mapEventToMarketplace(ev: HotelRoomEvent): MarketplaceSignals | null {
    return { usageFrequency: 1, lastUsedAt: ev.timestamp, trendDirection: 'STABLE', activityScore: 1 }
  }

  mapEventToIntelligence(ev: HotelRoomEvent): IntelligenceMetrics | null {
    return null
  }

  mapEventToFeed(ev: HotelRoomEvent): UnifiedFeedSignal | null {
    if (ev.type === 'CHECKED_IN') return { code: 'ROOM_CHECKIN', message: 'Guest checked in', severity: 'INFO', data: ev.data as any }
    return null
  }
}
