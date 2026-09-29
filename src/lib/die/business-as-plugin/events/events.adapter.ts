import type { DIEPluginManifest } from '@/lib/die/plugins/core/plugin-manifest'
import { BaseDomainPluginAdapter } from '@/lib/die/business-as-plugin/conversion/adapter.base'
import type { DomainAdapterMeta, GovernanceMapping, MarketplaceSignals, IntelligenceMetrics, UnifiedFeedSignal } from '@/lib/die/business-as-plugin/conversion/types'
import type { BizEventEvent } from './events.contract'

export class EventManagementPluginAdapter extends BaseDomainPluginAdapter {
  meta(): DomainAdapterMeta {
    return {
      pluginId: 'event-management',
      name: 'Event Management',
      version: '1.0.0',
      category: 'Operations',
      businessScoped: true,
      pricingModel: 'enterprise',
      visibility: 'enterprise',
      tags: ['events', 'tickets'],
    }
  }

  manifest(): DIEPluginManifest {
    return { routes: { public: [], api: [], dashboard: [] }, permissions: ['events:view'], metadata: { domain: 'events' } }
  }

  mapEventToGovernance(ev: BizEventEvent): GovernanceMapping | null {
    if (ev.type === 'CAPACITY_ALERT' || ev.type === 'SPIKE_DETECTED') return { eventType: 'ANOMALY_DETECTED' }
    if (ev.type === 'EVENT_CREATED') return { eventType: 'INSTALL' }
    return { eventType: 'ENABLE' }
  }

  mapEventToMarketplace(ev: BizEventEvent): MarketplaceSignals | null {
    return { usageFrequency: 1, lastUsedAt: ev.timestamp, trendDirection: 'UP', activityScore: 2 }
  }

  mapEventToIntelligence(ev: BizEventEvent): IntelligenceMetrics | null {
    if (ev.type === 'CAPACITY_ALERT') return { anomalyRate: 1 }
    return null
  }

  mapEventToFeed(ev: BizEventEvent): UnifiedFeedSignal | null {
    if (ev.type === 'CAPACITY_ALERT') return { code: 'EVENT_CAPACITY_ALERT', message: 'Event capacity alert', severity: 'WARN', data: ev.data as any }
    return null
  }
}
