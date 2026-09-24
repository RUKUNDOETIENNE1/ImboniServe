"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TableManagementPluginAdapter = void 0;
const adapter_base_1 = require("../../../die/business-as-plugin/conversion/adapter.base");
class TableManagementPluginAdapter extends adapter_base_1.BaseDomainPluginAdapter {
    meta() {
        return {
            pluginId: 'table-management',
            name: 'Table Management',
            version: '1.0.0',
            category: 'Operations',
            businessScoped: true,
            pricingModel: 'enterprise',
            visibility: 'enterprise',
            tags: ['tables', 'foh'],
        };
    }
    manifest() {
        return { routes: { public: [], api: [], dashboard: [] }, permissions: ['tables:view'], metadata: { domain: 'table-management' } };
    }
    mapEventToGovernance(ev) {
        return { eventType: 'ENABLE' };
    }
    mapEventToMarketplace(ev) {
        return { usageFrequency: 1, lastUsedAt: ev.timestamp, trendDirection: 'STABLE', activityScore: 1 };
    }
    mapEventToIntelligence(ev) {
        return null;
    }
    mapEventToFeed(ev) {
        if (ev.type === 'TABLE_STATUS_UPDATED')
            return { code: 'TABLE_STATUS', message: `Table status ${ev.data?.status}`, severity: 'INFO', data: ev.data };
        return null;
    }
}
exports.TableManagementPluginAdapter = TableManagementPluginAdapter;
