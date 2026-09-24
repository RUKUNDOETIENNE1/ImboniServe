import type { DIEPlugin } from '../core/plugin-types'
import { pluginRunner } from '../runtime/plugin-runner'
import type { PluginMarketplaceEntry, PluginWithStatus, MarketplaceLifecycleState } from './types'
import { governanceEngine } from '../../governance/governance-engine.service'
import { GovernanceGuardService } from '../../governance/governance-guard.service'

const governanceGuard = new GovernanceGuardService(governanceEngine)

// In-memory marketplace registry overlaying the core plugin registry
const globalScope = globalThis as typeof globalThis & {
  __dieMarketplace?: {
    entries: Map<string, PluginMarketplaceEntry>
    statuses: Map<string, MarketplaceLifecycleState>
  }
}

if (!globalScope.__dieMarketplace) {
  globalScope.__dieMarketplace = {
    entries: new Map(),
    statuses: new Map(),
  }
}

const entries = () => globalScope.__dieMarketplace!.entries
const statuses = () => globalScope.__dieMarketplace!.statuses

export function registerMarketplaceEntry(meta: PluginMarketplaceEntry): void {
  entries().set(meta.id, meta)
  if (!statuses().has(meta.id)) {
    statuses().set(meta.id, 'REGISTERED')
  }
}

export function listMarketplacePlugins(): PluginWithStatus[] {
  const core = pluginRunner.list()
  const result: PluginWithStatus[] = core.map((p) => {
    const m: any = p.manifest ?? {}
    const category = typeof m.category === 'string' ? m.category : (m.metadata?.category as string) ?? 'general'
    const tags = Array.isArray(m.tags)
      ? (m.tags as string[])
      : Array.isArray(m.metadata?.tags)
      ? (m.metadata?.tags as string[])
      : []
    const pricingModel = (p.pricingModel ?? 'free').toUpperCase() as PluginMarketplaceEntry['pricingModel']

    const routes = {
      public: (m.routes?.public ?? []).map((r: any) => r.path) as string[],
      api: (m.routes?.api ?? []).map((r: any) => r.path) as string[],
      dashboard: (m.routes?.dashboard ?? []).map((r: any) => r.path) as string[],
    }

    const meta: PluginMarketplaceEntry = {
      id: p.id,
      name: p.name,
      description: p.description,
      version: p.version,
      category,
      pricingModel,
      tags,
      author: m.author,
      routes,
      capabilities: p.capabilities ?? [],
    }
    const status = statuses().get(p.id) ?? 'DISCOVERED'
    return { ...meta, status }
  })
  return result
}

export function getMarketplacePlugin(id: string): PluginWithStatus | null {
  const list = listMarketplacePlugins()
  const found = list.find((p) => p.id === id)
  return found ?? null
}

export async function installPlugin(id: string): Promise<void> {
  const plugin: DIEPlugin | undefined = pluginRunner.list().find((p) => p.id === id)
  if (!plugin) return
  
  // Governance: detect anomalies (soft enforcement only)
  await governanceGuard.detectInstallAnomalies(id, null)
  
  const services = pluginRunner.getServices()
  try {
    if (plugin.install) {
      await plugin.install({ services })
    }
    if ((plugin as any).onInstall) {
      await (plugin as any).onInstall({ services })
    }
  } catch (err) {
    console.error(`[Marketplace] install failed for ${id}`, err)
  }
  
  // Governance: record install event
  await governanceEngine.recordInstall(id, null)
  
  statuses().set(id, 'REGISTERED')
}

export async function enablePlugin(id: string): Promise<void> {
  const plugin: DIEPlugin | undefined = pluginRunner.list().find((p) => p.id === id)
  if (!plugin) return
  
  // Governance: detect anomalies (soft enforcement only)
  await governanceGuard.detectEnableAnomalies(id, null)
  
  try {
    await pluginRunner.enable(id)
  } catch (err) {
    console.error(`[Marketplace] enable failed for ${id}`, err)
  }
  
  // Governance: record enable event
  await governanceEngine.recordEnable(id, null)
  
  statuses().set(id, 'ENABLED')
}

export async function disablePlugin(id: string): Promise<void> {
  const plugin: DIEPlugin | undefined = pluginRunner.list().find((p) => p.id === id)
  if (!plugin) return
  
  // Governance: detect anomalies (soft enforcement only)
  await governanceGuard.detectDisableAnomalies(id, null)
  
  try {
    await pluginRunner.disable(id)
  } catch (err) {
    console.error(`[Marketplace] disable failed for ${id}`, err)
  }
  
  // Governance: record disable event
  await governanceEngine.recordDisable(id, null)
  
  statuses().set(id, 'DISABLED')
}
