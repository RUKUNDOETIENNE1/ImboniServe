"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventManagementPluginAdapter = void 0;
const adapter_base_1 = require("../../../die/business-as-plugin/conversion/adapter.base");
class EventManagementPluginAdapter extends adapter_base_1.BaseDomainPluginAdapter {
    meta() {
        return {
            pluginId: 'event-management',
            name: 'Event Management',
            version: '1.0.0',
            category: 'Operations',
            businessScoped: true,
            pricingModel: 'enterprise',
            visibility: 'enterprise',
            tags: ['events', 'tickets'],
        };
    }
    manifest() {
        return { routes: { public: [], api: [], dashboard: [] }, permissions: ['events:view'], metadata: { domain: 'events' } };
    }
    mapEventToGovernance(ev) {
        if (ev.type === 'CAPACITY_ALERT' || ev.type === 'SPIKE_DETECTED')
            return { eventType: 'ANOMALY_DETECTED' };
        if (ev.type === 'EVENT_CREATED')
            return { eventType: 'INSTALL' };
        return { eventType: 'ENABLE' };
    }
    mapEventToMarketplace(ev) {
        return { usageFrequency: 1, lastUsedAt: ev.timestamp, trendDirection: 'UP', activityScore: 2 };
    }
    mapEventToIntelligence(ev) {
        if (ev.type === 'CAPACITY_ALERT')
            return { anomalyRate: 1 };
        return null;
    }
    mapEventToFeed(ev) {
        if (ev.type === 'CAPACITY_ALERT')
            return { code: 'EVENT_CAPACITY_ALERT', message: 'Event capacity alert', severity: 'WARN', data: ev.data };
        return null;
    }
}
exports.EventManagementPluginAdapter = EventManagementPluginAdapter;
