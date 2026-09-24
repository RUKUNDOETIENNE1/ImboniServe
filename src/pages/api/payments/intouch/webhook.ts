/**
 * Legacy compatibility route.
 * Delegates to the hardened /api/webhooks/intouch implementation so all
 * payment status transitions pass through a single authenticated path.
 */
import type { NextApiRequest, NextApiResponse } from 'next'
import hardenedWebhookHandler from '@/pages/api/webhooks/intouch'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  return hardenedWebhookHandler(req, res)
}
