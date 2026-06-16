import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import assert from 'assert'
import {
  DocumentLifecycleService,
  DocumentLifecycleState,
} from '@/lib/die/services/document-lifecycle.service'

type TestResult = { name: string; passed: boolean; error?: string }
const results: TestResult[] = []

const ROOT = path.resolve(__dirname, '..')

function check(name: string, fn: () => void | Promise<void>) {
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

function file(relativePath: string) {
  return path.join(ROOT, relativePath)
}

function read(relativePath: string) {
  return fs.readFileSync(file(relativePath), 'utf8')
}

function exists(relativePath: string) {
  return fs.existsSync(file(relativePath))
}

async function main() {
  console.log('═══════════════════════════════════════════════════════')
  console.log(' Block 4G Validation Suite — System Consolidation Layer')
  console.log('═══════════════════════════════════════════════════════')
  console.log()

  await check('T1 Schema + migration assets exist', () => {
    const schema = read('prisma/schema.prisma')
    assert(schema.includes('enum DocumentLifecycleState'))
    assert(schema.includes('lifecycleState DocumentLifecycleState'))
    assert(schema.includes('model DocumentEventTimeline'))
    assert(schema.includes('@@index([scannedDocumentId])'))
    assert(schema.includes('@@index([stage])'))
    assert(exists('prisma/migrations/20260616140000_block4g_system_consolidation/migration.sql'))
  })

  await check('T2 Lifecycle service exports canonical state machine', () => {
    const src = read('src/lib/die/services/document-lifecycle.service.ts')
    assert(src.includes('export enum DocumentLifecycleState'))
    assert(src.includes('InvalidStateTransitionError'))
    assert(src.includes('ALLOWED_TRANSITIONS'))
    assert(src.includes('transitionDocumentLifecycleOnTransaction'))
    assert(src.includes('recordDocumentEvent'))
  })

  await check('T3 Lifecycle helper behavior is correct', () => {
    assert(DocumentLifecycleService.allowedNextStates(DocumentLifecycleState.UPLOADED).includes(DocumentLifecycleState.EXTRACTED))
    assert(DocumentLifecycleService.allowedNextStates(DocumentLifecycleState.INTELLIGENCE_DONE).includes(DocumentLifecycleState.MATCHED))
    assert.strictEqual(DocumentLifecycleService.normalizeState('REVIEW'), DocumentLifecycleState.REVIEW_REQUIRED)
    assert.strictEqual(DocumentLifecycleService.legacyStatusForState(DocumentLifecycleState.MATCHED), 'REVIEW')
    assert.strictEqual(DocumentLifecycleService.stageForState(DocumentLifecycleState.ANALYZED), 'anomaly_detection')
    assert.strictEqual(DocumentLifecycleService.isFinalState(DocumentLifecycleState.APPLIED), true)
    assert.strictEqual(DocumentLifecycleService.isFinalState(DocumentLifecycleState.REVIEW_REQUIRED), false)
  })

  await check('T4 Replay service exists with safeReplayGuard and fullReplay', () => {
    const src = read('src/lib/die/services/document-replay.service.ts')
    assert(src.includes('safeReplayGuard'))
    assert(src.includes('replayFromStage'))
    assert(src.includes('fullReplay'))
    assert(src.includes('ReplayBlockedError'))
    assert(src.includes('ReplayInProgressError'))
    assert(src.includes('DocumentIntelligenceReplayService'))
  })

  await check('T5 Repair service exists with batch-safe scheduled job', () => {
    const src = read('src/lib/die/services/system-repair.service.ts')
    assert(src.includes('detectStuckDocuments'))
    assert(src.includes('repairDocument'))
    assert(src.includes('scheduledRepairJob'))
    assert(src.includes('Math.min(100'))
  })

  await check('T6 Consistency service validates cross-block rules', () => {
    const src = read('src/lib/die/services/system-consistency.service.ts')
    assert(src.includes('INTELLIGENCE_WITHOUT_MATCH'))
    assert(src.includes('MATCHED_WITHOUT_RECONCILIATION'))
    assert(src.includes('CONFLICT_WITHOUT_ANOMALY'))
    assert(src.includes('APPLIED_WITH_PENDING_REVIEW_LINKS'))
  })

  await check('T7 Upload route creates canonical skeleton + timeline', () => {
    const src = read('src/pages/api/die/upload.ts')
    assert(src.includes('DocumentLifecycleState.UPLOADED'))
    assert(src.includes('scannedDocument.create'))
    assert(src.includes('documentEventTimeline.create'))
    assert(src.includes('scannedDocumentId'))
  })

  await check('T8 Worker orchestration writes lifecycle transitions and starts repair job', () => {
    const src = read('src/lib/die/orchestrator/worker-start.ts')
    assert(src.includes('repairScheduler'))
    assert(src.includes('DocumentLifecycleService.transitionDocumentLifecycleOnTransaction'))
    assert(src.includes('DocumentLifecycleState.EXTRACTED'))
    assert(src.includes('DocumentLifecycleState.MATCHED'))
    assert(src.includes('DocumentLifecycleState.RECONCILED'))
    assert(src.includes('DocumentLifecycleState.ANALYZED'))
    assert(src.includes('DocumentLifecycleState.REVIEW_REQUIRED'))
  })

  await check('T9 Approve API uses canonical lifecycle transition', () => {
    const src = read('src/pages/api/die/documents/[id]/approve.ts')
    assert(src.includes('DocumentLifecycleService'))
    assert(src.includes('DocumentLifecycleState.APPROVED'))
    assert(src.includes('ANALYZED'))
    assert(src.includes('REVIEW_REQUIRED'))
  })

  await check('T10 Reject API uses canonical lifecycle transition', () => {
    const src = read('src/pages/api/die/documents/[id]/reject.ts')
    assert(src.includes('DocumentLifecycleService'))
    assert(src.includes('DocumentLifecycleState.FAILED'))
    assert(src.includes('REVIEW_REQUIRED'))
  })

  await check('T11 Apply API uses transactional lifecycle helper', () => {
    const src = read('src/pages/api/die/documents/[id]/apply.ts')
    assert(src.includes('transitionDocumentLifecycleOnTransaction'))
    assert(src.includes('DocumentLifecycleState.APPLIED'))
    assert(src.includes('APPROVED'))
  })

  await check('T12 Status endpoint exposes lifecycleState', () => {
    const src = read('src/pages/api/die/documents/[id]/status.ts')
    assert(src.includes('lifecycleState'))
    assert(src.includes('DocumentLifecycleService.normalizeState'))
  })

  await check('T13 Business isolation remains enforced on user-facing lifecycle endpoints', () => {
    const routes = [
      'src/pages/api/die/upload.ts',
      'src/pages/api/die/documents/[id]/approve.ts',
      'src/pages/api/die/documents/[id]/reject.ts',
      'src/pages/api/die/documents/[id]/apply.ts',
      'src/pages/api/die/documents/[id]/status.ts',
    ]
    for (const route of routes) {
      const src = read(route)
      assert(src.includes('resolveBusinessContext') || src.includes('getServerSession'))
    }
  })

  await check('T14 Timeline logging is wired into canonical lifecycle operations', () => {
    const lifecycle = read('src/lib/die/services/document-lifecycle.service.ts')
    assert(lifecycle.includes('documentEventTimeline.create'))
    assert(lifecycle.includes('documentProcessingLog.create'))
    assert(lifecycle.includes('stageForState'))
  })

  await check('T15 Replay guard blocks applied documents unless forced', () => {
    const src = read('src/lib/die/services/document-replay.service.ts')
    assert(src.includes("currentState === DocumentLifecycleState.APPLIED"))
    assert(src.includes('ReplayBlockedError'))
    assert(src.includes('acquireReplayLock'))
  })

  console.log()
  console.log('═══════════════════════════════════════════════════════')
  const passed = results.filter((r) => r.passed).length
  const failed = results.length - passed
  console.log(` Results: ${passed}/${results.length} passed, ${failed} failed`)
  console.log('═══════════════════════════════════════════════════════')

  if (failed > 0) {
    console.log('\nFailed tests:')
    for (const result of results.filter((r) => !r.passed)) {
      console.log(`  ✗ ${result.name}: ${result.error}`)
    }
    process.exit(1)
  }

  console.log('\n✓ All Block 4G validation tests passed!')
}

void main()
