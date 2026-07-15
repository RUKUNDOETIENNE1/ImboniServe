"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomServicePluginAdapter = void 0;
const adapter_base_1 = require("../../../die/business-as-plugin/conversion/adapter.base");
class RoomServicePluginAdapter extends adapter_base_1.BaseDomainPluginAdapter {
    meta() {
        return {
            pluginId: 'room-service',
            name: 'Hotel Room Service',
            version: '0.1.0',
            category: 'Hospitality',
            businessScoped: true,
            pricingModel: 'enterprise',
            visibility: 'enterprise',
            tags: ['hotel', 'room-service'],
        };
    }
    manifest() {
        return { routes: { public: [], api: [], dashboard: [] }, permissions: ['room-service:view'], metadata: { domain: 'room-service' } };
    }
    mapEventToGovernance(ev) {
        if (ev.type === 'DELAY_ALERT')
            return { eventType: 'ANOMALY_DETECTED' };
        return { eventType: 'ENABLE' };
    }
    mapEventToMarketplace(ev) {
        return { usageFrequency: 1, lastUsedAt: ev.timestamp, trendDirection: 'STABLE', activityScore: 2 };
    }
    mapEventToIntelligence(ev) {
        if (ev.type === 'DELAY_ALERT')
            return { anomalyRate: 1 };
        return null;
    }
    mapEventToFeed(ev) {
        if (ev.type === 'DELAY_ALERT')
            return { code: 'ROOM_SERVICE_DELAY', message: 'Room service delay', severity: 'WARN', data: ev.data };
        return null;
    }
}
exports.RoomServicePluginAdapter = RoomServicePluginAdapter;
