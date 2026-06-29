/**
 * DIE Analytics API — Procurement Intelligence
 * Block 5B: Intelligence & Analytics Layer
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { resolveBusinessContext } from '@/lib/api/business-context'
import { ProcurementIntelligenceService } from '@/lib/die/analytics/procurement-intelligence.service'
import { getDateRange } from '@/lib/die/analytics/analytics-utils'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const ctx = await resolveBusinessContext(req, res)
    if (!ctx) return

    const period = (req.query.period as string) || 'month'
    const dateRange = getDateRange(period as any)

    const report = await ProcurementIntelligenceService.getProcurementIntelligence({
      businessId: ctx.businessId,
      dateRange,
    })

    return res.status(200).json({
      data: report,
      generatedAt: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('[DIE-Analytics] Procurement intelligence error:', error)
    return res.status(500).json({ error: 'Failed to generate procurement intelligence report' })
  }
}
