"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuppliersPluginAdapter = void 0;
const adapter_base_1 = require("../../../die/business-as-plugin/conversion/adapter.base");
class SuppliersPluginAdapter extends adapter_base_1.BaseDomainPluginAdapter {
    meta() {
        return {
            pluginId: 'suppliers',
            name: 'Suppliers',
            version: '1.0.0',
            category: 'Supply',
            businessScoped: true,
            pricingModel: 'enterprise',
            visibility: 'enterprise',
            tags: ['suppliers', 'logistics'],
        };
    }
    manifest() {
        return { routes: { public: [], api: [], dashboard: [] }, permissions: ['suppliers:view'], metadata: { domain: 'suppliers' } };
    }
    mapEventToGovernance(ev) {
        switch (ev.type) {
            case 'SUPPLIER_DELIVERY_DELAYED':
            case 'SUPPLIER_DELIVERY_FAILED':
            case 'SUPPLIER_PERFORMANCE_ALERT':
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
            case 'SUPPLIER_DELIVERY_DELAYED':
                return { delayRiskScore: 60, governanceRiskScore: 10 };
            case 'SUPPLIER_DELIVERY_FAILED':
                return { governanceRiskScore: 30, anomalyRate: 1.0 };
            case 'SUPPLIER_PERFORMANCE_ALERT':
                return { procurementRiskScore: 40 };
            default:
                return null;
        }
    }
    mapEventToFeed(ev) {
        switch (ev.type) {
            case 'SUPPLIER_ORDER_ASSIGNED':
                return { code: 'SUPPLIER_ORDER_ASSIGNED', message: 'Supplier assigned to order', severity: 'INFO', data: ev.data };
            case 'SUPPLIER_DELIVERY_COMPLETED':
                return { code: 'SUPPLIER_DELIVERY_COMPLETED', message: 'Supplier delivery completed', severity: 'INFO', data: ev.data };
            case 'SUPPLIER_DELIVERY_DELAYED':
                return { code: 'SUPPLIER_DELIVERY_DELAYED', message: 'Supplier delivery delayed', severity: 'WARN', data: ev.data };
            case 'SUPPLIER_DELIVERY_FAILED':
                return { code: 'SUPPLIER_DELIVERY_FAILED', message: 'Supplier delivery failed', severity: 'CRITICAL', data: ev.data };
            case 'SUPPLIER_PERFORMANCE_ALERT':
                return { code: 'SUPPLIER_PERFORMANCE_ALERT', message: 'Supplier performance alert', severity: 'WARN', data: ev.data };
            default:
                return null;
        }
    }
}
exports.SuppliersPluginAdapter = SuppliersPluginAdapter;
