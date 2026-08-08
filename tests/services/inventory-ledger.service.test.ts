/**
 * UNIT TESTS: InventoryLedgerService
 * Tests stock mutations, negative-stock prevention, and audit trail
 * 
 * Priority: HIGHEST
 * Coverage Target: 100%
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import type { Mock } from 'jest-mock'

// Mock Prisma client
const mockPrisma = {
  inventoryItem: {
    findUnique: jest.fn() as Mock<any>,
    update: jest.fn() as Mock<any>,
  },
  inventoryUpdate: {
    create: jest.fn() as Mock<any>,
  },
  $transaction: jest.fn((fn: any) => fn(mockPrisma)) as Mock<any>,
}

jest.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}))

// Import after mocking
import {
  InventoryLedgerService,
  InventoryLedgerError,
  InsufficientStockError,
  InventoryItemNotFoundError,
  BusinessMismatchError,
  LedgerMutationInput,
} from '@/lib/services/inventory-ledger.service'

describe('InventoryLedgerService', () => {
  const businessId = 'biz-123'
  const inventoryItemId = 'inv-item-123'
  const userId = 'user-123'

  const mockInventoryItem = {
    id: inventoryItemId,
    businessId,
    name: 'Chicken Breast',
    currentStock: 1000, // 1000 grams
    unit: 'g',
    unitCostCents: 50, // $0.50 per gram
    isActive: true,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ─── ADD Mutations ───────────────────────────────────────────────────────

  describe('ADD mutations', () => {
    it('should add stock correctly', async () => {
      mockPrisma.inventoryItem.findUnique.mockResolvedValue(mockInventoryItem)
      mockPrisma.inventoryUpdate.create.mockResolvedValue({
        id: 'update-1',
        inventoryItemId,
        businessId,
        type: 'ADD',
        quantity: 500,
      })
      mockPrisma.inventoryItem.update.mockResolvedValue({
        ...mockInventoryItem,
        currentStock: 1500,
      })

      const input: LedgerMutationInput = {
        inventoryItemId,
        businessId,
        type: 'ADD',
        quantity: 500,
        reason: 'Delivery received',
        userId,
      }

      const result = await InventoryLedgerService.applyMutation(mockPrisma as any, input)

      expect(result.previousStock).toBe(1000)
      expect(result.newStock).toBe(1500)
      expect(mockPrisma.inventoryItem.update).toHaveBeenCalledWith({
        where: { id: inventoryItemId },
        data: { currentStock: 1500 },
      })
    })

    it('should allow adding to zero stock', async () => {
      mockPrisma.inventoryItem.findUnique.mockResolvedValue({
        ...mockInventoryItem,
        currentStock: 0,
      })
      mockPrisma.inventoryUpdate.create.mockResolvedValue({
        id: 'update-1',
        type: 'ADD',
        quantity: 100,
      })
      mockPrisma.inventoryItem.update.mockResolvedValue({
        ...mockInventoryItem,
        currentStock: 100,
      })

      const result = await InventoryLedgerService.applyMutation(mockPrisma as any, {
        inventoryItemId,
        businessId,
        type: 'ADD',
        quantity: 100,
      })

      expect(result.newStock).toBe(100)
    })
  })

  // ─── REMOVE Mutations ────────────────────────────────────────────────────

  describe('REMOVE mutations', () => {
    it('should remove stock correctly', async () => {
      mockPrisma.inventoryItem.findUnique.mockResolvedValue(mockInventoryItem)
      mockPrisma.inventoryUpdate.create.mockResolvedValue({
        id: 'update-1',
        type: 'REMOVE',
        quantity: 200,
      })
      mockPrisma.inventoryItem.update.mockResolvedValue({
        ...mockInventoryItem,
        currentStock: 800,
      })

      const result = await InventoryLedgerService.applyMutation(mockPrisma as any, {
        inventoryItemId,
        businessId,
        type: 'REMOVE',
        quantity: 200,
        reason: 'Manual adjustment',
      })

      expect(result.previousStock).toBe(1000)
      expect(result.newStock).toBe(800)
    })

    it('should reject removal that would cause negative stock', async () => {
      mockPrisma.inventoryItem.findUnique.mockResolvedValue(mockInventoryItem)

      await expect(
        InventoryLedgerService.applyMutation(mockPrisma as any, {
          inventoryItemId,
          businessId,
          type: 'REMOVE',
          quantity: 1500, // More than current stock
        })
      ).rejects.toThrow(InsufficientStockError)
    })

    it('should allow removal that brings stock to exactly zero', async () => {
      mockPrisma.inventoryItem.findUnique.mockResolvedValue(mockInventoryItem)
      mockPrisma.inventoryUpdate.create.mockResolvedValue({
        id: 'update-1',
        type: 'REMOVE',
        quantity: 1000,
      })
      mockPrisma.inventoryItem.update.mockResolvedValue({
        ...mockInventoryItem,
        currentStock: 0,
      })

      const result = await InventoryLedgerService.applyMutation(mockPrisma as any, {
        inventoryItemId,
        businessId,
        type: 'REMOVE',
        quantity: 1000, // Exactly current stock
      })

      expect(result.newStock).toBe(0)
    })
  })

  // ─── WASTE Mutations ─────────────────────────────────────────────────────

  describe('WASTE mutations', () => {
    it('should record waste correctly', async () => {
      mockPrisma.inventoryItem.findUnique.mockResolvedValue(mockInventoryItem)
      mockPrisma.inventoryUpdate.create.mockResolvedValue({
        id: 'update-1',
        type: 'WASTE',
        quantity: 50,
      })
      mockPrisma.inventoryItem.update.mockResolvedValue({
        ...mockInventoryItem,
        currentStock: 950,
      })

      const result = await InventoryLedgerService.applyMutation(mockPrisma as any, {
        inventoryItemId,
        businessId,
        type: 'WASTE',
        quantity: 50,
        reason: 'Spoiled',
      })

      expect(result.newStock).toBe(950)
      expect(mockPrisma.inventoryUpdate.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'WASTE',
          reason: 'Spoiled',
        }),
      })
    })

    it('should reject waste that would cause negative stock', async () => {
      mockPrisma.inventoryItem.findUnique.mockResolvedValue(mockInventoryItem)

      await expect(
        InventoryLedgerService.applyMutation(mockPrisma as any, {
          inventoryItemId,
          businessId,
          type: 'WASTE',
          quantity: 2000,
        })
      ).rejects.toThrow(InsufficientStockError)
    })
  })

  // ─── ADJUSTMENT Mutations ────────────────────────────────────────────────

  describe('ADJUSTMENT mutations', () => {
    it('should set absolute stock value', async () => {
      mockPrisma.inventoryItem.findUnique.mockResolvedValue(mockInventoryItem)
      mockPrisma.inventoryUpdate.create.mockResolvedValue({
        id: 'update-1',
        type: 'ADJUSTMENT',
        quantity: 500,
      })
      mockPrisma.inventoryItem.update.mockResolvedValue({
        ...mockInventoryItem,
        currentStock: 500,
      })

      const result = await InventoryLedgerService.applyMutation(mockPrisma as any, {
        inventoryItemId,
        businessId,
        type: 'ADJUSTMENT',
        quantity: 500, // Set to 500
        reason: 'Physical count',
      })

      expect(result.previousStock).toBe(1000)
      expect(result.newStock).toBe(500)
    })

    it('should allow adjustment to zero', async () => {
      mockPrisma.inventoryItem.findUnique.mockResolvedValue(mockInventoryItem)
      mockPrisma.inventoryUpdate.create.mockResolvedValue({
        id: 'update-1',
        type: 'ADJUSTMENT',
        quantity: 0,
      })
      mockPrisma.inventoryItem.update.mockResolvedValue({
        ...mockInventoryItem,
        currentStock: 0,
      })

      const result = await InventoryLedgerService.applyMutation(mockPrisma as any, {
        inventoryItemId,
        businessId,
        type: 'ADJUSTMENT',
        quantity: 0,
      })

      expect(result.newStock).toBe(0)
    })

    it('should reject negative adjustment', async () => {
      mockPrisma.inventoryItem.findUnique.mockResolvedValue(mockInventoryItem)

      await expect(
        InventoryLedgerService.applyMutation(mockPrisma as any, {
          inventoryItemId,
          businessId,
          type: 'ADJUSTMENT',
          quantity: -100, // Negative value
        })
      ).rejects.toThrow(InsufficientStockError)
    })
  })

  // ─── CONSUMPTION Mutations ───────────────────────────────────────────────

  describe('CONSUMPTION mutations', () => {
    it('should consume stock correctly', async () => {
      mockPrisma.inventoryItem.findUnique.mockResolvedValue(mockInventoryItem)
      mockPrisma.inventoryUpdate.create.mockResolvedValue({
        id: 'update-1',
        type: 'CONSUMPTION',
        quantity: 150,
      })
      mockPrisma.inventoryItem.update.mockResolvedValue({
        ...mockInventoryItem,
        currentStock: 850,
      })

      const result = await InventoryLedgerService.applyMutation(mockPrisma as any, {
        inventoryItemId,
        businessId,
        type: 'CONSUMPTION',
        quantity: 150,
        saleItemId: 'sale-item-123',
      })

      expect(result.newStock).toBe(850)
      expect(mockPrisma.inventoryUpdate.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'CONSUMPTION',
          notes: expect.stringContaining('sale-item-123'),
        }),
      })
    })

    it('should reject consumption that would cause negative stock', async () => {
      mockPrisma.inventoryItem.findUnique.mockResolvedValue(mockInventoryItem)

      await expect(
        InventoryLedgerService.applyMutation(mockPrisma as any, {
          inventoryItemId,
          businessId,
          type: 'CONSUMPTION',
          quantity: 1500,
          saleItemId: 'sale-item-123',
        })
      ).rejects.toThrow(InsufficientStockError)
    })

    it('should include consumption context in notes', async () => {
      mockPrisma.inventoryItem.findUnique.mockResolvedValue(mockInventoryItem)
      mockPrisma.inventoryUpdate.create.mockResolvedValue({
        id: 'update-1',
        type: 'CONSUMPTION',
        quantity: 100,
      })
      mockPrisma.inventoryItem.update.mockResolvedValue({
        ...mockInventoryItem,
        currentStock: 900,
      })

      await InventoryLedgerService.applyMutation(mockPrisma as any, {
        inventoryItemId,
        businessId,
        type: 'CONSUMPTION',
        quantity: 100,
        saleItemId: 'sale-item-456',
        notes: 'Recipe: Chicken Burger',
      })

      expect(mockPrisma.inventoryUpdate.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          notes: expect.stringContaining('Recipe: Chicken Burger'),
        }),
      })
    })
  })

  // ─── Error Handling ──────────────────────────────────────────────────────

  describe('Error handling', () => {
    it('should throw InventoryItemNotFoundError for missing item', async () => {
      mockPrisma.inventoryItem.findUnique.mockResolvedValue(null)

      await expect(
        InventoryLedgerService.applyMutation(mockPrisma as any, {
          inventoryItemId: 'non-existent',
          businessId,
          type: 'ADD',
          quantity: 100,
        })
      ).rejects.toThrow(InventoryItemNotFoundError)
    })

    it('should throw BusinessMismatchError for wrong business', async () => {
      mockPrisma.inventoryItem.findUnique.mockResolvedValue({
        ...mockInventoryItem,
        businessId: 'different-business',
      })

      await expect(
        InventoryLedgerService.applyMutation(mockPrisma as any, {
          inventoryItemId,
          businessId,
          type: 'ADD',
          quantity: 100,
        })
      ).rejects.toThrow(BusinessMismatchError)
    })

    it('InsufficientStockError has correct properties', () => {
      const error = new InsufficientStockError(inventoryItemId, 100, 200)
      expect(error.code).toBe('INSUFFICIENT_STOCK')
      expect(error.statusCode).toBe(400)
      expect(error.inventoryItemId).toBe(inventoryItemId)
      expect(error.currentStock).toBe(100)
      expect(error.requestedQuantity).toBe(200)
    })
  })

  // ─── Batch Mutations ─────────────────────────────────────────────────────

  describe('Batch mutations', () => {
    it('should apply multiple mutations in sequence', async () => {
      mockPrisma.inventoryItem.findUnique
        .mockResolvedValueOnce(mockInventoryItem)
        .mockResolvedValueOnce({ ...mockInventoryItem, id: 'inv-item-456', currentStock: 500 })

      mockPrisma.inventoryUpdate.create.mockResolvedValue({ id: 'update-1' })
      mockPrisma.inventoryItem.update
        .mockResolvedValueOnce({ ...mockInventoryItem, currentStock: 900 })
        .mockResolvedValueOnce({ ...mockInventoryItem, id: 'inv-item-456', currentStock: 400 })

      const results = await InventoryLedgerService.applyMutationsBatch(mockPrisma as any, [
        { inventoryItemId, businessId, type: 'CONSUMPTION', quantity: 100 },
        { inventoryItemId: 'inv-item-456', businessId, type: 'CONSUMPTION', quantity: 100 },
      ])

      expect(results).toHaveLength(2)
      expect(results[0].newStock).toBe(900)
      expect(results[1].newStock).toBe(400)
    })

    it('should fail entire batch if one mutation fails', async () => {
      mockPrisma.inventoryItem.findUnique
        .mockResolvedValueOnce(mockInventoryItem)
        .mockResolvedValueOnce({ ...mockInventoryItem, id: 'inv-item-456', currentStock: 50 })

      mockPrisma.inventoryUpdate.create.mockResolvedValue({ id: 'update-1' })
      mockPrisma.inventoryItem.update.mockResolvedValue({ ...mockInventoryItem, currentStock: 900 })

      // Second mutation should fail due to insufficient stock
      await expect(
        InventoryLedgerService.applyMutationsBatch(mockPrisma as any, [
          { inventoryItemId, businessId, type: 'CONSUMPTION', quantity: 100 },
          { inventoryItemId: 'inv-item-456', businessId, type: 'CONSUMPTION', quantity: 100 }, // Will fail
        ])
      ).rejects.toThrow(InsufficientStockError)
    })
  })

  // ─── Reversal ────────────────────────────────────────────────────────────

  describe('Consumption reversal', () => {
    it('should reverse consumption with ADD mutation', async () => {
      mockPrisma.inventoryItem.findUnique.mockResolvedValue({
        ...mockInventoryItem,
        currentStock: 850, // After consumption
      })
      mockPrisma.inventoryUpdate.create.mockResolvedValue({
        id: 'update-reversal',
        type: 'ADD',
        quantity: 150,
      })
      mockPrisma.inventoryItem.update.mockResolvedValue({
        ...mockInventoryItem,
        currentStock: 1000, // Restored
      })

      const result = await InventoryLedgerService.reverseConsumption(
        mockPrisma as any,
        {
          inventoryItemId,
          businessId,
          quantity: 150,
          saleItemId: 'sale-item-123',
        },
        'Order cancelled'
      )

      expect(result.newStock).toBe(1000)
      expect(mockPrisma.inventoryUpdate.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'ADD',
          reason: 'Order cancelled',
          notes: expect.stringContaining('Reversal'),
        }),
      })
    })
  })

  // ─── Validation ──────────────────────────────────────────────────────────

  describe('Mutation validation', () => {
    it('should validate successful mutation', async () => {
      mockPrisma.inventoryItem.findUnique.mockResolvedValue(mockInventoryItem)

      const result = await InventoryLedgerService.validateMutation(mockPrisma as any, {
        inventoryItemId,
        businessId,
        type: 'CONSUMPTION',
        quantity: 100,
      })

      expect(result.valid).toBe(true)
      expect(result.projectedStock).toBe(900)
    })

    it('should invalidate mutation that would cause negative stock', async () => {
      mockPrisma.inventoryItem.findUnique.mockResolvedValue(mockInventoryItem)

      const result = await InventoryLedgerService.validateMutation(mockPrisma as any, {
        inventoryItemId,
        businessId,
        type: 'CONSUMPTION',
        quantity: 1500,
      })

      expect(result.valid).toBe(false)
      expect(result.error).toContain('Insufficient stock')
    })

    it('should invalidate mutation for non-existent item', async () => {
      mockPrisma.inventoryItem.findUnique.mockResolvedValue(null)

      const result = await InventoryLedgerService.validateMutation(mockPrisma as any, {
        inventoryItemId: 'non-existent',
        businessId,
        type: 'ADD',
        quantity: 100,
      })

      expect(result.valid).toBe(false)
      expect(result.error).toContain('not found')
    })
  })

  // ─── Helper Methods ──────────────────────────────────────────────────────

  describe('Helper methods', () => {
    it('should get current stock', async () => {
      mockPrisma.inventoryItem.findUnique.mockResolvedValue({
        currentStock: 1000,
      })

      const stock = await InventoryLedgerService.getCurrentStock(
        mockPrisma as any,
        inventoryItemId
      )

      expect(stock).toBe(1000)
    })

    it('should return null for non-existent item stock', async () => {
      mockPrisma.inventoryItem.findUnique.mockResolvedValue(null)

      const stock = await InventoryLedgerService.getCurrentStock(
        mockPrisma as any,
        'non-existent'
      )

      expect(stock).toBeNull()
    })

    it('should get unit cost', async () => {
      mockPrisma.inventoryItem.findUnique.mockResolvedValue({
        unitCostCents: 50,
      })

      const cost = await InventoryLedgerService.getUnitCostCents(
        mockPrisma as any,
        inventoryItemId
      )

      expect(cost).toBe(50)
    })
  })

  // ─── Audit Trail ─────────────────────────────────────────────────────────

  describe('Audit trail', () => {
    it('should create InventoryUpdate with all required metadata', async () => {
      mockPrisma.inventoryItem.findUnique.mockResolvedValue(mockInventoryItem)
      mockPrisma.inventoryUpdate.create.mockResolvedValue({
        id: 'update-1',
        inventoryItemId,
        businessId,
        userId,
        type: 'CONSUMPTION',
        quantity: 100,
        reason: 'Recipe consumption',
        notes: 'Test notes',
      })
      mockPrisma.inventoryItem.update.mockResolvedValue({
        ...mockInventoryItem,
        currentStock: 900,
      })

      await InventoryLedgerService.applyMutation(mockPrisma as any, {
        inventoryItemId,
        businessId,
        type: 'CONSUMPTION',
        quantity: 100,
        reason: 'Recipe consumption',
        notes: 'Test notes',
        userId,
      })

      expect(mockPrisma.inventoryUpdate.create).toHaveBeenCalledWith({
        data: {
          inventoryItemId,
          businessId,
          userId,
          type: 'CONSUMPTION',
          quantity: 100,
          reason: 'Recipe consumption',
          notes: expect.any(String),
        },
      })
    })
  })
})
