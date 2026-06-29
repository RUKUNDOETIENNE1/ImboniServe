import type { NextApiRequest, NextApiResponse } from 'next'
import { ecosystemMonitor } from '@/lib/die/control-plane/background/ecosystem-monitor'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const healthSummary = await ecosystemMonitor.getPluginHealthSummary()
    return res.status(200).json(healthSummary)
  } catch (error) {
    console.error('[Control Plane API] Failed to get ecosystem health:', error)
    return res.status(500).json({ error: 'Failed to retrieve ecosystem health summary' })
  }
}
