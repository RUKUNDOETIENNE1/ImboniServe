const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()
;(async () => {
  const tables = await p.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name`
  console.log('All base tables in public schema:')
  for (const t of tables) console.log(`  ${t.table_name}`)
  console.log(`\nTotal: ${tables.length}`)
  await p.$disconnect()
})().catch(e => { console.error(e); process.exit(1) })
