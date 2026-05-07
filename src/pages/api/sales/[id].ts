import type { NextApiRequest, NextApiResponse } from 'next'
import { requirePermission } from '@/lib/middleware/permission.middleware'
import { resolveBusinessContext } from '@/lib/api/business-context'
import { SalesService } from '@/lib/services/sales.service'
import { updateSaleSchema } from '@/lib/validations/sales.schema'

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

export default requirePermission('orders.read')(handler)
