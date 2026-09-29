/**
 * Guardian API — Metrics
 * GET /api/guardian/metrics → aggregate metrics for dashboard
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { resolveBusinessContext } from '@/lib/api/business-context'
import { GuardianService } from '@/lib/guardian'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const ctx = await resolveBusinessContext(req, res)
    if (!ctx) return

    const metrics = await GuardianService.getMetrics(ctx.businessId)

    return res.status(200).json(metrics)
  } catch (error: any) {
    console.error('[Guardian Metrics API] Error:', error)
    return res.status(500).json({ error: 'Failed to fetch Guardian metrics' })
  }
}

export default handler
