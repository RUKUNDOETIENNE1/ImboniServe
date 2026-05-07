import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { SmartReorderService } from '@/lib/services/smart-reorder.service'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const user = session.user as any
  const sessionBusinessId: string | null | undefined = user.businessId

  try {
    if (req.method === 'GET') {
      const { businessId, supplierId, daysWindow, safetyStockDays, includeAll, limit } = req.query

      const resolvedBusinessId = (businessId ? String(businessId) : sessionBusinessId)
      if (!resolvedBusinessId) return res.status(400).json({ error: 'businessId required' })
      if (businessId && sessionBusinessId && resolvedBusinessId !== sessionBusinessId) {
        return res.status(403).json({ error: 'Forbidden' })
      }

      try {
        const suggestions = await SmartReorderService.getSuggestions({
          businessId: resolvedBusinessId,
          supplierId: supplierId ? String(supplierId) : undefined,
          daysWindow: daysWindow ? Number(daysWindow) : undefined,
          safetyStockDays: safetyStockDays ? Number(safetyStockDays) : undefined,
          includeAll: includeAll === 'true',
          limit: limit ? Number(limit) : undefined,
        })

        return res.status(200).json(suggestions)
      } catch (dbError) {
        console.error('AI reorder DB error:', dbError)
        return res.status(200).json([])
      }
    }

    if (req.method === 'POST') {
      const { businessId, inventoryItemId, suggestedQty, chosenQty, action, explanation } = req.body || {}

      const resolvedBusinessId = businessId ? String(businessId) : sessionBusinessId
      if (!resolvedBusinessId || !inventoryItemId || typeof suggestedQty !== 'number' || typeof chosenQty !== 'number' || !action) {
        return res.status(400).json({ error: 'Missing required fields' })
      }
      if (businessId && sessionBusinessId && resolvedBusinessId !== sessionBusinessId) {
        return res.status(403).json({ error: 'Forbidden' })
      }

      await SmartReorderService.logDecision({
        businessId: resolvedBusinessId,
        inventoryItemId,
        userId: user.id,
        suggestedQty: Number(suggestedQty),
        chosenQty: Number(chosenQty),
        action,
        explanation: explanation ?? null,
      })

      return res.status(200).json({ ok: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('AI reorder API error:', error)
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' })
  }
}
