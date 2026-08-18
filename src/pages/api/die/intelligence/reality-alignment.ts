import type { NextApiRequest, NextApiResponse } from 'next'
import { buildRealityAlignmentSnapshot } from '@/lib/die/reality/reality-alignment-engine'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  try {
    if (process.env.DIE_INTELLIGENCE_REALITY_ALIGNMENT_ENABLED !== 'true') {
      return res.status(200).json({
        realityAlignmentScore: 0,
        causalMatchScore: 0,
        externalGroundingScore: 0,
        overconfidenceLeakageScore: 0,
        globalTruthAlignmentIndex: 0,
        recommendations: [],
        details: { ceoAlignmentOk: false, arbitrationStatePlausible: false, causalBreakdowns: [], highTrustWrongCount: 0, highTrustEvaluated: 0 },
      })
    }

    const snapshot = await buildRealityAlignmentSnapshot()
    return res.status(200).json(snapshot)
  } catch (e: any) {
    console.debug('[DIE][Reality Alignment API] error (ignored):', e?.message)
    return res.status(200).json({ error: 'disabled or unavailable' })
  }
}
