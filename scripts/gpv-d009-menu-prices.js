const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

async function main() {
  const biz = await p.business.findFirst({
    where: { name: 'GPV Test Restaurant' },
    select: { id: true, name: true, country: true, taxMode: true, taxRate: true }
  })
  console.log('Business:', JSON.stringify(biz, null, 2))

  // Check menu item prices
  const menuItems = await p.menuItem.findMany({
    where: { businessId: biz.id, isAvailable: true },
    select: { id: true, name: true, priceCents: true },
    take: 10
  })
  console.log(`\nMenu items (${menuItems.length} shown):`)
  for (const mi of menuItems) {
    const priceRWF = mi.priceCents / 100
    // EXCLUSIVE calculation
    const exclVAT = Math.round(priceRWF * (biz.taxRate / 100))
    const exclTotal = priceRWF + exclVAT
    // INCLUSIVE calculation
    const inclVAT = Math.round(priceRWF * biz.taxRate / (100 + biz.taxRate))
    const inclSubtotal = priceRWF - inclVAT
    console.log(`  ${mi.name}: ${priceRWF} RWF`)
    console.log(`    EXCLUSIVE: subtotal=${priceRWF}, VAT=${exclVAT}, total=${exclTotal}`)
    console.log(`    INCLUSIVE: subtotal=${inclSubtotal}, VAT=${inclVAT}, total=${priceRWF}`)
  }

  // Check completed sales to see what was actually charged
  const sales = await p.sale.findMany({
    where: { businessId: biz.id, paymentStatus: 'COMPLETED' },
    select: { id: true, orderNumber: true, totalAmountCents: true, createdAt: true },
    take: 5,
    orderBy: { createdAt: 'desc' }
  })
  console.log(`\nRecent completed sales (${sales.length}):`)
  for (const s of sales) {
    console.log(`  ${s.orderNumber}: ${s.totalAmountCents} cents (${s.totalAmountCents/100} RWF)`)
  }

  // Check what the EBM receipt format expects
  const taxConfig = await p.taxConfiguration.findFirst({
    where: { businessId: biz.id, taxType: 'VAT' }
  })
  console.log(`\nTaxConfiguration VAT:`, JSON.stringify(taxConfig, null, 2))

  await p.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1); })
