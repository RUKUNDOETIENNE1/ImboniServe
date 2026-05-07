import type { NextApiRequest, NextApiResponse } from 'next'
import { requirePermission } from '@/lib/middleware/permission.middleware'
import { resolveBusinessContext } from '@/lib/api/business-context'
import { InventoryService } from '@/lib/services/inventory.service'
import { updateInventoryItemSchema } from '@/lib/validations/inventory.schema'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const ctx = await resolveBusinessContext(req, res)
  if (!ctx) return

  const { businessId } = ctx
  const { id } = req.query

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid inventory item ID' })
  }

  try {
    if (req.method === 'GET') {
      const item = await InventoryService.getItemById(id, businessId)
      if (!item) {
        return res.status(404).json({ error: 'Item not found' })
      }
      return res.status(200).json(item)
    }

    if (req.method === 'PUT' || req.method === 'PATCH') {
      const input = updateInventoryItemSchema.parse(req.body)
      const item = await InventoryService.updateItem(id, input, businessId)
      return res.status(200).json(item)
    }

    if (req.method === 'DELETE') {
      await InventoryService.deleteItem(id, businessId)
      return res.status(204).end()
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('Inventory item API error:', error)
    return res.status(400).json({ 
      error: error instanceof Error ? error.message : 'Invalid request' 
    })
  }
}

export default requirePermission('inventory.update')(handler)
