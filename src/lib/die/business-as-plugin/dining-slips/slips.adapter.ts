import type { DIEPluginManifest } from '@/lib/die/plugins/core/plugin-manifest'
import { BaseDomainPluginAdapter } from '@/lib/die/business-as-plugin/conversion/adapter.base'
import type { DomainAdapterMeta, GovernanceMapping, MarketplaceSignals, IntelligenceMetrics, UnifiedFeedSignal } from '@/lib/die/business-as-plugin/conversion/types'
import type { DiningSlipEvent } from './slips.contract'

export class DiningSlipsPluginAdapter extends BaseDomainPluginAdapter {
  meta(): DomainAdapterMeta {
    return {
      pluginId: 'dining-slips',
      name: 'Dining Sessions & Slips',
      version: '1.0.0',
      category: 'Operations',
      businessScoped: true,
      pricingModel: 'enterprise',
      visibility: 'enterprise',
      tags: ['slips', 'documents'],
    }
  }

  manifest(): DIEPluginManifest {
    return { routes: { public: [], api: [], dashboard: [] }, permissions: ['dining-slips:view'], metadata: { domain: 'dining-slips' } }
  }

  mapEventToGovernance(ev: DiningSlipEvent): GovernanceMapping | null {
    switch (ev.type) {
      case 'SEND_FAILED':
      case 'PAYMENT_EXCEPTION':
        return { eventType: 'ANOMALY_DETECTED' }
      default:
        return null
    }
  }

  mapEventToMarketplace(ev: DiningSlipEvent): MarketplaceSignals | null {
    return { usageFrequency: 1, lastUsedAt: ev.timestamp, trendDirection: 'UP', activityScore: 3 }
  }

  mapEventToIntelligence(ev: DiningSlipEvent): IntelligenceMetrics | null {
    switch (ev.type) {
      case 'SEND_FAILED':
      case 'PAYMENT_EXCEPTION':
        return { anomalyRate: 1, governanceRiskScore: 10 }
      case 'SLIP_PAID':
        return { completionRate: 1 }
      case 'HIGH_VALUE_SESSION':
        return { stabilityScore: 90 }
      case 'LONG_DURATION_SESSION':
        return { lifecycleConsistencyScore: 70 }
      default:
        return null
    }
  }

  mapEventToFeed(ev: DiningSlipEvent): UnifiedFeedSignal | null {
    switch (ev.type) {
      case 'SLIP_SENT_WHATSAPP':
        return { code: 'SLIP_SENT', message: 'Slip sent via WhatsApp', severity: 'INFO', data: ev.data as any }
      case 'SEND_FAILED':
        return { code: 'SLIP_SEND_FAILED', message: 'Slip send failed', severity: 'WARN', data: ev.data as any }
      case 'SESSION_STARTED':
        return { code: 'SESSION_STARTED', message: 'Dining session started', severity: 'INFO', data: ev.data as any }
      case 'SESSION_UPDATED':
        return { code: 'SESSION_UPDATED', message: 'Dining session updated', severity: 'INFO', data: ev.data as any }
      case 'SESSION_CLOSED':
        return { code: 'SESSION_CLOSED', message: 'Dining session closed', severity: 'INFO', data: ev.data as any }
      case 'SLIP_CREATED':
        return { code: 'SLIP_CREATED', message: 'Slip created', severity: 'INFO', data: ev.data as any }
      case 'SLIP_PAID':
        return { code: 'SLIP_PAID', message: 'Slip paid', severity: 'INFO', data: ev.data as any }
      case 'HIGH_VALUE_SESSION':
        return { code: 'HIGH_VALUE_SESSION', message: 'High value dining session detected', severity: 'INFO', data: ev.data as any }
      case 'LONG_DURATION_SESSION':
        return { code: 'LONG_DURATION_SESSION', message: 'Long duration dining session', severity: 'WARN', data: ev.data as any }
      case 'PAYMENT_EXCEPTION':
        return { code: 'PAYMENT_EXCEPTION', message: 'Payment exception in session', severity: 'WARN', data: ev.data as any }
      default:
        return null
    }
  }
}
