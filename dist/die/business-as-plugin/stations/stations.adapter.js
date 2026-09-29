"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StationsPluginAdapter = void 0;
const adapter_base_1 = require("../../../die/business-as-plugin/conversion/adapter.base");
class StationsPluginAdapter extends adapter_base_1.BaseDomainPluginAdapter {
    meta() {
        return {
            pluginId: 'stations',
            name: 'Stations & Routing',
            version: '1.0.0',
            category: 'Operations',
            businessScoped: true,
            pricingModel: 'enterprise',
            visibility: 'enterprise',
            tags: ['stations', 'routing'],
        };
    }
    manifest() {
        return { routes: { public: [], api: [], dashboard: [] }, permissions: ['stations:view'], metadata: { domain: 'stations' } };
    }
    mapEventToGovernance(ev) {
        if (ev.type === 'ROUTE_FAILED')
            return { eventType: 'ANOMALY_DETECTED' };
        if (ev.type === 'STATION_CREATED')
            return { eventType: 'INSTALL' };
        return { eventType: 'ENABLE' };
    }
    mapEventToMarketplace(ev) {
        return { usageFrequency: 1, lastUsedAt: ev.timestamp, trendDirection: 'STABLE', activityScore: 1 };
    }
    mapEventToIntelligence(ev) {
        if (ev.type === 'ROUTE_FAILED')
            return { anomalyRate: 1, governanceRiskScore: 15 };
        return null;
    }
    mapEventToFeed(ev) {
        if (ev.type === 'ROUTE_FAILED')
            return { code: 'ROUTE_FAILED', message: 'Station routing failed', severity: 'WARN', data: ev.data };
        return null;
    }
}
exports.StationsPluginAdapter = StationsPluginAdapter;
