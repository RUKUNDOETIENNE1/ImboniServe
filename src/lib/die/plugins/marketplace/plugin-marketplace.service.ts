import type { PluginWithStatus } from './types'
import {
  listMarketplacePlugins,
  getMarketplacePlugin,
  installPlugin as _install,
  enablePlugin as _enable,
  disablePlugin as _disable,
} from './registry'

export class PluginMarketplaceService {
  async listAvailablePlugins(): Promise<PluginWithStatus[]> {
    return listMarketplacePlugins()
  }

  async getPluginDetails(id: string): Promise<PluginWithStatus | null> {
    return getMarketplacePlugin(id)
  }

  async installPlugin(id: string): Promise<void> {
    await _install(id)
  }

  async enablePlugin(id: string): Promise<void> {
    await _enable(id)
  }

  async disablePlugin(id: string): Promise<void> {
    await _disable(id)
  }
}
