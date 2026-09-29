/**
 * API: IremboPay Webhook Handler (RETIRED)
 *
 * This endpoint has been retired in favor of the canonical webhook at:
 *   /api/payments/irembo/webhook.ts
 *
 * All IremboPay webhook notifications should be sent to the canonical endpoint.
 * This file remains as a 410 Gone response for any stale webhook configurations.
 *
 * @see Platform Integrity Resolution Architecture — Critical Finding #4
 */

import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  return res.status(410).json({
    error: 'Gone',
    message: 'This webhook endpoint has been retired. Use /api/payments/irembo/webhook instead.',
  })
}
