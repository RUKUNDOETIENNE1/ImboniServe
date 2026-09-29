import type { NextApiRequest, NextApiResponse } from 'next'
import { PluginMarketplaceService } from '@/lib/die/plugins/marketplace/plugin-marketplace.service'
import { requirePermission } from '@/lib/middleware/permission.middleware'

const service = new PluginMarketplaceService()

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const list = await service.listAvailablePlugins()
      res.status(200).json(list)
      return
    }

    res.status(405).json({ error: 'Method not allowed' })
  } catch (e: any) {
    res.status(500).json({ error: e?.message ?? 'Internal error' })
  }
}

export default requirePermission('die.view')(handler)
