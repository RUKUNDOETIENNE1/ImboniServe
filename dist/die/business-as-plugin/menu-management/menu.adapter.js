"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MenuManagementPluginAdapter = void 0;
const adapter_base_1 = require("../../../die/business-as-plugin/conversion/adapter.base");
class MenuManagementPluginAdapter extends adapter_base_1.BaseDomainPluginAdapter {
    meta() {
        return {
            pluginId: 'menu-management',
            name: 'Menu Management',
            version: '1.0.0',
            category: 'Operations',
            businessScoped: true,
            pricingModel: 'enterprise',
            visibility: 'enterprise',
            tags: ['menu', 'content'],
        };
    }
    manifest() {
        return { routes: { public: [], api: [], dashboard: [] }, permissions: ['menu:view'], metadata: { domain: 'menu-management' } };
    }
    mapEventToGovernance(ev) {
        if (ev.type === 'MENU_ITEM_ADDED')
            return { eventType: 'INSTALL' };
        return { eventType: 'ENABLE' };
    }
    mapEventToMarketplace(ev) {
        return { usageFrequency: 1, lastUsedAt: ev.timestamp, trendDirection: 'UP', activityScore: 1 };
    }
    mapEventToIntelligence(ev) {
        return null;
    }
    mapEventToFeed(ev) {
        if (ev.type === 'MENU_PUBLISHED')
            return { code: 'MENU_PUBLISHED', message: 'Menu published', severity: 'INFO', data: ev.data };
        return null;
    }
}
exports.MenuManagementPluginAdapter = MenuManagementPluginAdapter;
