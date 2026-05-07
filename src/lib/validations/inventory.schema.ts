import { z } from 'zod'

export const createInventoryItemSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  category: z.string().optional(),
  unit: z.string().min(1),
  currentStock: z.number().nonnegative(),
  minStockLevel: z.number().nonnegative(),
  unitCostCents: z.number().int().positive(),
  businessId: z.string().cuid(),
})

export const updateInventoryItemSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  unit: z.string().min(1).optional(),
  currentStock: z.number().nonnegative().optional(),
  minStockLevel: z.number().nonnegative().optional(),
  unitCostCents: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
})

export const inventoryUpdateSchema = z.object({
  inventoryItemId: z.string().cuid(),
  type: z.enum(['ADD', 'REMOVE', 'WASTE', 'ADJUSTMENT']),
  quantity: z.number().positive(),
  reason: z.string().optional(),
  notes: z.string().optional(),
})

export type CreateInventoryItemInput = z.infer<typeof createInventoryItemSchema>
export type UpdateInventoryItemInput = z.infer<typeof updateInventoryItemSchema>
export type InventoryUpdateInput = z.infer<typeof inventoryUpdateSchema>
