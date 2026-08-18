import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
const p = new PrismaClient({ log: ['error'] })
async function main() {
  const r = await p.$queryRawUnsafe<any[]>(
    "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name"
  )
  console.log('ALL TABLES:')
  r.forEach((t: any) => console.log(' ', t.table_name))
  await p.$disconnect()
}
main().catch(e => { console.error(e.message); process.exit(1) })
