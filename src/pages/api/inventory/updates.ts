import type { NextApiRequest, NextApiResponse } from 'next'
import { requirePermission } from '@/lib/middleware/permission.middleware'
import { resolveBusinessContext } from '@/lib/api/business-context'
import { InventoryService } from '@/lib/services/inventory.service'
import { inventoryUpdateSchema } from '@/lib/validations/inventory.schema'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const ctx = await resolveBusinessContext(req, res)
  if (!ctx) return

  const { userId, businessId } = ctx

  try {
    if (req.method === 'POST') {
      const input = inventoryUpdateSchema.parse(req.body)
      const result = await InventoryService.recordUpdate(userId, businessId, input)
      return res.status(201).json(result)
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('Inventory update API error:', error)
    return res.status(400).json({ 
      error: error instanceof Error ? error.message : 'Invalid request' 
    })
  }
}

export default requirePermission('inventory.update')(handler)
