const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

async function main() {
  console.log('=== PR-001 DB Counts (PascalCase tables) ===\n')

  // Per-business operational counts
  const biz = await p.business.findMany({ select: { id: true, name: true } })
  for (const b of biz) {
    const q = async (table) => {
      try {
        const r = await p.$queryRawUnsafe(`SELECT COUNT(*)::int AS n FROM "${table}" WHERE "businessId" = $1`, b.id)
        return r[0].n
      } catch (e) {
        return `ERR:${e.message.split('\n')[0]}`
      }
    }
    const tables = await q('Table')
    const menuCats = await q('MenuCategory')
    const menuItems = await q('MenuItem')
    const qrCodes = await q('QrCode')
    const reservations = await q('Reservation')
    const orders = await q('Order')
    const sales = await q('Sale')
    const ledger = await q('FinancialLedgerEntry')
    const payments = await q('PaymentTransaction')
    const inventory = await q('InventoryItem')
    console.log(`  ${b.name} (${b.id}):`)
    console.log(`    Tables=${tables} MenuCategories=${menuCats} MenuItems=${menuItems} QrCodes=${qrCodes}`)
    console.log(`    Reservations=${reservations} Orders=${orders} Sales=${sales} LedgerEntries=${ledger} Payments=${payments}`)
    console.log(`    InventoryItems=${inventory}`)
  }

  // Global counts
  console.log('\n--- Global counts ---')
  for (const t of ['DailyClose', 'AuditLog', 'SupplierOrder', 'DiningSessionSlip', 'SmartDiningSlip']) {
    try {
      const r = await p.$queryRawUnsafe(`SELECT COUNT(*)::int AS n FROM "${t}"`)
      console.log(`  ${t}: ${r[0].n}`)
    } catch (e) {
      console.log(`  ${t}: ERR - ${e.message.split('\n')[0]}`)
    }
  }

  // Check for MenuCategory table (might not exist as a separate table)
  console.log('\n--- MenuCategory check ---')
  try {
    const r = await p.$queryRawUnsafe(`SELECT COUNT(*)::int AS n FROM "MenuItem"`)
    console.log(`  MenuItem total: ${r[0].n}`)
  } catch (e) {
    console.log(`  MenuItem: ERR - ${e.message.split('\n')[0]}`)
  }

  await p.$disconnect()
  console.log('\n=== Complete ===')
}
main().catch(e => { console.error(e); process.exit(1) })
