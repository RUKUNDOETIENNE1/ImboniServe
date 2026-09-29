const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()
;(async () => {
  const r = await p.$queryRaw`SELECT migration_name, finished_at, rolled_back_at, started_at FROM "_prisma_migrations" WHERE finished_at IS NULL OR rolled_back_at IS NOT NULL ORDER BY started_at DESC`
  console.log('Pending/failed/rolled-back migrations:')
  console.log(JSON.stringify(r, null, 2))
  await p.$disconnect()
})().catch(e => { console.error(e); process.exit(1) })
