"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerMarketplaceEntry = registerMarketplaceEntry;
exports.listMarketplacePlugins = listMarketplacePlugins;
exports.getMarketplacePlugin = getMarketplacePlugin;
exports.installPlugin = installPlugin;
exports.enablePlugin = enablePlugin;
exports.disablePlugin = disablePlugin;
const plugin_runner_1 = require("../runtime/plugin-runner");
const governance_engine_service_1 = require("../../governance/governance-engine.service");
const governance_guard_service_1 = require("../../governance/governance-guard.service");
const governanceGuard = new governance_guard_service_1.GovernanceGuardService(governance_engine_service_1.governanceEngine);
// In-memory marketplace registry overlaying the core plugin registry
const globalScope = globalThis;
if (!globalScope.__dieMarketplace) {
    globalScope.__dieMarketplace = {
        entries: new Map(),
        statuses: new Map(),
    };
}
const entries = () => globalScope.__dieMarketplace.entries;
const statuses = () => globalScope.__dieMarketplace.statuses;
function registerMarketplaceEntry(meta) {
    entries().set(meta.id, meta);
    if (!statuses().has(meta.id)) {
        statuses().set(meta.id, 'REGISTERED');
    }
}
function listMarketplacePlugins() {
    const core = plugin_runner_1.pluginRunner.list();
    const result = core.map((p) => {
        const m = p.manifest ?? {};
        const category = typeof m.category === 'string' ? m.category : m.metadata?.category ?? 'general';
        const tags = Array.isArray(m.tags)
            ? m.tags
            : Array.isArray(m.metadata?.tags)
                ? m.metadata?.tags
                : [];
        const pricingModel = (p.pricingModel ?? 'free').toUpperCase();
        const routes = {
            public: (m.routes?.public ?? []).map((r) => r.path),
            api: (m.routes?.api ?? []).map((r) => r.path),
            dashboard: (m.routes?.dashboard ?? []).map((r) => r.path),
        };
        const meta = {
            id: p.id,
            name: p.name,
            description: p.description,
            version: p.version,
            category,
            pricingModel,
            tags,
            author: m.author,
            routes,
            capabilities: p.capabilities ?? [],
        };
        const status = statuses().get(p.id) ?? 'DISCOVERED';
        return { ...meta, status };
    });
    return result;
}
function getMarketplacePlugin(id) {
    const list = listMarketplacePlugins();
    const found = list.find((p) => p.id === id);
    return found ?? null;
}
async function installPlugin(id) {
    const plugin = plugin_runner_1.pluginRunner.list().find((p) => p.id === id);
    if (!plugin)
        return;
    // Governance: detect anomalies (soft enforcement only)
    await governanceGuard.detectInstallAnomalies(id, null);
    const services = plugin_runner_1.pluginRunner.getServices();
    try {
        if (plugin.install) {
            await plugin.install({ services });
        }
        if (plugin.onInstall) {
            await plugin.onInstall({ services });
        }
    }
    catch (err) {
        console.error(`[Marketplace] install failed for ${id}`, err);
    }
    // Governance: record install event
    await governance_engine_service_1.governanceEngine.recordInstall(id, null);
    statuses().set(id, 'REGISTERED');
}
async function enablePlugin(id) {
    const plugin = plugin_runner_1.pluginRunner.list().find((p) => p.id === id);
    if (!plugin)
        return;
    // Governance: detect anomalies (soft enforcement only)
    await governanceGuard.detectEnableAnomalies(id, null);
    try {
        await plugin_runner_1.pluginRunner.enable(id);
    }
    catch (err) {
        console.error(`[Marketplace] enable failed for ${id}`, err);
    }
    // Governance: record enable event
    await governance_engine_service_1.governanceEngine.recordEnable(id, null);
    statuses().set(id, 'ENABLED');
}
async function disablePlugin(id) {
    const plugin = plugin_runner_1.pluginRunner.list().find((p) => p.id === id);
    if (!plugin)
        return;
    // Governance: detect anomalies (soft enforcement only)
    await governanceGuard.detectDisableAnomalies(id, null);
    try {
        await plugin_runner_1.pluginRunner.disable(id);
    }
    catch (err) {
        console.error(`[Marketplace] disable failed for ${id}`, err);
    }
    // Governance: record disable event
    await governance_engine_service_1.governanceEngine.recordDisable(id, null);
    statuses().set(id, 'DISABLED');
}
