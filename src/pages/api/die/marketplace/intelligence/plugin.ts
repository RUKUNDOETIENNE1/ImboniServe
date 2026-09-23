import type { NextApiRequest, NextApiResponse } from 'next'
import { marketplaceIntelligence } from '@/lib/die/marketplace/intelligence/marketplace-intelligence.service'
import { resolveBusinessContext } from '@/lib/api/business-context'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const ctx = await resolveBusinessContext(req, res)
  if (!ctx) return

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { pluginId } = req.query
    if (!pluginId || typeof pluginId !== 'string') {
      return res.status(400).json({ error: 'Missing pluginId' })
    }

    const data = marketplaceIntelligence.computeForPlugin(pluginId)
    if (!data) return res.status(404).json({ error: 'Plugin not found' })

    return res.status(200).json(data)
  } catch (error) {
    console.error('[Marketplace Intelligence] plugin metrics failed', error)
    return res.status(500).json({ error: 'Failed to compute plugin intelligence' })
  }
}
