/**
 * Guardian API — Active cases and metrics
 * GET /api/guardian → list active cases + metrics
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

    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200)
    const [cases, metrics, mode] = await Promise.all([
      GuardianService.getActiveCases(ctx.businessId, limit),
      GuardianService.getMetrics(ctx.businessId),
      GuardianService.getGuardianMode(ctx.businessId),
    ])

    return res.status(200).json({
      mode,
      cases,
      metrics,
      total: cases.length,
    })
  } catch (error: any) {
    console.error('[Guardian API] Error:', error)
    return res.status(500).json({ error: 'Failed to fetch Guardian data' })
  }
}

export default handler
