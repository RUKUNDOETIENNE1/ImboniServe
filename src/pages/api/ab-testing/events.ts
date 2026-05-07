import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { hasServerConsent } from '@/lib/server/consent'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  // Enforce analytics consent (cookies or DNT fallback)
  if (!hasServerConsent(req, 'analytics')) return res.status(204).end()

  try {
    const { testId, variantId, type, valueCents, metadata, visitorId, userId } = req.body as any
    if (!testId || !variantId || !type) return res.status(400).json({ error: 'testId, variantId, type required' })

    // Optional: if visitorId provided and there's no explicit variant, could infer from assignment
    const event = await prisma.aBEvent.create({
      data: {
        testId,
        variantId,
        type,
        valueCents: typeof valueCents === 'number' ? valueCents : null,
        metadata: metadata ?? null,
      }
    })

    // Best effort: if VIEW event without assignment, create one (helps metrics completeness)
    if (visitorId && (!userId || typeof userId === 'string')) {
      try {
        await prisma.aBAssignment.upsert({
          where: { testId_visitorId: { testId, visitorId: String(visitorId) } },
          create: { testId, variantId, visitorId: String(visitorId), userId: userId ?? null },
          update: { variantId }
        })
      } catch {}
    }

    return res.status(201).json({ success: true, eventId: event.id })
  } catch (error: any) {
    console.error('AB event error:', error)
    return res.status(500).json({ error: 'Failed to record event' })
  }
}
