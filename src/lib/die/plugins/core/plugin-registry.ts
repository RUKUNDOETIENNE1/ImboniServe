import type { DIEPlugin, DIEPluginTrigger, DIEPluginType } from './plugin-types'
import type {
  DIEPluginApiRouteDefinition,
  DIEPluginRouteDefinition,
  DIEPluginRouteKind,
} from './plugin-manifest'

interface RegisteredRoute {
  plugin: DIEPlugin
  route: DIEPluginRouteDefinition
  segments: string[]
}

export interface PluginRouteMatch {
  plugin: DIEPlugin
  route: DIEPluginRouteDefinition
  params: Record<string, string>
}

export class PluginRegistry {
  private readonly plugins = new Map<string, DIEPlugin>()
  private readonly routeIndex = new Map<DIEPluginRouteKind, RegisteredRoute[]>()

  register(plugin: DIEPlugin): void {
    if (this.plugins.has(plugin.id)) {
      throw new Error(`Plugin with id ${plugin.id} already registered`)
    }
    const frozen = Object.freeze({ ...plugin })
    this.plugins.set(plugin.id, frozen)

    const manifest = frozen.manifest ?? { routes: {} }

    const registerRoute = (kind: DIEPluginRouteKind, route: DIEPluginRouteDefinition) => {
      const normalizedPath = route.path.startsWith('/') ? route.path.slice(1) : route.path
      const segments = normalizedPath.split('/').filter(Boolean)

      const existing = this.routeIndex.get(kind) ?? []
      if (existing.some((entry) => entry.route.path === route.path)) {
        throw new Error(`Route ${route.path} for ${kind} already registered`)
      }

      const entry: RegisteredRoute = { plugin: frozen, route, segments }
      this.routeIndex.set(kind, [...existing, entry])
    }

    manifest.routes.public?.forEach((route: DIEPluginRouteDefinition) => registerRoute('public', route))
    manifest.routes.api?.forEach((route: DIEPluginApiRouteDefinition) => registerRoute('api', route))
    manifest.routes.dashboard?.forEach((route: DIEPluginRouteDefinition) => registerRoute('dashboard', route))
  }

  get(pluginId: string): DIEPlugin | undefined {
    return this.plugins.get(pluginId)
  }

  list(): DIEPlugin[] {
    return Array.from(this.plugins.values())
  }

  listByType(type: DIEPluginType): DIEPlugin[] {
    return this.list().filter((plugin) => plugin.type === type)
  }

  resolveByTrigger(trigger: DIEPluginTrigger): DIEPlugin[] {
    return this.list().filter((plugin) => plugin.triggers.includes(trigger))
  }

  resolveRoute(
    kind: DIEPluginRouteKind,
    pathSegments: string[],
    method?: string
  ): PluginRouteMatch | undefined {
    const entries = this.routeIndex.get(kind) ?? []

    for (const entry of entries) {
      if (kind === 'api' && method) {
        const apiRoute = entry.route as DIEPluginApiRouteDefinition
        if (apiRoute.method !== method.toUpperCase()) {
          continue
        }
      }

      if (entry.segments.length !== pathSegments.length) continue

      const params: Record<string, string> = {}
      let matched = true

      for (let i = 0; i < entry.segments.length; i += 1) {
        const template = entry.segments[i]
        const actual = pathSegments[i]

        if (template.startsWith('[') && template.endsWith(']')) {
          const key = template.slice(1, -1)
          params[key] = actual
          continue
        }

        if (template !== actual) {
          matched = false
          break
        }
      }

      if (matched) {
        return { plugin: entry.plugin, route: entry.route, params }
      }
    }

    return undefined
  }
}
