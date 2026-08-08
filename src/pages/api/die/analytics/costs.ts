/**
 * DIE Analytics API — Cost Intelligence
 * Block 5B: Intelligence & Analytics Layer
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { resolveBusinessContext } from '@/lib/api/business-context'
import { CostIntelligenceService } from '@/lib/die/analytics/cost-intelligence.service'
import { getDateRange } from '@/lib/die/analytics/analytics-utils'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const ctx = await resolveBusinessContext(req, res)
    if (!ctx) return

    const period = (req.query.period as string) || 'year'
    const limit = Math.min(50, parseInt(req.query.limit as string || '10', 10))
    const dateRange = getDateRange(period as any)

    const report = await CostIntelligenceService.getCostIntelligence({
      businessId: ctx.businessId,
      dateRange,
      limit,
    })

    return res.status(200).json({
      data: report,
      generatedAt: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('[DIE-Analytics] Cost intelligence error:', error)
    return res.status(500).json({ error: 'Failed to generate cost intelligence report' })
  }
}
