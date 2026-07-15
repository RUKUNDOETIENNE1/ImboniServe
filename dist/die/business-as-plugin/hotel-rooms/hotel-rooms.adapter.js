"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HotelRoomsPluginAdapter = void 0;
const adapter_base_1 = require("../../../die/business-as-plugin/conversion/adapter.base");
class HotelRoomsPluginAdapter extends adapter_base_1.BaseDomainPluginAdapter {
    meta() {
        return {
            pluginId: 'hotel-rooms',
            name: 'Hotel Rooms',
            version: '0.1.0',
            category: 'Hospitality',
            businessScoped: true,
            pricingModel: 'enterprise',
            visibility: 'enterprise',
            tags: ['hotel', 'rooms'],
        };
    }
    manifest() {
        return { routes: { public: [], api: [], dashboard: [] }, permissions: ['hotel-rooms:view'], metadata: { domain: 'hotel-rooms' } };
    }
    mapEventToGovernance(ev) {
        if (ev.type === 'MAINTENANCE_SCHEDULED')
            return { eventType: 'ANOMALY_DETECTED' };
        if (ev.type === 'ROOM_CREATED')
            return { eventType: 'INSTALL' };
        return { eventType: 'ENABLE' };
    }
    mapEventToMarketplace(ev) {
        return { usageFrequency: 1, lastUsedAt: ev.timestamp, trendDirection: 'STABLE', activityScore: 1 };
    }
    mapEventToIntelligence(ev) {
        return null;
    }
    mapEventToFeed(ev) {
        if (ev.type === 'CHECKED_IN')
            return { code: 'ROOM_CHECKIN', message: 'Guest checked in', severity: 'INFO', data: ev.data };
        return null;
    }
}
exports.HotelRoomsPluginAdapter = HotelRoomsPluginAdapter;
