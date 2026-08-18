import { performance } from 'node:perf_hooks'
import { prisma } from '@/lib/prisma'
import { pluginRunner } from '@/lib/die/plugins/runtime/plugin-runner'
import type { DIEPluginRouteDefinition } from '@/lib/die/plugins/core/plugin-manifest'
import type { DIEPluginRenderResult } from '@/lib/die/plugins/core/plugin-types'
import type { QrMenuFixtureState } from './lib/qr-menu-fixtures'
import { ensureQrMenuFixtures, cleanupQrMenuFixtures } from './lib/qr-menu-fixtures'

interface QueryMetric {
  model?: string
  action?: string
  duration: number
}

interface StorageMetric {
  method: string
  duration: number
}

interface PhaseMetrics {
  routeResolutionMs: number
  renderMs: number
  queryTotalMs: number
  queryCount: number
  queries: QueryMetric[]
  storageTotalMs: number
  storageCalls: StorageMetric[]
  payloadBytes: number
  renderResult?: DIEPluginRenderResult
}

const metrics: Record<'public' | 'dashboard', PhaseMetrics> = {
  public: {
    routeResolutionMs: 0,
    renderMs: 0,
    queryTotalMs: 0,
    queryCount: 0,
    queries: [],
    storageTotalMs: 0,
    storageCalls: [],
    payloadBytes: 0,
  },
  dashboard: {
    routeResolutionMs: 0,
    renderMs: 0,
    queryTotalMs: 0,
    queryCount: 0,
    queries: [],
    storageTotalMs: 0,
    storageCalls: [],
    payloadBytes: 0,
  },
}

let activePhase: 'public' | 'dashboard' | null = null

prisma.$use(async (params, next) => {
  const start = performance.now()
  const result = await next(params)
  const duration = performance.now() - start
  if (activePhase) {
    const phase = metrics[activePhase]
    phase.queryTotalMs += duration
    phase.queryCount += 1
    phase.queries.push({ model: params.model ?? undefined, action: params.action ?? undefined, duration })
  }
  return result
})

function createInstrumentedStorage(phase: 'public' | 'dashboard', baseStorage: ReturnType<typeof pluginRunner.getServices>['storage']) {
  const record = (method: string, duration: number) => {
    const phaseMetrics = metrics[phase]
    phaseMetrics.storageTotalMs += duration
    phaseMetrics.storageCalls.push({ method, duration })
  }

  return {
    ...baseStorage,
    async saveJson(...args: Parameters<typeof baseStorage.saveJson>) {
      const start = performance.now()
      const result = await baseStorage.saveJson(...args)
      record('saveJson', performance.now() - start)
      return result
    },
    async saveBuffer(...args: Parameters<typeof baseStorage.saveBuffer>) {
      const start = performance.now()
      const result = await baseStorage.saveBuffer(...args)
      record('saveBuffer', performance.now() - start)
      return result
    },
    getPublicUrl(...args: Parameters<typeof baseStorage.getPublicUrl>) {
      const start = performance.now()
      const result = baseStorage.getPublicUrl(...args)
      record('getPublicUrl', performance.now() - start)
      return result
    },
    async readBuffer(...args: Parameters<typeof baseStorage.readBuffer>) {
      const start = performance.now()
      const result = await baseStorage.readBuffer(...args)
      record('readBuffer', performance.now() - start)
      return result
    },
  }
}

async function profilePublic(state: QrMenuFixtureState) {
  const registry = pluginRunner.getRegistry()
  const routeStart = performance.now()
  const match = registry.resolveRoute('public', ['plugins', 'qr-menu', state.menuId])
  metrics.public.routeResolutionMs = performance.now() - routeStart

  if (!match) {
    throw new Error('Failed to resolve public route for profiling.')
  }

  if (!match.plugin.render) {
    throw new Error('QR Menu plugin does not expose a render handler for public routes')
  }

  const services = pluginRunner.getServices(state.primaryBusinessId)
  const instrumentedStorage = createInstrumentedStorage('public', services.storage)

  activePhase = 'public'
  const renderStart = performance.now()
  try {
    const outcome = await match.plugin.render({
      route: match.route as DIEPluginRouteDefinition,
      params: match.params,
      query: {},
      locale: 'en',
      businessId: state.primaryBusinessId,
      services: { ...services, storage: instrumentedStorage },
    })

    metrics.public.renderMs = performance.now() - renderStart
    metrics.public.renderResult = outcome
    if (outcome.type === 'props') {
      metrics.public.payloadBytes = Buffer.byteLength(JSON.stringify(outcome.props ?? {}))
    }
  } finally {
    activePhase = null
  }
}

async function profileDashboard(state: QrMenuFixtureState) {
  const registry = pluginRunner.getRegistry()
  const routeStart = performance.now()
  const match = registry.resolveRoute('dashboard', ['dashboard', 'die', 'plugins', 'qr-menu'])
  metrics.dashboard.routeResolutionMs = performance.now() - routeStart

  if (!match) {
    throw new Error('Failed to resolve dashboard route for profiling.')
  }

  if (!match.plugin.render) {
    throw new Error('QR Menu plugin does not expose a render handler for dashboard routes')
  }

  const services = pluginRunner.getServices(state.primaryBusinessId)
  const instrumentedStorage = createInstrumentedStorage('dashboard', services.storage)

  activePhase = 'dashboard'
  const renderStart = performance.now()
  try {
    const outcome = await match.plugin.render({
      route: match.route as DIEPluginRouteDefinition,
      params: match.params,
      query: {},
      locale: 'en',
      businessId: state.primaryBusinessId,
      services: { ...services, storage: instrumentedStorage },
    })

    metrics.dashboard.renderMs = performance.now() - renderStart
    metrics.dashboard.renderResult = outcome
    if (outcome.type === 'props') {
      metrics.dashboard.payloadBytes = Buffer.byteLength(JSON.stringify(outcome.props ?? {}))
    }
  } finally {
    activePhase = null
  }
}

async function run() {
  console.log('\n=== QR Menu Performance Profile ===\n')
  let fixture: QrMenuFixtureState | null = null

  try {
    fixture = await ensureQrMenuFixtures()

    await profilePublic(fixture)
    await profileDashboard(fixture)

    console.log('Public Render Metrics:')
    console.table({
      'Route resolution (ms)': metrics.public.routeResolutionMs.toFixed(2),
      'Render total (ms)': metrics.public.renderMs.toFixed(2),
      'Prisma total (ms)': metrics.public.queryTotalMs.toFixed(2),
      'Prisma queries': metrics.public.queryCount,
      'Storage total (ms)': metrics.public.storageTotalMs.toFixed(2),
      'Storage calls': metrics.public.storageCalls.length,
      'Payload size (bytes)': metrics.public.payloadBytes,
    })

    console.log('\nDashboard Render Metrics:')
    console.table({
      'Route resolution (ms)': metrics.dashboard.routeResolutionMs.toFixed(2),
      'Render total (ms)': metrics.dashboard.renderMs.toFixed(2),
      'Prisma total (ms)': metrics.dashboard.queryTotalMs.toFixed(2),
      'Prisma queries': metrics.dashboard.queryCount,
      'Storage total (ms)': metrics.dashboard.storageTotalMs.toFixed(2),
      'Storage calls': metrics.dashboard.storageCalls.length,
      'Payload size (bytes)': metrics.dashboard.payloadBytes,
    })

    console.log('\nDetailed Prisma queries (public):')
    metrics.public.queries.forEach((query, index) => {
      console.log(`${index + 1}. ${query.model ?? 'raw'} ${query.action ?? ''} - ${query.duration.toFixed(2)}ms`)
    })

    console.log('\nDetailed Prisma queries (dashboard):')
    metrics.dashboard.queries.forEach((query, index) => {
      console.log(`${index + 1}. ${query.model ?? 'raw'} ${query.action ?? ''} - ${query.duration.toFixed(2)}ms`)
    })

    console.log('\nStorage calls (public):')
    metrics.public.storageCalls.forEach((call, index) => {
      console.log(`${index + 1}. ${call.method} - ${call.duration.toFixed(2)}ms`)
    })

    console.log('\nStorage calls (dashboard):')
    metrics.dashboard.storageCalls.forEach((call, index) => {
      console.log(`${index + 1}. ${call.method} - ${call.duration.toFixed(2)}ms`)
    })
  } catch (error) {
    console.error('Performance profiling failed', error)
    process.exitCode = 1
  } finally {
    await cleanupQrMenuFixtures(fixture)
    await prisma.$disconnect().catch(() => null)
  }
}

run()
