"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WaiterCallsPluginAdapter = void 0;
const adapter_base_1 = require("../../../die/business-as-plugin/conversion/adapter.base");
class WaiterCallsPluginAdapter extends adapter_base_1.BaseDomainPluginAdapter {
    meta() {
        return {
            pluginId: 'waiter-calls',
            name: 'Waiter Calls',
            version: '1.0.0',
            category: 'Operations',
            businessScoped: true,
            pricingModel: 'enterprise',
            visibility: 'enterprise',
            tags: ['waiter', 'calls'],
        };
    }
    manifest() {
        return { routes: { public: [], api: [], dashboard: [] }, permissions: ['waiter-calls:view'], metadata: { domain: 'waiter-calls' } };
    }
    mapEventToGovernance(ev) {
        if (ev.type === 'SLA_BREACH_ALERT')
            return { eventType: 'ANOMALY_DETECTED' };
        return { eventType: 'ENABLE' };
    }
    mapEventToMarketplace(ev) {
        return { usageFrequency: 1, lastUsedAt: ev.timestamp, trendDirection: 'UP', activityScore: ev.data?.priority ? 2 : 1 };
    }
    mapEventToIntelligence(ev) {
        if (ev.type === 'SLA_BREACH_ALERT')
            return { governanceRiskScore: 10 };
        return null;
    }
    mapEventToFeed(ev) {
        if (ev.type === 'WAITER_CALLED')
            return { code: 'WAITER_CALLED', message: 'Waiter call received', severity: 'INFO', data: ev.data };
        if (ev.type === 'SLA_BREACH_ALERT')
            return { code: 'WAITER_CALL_SLA', message: 'Waiter call SLA breach', severity: 'WARN', data: ev.data };
        return null;
    }
}
exports.WaiterCallsPluginAdapter = WaiterCallsPluginAdapter;
