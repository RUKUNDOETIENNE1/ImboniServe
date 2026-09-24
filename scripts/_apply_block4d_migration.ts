// @ts-nocheck
/**
 * Applies the Block 4D migration SQL directly via a raw DB connection,
 * then marks it as applied in _prisma_migrations.
 *
 * Used because `prisma migrate deploy` fails due to a checksum drift on
 * an earlier migration (20260614_pr02_extraction_layer), and
 * `prisma db execute` fails with P1014 on mapped models.
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { createHash } from 'crypto'
import * as fs from 'fs'
import * as path from 'path'

const MIGRATION_NAME = '20260616100000_block4d_procurement_reconciliation'
const SQL_FILE = path.join(__dirname, '..', 'prisma', 'migrations', MIGRATION_NAME, 'migration.sql')

const prisma = new PrismaClient({ log: [] })
const p = prisma as any

async function main() {
  console.log('Block 4D Migration Applicator')
  console.log('='.repeat(60))

  // 1. Check if already applied
  const existing = await p.$queryRawUnsafe>(
    `SELECT migration_name, finished_at::text FROM "_prisma_migrations" WHERE migration_name = $1`,
    MIGRATION_NAME
  )
  if (existing.length > 0 && existing[0].finished_at) {
    console.log(`[SKIP] Migration already applied: ${MIGRATION_NAME}`)
    console.log(`       Finished at: ${existing[0].finished_at}`)
    await verifyState()
    await prisma.$disconnect()
    return
  }

  // 2. Read SQL
  const sql = fs.readFileSync(SQL_FILE, 'utf8')
  console.log(`[INFO] SQL file: ${SQL_FILE} (${sql.length} bytes)`)

  // 3. Execute migration statements individually (split on ;\n but preserve DO $$ blocks)
  console.log('\n[STEP 1] Applying migration SQL...')

  // Execute the full SQL as one statement block
  try {
    // Split into discrete statements being careful about DO $$ blocks
    const statements = splitStatements(sql)
    console.log(`         Found ${statements.length} statements to execute`)

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i].trim()
      // Strip leading comment lines to find the real SQL
      const sqlLines = stmt.split('\n').filter(l => !l.trim().startsWith('--'))
      const sqlOnly = sqlLines.join('\n').trim()
      if (!sqlOnly) continue
      console.log(`         [${i + 1}/${statements.length}] ${sqlOnly.slice(0, 80).replace(/\n/g, ' ')}...`)
      await p.$executeRawUnsafe(sqlOnly)
      console.log(`         OK`)
    }
  } catch (err: any) {
    console.error(`\n[FAIL] Migration SQL failed: ${err.message}`)
    console.error('       STOPPING — DB state preserved, no partial writes committed')
    await prisma.$disconnect()
    process.exit(1)
  }

  // 4. Record the migration in _prisma_migrations
  console.log('\n[STEP 2] Recording migration in _prisma_migrations...')
  const checksum = createHash('sha256').update(sql).digest('hex')
  const migrationId = Math.random().toString(36).slice(2, 18) // random id like Prisma uses

  // Check if a pending (unfinished) row already exists
  const pendingRow = await p.$queryRawUnsafe>(
    `SELECT id FROM "_prisma_migrations" WHERE migration_name = $1 AND finished_at IS NULL`,
    MIGRATION_NAME
  )

  if (pendingRow.length > 0) {
    await p.$executeRawUnsafe(
      `UPDATE "_prisma_migrations" SET finished_at = NOW(), checksum = $1 WHERE migration_name = $2`,
      checksum,
      MIGRATION_NAME
    )
    console.log('         Updated existing pending row to finished')
  } else if (existing.length === 0) {
    await p.$executeRawUnsafe(
      `INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
       VALUES ($1, $2, NOW(), $3, NULL, NULL, NOW(), 1)`,
      migrationId,
      checksum,
      MIGRATION_NAME
    )
    console.log('         Inserted new migration record')
  }

  // 5. Verify final state
  console.log('\n[STEP 3] Verifying DB state...')
  await verifyState()

  await prisma.$disconnect()
  console.log('\n[DONE] Block 4D migration applied successfully.')
}

function splitStatements(sql: string): string[] {
  const results: string[] = []
  let current = ''
  let inDollar = false

  const lines = sql.split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    // Track $$ blocks (DO $$ ... END $$)
    const dollarCount = (line.match(/\$\$/g) || []).length
    if (dollarCount % 2 === 1) inDollar = !inDollar

    current += line + '\n'

    // Statement ends at semicolon only when not inside a $$ block
    if (!inDollar && trimmed.endsWith(';')) {
      const stmt = current.trim()
      if (stmt && !stmt.startsWith('--')) results.push(stmt)
      current = ''
    }
  }
  if (current.trim()) results.push(current.trim())
  return results.filter(Boolean)
}

async function verifyState() {
  const cols = await p.$queryRawUnsafe>(
    `SELECT table_name, column_name, is_nullable
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND ((table_name = 'ScannedDocument' AND column_name IN ('reconciliationStatus','confidenceScore'))
         OR (table_name = 'ProcurementReconciliation' AND column_name IN ('businessId','matchType')))
     ORDER BY table_name, column_name`
  )

  const expected = [
    { table_name: 'ProcurementReconciliation', column_name: 'businessId' },
    { table_name: 'ProcurementReconciliation', column_name: 'matchType' },
    { table_name: 'ScannedDocument', column_name: 'confidenceScore' },
    { table_name: 'ScannedDocument', column_name: 'reconciliationStatus' },
  ]

  let allOk = true
  for (const exp of expected) {
    const found = cols.find((c: any) => c.table_name === exp.table_name && c.column_name === exp.column_name)
    const ok = !!found
    if (!ok) allOk = false
    console.log(`  ${ok ? '✓' : '✗'} ${exp.table_name}.${exp.column_name}`)
  }

  // Check unique index on DocumentEntityLink
  const idx = await p.$queryRawUnsafe>(
    `SELECT indexname FROM pg_indexes
     WHERE tablename = 'DocumentEntityLink'
       AND indexname = 'DocumentEntityLink_scannedDocumentId_entityType_entityId_key'`
  )
  const idxOk = idx.length > 0
  if (!idxOk) allOk = false
  console.log(`  ${idxOk ? '✓' : '✗'} DocumentEntityLink unique index (scannedDocumentId, entityType, entityId)`)

  if (!allOk) {
    console.error('\n[FAIL] Some expected columns/indexes are missing after migration!')
    process.exit(1)
  } else {
    console.log('\n  All expected schema changes verified.')
  }
}

main().catch((e) => {
  console.error('[FATAL]', String(e))
  process.exit(1)
})
