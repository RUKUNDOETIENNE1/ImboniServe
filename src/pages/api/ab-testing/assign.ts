import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { hasServerConsent } from '@/lib/server/consent'

function hashToFloat(seed: string): number {
  // Simple deterministic hash -> [0,1)
  let h = 2166136261 >>> 0
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  // Convert to [0,1)
  return (h >>> 0) / 0xffffffff
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  // Enforce analytics consent (cookies or DNT fallback)
  if (!hasServerConsent(req, 'analytics')) return res.status(204).end()

  try {
    const { testId, visitorId: rawVisitorId, userId } = req.body as any
    if (!testId) return res.status(400).json({ error: 'testId required' })

    // Identify visitor deterministically
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || (req.socket as any)?.remoteAddress || '0.0.0.0'
    const ua = req.headers['user-agent'] || 'unknown'
    const visitorId = (rawVisitorId && String(rawVisitorId)) || `${ip}:${ua}`

    // If already assigned, return existing assignment
    const existing = await prisma.aBAssignment.findUnique({
      where: { testId_visitorId: { testId, visitorId } },
      include: { variant: true }
    })
    if (existing) {
      return res.status(200).json({ variantId: existing.variantId, variantName: existing.variant.name })
    }

    // Load test with variants
    const test = await prisma.aBTest.findUnique({ where: { id: testId }, include: { variants: true } })
    if (!test) return res.status(404).json({ error: 'Test not found' })
    if (!test.variants || test.variants.length < 2) return res.status(400).json({ error: 'Test has no variants' })

    // Build cumulative distribution from trafficPercent or equal split
    const n = test.variants.length
    const weights = (test.variants as any[]).map((v: any) => (v.trafficPercent ?? Math.floor(100 / n)))
    const total = weights.reduce((a: number, b: number) => a + b, 0) || 100
    const r = hashToFloat(`${testId}:${visitorId}`) * total

    let acc = 0
    let chosen = test.variants[0]
    for (let i = 0; i < n; i++) {
      acc += weights[i]
      if (r < acc) { chosen = test.variants[i]; break }
    }

    const created = await prisma.aBAssignment.create({
      data: { testId, variantId: chosen.id, visitorId, userId: userId ?? null }
    })

    return res.status(200).json({ variantId: created.variantId, variantName: chosen.name })
  } catch (error: any) {
    console.error('AB assign error:', error)
    return res.status(500).json({ error: 'Failed to assign variant' })
  }
}
