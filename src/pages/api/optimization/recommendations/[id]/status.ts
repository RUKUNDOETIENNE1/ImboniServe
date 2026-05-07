import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/middleware/permission.middleware'
import { resolveBusinessContext } from '@/lib/api/business-context'
import { updateRecommendationStatus } from '@/lib/services/optimization-memory.service'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Recommendation ID required' })
  }

  if (req.method === 'PATCH') {
    try {
      const ctx = await resolveBusinessContext(req, res)
      if (!ctx) return

      const recommendation = await prisma.optimizationRecommendation.findUnique({
        where: { id },
        select: { businessId: true },
      })

      if (!recommendation || recommendation.businessId !== ctx.businessId) {
        return res.status(404).json({ error: 'Recommendation not found' })
      }

      const { status, dismissedReason } = req.body
      if (!status) {
        return res.status(400).json({ error: 'Status required' })
      }

      const updated = await updateRecommendationStatus(id, status, ctx.userId, dismissedReason)
      return res.status(200).json(updated)
    } catch (error) {
      console.error('Failed to update recommendation status:', error)
      return res.status(500).json({ error: 'Failed to update recommendation status' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

export default requirePermission('reports.view')(handler)
