import type { DIEPlugin } from './plugin-types'
import type { DIEPluginContext } from './plugin-context'
import type { DIEPluginResult } from './plugin-types'

export interface DIEPluginHooks {
  beforeExecute?: (plugin: DIEPlugin, context: DIEPluginContext) => Promise<void> | void
  afterExecute?: (
    plugin: DIEPlugin,
    context: DIEPluginContext,
    result: DIEPluginResult
  ) => Promise<void> | void
  onError?: (
    plugin: DIEPlugin,
    context: DIEPluginContext,
    error: unknown
  ) => Promise<void> | void
}

export const defaultPluginHooks: DIEPluginHooks = {}
