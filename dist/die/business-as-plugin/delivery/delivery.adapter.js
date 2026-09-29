"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeliveryPluginAdapter = void 0;
const adapter_base_1 = require("../../../die/business-as-plugin/conversion/adapter.base");
class DeliveryPluginAdapter extends adapter_base_1.BaseDomainPluginAdapter {
    meta() {
        return {
            pluginId: 'delivery',
            name: 'Delivery Management',
            version: '1.0.0',
            category: 'Operations',
            businessScoped: true,
            pricingModel: 'enterprise',
            visibility: 'enterprise',
            tags: ['delivery', 'logistics'],
        };
    }
    manifest() {
        return { routes: { public: [], api: [], dashboard: [] }, permissions: ['delivery:view'], metadata: { domain: 'delivery' } };
    }
    mapEventToGovernance(ev) {
        switch (ev.type) {
            case 'DELIVERY_DELAYED':
            case 'DELIVERY_FAILED':
            case 'DELIVERY_DRIVER_ALERT':
            case 'DELIVERY_DELAY_ALERT':
                return { eventType: 'ANOMALY_DETECTED' };
            default:
                return { eventType: 'ENABLE' };
        }
    }
    mapEventToMarketplace(ev) {
        return { usageFrequency: 1, lastUsedAt: ev.timestamp, trendDirection: 'UP', activityScore: 4 };
    }
    mapEventToIntelligence(ev) {
        switch (ev.type) {
            case 'DELIVERY_DELAYED':
            case 'DELIVERY_DELAY_ALERT':
                return { delayRiskScore: 65, deliveryRiskScore: 55, governanceRiskScore: 20, anomalyRate: 0.6 };
            case 'DELIVERY_FAILED':
                return { deliveryRiskScore: 85, governanceRiskScore: 35, anomalyRate: 1.0 };
            case 'DELIVERY_COMPLETED':
                return { completionRate: 1 };
            default:
                return null;
        }
    }
    mapEventToFeed(ev) {
        switch (ev.type) {
            case 'DELIVERY_CREATED':
                return { code: 'DELIVERY_CREATED', message: 'Delivery created', severity: 'INFO', data: ev.data };
            case 'DELIVERY_ASSIGNED':
                return { code: 'DELIVERY_ASSIGNED', message: 'Driver assigned', severity: 'INFO', data: ev.data };
            case 'DELIVERY_COMPLETED':
            case 'DELIVERED':
                return { code: 'DELIVERY_COMPLETED', message: 'Delivery completed', severity: 'INFO', data: ev.data };
            case 'DELIVERY_DELAYED':
            case 'DELIVERY_DELAY_ALERT':
                return { code: 'DELIVERY_DELAYED', message: 'Delivery delayed', severity: 'WARN', data: ev.data };
            case 'DELIVERY_FAILED':
                return { code: 'DELIVERY_FAILED', message: 'Delivery failed', severity: 'CRITICAL', data: ev.data };
            default:
                return null;
        }
    }
}
exports.DeliveryPluginAdapter = DeliveryPluginAdapter;
