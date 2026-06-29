import type { DIEPlugin } from '@/lib/die/plugins/core/plugin-types'
import type { DIEPluginManifest } from '@/lib/die/plugins/core/plugin-manifest'
import type {
  DomainPluginAdapter,
  DomainAdapterMeta,
  DomainEvent,
  GovernanceMapping,
  MarketplaceSignals,
  IntelligenceMetrics,
  UnifiedFeedSignal,
} from './types'

export abstract class BaseDomainPluginAdapter implements DomainPluginAdapter {
  abstract meta(): DomainAdapterMeta
  abstract manifest(): DIEPluginManifest
  abstract mapEventToGovernance(ev: DomainEvent): GovernanceMapping | null
  abstract mapEventToMarketplace(ev: DomainEvent): MarketplaceSignals | null
  abstract mapEventToIntelligence(ev: DomainEvent): IntelligenceMetrics | null
  abstract mapEventToFeed(ev: DomainEvent): UnifiedFeedSignal | null

  buildPlugin(): DIEPlugin {
    const m = this.meta()
    const manifest = this.manifest()
    const plugin: DIEPlugin = {
      id: m.pluginId,
      name: m.name,
      version: m.version,
      type: 'PUBLIC',
      description: `${m.name} domain plugin (adapter-based)` as string,
      businessScoped: m.businessScoped,
      manifest: {
        ...manifest,
        version: m.version,
        author: 'DIE Platform',
        category: m.category,
        tags: m.tags,
      },
      capabilities: [],
      pricingModel: m.pricingModel,
      visibility: m.visibility,
      triggers: [],
      async execute() {
        return { success: true }
      },
    }
    return plugin
  }
}
