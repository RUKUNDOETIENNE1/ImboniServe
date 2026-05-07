import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const businessId = (session.user as any).businessId
  if (!businessId) {
    return res.status(400).json({ error: 'Business ID required' })
  }

  if (req.method === 'GET') {
    try {
      // Fetch tests and variants for this business
      const tests = await prisma.aBTest.findMany({
        where: { businessId },
        orderBy: { createdAt: 'desc' },
        include: { variants: true, menuItem: true }
      })

      // Aggregate events per test to compute metrics per variant
      const testIds = tests.map((t: any) => t.id)
      let events: any[] = []
      if (testIds.length) {
        try {
          events = await prisma.aBEvent.groupBy({
            by: ['testId', 'variantId', 'type'],
            where: { testId: { in: testIds } },
            _count: { _all: true },
            _sum: { valueCents: true },
          }) as any[]
        } catch (e: any) {
          console.error('AB groupBy failed, returning zeroed metrics. Details:', e?.message || e)
          events = []
        }
      }

      const eventsKey = (testId: string, variantId: string, type: string) => `${testId}:${variantId}:${type}`
      const lookup = new Map<string, { count: number; sum: number }>()
      for (const e of events as any[]) {
        lookup.set(eventsKey(e.testId, e.variantId, e.type), {
          count: e._count?._all ?? 0,
          sum: e._sum?.valueCents ?? 0,
        })
      }

      const shaped = tests.map((t: any) => ({
        id: t.id,
        name: t.name,
        menuItemId: t.menuItemId,
        menuItemName: t.menuItem?.name ?? '',
        status: t.status,
        winner: t.winnerVariantId ?? null,
        startDate: t.startAt ? new Date(t.startAt as any).toISOString() : new Date(t.createdAt as any).toISOString(),
        createdAt: new Date(t.createdAt as any).toISOString(),
        variants: (t.variants || []).map((v: any) => {
          const views = lookup.get(eventsKey(t.id, v.id, 'VIEW'))?.count ?? 0
          const orders = lookup.get(eventsKey(t.id, v.id, 'ORDER'))?.count ?? 0
          const revenue = lookup.get(eventsKey(t.id, v.id, 'REVENUE'))?.sum ?? 0
          const conversionRate = views > 0 ? Math.round((orders / views) * 1000) / 10 : 0
          return {
            id: v.id,
            name: v.name,
            changes: v.changes || {},
            trafficPercent: typeof v.trafficPercent === 'number' ? v.trafficPercent : Math.floor(100 / Math.max(1, t.variants.length)),
            metrics: { views, orders, revenue, conversionRate },
          }
        }),
      }))

      return res.status(200).json({ tests: shaped })
    } catch (error: any) {
      console.error('Get A/B tests error:', error)
      return res.status(200).json({ tests: [], debug: error?.message || 'Failed to get tests' })
    }
  } else if (req.method === 'POST') {
    try {
      const { name, menuItemId, variants } = req.body as any
      if (!name || !Array.isArray(variants) || variants.length < 2) {
        return res.status(400).json({ error: 'Name and at least 2 variants are required' })
      }

      const created = await prisma.aBTest.create({
        data: {
          businessId,
          name,
          menuItemId: menuItemId ?? null,
          status: 'DRAFT',
          variants: {
            create: variants.map((v: any) => ({
              name: v.name ?? 'Variant',
              description: v.description ?? null,
              trafficPercent: v.trafficPercent ?? null,
              changes: v.changes ?? {},
            }))
          }
        },
        include: { variants: true }
      })

      return res.status(201).json({ test: created })
    } catch (error: any) {
      console.error('Create A/B test error:', error)
      return res.status(500).json({ error: 'Failed to create test' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
