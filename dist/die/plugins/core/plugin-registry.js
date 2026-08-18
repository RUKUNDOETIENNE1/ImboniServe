"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginRegistry = void 0;
class PluginRegistry {
    constructor() {
        this.plugins = new Map();
        this.routeIndex = new Map();
    }
    register(plugin) {
        if (this.plugins.has(plugin.id)) {
            throw new Error(`Plugin with id ${plugin.id} already registered`);
        }
        const frozen = Object.freeze({ ...plugin });
        this.plugins.set(plugin.id, frozen);
        const manifest = frozen.manifest ?? { routes: {} };
        const registerRoute = (kind, route) => {
            const normalizedPath = route.path.startsWith('/') ? route.path.slice(1) : route.path;
            const segments = normalizedPath.split('/').filter(Boolean);
            const existing = this.routeIndex.get(kind) ?? [];
            if (existing.some((entry) => entry.route.path === route.path)) {
                throw new Error(`Route ${route.path} for ${kind} already registered`);
            }
            const entry = { plugin: frozen, route, segments };
            this.routeIndex.set(kind, [...existing, entry]);
        };
        manifest.routes.public?.forEach((route) => registerRoute('public', route));
        manifest.routes.api?.forEach((route) => registerRoute('api', route));
        manifest.routes.dashboard?.forEach((route) => registerRoute('dashboard', route));
    }
    get(pluginId) {
        return this.plugins.get(pluginId);
    }
    list() {
        return Array.from(this.plugins.values());
    }
    listByType(type) {
        return this.list().filter((plugin) => plugin.type === type);
    }
    resolveByTrigger(trigger) {
        return this.list().filter((plugin) => plugin.triggers.includes(trigger));
    }
    resolveRoute(kind, pathSegments, method) {
        const entries = this.routeIndex.get(kind) ?? [];
        for (const entry of entries) {
            if (kind === 'api' && method) {
                const apiRoute = entry.route;
                if (apiRoute.method !== method.toUpperCase()) {
                    continue;
                }
            }
            if (entry.segments.length !== pathSegments.length)
                continue;
            const params = {};
            let matched = true;
            for (let i = 0; i < entry.segments.length; i += 1) {
                const template = entry.segments[i];
                const actual = pathSegments[i];
                if (template.startsWith('[') && template.endsWith(']')) {
                    const key = template.slice(1, -1);
                    params[key] = actual;
                    continue;
                }
                if (template !== actual) {
                    matched = false;
                    break;
                }
            }
            if (matched) {
                return { plugin: entry.plugin, route: entry.route, params };
            }
        }
        return undefined;
    }
}
exports.PluginRegistry = PluginRegistry;
