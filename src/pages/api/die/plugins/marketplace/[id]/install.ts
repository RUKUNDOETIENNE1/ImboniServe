import type { NextApiRequest, NextApiResponse } from 'next'
import { PluginMarketplaceService } from '@/lib/die/plugins/marketplace/plugin-marketplace.service'

const service = new PluginMarketplaceService()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query
    if (typeof id !== 'string') {
      res.status(400).json({ error: 'Invalid id' })
      return
    }

    if (req.method === 'POST') {
      await service.installPlugin(id)
      res.status(200).json({ ok: true })
      return
    }

    res.status(405).json({ error: 'Method not allowed' })
  } catch (e: any) {
    res.status(500).json({ error: e?.message ?? 'Internal error' })
  }
}
