"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pluginRunner = void 0;
const prisma_1 = require("../../../prisma");
const storage_service_1 = require("../../../services/storage.service");
const plugin_registry_1 = require("../core/plugin-registry");
const plugin_executor_1 = require("../core/plugin-executor");
const plugin_hooks_1 = require("../core/plugin-hooks");
const event_bus_1 = require("./event-bus");
const trigger_resolver_1 = require("./trigger-resolver");
const die_core_plugins_1 = require("../built-in/die-core.plugins");
class PluginRunner {
    constructor() {
        this.registry = new plugin_registry_1.PluginRegistry();
        this.eventBus = new event_bus_1.PluginEventBus();
        this.executor = new plugin_executor_1.PluginExecutor(plugin_hooks_1.defaultPluginHooks);
        this.triggerResolver = new trigger_resolver_1.TriggerResolver(() => this.registry.list());
        (0, die_core_plugins_1.registerCorePlugins)(this.registry);
    }
    register(plugin) {
        this.registry.register(plugin);
        const services = this.createServices();
        // v2 lifecycle normalization — safe no-op wrappers
        const doInstall = async () => {
            try {
                if (plugin.install) {
                    await plugin.install({ services });
                }
                if (plugin.onInstall) {
                    await plugin.onInstall({ services });
                }
                console.info(`[PluginRunner] install completed for ${plugin.id}`);
            }
            catch (err) {
                console.error(`[PluginRunner] install failed for ${plugin.id}`, err);
            }
        };
        void doInstall();
        if (plugin.bootstrap) {
            plugin.bootstrap({ services }).catch((err) => {
                console.error(`[PluginRunner] Plugin ${plugin.id} bootstrap failed`, err);
            });
        }
    }
    list() {
        return this.registry.list();
    }
    getRegistry() {
        return this.registry;
    }
    getServices(businessId) {
        return this.createServices(businessId);
    }
    subscribe(eventType, handler) {
        return this.eventBus.subscribe(eventType, handler);
    }
    async emit(event) {
        await this.eventBus.publish(event);
        await this.runPlugins(event);
    }
    createServices(businessId) {
        const businessContext = businessId ?? 'shared';
        return {
            prisma: prisma_1.prisma,
            logger: console,
            storage: {
                saveJson: async (key, data) => {
                    const buffer = Buffer.from(JSON.stringify(data, null, 2), 'utf-8');
                    const filename = key.endsWith('.json') ? key : `${key}.json`;
                    const { storageKey } = await storage_service_1.StorageService.uploadPrivateDocument(buffer, filename, 'application/json', businessContext);
                    return { storageKey };
                },
                saveBuffer: async (key, buffer, contentType) => {
                    if (contentType?.startsWith('image/')) {
                        const { storageKey } = await storage_service_1.StorageService.uploadImage(buffer, key, contentType, businessContext);
                        return { storageKey };
                    }
                    if (contentType === 'application/json') {
                        const filename = key.endsWith('.json') ? key : `${key}.json`;
                        const { storageKey } = await storage_service_1.StorageService.uploadPrivateDocument(buffer, filename, contentType, businessContext);
                        return { storageKey };
                    }
                    const { storageKey } = await storage_service_1.StorageService.uploadFileGeneric(buffer, key, contentType ?? 'application/octet-stream', businessContext);
                    return { storageKey };
                },
                getPublicUrl: (storageKey) => storage_service_1.StorageService.getPublicUrl?.(storageKey) ?? null,
                readBuffer: async (storageKey) => storage_service_1.StorageService.downloadPrivate(storageKey),
            },
            publish: async (forwardEvent) => {
                await this.emit(forwardEvent);
            },
        };
    }
    async runPlugins(event) {
        const plugins = this.triggerResolver.resolve(event.type);
        if (plugins.length === 0)
            return;
        await Promise.allSettled(plugins.map(async (plugin) => {
            const eventPayload = event.payload;
            const businessId = eventPayload?.businessId ?? null;
            if (plugin.businessScoped && !businessId) {
                console.warn(`[PluginRunner] Plugin ${plugin.id} requires business scope but event missing businessId`);
                return;
            }
            const context = {
                businessId: businessId ?? '',
                documentId: event.payload?.documentId ?? null,
                userId: event.payload?.userId ?? null,
                event: event,
                services: this.createServices(plugin.businessScoped ? businessId ?? undefined : undefined),
            };
            const result = await this.executor.execute(plugin, context);
            if (!result.success) {
                console.warn(`[PluginRunner] Plugin ${plugin.id} reported failure`, result.errors);
            }
        }));
    }
    // v2 lifecycle wrappers for external enable/disable triggers (no-op by default)
    async enable(pluginId) {
        const plugin = this.registry.get(pluginId);
        if (!plugin)
            return;
        const services = this.createServices();
        try {
            if (plugin.onEnable) {
                await plugin.onEnable({ services });
            }
            console.info(`[PluginRunner] enable completed for ${plugin.id}`);
        }
        catch (err) {
            console.error(`[PluginRunner] enable failed for ${plugin.id}`, err);
        }
    }
    async disable(pluginId) {
        const plugin = this.registry.get(pluginId);
        if (!plugin)
            return;
        const services = this.createServices();
        try {
            if (plugin.onDisable) {
                await plugin.onDisable({ services });
            }
            console.info(`[PluginRunner] disable completed for ${plugin.id}`);
        }
        catch (err) {
            console.error(`[PluginRunner] disable failed for ${plugin.id}`, err);
        }
    }
}
exports.pluginRunner = new PluginRunner();
