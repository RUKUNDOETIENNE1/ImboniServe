import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const rows = await prisma.plan.findMany({
    select: { code: true, name: true, priceCents: true, annualPriceCents: true },
    orderBy: { priceCents: 'asc' }
  })

  const out = rows.map(r => ({
    code: r.code,
    name: r.name,
    monthlyRWF: (r.priceCents || 0) / 100,
    annualMonthlyRWF: (r.annualPriceCents || 0) / 100,
  }))
  console.table(out)
}

main()
  .catch(err => {
    console.error('Failed to read plans:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
