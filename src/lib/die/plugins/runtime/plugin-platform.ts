import type { ParsedUrlQuery } from 'querystring'
import type { DIEPlugin, DIEPluginPublishResult, DIEPluginRenderResult } from '../core/plugin-types'
import type { DIEPluginDashboardRouteDefinition, DIEPluginRouteDefinition } from '../core/plugin-manifest'
import { pluginRunner } from './plugin-runner'

export interface PublicRouteRenderOptions {
  pathSegments: string[]
  query: ParsedUrlQuery
  locale?: string
  businessId?: string | null
}

export type PluginRouteRenderOutcome =
  | { kind: 'notFound' }
  | { kind: 'redirect'; destination: string; permanent?: boolean }
  | { kind: 'props'; plugin: DIEPlugin; route: DIEPluginRouteDefinition; props: Record<string, unknown>; headers?: Record<string, string> }

export interface ApiRouteOptions {
  method: string
  pathSegments: string[]
  query: ParsedUrlQuery
  body?: unknown
  businessId?: string | null
}

export type ApiRouteOutcome =
  | { kind: 'notFound' }
  | { kind: 'handled'; plugin: DIEPlugin; route: DIEPluginRouteDefinition; result: DIEPluginPublishResult }

function normalizeSegments(input: string[]): string[] {
  return input.filter(Boolean)
}

function normalizeQueryParams(query: ParsedUrlQuery): Record<string, string | string[]> {
  const result: Record<string, string | string[]> = {}
  for (const [key, value] of Object.entries(query)) {
    if (typeof value === 'undefined') continue
    result[key] = Array.isArray(value) ? value : value
  }
  return result
}

function resolveBusinessId(raw: string | string[] | undefined): string | null {
  if (typeof raw === 'string' && raw.trim().length > 0) {
    return raw
  }
  return null
}

export async function renderPluginPublicRoute(options: PublicRouteRenderOptions): Promise<PluginRouteRenderOutcome> {
  const pathSegments = normalizeSegments(options.pathSegments)
  if (pathSegments.length === 0) {
    return { kind: 'notFound' }
  }

  const match = pluginRunner.getRegistry().resolveRoute('public', pathSegments)
  if (!match || !match.plugin.render) {
    return { kind: 'notFound' }
  }

  const businessId = match.plugin.businessScoped ? options.businessId ?? null : null
  const services = pluginRunner.getServices(businessId ?? undefined)
  const query = normalizeQueryParams(options.query)

  try {
    const result: DIEPluginRenderResult = await match.plugin.render({
      route: match.route,
      params: match.params,
      query,
      locale: options.locale,
      businessId,
      services,
    })

    if (result.type === 'notFound') {
      return { kind: 'notFound' }
    }

    if (result.type === 'redirect') {
      return {
        kind: 'redirect',
        destination: result.destination,
        permanent: result.permanent,
      }
    }

    return {
      kind: 'props',
      plugin: match.plugin,
      route: match.route,
      props: result.props,
      headers: result.headers,
    }
  } catch (error) {
    console.error('[PluginPlatform] render route failed', error)
    return { kind: 'notFound' }
  }
}

export interface DashboardRouteRenderOptions {
  pathSegments: string[]
  query: ParsedUrlQuery
  locale?: string
  businessId?: string | null
}

export async function renderPluginDashboardRoute(
  options: DashboardRouteRenderOptions
): Promise<PluginRouteRenderOutcome> {
  const pathSegments = normalizeSegments(options.pathSegments)
  if (pathSegments.length === 0) {
    return { kind: 'notFound' }
  }

  const match = pluginRunner.getRegistry().resolveRoute('dashboard', pathSegments)
  if (!match || !match.plugin.render) {
    return { kind: 'notFound' }
  }

  const guard = match.route.guard ?? (match.plugin.businessScoped ? 'business' : 'public')
  const requiresBusiness = guard === 'business' || match.plugin.businessScoped
  const businessId = requiresBusiness ? options.businessId ?? null : null

  if (requiresBusiness && !businessId) {
    return { kind: 'notFound' }
  }

  const services = pluginRunner.getServices(businessId ?? undefined)
  const query = normalizeQueryParams(options.query)

  try {
    const result: DIEPluginRenderResult = await match.plugin.render({
      route: match.route,
      params: match.params,
      query,
      locale: options.locale,
      businessId,
      services,
    })

    if (result.type === 'notFound') {
      return { kind: 'notFound' }
    }

    if (result.type === 'redirect') {
      return {
        kind: 'redirect',
        destination: result.destination,
        permanent: result.permanent,
      }
    }

    return {
      kind: 'props',
      plugin: match.plugin,
      route: match.route,
      props: result.props,
      headers: result.headers,
    }
  } catch (error) {
    console.error('[PluginPlatform] dashboard render route failed', error)
    return { kind: 'notFound' }
  }
}

export async function handlePluginApiRequest(options: ApiRouteOptions): Promise<ApiRouteOutcome> {
  const pathSegments = normalizeSegments(options.pathSegments)
  if (pathSegments.length === 0) {
    return { kind: 'notFound' }
  }

  const match = pluginRunner.getRegistry().resolveRoute('api', pathSegments, options.method)
  if (!match || !match.plugin.publish) {
    return { kind: 'notFound' }
  }

  const businessId = match.plugin.businessScoped ? options.businessId ?? null : null
  const services = pluginRunner.getServices(businessId ?? undefined)
  const query = normalizeQueryParams(options.query)

  try {
    const result = await match.plugin.publish({
      route: match.route,
      params: match.params,
      query,
      body: options.body,
      businessId,
      services,
    })

    return {
      kind: 'handled',
      plugin: match.plugin,
      route: match.route,
      result,
    }
  } catch (error) {
    console.error('[PluginPlatform] publish route failed', error)
    return { kind: 'notFound' }
  }
}

export function listDashboardPluginEntries() {
  const plugins = pluginRunner.list()
  return plugins.flatMap((plugin) => {
    const dashboardRoutes = (plugin.manifest.routes.dashboard ?? []) as DIEPluginDashboardRouteDefinition[]
    return dashboardRoutes.map((route) => ({
      plugin,
      route,
    }))
  })
}

export { resolveBusinessId }
