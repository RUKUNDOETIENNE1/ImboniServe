import type { NextApiRequest, NextApiResponse } from 'next'
import { trendAnalyzer } from '@/lib/die/control-plane/background/trend-analyzer'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const trendSummary = await trendAnalyzer.getTrendSummary()
    return res.status(200).json(trendSummary)
  } catch (error) {
    console.error('[Control Plane API] Failed to compute trends:', error)
    return res.status(500).json({ error: 'Failed to compute trend summary' })
  }
}
