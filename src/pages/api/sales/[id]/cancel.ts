import type { NextApiRequest, NextApiResponse } from 'next'
import { requirePermission } from '@/lib/middleware/permission.middleware'
import { resolveBusinessContext } from '@/lib/api/business-context'
import { SalesService } from '@/lib/services/sales.service'
import { cancelSaleSchema } from '@/lib/validations/sales.schema'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const ctx = await resolveBusinessContext(req, res)
  if (!ctx) return

  const { id } = req.query
  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid sale ID' })
  }

  try {
    const input = cancelSaleSchema.parse(req.body)
    const cancelledSale = await SalesService.cancelSale(id, input, ctx.businessId)
    
    return res.status(200).json({
      success: true,
      sale: cancelledSale,
      message: 'Order cancelled successfully'
    })
  } catch (error) {
    console.error('Sale cancellation error:', error)
    return res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to cancel order',
    })
  }
}

export default requirePermission('orders.update')(handler)
