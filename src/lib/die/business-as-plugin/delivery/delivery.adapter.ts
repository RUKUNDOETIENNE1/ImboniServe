import type { DIEPluginManifest } from '@/lib/die/plugins/core/plugin-manifest'
import { BaseDomainPluginAdapter } from '@/lib/die/business-as-plugin/conversion/adapter.base'
import type { DomainAdapterMeta, GovernanceMapping, MarketplaceSignals, IntelligenceMetrics, UnifiedFeedSignal } from '@/lib/die/business-as-plugin/conversion/types'
import type { DeliveryEvent } from './delivery.contract'

export class DeliveryPluginAdapter extends BaseDomainPluginAdapter {
  meta(): DomainAdapterMeta {
    return {
      pluginId: 'delivery',
      name: 'Delivery Management',
      version: '1.0.0',
      category: 'Operations',
      businessScoped: true,
      pricingModel: 'enterprise',
      visibility: 'enterprise',
      tags: ['delivery', 'logistics'],
    }
  }

  manifest(): DIEPluginManifest {
    return { routes: { public: [], api: [], dashboard: [] }, permissions: ['delivery:view'], metadata: { domain: 'delivery' } }
  }

  mapEventToGovernance(ev: DeliveryEvent): GovernanceMapping | null {
    switch (ev.type) {
      case 'DELIVERY_DELAYED':
      case 'DELIVERY_FAILED':
      case 'DELIVERY_DRIVER_ALERT':
      case 'DELIVERY_DELAY_ALERT':
        return { eventType: 'ANOMALY_DETECTED' }
      default:
        return { eventType: 'ENABLE' }
    }
  }

  mapEventToMarketplace(ev: DeliveryEvent): MarketplaceSignals | null {
    return { usageFrequency: 1, lastUsedAt: ev.timestamp, trendDirection: 'UP', activityScore: 4 }
  }

  mapEventToIntelligence(ev: DeliveryEvent): IntelligenceMetrics | null {
    switch (ev.type) {
      case 'DELIVERY_DELAYED':
      case 'DELIVERY_DELAY_ALERT':
        return { delayRiskScore: 65, deliveryRiskScore: 55 as any, governanceRiskScore: 20, anomalyRate: 0.6 }
      case 'DELIVERY_FAILED':
        return { deliveryRiskScore: 85 as any, governanceRiskScore: 35, anomalyRate: 1.0 }
      case 'DELIVERY_COMPLETED':
        return { completionRate: 1 }
      default:
        return null
    }
  }

  mapEventToFeed(ev: DeliveryEvent): UnifiedFeedSignal | null {
    switch (ev.type) {
      case 'DELIVERY_CREATED':
        return { code: 'DELIVERY_CREATED', message: 'Delivery created', severity: 'INFO', data: ev.data as any }
      case 'DELIVERY_ASSIGNED':
        return { code: 'DELIVERY_ASSIGNED', message: 'Driver assigned', severity: 'INFO', data: ev.data as any }
      case 'DELIVERY_COMPLETED':
      case 'DELIVERED':
        return { code: 'DELIVERY_COMPLETED', message: 'Delivery completed', severity: 'INFO', data: ev.data as any }
      case 'DELIVERY_DELAYED':
      case 'DELIVERY_DELAY_ALERT':
        return { code: 'DELIVERY_DELAYED', message: 'Delivery delayed', severity: 'WARN', data: ev.data as any }
      case 'DELIVERY_FAILED':
        return { code: 'DELIVERY_FAILED', message: 'Delivery failed', severity: 'CRITICAL', data: ev.data as any }
      default:
        return null
    }
  }
}
