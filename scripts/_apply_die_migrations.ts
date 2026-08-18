/**
 * Apply DIE migrations (PR01 + PR02) via PrismaClient
 * (bypasses the Rust binary engine used by `prisma migrate deploy`)
 *
 * Run: npx tsx scripts/_apply_die_migrations.ts
 */
import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { PrismaClient } from '@prisma/client'

const p = new PrismaClient({ log: ['error'] })

// ---------------------------------------------------------------------------
// Split SQL into executable statements, stripping comments and BEGIN/COMMIT
// ---------------------------------------------------------------------------
function splitStatements(sql: string): string[] {
  // Remove single-line comments
  const noLineComments = sql.replace(/--[^\n]*/g, '')
  // Remove block comments
  const noComments = noLineComments.replace(/\/\*[\s\S]*?\*\//g, '')

  return noComments
    .split(';')
    .map(s => s.trim())
    .filter(s => {
      if (!s) return false
      const upper = s.toUpperCase()
      if (upper === 'BEGIN' || upper === 'COMMIT') return false
      return true
    })
}

// ---------------------------------------------------------------------------
// Execute one migration file
// ---------------------------------------------------------------------------
async function applyMigration(name: string, sqlPath: string): Promise<void> {
  const sql = fs.readFileSync(sqlPath, 'utf-8')
  if (sql.trim() === '' || sql.trim() === '-- This is an empty migration.') {
    console.log(`  ${name}: empty — skipping SQL, marking applied`)
    await markApplied(name, 0)
    return
  }

  const statements = splitStatements(sql)
  console.log(`  ${name}: ${statements.length} statements`)

  let applied = 0
  let skipped = 0
  for (const stmt of statements) {
    try {
      await p.$executeRawUnsafe(stmt)
      applied++
    } catch (e: any) {
      const msg: string = e.message ?? ''
      if (
        msg.includes('already exists') ||
        msg.includes('duplicate key value') ||
        msg.includes('multiple primary keys')
      ) {
        skipped++
        continue
      }
      console.error(`\n  Statement failed:\n  ${stmt.slice(0, 200)}`)
      console.error(`  Error: ${msg}`)
      throw e
    }
  }
  console.log(`    executed=${applied} skipped(already-exists)=${skipped}`)
  await markApplied(name, applied)
}

async function markApplied(name: string, steps: number) {
  // Check _prisma_migrations
  const existing = await p.$queryRawUnsafe<any[]>(
    `SELECT migration_name, finished_at FROM "_prisma_migrations" WHERE migration_name = $1`,
    name
  )

  if (existing.length === 0) {
    await p.$executeRawUnsafe(
      `INSERT INTO "_prisma_migrations" (id, checksum, started_at, finished_at, migration_name, applied_steps_count)
       VALUES (gen_random_uuid()::text, 'manual-apply', NOW(), NOW(), $1, $2)`,
      name, steps
    )
  } else if (existing[0].finished_at === null) {
    await p.$executeRawUnsafe(
      `UPDATE "_prisma_migrations" SET finished_at = NOW(), applied_steps_count = $1 WHERE migration_name = $2`,
      steps, name
    )
  } else {
    console.log(`    (already recorded in _prisma_migrations)`)
  }
  console.log(`  ✓ ${name}`)
}

// ---------------------------------------------------------------------------
// Verify tables
// ---------------------------------------------------------------------------
async function verifyTables() {
  const expected = [
    'ScanJob', 'ScannedDocument', 'ScannedDocumentItem',
    'DocumentProcessingLog', 'ExtractionPayload',
    'ExtractedDocumentHeaderField', 'ExtractedDocumentLineField',
  ]
  const rows = await p.$queryRawUnsafe<any[]>(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = ANY($1)`,
    expected
  )
  const found = rows.map((r: any) => r.table_name)
  const missing = expected.filter(t => !found.includes(t))

  console.log(`\nDIE tables present: ${found.join(', ')}`)
  if (missing.length > 0) {
    console.error(`Missing tables: ${missing.join(', ')}`)
    throw new Error(`Migration incomplete: ${missing.length} tables missing`)
  }
  console.log('✓ All 7 DIE tables present')
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('Applying DIE migrations via Prisma Client (Node.js path)\n')

  const migrationsRoot = path.join(process.cwd(), 'prisma', 'migrations')
  const pending = [
    '20260614_pr01_die_database_foundation',
    '20260614_pr02_extraction_layer',
    '20260614b_pr02_extraction_layer',
  ]

  for (const name of pending) {
    // Check if already cleanly applied
    const rec = await p.$queryRawUnsafe<any[]>(
      `SELECT finished_at FROM "_prisma_migrations" WHERE migration_name = $1`,
      name
    )
    if (rec.length > 0 && rec[0].finished_at !== null) {
      console.log(`  ${name}: already applied ✓`)
      continue
    }

    const sqlPath = path.join(migrationsRoot, name, 'migration.sql')
    await applyMigration(name, sqlPath)
  }

  await verifyTables()
}

main()
  .catch(e => { console.error('\nFATAL:', e.message); process.exit(1) })
  .finally(() => p.$disconnect())
