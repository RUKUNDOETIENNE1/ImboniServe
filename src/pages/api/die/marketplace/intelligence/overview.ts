import type { NextApiRequest, NextApiResponse } from 'next'
import { marketplaceIntelligence } from '@/lib/die/marketplace/intelligence/marketplace-intelligence.service'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const data = marketplaceIntelligence.computeAll()
    return res.status(200).json(data)
  } catch (error) {
    console.error('[Marketplace Intelligence] overview failed', error)
    return res.status(500).json({ error: 'Failed to compute marketplace intelligence' })
  }
}
