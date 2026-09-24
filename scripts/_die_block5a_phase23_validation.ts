import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import assert from 'assert'

type TestResult = { name: string; passed: boolean; error?: string }
const results: TestResult[] = []

const ROOT = path.resolve(__dirname, '..')

function file(relativePath: string) {
  return path.join(ROOT, relativePath)
}

function read(relativePath: string) {
  return fs.readFileSync(file(relativePath), 'utf8')
}

function exists(relativePath: string) {
  return fs.existsSync(file(relativePath))
}

async function check(name: string, fn: () => void | Promise<void>) {
  return Promise.resolve()
    .then(fn)
    .then(() => {
      results.push({ name, passed: true })
      console.log(`✓ ${name}`)
    })
    .catch((error: any) => {
      results.push({ name, passed: false, error: error?.message || String(error) })
      console.error(`✗ ${name}: ${error?.message || String(error)}`)
    })
}

function requirePatterns(src: string, patterns: string[]) {
  for (const p of patterns) {
    assert(src.includes(p), `Missing pattern: ${p}`)
  }
}

async function main() {
  console.log('════════════════════════════════════════════════════════════')
  console.log(' Block 5A Phase 2+3 Validation Suite — DIE UI Layer Complete')
  console.log('════════════════════════════════════════════════════════════')
  console.log()

  // 1. Lifecycle component rendering
  await check('V1 DocumentLifecycle component exists and supports responsive + dark mode', () => {
    const p = 'src/components/die/DocumentLifecycle.tsx'
    assert(exists(p), 'DocumentLifecycle.tsx missing')
    const src = read(p)
    requirePatterns(src, ['md:hidden', 'hidden md:flex', 'dark:'])
  })

  // 2. Timeline rendering
  await check('V2 DocumentTimeline component exists with filtering + expandable details', () => {
    const p = 'src/components/die/DocumentTimeline.tsx'
    assert(exists(p), 'DocumentTimeline.tsx missing')
    const src = read(p)
    requirePatterns(src, ['Filters', 'setOpen', 'pre className'])
  })

  // 3. Review workspace integration
  await check('V3 Review workspace integrates lifecycle + timeline + summaries', () => {
    const p = 'src/pages/dashboard/die/review/[id].tsx'
    assert(exists(p), 'review/[id].tsx missing')
    const src = read(p)
    requirePatterns(src, ['DocumentLifecycle', 'DocumentTimeline', 'Reconciliation Summary', 'Anomaly Summary', 'Entity Link Summary'])
  })

  // 4. Bulk selection present
  await check('V4 DIE index includes bulk selection state + row checkboxes', () => {
    const src = read('src/pages/dashboard/die/index.tsx')
    requirePatterns(src, ['selectedIds', 'toggleSelectPage', 'type="checkbox"'])
  })

  // 5. Bulk approval wired
  await check('V5 Bulk approve calls approve endpoint', () => {
    const src = read('src/pages/dashboard/die/index.tsx')
    requirePatterns(src, ['bulkAction === \'approve\'', '/api/die/documents/${id}/approve'])
  })

  // 6. Bulk rejection wired
  await check('V6 Bulk reject calls reject endpoint and captures reason', () => {
    const src = read('src/pages/dashboard/die/index.tsx')
    requirePatterns(src, ['bulkAction === \'reject\'', 'bulkRejectReason', '/api/die/documents/${id}/reject'])
  })

  // 7. Bulk replay wired
  await check('V7 Bulk replay calls operations replay endpoint', () => {
    const src = read('src/pages/dashboard/die/index.tsx')
    requirePatterns(src, ['bulkAction === \'replay\'', "/api/die/operations/replay"]) 
  })

  // 8. Bulk repair wired
  await check('V8 Bulk repair calls operations repair endpoint', () => {
    const src = read('src/pages/dashboard/die/index.tsx')
    requirePatterns(src, ['bulkAction === \'repair\'', "/api/die/operations/repair"]) 
  })

  // 9. Operations metrics
  await check('V9 Operations metrics endpoint exists and operations page consumes it', () => {
    assert(exists('src/pages/api/die/operations/metrics.ts'), 'operations/metrics.ts missing')
    const src = read('src/pages/dashboard/die/operations.tsx')
    requirePatterns(src, ['/api/die/operations/metrics', 'Operational Metrics', 'lifecycleDistribution'])
  })

  // 10. Overview metrics + page
  await check('V10 Executive overview page exists and uses overview metrics endpoint', () => {
    assert(exists('src/pages/dashboard/die/overview.tsx'), 'overview.tsx missing')
    assert(exists('src/pages/api/die/overview/metrics.ts'), 'overview metrics API missing')
    const src = read('src/pages/dashboard/die/overview.tsx')
    requirePatterns(src, ['/api/die/overview/metrics', 'Executive Overview', 'DIETrendChart'])
  })

  // 11. Business isolation
  await check('V11 New APIs enforce resolveBusinessContext', () => {
    const ops = read('src/pages/api/die/operations/metrics.ts')
    const ov = read('src/pages/api/die/overview/metrics.ts')
    requirePatterns(ops, ['resolveBusinessContext', 'ctx.businessId'])
    requirePatterns(ov, ['resolveBusinessContext', 'ctx.businessId'])
  })

  // 12. SSE updates include opsMetrics
  await check('V12 SSE stream includes opsMetrics payload', () => {
    const src = read('src/pages/api/die/events/stream.ts')
    requirePatterns(src, ['resolveBusinessContext', 'opsMetrics', 'lifecycleDistribution', 'repairMetrics'])
  })

  // 13. Audit logging
  await check('V13 Audit logging present via DocumentEventTimeline and processing logs', () => {
    const approve = read('src/pages/api/die/documents/[id]/approve.ts')
    const reject = read('src/pages/api/die/documents/[id]/reject.ts')
    requirePatterns(approve, ['transitionDocumentLifecycle', 'stage: \'approval\''])
    requirePatterns(reject, ['transitionDocumentLifecycle', 'stage: \'rejection\''])
    const repair = read('src/lib/die/services/system-repair.service.ts')
    requirePatterns(repair, ['stage: \'repair\''])
  })

  // 14. Authorization
  await check('V14 New pages are protected by SSR session check', () => {
    const ops = read('src/pages/dashboard/die/operations.tsx')
    const ov = read('src/pages/dashboard/die/overview.tsx')
    requirePatterns(ops, ['getServerSideProps', "destination: '/login'"])
    requirePatterns(ov, ['getServerSideProps', "destination: '/login'"])
  })

  // 15. Responsive rendering markers
  await check('V15 UI layer includes responsive layout markers', () => {
    const lifecycle = read('src/components/die/DocumentLifecycle.tsx')
    const review = read('src/pages/dashboard/die/review/[id].tsx')
    requirePatterns(lifecycle, ['md:hidden', 'hidden md:flex'])
    requirePatterns(review, ['grid grid-cols-1 lg:grid-cols-2'])
  })

  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length

  console.log()
  console.log('---------------------------------------------')
  console.log(`Passed: ${passed}/${results.length}`)
  console.log(`Failed: ${failed}/${results.length}`)
  console.log('---------------------------------------------')

  if (failed > 0) process.exit(1)
}

main().catch((err) => {
  console.error('Fatal validation error:', err)
  process.exit(1)
})
