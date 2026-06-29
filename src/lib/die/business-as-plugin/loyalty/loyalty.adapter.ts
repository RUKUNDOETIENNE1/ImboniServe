import type { DIEPluginManifest } from '@/lib/die/plugins/core/plugin-manifest'
import { BaseDomainPluginAdapter } from '@/lib/die/business-as-plugin/conversion/adapter.base'
import type { DomainAdapterMeta, GovernanceMapping, MarketplaceSignals, IntelligenceMetrics, UnifiedFeedSignal } from '@/lib/die/business-as-plugin/conversion/types'
import type { LoyaltyEvent } from './loyalty.contract'

export class LoyaltyPluginAdapter extends BaseDomainPluginAdapter {
  meta(): DomainAdapterMeta {
    return {
      pluginId: 'loyalty',
      name: 'Loyalty Program',
      version: '1.0.0',
      category: 'Engagement',
      businessScoped: true,
      pricingModel: 'enterprise',
      visibility: 'enterprise',
      tags: ['loyalty', 'points', 'vip'],
    }
  }

  manifest(): DIEPluginManifest {
    return { routes: { public: [], api: [], dashboard: [] }, permissions: ['loyalty:view'], metadata: { domain: 'loyalty' } }
  }

  mapEventToGovernance(ev: LoyaltyEvent): GovernanceMapping | null {
    if (ev.type === 'REDEMPTION_DENIED') return { eventType: 'ANOMALY_DETECTED' }
    return { eventType: 'ENABLE' }
  }

  mapEventToMarketplace(ev: LoyaltyEvent): MarketplaceSignals | null {
    return { usageFrequency: 1, lastUsedAt: ev.timestamp, trendDirection: 'UP', activityScore: 4 }
  }

  mapEventToIntelligence(ev: LoyaltyEvent): IntelligenceMetrics | null {
    if (ev.type === 'REDEMPTION_DENIED') return { governanceRiskScore: 15 }
    return null
  }

  mapEventToFeed(ev: LoyaltyEvent): UnifiedFeedSignal | null {
    if (ev.type === 'POINTS_REDEEMED') return { code: 'LOYALTY_REDEMPTION', message: 'Points redeemed', severity: 'INFO', data: ev.data as any }
    return null
  }
}
