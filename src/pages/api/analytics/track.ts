import type { NextApiRequest, NextApiResponse } from 'next'
import { trackEvent } from '@/lib/analytics-tracker'
import { hasServerConsent } from '@/lib/server/consent'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  // Enforce analytics consent (cookies or DNT fallback)
  if (!hasServerConsent(req, 'analytics')) return res.status(204).end()
  try {
    const { businessId, sessionId, customerId, type, entityType, entityId, metadata } = req.body || {}
    if (!type) return res.status(400).json({ error: 'type is required' })
    await trackEvent({ businessId, sessionId, customerId, type, entityType, entityId, metadata })
    return res.status(200).json({ ok: true })
  } catch (e) {
    return res.status(500).json({ error: 'failed to track' })
  }
}
