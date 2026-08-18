import type { NextApiRequest, NextApiResponse } from 'next'
import { pluginIntelligence } from '@/lib/die/intelligence-core/plugin-intelligence.service'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { pluginId } = req.query

    if (pluginId && typeof pluginId === 'string') {
      const metrics = await pluginIntelligence.computeMetrics(pluginId)
      return res.status(200).json(metrics)
    }

    const allMetrics = await pluginIntelligence.computeAllMetrics()
    return res.status(200).json(allMetrics)
  } catch (error) {
    console.error('[Intelligence API] Failed to compute plugin metrics:', error)
    return res.status(500).json({ error: 'Failed to compute plugin intelligence metrics' })
  }
}
