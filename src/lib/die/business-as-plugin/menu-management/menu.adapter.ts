import type { DIEPluginManifest } from '@/lib/die/plugins/core/plugin-manifest'
import { BaseDomainPluginAdapter } from '@/lib/die/business-as-plugin/conversion/adapter.base'
import type { DomainAdapterMeta, GovernanceMapping, MarketplaceSignals, IntelligenceMetrics, UnifiedFeedSignal } from '@/lib/die/business-as-plugin/conversion/types'
import type { MenuEvent } from './menu.contract'

export class MenuManagementPluginAdapter extends BaseDomainPluginAdapter {
  meta(): DomainAdapterMeta {
    return {
      pluginId: 'menu-management',
      name: 'Menu Management',
      version: '1.0.0',
      category: 'Operations',
      businessScoped: true,
      pricingModel: 'enterprise',
      visibility: 'enterprise',
      tags: ['menu', 'content'],
    }
  }

  manifest(): DIEPluginManifest {
    return { routes: { public: [], api: [], dashboard: [] }, permissions: ['menu:view'], metadata: { domain: 'menu-management' } }
  }

  mapEventToGovernance(ev: MenuEvent): GovernanceMapping | null {
    if (ev.type === 'MENU_ITEM_ADDED') return { eventType: 'INSTALL' }
    return { eventType: 'ENABLE' }
  }

  mapEventToMarketplace(ev: MenuEvent): MarketplaceSignals | null {
    return { usageFrequency: 1, lastUsedAt: ev.timestamp, trendDirection: 'UP', activityScore: 1 }
  }

  mapEventToIntelligence(ev: MenuEvent): IntelligenceMetrics | null {
    return null
  }

  mapEventToFeed(ev: MenuEvent): UnifiedFeedSignal | null {
    if (ev.type === 'MENU_PUBLISHED') return { code: 'MENU_PUBLISHED', message: 'Menu published', severity: 'INFO', data: ev.data as any }
    return null
  }
}
