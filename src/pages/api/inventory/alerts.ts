import type { NextApiRequest, NextApiResponse } from 'next'
import { requirePermission } from '@/lib/middleware/permission.middleware'
import { resolveBusinessContext } from '@/lib/api/business-context'
import { InventoryService } from '@/lib/services/inventory.service'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const ctx = await resolveBusinessContext(req, res)
  if (!ctx) return

  const { businessId } = ctx

  try {
    if (req.method === 'GET') {
      const alerts = await InventoryService.getStockAlerts(businessId)
      return res.status(200).json(alerts)
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('Inventory alerts API error:', error)
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    })
  }
}

export default requirePermission('inventory.read')(handler)
