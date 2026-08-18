import type { DIEPluginManifest } from '@/lib/die/plugins/core/plugin-manifest'
import { BaseDomainPluginAdapter } from '@/lib/die/business-as-plugin/conversion/adapter.base'
import type { DomainAdapterMeta, GovernanceMapping, MarketplaceSignals, IntelligenceMetrics, UnifiedFeedSignal } from '@/lib/die/business-as-plugin/conversion/types'
import type { KDSEvent } from './kds.contract'

export class KDSPluginAdapter extends BaseDomainPluginAdapter {
  meta(): DomainAdapterMeta {
    return {
      pluginId: 'kds',
      name: 'Kitchen Display System',
      version: '1.0.0',
      category: 'Operations',
      businessScoped: true,
      pricingModel: 'enterprise',
      visibility: 'enterprise',
      tags: ['kitchen', 'stations', 'orders'],
    }
  }

  manifest(): DIEPluginManifest {
    return {
      routes: { public: [], api: [], dashboard: [] },
      permissions: ['kds:view'],
      metadata: { domain: 'kds' },
    }
  }

  mapEventToGovernance(ev: KDSEvent): GovernanceMapping | null {
    if (ev.type === 'ROUTING_FAILED' || ev.type === 'BACKLOG_ALERT') return { eventType: 'ANOMALY_DETECTED' }
    return { eventType: 'ENABLE' }
  }

  mapEventToMarketplace(ev: KDSEvent): MarketplaceSignals | null {
    return { usageFrequency: 1, lastUsedAt: ev.timestamp, trendDirection: 'UP', activityScore: 5 }
  }

  mapEventToIntelligence(ev: KDSEvent): IntelligenceMetrics | null {
    if (ev.type === 'ROUTING_FAILED' || ev.type === 'BACKLOG_ALERT') return { anomalyRate: 1, governanceRiskScore: 30 }
    return null
  }

  mapEventToFeed(ev: KDSEvent): UnifiedFeedSignal | null {
    if (ev.type === 'ROUTING_FAILED') return { code: 'KDS_ROUTING_FAILED', message: 'Routing failure', severity: 'WARN', data: ev.data as any }
    if (ev.type === 'BACKLOG_ALERT') return { code: 'KDS_BACKLOG_ALERT', message: 'Kitchen backlog rising', severity: 'WARN', data: ev.data as any }
    if (ev.type === 'ORDER_CREATED') return { code: 'KDS_ORDER_RECEIVED', message: 'Order received in kitchen', severity: 'INFO', data: ev.data as any }
    if (ev.type === 'ITEM_PREPARING') return { code: 'KDS_ORDER_UPDATED', message: 'Order items in preparation', severity: 'INFO', data: ev.data as any }
    if (ev.type === 'ITEM_READY') return { code: 'KDS_ORDER_UPDATED', message: 'Order items ready', severity: 'INFO', data: ev.data as any }
    if (ev.type === 'ORDER_SERVED') return { code: 'KDS_ORDER_COMPLETED', message: 'Order served', severity: 'INFO', data: ev.data as any }
    return null
  }
}
