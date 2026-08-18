export type PricingModel = 'FREE' | 'FREEMIUM' | 'PAID' | 'ENTERPRISE'

export interface PluginMarketplaceEntry {
  id: string
  name: string
  description?: string
  version?: string
  category: string
  pricingModel: PricingModel
  tags?: string[]
  author?: string
  rating?: number // placeholder, future-ready
  installedCount?: number // placeholder, future-ready
  routes?: {
    public?: string[]
    api?: string[]
    dashboard?: string[]
  }
  capabilities?: string[]
}

export type MarketplaceLifecycleState = 'DISCOVERED' | 'REGISTERED' | 'ENABLED' | 'DISABLED'

export interface PluginWithStatus extends PluginMarketplaceEntry {
  status: MarketplaceLifecycleState
}
