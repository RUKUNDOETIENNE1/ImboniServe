import { performance } from 'perf_hooks'
import { renderPluginPublicRoute, renderPluginDashboardRoute } from '@/lib/die/plugins/runtime/plugin-platform'
import { ensureQrMenuFixtures, cleanupQrMenuFixtures, QrMenuFixtureState } from './lib/qr-menu-fixtures'
import { prisma } from '@/lib/prisma'

process.on('warning', (w) => {
  if (w.name === 'DeprecationWarning') return
})

async function measure<T>(fn: () => Promise<T>): Promise<{ ms: number; value: T }> {
  const t0 = performance.now()
  const value = await fn()
  const t1 = performance.now()
  return { ms: t1 - t0, value }
}

async function run() {
  console.log('=== QR Menu Performance Validation ===')
  let state: QrMenuFixtureState | null = null
  try {
    state = await ensureQrMenuFixtures()
    const businessId = state.primaryBusinessId
    const menuId = state.menuId

    // Warm caches
    await renderPluginPublicRoute({ pathSegments: ['plugins', 'qr-menu', menuId], query: {}, businessId })
    await renderPluginDashboardRoute({ pathSegments: ['dashboard', 'die', 'plugins', 'qr-menu'], query: {}, businessId })

    // Measure N iterations
    const N = 7
    const publicTimings: number[] = []
    const dashboardTimings: number[] = []

    for (let i = 0; i < N; i++) {
      const pub = await measure(() =>
        renderPluginPublicRoute({ pathSegments: ['plugins', 'qr-menu', menuId], query: {}, businessId })
      )
      publicTimings.push(pub.ms)

      const dash = await measure(() =>
        renderPluginDashboardRoute({ pathSegments: ['dashboard', 'die', 'plugins', 'qr-menu'], query: {}, businessId })
      )
      dashboardTimings.push(dash.ms)
    }

    function stats(xs: number[]) {
      const sorted = [...xs].sort((a, b) => a - b)
      const sum = xs.reduce((a, b) => a + b, 0)
      const avg = sum / xs.length
      const p95 = sorted[Math.floor(0.95 * (sorted.length - 1))]
      const max = sorted[sorted.length - 1]
      return { avg, p95, max }
    }

    const pub = stats(publicTimings)
    const dash = stats(dashboardTimings)

    console.table([
      { metric: 'Public avg (ms)', value: pub.avg.toFixed(2) },
      { metric: 'Public p95 (ms)', value: pub.p95.toFixed(2) },
      { metric: 'Public max (ms)', value: pub.max.toFixed(2) },
      { metric: 'Dashboard avg (ms)', value: dash.avg.toFixed(2) },
      { metric: 'Dashboard p95 (ms)', value: dash.p95.toFixed(2) },
      { metric: 'Dashboard max (ms)', value: dash.max.toFixed(2) },
    ])

    const publicOk = pub.avg < 500 && pub.p95 < 500
    const dashboardOk = dash.avg < 1000 && dash.p95 < 1000

    if (!publicOk || !dashboardOk) {
      console.error('❌ Performance targets not met', {
        public: { avg: pub.avg, p95: pub.p95, max: pub.max },
        dashboard: { avg: dash.avg, p95: dash.p95, max: dash.max },
      })
      process.exit(1)
    }

    console.log('✅ Performance targets met')
  } finally {
    await cleanupQrMenuFixtures(state)
    await prisma.$disconnect().catch(() => {})
  }
}

run()
  .then(() => {
    console.log('=== VALIDATION COMPLETE ===')
    console.log('Exiting safely...')
    process.exit(0)
  })
  .catch((e) => {
    console.error('Performance validation failed', e)
    prisma.$disconnect().catch(() => {})
    process.exit(1)
  })
