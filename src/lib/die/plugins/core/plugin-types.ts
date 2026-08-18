import type { DIEPluginContext, DIEPluginLifecycleContext } from './plugin-context'
import type { DIEPluginManifest, DIEPluginRouteDefinition } from './plugin-manifest'

export type DIEPluginType = 'INTERNAL' | 'PUBLIC' | 'SYSTEM'

export type DIEPluginTrigger = string

export interface DIEPluginResult {
  success: boolean
  data?: unknown
  warnings?: string[]
  errors?: string[]
  metrics?: Record<string, number>
}

export interface DIEPluginRenderContext {
  route: DIEPluginRouteDefinition
  params: Record<string, string>
  query: Record<string, string | string[]>
  locale?: string
  businessId?: string | null
  services: DIEPluginContext['services']
}

export type DIEPluginRenderResult =
  | { type: 'props'; props: Record<string, unknown>; headers?: Record<string, string> }
  | { type: 'redirect'; destination: string; permanent?: boolean }
  | { type: 'notFound' }

export interface DIEPluginPublishContext {
  route: DIEPluginRouteDefinition
  params: Record<string, string>
  query: Record<string, string | string[]>
  body?: unknown
  businessId?: string | null
  services: DIEPluginContext['services']
}

export interface DIEPluginPublishResult {
  status: number
  body: unknown
  headers?: Record<string, string>
}

export interface DIEPlugin {
  id: string
  name: string
  version: string
  type: DIEPluginType
  description?: string
  businessScoped: boolean
  // v2: manifest carries structural metadata; still compatible with v1 usages
  manifest: DIEPluginManifest & {
    version: string
    author?: string
    category: string
    tags?: string[]
  }
  metadata?: Record<string, unknown>
  // v2: explicit capability declaration (structural only)
  capabilities?: string[]
  // v2: monetization & visibility metadata (structural only)
  pricingModel?: 'free' | 'freemium' | 'paid' | 'enterprise'
  visibility?: 'public' | 'private' | 'enterprise'
  triggers: DIEPluginTrigger[]
  // v1 legacy install hook (kept for backward-compat). Prefer onInstall.
  install?(context: DIEPluginLifecycleContext): Promise<void>
  // v2 standardized lifecycle hooks (optional, safe no-ops if undefined)
  onInstall?(context: DIEPluginLifecycleContext): Promise<void>
  onEnable?(context: DIEPluginLifecycleContext): Promise<void>
  onDisable?(context: DIEPluginLifecycleContext): Promise<void>
  bootstrap?(context: DIEPluginLifecycleContext): Promise<void>
  execute(context: DIEPluginContext): Promise<DIEPluginResult>
  render?(context: DIEPluginRenderContext): Promise<DIEPluginRenderResult>
  publish?(context: DIEPluginPublishContext): Promise<DIEPluginPublishResult>
}
