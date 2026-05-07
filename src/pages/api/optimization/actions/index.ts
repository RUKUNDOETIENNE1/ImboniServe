import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/middleware/permission.middleware'
import { resolveBusinessContext } from '@/lib/api/business-context'
import { recordAction, type RecordActionInput } from '@/lib/services/optimization-memory.service'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const ctx = await resolveBusinessContext(req, res)
      if (!ctx) return

      const { recommendationId, actionType, description, beforeState, afterState, isReversible, metadata } = req.body

      if (!recommendationId || !actionType || !description) {
        return res.status(400).json({ error: 'Missing required fields' })
      }

      // Verify recommendation belongs to user's business
      const recommendation = await prisma.optimizationRecommendation.findUnique({
        where: { id: recommendationId },
        select: { businessId: true },
      })

      if (!recommendation || recommendation.businessId !== ctx.businessId) {
        return res.status(404).json({ error: 'Recommendation not found' })
      }

      const input: RecordActionInput = {
        recommendationId,
        actionType,
        description,
        beforeState,
        afterState,
        executedBy: ctx.userId,
        isReversible,
        metadata,
      }

      const action = await recordAction(input)
      return res.status(201).json(action)
    } catch (error) {
      console.error('Failed to record action:', error)
      return res.status(500).json({ error: 'Failed to record action' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

export default requirePermission('reports.view')(handler)
