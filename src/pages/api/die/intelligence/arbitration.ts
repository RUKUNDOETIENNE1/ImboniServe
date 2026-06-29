import type { NextApiRequest, NextApiResponse } from 'next'
import { buildArbitrationSnapshot } from '@/lib/die/arbitration/intelligence-arbitrator'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  try {
    if (process.env.DIE_INTELLIGENCE_ARBITRATION_ENABLED !== 'true') {
      return res.status(200).json({
        consensusInsights: [],
        consensusConfidence: 0,
        conflictReport: { conflicts: [], conflictScore: 0 },
        disagreementIndex: 0,
        finalSystemState: 'CONFLICTED',
        explanation: 'Arbitration disabled',
      })
    }

    const snapshot = await buildArbitrationSnapshot()
    return res.status(200).json(snapshot)
  } catch (e: any) {
    console.debug('[DIE][Arbitration API] error (ignored):', e?.message)
    return res.status(200).json({ error: 'disabled or unavailable' })
  }
}
