export type DIEPluginRouteKind = 'public' | 'api' | 'dashboard'

export interface DIEPluginRouteDefinition {
  id: string
  path: string
  description?: string
  guard?: 'business' | 'public'
}

export interface DIEPluginApiRouteDefinition extends DIEPluginRouteDefinition {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
}

export interface DIEPluginDashboardRouteDefinition extends DIEPluginRouteDefinition {
  icon?: string
  order?: number
}

export interface DIEPluginManifest {
  routes: {
    public?: DIEPluginRouteDefinition[]
    api?: DIEPluginApiRouteDefinition[]
    dashboard?: DIEPluginDashboardRouteDefinition[]
  }
  permissions?: string[]
  metadata?: Record<string, unknown>
}
