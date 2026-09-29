"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseDomainPluginAdapter = void 0;
class BaseDomainPluginAdapter {
    buildPlugin() {
        const m = this.meta();
        const manifest = this.manifest();
        const plugin = {
            id: m.pluginId,
            name: m.name,
            version: m.version,
            type: 'PUBLIC',
            description: `${m.name} domain plugin (adapter-based)`,
            businessScoped: m.businessScoped,
            manifest: {
                ...manifest,
                version: m.version,
                author: 'DIE Platform',
                category: m.category,
                tags: m.tags,
            },
            capabilities: [],
            pricingModel: m.pricingModel,
            visibility: m.visibility,
            triggers: [],
            async execute() {
                return { success: true };
            },
        };
        return plugin;
    }
}
exports.BaseDomainPluginAdapter = BaseDomainPluginAdapter;
