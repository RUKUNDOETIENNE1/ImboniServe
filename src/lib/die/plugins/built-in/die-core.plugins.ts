import type { DIEPlugin } from '../core/plugin-types'
import type { PluginRegistry } from '../core/plugin-registry'
import { QRMenuPlugin } from './qr-menu.plugin'

export const corePlugins: DIEPlugin[] = [QRMenuPlugin]

export function registerCorePlugins(registry: PluginRegistry): void {
  for (const plugin of corePlugins) {
    registry.register(plugin)
  }
}

export function addCorePlugin(plugin: DIEPlugin): void {
  corePlugins.push(plugin)
}
