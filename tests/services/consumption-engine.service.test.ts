/**
 * UNIT TESTS: ConsumptionEngineService
 * Tests recipe resolution, consumption, reversal, and dry-run
 * 
 * Priority: HIGHEST
 * Coverage Target: 100%
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import type { Mock } from 'jest-mock'

// Mock InventoryLedgerService
const mockLedgerService = {
  applyMutation: jest.fn() as Mock<any>,
  reverseConsumption: jest.fn() as Mock<any>,
  validateMutation: jest.fn() as Mock<any>,
}

jest.mock('@/lib/services/inventory-ledger.service', () => ({
  InventoryLedgerService: mockLedgerService,
  InsufficientStockError: class InsufficientStockError extends Error {
    constructor(
      public inventoryItemId: string,
      public currentStock: number,
      public requestedQuantity: number
    ) {
      super(`Insufficient stock`)
    }
  },
}))

// Mock Prisma client
const mockPrisma = {
  saleItem: {
    findUnique: jest.fn() as Mock<any>,
    update: jest.fn() as Mock<any>,
  },
  inventoryConsumption: {
    create: jest.fn() as Mock<any>,
    findMany: jest.fn() as Mock<any>,
    update: jest.fn() as Mock<any>,
    aggregate: jest.fn() as Mock<any>,
  },
  $transaction: jest.fn((fn: any) => fn(mockPrisma)) as Mock<any>,
}

jest.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}))

// Import after mocking
import {
  ConsumptionEngineService,
  ConsumptionState,
  ConsumptionEngineError,
  SaleItemNotFoundError,
  NoRecipeError,
  RecipeNotActiveError,
  AlreadyConsumedError,
  SubRecipeDepthExceededError,
} from '@/lib/services/consumption-engine.service'

describe('ConsumptionEngineService', () => {
  const businessId = 'biz-123'
  const saleItemId = 'sale-item-123'
  const menuItemId = 'menu-item-123'
  const recipeId = 'recipe-123'
  const inventoryItemId = 'inv-item-123'
  const userId = 'user-123'

  const mockInventoryItem = {
    id: inventoryItemId,
    name: 'Chicken Breast',
    currentStock: 1000,
    unit: 'g',
    unitCostCents: 50,
  }

  const mockRecipeIngredient = {
    id: 'ing-1',
    recipeId,
    inventoryItemId,
    subRecipeId: null,
    quantity: 150,
    unit: 'g',
    yieldFactor: 1.0,
    isOptional: false,
    displayOrder: 0,
    inventoryItem: mockInventoryItem,
    subRecipe: null,
  }

  const mockRecipe = {
    id: recipeId,
    businessId,
    name: 'Grilled Chicken',
    yieldQuantity: 1,
    yieldUnit: 'portion',
    version: 1,
    isActive: true,
    notes: '__PUBLISHED__',
    ingredients: [mockRecipeIngredient],
  }

  const mockMenuItem = {
    id: menuItemId,
    name: 'Grilled Chicken',
    recipeId,
    recipe: mockRecipe,
  }

  const mockSaleItem = {
    id: saleItemId,
    menuItemId,
    quantity: 1,
    consumptionState: 'PENDING',
    menuItem: mockMenuItem,
    sale: {
      businessId,
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ─── Consumption ─────────────────────────────────────────────────────────

  describe('consumeForSaleItem', () => {
    it('should consume inventory for a simple recipe', async () => {
      mockPrisma.saleItem.findUnique.mockResolvedValue(mockSaleItem)
      mockLedgerService.applyMutation.mockResolvedValue({
        inventoryUpdate: { id: 'update-1' },
        inventoryItem: mockInventoryItem,
        previousStock: 1000,
        newStock: 850,
      })
      mockPrisma.inventoryConsumption.create.mockResolvedValue({
        id: 'consumption-1',
        saleItemId,
        inventoryItemId,
        quantityConsumed: 150,
        totalCostCents: 7500,
      })
      mockPrisma.saleItem.update.mockResolvedValue({
        ...mockSaleItem,
        consumptionState: 'CONSUMED',
      })

      const result = await ConsumptionEngineService.consumeForSaleItem(
        mockPrisma as any,
        saleItemId,
        userId
      )

      expect(result.state).toBe(ConsumptionState.CONSUMED)
      expect(result.recipeId).toBe(recipeId)
      expect(result.lines).toHaveLength(1)
      expect(result.lines[0].quantity).toBe(150)
      expect(result.lines[0].totalCostCents).toBe(7500)
      expect(result.totalCostCents).toBe(7500)
      expect(mockLedgerService.applyMutation).toHaveBeenCalledWith(
        mockPrisma,
        expect.objectContaining({
          inventoryItemId,
          type: 'CONSUMPTION',
          quantity: 150,
        })
      )
    })

    it('should scale quantities based on portion quantity', async () => {
      const saleItemWith2Portions = {
        ...mockSaleItem,
        quantity: 2, // 2 portions
      }

      mockPrisma.saleItem.findUnique.mockResolvedValue(saleItemWith2Portions)
      mockLedgerService.applyMutation.mockResolvedValue({
        inventoryUpdate: { id: 'update-1' },
        inventoryItem: mockInventoryItem,
        previousStock: 1000,
        newStock: 700,
      })
      mockPrisma.inventoryConsumption.create.mockResolvedValue({
        id: 'consumption-1',
        quantityConsumed: 300, // 150 * 2
      })
      mockPrisma.saleItem.update.mockResolvedValue({})

      const result = await ConsumptionEngineService.consumeForSaleItem(
        mockPrisma as any,
        saleItemId
      )

      expect(result.lines[0].quantity).toBe(300) // 150g * 2 portions
    })

    it('should skip consumption when no recipe attached', async () => {
      const saleItemNoRecipe = {
        ...mockSaleItem,
        menuItem: {
          ...mockMenuItem,
          recipeId: null,
          recipe: null,
        },
      }

      mockPrisma.saleItem.findUnique.mockResolvedValue(saleItemNoRecipe)
      mockPrisma.saleItem.update.mockResolvedValue({
        ...saleItemNoRecipe,
        consumptionState: 'SKIPPED',
      })

      const result = await ConsumptionEngineService.consumeForSaleItem(
        mockPrisma as any,
        saleItemId
      )

      expect(result.state).toBe(ConsumptionState.SKIPPED)
      expect(result.recipeId).toBeNull()
      expect(result.lines).toHaveLength(0)
      expect(mockLedgerService.applyMutation).not.toHaveBeenCalled()
    })

    it('should reject already consumed SaleItem', async () => {
      mockPrisma.saleItem.findUnique.mockResolvedValue({
        ...mockSaleItem,
        consumptionState: 'CONSUMED',
      })

      await expect(
        ConsumptionEngineService.consumeForSaleItem(mockPrisma as any, saleItemId)
      ).rejects.toThrow(AlreadyConsumedError)
    })

    it('should reject already reversed SaleItem', async () => {
      mockPrisma.saleItem.findUnique.mockResolvedValue({
        ...mockSaleItem,
        consumptionState: 'REVERSED',
      })

      await expect(
        ConsumptionEngineService.consumeForSaleItem(mockPrisma as any, saleItemId)
      ).rejects.toThrow(AlreadyConsumedError)
    })

    it('should reject non-existent SaleItem', async () => {
      mockPrisma.saleItem.findUnique.mockResolvedValue(null)

      await expect(
        ConsumptionEngineService.consumeForSaleItem(mockPrisma as any, 'non-existent')
      ).rejects.toThrow(SaleItemNotFoundError)
    })

    it('should reject unpublished recipe', async () => {
      const saleItemWithDraftRecipe = {
        ...mockSaleItem,
        menuItem: {
          ...mockMenuItem,
          recipe: {
            ...mockRecipe,
            notes: '__DRAFT__', // Not published
          },
        },
      }

      mockPrisma.saleItem.findUnique.mockResolvedValue(saleItemWithDraftRecipe)

      await expect(
        ConsumptionEngineService.consumeForSaleItem(mockPrisma as any, saleItemId)
      ).rejects.toThrow(RecipeNotActiveError)
    })

    it('should handle multiple ingredients', async () => {
      const multiIngredientRecipe = {
        ...mockRecipe,
        ingredients: [
          mockRecipeIngredient,
          {
            ...mockRecipeIngredient,
            id: 'ing-2',
            inventoryItemId: 'inv-item-456',
            quantity: 50,
            inventoryItem: {
              id: 'inv-item-456',
              name: 'Cheese',
              unitCostCents: 100,
            },
          },
        ],
      }

      mockPrisma.saleItem.findUnique.mockResolvedValue({
        ...mockSaleItem,
        menuItem: {
          ...mockMenuItem,
          recipe: multiIngredientRecipe,
        },
      })

      mockLedgerService.applyMutation
        .mockResolvedValueOnce({
          inventoryUpdate: { id: 'update-1' },
          inventoryItem: mockInventoryItem,
        })
        .mockResolvedValueOnce({
          inventoryUpdate: { id: 'update-2' },
          inventoryItem: { id: 'inv-item-456', name: 'Cheese' },
        })

      mockPrisma.inventoryConsumption.create
        .mockResolvedValueOnce({ id: 'consumption-1' })
        .mockResolvedValueOnce({ id: 'consumption-2' })

      mockPrisma.saleItem.update.mockResolvedValue({})

      const result = await ConsumptionEngineService.consumeForSaleItem(
        mockPrisma as any,
        saleItemId
      )

      expect(result.lines).toHaveLength(2)
      expect(result.consumptionIds).toHaveLength(2)
      expect(mockLedgerService.applyMutation).toHaveBeenCalledTimes(2)
    })

    it('should skip optional ingredients', async () => {
      const recipeWithOptional = {
        ...mockRecipe,
        ingredients: [
          mockRecipeIngredient,
          {
            ...mockRecipeIngredient,
            id: 'ing-optional',
            isOptional: true, // Should be skipped
          },
        ],
      }

      mockPrisma.saleItem.findUnique.mockResolvedValue({
        ...mockSaleItem,
        menuItem: {
          ...mockMenuItem,
          recipe: recipeWithOptional,
        },
      })

      mockLedgerService.applyMutation.mockResolvedValue({
        inventoryUpdate: { id: 'update-1' },
        inventoryItem: mockInventoryItem,
      })
      mockPrisma.inventoryConsumption.create.mockResolvedValue({ id: 'consumption-1' })
      mockPrisma.saleItem.update.mockResolvedValue({})

      const result = await ConsumptionEngineService.consumeForSaleItem(
        mockPrisma as any,
        saleItemId
      )

      expect(result.lines).toHaveLength(1) // Only non-optional
      expect(mockLedgerService.applyMutation).toHaveBeenCalledTimes(1)
    })
  })

  // ─── Reversal ────────────────────────────────────────────────────────────

  describe('reverseForSaleItem', () => {
    it('should reverse consumption and restore inventory', async () => {
      const consumedSaleItem = {
        ...mockSaleItem,
        consumptionState: 'CONSUMED',
      }

      mockPrisma.saleItem.findUnique.mockResolvedValue(consumedSaleItem)
      mockPrisma.inventoryConsumption.findMany.mockResolvedValue([
        {
          id: 'consumption-1',
          inventoryItemId,
          quantityConsumed: 150,
          unit: 'g',
          unitCostAtConsumptionCents: 50,
          totalCostCents: 7500,
          recipeId,
          recipeIngredientId: 'ing-1',
          state: 'ACTIVE',
          inventoryItem: mockInventoryItem,
        },
      ])

      mockLedgerService.reverseConsumption.mockResolvedValue({
        inventoryUpdate: { id: 'update-reversal' },
        inventoryItem: mockInventoryItem,
        newStock: 1000,
      })

      mockPrisma.inventoryConsumption.create.mockResolvedValue({
        id: 'reversal-consumption-1',
      })
      mockPrisma.inventoryConsumption.update.mockResolvedValue({})
      mockPrisma.saleItem.update.mockResolvedValue({
        ...consumedSaleItem,
        consumptionState: 'REVERSED',
      })

      const result = await ConsumptionEngineService.reverseForSaleItem(
        mockPrisma as any,
        saleItemId,
        'CANCELLED',
        userId
      )

      expect(result.originalConsumptionIds).toContain('consumption-1')
      expect(result.reversalConsumptionIds).toHaveLength(1)
      expect(result.totalReversedCostCents).toBe(7500)
      expect(mockLedgerService.reverseConsumption).toHaveBeenCalled()
    })

    it('should reject reversal for non-consumed SaleItem', async () => {
      mockPrisma.saleItem.findUnique.mockResolvedValue({
        ...mockSaleItem,
        consumptionState: 'PENDING',
      })

      await expect(
        ConsumptionEngineService.reverseForSaleItem(mockPrisma as any, saleItemId)
      ).rejects.toThrow(ConsumptionEngineError)
    })

    it('should handle SaleItem with no consumptions', async () => {
      mockPrisma.saleItem.findUnique.mockResolvedValue({
        ...mockSaleItem,
        consumptionState: 'CONSUMED',
      })
      mockPrisma.inventoryConsumption.findMany.mockResolvedValue([])
      mockPrisma.saleItem.update.mockResolvedValue({})

      const result = await ConsumptionEngineService.reverseForSaleItem(
        mockPrisma as any,
        saleItemId
      )

      expect(result.originalConsumptionIds).toHaveLength(0)
      expect(result.reversalConsumptionIds).toHaveLength(0)
      expect(mockLedgerService.reverseConsumption).not.toHaveBeenCalled()
    })

    it('should create reversal consumption with negative quantities', async () => {
      mockPrisma.saleItem.findUnique.mockResolvedValue({
        ...mockSaleItem,
        consumptionState: 'CONSUMED',
      })
      mockPrisma.inventoryConsumption.findMany.mockResolvedValue([
        {
          id: 'consumption-1',
          inventoryItemId,
          quantityConsumed: 150,
          totalCostCents: 7500,
          state: 'ACTIVE',
        },
      ])
      mockLedgerService.reverseConsumption.mockResolvedValue({
        inventoryUpdate: { id: 'update-1' },
      })
      mockPrisma.inventoryConsumption.create.mockResolvedValue({ id: 'reversal-1' })
      mockPrisma.inventoryConsumption.update.mockResolvedValue({})
      mockPrisma.saleItem.update.mockResolvedValue({})

      await ConsumptionEngineService.reverseForSaleItem(
        mockPrisma as any,
        saleItemId
      )

      expect(mockPrisma.inventoryConsumption.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          quantityConsumed: -150, // Negative
          totalCostCents: -7500, // Negative
          state: 'REVERSAL',
        }),
      })
    })
  })

  // ─── Dry Run ─────────────────────────────────────────────────────────────

  describe('dryRun', () => {
    it('should return projected consumption without modifying data', async () => {
      mockPrisma.saleItem.findUnique.mockResolvedValue(mockSaleItem)
      mockLedgerService.validateMutation.mockResolvedValue({
        valid: true,
        projectedStock: 850,
      })

      const result = await ConsumptionEngineService.dryRun(
        mockPrisma as any,
        saleItemId
      )

      expect(result.wouldSucceed).toBe(true)
      expect(result.lines).toHaveLength(1)
      expect(result.totalCostCents).toBe(7500)
      expect(result.errors).toHaveLength(0)
      expect(mockLedgerService.applyMutation).not.toHaveBeenCalled()
    })

    it('should detect insufficient stock', async () => {
      mockPrisma.saleItem.findUnique.mockResolvedValue(mockSaleItem)
      mockLedgerService.validateMutation.mockResolvedValue({
        valid: false,
        error: 'Insufficient stock: current=100, requested=150',
      })

      const result = await ConsumptionEngineService.dryRun(
        mockPrisma as any,
        saleItemId
      )

      expect(result.wouldSucceed).toBe(false)
      expect(result.errors.some(e => e.includes('Insufficient stock'))).toBe(true)
    })

    it('should succeed for SaleItem without recipe', async () => {
      mockPrisma.saleItem.findUnique.mockResolvedValue({
        ...mockSaleItem,
        menuItem: {
          ...mockMenuItem,
          recipe: null,
        },
      })

      const result = await ConsumptionEngineService.dryRun(
        mockPrisma as any,
        saleItemId
      )

      expect(result.wouldSucceed).toBe(true) // SKIPPED is valid
      expect(result.recipeId).toBeNull()
    })

    it('should detect unpublished recipe', async () => {
      mockPrisma.saleItem.findUnique.mockResolvedValue({
        ...mockSaleItem,
        menuItem: {
          ...mockMenuItem,
          recipe: {
            ...mockRecipe,
            notes: '__DRAFT__',
          },
        },
      })
      mockLedgerService.validateMutation.mockResolvedValue({ valid: true })

      const result = await ConsumptionEngineService.dryRun(
        mockPrisma as any,
        saleItemId
      )

      expect(result.wouldSucceed).toBe(false)
      expect(result.errors.some(e => e.includes('not published'))).toBe(true)
    })
  })

  // ─── Error Classes ───────────────────────────────────────────────────────

  describe('Error classes', () => {
    it('SaleItemNotFoundError has correct properties', () => {
      const error = new SaleItemNotFoundError(saleItemId)
      expect(error.code).toBe('SALE_ITEM_NOT_FOUND')
      expect(error.statusCode).toBe(404)
    })

    it('NoRecipeError has correct properties', () => {
      const error = new NoRecipeError(menuItemId)
      expect(error.code).toBe('NO_RECIPE')
      expect(error.statusCode).toBe(400)
    })

    it('RecipeNotActiveError has correct properties', () => {
      const error = new RecipeNotActiveError(recipeId)
      expect(error.code).toBe('RECIPE_NOT_ACTIVE')
      expect(error.statusCode).toBe(400)
    })

    it('AlreadyConsumedError has correct properties', () => {
      const error = new AlreadyConsumedError(saleItemId, 'CONSUMED')
      expect(error.code).toBe('ALREADY_CONSUMED')
      expect(error.statusCode).toBe(409)
    })

    it('SubRecipeDepthExceededError has correct properties', () => {
      const error = new SubRecipeDepthExceededError(recipeId, 4)
      expect(error.code).toBe('SUB_RECIPE_DEPTH_EXCEEDED')
      expect(error.statusCode).toBe(400)
    })
  })

  // ─── Helper Methods ──────────────────────────────────────────────────────

  describe('Helper methods', () => {
    it('should get consumption history for SaleItem', async () => {
      const mockConsumptions = [
        { id: 'c1', saleItemId, state: 'ACTIVE' },
        { id: 'c2', saleItemId, state: 'REVERSED' },
      ]

      mockPrisma.inventoryConsumption.findMany.mockResolvedValue(mockConsumptions)

      const result = await ConsumptionEngineService.getConsumptionHistory(
        mockPrisma as any,
        saleItemId
      )

      expect(result).toHaveLength(2)
      expect(mockPrisma.inventoryConsumption.findMany).toHaveBeenCalledWith({
        where: { saleItemId },
        orderBy: { createdAt: 'asc' },
        include: expect.any(Object),
      })
    })

    it('should calculate total food cost for Sale', async () => {
      mockPrisma.inventoryConsumption.aggregate.mockResolvedValue({
        _sum: { totalCostCents: 15000 },
      })

      const result = await ConsumptionEngineService.getSaleFoodCost(
        mockPrisma as any,
        'sale-123'
      )

      expect(result).toBe(15000)
    })

    it('should return 0 for Sale with no consumptions', async () => {
      mockPrisma.inventoryConsumption.aggregate.mockResolvedValue({
        _sum: { totalCostCents: null },
      })

      const result = await ConsumptionEngineService.getSaleFoodCost(
        mockPrisma as any,
        'sale-123'
      )

      expect(result).toBe(0)
    })
  })

  // ─── Consumption State Constants ─────────────────────────────────────────

  describe('ConsumptionState constants', () => {
    it('should have correct values', () => {
      expect(ConsumptionState.PENDING).toBe('PENDING')
      expect(ConsumptionState.CONSUMED).toBe('CONSUMED')
      expect(ConsumptionState.REVERSED).toBe('REVERSED')
      expect(ConsumptionState.SKIPPED).toBe('SKIPPED')
    })
  })
})
