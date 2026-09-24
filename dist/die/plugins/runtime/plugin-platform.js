"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderPluginPublicRoute = renderPluginPublicRoute;
exports.renderPluginDashboardRoute = renderPluginDashboardRoute;
exports.handlePluginApiRequest = handlePluginApiRequest;
exports.listDashboardPluginEntries = listDashboardPluginEntries;
exports.resolveBusinessId = resolveBusinessId;
const plugin_runner_1 = require("./plugin-runner");
function normalizeSegments(input) {
    return input.filter(Boolean);
}
function normalizeQueryParams(query) {
    const result = {};
    for (const [key, value] of Object.entries(query)) {
        if (typeof value === 'undefined')
            continue;
        result[key] = Array.isArray(value) ? value : value;
    }
    return result;
}
function resolveBusinessId(raw) {
    if (typeof raw === 'string' && raw.trim().length > 0) {
        return raw;
    }
    return null;
}
async function renderPluginPublicRoute(options) {
    const pathSegments = normalizeSegments(options.pathSegments);
    if (pathSegments.length === 0) {
        return { kind: 'notFound' };
    }
    const match = plugin_runner_1.pluginRunner.getRegistry().resolveRoute('public', pathSegments);
    if (!match || !match.plugin.render) {
        return { kind: 'notFound' };
    }
    const businessId = match.plugin.businessScoped ? options.businessId ?? null : null;
    const services = plugin_runner_1.pluginRunner.getServices(businessId ?? undefined);
    const query = normalizeQueryParams(options.query);
    try {
        const result = await match.plugin.render({
            route: match.route,
            params: match.params,
            query,
            locale: options.locale,
            businessId,
            services,
        });
        if (result.type === 'notFound') {
            return { kind: 'notFound' };
        }
        if (result.type === 'redirect') {
            return {
                kind: 'redirect',
                destination: result.destination,
                permanent: result.permanent,
            };
        }
        return {
            kind: 'props',
            plugin: match.plugin,
            route: match.route,
            props: result.props,
            headers: result.headers,
        };
    }
    catch (error) {
        console.error('[PluginPlatform] render route failed', error);
        return { kind: 'notFound' };
    }
}
async function renderPluginDashboardRoute(options) {
    const pathSegments = normalizeSegments(options.pathSegments);
    if (pathSegments.length === 0) {
        return { kind: 'notFound' };
    }
    const match = plugin_runner_1.pluginRunner.getRegistry().resolveRoute('dashboard', pathSegments);
    if (!match || !match.plugin.render) {
        return { kind: 'notFound' };
    }
    const guard = match.route.guard ?? (match.plugin.businessScoped ? 'business' : 'public');
    const requiresBusiness = guard === 'business' || match.plugin.businessScoped;
    const businessId = requiresBusiness ? options.businessId ?? null : null;
    if (requiresBusiness && !businessId) {
        return { kind: 'notFound' };
    }
    const services = plugin_runner_1.pluginRunner.getServices(businessId ?? undefined);
    const query = normalizeQueryParams(options.query);
    try {
        const result = await match.plugin.render({
            route: match.route,
            params: match.params,
            query,
            locale: options.locale,
            businessId,
            services,
        });
        if (result.type === 'notFound') {
            return { kind: 'notFound' };
        }
        if (result.type === 'redirect') {
            return {
                kind: 'redirect',
                destination: result.destination,
                permanent: result.permanent,
            };
        }
        return {
            kind: 'props',
            plugin: match.plugin,
            route: match.route,
            props: result.props,
            headers: result.headers,
        };
    }
    catch (error) {
        console.error('[PluginPlatform] dashboard render route failed', error);
        return { kind: 'notFound' };
    }
}
async function handlePluginApiRequest(options) {
    const pathSegments = normalizeSegments(options.pathSegments);
    if (pathSegments.length === 0) {
        return { kind: 'notFound' };
    }
    const match = plugin_runner_1.pluginRunner.getRegistry().resolveRoute('api', pathSegments, options.method);
    if (!match || !match.plugin.publish) {
        return { kind: 'notFound' };
    }
    const businessId = match.plugin.businessScoped ? options.businessId ?? null : null;
    const services = plugin_runner_1.pluginRunner.getServices(businessId ?? undefined);
    const query = normalizeQueryParams(options.query);
    try {
        const result = await match.plugin.publish({
            route: match.route,
            params: match.params,
            query,
            body: options.body,
            businessId,
            services,
        });
        return {
            kind: 'handled',
            plugin: match.plugin,
            route: match.route,
            result,
        };
    }
    catch (error) {
        console.error('[PluginPlatform] publish route failed', error);
        return { kind: 'notFound' };
    }
}
function listDashboardPluginEntries() {
    const plugins = plugin_runner_1.pluginRunner.list();
    return plugins.flatMap((plugin) => {
        const dashboardRoutes = (plugin.manifest.routes.dashboard ?? []);
        return dashboardRoutes.map((route) => ({
            plugin,
            route,
        }));
    });
}
