"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CampaignsPluginAdapter = void 0;
const adapter_base_1 = require("../../../die/business-as-plugin/conversion/adapter.base");
class CampaignsPluginAdapter extends adapter_base_1.BaseDomainPluginAdapter {
    meta() {
        return {
            pluginId: 'campaigns',
            name: 'Campaigns & Marketing',
            version: '1.0.0',
            category: 'Engagement',
            businessScoped: true,
            pricingModel: 'enterprise',
            visibility: 'enterprise',
            tags: ['marketing', 'campaigns'],
        };
    }
    manifest() {
        return { routes: { public: [], api: [], dashboard: [] }, permissions: ['campaigns:view'], metadata: { domain: 'campaigns' } };
    }
    mapEventToGovernance(ev) {
        switch (ev.type) {
            case 'CAMPAIGN_FAILED':
                return { eventType: 'ANOMALY_DETECTED' };
            default:
                return null;
        }
    }
    mapEventToMarketplace(ev) {
        return { usageFrequency: 1, lastUsedAt: ev.timestamp, trendDirection: 'UP', activityScore: 2 };
    }
    mapEventToIntelligence(ev) {
        switch (ev.type) {
            case 'CAMPAIGN_FAILED':
                return { stabilityScore: 50, governanceRiskScore: 10 };
            case 'CAMPAIGN_COMPLETED':
                return { completionRate: 1 };
            case 'HIGH_CONVERSION_CAMPAIGN':
                return { stabilityScore: 90 };
            case 'LOW_CONVERSION_CAMPAIGN':
                return { lifecycleConsistencyScore: 60 };
            default:
                return null;
        }
    }
    mapEventToFeed(ev) {
        switch (ev.type) {
            case 'CAMPAIGN_FAILED':
                return { code: 'CAMPAIGN_FAILED', message: 'Campaign delivery failed', severity: 'WARN', data: ev.data };
            case 'CAMPAIGN_CREATED':
                return { code: 'CAMPAIGN_CREATED', message: 'Campaign created', severity: 'INFO', data: ev.data };
            case 'CAMPAIGN_SCHEDULED':
                return { code: 'CAMPAIGN_SCHEDULED', message: 'Campaign scheduled', severity: 'INFO', data: ev.data };
            case 'CAMPAIGN_STARTED':
                return { code: 'CAMPAIGN_STARTED', message: 'Campaign started', severity: 'INFO', data: ev.data };
            case 'CAMPAIGN_COMPLETED':
                return { code: 'CAMPAIGN_COMPLETED', message: 'Campaign completed', severity: 'INFO', data: ev.data };
            case 'HIGH_CONVERSION_CAMPAIGN':
                return { code: 'CAMPAIGN_DELIVERABILITY_STRONG', message: 'High delivery success rate observed', severity: 'INFO', data: ev.data };
            case 'LOW_CONVERSION_CAMPAIGN':
                return { code: 'CAMPAIGN_DELIVERABILITY_WEAK', message: 'Low delivery success rate observed', severity: 'WARN', data: ev.data };
            default:
                return null;
        }
    }
}
exports.CampaignsPluginAdapter = CampaignsPluginAdapter;
