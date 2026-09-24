/**
 * Pre-flight DB Verification (Phase 4) + Data Integrity Audit (Phase 5)
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient() as any

let passCount = 0
let failCount = 0

function check(label: string, ok: boolean, detail = ''): boolean {
  if (ok) {
    passCount++
    console.log(`  [PASS] ${label}${detail ? ' — ' + detail : ''}`)
  } else {
    failCount++
    console.error(`  [FAIL] ${label}${detail ? ' — ' + detail : ''}`)
  }
  return ok
}

async function main() {
  console.log('='.repeat(70))
  console.log('PHASE 4: DATABASE VERIFICATION')
  console.log('='.repeat(70))
  console.log()

  // ── ScannedDocument ─────────────────────────────────────────────────────
  const sdCols: any[] = await prisma.$queryRaw`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'ScannedDocument' ORDER BY ordinal_position`
  const sdNames = sdCols.map((c: any) => c.column_name)
  console.log('--- ScannedDocument ---')
  for (const col of ['reconciliationStatus', 'confidenceScore', 'supplierId', 'invoiceNumber', 'totalCents', 'status', 'businessId']) {
    check(`ScannedDocument.${col}`, sdNames.includes(col))
  }

  // ── ProcurementReconciliation ────────────────────────────────────────────
  const prCols: any[] = await prisma.$queryRaw`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'ProcurementReconciliation'`
  const prNames = prCols.map((c: any) => c.column_name)
  console.log()
  console.log('--- ProcurementReconciliation ---')
  for (const col of ['id', 'businessId', 'matchType', 'state', 'confidence', 'fingerprint', 'scannedDocumentId']) {
    check(`ProcurementReconciliation.${col}`, prNames.includes(col))
  }

  // ── AnomalyAlert ─────────────────────────────────────────────────────────
  const aaCols: any[] = await prisma.$queryRaw`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'AnomalyAlert'`
  const aaNames = aaCols.map((c: any) => c.column_name)
  console.log()
  console.log('--- AnomalyAlert ---')
  for (const col of ['id', 'businessId', 'scannedDocumentId', 'type', 'severity', 'title', 'details', 'confidence', 'status']) {
    check(`AnomalyAlert.${col}`, aaNames.includes(col))
  }
  // 'metadata' is named 'details' in this schema — confirm it
  check('AnomalyAlert.details (mapped from "metadata")', aaNames.includes('details'))

  // ── DocumentEntityLink ────────────────────────────────────────────────────
  const delIdx: any[] = await prisma.$queryRaw`
    SELECT indexname FROM pg_indexes WHERE tablename = 'DocumentEntityLink' ORDER BY indexname`
  const idxNames = delIdx.map((i: any) => i.indexname)
  console.log()
  console.log('--- DocumentEntityLink indexes ---')
  check('unique index (scannedDocumentId, entityType, entityId)', idxNames.includes('DocumentEntityLink_scannedDocumentId_entityType_entityId_key'))
  check('lookup index (entityType, entityId)', idxNames.includes('DocumentEntityLink_entityType_entityId_idx'))

  // ── ScanJob ───────────────────────────────────────────────────────────────
  const sjCols: any[] = await prisma.$queryRaw`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'ScanJob'`
  const sjNames = sjCols.map((c: any) => c.column_name)
  console.log()
  console.log('--- ScanJob ---')
  for (const col of ['id', 'businessId', 'createdByUserId', 'sourceFileKey', 'sourceMime', 'sourceHash', 'status', 'documentType']) {
    check(`ScanJob.${col}`, sjNames.includes(col))
  }

  // ── CostAnomalyAlert ──────────────────────────────────────────────────────
  const caExists: any[] = await prisma.$queryRaw`
    SELECT EXISTS(
      SELECT 1 FROM information_schema.tables WHERE table_name = 'CostAnomalyAlert'
    ) as exists`
  console.log()
  check('CostAnomalyAlert table exists', caExists[0].exists,
    caExists[0].exists ? '' : 'Run scripts/_apply_cost_anomaly_alert.ts')

  // ── Migration history ─────────────────────────────────────────────────────
  const migs: any[] = await prisma.$queryRaw`
    SELECT migration_name,
           CASE WHEN finished_at IS NULL THEN 'PENDING' ELSE 'OK' END as st
    FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 15`
  console.log()
  console.log('--- Recent Migrations (last 15) ---')
  for (const m of migs) {
    check(`migration: ${m.migration_name}`, m.st === 'OK')
  }

  console.log()
  console.log('='.repeat(70))
  console.log('PHASE 5: DATA INTEGRITY AUDIT')
  console.log('='.repeat(70))
  console.log()

  // ── Duplicate checks ──────────────────────────────────────────────────────
  const dupLinks: any[] = await prisma.$queryRaw`
    SELECT "scannedDocumentId", "entityType", "entityId", COUNT(*) as cnt
    FROM "DocumentEntityLink"
    GROUP BY "scannedDocumentId", "entityType", "entityId"
    HAVING COUNT(*) > 1 LIMIT 10`
  check('DocumentEntityLink — no duplicates', dupLinks.length === 0,
    dupLinks.length > 0 ? `${dupLinks.length} duplicate sets found` : '')

  const dupRec: any[] = await prisma.$queryRaw`
    SELECT "scannedDocumentId", COUNT(*) as cnt
    FROM "ProcurementReconciliation"
    GROUP BY "scannedDocumentId"
    HAVING COUNT(*) > 1 LIMIT 10`
  check('ProcurementReconciliation — no duplicates', dupRec.length === 0,
    dupRec.length > 0 ? `${dupRec.length} docs with multiple reconciliations` : '')

  const dupSA: any[] = await prisma.$queryRaw`
    SELECT "supplierId", "normalized", COUNT(*) as cnt
    FROM "SupplierAlias"
    GROUP BY "supplierId", "normalized"
    HAVING COUNT(*) > 1 LIMIT 10`
  check('SupplierAlias — no duplicates', dupSA.length === 0,
    dupSA.length > 0 ? `${dupSA.length} duplicate aliases` : '')

  const dupPA: any[] = await prisma.$queryRaw`
    SELECT "inventoryItemId", "normalized", COUNT(*) as cnt
    FROM "ProductAlias"
    WHERE "inventoryItemId" IS NOT NULL
    GROUP BY "inventoryItemId", "normalized"
    HAVING COUNT(*) > 1 LIMIT 10`
  check('ProductAlias — no duplicates', dupPA.length === 0,
    dupPA.length > 0 ? `${dupPA.length} duplicate aliases` : '')

  // ── Orphan checks ─────────────────────────────────────────────────────────
  const orphanAlerts: any[] = await prisma.$queryRaw`
    SELECT COUNT(*) as cnt FROM "AnomalyAlert" aa
    LEFT JOIN "ScannedDocument" sd ON aa."scannedDocumentId" = sd."id"
    WHERE aa."scannedDocumentId" IS NOT NULL AND sd."id" IS NULL`
  check('AnomalyAlert — no orphaned records', Number(orphanAlerts[0].cnt) === 0,
    `${orphanAlerts[0].cnt} orphans`)

  const orphanRec: any[] = await prisma.$queryRaw`
    SELECT COUNT(*) as cnt FROM "ProcurementReconciliation" pr
    LEFT JOIN "ScannedDocument" sd ON pr."scannedDocumentId" = sd."id"
    WHERE sd."id" IS NULL`
  check('ProcurementReconciliation — no orphaned records', Number(orphanRec[0].cnt) === 0,
    `${orphanRec[0].cnt} orphans`)

  // ── Record counts ─────────────────────────────────────────────────────────
  const counts: any[] = await prisma.$queryRaw`
    SELECT
      (SELECT COUNT(*) FROM "ScannedDocument")           as docs,
      (SELECT COUNT(*) FROM "ScanJob")                    as scanjobs,
      (SELECT COUNT(*) FROM "ProcurementReconciliation") as recs,
      (SELECT COUNT(*) FROM "AnomalyAlert")              as alerts,
      (SELECT COUNT(*) FROM "DocumentEntityLink")        as links,
      (SELECT COUNT(*) FROM "SupplierAlias")             as sup_aliases,
      (SELECT COUNT(*) FROM "ProductAlias")              as prod_aliases`
  const c = counts[0]
  console.log()
  console.log('--- Record Counts ---')
  console.log(`  ScanJobs:                   ${c.scanjobs}`)
  console.log(`  ScannedDocuments:           ${c.docs}`)
  console.log(`  ProcurementReconciliations: ${c.recs}`)
  console.log(`  AnomalyAlerts:              ${c.alerts}`)
  console.log(`  DocumentEntityLinks:        ${c.links}`)
  console.log(`  SupplierAliases:            ${c.sup_aliases}`)
  console.log(`  ProductAliases:             ${c.prod_aliases}`)

  // ── Alert type breakdown ──────────────────────────────────────────────────
  const alertStats: any[] = await prisma.$queryRaw`
    SELECT type, severity, status, COUNT(*) as cnt
    FROM "AnomalyAlert"
    GROUP BY type, severity, status
    ORDER BY cnt DESC LIMIT 20`
  console.log()
  if (alertStats.length > 0) {
    console.log('--- AnomalyAlert Breakdown ---')
    for (const row of alertStats) {
      console.log(`  ${row.type} (${row.severity}) [${row.status}]: ${row.cnt}`)
    }
  } else {
    console.log('AnomalyAlert breakdown: (empty — expected for fresh system)')
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log()
  console.log('='.repeat(70))
  console.log(`PHASES 4+5 RESULT: ${passCount} passed, ${failCount} failed`)
  console.log('='.repeat(70))

  await prisma.$disconnect()
  process.exit(failCount > 0 ? 1 : 0)
}

main().catch(async e => {
  console.error('Fatal error:', e.message)
  await prisma.$disconnect()
  process.exit(1)
})
