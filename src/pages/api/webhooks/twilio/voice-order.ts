import type { NextApiRequest, NextApiResponse } from 'next'
import { logger } from '@/lib/logger'

/**
 * Voice Ordering via WhatsApp AI — DISABLED (WhatsApp Foundation Phase 1).
 *
 * Audit finding (WHATSAPP-DEEP-AUDIT §4/§9): this endpoint had no Twilio
 * signature validation, fetched attacker-controlled MediaUrl0 with Twilio
 * Basic-auth credentials (SSRF + credential leak), used invalid Whisper/GPT
 * configuration, and created Sale items without tenant scoping — including
 * cross-tenant and zero-price items from hallucinated menuItemIds.
 *
 * Decision: DISABLE rather than secure-in-place. AI conversational ordering
 * is an explicit Phase-4 deliverable; keeping a partially-secured AI order
 * path live now would ship an unreviewed order-creation surface. The route
 * now returns a controlled empty TwiML response (200 so Twilio does not
 * retry, no message sent to the sender, no order created, no credentials
 * used). Reintroduce via the Phase-4 design with signature validation,
 * media allowlisting, tenant-scoped lookups, and deduplication.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  logger.warn('Voice-order endpoint invoked but disabled (pending Phase-4 redesign)')

  res.setHeader('Content-Type', 'text/xml')
  return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?><Response/>`)
}
