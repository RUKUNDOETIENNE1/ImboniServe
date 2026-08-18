"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReservationsPluginAdapter = void 0;
const adapter_base_1 = require("../../../die/business-as-plugin/conversion/adapter.base");
class ReservationsPluginAdapter extends adapter_base_1.BaseDomainPluginAdapter {
    meta() {
        return {
            pluginId: 'reservations',
            name: 'Reservations',
            version: '1.0.0',
            category: 'Operations',
            businessScoped: true,
            pricingModel: 'enterprise',
            visibility: 'enterprise',
            tags: ['booking', 'capacity', 'operations'],
        };
    }
    manifest() {
        return {
            routes: {
                public: [],
                api: [],
                dashboard: [],
            },
            permissions: ['reservations:view'],
            metadata: { domain: 'reservations' },
        };
    }
    mapEventToGovernance(ev) {
        if (ev.type === 'BOOKING_CREATED')
            return { eventType: 'INSTALL' };
        if (ev.type === 'BOOKING_UPDATED')
            return { eventType: 'ENABLE' };
        if (ev.type === 'BOOKING_CANCELLED')
            return { eventType: 'DISABLE', metadata: { reason: ev.data?.reason } };
        if (ev.type === 'CAPACITY_ALERT')
            return { eventType: 'ANOMALY_DETECTED' };
        return null;
    }
    mapEventToMarketplace(ev) {
        if (ev.type === 'BOOKING_CREATED' || ev.type === 'BOOKING_UPDATED') {
            return { usageFrequency: 1, lastUsedAt: ev.timestamp, trendDirection: 'UP', activityScore: 10 };
        }
        if (ev.type === 'BOOKING_CANCELLED') {
            return { usageFrequency: 1, lastUsedAt: ev.timestamp, trendDirection: 'DOWN', activityScore: 5 };
        }
        return null;
    }
    mapEventToIntelligence(ev) {
        if (ev.type === 'CAPACITY_ALERT')
            return { anomalyRate: 1, governanceRiskScore: 20 };
        return null;
    }
    mapEventToFeed(ev) {
        if (ev.type === 'CAPACITY_ALERT') {
            return { code: 'RESERVATION_CAPACITY_ALERT', message: 'Capacity alert detected', severity: 'WARN', data: ev.data };
        }
        if (ev.type === 'BOOKING_CREATED') {
            return { code: 'RESERVATION_CREATED', message: 'Reservation created', severity: 'INFO', data: ev.data };
        }
        if (ev.type === 'BOOKING_UPDATED') {
            return { code: 'RESERVATION_UPDATED', message: 'Reservation updated', severity: 'INFO', data: ev.data };
        }
        if (ev.type === 'BOOKING_CANCELLED') {
            return { code: 'RESERVATION_CANCELLED', message: 'Reservation cancelled', severity: 'INFO', data: ev.data };
        }
        return null;
    }
}
exports.ReservationsPluginAdapter = ReservationsPluginAdapter;
