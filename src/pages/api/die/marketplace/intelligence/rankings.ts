import type { NextApiRequest, NextApiResponse } from 'next'
import { marketplaceIntelligence } from '@/lib/die/marketplace/intelligence/marketplace-intelligence.service'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const rankings = marketplaceIntelligence.computeRankings()
    return res.status(200).json(rankings)
  } catch (error) {
    console.error('[Marketplace Intelligence] rankings failed', error)
    return res.status(500).json({ error: 'Failed to compute marketplace rankings' })
  }
}
