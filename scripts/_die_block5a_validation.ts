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
  console.log(' Block 5A Validation Suite — Operational Monitoring Dashboard')
  console.log('════════════════════════════════════════════════════════════')
  console.log()

  // T1: Operations page exists + auth guard
  await check('T1 Operations dashboard page exists + uses DashboardLayout + SSR auth', () => {
    const p = 'src/pages/dashboard/die/operations.tsx'
    assert(exists(p), 'operations.tsx not found')
    const src = read(p)
    requirePatterns(src, ['DashboardLayout', 'getServerSideProps', "destination: '/login'"])
  })

  // T2: Operations page uses operations endpoints
  await check('T2 Operations dashboard loads from operations endpoints', () => {
    const src = read('src/pages/dashboard/die/operations.tsx')
    requirePatterns(src, [
      '/api/die/operations/health',
      '/api/die/operations/queues',
      '/api/die/operations/failed-jobs',
      '/api/die/operations/stuck-documents',
      '/api/die/operations/repair',
      '/api/die/operations/replay',
      '/api/die/operations/consistency',
    ])
  })

  // T3: SSE stream is consumed
  await check('T3 Operations dashboard consumes SSE stream', () => {
    const src = read('src/pages/dashboard/die/operations.tsx')
    requirePatterns(src, ['new EventSource', '/api/die/events/stream'])
  })

  // T4: Operations endpoints exist
  await check('T4 Operations API endpoints exist', () => {
    const endpoints = [
      'src/pages/api/die/operations/health.ts',
      'src/pages/api/die/operations/queues.ts',
      'src/pages/api/die/operations/failed-jobs.ts',
      'src/pages/api/die/operations/stuck-documents.ts',
      'src/pages/api/die/operations/repair.ts',
      'src/pages/api/die/operations/replay.ts',
      'src/pages/api/die/operations/consistency.ts',
    ]
    for (const p of endpoints) assert(exists(p), `${p} missing`)
  })

  // T5: All operations endpoints use resolveBusinessContext
  await check('T5 Operations endpoints enforce resolveBusinessContext', () => {
    const endpoints = [
      'health.ts',
      'queues.ts',
      'failed-jobs.ts',
      'stuck-documents.ts',
      'repair.ts',
      'replay.ts',
      'consistency.ts',
    ]
    for (const f of endpoints) {
      const src = read(`src/pages/api/die/operations/${f}`)
      requirePatterns(src, ['resolveBusinessContext', 'const ctx = await resolveBusinessContext'])
    }
  })

  // T6: Health endpoint filters processing logs by business
  await check('T6 Health endpoint filters DocumentProcessingLog by scanJob.businessId', () => {
    const src = read('src/pages/api/die/operations/health.ts')
    requirePatterns(src, ['documentProcessingLog', 'scanJob: { businessId: ctx.businessId }'])
  })

  // T7: SSE endpoint enforces business isolation
  await check('T7 SSE endpoint uses resolveBusinessContext + filters logs by scanJob.businessId', () => {
    const src = read('src/pages/api/die/events/stream.ts')
    requirePatterns(src, ['resolveBusinessContext', "where: { scanJob: { businessId } }"]) 
    requirePatterns(src, ['text/event-stream', 'res.write', 'setInterval'])
  })

  // T8: Failed jobs retry does not enqueue intelligence directly (uses replay) and does not re-add intelligence queue
  await check('T8 Failed jobs retry is safe: extraction re-enqueue idempotent; intelligence uses replay', () => {
    const src = read('src/pages/api/die/operations/failed-jobs.ts')
    requirePatterns(src, ['extractQueue.add', 'jobId: scanJobId', 'DocumentReplayService.replayFromStage'])
    assert(!src.includes('intelligenceQueue.add'), 'Should not enqueue intelligenceQueue directly from operations retry')
  })

  // T9: Repair endpoint uses SystemRepairService and business isolation
  await check('T9 Repair endpoint uses SystemRepairService and checks businessId', () => {
    const src = read('src/pages/api/die/operations/repair.ts')
    requirePatterns(src, ['SystemRepairService.repairDocument', 'doc.businessId !== ctx.businessId'])
  })

  // T10: Replay endpoint uses DocumentReplayService and checks businessId
  await check('T10 Replay endpoint uses DocumentReplayService and checks businessId', () => {
    const src = read('src/pages/api/die/operations/replay.ts')
    requirePatterns(src, ['DocumentReplayService', 'doc.businessId !== ctx.businessId'])
  })

  // T11: Stuck documents endpoint uses business-scoped detection
  await check('T11 Stuck documents endpoint uses business-scoped detection', () => {
    const src = read('src/pages/api/die/operations/stuck-documents.ts')
    requirePatterns(src, ['detectStuckDocumentsForBusiness', 'ctx.businessId'])
  })

  // T12: SystemRepairService provides business-scoped detection method
  await check('T12 SystemRepairService exports detectStuckDocumentsForBusiness', () => {
    const src = read('src/lib/die/services/system-repair.service.ts')
    requirePatterns(src, ['detectStuckDocumentsForBusiness', 'businessId'])
  })

  // T13: Queue metrics endpoint is business-scoped (no extractQueue.getJobCounts / intelligenceQueue.getJobCounts)
  await check('T13 Queue metrics endpoint avoids global BullMQ counts', () => {
    const src = read('src/pages/api/die/operations/queues.ts')
    assert(!src.includes('getJobCounts'), 'Should not use BullMQ getJobCounts (global)')
    requirePatterns(src, ['scanJob.count', 'scannedDocument.count'])
  })

  // T14: Operations dashboard uses ConfirmModal for repair/replay confirmations
  await check('T14 Operations dashboard uses ConfirmModal for repair/replay confirmation', () => {
    const src = read('src/pages/dashboard/die/operations.tsx')
    requirePatterns(src, ['ConfirmModal', 'Repair Document', 'Replay Document'])
  })

  // T15: End-to-end workflow wiring (UI actions call the correct endpoints)
  await check('T15 End-to-end ops workflow: UI actions call repair/replay/retry endpoints', () => {
    const src = read('src/pages/dashboard/die/operations.tsx')
    requirePatterns(src, [
      "fetch('/api/die/operations/repair'",
      "fetch('/api/die/operations/replay'",
      "fetch('/api/die/operations/failed-jobs'",
    ])
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
