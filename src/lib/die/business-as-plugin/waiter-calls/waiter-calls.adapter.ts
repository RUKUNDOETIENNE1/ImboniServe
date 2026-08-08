import type { DIEPluginManifest } from '@/lib/die/plugins/core/plugin-manifest'
import { BaseDomainPluginAdapter } from '@/lib/die/business-as-plugin/conversion/adapter.base'
import type { DomainAdapterMeta, GovernanceMapping, MarketplaceSignals, IntelligenceMetrics, UnifiedFeedSignal } from '@/lib/die/business-as-plugin/conversion/types'
import type { WaiterCallEvent } from './waiter-calls.contract'

export class WaiterCallsPluginAdapter extends BaseDomainPluginAdapter {
  meta(): DomainAdapterMeta {
    return {
      pluginId: 'waiter-calls',
      name: 'Waiter Calls',
      version: '1.0.0',
      category: 'Operations',
      businessScoped: true,
      pricingModel: 'enterprise',
      visibility: 'enterprise',
      tags: ['waiter', 'calls'],
    }
  }

  manifest(): DIEPluginManifest {
    return { routes: { public: [], api: [], dashboard: [] }, permissions: ['waiter-calls:view'], metadata: { domain: 'waiter-calls' } }
  }

  mapEventToGovernance(ev: WaiterCallEvent): GovernanceMapping | null {
    if (ev.type === 'SLA_BREACH_ALERT') return { eventType: 'ANOMALY_DETECTED' }
    return { eventType: 'ENABLE' }
  }

  mapEventToMarketplace(ev: WaiterCallEvent): MarketplaceSignals | null {
    return { usageFrequency: 1, lastUsedAt: ev.timestamp, trendDirection: 'UP', activityScore: ev.data?.priority ? 2 : 1 }
  }

  mapEventToIntelligence(ev: WaiterCallEvent): IntelligenceMetrics | null {
    if (ev.type === 'SLA_BREACH_ALERT') return { governanceRiskScore: 10 }
    return null
  }

  mapEventToFeed(ev: WaiterCallEvent): UnifiedFeedSignal | null {
    if (ev.type === 'WAITER_CALLED') return { code: 'WAITER_CALLED', message: 'Waiter call received', severity: 'INFO', data: ev.data as any }
    if (ev.type === 'SLA_BREACH_ALERT') return { code: 'WAITER_CALL_SLA', message: 'Waiter call SLA breach', severity: 'WARN', data: ev.data as any }
    return null
  }
}
