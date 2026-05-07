import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Activating ESSENTIALS and deactivating STARTER and GROWTH...')

  await prisma.plan.updateMany({
    where: { code: 'ESSENTIALS' },
    data: { isActive: true },
  })

  await prisma.plan.updateMany({
    where: { code: { in: ['STARTER', 'GROWTH'] } },
    data: { isActive: false },
  })

  const rows = await prisma.plan.findMany({
    select: { code: true, name: true, isActive: true, priceCents: true, annualPriceCents: true },
    orderBy: { code: 'asc' },
  })

  console.table(rows.map(r => ({
    code: r.code,
    name: r.name,
    active: r.isActive,
    monthlyRWF: (r.priceCents || 0) / 100,
    annualMonthlyRWF: (r.annualPriceCents || 0) / 100,
  })))
}

main()
  .catch(err => {
    console.error('Failed to toggle plan activity:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
