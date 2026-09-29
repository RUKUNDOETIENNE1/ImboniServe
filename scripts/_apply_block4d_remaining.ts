// @ts-nocheck
/**
 * Applies the two missing Block 4D columns on ScannedDocument that were
 * skipped in the first migration run due to a comment-stripping bug.
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({ log: [] })
const p = prisma as any

async function main() {
  console.log('Applying remaining Block 4D columns to ScannedDocument...')

  await p.$executeRawUnsafe(
    `ALTER TABLE "ScannedDocument"
       ADD COLUMN IF NOT EXISTS "reconciliationStatus" TEXT,
       ADD COLUMN IF NOT EXISTS "confidenceScore" DOUBLE PRECISION`
  )
  console.log('  ALTER TABLE OK')

  // Verify
  const cols = await p.$queryRawUnsafe>(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'ScannedDocument'
       AND column_name IN ('reconciliationStatus','confidenceScore')`
  )
  const found = cols.map((c: any) => c.column_name)
  const hasRecon = found.includes('reconciliationStatus')
  const hasConf = found.includes('confidenceScore')
  console.log(`  ${hasRecon ? '✓' : '✗'} ScannedDocument.reconciliationStatus`)
  console.log(`  ${hasConf ? '✓' : '✗'} ScannedDocument.confidenceScore`)

  if (!hasRecon || !hasConf) {
    console.error('\n[FAIL] Columns still missing!')
    process.exit(1)
  }
  console.log('\n[DONE] All Block 4D columns present.')
  await prisma.$disconnect()
}

main().catch(e => { console.error(String(e)); process.exit(1) })
