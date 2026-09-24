import { z } from 'zod'

// Recipe lifecycle states
export const RecipeLifecycleState = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  ARCHIVED: 'ARCHIVED',
} as const

export type RecipeLifecycleState = typeof RecipeLifecycleState[keyof typeof RecipeLifecycleState]

// Recipe ingredient input schema
export const recipeIngredientInputSchema = z.object({
  inventoryItemId: z.string().cuid().optional().nullable(),
  subRecipeId: z.string().cuid().optional().nullable(),
  quantity: z.number().positive('Quantity must be greater than 0'),
  unit: z.string().min(1, 'Unit is required'),
  yieldFactor: z.number().positive().default(1.0),
  isOptional: z.boolean().default(false),
  displayOrder: z.number().int().nonnegative().default(0),
}).refine(
  (data) => data.inventoryItemId || data.subRecipeId,
  { message: 'Either inventoryItemId or subRecipeId must be provided' }
).refine(
  (data) => !(data.inventoryItemId && data.subRecipeId),
  { message: 'Cannot specify both inventoryItemId and subRecipeId' }
)

// Create recipe input schema
export const createRecipeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  menuItemId: z.string().cuid().optional().nullable(),
  yieldQuantity: z.number().positive('Yield quantity must be greater than 0'),
  yieldUnit: z.string().min(1, 'Yield unit is required'),
  notes: z.string().optional().nullable(),
  ingredients: z.array(recipeIngredientInputSchema).optional().default([]),
})

// Update draft recipe input schema
export const updateDraftRecipeSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  menuItemId: z.string().cuid().optional().nullable(),
  yieldQuantity: z.number().positive().optional(),
  yieldUnit: z.string().min(1).optional(),
  notes: z.string().optional().nullable(),
  ingredients: z.array(recipeIngredientInputSchema).optional(),
})

// Duplicate recipe input schema
export const duplicateRecipeSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  menuItemId: z.string().cuid().optional().nullable(),
})

// List recipes query schema
export const listRecipesQuerySchema = z.object({
  menuItemId: z.string().cuid().optional(),
  isActive: z.enum(['true', 'false']).optional().transform(v => v === 'true'),
  lifecycleState: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  search: z.string().optional(),
  page: z.string().optional().transform(v => v ? parseInt(v, 10) : 1),
  limit: z.string().optional().transform(v => v ? parseInt(v, 10) : 20),
})

// Type exports
export type RecipeIngredientInput = z.infer<typeof recipeIngredientInputSchema>
export type CreateRecipeInput = z.infer<typeof createRecipeSchema>
export type UpdateDraftRecipeInput = z.infer<typeof updateDraftRecipeSchema>
export type DuplicateRecipeInput = z.infer<typeof duplicateRecipeSchema>
export type ListRecipesQuery = z.infer<typeof listRecipesQuerySchema>
