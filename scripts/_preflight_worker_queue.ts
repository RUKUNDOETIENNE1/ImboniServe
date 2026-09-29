/**
 * Phase 6: Worker Pipeline Validation
 * Phase 7: Queue Health Audit
 *
 * Validates:
 * - All DIE service classes load without errors
 * - Worker modules import cleanly
 * - Redis / queue connectivity
 * - Queue health endpoint logic
 * - DLQ inspection utilities
 */
import 'dotenv/config'

let passCount = 0
let failCount = 0

function pass(label: string, detail = '') {
  passCount++
  console.log(`  [PASS] ${label}${detail ? ' — ' + detail : ''}`)
}
function fail(label: string, detail = '') {
  failCount++
  console.error(`  [FAIL] ${label}${detail ? ' — ' + detail : ''}`)
}
function check(label: string, ok: boolean, detail = '') {
  ok ? pass(label, detail) : fail(label, detail)
}

async function main() {
  console.log('='.repeat(70))
  console.log('PHASE 6: WORKER PIPELINE VALIDATION')
  console.log('='.repeat(70))
  console.log()

  // ── Service class imports ──────────────────────────────────────────────────
  try {
    const { DocumentAnomalyService } = await import('../src/lib/die/services/document-anomaly.service')
    check('DocumentAnomalyService — imports', typeof DocumentAnomalyService?.detectAnomalies === 'function')
    check('DocumentAnomalyService.detectAnomalies — static method', typeof DocumentAnomalyService.detectAnomalies === 'function')
  } catch (e: any) { fail('DocumentAnomalyService — import failed', e.message) }

  try {
    const { ProcurementReconciliationService } = await import('../src/lib/die/services/procurement-reconciliation.service')
    check('ProcurementReconciliationService — imports', typeof ProcurementReconciliationService?.reconcileDocument === 'function')
    check('ProcurementReconciliationService.reconcileDocument — static', typeof ProcurementReconciliationService.reconcileDocument === 'function')
  } catch (e: any) { fail('ProcurementReconciliationService — import failed', e.message) }

  try {
    const { SupplierMatchingService } = await import('../src/lib/die/services/supplier-matching.service')
    check('SupplierMatchingService — imports', typeof SupplierMatchingService?.resolveSupplier === 'function')
    check('SupplierMatchingService.bulkResolve — static', typeof SupplierMatchingService.bulkResolve === 'function')
  } catch (e: any) { fail('SupplierMatchingService — import failed', e.message) }

  try {
    const { ProductMatchingService } = await import('../src/lib/die/services/product-matching.service')
    check('ProductMatchingService — imports', ProductMatchingService != null)
    check('ProductMatchingService.resolveProduct — static', typeof ProductMatchingService.resolveProduct === 'function')
    check('ProductMatchingService.resolveAllProducts — static', typeof ProductMatchingService.resolveAllProducts === 'function')
  } catch (e: any) { fail('ProductMatchingService — import failed', e.message) }

  try {
    const { CostAnomalyService } = await import('../src/lib/services/cost-anomaly.service')
    check('CostAnomalyService — imports', typeof CostAnomalyService?.evaluateAndMaybeAlert === 'function')
    check('CostAnomalyService.isEnabled — static', typeof CostAnomalyService.isEnabled === 'function')
  } catch (e: any) { fail('CostAnomalyService — import failed', e.message) }

  // ── Provider gateway ────────────────────────────────────────────────────────
  try {
    const { buildProviderChain } = await import('../src/lib/die/provider/index')
    const chain = buildProviderChain()
    check('Provider chain — builds without error', Array.isArray(chain))
    check('Provider chain — has ≥1 provider', chain.length >= 1, `providers: ${chain.map((p: any) => p.name).join(', ')}`)
  } catch (e: any) { fail('Provider chain — build failed', e.message) }

  console.log()
  console.log('='.repeat(70))
  console.log('PHASE 7: QUEUE HEALTH AUDIT')
  console.log('='.repeat(70))
  console.log()

  // ── Queue module imports ────────────────────────────────────────────────────
  let queues: any = null
  try {
    queues = await import('../src/lib/die/queue/queues')
    check('Queue module — imports', true)
    check('extractQueue — instance', queues.extractQueue != null)
    check('extractDLQ — instance', queues.extractDLQ != null)
    check('intelligenceQueue — instance', queues.intelligenceQueue != null)
    check('intelligenceDLQ — instance', queues.intelligenceDLQ != null)
  } catch (e: any) {
    fail('Queue module — import failed', e.message)
  }

  if (queues) {
    // ── Redis connectivity ──────────────────────────────────────────────────
    try {
      const health = await queues.checkQueueHealth()
      check('Redis connectivity — ping', health.status === 'healthy', `status=${health.status}${health.error ? ', error=' + health.error : ''}`)
    } catch (e: any) { fail('Redis connectivity — ping threw', e.message) }

    // ── Queue counts (just verifying they're reachable) ─────────────────────
    try {
      const extractCounts = await queues.extractQueue.getJobCounts('waiting', 'active', 'failed', 'delayed')
      check('extractQueue — job counts reachable', true, `waiting=${extractCounts.waiting}, active=${extractCounts.active}, failed=${extractCounts.failed}`)
    } catch (e: any) { fail('extractQueue — job counts failed', e.message) }

    try {
      const intelCounts = await queues.intelligenceQueue.getJobCounts('waiting', 'active', 'failed', 'delayed')
      check('intelligenceQueue — job counts reachable', true, `waiting=${intelCounts.waiting}, active=${intelCounts.active}, failed=${intelCounts.failed}`)
    } catch (e: any) { fail('intelligenceQueue — job counts failed', e.message) }

    // ── Metrics tracking ────────────────────────────────────────────────────
    try {
      const extractMetrics = await queues.getQueueMetrics()
      check('extractQueue metrics — reachable', typeof extractMetrics.processed === 'number', JSON.stringify(extractMetrics))
    } catch (e: any) { fail('extractQueue metrics — failed', e.message) }

    try {
      const intelMetrics = await queues.getIntelligenceQueueMetrics()
      check('intelligenceQueue metrics — reachable', typeof intelMetrics.processed === 'number', JSON.stringify(intelMetrics))
    } catch (e: any) { fail('intelligenceQueue metrics — failed', e.message) }

    // ── DLQ inspection ──────────────────────────────────────────────────────
    try {
      const dlqJobs = await queues.getFailedJobs(10)
      check('extractDLQ — inspection', Array.isArray(dlqJobs), `${dlqJobs.length} failed jobs in DLQ`)
    } catch (e: any) { fail('extractDLQ — inspection failed', e.message) }

    try {
      const intelDlqJobs = await queues.getFailedIntelligenceJobs(10)
      check('intelligenceDLQ — inspection', Array.isArray(intelDlqJobs), `${intelDlqJobs.length} failed jobs in DLQ`)
    } catch (e: any) { fail('intelligenceDLQ — inspection failed', e.message) }

    // ── Job option defaults ─────────────────────────────────────────────────
    const extractOpts = queues.extractQueue.defaultJobOptions as any
    check('extractQueue — retry attempts = 3', extractOpts?.attempts === 3, `got ${extractOpts?.attempts}`)
    check('extractQueue — backoff type = exponential', extractOpts?.backoff?.type === 'exponential')

    const intelOpts = queues.intelligenceQueue.defaultJobOptions as any
    check('intelligenceQueue — retry attempts = 3', intelOpts?.attempts === 3, `got ${intelOpts?.attempts}`)
    check('intelligenceQueue — backoff type = exponential', intelOpts?.backoff?.type === 'exponential')
  }

  // ── Worker source checks ─────────────────────────────────────────────────
  // Read worker-start.ts (production entry point) — verifies all services wired in
  const path = await import('path')
  const __dirname_approx = path.resolve('src/lib/die/orchestrator')

  try {
    const fs = await import('fs')
    const workerSrc = fs.readFileSync(path.join(__dirname_approx, 'worker-start.ts'), 'utf-8')
    check('worker-start.ts — extract concurrency: 5', workerSrc.includes('concurrency: 5'))
    check('worker-start.ts — extract limiter: max 10/sec', workerSrc.includes('max: 10'))
    check('worker-start.ts — DLQ on extract failure', workerSrc.includes('extractDLQ'))
    check('worker-start.ts — enqueues intelligence job on extract complete', workerSrc.includes('intelligenceQueue.add'))
    check('worker-start.ts — intelligence concurrency: 3', workerSrc.includes('concurrency: 3'))
    check('worker-start.ts — DLQ on intel failure', workerSrc.includes('intelligenceDLQ'))
    check('worker-start.ts — anomaly detection wired', workerSrc.includes('DocumentAnomalyService'))
    check('worker-start.ts — reconciliation wired', workerSrc.includes('ProcurementReconciliationService'))
    check('worker-start.ts — supplier matching wired', workerSrc.includes('SupplierMatchingService'))
    check('worker-start.ts — product matching wired', workerSrc.includes('ProductMatchingService'))
  } catch (e: any) { fail('worker-start.ts — source check failed', e.message) }

  try {
    const fs = await import('fs')
    const intelSrc = fs.readFileSync(path.join(__dirname_approx, 'intelligence-worker.ts'), 'utf-8')
    check('intelligence-worker.ts (Block 4A/4B) — header field promotion present', intelSrc.includes('promoteHeaderFields'))
    check('intelligence-worker.ts (Block 4A/4B) — line item enrichment present', intelSrc.includes('enrichLineItems'))
    check('intelligence-worker.ts (Block 4A/4B) — confidence computation present', intelSrc.includes('computeOverallConfidence'))
    check('intelligence-worker.ts (Block 4A/4B) — DLQ on failure', intelSrc.includes('intelligenceDLQ'))
  } catch (e: any) { fail('intelligence-worker.ts — source check failed', e.message) }

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log()
  console.log('='.repeat(70))
  console.log(`PHASES 6+7 RESULT: ${passCount} passed, ${failCount} failed`)
  console.log('='.repeat(70))

  process.exit(failCount > 0 ? 1 : 0)
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1) })
