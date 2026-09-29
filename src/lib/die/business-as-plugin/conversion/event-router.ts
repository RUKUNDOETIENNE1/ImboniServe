import type { DomainEvent } from './types'
import type { DomainAdapterBindings } from './contracts'
import type { DomainPluginAdapter } from './types'

export async function routeDomainEvent(adapter: DomainPluginAdapter, bindings: DomainAdapterBindings, ev: DomainEvent): Promise<void> {
  try {
    const g = adapter.mapEventToGovernance(ev as any)
    if (g && bindings.governance) await bindings.governance.recordLifecycle({ ...g, pluginId: adapter.meta().pluginId, businessId: ev.businessId ?? null, timestamp: ev.timestamp })
  } catch {}

  try {
    const m = adapter.mapEventToMarketplace(ev as any)
    if (m && bindings.marketplace) await bindings.marketplace.recordUsage({ ...m, pluginId: adapter.meta().pluginId, businessId: ev.businessId ?? null, timestamp: ev.timestamp })
  } catch {}

  try {
    const i = adapter.mapEventToIntelligence(ev as any)
    if (i && bindings.intelligence) await bindings.intelligence.recordMetrics({ ...i, pluginId: adapter.meta().pluginId, businessId: ev.businessId ?? null, timestamp: ev.timestamp })
  } catch {}

  try {
    const f = adapter.mapEventToFeed(ev as any)
    if (f && bindings.observability) await bindings.observability.emitFeed({ ...f, pluginId: adapter.meta().pluginId, timestamp: ev.timestamp })
  } catch {}
}
