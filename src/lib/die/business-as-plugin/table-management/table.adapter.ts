import type { DIEPluginManifest } from '@/lib/die/plugins/core/plugin-manifest'
import { BaseDomainPluginAdapter } from '@/lib/die/business-as-plugin/conversion/adapter.base'
import type { DomainAdapterMeta, GovernanceMapping, MarketplaceSignals, IntelligenceMetrics, UnifiedFeedSignal } from '@/lib/die/business-as-plugin/conversion/types'
import type { TableEvent } from './table.contract'

export class TableManagementPluginAdapter extends BaseDomainPluginAdapter {
  meta(): DomainAdapterMeta {
    return {
      pluginId: 'table-management',
      name: 'Table Management',
      version: '1.0.0',
      category: 'Operations',
      businessScoped: true,
      pricingModel: 'enterprise',
      visibility: 'enterprise',
      tags: ['tables', 'foh'],
    }
  }

  manifest(): DIEPluginManifest {
    return { routes: { public: [], api: [], dashboard: [] }, permissions: ['tables:view'], metadata: { domain: 'table-management' } }
  }

  mapEventToGovernance(ev: TableEvent): GovernanceMapping | null {
    return { eventType: 'ENABLE' }
  }

  mapEventToMarketplace(ev: TableEvent): MarketplaceSignals | null {
    return { usageFrequency: 1, lastUsedAt: ev.timestamp, trendDirection: 'STABLE', activityScore: 1 }
  }

  mapEventToIntelligence(ev: TableEvent): IntelligenceMetrics | null {
    return null
  }

  mapEventToFeed(ev: TableEvent): UnifiedFeedSignal | null {
    if (ev.type === 'TABLE_STATUS_UPDATED') return { code: 'TABLE_STATUS', message: `Table status ${ev.data?.status}`, severity: 'INFO', data: ev.data as any }
    return null
  }
}
