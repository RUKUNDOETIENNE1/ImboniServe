import type { NextApiRequest, NextApiResponse } from 'next'
import { requirePermission } from '@/lib/middleware/permission.middleware'
import { resolveBusinessContext } from '@/lib/api/business-context'
import { getImpactMetrics } from '@/lib/services/optimization-memory.service'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const ctx = await resolveBusinessContext(req, res)
      if (!ctx) return

      const { days } = req.query
      const periodDays = days ? parseInt(days as string) : 30

      const metrics = await getImpactMetrics(ctx.businessId, periodDays)
      return res.status(200).json(metrics)
    } catch (error) {
      console.error('Failed to fetch metrics:', error)
      return res.status(500).json({ error: 'Failed to fetch metrics' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

export default requirePermission('reports.view')(handler)
