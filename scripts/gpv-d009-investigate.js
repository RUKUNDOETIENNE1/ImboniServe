const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

async function main() {
  const biz = await p.business.findFirst({
    select: { id: true, name: true, country: true, taxMode: true, taxRate: true }
  })
  console.log('Business:', JSON.stringify(biz, null, 2))

  const taxes = await p.taxConfiguration.findMany({
    where: { businessId: biz.id },
    select: { taxType: true, name: true, rate: true, isInclusive: true, isActive: true, priority: true }
  })
  console.log('TaxConfig:', JSON.stringify(taxes, null, 2))

  // Check all businesses
  const allBiz = await p.business.findMany({
    select: { id: true, name: true, country: true, taxMode: true, taxRate: true }
  })
  console.log(`\nAll businesses (${allBiz.length}):`)
  for (const b of allBiz) {
    const t = await p.taxConfiguration.findMany({
      where: { businessId: b.id },
      select: { taxType: true, isInclusive: true, rate: true }
    })
    const mismatch = t.some(tx => tx.taxType === 'VAT' && (
      (b.taxMode === 'EXCLUSIVE' && tx.isInclusive === true) ||
      (b.taxMode === 'INCLUSIVE' && tx.isInclusive === false)
    ))
    console.log(`  ${b.name} [${b.country}]: business.taxMode=${b.taxMode}, TaxConfig=${JSON.stringify(t)} ${mismatch ? '*** MISMATCH ***' : ''}`)
  }

  await p.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1); })
