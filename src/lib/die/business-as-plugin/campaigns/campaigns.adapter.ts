import type { DIEPluginManifest } from '@/lib/die/plugins/core/plugin-manifest'
import { BaseDomainPluginAdapter } from '@/lib/die/business-as-plugin/conversion/adapter.base'
import type { DomainAdapterMeta, GovernanceMapping, MarketplaceSignals, IntelligenceMetrics, UnifiedFeedSignal } from '@/lib/die/business-as-plugin/conversion/types'
import type { CampaignEvent } from './campaigns.contract'

export class CampaignsPluginAdapter extends BaseDomainPluginAdapter {
  meta(): DomainAdapterMeta {
    return {
      pluginId: 'campaigns',
      name: 'Campaigns & Marketing',
      version: '1.0.0',
      category: 'Engagement',
      businessScoped: true,
      pricingModel: 'enterprise',
      visibility: 'enterprise',
      tags: ['marketing', 'campaigns'],
    }
  }

  manifest(): DIEPluginManifest {
    return { routes: { public: [], api: [], dashboard: [] }, permissions: ['campaigns:view'], metadata: { domain: 'campaigns' } }
  }

  mapEventToGovernance(ev: CampaignEvent): GovernanceMapping | null {
    switch (ev.type) {
      case 'CAMPAIGN_FAILED':
        return { eventType: 'ANOMALY_DETECTED' }
      default:
        return null
    }
  }

  mapEventToMarketplace(ev: CampaignEvent): MarketplaceSignals | null {
    return { usageFrequency: 1, lastUsedAt: ev.timestamp, trendDirection: 'UP', activityScore: 2 }
  }

  mapEventToIntelligence(ev: CampaignEvent): IntelligenceMetrics | null {
    switch (ev.type) {
      case 'CAMPAIGN_FAILED':
        return { stabilityScore: 50, governanceRiskScore: 10 }
      case 'CAMPAIGN_COMPLETED':
        return { completionRate: 1 }
      case 'HIGH_CONVERSION_CAMPAIGN':
        return { stabilityScore: 90 }
      case 'LOW_CONVERSION_CAMPAIGN':
        return { lifecycleConsistencyScore: 60 }
      default:
        return null
    }
  }

  mapEventToFeed(ev: CampaignEvent): UnifiedFeedSignal | null {
    switch (ev.type) {
      case 'CAMPAIGN_FAILED':
        return { code: 'CAMPAIGN_FAILED', message: 'Campaign delivery failed', severity: 'WARN', data: ev.data as any }
      case 'CAMPAIGN_CREATED':
        return { code: 'CAMPAIGN_CREATED', message: 'Campaign created', severity: 'INFO', data: ev.data as any }
      case 'CAMPAIGN_SCHEDULED':
        return { code: 'CAMPAIGN_SCHEDULED', message: 'Campaign scheduled', severity: 'INFO', data: ev.data as any }
      case 'CAMPAIGN_STARTED':
        return { code: 'CAMPAIGN_STARTED', message: 'Campaign started', severity: 'INFO', data: ev.data as any }
      case 'CAMPAIGN_COMPLETED':
        return { code: 'CAMPAIGN_COMPLETED', message: 'Campaign completed', severity: 'INFO', data: ev.data as any }
      case 'HIGH_CONVERSION_CAMPAIGN':
        return { code: 'CAMPAIGN_DELIVERABILITY_STRONG', message: 'High delivery success rate observed', severity: 'INFO', data: ev.data as any }
      case 'LOW_CONVERSION_CAMPAIGN':
        return { code: 'CAMPAIGN_DELIVERABILITY_WEAK', message: 'Low delivery success rate observed', severity: 'WARN', data: ev.data as any }
      default:
        return null
    }
  }
}
