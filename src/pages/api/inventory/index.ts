import type { NextApiRequest, NextApiResponse } from 'next'
import { requirePermission } from '@/lib/middleware/permission.middleware'
import { resolveBusinessContext } from '@/lib/api/business-context'
import { InventoryService } from '@/lib/services/inventory.service'
import { createInventoryItemSchema } from '@/lib/validations/inventory.schema'
import { getPaginationParams, getPaginationMeta, createPaginatedResponse } from '@/lib/middleware/pagination'
import { withRateLimit } from '@/lib/middleware/withRateLimit'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const ctx = await resolveBusinessContext(req, res)
  if (!ctx) return

  const { businessId } = ctx

  try {
    if (req.method === 'GET') {
      const { page, limit, skip } = getPaginationParams(req)
      
      const allItems = await InventoryService.getItems(businessId)
      
      // Apply pagination
      const paginatedItems = allItems.slice(skip, skip + limit)
      const meta = getPaginationMeta(page, limit, allItems.length)
      
      return res.status(200).json(createPaginatedResponse(paginatedItems, meta))
    }

    if (req.method === 'POST') {
      const input = createInventoryItemSchema.parse({
        ...req.body,
        businessId,
      })
      const item = await InventoryService.createItem(input)
      return res.status(201).json(item)
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('Inventory API error:', error)
    return res.status(400).json({ 
      error: error instanceof Error ? error.message : 'Invalid request' 
    })
  }
}

export default withRateLimit(
  requirePermission('inventory.read')(handler),
  { windowMs: 60 * 1000, maxRequests: 100 }
)
