import assert from 'node:assert/strict'
import { performance } from 'node:perf_hooks'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import type { DIEPlugin } from '@/lib/die/plugins/core/plugin-types'
import type { DIEPluginManifest } from '@/lib/die/plugins/core/plugin-manifest'
import { pluginRunner } from '@/lib/die/plugins/runtime/plugin-runner'
import {
  renderPluginPublicRoute,
  renderPluginDashboardRoute,
  type PluginRouteRenderOutcome,
} from '@/lib/die/plugins/runtime/plugin-platform'
import type { QRMenuDashboardPayload, QRMenuPublicPayload } from '@/lib/die/plugins/built-in/qr-menu.plugin'
import { ensureQrMenuFixtures, cleanupQrMenuFixtures, type QrMenuFixtureState } from './lib/qr-menu-fixtures'

type TestResult = {
  id: number
  name: string
  passed: boolean
  duration: number
  error?: string
}

const results: TestResult[] = []
let fixture: QrMenuFixtureState | null = null
let publicOutcome: PluginRouteRenderOutcome | null = null
let dashboardOutcome: PluginRouteRenderOutcome | null = null

async function ensureFixtures(): Promise<QrMenuFixtureState> {
  try {
    return await ensureQrMenuFixtures()
  } catch (error) {
    if (error instanceof Prisma.PrismaClientInitializationError) {
      throw new Error(
        'Failed to connect to database. Ensure Supabase connection is available before running validation.'
      )
    }
    throw error
  }
}

async function runTest(id: number, name: string, fn: () => Promise<void>) {
  const start = performance.now()
  try {
    await fn()
    const duration = Math.round(performance.now() - start)
    results.push({ id, name, passed: true, duration })
    console.log(`✓ [${id.toString().padStart(2, '0')}] ${name} (${duration}ms)`)
  } catch (error) {
    const duration = Math.round(performance.now() - start)
    const message = error instanceof Error ? error.message : String(error)
    results.push({ id, name, passed: false, duration, error: message })
    console.error(`✗ [${id.toString().padStart(2, '0')}] ${name} (${duration}ms)\n  Error: ${message}`)
  }
}

async function run() {
  console.log('\n=== DIE Plugin Platform Validation Suite ===\n')
  fixture = await ensureFixtures()

  const registry = pluginRunner.getRegistry()
  const qrMenuPlugin = registry.get('qr-menu')
  if (!qrMenuPlugin) {
    throw new Error('QR Menu plugin not registered. Cannot continue.')
  }

  await runTest(1, 'Registry loads successfully', async () => {
    assert.ok(registry, 'Registry unavailable')
    const plugins = registry.list()
    assert.ok(Array.isArray(plugins), 'Registry list did not return an array')
  })

  await runTest(2, 'QR Menu plugin registered', async () => {
    const plugin = registry.get('qr-menu')
    assert.ok(plugin, 'QR Menu plugin missing from registry')
  })

  await runTest(3, 'Manifest loads', async () => {
    const manifest = qrMenuPlugin.manifest
    assert.ok(manifest, 'Manifest missing on plugin')
    assert.ok(manifest.routes.public?.length, 'Manifest missing public routes')
  })

  await runTest(4, 'Manifest metadata accessible', async () => {
    assert.ok(qrMenuPlugin.manifest.metadata, 'Manifest metadata not defined')
  })

  await runTest(5, 'Public route resolution', async () => {
    const match = registry.resolveRoute('public', ['plugins', 'qr-menu', fixture!.menuId])
    assert.ok(match, 'Public route did not resolve')
    assert.strictEqual(match?.params.menuId, fixture!.menuId, 'Resolved params mismatch')
  })

  await runTest(6, 'Dashboard route resolution', async () => {
    const match = registry.resolveRoute('dashboard', ['dashboard', 'die', 'plugins', 'qr-menu'])
    assert.ok(match, 'Dashboard route did not resolve')
    assert.strictEqual(match?.plugin.id, 'qr-menu')
  })

  await runTest(7, 'Invalid route fails safely', async () => {
    const match = registry.resolveRoute('public', ['plugins', 'qr-menu', fixture!.menuId, 'extra'])
    assert.ok(!match, 'Invalid route should not resolve')
  })

  await runTest(8, 'Public render returns valid outcome', async () => {
    const outcome = await renderPluginPublicRoute({
      pathSegments: ['plugins', 'qr-menu', fixture!.menuId],
      query: {},
      locale: 'en',
      businessId: fixture!.primaryBusinessId,
    })
    assert.ok(outcome.kind === 'props', 'Public render did not return props outcome')
    assert.ok(outcome.plugin.id === 'qr-menu', 'Outcome plugin mismatch')
    publicOutcome = outcome
  })

  await runTest(9, 'Dashboard render returns valid outcome', async () => {
    const outcome = await renderPluginDashboardRoute({
      pathSegments: ['dashboard', 'die', 'plugins', 'qr-menu'],
      query: {},
      locale: 'en',
      businessId: fixture!.primaryBusinessId,
    })
    assert.ok(outcome.kind === 'props', 'Dashboard render did not return props outcome')
    dashboardOutcome = outcome
  })

  await runTest(10, 'Render typing verified', async () => {
    assert.ok(publicOutcome && publicOutcome.kind === 'props', 'Public outcome missing')
    const publicDataWrapper = publicOutcome.props as { data: QRMenuPublicPayload }
    const publicPayload: QRMenuPublicPayload = publicDataWrapper.data
    assert.strictEqual(publicPayload.menuId, fixture!.menuId)

    assert.ok(dashboardOutcome && dashboardOutcome.kind === 'props', 'Dashboard outcome missing')
    const dashboardDataWrapper = dashboardOutcome.props as { data: QRMenuDashboardPayload }
    const dashboardPayload: QRMenuDashboardPayload = dashboardDataWrapper.data
    assert.ok(Array.isArray(dashboardPayload.menus), 'Dashboard payload menus not array')
  })

  await runTest(11, 'Business context enforcement verified', async () => {
    const outcome = await renderPluginDashboardRoute({
      pathSegments: ['dashboard', 'die', 'plugins', 'qr-menu'],
      query: {},
      locale: 'en',
      businessId: null,
    })
    assert.ok(outcome.kind === 'notFound', 'Dashboard render should require business context')
  })

  await runTest(12, 'Cross-business access prevention verified', async () => {
    const outcome = await renderPluginDashboardRoute({
      pathSegments: ['dashboard', 'die', 'plugins', 'qr-menu'],
      query: {},
      locale: 'en',
      businessId: fixture!.secondaryBusinessId,
    })
    assert.ok(outcome.kind === 'props', 'Cross-business outcome should still render safely')
    const dashboardDataWrapper = outcome.props as { data: QRMenuDashboardPayload }
    const payload: QRMenuDashboardPayload = dashboardDataWrapper.data
    assert.strictEqual(payload.summary.totalMenus, 0, 'Cross-business render exposed foreign data')
    assert.strictEqual(payload.menus.length, 0, 'Cross-business render returned menus for another tenant')
  })

  await runTest(13, 'Manifest typing verified', async () => {
    const manifest: DIEPluginManifest = qrMenuPlugin.manifest
    assert.ok(Array.isArray(manifest.routes.public), 'Manifest public routes not array')
  })

  await runTest(14, 'Registry typing verified', async () => {
    const plugins: DIEPlugin[] = registry.list()
    const ids = plugins.map((plugin) => plugin.id)
    assert.ok(ids.includes('qr-menu'), 'Registry typing failed to include qr-menu id')
  })

  await runTest(15, 'QR Menu backward compatibility verified', async () => {
    assert.ok(publicOutcome && publicOutcome.kind === 'props', 'Public outcome missing for compatibility test')
    const payload = (publicOutcome.props as { data: QRMenuPublicPayload }).data
    assert.ok(
      payload.publicUrl.endsWith(`/plugins/qr-menu/${fixture!.menuId}`),
      'Public URL no longer matches legacy path structure',
    )
  })

  console.log('\n=== Summary ===')
  const passed = results.filter((result) => result.passed).length
  const failed = results.length - passed
  console.log(`Total: ${results.length}`)
  console.log(`Passed: ${passed}`)
  console.log(`Failed: ${failed}`)

  if (failed > 0) {
    console.log('\nFailures:')
    for (const result of results.filter((res) => !res.passed)) {
      console.log(`- [${result.id.toString().padStart(2, '0')}] ${result.name}: ${result.error}`)
    }
    process.exitCode = 1
  } else {
    console.log('\n✅ Validation PASSED')
  }
}

run()
  .catch((error) => {
    console.error('\nValidation suite encountered an unrecoverable error', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await cleanupQrMenuFixtures(fixture)
    await prisma.$disconnect().catch(() => null)
  })
