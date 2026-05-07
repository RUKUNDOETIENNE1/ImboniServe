import type { NextApiRequest, NextApiResponse } from 'next'
import { AdminService } from '@/lib/services/admin.service'
import { requireRole } from '@/lib/middleware/auth.middleware'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const metrics = await AdminService.getMarketplaceMetrics()
      return res.status(200).json(metrics)
    } catch (error: any) {
      return res.status(500).json({ error: error.message })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

export default requireRole(['ADMIN'])(handler)
