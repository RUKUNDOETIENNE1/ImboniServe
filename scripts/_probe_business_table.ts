// @ts-nocheck
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
const p = new PrismaClient({ log: [] }) as any
async function main() {
  const rows = await p.$queryRawUnsafe>(
    `SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename`
  )
  // print tables that contain 'business' case-insensitive
  const matching = rows.filter((r: any) => r.tablename.toLowerCase().includes('business'))
  console.log('Tables containing "business":', matching.map((r: any) => r.tablename).join(', '))
  // Also print all table names for full picture
  console.log('\nAll tables:', rows.map((r: any) => r.tablename).join('\n  '))
  await p.$disconnect()
}
main().catch(e => { console.error(String(e)); process.exit(1) })
