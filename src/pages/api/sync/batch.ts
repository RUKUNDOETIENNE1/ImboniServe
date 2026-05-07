import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { SalesService } from '@/lib/services/sales.service'
import { InventoryService } from '@/lib/services/inventory.service'
import { createSaleSchema } from '@/lib/validations/sales.schema'
import { withRateLimit } from '@/lib/middleware/withRateLimit'

interface BatchSyncItem {
  id: string
  type: 'SALE' | 'INVENTORY' | 'PAYMENT' | 'SLIP' | 'CONSENT'
  payload: any
  timestamp: number
}

interface BatchSyncRequest {
  items: BatchSyncItem[]
}

interface BatchSyncResult {
  success: string[]
  failed: Array<{
    id: string
    error: string
  }>
}

/**
 * Batch sync endpoint for offline data
 * Accepts multiple items and syncs them in order
 */
async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)
    if (!session?.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { items } = req.body as BatchSyncRequest

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Invalid batch sync request' })
    }

    // Limit batch size to prevent abuse
    if (items.length > 100) {
      return res.status(400).json({ 
        error: 'Batch size too large. Maximum 100 items per request.' 
      })
    }

    const result: BatchSyncResult = {
      success: [],
      failed: [],
    }

    // Process items sequentially to maintain order
    for (const item of items) {
      try {
        await syncItem(item, session.user as any)
        result.success.push(item.id)
      } catch (error) {
        result.failed.push({
          id: item.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return res.status(200).json(result)
  } catch (error) {
    console.error('Batch sync error:', error)
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Batch sync failed' 
    })
  }
}

/**
 * Sync a single item based on its type
 */
async function syncItem(item: BatchSyncItem, user: any) {
  switch (item.type) {
    case 'SALE':
      const saleInput = createSaleSchema.parse(item.payload)
      await SalesService.createSale(user.id, saleInput)
      break

    case 'INVENTORY':
      // Inventory updates would go here
      // await InventoryService.updateItem(item.payload)
      break

    case 'PAYMENT':
      // Payment sync would go here
      break

    case 'SLIP':
      // Smart dining slip sync would go here
      break

    case 'CONSENT':
      // Consent sync would go here
      break

    default:
      throw new Error(`Unknown sync item type: ${item.type}`)
  }
}

export default withRateLimit(handler, {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10, // 10 batch syncs per minute
})
