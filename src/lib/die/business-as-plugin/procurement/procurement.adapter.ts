import type { DIEPluginManifest } from '@/lib/die/plugins/core/plugin-manifest'
import { BaseDomainPluginAdapter } from '@/lib/die/business-as-plugin/conversion/adapter.base'
import type { DomainAdapterMeta, GovernanceMapping, MarketplaceSignals, IntelligenceMetrics, UnifiedFeedSignal } from '@/lib/die/business-as-plugin/conversion/types'
import type { ProcurementEvent } from './procurement.contract'

export class ProcurementPluginAdapter extends BaseDomainPluginAdapter {
  meta(): DomainAdapterMeta {
    return {
      pluginId: 'procurement',
      name: 'Procurement & Suppliers',
      version: '1.0.0',
      category: 'Supply',
      businessScoped: true,
      pricingModel: 'enterprise',
      visibility: 'enterprise',
      tags: ['procurement', 'suppliers'],
    }
  }

  manifest(): DIEPluginManifest {
    return { routes: { public: [], api: [], dashboard: [] }, permissions: ['procurement:view'], metadata: { domain: 'procurement' } }
  }

  mapEventToGovernance(ev: ProcurementEvent): GovernanceMapping | null {
    switch (ev.type) {
      case 'PURCHASE_ORDER_CREATED':
      case 'PURCHASE_ORDER_RECEIVED':
        return { eventType: 'ENABLE' }
      case 'PROCUREMENT_DELAY':
      case 'PROCUREMENT_EXCEPTION':
      case 'MISMATCH_ALERT':
        return { eventType: 'ANOMALY_DETECTED' }
      default:
        return { eventType: 'ENABLE' }
    }
  }

  mapEventToMarketplace(ev: ProcurementEvent): MarketplaceSignals | null {
    return { usageFrequency: 1, lastUsedAt: ev.timestamp, trendDirection: 'UP', activityScore: 4 }
  }

  mapEventToIntelligence(ev: ProcurementEvent): IntelligenceMetrics | null {
    switch (ev.type) {
      case 'PROCUREMENT_DELAY':
        return { delayRiskScore: 70, procurementRiskScore: 60, governanceRiskScore: 15, anomalyRate: 0.6 }
      case 'PROCUREMENT_EXCEPTION':
        return { procurementRiskScore: 85, governanceRiskScore: 30, anomalyRate: 1.0 }
      case 'PURCHASE_ORDER_RECEIVED':
        return { procurementEfficiencyScore: 65 }
      case 'MISMATCH_ALERT':
        return { governanceRiskScore: 20, anomalyRate: 1.0 }
      default:
        return null
    }
  }

  mapEventToFeed(ev: ProcurementEvent): UnifiedFeedSignal | null {
    switch (ev.type) {
      case 'PURCHASE_ORDER_CREATED':
        return { code: 'PROCUREMENT_ORDER_CREATED', message: 'Purchase order created', severity: 'INFO', data: ev.data as any }
      case 'PURCHASE_ORDER_RECEIVED':
      case 'GOODS_RECEIVED':
        return { code: 'PROCUREMENT_ORDER_RECEIVED', message: 'Purchase order received', severity: 'INFO', data: ev.data as any }
      case 'PROCUREMENT_DELAY':
        return { code: 'PROCUREMENT_DELAY_DETECTED', message: 'Procurement delay detected', severity: 'WARN', data: ev.data as any }
      case 'PROCUREMENT_EXCEPTION':
        return { code: 'PROCUREMENT_EXCEPTION', message: 'Procurement exception', severity: 'CRITICAL', data: ev.data as any }
      case 'MISMATCH_ALERT':
        return { code: 'PROCUREMENT_MISMATCH', message: 'Procurement mismatch detected', severity: 'WARN', data: ev.data as any }
      default:
        return null
    }
  }
}
