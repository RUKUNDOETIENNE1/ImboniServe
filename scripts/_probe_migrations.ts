// @ts-nocheck
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({ log: [] })

async function main() {
  const rows = await (prisma as any).$queryRawUnsafe
  >('SELECT migration_name, finished_at::text, rolled_back_at::text FROM "_prisma_migrations" ORDER BY started_at')

  console.log(`\n_prisma_migrations (${rows.length} rows):\n`)
  for (const r of rows) {
    const status = r.finished_at ? 'applied' : r.rolled_back_at ? 'rolled_back' : 'pending'
    console.log(`  [${status.padEnd(11)}] ${r.migration_name}`)
  }

  // Also check if Block4D columns exist
  const cols = await (prisma as any).$queryRawUnsafe>(
    `SELECT table_name, column_name FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name IN ('ScannedDocument','ProcurementReconciliation','DocumentEntityLink')
       AND column_name IN ('reconciliationStatus','confidenceScore','businessId','matchType')
     ORDER BY table_name, column_name`
  )
  console.log('\nBlock 4D columns present:')
  for (const c of cols) console.log(`  ${c.table_name}.${c.column_name}`)

  // Check unique index on DocumentEntityLink
  const idx = await (prisma as any).$queryRawUnsafe>(
    `SELECT indexname, tablename FROM pg_indexes
     WHERE tablename = 'DocumentEntityLink'
       AND indexname LIKE '%scannedDocumentId%entityType%entityId%'
     UNION
     SELECT indexname, tablename FROM pg_indexes
     WHERE tablename = 'DocumentEntityLink' AND indexname LIKE '%unique%'`
  )
  console.log('\nDocumentEntityLink unique indexes:')
  for (const i of idx) console.log(`  ${i.indexname}`)

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(String(e))
  process.exit(1)
})
