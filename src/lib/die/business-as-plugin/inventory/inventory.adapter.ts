import type { DIEPluginManifest } from '@/lib/die/plugins/core/plugin-manifest'
import { BaseDomainPluginAdapter } from '@/lib/die/business-as-plugin/conversion/adapter.base'
import type { DomainAdapterMeta, GovernanceMapping, MarketplaceSignals, IntelligenceMetrics, UnifiedFeedSignal } from '@/lib/die/business-as-plugin/conversion/types'
import type { InventoryEvent } from './inventory.contract'

export class InventoryPluginAdapter extends BaseDomainPluginAdapter {
  meta(): DomainAdapterMeta {
    return {
      pluginId: 'inventory',
      name: 'Inventory Management',
      version: '1.0.0',
      category: 'Operations',
      businessScoped: true,
      pricingModel: 'enterprise',
      visibility: 'enterprise',
      tags: ['inventory', 'stock'],
    }
  }

  manifest(): DIEPluginManifest {
    return { routes: { public: [], api: [], dashboard: [] }, permissions: ['inventory:view'], metadata: { domain: 'inventory' } }
  }

  mapEventToGovernance(ev: InventoryEvent): GovernanceMapping | null {
    switch (ev.type) {
      case 'STOCK_UPDATED':
      case 'STOCK_RESTOCKED':
        return { eventType: 'ENABLE' }
      case 'STOCK_LOW':
        return { eventType: 'ENABLE', metadata: { warning: true } }
      case 'STOCK_OUT':
      case 'INVENTORY_THRESHOLD_BREACH':
        return { eventType: 'ANOMALY_DETECTED' }
      default:
        if (ev.type === 'LOW_STOCK_ALERT') return { eventType: 'ANOMALY_DETECTED' }
        return { eventType: 'ENABLE' }
    }
  }

  mapEventToMarketplace(ev: InventoryEvent): MarketplaceSignals | null {
    return { usageFrequency: 1, lastUsedAt: ev.timestamp, trendDirection: 'UP', activityScore: 4 }
  }

  mapEventToIntelligence(ev: InventoryEvent): IntelligenceMetrics | null {
    // Read-only heuristic metrics
    const base: IntelligenceMetrics = {}
    switch (ev.type) {
      case 'STOCK_LOW':
        return { ...base, shortageRiskScore: 60, stockRiskScore: 50, anomalyRate: 0.2, governanceRiskScore: 10 }
      case 'STOCK_OUT':
        return { ...base, shortageRiskScore: 90, stockRiskScore: 80, anomalyRate: 1.0, governanceRiskScore: 30 }
      case 'INVENTORY_THRESHOLD_BREACH':
        return { ...base, shortageRiskScore: 70, stockRiskScore: 65, anomalyRate: 0.6, governanceRiskScore: 20 }
      default:
        if (ev.type === 'LOW_STOCK_ALERT') return { anomalyRate: 1, stabilityScore: 60 }
        return null
    }
  }

  mapEventToFeed(ev: InventoryEvent): UnifiedFeedSignal | null {
    switch (ev.type) {
      case 'STOCK_UPDATED':
        return { code: 'INVENTORY_STOCK_UPDATED', message: 'Stock updated', severity: 'INFO', data: ev.data as any }
      case 'STOCK_LOW':
        return { code: 'INVENTORY_STOCK_LOW', message: 'Low stock detected', severity: 'WARN', data: ev.data as any }
      case 'STOCK_OUT':
        return { code: 'INVENTORY_STOCK_OUT', message: 'Stock depleted', severity: 'CRITICAL', data: ev.data as any }
      case 'STOCK_RESTOCKED':
        return { code: 'INVENTORY_RESTOCKED', message: 'Item restocked', severity: 'INFO', data: ev.data as any }
      case 'INVENTORY_THRESHOLD_BREACH':
        return { code: 'INVENTORY_THRESHOLD_BREACH', message: 'Inventory threshold breach', severity: 'WARN', data: ev.data as any }
      default:
        if (ev.type === 'LOW_STOCK_ALERT') return { code: 'INVENTORY_LOW_STOCK', message: 'Low stock detected', severity: ev.data?.alertLevel === 'CRITICAL' ? 'CRITICAL' : 'WARN', data: ev.data as any }
        return null
    }
  }
}
