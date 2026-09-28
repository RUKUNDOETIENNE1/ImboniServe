import type { NextApiRequest, NextApiResponse } from 'next'
import { requirePermission } from '@/lib/middleware/permission.middleware'
import { resolveBusinessContext } from '@/lib/api/business-context'
import { SalesService } from '@/lib/services/sales.service'
import { updateSaleSchema } from '@/lib/validations/sales.schema'
import { getUserEffectivePermissions, hasPermission } from '@/lib/permissions/staff'

const BASE_ROLES = ['ADMIN', 'MANAGER', 'CASHIER', 'FRONT_DESK', 'WAITER', 'KITCHEN_MANAGER'] as const

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const ctx = await resolveBusinessContext(req, res)
  if (!ctx) return

  const { id } = req.query
  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid sale ID' })
  }

  try {
    if (req.method === 'GET') {
      const sale = await SalesService.getSaleById(id, ctx.businessId)
      if (!sale) {
        return res.status(404).json({ error: 'Sale not found' })
      }
      return res.status(200).json(sale)
    }

    if (req.method === 'PUT' || req.method === 'PATCH') {
      const input = updateSaleSchema.parse(req.body)

      // Phase 3R — P1-2: payment-affecting fields additionally require the
      // payment permission. orders.update alone must not mark a sale paid.
      const touchesPayment =
        input.paymentStatus !== undefined ||
        input.isPaid !== undefined ||
        input.paymentReference !== undefined

      if (touchesPayment && !ctx.roles.includes('OWNER') && !ctx.roles.includes('ADMIN')) {
        const baseRoles = ctx.roles.filter(r => (BASE_ROLES as readonly string[]).includes(r) && r !== 'ADMIN') as any
        const perms =
          (req as any).userPermissions ??
          (await getUserEffectivePermissions(ctx.userId, ctx.businessId, baseRoles))
        if (!hasPermission(perms, 'payments.create')) {
          return res.status(403).json({ error: 'Insufficient permissions for payment mutation' })
        }
      }

      const sale = await SalesService.updateSale(id, input, ctx.businessId)
      return res.status(200).json(sale)
    }

    if (req.method === 'DELETE') {
      await SalesService.deleteSale(id, ctx.businessId)
      return res.status(204).end()
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('Sale API error:', error)
    return res.status(400).json({
      error: error instanceof Error ? error.message : 'Invalid request',
    })
  }
}

// Phase 3R — P1-2: method-level authorization. A read permission must not
// authorize mutations; payment-field changes additionally require
// payments.create (enforced inside the PUT/PATCH branch); deletes require
// the refund-level mutation permission.
export default async function dispatch(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return requirePermission('orders.read')(handler)(req, res)
  }
  if (req.method === 'PUT' || req.method === 'PATCH') {
    return requirePermission('orders.update')(handler)(req, res)
  }
  if (req.method === 'DELETE') {
    return requirePermission('orders.refund')(handler)(req, res)
  }
  return handler(req, res)
}
