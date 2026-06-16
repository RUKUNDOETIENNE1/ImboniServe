/**
 * Phase 8: Performance Review
 * Phase 9: Security Review
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import * as path from 'path'
import * as fs from 'fs'

const prisma = new PrismaClient() as any

let passCount = 0
let failCount = 0
let warnCount = 0

function pass(label: string, detail = '') {
  passCount++
  console.log(`  [PASS] ${label}${detail ? ' — ' + detail : ''}`)
}
function fail(label: string, detail = '') {
  failCount++
  console.error(`  [FAIL] ${label}${detail ? ' — ' + detail : ''}`)
}
function warn(label: string, detail = '') {
  warnCount++
  console.warn(`  [WARN] ${label}${detail ? ' — ' + detail : ''}`)
}
function check(label: string, ok: boolean, detail = '') {
  ok ? pass(label, detail) : fail(label, detail)
}

// ============================================================================
// PHASE 8: PERFORMANCE REVIEW
// ============================================================================

async function phase8() {
  console.log()
  console.log('='.repeat(70))
  console.log('PHASE 8: PERFORMANCE REVIEW')
  console.log('='.repeat(70))
  console.log()

  // ── Index coverage on hot query paths ─────────────────────────────────────
  console.log('--- Database Index Coverage ---')
  const indexes: any[] = await prisma.$queryRaw`
    SELECT tablename, indexname
    FROM pg_indexes
    WHERE tablename IN (
      'ScannedDocument', 'ScanJob', 'AnomalyAlert',
      'ProcurementReconciliation', 'DocumentEntityLink',
      'SupplierAlias', 'ProductAlias', 'GoodsReceivedNoteItem',
      'DocumentProcessingLog'
    )
    ORDER BY tablename, indexname`

  const idxByTable: Record<string, string[]> = {}
  for (const idx of indexes) {
    if (!idxByTable[idx.tablename]) idxByTable[idx.tablename] = []
    idxByTable[idx.tablename].push(idx.indexname)
  }

  // Key index checks
  const hasIdx = (table: string, pattern: string) =>
    (idxByTable[table] ?? []).some(n => n.toLowerCase().includes(pattern.toLowerCase()))

  check('ScannedDocument — businessId index', hasIdx('ScannedDocument', 'business'))
  check('ScannedDocument — status index', hasIdx('ScannedDocument', 'status'))
  check('ScannedDocument — supplierId index', hasIdx('ScannedDocument', 'supplier'))
  check('AnomalyAlert — businessId+status index', hasIdx('AnomalyAlert', 'business'))
  check('AnomalyAlert — scannedDocumentId index', hasIdx('AnomalyAlert', 'scannedDocument') || hasIdx('AnomalyAlert', 'document'))
  check('ProcurementReconciliation — businessId index', hasIdx('ProcurementReconciliation', 'business'))
  check('ProcurementReconciliation — state index', hasIdx('ProcurementReconciliation', 'state'))
  check('DocumentEntityLink — unique composite index', hasIdx('DocumentEntityLink', 'key') || hasIdx('DocumentEntityLink', 'unique'))
  check('SupplierAlias — normalized index', hasIdx('SupplierAlias', 'normalized'))
  check('ProductAlias — normalized index', hasIdx('ProductAlias', 'normalized'))
  check('DocumentProcessingLog — scanJobId index', hasIdx('DocumentProcessingLog', 'scanJob') || hasIdx('DocumentProcessingLog', 'scan'))

  // ── DB latency baseline ────────────────────────────────────────────────────
  console.log()
  console.log('--- DB Latency Baseline ---')
  const trials = 5
  const latencies: number[] = []
  for (let i = 0; i < trials; i++) {
    const t0 = Date.now()
    await prisma.$queryRaw`SELECT 1`
    latencies.push(Date.now() - t0)
  }
  const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length
  const maxLatency = Math.max(...latencies)
  // 500ms threshold for remote Supabase pooler over internet (local would be <10ms)
  check('DB round-trip latency avg < 500ms (Supabase pooler)', avgLatency < 500, `avg=${avgLatency.toFixed(1)}ms max=${maxLatency}ms`)
  if (avgLatency >= 200 && avgLatency < 500) warn('DB latency 200-500ms — remote DB; acceptable for Supabase pooler on Railway', `avg=${avgLatency.toFixed(1)}ms`)

  // ── Service method microbenchmarks ────────────────────────────────────────
  console.log()
  console.log('--- Service Microbenchmarks ---')

  try {
    const { DocumentAnomalyService } = await import('../src/lib/die/services/document-anomaly.service')
    // detectAnomalies on a non-existent doc — services may throw OR return {success:false}
    const t0 = Date.now()
    let graceful = false
    try {
      const result = await DocumentAnomalyService.detectAnomalies('nonexistent-doc-id')
      graceful = !result.success
    } catch {
      // Throwing on missing document is also an acceptable behaviour (caller's responsibility)
      graceful = true
    }
    const dur = Date.now() - t0
    check('DocumentAnomalyService — handles missing doc in < 3000ms', dur < 3000, `${dur}ms`)
    check('DocumentAnomalyService — responds (throw or {success:false}) on missing doc', graceful)
  } catch (e: any) { fail('DocumentAnomalyService benchmark', e.message) }

  try {
    const { ProcurementReconciliationService } = await import('../src/lib/die/services/procurement-reconciliation.service')
    const t0 = Date.now()
    let graceful = false
    try {
      const result = await ProcurementReconciliationService.reconcileDocument('nonexistent-doc-id')
      graceful = !result.success
    } catch {
      graceful = true
    }
    const dur = Date.now() - t0
    check('ProcurementReconciliationService — handles missing doc in < 3000ms', dur < 3000, `${dur}ms`)
    check('ProcurementReconciliationService — responds (throw or {success:false}) on missing doc', graceful)
  } catch (e: any) { fail('ProcurementReconciliationService benchmark', e.message) }

  // ── Idempotency fingerprint uniqueness ────────────────────────────────────
  console.log()
  console.log('--- Idempotency Fingerprint Coverage ---')
  const dupFingerprints: any[] = await prisma.$queryRaw`
    SELECT fingerprint, COUNT(*) as cnt
    FROM "ProcurementReconciliation"
    GROUP BY fingerprint
    HAVING COUNT(*) > 1`
  check('ProcurementReconciliation — no duplicate fingerprints', dupFingerprints.length === 0,
    dupFingerprints.length > 0 ? `${dupFingerprints.length} duplicates` : 'all unique')

  // ── Worker throughput config ───────────────────────────────────────────────
  console.log()
  console.log('--- Worker Throughput Configuration ---')
  const workerSrc = fs.readFileSync(path.resolve('src/lib/die/orchestrator/worker-start.ts'), 'utf-8')
  check('Extract worker concurrency = 5', workerSrc.includes('concurrency: 5'))
  check('Extract worker rate limiter 10/sec', workerSrc.includes('max: 10'))
  check('Intelligence worker concurrency = 3', workerSrc.includes('concurrency: 3'))
  check('Intelligence worker rate limiter 5/sec', workerSrc.includes('max: 5'))
}

// ============================================================================
// PHASE 9: SECURITY REVIEW
// ============================================================================

async function phase9() {
  console.log()
  console.log('='.repeat(70))
  console.log('PHASE 9: SECURITY REVIEW')
  console.log('='.repeat(70))
  console.log()

  // ── Environment variable security ─────────────────────────────────────────
  console.log('--- Environment Variables ---')

  const envPath = path.resolve('.env')
  const envExamplePath = path.resolve('.env.example')

  // .env should NOT be in git (checked by .gitignore)
  const gitignorePath = path.resolve('.gitignore')
  if (fs.existsSync(gitignorePath)) {
    const gitignore = fs.readFileSync(gitignorePath, 'utf-8')
    check('.env in .gitignore', gitignore.includes('.env'))
  } else {
    fail('.gitignore — not found')
  }

  // .env should exist locally
  check('.env file exists', fs.existsSync(envPath))

  // .env.example should exist (for documentation)
  check('.env.example exists', fs.existsSync(envExamplePath))

  // Required env vars are set
  const requiredEnvVars = [
    'DATABASE_URL',
    'REDIS_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
  ]
  for (const v of requiredEnvVars) {
    check(`${v} — set`, !!process.env[v], process.env[v] ? 'present' : 'MISSING')
  }

  // Secrets should not be empty or default values
  const nextauthSecret = process.env.NEXTAUTH_SECRET ?? ''
  check('NEXTAUTH_SECRET — not placeholder', !['changeme', 'secret', 'your-secret'].includes(nextauthSecret.toLowerCase()))
  check('NEXTAUTH_SECRET — length >= 32', nextauthSecret.length >= 32, `length=${nextauthSecret.length}`)

  // ── Service file security checks ─────────────────────────────────────────
  console.log()
  console.log('--- Service Security Checks ---')

  const serviceDir = path.resolve('src/lib/die/services')
  const serviceFiles = fs.readdirSync(serviceDir).filter(f => f.endsWith('.ts'))

  for (const file of serviceFiles) {
    const src = fs.readFileSync(path.join(serviceDir, file), 'utf-8')
    // No hardcoded secrets
    const hasSecret = /api[_-]?key\s*=\s*["'][^"']{10,}["']/i.test(src) ||
                      /password\s*=\s*["'][^"']{5,}["']/i.test(src)
    check(`${file} — no hardcoded secrets`, !hasSecret)
    // No eval/Function constructor
    const hasEval = /\beval\s*\(|\bnew\s+Function\s*\(/.test(src)
    check(`${file} — no eval/Function`, !hasEval)
  }

  // ── API route security checks ─────────────────────────────────────────────
  console.log()
  console.log('--- API Route Security ---')

  const dieApiDir = path.resolve('src/pages/api/die')
  if (fs.existsSync(dieApiDir)) {
    const apiFiles = fs.readdirSync(dieApiDir, { recursive: true })
      .filter((f: any) => typeof f === 'string' && f.endsWith('.ts'))
    check(`DIE API routes found (${apiFiles.length})`, apiFiles.length > 0)
    for (const file of apiFiles.slice(0, 10)) {
      const src = fs.readFileSync(path.join(dieApiDir, file as string), 'utf-8')
      // Routes should require authentication (check for session/auth check)
      const hasAuthCheck = /getServerSession|getSession|auth\(|requireAuth|session\s*=/.test(src)
      check(`api/die/${file} — auth guard present`, hasAuthCheck)
    }
  } else {
    warn('DIE API directory not found — may be under different path')
  }

  // ── SQL injection protection ───────────────────────────────────────────────
  console.log()
  console.log('--- SQL Injection Protection ---')
  // Check that raw queries use parameterized form (template literals with prisma.$queryRaw)
  const allServiceSrc = serviceFiles.map(f =>
    fs.readFileSync(path.join(serviceDir, f), 'utf-8')
  ).join('\n')

  // Should not have string concatenation into raw SQL
  const hasSqlConcatenation = /\$queryRawUnsafe[^`]*\+/.test(allServiceSrc)
  check('Service files — no string concatenation in raw SQL', !hasSqlConcatenation)

  // ── Queue security ────────────────────────────────────────────────────────
  console.log()
  console.log('--- Queue Security ---')
  const queueSrc = fs.readFileSync(path.resolve('src/lib/die/queue/queues.ts'), 'utf-8')
  check('Queue — TLS enabled for Redis', queueSrc.includes('tls:'))
  check('Queue — rejectUnauthorized: false (Upstash self-signed)', queueSrc.includes('rejectUnauthorized: false'))

  // ── Rate limiting check ───────────────────────────────────────────────────
  console.log()
  console.log('--- Rate Limiting ---')
  const workerSrc = fs.readFileSync(path.resolve('src/lib/die/orchestrator/worker-start.ts'), 'utf-8')
  check('Worker — rate limiter configured', workerSrc.includes('limiter:'))
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  await phase8()
  await phase9()

  await prisma.$disconnect()

  console.log()
  console.log('='.repeat(70))
  console.log(`PHASES 8+9 RESULT: ${passCount} passed, ${failCount} failed, ${warnCount} warnings`)
  console.log('='.repeat(70))

  process.exit(failCount > 0 ? 1 : 0)
}

main().catch(async e => {
  console.error('Fatal error:', e.message)
  await prisma.$disconnect()
  process.exit(1)
})
