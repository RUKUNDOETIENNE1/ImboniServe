"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KDSPluginAdapter = void 0;
const adapter_base_1 = require("../../../die/business-as-plugin/conversion/adapter.base");
class KDSPluginAdapter extends adapter_base_1.BaseDomainPluginAdapter {
    meta() {
        return {
            pluginId: 'kds',
            name: 'Kitchen Display System',
            version: '1.0.0',
            category: 'Operations',
            businessScoped: true,
            pricingModel: 'enterprise',
            visibility: 'enterprise',
            tags: ['kitchen', 'stations', 'orders'],
        };
    }
    manifest() {
        return {
            routes: { public: [], api: [], dashboard: [] },
            permissions: ['kds:view'],
            metadata: { domain: 'kds' },
        };
    }
    mapEventToGovernance(ev) {
        if (ev.type === 'ROUTING_FAILED' || ev.type === 'BACKLOG_ALERT')
            return { eventType: 'ANOMALY_DETECTED' };
        return { eventType: 'ENABLE' };
    }
    mapEventToMarketplace(ev) {
        return { usageFrequency: 1, lastUsedAt: ev.timestamp, trendDirection: 'UP', activityScore: 5 };
    }
    mapEventToIntelligence(ev) {
        if (ev.type === 'ROUTING_FAILED' || ev.type === 'BACKLOG_ALERT')
            return { anomalyRate: 1, governanceRiskScore: 30 };
        return null;
    }
    mapEventToFeed(ev) {
        if (ev.type === 'ROUTING_FAILED')
            return { code: 'KDS_ROUTING_FAILED', message: 'Routing failure', severity: 'WARN', data: ev.data };
        if (ev.type === 'BACKLOG_ALERT')
            return { code: 'KDS_BACKLOG_ALERT', message: 'Kitchen backlog rising', severity: 'WARN', data: ev.data };
        if (ev.type === 'ORDER_CREATED')
            return { code: 'KDS_ORDER_RECEIVED', message: 'Order received in kitchen', severity: 'INFO', data: ev.data };
        if (ev.type === 'ITEM_PREPARING')
            return { code: 'KDS_ORDER_UPDATED', message: 'Order items in preparation', severity: 'INFO', data: ev.data };
        if (ev.type === 'ITEM_READY')
            return { code: 'KDS_ORDER_UPDATED', message: 'Order items ready', severity: 'INFO', data: ev.data };
        if (ev.type === 'ORDER_SERVED')
            return { code: 'KDS_ORDER_COMPLETED', message: 'Order served', severity: 'INFO', data: ev.data };
        return null;
    }
}
exports.KDSPluginAdapter = KDSPluginAdapter;
