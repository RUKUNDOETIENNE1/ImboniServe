import type { DIEPluginManifest } from '@/lib/die/plugins/core/plugin-manifest'
import { BaseDomainPluginAdapter } from '@/lib/die/business-as-plugin/conversion/adapter.base'
import type { DomainAdapterMeta, GovernanceMapping, MarketplaceSignals, IntelligenceMetrics, UnifiedFeedSignal } from '@/lib/die/business-as-plugin/conversion/types'
import type { ReservationEvent } from './reservations.contract'

export class ReservationsPluginAdapter extends BaseDomainPluginAdapter {
  meta(): DomainAdapterMeta {
    return {
      pluginId: 'reservations',
      name: 'Reservations',
      version: '1.0.0',
      category: 'Operations',
      businessScoped: true,
      pricingModel: 'enterprise',
      visibility: 'enterprise',
      tags: ['booking', 'capacity', 'operations'],
    }
  }

  manifest(): DIEPluginManifest {
    return {
      routes: {
        public: [],
        api: [],
        dashboard: [],
      },
      permissions: ['reservations:view'],
      metadata: { domain: 'reservations' },
    }
  }

  mapEventToGovernance(ev: ReservationEvent): GovernanceMapping | null {
    if (ev.type === 'BOOKING_CREATED') return { eventType: 'INSTALL' }
    if (ev.type === 'BOOKING_UPDATED') return { eventType: 'ENABLE' }
    if (ev.type === 'BOOKING_CANCELLED') return { eventType: 'DISABLE', metadata: { reason: ev.data?.reason } }
    if (ev.type === 'CAPACITY_ALERT') return { eventType: 'ANOMALY_DETECTED' }
    return null
  }

  mapEventToMarketplace(ev: ReservationEvent): MarketplaceSignals | null {
    if (ev.type === 'BOOKING_CREATED' || ev.type === 'BOOKING_UPDATED') {
      return { usageFrequency: 1, lastUsedAt: ev.timestamp, trendDirection: 'UP', activityScore: 10 }
    }
    if (ev.type === 'BOOKING_CANCELLED') {
      return { usageFrequency: 1, lastUsedAt: ev.timestamp, trendDirection: 'DOWN', activityScore: 5 }
    }
    return null
  }

  mapEventToIntelligence(ev: ReservationEvent): IntelligenceMetrics | null {
    if (ev.type === 'CAPACITY_ALERT') return { anomalyRate: 1, governanceRiskScore: 20 }
    return null
  }

  mapEventToFeed(ev: ReservationEvent): UnifiedFeedSignal | null {
    if (ev.type === 'CAPACITY_ALERT') {
      return { code: 'RESERVATION_CAPACITY_ALERT', message: 'Capacity alert detected', severity: 'WARN', data: ev.data as any }
    }
    if (ev.type === 'BOOKING_CREATED') {
      return { code: 'RESERVATION_CREATED', message: 'Reservation created', severity: 'INFO', data: ev.data as any }
    }
    if (ev.type === 'BOOKING_UPDATED') {
      return { code: 'RESERVATION_UPDATED', message: 'Reservation updated', severity: 'INFO', data: ev.data as any }
    }
    if (ev.type === 'BOOKING_CANCELLED') {
      return { code: 'RESERVATION_CANCELLED', message: 'Reservation cancelled', severity: 'INFO', data: ev.data as any }
    }
    return null
  }
}
