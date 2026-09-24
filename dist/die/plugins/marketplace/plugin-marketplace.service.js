"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginMarketplaceService = void 0;
const registry_1 = require("./registry");
class PluginMarketplaceService {
    async listAvailablePlugins() {
        return (0, registry_1.listMarketplacePlugins)();
    }
    async getPluginDetails(id) {
        return (0, registry_1.getMarketplacePlugin)(id);
    }
    async installPlugin(id) {
        await (0, registry_1.installPlugin)(id);
    }
    async enablePlugin(id) {
        await (0, registry_1.enablePlugin)(id);
    }
    async disablePlugin(id) {
        await (0, registry_1.disablePlugin)(id);
    }
}
exports.PluginMarketplaceService = PluginMarketplaceService;
