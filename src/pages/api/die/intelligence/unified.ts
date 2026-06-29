import type { NextApiRequest, NextApiResponse } from 'next'
import { unifiedIntelligence } from '@/lib/die/unified-intelligence/unified-intelligence.service'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const payload = await unifiedIntelligence.buildUnifiedPayload()
    return res.status(200).json(payload)
  } catch (error) {
    console.error('[Unified Intelligence API] Failed to build payload:', error)
    return res.status(500).json({ error: 'Failed to build unified intelligence payload' })
  }
}
