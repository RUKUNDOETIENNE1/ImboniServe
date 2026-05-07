import type { NextApiRequest, NextApiResponse } from 'next'
import { MarketplaceService } from '@/lib/services/marketplace.service'
import { requirePermission } from '@/lib/middleware/permission.middleware'
import { resolveBusinessContext } from '@/lib/api/business-context'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const ctx = await resolveBusinessContext(req, res)
  if (!ctx) return

  const isAdmin = (ctx.roles || []).includes('ADMIN')

  if (req.method === 'GET') {
    try {
      const { businessId, userId, status } = req.query
      const resolvedBusinessId = (isAdmin ? businessId as string : undefined) || ctx.businessId

      if (businessId && !isAdmin && businessId !== ctx.businessId) {
        return res.status(403).json({ error: 'Forbidden' })
      }

      const orders = await MarketplaceService.getOrders({
        businessId: resolvedBusinessId,
        userId: userId as string,
        status: status as string,
      })
      return res.status(200).json(orders)
    } catch (error: any) {
      return res.status(500).json({ error: error.message })
    }
  }

  if (req.method === 'POST') {
    try {
      const bodyBusinessId = req.body?.businessId as string
      const effectiveBusinessId = isAdmin ? bodyBusinessId : ctx.businessId

      if (!effectiveBusinessId) {
        return res.status(400).json({ error: 'businessId is required' })
      }
      if (!isAdmin && bodyBusinessId && bodyBusinessId !== ctx.businessId) {
        return res.status(403).json({ error: 'Forbidden' })
      }

      const order = await MarketplaceService.createOrder({
        ...req.body,
        businessId: effectiveBusinessId,
        userId: ctx.userId,
      })
      return res.status(201).json(order)
    } catch (error: any) {
      return res.status(500).json({ error: error.message })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

export default requirePermission('orders.read')(handler)
