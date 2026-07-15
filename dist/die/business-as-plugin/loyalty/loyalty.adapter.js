"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoyaltyPluginAdapter = void 0;
const adapter_base_1 = require("../../../die/business-as-plugin/conversion/adapter.base");
class LoyaltyPluginAdapter extends adapter_base_1.BaseDomainPluginAdapter {
    meta() {
        return {
            pluginId: 'loyalty',
            name: 'Loyalty Program',
            version: '1.0.0',
            category: 'Engagement',
            businessScoped: true,
            pricingModel: 'enterprise',
            visibility: 'enterprise',
            tags: ['loyalty', 'points', 'vip'],
        };
    }
    manifest() {
        return { routes: { public: [], api: [], dashboard: [] }, permissions: ['loyalty:view'], metadata: { domain: 'loyalty' } };
    }
    mapEventToGovernance(ev) {
        if (ev.type === 'REDEMPTION_DENIED')
            return { eventType: 'ANOMALY_DETECTED' };
        return { eventType: 'ENABLE' };
    }
    mapEventToMarketplace(ev) {
        return { usageFrequency: 1, lastUsedAt: ev.timestamp, trendDirection: 'UP', activityScore: 4 };
    }
    mapEventToIntelligence(ev) {
        if (ev.type === 'REDEMPTION_DENIED')
            return { governanceRiskScore: 15 };
        return null;
    }
    mapEventToFeed(ev) {
        if (ev.type === 'POINTS_REDEEMED')
            return { code: 'LOYALTY_REDEMPTION', message: 'Points redeemed', severity: 'INFO', data: ev.data };
        return null;
    }
}
exports.LoyaltyPluginAdapter = LoyaltyPluginAdapter;
