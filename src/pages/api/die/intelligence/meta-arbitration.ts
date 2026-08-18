import type { NextApiRequest, NextApiResponse } from 'next'
import { buildMetaValidationSnapshot } from '@/lib/die/meta/meta-arbitration-validator'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  try {
    if (process.env.DIE_INTELLIGENCE_META_VALIDATION_ENABLED !== 'true') {
      return res.status(200).json({
        arbitrationAccuracyScore: 0,
        resolutionQualityScore: 0,
        driftScore: 0,
        layerEffectiveness: { weightContributionScore: 0, underperformingLayers: [], overdominantLayers: [] },
        metaSystemHealthScore: 0,
        recommendations: [],
        recent: [],
      })
    }

    const snapshot = await buildMetaValidationSnapshot()
    return res.status(200).json(snapshot)
  } catch (e: any) {
    console.debug('[DIE][Meta-Arbitration API] error (ignored):', e?.message)
    return res.status(200).json({ error: 'disabled or unavailable' })
  }
}
