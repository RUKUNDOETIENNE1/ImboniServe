import type { DIEPlugin } from '@/lib/die/plugins/core/plugin-types'
import type { DomainPluginAdapter } from './types'

export function buildDomainPlugin(adapter: DomainPluginAdapter): DIEPlugin {
  return adapter.buildPlugin()
}
