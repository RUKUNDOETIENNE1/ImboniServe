import { PrismaClient } from '@prisma/client'

async function main() {
  const prisma = new PrismaClient()
  try {
    const KEYS = ['cms_v1', 'feed_v1', 'feed_engagement_v1']

    for (const key of KEYS) {
      await prisma.featureFlag.upsert({
        where: { key },
        update: { enabled: true },
        create: {
          key,
          name: key,
          description: 'Enabled by enable-cms-feed-flags script',
          enabled: true,
          autoEnableThreshold: null,
          planGated: false,
          minimumPlan: null,
        },
      })
    }

    const flags = await prisma.featureFlag.findMany({
      where: { key: { in: ['cms_v1', 'feed_v1', 'feed_engagement_v1'] } },
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
