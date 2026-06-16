import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
const p = new PrismaClient({ log: ['error'] })
async function main() {
  // Check what table has businessId style columns that could be the Business/Restaurant equivalent
  const r = await p.$queryRawUnsafe<any[]>(
    "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('Business','Restaurant','business','restaurant')"
  )
  console.log('Business-ish tables:', r.map((t: any) => t.table_name))

  // Check ScanJob columns (since it has businessId FK)
  const sc = await p.$queryRawUnsafe<any[]>(
    "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='ScanJob' AND table_schema='public' ORDER BY ordinal_position"
  )
  console.log('ScanJob columns:', sc.map((c: any) => c.column_name))

  // Check existing FKs on ScanJob
  const fks = await p.$queryRawUnsafe<any[]>(
    "SELECT constraint_name, constraint_type FROM information_schema.table_constraints WHERE table_name='ScanJob' AND table_schema='public'"
  )
  console.log('ScanJob constraints:', fks.map((c: any) => `${c.constraint_name}(${c.constraint_type})`))
}
main().catch(e => { console.error(e.message); process.exit(1) }).finally(() => p.$disconnect())
