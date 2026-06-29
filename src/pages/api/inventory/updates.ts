import type { NextApiRequest, NextApiResponse } from 'next'
import { requirePermission } from '@/lib/middleware/permission.middleware'
import { resolveBusinessContext } from '@/lib/api/business-context'
import { InventoryService } from '@/lib/services/inventory.service'
import { inventoryUpdateSchema } from '@/lib/validations/inventory.schema'
import { prisma } from '@/lib/prisma'
import { ingestInventoryShadowEvent } from '@/lib/die/business-as-plugin/inventory/inventory.shadow'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const ctx = await resolveBusinessContext(req, res)
  if (!ctx) return

  const { userId, businessId } = ctx

  try {
    if (req.method === 'POST') {
      const input = inventoryUpdateSchema.parse(req.body)

      // Read-only snapshot before update for shadow metrics
      const preItem = await prisma.inventoryItem.findFirst({
        where: { id: input.inventoryItemId, businessId },
        select: { id: true, name: true, unit: true, currentStock: true, minStockLevel: true },
      })

      const result = await InventoryService.recordUpdate(userId, businessId, input)

      // Shadow taps (feature-flagged within ingestor), non-blocking
      if (preItem) {
        const previousStock = preItem.currentStock
        const newStock = result.updatedItem.currentStock
        const minStockLevel = preItem.minStockLevel

        // Always emit STOCK_UPDATED
        ingestInventoryShadowEvent({
          type: 'STOCK_UPDATED',
          businessId,
          inventoryItemId: preItem.id,
          itemName: preItem.name,
          unit: preItem.unit,
          previousStock,
          newStock,
          minStockLevel,
          quantity: input.quantity,
        }).catch(() => {})

        // Map input types to additional normalized events
        if (input.type === 'ADD') {
          ingestInventoryShadowEvent({
            type: 'STOCK_RESTOCKED',
            businessId,
            inventoryItemId: preItem.id,
            itemName: preItem.name,
            unit: preItem.unit,
            previousStock,
            newStock,
            minStockLevel,
            quantity: input.quantity,
          }).catch(() => {})
        }

        if (input.type === 'WASTE') {
          ingestInventoryShadowEvent({
            type: 'INVENTORY_WASTE_RECORDED',
            businessId,
            inventoryItemId: preItem.id,
            itemName: preItem.name,
            unit: preItem.unit,
            previousStock,
            newStock,
            minStockLevel,
            quantity: input.quantity,
          }).catch(() => {})
        }

        if (input.type === 'ADJUSTMENT') {
          ingestInventoryShadowEvent({
            type: 'INVENTORY_ADJUSTMENT',
            businessId,
            inventoryItemId: preItem.id,
            itemName: preItem.name,
            unit: preItem.unit,
            previousStock,
            newStock,
            minStockLevel,
            quantity: input.quantity,
          }).catch(() => {})
        }

        // Threshold-based signals
        if (newStock <= 0) {
          ingestInventoryShadowEvent({
            type: 'STOCK_OUT',
            businessId,
            inventoryItemId: preItem.id,
            itemName: preItem.name,
            unit: preItem.unit,
            previousStock,
            newStock,
            minStockLevel,
            alertLevel: 'CRITICAL',
          }).catch(() => {})
        } else if (newStock <= minStockLevel) {
          const alertLevel = newStock === 0 ? 'CRITICAL' : newStock < minStockLevel * 0.5 ? 'HIGH' : 'MEDIUM'
          ingestInventoryShadowEvent({
            type: 'STOCK_LOW',
            businessId,
            inventoryItemId: preItem.id,
            itemName: preItem.name,
            unit: preItem.unit,
            previousStock,
            newStock,
            minStockLevel,
            alertLevel,
          }).catch(() => {})
        }

        // Breach detection: crossing minStockLevel boundary
        const wasAbove = previousStock > minStockLevel
        const nowAbove = newStock > minStockLevel
        if (wasAbove !== nowAbove) {
          ingestInventoryShadowEvent({
            type: 'INVENTORY_THRESHOLD_BREACH',
            businessId,
            inventoryItemId: preItem.id,
            itemName: preItem.name,
            unit: preItem.unit,
            previousStock,
            newStock,
            minStockLevel,
            breachFromAbove: wasAbove && !nowAbove,
          }).catch(() => {})
        }
      }

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
