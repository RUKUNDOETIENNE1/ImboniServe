import { prisma } from '@/lib/prisma'

function hashToFloat(seed: string): number {
  let h = 2166136261 >>> 0
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0) / 0xffffffff
}

export async function getRunningTestForMenuItem(businessId: string, menuItemId: string) {
  return prisma.aBTest.findFirst({
    where: { businessId, menuItemId, status: 'RUNNING' },
    include: { variants: true },
  })
}

export function assignVariantDeterministic(testId: string, variants: Array<{ id: string; trafficPercent: number | null }>, visitorId: string) {
  if (!variants || variants.length === 0) throw new Error('No variants to assign')
  const n = variants.length
  const weights = variants.map(v => (v.trafficPercent ?? Math.floor(100 / n)))
  const total = weights.reduce((a, b) => a + b, 0) || 100
  const r = hashToFloat(`${testId}:${visitorId}`) * total
  let acc = 0
  let chosen = variants[0]
  for (let i = 0; i < n; i++) {
    acc += weights[i]
    if (r < acc) { chosen = variants[i]; break }
  }
  return chosen
}

export async function ensureAssignment(testId: string, variantId: string, visitorId: string, userId?: string | null) {
  try {
    await prisma.aBAssignment.upsert({
      where: { testId_visitorId: { testId, visitorId } },
      create: { testId, variantId, visitorId, userId: userId ?? null },
      update: { variantId },
    })
  } catch {}
}

export async function recordEvent(opts: {
  testId: string
  variantId: string
  type: 'VIEW' | 'CLICK' | 'ORDER' | 'REVENUE' | 'CUSTOM'
  valueCents?: number | null
  metadata?: any
}) {
  const { testId, variantId, type, valueCents, metadata } = opts
  await prisma.aBEvent.create({
    data: {
      testId,
      variantId,
      type: type as any,
      valueCents: typeof valueCents === 'number' ? valueCents : null,
      metadata: metadata ?? null,
    },
  })
}
