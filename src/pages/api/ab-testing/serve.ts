import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { getRunningTestForMenuItem, assignVariantDeterministic, ensureAssignment, recordEvent } from '@/lib/ab-testing/server'
import { hasServerConsent } from '@/lib/server/consent'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  // Enforce analytics consent (cookies or DNT fallback)
  if (!hasServerConsent(req, 'analytics')) return res.status(204).end()

  try {
    const { testId: bodyTestId, businessId, menuItemId, visitorId: rawVisitorId, userId } = req.body as any
    if (!rawVisitorId) return res.status(400).json({ error: 'visitorId required' })

    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || (req.socket as any)?.remoteAddress || '0.0.0.0'
    const ua = req.headers['user-agent'] || 'unknown'
    const visitorId = String(rawVisitorId || `${ip}:${ua}`)

    let test = null as any
    if (bodyTestId) {
      test = await prisma.aBTest.findUnique({ where: { id: String(bodyTestId) }, include: { variants: true } })
      if (!test || test.status !== 'RUNNING') return res.status(404).json({ error: 'Test not running' })
    } else {
      if (!businessId || !menuItemId) return res.status(400).json({ error: 'Provide testId or (businessId and menuItemId)' })
      test = await getRunningTestForMenuItem(String(businessId), String(menuItemId))
      if (!test) return res.status(204).end() // no running test for this item
    }

    const chosen = assignVariantDeterministic(test.id, test.variants, visitorId)

    await ensureAssignment(test.id, chosen.id, visitorId, userId)
    await recordEvent({ testId: test.id, variantId: chosen.id, type: 'VIEW' })

    // Merge changes but do not persist to MenuItem here
    const base = {}
    const changes = ((chosen as any).changes || {}) as any
    const effective = { ...base, ...changes }

    return res.status(200).json({
      testId: test.id,
      variantId: chosen.id,
      variantName: (chosen as any).name,
      changes: effective,
    })
  } catch (error: any) {
    console.error('AB serve error:', error)
    return res.status(500).json({ error: 'Failed to serve variant' })
  }
}
