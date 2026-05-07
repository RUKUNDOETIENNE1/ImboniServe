import type { NextApiRequest, NextApiResponse } from 'next'
import { requirePermission } from '@/lib/middleware/permission.middleware'
import { resolveBusinessContext } from '@/lib/api/business-context'
import { ReorderAutopilotService } from '@/lib/services/reorder-autopilot.service'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const ctx = await resolveBusinessContext(req, res)
    if (!ctx) return

    if (req.method === 'GET') {
      const dashboard = await ReorderAutopilotService.getAutopilotDashboard(ctx.businessId)
      return res.status(200).json(dashboard)
    }

    if (req.method === 'POST') {
      const { suggestionIndex, action } = req.body

      if (action === 'approve') {
        const dashboard = await ReorderAutopilotService.getAutopilotDashboard(ctx.businessId)
        const suggestion = dashboard.suggestions[suggestionIndex]

        if (!suggestion) {
          return res.status(404).json({ error: 'Suggestion not found' })
        }

        const order = await ReorderAutopilotService.createReorderFromSuggestion(
          ctx.businessId,
          suggestion,
          ctx.userId
        )
        return res.status(201).json({ order, message: 'Order created successfully' })
      }

      if (action === 'dismiss') {
        const dashboard = await ReorderAutopilotService.getAutopilotDashboard(ctx.businessId)
        const suggestion = dashboard.suggestions[suggestionIndex]

        if (suggestion) {
          await ReorderAutopilotService.logReorderAction(
            ctx.businessId,
            suggestion,
            ctx.userId,
            'dismissed'
          )
        }
        return res.status(200).json({ message: 'Suggestion dismissed' })
      }

      return res.status(400).json({ error: 'Invalid action' })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('Reorder autopilot API error:', error)
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    })
  }
}

export default requirePermission('inventory.read')(handler)
