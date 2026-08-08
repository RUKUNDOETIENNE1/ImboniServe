"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.corePlugins = void 0;
exports.registerCorePlugins = registerCorePlugins;
exports.addCorePlugin = addCorePlugin;
const qr_menu_plugin_1 = require("./qr-menu.plugin");
exports.corePlugins = [qr_menu_plugin_1.QRMenuPlugin];
function registerCorePlugins(registry) {
    for (const plugin of exports.corePlugins) {
        registry.register(plugin);
    }
}
function addCorePlugin(plugin) {
    exports.corePlugins.push(plugin);
}
