/**
 * Legacy compatibility route for Tap & Leave callbacks.
 * Delegates to the hardened InTouch webhook endpoint to ensure a single,
 * authenticated payment status transition path.
 */
import type { NextApiRequest, NextApiResponse } from 'next'
import hardenedWebhookHandler from '@/pages/api/webhooks/intouch'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  return hardenedWebhookHandler(req, res)
}
