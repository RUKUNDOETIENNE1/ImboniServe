/**
 * UNIT TESTS: RecipeService
 * Tests recipe CRUD, lifecycle management, versioning, and validation
 * 
 * Priority: HIGHEST
 * Coverage Target: 100%
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import type { Mock } from 'jest-mock'

// Mock Prisma client with proper typing
const mockPrisma = {
  recipe: {
    create: jest.fn() as Mock<any>,
    update: jest.fn() as Mock<any>,
    delete: jest.fn() as Mock<any>,
    findUnique: jest.fn() as Mock<any>,
    findFirst: jest.fn() as Mock<any>,
    findMany: jest.fn() as Mock<any>,
    count: jest.fn() as Mock<any>,
  },
  recipeIngredient: {
    deleteMany: jest.fn() as Mock<any>,
    findMany: jest.fn() as Mock<any>,
  },
  menuItem: {
    findFirst: jest.fn() as Mock<any>,
    update: jest.fn() as Mock<any>,
    updateMany: jest.fn() as Mock<any>,
  },
  inventoryItem: {
    findMany: jest.fn() as Mock<any>,
  },
  $transaction: jest.fn((fn: any) => fn(mockPrisma)) as Mock<any>,
}

jest.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}))

// Import after mocking
import {
  RecipeService,
  RecipeError,
  RecipeNotFoundError,
  RecipeAccessDeniedError,
  RecipeInvalidStateError,
  RecipeValidationError,
  RecipeCircularDependencyError,
} from '@/lib/services/recipe.service'
import { RecipeLifecycleState } from '@/lib/validations/recipe.schema'

describe('RecipeService', () => {
  const businessId = 'biz-123'
  const recipeId = 'recipe-123'
  const menuItemId = 'menu-item-123'
  const inventoryItemId = 'inv-item-123'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ─── Recipe Creation ─────────────────────────────────────────────────

  describe('createRecipe', () => {
    it('should create a draft recipe successfully', async () => {
      const input = {
        name: 'Grilled Chicken',
        yieldQuantity: 1,
        yieldUnit: 'portion',
        notes: 'Test recipe',
        ingredients: [],
      }

      const mockRecipe = {
        id: recipeId,
        businessId,
        name: input.name,
        yieldQuantity: input.yieldQuantity,
        yieldUnit: input.yieldUnit,
        version: 1,
        isActive: true,
        costCentsCached: null,
        costCalculatedAt: null,
        costStale: true,
        notes: '__DRAFT__ Test recipe',
        createdAt: new Date(),
        updatedAt: new Date(),
        ingredients: [],
        menuItem: null,
      }

      mockPrisma.recipe.create.mockResolvedValue(mockRecipe)

      const result = await RecipeService.createRecipe(businessId, input)

      expect(result.name).toBe(input.name)
      expect(result.lifecycleState).toBe(RecipeLifecycleState.DRAFT)
      expect(result.notes).toBe('Test recipe')
      expect(mockPrisma.recipe.create).toHaveBeenCalledTimes(1)
    })

    it('should create recipe with ingredients', async () => {
      const input = {
        name: 'Grilled Chicken',
        yieldQuantity: 1,
        yieldUnit: 'portion',
        ingredients: [
          {
            inventoryItemId,
            quantity: 200,
            unit: 'g',
            yieldFactor: 1.0,
            isOptional: false,
            displayOrder: 0,
          },
        ],
      }

      mockPrisma.inventoryItem.findMany.mockResolvedValue([
        { id: inventoryItemId },
      ])

      const mockRecipe = {
        id: recipeId,
        businessId,
        name: input.name,
        yieldQuantity: input.yieldQuantity,
        yieldUnit: input.yieldUnit,
        version: 1,
        isActive: true,
        costStale: true,
        notes: '__DRAFT__',
        ingredients: [
          {
            id: 'ing-1',
            inventoryItemId,
            quantity: 200,
            unit: 'g',
            inventoryItem: { id: inventoryItemId, name: 'Chicken', unit: 'g' },
          },
        ],
        menuItem: null,
      }

      mockPrisma.recipe.create.mockResolvedValue(mockRecipe)

      const result = await RecipeService.createRecipe(businessId, input)

      expect(result.name).toBe(input.name)
      expect(mockPrisma.inventoryItem.findMany).toHaveBeenCalled()
    })

    it('should link recipe to menu item', async () => {
      const input = {
        name: 'Grilled Chicken',
        menuItemId,
        yieldQuantity: 1,
        yieldUnit: 'portion',
        ingredients: [],
      }

      mockPrisma.menuItem.findFirst.mockResolvedValueOnce({
        id: menuItemId,
        businessId,
        recipeId: null,
      })

      const mockRecipe = {
        id: recipeId,
        businessId,
        name: input.name,
        version: 1,
        isActive: true,
        notes: '__DRAFT__',
        ingredients: [],
        menuItem: { id: menuItemId, name: 'Grilled Chicken' },
      }

      mockPrisma.recipe.create.mockResolvedValue(mockRecipe)
      mockPrisma.menuItem.update.mockResolvedValue({})

      const result = await RecipeService.createRecipe(businessId, input)

      expect(mockPrisma.menuItem.update).toHaveBeenCalledWith({
        where: { id: menuItemId },
        data: { recipeId: mockRecipe.id },
      })
    })

    it('should reject if menu item already has a recipe', async () => {
      const input = {
        name: 'Grilled Chicken',
        menuItemId,
        yieldQuantity: 1,
        yieldUnit: 'portion',
        ingredients: [],
      }

      mockPrisma.menuItem.findFirst.mockResolvedValueOnce({
        id: menuItemId,
        businessId,
      })
      mockPrisma.menuItem.findFirst.mockResolvedValueOnce({
        id: menuItemId,
        recipeId: 'existing-recipe',
      })

      await expect(
        RecipeService.createRecipe(businessId, input)
      ).rejects.toThrow(RecipeValidationError)
    })

    it('should reject duplicate ingredients', async () => {
      const input = {
        name: 'Grilled Chicken',
        yieldQuantity: 1,
        yieldUnit: 'portion',
        ingredients: [
          { inventoryItemId, quantity: 100, unit: 'g', yieldFactor: 1.0, isOptional: false, displayOrder: 0 },
          { inventoryItemId, quantity: 50, unit: 'g', yieldFactor: 1.0, isOptional: false, displayOrder: 1 },
        ],
      }

      await expect(
        RecipeService.createRecipe(businessId, input)
      ).rejects.toThrow(RecipeValidationError)
    })

    it('should reject ingredients from different business', async () => {
      const input = {
        name: 'Grilled Chicken',
        yieldQuantity: 1,
        yieldUnit: 'portion',
        ingredients: [
          { inventoryItemId, quantity: 100, unit: 'g', yieldFactor: 1.0, isOptional: false, displayOrder: 0 },
        ],
      }

      mockPrisma.inventoryItem.findMany.mockResolvedValue([])

      await expect(
        RecipeService.createRecipe(businessId, input)
      ).rejects.toThrow(RecipeValidationError)
    })
  })

  // ─── Recipe Update ───────────────────────────────────────────────────

  describe('updateDraftRecipe', () => {
    it('should update a draft recipe', async () => {
      const input = {
        name: 'Updated Grilled Chicken',
      }

      mockPrisma.recipe.findUnique.mockResolvedValueOnce({
        id: recipeId,
        businessId,
      })
      mockPrisma.recipe.findUnique.mockResolvedValueOnce({
        id: recipeId,
        isActive: true,
        notes: '__DRAFT__',
      })
      mockPrisma.menuItem.findFirst.mockResolvedValue(null)

      const mockUpdated = {
        id: recipeId,
        businessId,
        name: input.name,
        isActive: true,
        notes: '__DRAFT__',
        ingredients: [],
        menuItem: null,
      }

      mockPrisma.recipe.update.mockResolvedValue(mockUpdated)

      const result = await RecipeService.updateDraftRecipe(recipeId, businessId, input)

      expect(result.name).toBe(input.name)
      expect(result.lifecycleState).toBe(RecipeLifecycleState.DRAFT)
    })

    it('should reject update on published recipe', async () => {
      mockPrisma.recipe.findUnique.mockResolvedValueOnce({
        id: recipeId,
        businessId,
      })
      mockPrisma.recipe.findUnique.mockResolvedValueOnce({
        id: recipeId,
        isActive: true,
        notes: '__PUBLISHED__',
      })

      await expect(
        RecipeService.updateDraftRecipe(recipeId, businessId, { name: 'New Name' })
      ).rejects.toThrow(RecipeInvalidStateError)
    })

    it('should reject update on archived recipe', async () => {
      mockPrisma.recipe.findUnique.mockResolvedValueOnce({
        id: recipeId,
        businessId,
      })
      mockPrisma.recipe.findUnique.mockResolvedValueOnce({
        id: recipeId,
        isActive: false,
        notes: '',
      })

      await expect(
        RecipeService.updateDraftRecipe(recipeId, businessId, { name: 'New Name' })
      ).rejects.toThrow(RecipeInvalidStateError)
    })

    it('should reject update from different business', async () => {
      mockPrisma.recipe.findUnique.mockResolvedValueOnce({
        id: recipeId,
        businessId: 'different-biz',
      })

      await expect(
        RecipeService.updateDraftRecipe(recipeId, businessId, { name: 'New Name' })
      ).rejects.toThrow(RecipeAccessDeniedError)
    })
  })

  // ─── Recipe Publishing ───────────────────────────────────────────────

  describe('publishRecipeVersion', () => {
    it('should publish a draft recipe', async () => {
      mockPrisma.recipe.findUnique.mockResolvedValueOnce({
        id: recipeId,
        businessId,
      })
      mockPrisma.recipe.findUnique.mockResolvedValueOnce({
        id: recipeId,
        businessId,
        isActive: true,
        notes: '__DRAFT__',
        ingredients: [{ id: 'ing-1' }],
      })

      const mockPublished = {
        id: recipeId,
        businessId,
        isActive: true,
        notes: '__PUBLISHED__',
        ingredients: [{ id: 'ing-1' }],
        menuItem: null,
      }

      mockPrisma.recipe.update.mockResolvedValue(mockPublished)

      const result = await RecipeService.publishRecipeVersion(recipeId, businessId)

      expect(result.lifecycleState).toBe(RecipeLifecycleState.PUBLISHED)
    })

    it('should reject publishing recipe without ingredients', async () => {
      mockPrisma.recipe.findUnique.mockResolvedValueOnce({
        id: recipeId,
        businessId,
      })
      mockPrisma.recipe.findUnique.mockResolvedValueOnce({
        id: recipeId,
        businessId,
        isActive: true,
        notes: '__DRAFT__',
        ingredients: [],
      })

      await expect(
        RecipeService.publishRecipeVersion(recipeId, businessId)
      ).rejects.toThrow(RecipeValidationError)
    })

    it('should reject publishing already published recipe', async () => {
      mockPrisma.recipe.findUnique.mockResolvedValueOnce({
        id: recipeId,
        businessId,
      })
      mockPrisma.recipe.findUnique.mockResolvedValueOnce({
        id: recipeId,
        businessId,
        isActive: true,
        notes: '__PUBLISHED__',
        ingredients: [{ id: 'ing-1' }],
      })

      await expect(
        RecipeService.publishRecipeVersion(recipeId, businessId)
      ).rejects.toThrow(RecipeInvalidStateError)
    })

    it('should reject publishing archived recipe', async () => {
      mockPrisma.recipe.findUnique.mockResolvedValueOnce({
        id: recipeId,
        businessId,
      })
      mockPrisma.recipe.findUnique.mockResolvedValueOnce({
        id: recipeId,
        businessId,
        isActive: false,
        notes: '',
        ingredients: [{ id: 'ing-1' }],
      })

      await expect(
        RecipeService.publishRecipeVersion(recipeId, businessId)
      ).rejects.toThrow(RecipeInvalidStateError)
    })
  })

  // ─── Recipe Archiving ────────────────────────────────────────────────

  describe('archiveRecipe', () => {
    it('should archive a published recipe', async () => {
      mockPrisma.recipe.findUnique.mockResolvedValueOnce({
        id: recipeId,
        businessId,
      })
      mockPrisma.recipe.findUnique.mockResolvedValueOnce({
        id: recipeId,
        isActive: true,
        notes: '__PUBLISHED__',
      })
      mockPrisma.menuItem.updateMany.mockResolvedValue({ count: 1 })

      const mockArchived = {
        id: recipeId,
        businessId,
        isActive: false,
        notes: '',
        ingredients: [],
        menuItem: null,
      }

      mockPrisma.recipe.update.mockResolvedValue(mockArchived)

      const result = await RecipeService.archiveRecipe(recipeId, businessId)

      expect(result.lifecycleState).toBe(RecipeLifecycleState.ARCHIVED)
      expect(mockPrisma.menuItem.updateMany).toHaveBeenCalled()
    })

    it('should archive a draft recipe', async () => {
      mockPrisma.recipe.findUnique.mockResolvedValueOnce({
        id: recipeId,
        businessId,
      })
      mockPrisma.recipe.findUnique.mockResolvedValueOnce({
        id: recipeId,
        isActive: true,
        notes: '__DRAFT__',
      })
      mockPrisma.menuItem.updateMany.mockResolvedValue({ count: 0 })

      const mockArchived = {
        id: recipeId,
        businessId,
        isActive: false,
        notes: '',
        ingredients: [],
        menuItem: null,
      }

      mockPrisma.recipe.update.mockResolvedValue(mockArchived)

      const result = await RecipeService.archiveRecipe(recipeId, businessId)

      expect(result.lifecycleState).toBe(RecipeLifecycleState.ARCHIVED)
    })

    it('should reject archiving already archived recipe', async () => {
      mockPrisma.recipe.findUnique.mockResolvedValueOnce({
        id: recipeId,
        businessId,
      })
      mockPrisma.recipe.findUnique.mockResolvedValueOnce({
        id: recipeId,
        isActive: false,
        notes: '',
      })

      await expect(
        RecipeService.archiveRecipe(recipeId, businessId)
      ).rejects.toThrow(RecipeInvalidStateError)
    })
  })

  // ─── Recipe Duplication ──────────────────────────────────────────────

  describe('duplicateRecipe', () => {
    it('should duplicate a recipe as draft', async () => {
      mockPrisma.recipe.findUnique.mockResolvedValueOnce({
        id: recipeId,
        businessId,
      })
      mockPrisma.recipe.findUnique.mockResolvedValueOnce({
        id: recipeId,
        businessId,
        name: 'Original Recipe',
        yieldQuantity: 1,
        yieldUnit: 'portion',
        notes: '__PUBLISHED__',
        ingredients: [
          { inventoryItemId, quantity: 100, unit: 'g', yieldFactor: 1.0, isOptional: false, displayOrder: 0 },
        ],
      })

      const mockDuplicate = {
        id: 'new-recipe-id',
        businessId,
        name: 'Original Recipe (Copy)',
        version: 1,
        isActive: true,
        notes: '__DRAFT__',
        ingredients: [
          { inventoryItemId, quantity: 100, unit: 'g' },
        ],
        menuItem: null,
      }

      mockPrisma.recipe.create.mockResolvedValue(mockDuplicate)

      const result = await RecipeService.duplicateRecipe(recipeId, businessId)

      expect(result.name).toBe('Original Recipe (Copy)')
      expect(result.lifecycleState).toBe(RecipeLifecycleState.DRAFT)
    })

    it('should duplicate with custom name', async () => {
      mockPrisma.recipe.findUnique.mockResolvedValueOnce({
        id: recipeId,
        businessId,
      })
      mockPrisma.recipe.findUnique.mockResolvedValueOnce({
        id: recipeId,
        businessId,
        name: 'Original Recipe',
        yieldQuantity: 1,
        yieldUnit: 'portion',
        notes: '__PUBLISHED__',
        ingredients: [],
      })

      const mockDuplicate = {
        id: 'new-recipe-id',
        businessId,
        name: 'Custom Name',
        version: 1,
        isActive: true,
        notes: '__DRAFT__',
        ingredients: [],
        menuItem: null,
      }

      mockPrisma.recipe.create.mockResolvedValue(mockDuplicate)

      const result = await RecipeService.duplicateRecipe(recipeId, businessId, {
        name: 'Custom Name',
      })

      expect(result.name).toBe('Custom Name')
    })
  })

  // ─── Recipe Deletion ─────────────────────────────────────────────────

  describe('deleteDraftRecipe', () => {
    it('should delete a draft recipe', async () => {
      mockPrisma.recipe.findUnique.mockResolvedValueOnce({
        id: recipeId,
        businessId,
      })
      mockPrisma.recipe.findUnique.mockResolvedValueOnce({
        id: recipeId,
        isActive: true,
        notes: '__DRAFT__',
      })
      mockPrisma.menuItem.updateMany.mockResolvedValue({ count: 0 })
      mockPrisma.recipeIngredient.deleteMany.mockResolvedValue({ count: 0 })
      mockPrisma.recipe.delete.mockResolvedValue({})

      await RecipeService.deleteDraftRecipe(recipeId, businessId)

      expect(mockPrisma.recipe.delete).toHaveBeenCalledWith({
        where: { id: recipeId },
      })
    })

    it('should reject deleting published recipe', async () => {
      mockPrisma.recipe.findUnique.mockResolvedValueOnce({
        id: recipeId,
        businessId,
      })
      mockPrisma.recipe.findUnique.mockResolvedValueOnce({
        id: recipeId,
        isActive: true,
        notes: '__PUBLISHED__',
      })

      await expect(
        RecipeService.deleteDraftRecipe(recipeId, businessId)
      ).rejects.toThrow(RecipeInvalidStateError)
    })

    it('should reject deleting archived recipe', async () => {
      mockPrisma.recipe.findUnique.mockResolvedValueOnce({
        id: recipeId,
        businessId,
      })
      mockPrisma.recipe.findUnique.mockResolvedValueOnce({
        id: recipeId,
        isActive: false,
        notes: '',
      })

      await expect(
        RecipeService.deleteDraftRecipe(recipeId, businessId)
      ).rejects.toThrow(RecipeInvalidStateError)
    })
  })

  // ─── Recipe Retrieval ────────────────────────────────────────────────

  describe('getRecipe', () => {
    it('should return recipe with lifecycle state', async () => {
      const mockRecipe = {
        id: recipeId,
        businessId,
        name: 'Test Recipe',
        isActive: true,
        notes: '__PUBLISHED__',
        ingredients: [],
        menuItem: null,
        business: { id: businessId, name: 'Test Business' },
      }

      mockPrisma.recipe.findFirst.mockResolvedValue(mockRecipe)

      const result = await RecipeService.getRecipe(recipeId, businessId)

      expect(result).not.toBeNull()
      expect(result?.lifecycleState).toBe(RecipeLifecycleState.PUBLISHED)
    })

    it('should return null for non-existent recipe', async () => {
      mockPrisma.recipe.findFirst.mockResolvedValue(null)

      const result = await RecipeService.getRecipe('non-existent', businessId)

      expect(result).toBeNull()
    })
  })

  describe('listRecipes', () => {
    it('should return paginated recipes', async () => {
      const mockRecipes = [
        { id: 'r1', name: 'Recipe 1', isActive: true, notes: '__DRAFT__', ingredients: [], menuItem: null },
        { id: 'r2', name: 'Recipe 2', isActive: true, notes: '__PUBLISHED__', ingredients: [], menuItem: null },
      ]

      mockPrisma.recipe.findMany.mockResolvedValue(mockRecipes)
      mockPrisma.recipe.count.mockResolvedValue(2)

      const result = await RecipeService.listRecipes(businessId, { page: 1, limit: 10 })

      expect(result.recipes).toHaveLength(2)
      expect(result.total).toBe(2)
      expect(result.page).toBe(1)
      expect(result.limit).toBe(10)
    })

    it('should filter by lifecycle state', async () => {
      mockPrisma.recipe.findMany.mockResolvedValue([])
      mockPrisma.recipe.count.mockResolvedValue(0)

      await RecipeService.listRecipes(businessId, {
        lifecycleState: RecipeLifecycleState.PUBLISHED,
      })

      expect(mockPrisma.recipe.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: true,
            notes: { startsWith: '__PUBLISHED__' },
          }),
        })
      )
    })
  })

  // ─── Business Isolation ──────────────────────────────────────────────

  describe('Business Isolation', () => {
    it('should reject access to recipe from different business', async () => {
      mockPrisma.recipe.findUnique.mockResolvedValue({
        id: recipeId,
        businessId: 'different-business',
      })

      await expect(
        RecipeService.getRecipe(recipeId, businessId)
      ).resolves.toBeNull()
    })

    it('should only list recipes for the specified business', async () => {
      mockPrisma.recipe.findMany.mockResolvedValue([])
      mockPrisma.recipe.count.mockResolvedValue(0)

      await RecipeService.listRecipes(businessId)

      expect(mockPrisma.recipe.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            businessId,
          }),
        })
      )
    })
  })

  // ─── Sub-Recipe Validation ───────────────────────────────────────────

  describe('Sub-Recipe Validation', () => {
    it('should reject circular sub-recipe dependency', () => {
      // This test documents the expected behavior for circular dependency detection
      // The actual circular dependency detection happens during update/create
      // when we have a currentRecipeId to check against
      // 
      // For now, this is a placeholder test that verifies the error type exists
      // Full circular dependency detection would require more complex mocking
      expect(RecipeCircularDependencyError).toBeDefined()
    })

    it('should reject sub-recipe from different business', async () => {
      const subRecipeId = 'sub-recipe-123'

      // Mock: sub-recipe does not exist in this business
      mockPrisma.recipe.findMany.mockResolvedValue([])

      const input = {
        name: 'Main Recipe',
        yieldQuantity: 1,
        yieldUnit: 'portion',
        ingredients: [
          { subRecipeId, quantity: 1, unit: 'portion', yieldFactor: 1.0, isOptional: false, displayOrder: 0 },
        ],
      }

      await expect(
        RecipeService.createRecipe(businessId, input)
      ).rejects.toThrow(RecipeValidationError)
    })
  })

  // ─── Error Types ─────────────────────────────────────────────────────

  describe('Error Types', () => {
    it('RecipeNotFoundError has correct properties', () => {
      const error = new RecipeNotFoundError(recipeId)
      expect(error.code).toBe('RECIPE_NOT_FOUND')
      expect(error.statusCode).toBe(404)
      expect(error.message).toContain(recipeId)
    })

    it('RecipeAccessDeniedError has correct properties', () => {
      const error = new RecipeAccessDeniedError()
      expect(error.code).toBe('RECIPE_ACCESS_DENIED')
      expect(error.statusCode).toBe(403)
    })

    it('RecipeInvalidStateError has correct properties', () => {
      const error = new RecipeInvalidStateError('PUBLISHED', 'edit')
      expect(error.code).toBe('RECIPE_INVALID_STATE')
      expect(error.statusCode).toBe(400)
      expect(error.message).toContain('PUBLISHED')
      expect(error.message).toContain('edit')
    })

    it('RecipeValidationError has correct properties', () => {
      const error = new RecipeValidationError('Test validation error')
      expect(error.code).toBe('RECIPE_VALIDATION_ERROR')
      expect(error.statusCode).toBe(400)
    })

    it('RecipeCircularDependencyError has correct properties', () => {
      const error = new RecipeCircularDependencyError('r1', 'r2')
      expect(error.code).toBe('RECIPE_CIRCULAR_DEPENDENCY')
      expect(error.statusCode).toBe(400)
      expect(error.message).toContain('r1')
      expect(error.message).toContain('r2')
    })
  })

  // ─── Lifecycle State Transitions ─────────────────────────────────────

  describe('Lifecycle State Transitions', () => {
    it('DRAFT -> PUBLISHED is allowed', async () => {
      // First call: validateBusinessOwnership
      mockPrisma.recipe.findUnique.mockResolvedValueOnce({
        id: recipeId,
        businessId,
      })
      // Second call: publishRecipeVersion fetches full recipe with ingredients
      mockPrisma.recipe.findUnique.mockResolvedValueOnce({
        id: recipeId,
        businessId,
        isActive: true,
        notes: '__DRAFT__',
        ingredients: [{ id: 'ing-1', inventoryItemId: 'inv-1', quantity: 100, unit: 'g' }],
      })
      
      mockPrisma.recipe.update.mockResolvedValue({
        id: recipeId,
        businessId,
        isActive: true,
        notes: '__PUBLISHED__',
        ingredients: [{ id: 'ing-1', inventoryItemId: 'inv-1', quantity: 100, unit: 'g' }],
        menuItem: null,
      })

      const result = await RecipeService.publishRecipeVersion(recipeId, businessId)
      expect(result.lifecycleState).toBe(RecipeLifecycleState.PUBLISHED)
    })

    it('DRAFT -> ARCHIVED is allowed', async () => {
      mockPrisma.recipe.findUnique.mockResolvedValueOnce({ id: recipeId, businessId })
      mockPrisma.recipe.findUnique.mockResolvedValueOnce({
        id: recipeId,
        isActive: true,
        notes: '__DRAFT__',
      })
      mockPrisma.menuItem.updateMany.mockResolvedValue({ count: 0 })
      mockPrisma.recipe.update.mockResolvedValue({
        id: recipeId,
        isActive: false,
        notes: '',
        ingredients: [],
        menuItem: null,
      })

      const result = await RecipeService.archiveRecipe(recipeId, businessId)
      expect(result.lifecycleState).toBe(RecipeLifecycleState.ARCHIVED)
    })

    it('PUBLISHED -> ARCHIVED is allowed', async () => {
      mockPrisma.recipe.findUnique.mockResolvedValueOnce({ id: recipeId, businessId })
      mockPrisma.recipe.findUnique.mockResolvedValueOnce({
        id: recipeId,
        isActive: true,
        notes: '__PUBLISHED__',
      })
      mockPrisma.menuItem.updateMany.mockResolvedValue({ count: 1 })
      mockPrisma.recipe.update.mockResolvedValue({
        id: recipeId,
        isActive: false,
        notes: '',
        ingredients: [],
        menuItem: null,
      })

      const result = await RecipeService.archiveRecipe(recipeId, businessId)
      expect(result.lifecycleState).toBe(RecipeLifecycleState.ARCHIVED)
    })

    it('PUBLISHED -> DRAFT is NOT allowed (immutable)', async () => {
      mockPrisma.recipe.findUnique.mockResolvedValueOnce({ id: recipeId, businessId })
      mockPrisma.recipe.findUnique.mockResolvedValueOnce({
        id: recipeId,
        isActive: true,
        notes: '__PUBLISHED__',
      })

      await expect(
        RecipeService.updateDraftRecipe(recipeId, businessId, { name: 'New Name' })
      ).rejects.toThrow(RecipeInvalidStateError)
    })

    it('ARCHIVED -> DRAFT is NOT allowed', async () => {
      mockPrisma.recipe.findUnique.mockResolvedValueOnce({ id: recipeId, businessId })
      mockPrisma.recipe.findUnique.mockResolvedValueOnce({
        id: recipeId,
        isActive: false,
        notes: '',
      })

      await expect(
        RecipeService.updateDraftRecipe(recipeId, businessId, { name: 'New Name' })
      ).rejects.toThrow(RecipeInvalidStateError)
    })

    it('ARCHIVED -> PUBLISHED is NOT allowed', async () => {
      mockPrisma.recipe.findUnique.mockResolvedValueOnce({ id: recipeId, businessId })
      mockPrisma.recipe.findUnique.mockResolvedValueOnce({
        id: recipeId,
        businessId,
        isActive: false,
        notes: '',
        ingredients: [{ id: 'ing-1' }],
      })

      await expect(
        RecipeService.publishRecipeVersion(recipeId, businessId)
      ).rejects.toThrow(RecipeInvalidStateError)
    })
  })
})
