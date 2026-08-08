import type { NextApiRequest, NextApiResponse } from 'next'
import { generateExecutiveOverview } from '@/lib/die/ai-business-assistant.engine'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    if (process.env.DIE_AI_CEO_LAYER_ENABLED !== 'true') {
      return res.status(200).json({
        currentSnapshot: { summary: '', keyInsights: [], risks: [], opportunities: [], systemHealthNarrative: '', recommendedFocusAreas: [] },
        previousSnapshot: undefined,
        delta: { addedInsights: [], resolvedInsights: [], confidenceShift: [] },
        ceoFocus: [],
        strategicShift: { narrative: '', changingDirection: [], emergingTrends: [], systemicRisks: [], compoundingOpportunities: [] },
      })
    }

    const overview = await generateExecutiveOverview()
    return res.status(200).json(overview)
  } catch (e: any) {
    console.debug('[DIE][Executive API] error (ignored):', e?.message)
    return res.status(200).json({
      currentSnapshot: { summary: '', keyInsights: [], risks: [], opportunities: [], systemHealthNarrative: '', recommendedFocusAreas: [] },
      previousSnapshot: undefined,
      delta: { addedInsights: [], resolvedInsights: [], confidenceShift: [] },
      ceoFocus: [],
      strategicShift: { narrative: '', changingDirection: [], emergingTrends: [], systemicRisks: [], compoundingOpportunities: [] },
    })
  }
}
