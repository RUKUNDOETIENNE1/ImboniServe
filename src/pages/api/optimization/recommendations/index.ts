import type { NextApiRequest, NextApiResponse } from 'next'
import { requirePermission } from '@/lib/middleware/permission.middleware'
import { resolveBusinessContext } from '@/lib/api/business-context'
import {
  createRecommendation,
  getRecommendations,
  type CreateRecommendationInput,
} from '@/lib/services/optimization-memory.service'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const ctx = await resolveBusinessContext(req, res)
  if (!ctx) return

  if (req.method === 'GET') {
    try {
      const { status, source, category, priority, limit } = req.query

      const recommendations = await getRecommendations(ctx.businessId, {
        status: status as any,
        source: source as any,
        category: category as any,
        priority: priority as any,
        limit: limit ? parseInt(limit as string) : undefined,
      })

      return res.status(200).json(recommendations)
    } catch (error) {
      console.error('Failed to fetch recommendations:', error)
      return res.status(500).json({ error: 'Failed to fetch recommendations' })
    }
  }

  if (req.method === 'POST') {
    try {
      const input: CreateRecommendationInput = {
        businessId: ctx.businessId,
        ...req.body,
      }

      if (!input.source || !input.category || !input.title || !input.description) {
        return res.status(400).json({ error: 'Missing required fields' })
      }

      const recommendation = await createRecommendation(input)
      return res.status(201).json(recommendation)
    } catch (error) {
      console.error('Failed to create recommendation:', error)
      return res.status(500).json({ error: 'Failed to create recommendation' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

export default requirePermission('reports.view')(handler)
