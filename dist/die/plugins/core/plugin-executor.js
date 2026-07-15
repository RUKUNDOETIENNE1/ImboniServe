"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginExecutor = void 0;
class PluginExecutor {
    constructor(hooks = {}) {
        this.hooks = hooks;
    }
    async execute(plugin, context) {
        try {
            if (this.hooks.beforeExecute) {
                await this.hooks.beforeExecute(plugin, context);
            }
            const result = await plugin.execute(context);
            if (this.hooks.afterExecute) {
                await this.hooks.afterExecute(plugin, context, result);
            }
            return result;
        }
        catch (error) {
            if (this.hooks.onError) {
                await this.hooks.onError(plugin, context, error);
            }
            context.services.logger.error(`[PluginExecutor] Plugin ${plugin.id} failed for trigger ${context.event.trigger}`, error);
            return {
                success: false,
                errors: [error instanceof Error ? error.message : 'Unknown plugin error'],
            };
        }
    }
}
exports.PluginExecutor = PluginExecutor;
