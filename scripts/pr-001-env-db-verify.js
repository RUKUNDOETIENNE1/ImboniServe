// PR-001 Environment + DB verification — honest evidence collection only.
const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

async function main() {
  console.log('=== PR-001 Environment + DB Verification ===\n')

  // 1. DB connectivity
  console.log('--- 1. Database connectivity ---')
  try {
    await p.$queryRaw`SELECT 1 AS ok`
    console.log('DB connect: OK (Supabase reachable)')
  } catch (e) {
    console.log('DB connect: FAIL -', e.message); return
  }
  const dbUrl = process.env.DATABASE_URL || ''
  const m = dbUrl.match(/postgres\.([a-z0-9]+):/)
  console.log('DB project ref:', m ? m[1] : 'unknown')
  console.log('DB region hint:', (dbUrl.match(/aws-\d+-([a-z-]+)-\d+/) || [])[1] || 'unknown')

  // 2. Migration state summary
  console.log('\n--- 2. Migration state ---')
  const applied = await p.$queryRaw`SELECT COUNT(*)::int AS n FROM "_prisma_migrations" WHERE finished_at IS NOT NULL`
  const rolledBack = await p.$queryRaw`SELECT COUNT(*)::int AS n FROM "_prisma_migrations" WHERE rolled_back_at IS NOT NULL`
  const pending = await p.$queryRaw`SELECT COUNT(*)::int AS n FROM "_prisma_migrations" WHERE finished_at IS NULL AND rolled_back_at IS NULL`
  console.log(`Applied: ${applied[0].n} | Rolled back: ${rolledBack[0].n} | Truly pending/failed: ${pending[0].n}`)

  // 3. Businesses in DB (actual configuration)
  console.log('\n--- 3. Businesses in DB ---')
  const biz = await p.business.findMany({
    select: { id: true, name: true, country: true, city: true, currency: true, timezone: true, defaultLanguage: true, taxMode: true, planId: true, approvalStatus: true, isActive: true, businessType: true, address: true, phone: true, whatsappNumber: true }
  })
  for (const b of biz) {
    console.log(`  id=${b.id}`)
    console.log(`    name=${b.name} type=${b.businessType} active=${b.isActive} approval=${b.approvalStatus} plan=${b.planId}`)
    console.log(`    country=${b.country} city=${b.city} address=${b.address} phone=${b.phone} whatsapp=${b.whatsappNumber}`)
    console.log(`    currency=${b.currency} timezone=${b.timezone} lang=${b.defaultLanguage} taxMode=${b.taxMode}`)
  }

  // 4. TaxConfiguration per business
  console.log('\n--- 4. TaxConfiguration per business ---')
  for (const b of biz) {
    const tc = await p.taxConfiguration.findMany({ where: { businessId: b.id }, select: { name: true, rate: true, isInclusive: true, isActive: true } })
    if (tc.length === 0) { console.log(`  ${b.name}: NO TaxConfiguration records`); continue }
    for (const t of tc) console.log(`  ${b.name} | ${t.name} rate=${t.rate} isInclusive=${t.isInclusive} active=${t.isActive}`)
  }

  // 5. Users + roles per business
  console.log('\n--- 5. Users + roles per business ---')
  for (const b of biz) {
    const users = await p.user.findMany({ where: { businessId: b.id }, select: { email: true, roles: true, isActive: true, businessId: true, name: true } })
    if (users.length === 0) { console.log(`  ${b.name}: NO users`); continue }
    for (const u of users) console.log(`  ${b.name} | ${u.email} roles=${JSON.stringify(u.roles)} active=${u.isActive}`)
  }

  // 6. Tables + menu items per business
  console.log('\n--- 6. Tables + menu items per business ---')
  for (const b of biz) {
    const tables = await p.table.count({ where: { businessId: b.id } })
    const menu = await p.menuItem.count({ where: { businessId: b.id } })
    const cats = await p.menuCategory.count({ where: { businessId: b.id } })
    const reservations = await p.reservation.count({ where: { businessId: b.id } })
    const orders = await p.order.count({ where: { businessId: b.id } })
    const sales = await p.sale.count({ where: { businessId: b.id } })
    const ledger = await p.financialLedgerEntry.count({ where: { businessId: b.id } })
    const payments = await p.paymentTransaction.count({ where: { businessId: b.id } })
    console.log(`  ${b.name}: tables=${tables} categories=${cats} menuItems=${menu} reservations=${reservations} orders=${orders} sales=${sales} ledgerEntries=${ledger} payments=${payments}`)
  }

  // 7. Business isolation sanity — check no user has businessId mismatch
  console.log('\n--- 7. Business isolation sanity ---')
  const allUsers = await p.user.findMany({ select: { email: true, roles: true, businessId: true } })
  const crossBiz = allUsers.filter(u => !u.businessId || u.businessId === '')
  console.log(`  Total users: ${allUsers.length} | Users without businessId: ${crossBiz.length}`)
  if (crossBiz.length > 0) {
    for (const u of crossBiz) console.log(`    ${u.email} roles=${JSON.stringify(u.roles)} businessId=NULL`)
  }

  await p.$disconnect()
  console.log('\n=== PR-001 DB Verification Complete ===')
}
main().catch(e => { console.error(e); process.exit(1) })
