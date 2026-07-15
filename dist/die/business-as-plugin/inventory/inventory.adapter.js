"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryPluginAdapter = void 0;
const adapter_base_1 = require("../../../die/business-as-plugin/conversion/adapter.base");
class InventoryPluginAdapter extends adapter_base_1.BaseDomainPluginAdapter {
    meta() {
        return {
            pluginId: 'inventory',
            name: 'Inventory Management',
            version: '1.0.0',
            category: 'Operations',
            businessScoped: true,
            pricingModel: 'enterprise',
            visibility: 'enterprise',
            tags: ['inventory', 'stock'],
        };
    }
    manifest() {
        return { routes: { public: [], api: [], dashboard: [] }, permissions: ['inventory:view'], metadata: { domain: 'inventory' } };
    }
    mapEventToGovernance(ev) {
        switch (ev.type) {
            case 'STOCK_UPDATED':
            case 'STOCK_RESTOCKED':
                return { eventType: 'ENABLE' };
            case 'STOCK_LOW':
                return { eventType: 'ENABLE', metadata: { warning: true } };
            case 'STOCK_OUT':
            case 'INVENTORY_THRESHOLD_BREACH':
                return { eventType: 'ANOMALY_DETECTED' };
            default:
                if (ev.type === 'LOW_STOCK_ALERT')
                    return { eventType: 'ANOMALY_DETECTED' };
                return { eventType: 'ENABLE' };
        }
    }
    mapEventToMarketplace(ev) {
        return { usageFrequency: 1, lastUsedAt: ev.timestamp, trendDirection: 'UP', activityScore: 4 };
    }
    mapEventToIntelligence(ev) {
        // Read-only heuristic metrics
        const base = {};
        switch (ev.type) {
            case 'STOCK_LOW':
                return { ...base, shortageRiskScore: 60, stockRiskScore: 50, anomalyRate: 0.2, governanceRiskScore: 10 };
            case 'STOCK_OUT':
                return { ...base, shortageRiskScore: 90, stockRiskScore: 80, anomalyRate: 1.0, governanceRiskScore: 30 };
            case 'INVENTORY_THRESHOLD_BREACH':
                return { ...base, shortageRiskScore: 70, stockRiskScore: 65, anomalyRate: 0.6, governanceRiskScore: 20 };
            default:
                if (ev.type === 'LOW_STOCK_ALERT')
                    return { anomalyRate: 1, stabilityScore: 60 };
                return null;
        }
    }
    mapEventToFeed(ev) {
        switch (ev.type) {
            case 'STOCK_UPDATED':
                return { code: 'INVENTORY_STOCK_UPDATED', message: 'Stock updated', severity: 'INFO', data: ev.data };
            case 'STOCK_LOW':
                return { code: 'INVENTORY_STOCK_LOW', message: 'Low stock detected', severity: 'WARN', data: ev.data };
            case 'STOCK_OUT':
                return { code: 'INVENTORY_STOCK_OUT', message: 'Stock depleted', severity: 'CRITICAL', data: ev.data };
            case 'STOCK_RESTOCKED':
                return { code: 'INVENTORY_RESTOCKED', message: 'Item restocked', severity: 'INFO', data: ev.data };
            case 'INVENTORY_THRESHOLD_BREACH':
                return { code: 'INVENTORY_THRESHOLD_BREACH', message: 'Inventory threshold breach', severity: 'WARN', data: ev.data };
            default:
                if (ev.type === 'LOW_STOCK_ALERT')
                    return { code: 'INVENTORY_LOW_STOCK', message: 'Low stock detected', severity: ev.data?.alertLevel === 'CRITICAL' ? 'CRITICAL' : 'WARN', data: ev.data };
                return null;
        }
    }
}
exports.InventoryPluginAdapter = InventoryPluginAdapter;
