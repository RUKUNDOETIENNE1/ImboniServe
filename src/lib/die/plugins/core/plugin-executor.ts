import type { DIEPlugin } from './plugin-types'
import type { DIEPluginContext } from './plugin-context'
import type { DIEPluginHooks } from './plugin-hooks'
import type { DIEPluginResult } from './plugin-types'

export class PluginExecutor {
  constructor(private readonly hooks: DIEPluginHooks = {}) {}

  async execute(plugin: DIEPlugin, context: DIEPluginContext): Promise<DIEPluginResult> {
    try {
      if (this.hooks.beforeExecute) {
        await this.hooks.beforeExecute(plugin, context)
      }

      const result = await plugin.execute(context)

      if (this.hooks.afterExecute) {
        await this.hooks.afterExecute(plugin, context, result)
      }

      return result
    } catch (error) {
      if (this.hooks.onError) {
        await this.hooks.onError(plugin, context, error)
      }

      context.services.logger.error(
        `[PluginExecutor] Plugin ${plugin.id} failed for trigger ${context.event.trigger}`,
        error
      )

      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown plugin error'],
      }
    }
  }
}
