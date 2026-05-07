import { PrismaClient } from '@prisma/client'

async function main() {
  const prisma = new PrismaClient()
  try {
    const KEYS = ['cms_self_approve_v1', 'feed_recommendations_v1']

    for (const key of KEYS) {
      await prisma.featureFlag.upsert({
        where: { key },
        update: { enabled: true },
        create: {
          key,
          name: key,
          description: 'Enabled by enable-cms-selfapprove-recs script',
          enabled: true,
          autoEnableThreshold: null,
          planGated: false,
          minimumPlan: null,
        },
      })
    }

    const flags = await prisma.featureFlag.findMany({
      where: { key: { in: KEYS } },
      select: { key: true, enabled: true },
      orderBy: { key: 'asc' },
    })

    console.log('Updated flags:', flags)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
