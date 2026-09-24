/**
 * FinancialTruthService Tests
 * 
 * Verifies that financial calculations use actual consumption costs
 * where available and fall back to estimated costs for historical data.
 */

import { FinancialTruthService, CostSource } from '@/lib/services/financial-truth.service'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    sale: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    saleItem: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    inventoryConsumption: {
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('FinancialTruthService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getSaleCost', () => {
    it('should return ACTUAL cost when consumption records exist', async () => {
      const mockSale = {
        id: 'sale-1',
        items: [
          {
            id: 'item-1',
            menuItemId: 'menu-1',
            menuItem: { name: 'Burger', costCents: 3000 },
            quantity: 2,
            consumptionState: 'CONSUMED',
            inventoryConsumption: [
              { id: 'cons-1', totalCostCents: 3200, state: 'ACTIVE' },
              { id: 'cons-2', totalCostCents: 3200, state: 'ACTIVE' },
            ],
          },
        ],
      }

      ;(mockPrisma.sale.findUnique as jest.Mock).mockResolvedValue(mockSale)

      const result = await FinancialTruthService.getSaleCost('sale-1')

      expect(result.source).toBe('ACTUAL')
      expect(result.actualCostCents).toBe(6400)
      expect(result.estimatedCostCents).toBe(0)
      expect(result.totalCostCents).toBe(6400)
      expect(result.itemBreakdown[0].source).toBe('ACTUAL')
      expect(result.itemBreakdown[0].consumptionIds).toEqual(['cons-1', 'cons-2'])
    })

    it('should return ESTIMATED cost when no consumption records exist', async () => {
      const mockSale = {
        id: 'sale-2',
        items: [
          {
            id: 'item-2',
            menuItemId: 'menu-2',
            menuItem: { name: 'Pizza', costCents: 4000 },
            quantity: 1,
            consumptionState: 'PENDING',
            inventoryConsumption: [],
          },
        ],
      }

      ;(mockPrisma.sale.findUnique as jest.Mock).mockResolvedValue(mockSale)

      const result = await FinancialTruthService.getSaleCost('sale-2')

      expect(result.source).toBe('ESTIMATED')
      expect(result.actualCostCents).toBe(0)
      expect(result.estimatedCostCents).toBe(4000)
      expect(result.totalCostCents).toBe(4000)
      expect(result.itemBreakdown[0].source).toBe('ESTIMATED')
      expect(result.itemBreakdown[0].actualCostCents).toBeNull()
    })

    it('should return MIXED cost when some items have consumption and others do not', async () => {
      const mockSale = {
        id: 'sale-3',
        items: [
          {
            id: 'item-3a',
            menuItemId: 'menu-3',
            menuItem: { name: 'Burger', costCents: 3000 },
            quantity: 1,
            consumptionState: 'CONSUMED',
            inventoryConsumption: [
              { id: 'cons-3', totalCostCents: 3100, state: 'ACTIVE' },
            ],
          },
          {
            id: 'item-3b',
            menuItemId: 'menu-4',
            menuItem: { name: 'Drink', costCents: 500 },
            quantity: 2,
            consumptionState: 'SKIPPED', // No recipe
            inventoryConsumption: [],
          },
        ],
      }

      ;(mockPrisma.sale.findUnique as jest.Mock).mockResolvedValue(mockSale)

      const result = await FinancialTruthService.getSaleCost('sale-3')

      expect(result.source).toBe('MIXED')
      expect(result.actualCostCents).toBe(3100)
      expect(result.estimatedCostCents).toBe(1000) // 500 * 2
      expect(result.totalCostCents).toBe(4100)
    })

    it('should throw error when sale not found', async () => {
      ;(mockPrisma.sale.findUnique as jest.Mock).mockResolvedValue(null)

      await expect(FinancialTruthService.getSaleCost('invalid-id'))
        .rejects.toThrow('Sale not found: invalid-id')
    })
  })

  describe('getAggregatedConsumptionCost', () => {
    it('should aggregate consumption costs for a period', async () => {
      ;(mockPrisma.inventoryConsumption.aggregate as jest.Mock).mockResolvedValue({
        _sum: { totalCostCents: 150000 },
        _count: { id: 50 },
      })

      ;(mockPrisma.inventoryConsumption.groupBy as jest.Mock).mockResolvedValue([
        { saleItemId: 'item-1' },
        { saleItemId: 'item-2' },
        { saleItemId: 'item-3' },
      ])

      const result = await FinancialTruthService.getAggregatedConsumptionCost(
        'business-1',
        new Date('2026-06-01'),
        new Date('2026-06-30')
      )

      expect(result.totalActualCostCents).toBe(150000)
      expect(result.consumptionCount).toBe(50)
      expect(result.uniqueSaleItems).toBe(3)
    })

    it('should return zero when no consumption records exist', async () => {
      ;(mockPrisma.inventoryConsumption.aggregate as jest.Mock).mockResolvedValue({
        _sum: { totalCostCents: null },
        _count: { id: 0 },
      })

      ;(mockPrisma.inventoryConsumption.groupBy as jest.Mock).mockResolvedValue([])

      const result = await FinancialTruthService.getAggregatedConsumptionCost(
        'business-1',
        new Date('2026-06-01'),
        new Date('2026-06-30')
      )

      expect(result.totalActualCostCents).toBe(0)
      expect(result.consumptionCount).toBe(0)
      expect(result.uniqueSaleItems).toBe(0)
    })
  })

  describe('getEstimatedCostForSalesWithoutConsumption', () => {
    it('should calculate estimated cost for items without consumption', async () => {
      ;(mockPrisma.saleItem.findMany as jest.Mock).mockResolvedValue([
        { id: 'item-1', menuItem: { costCents: 3000 }, quantity: 2 },
        { id: 'item-2', menuItem: { costCents: 2000 }, quantity: 1 },
      ])

      const result = await FinancialTruthService.getEstimatedCostForSalesWithoutConsumption(
        'business-1',
        new Date('2026-06-01'),
        new Date('2026-06-30')
      )

      expect(result.totalEstimatedCostCents).toBe(8000) // (3000*2) + (2000*1)
      expect(result.saleItemCount).toBe(2)
    })
  })

  describe('getCostTraceability', () => {
    it('should return full traceability for a sale item with consumption', async () => {
      const mockSaleItem = {
        id: 'item-1',
        saleId: 'sale-1',
        menuItemId: 'menu-1',
        menuItem: {
          name: 'Burger',
          costCents: 3000,
          recipeId: 'recipe-1',
          recipe: { name: 'Burger Recipe' },
        },
        quantity: 1,
        inventoryConsumption: [
          {
            id: 'cons-1',
            inventoryItemId: 'inv-1',
            inventoryItem: { name: 'Ground Beef' },
            quantityConsumed: 0.2,
            unit: 'kg',
            unitCostAtConsumptionCents: 8000,
            totalCostCents: 1600,
            inventoryUpdateId: 'update-1',
            state: 'ACTIVE',
            createdAt: new Date('2026-06-15T10:00:00Z'),
          },
          {
            id: 'cons-2',
            inventoryItemId: 'inv-2',
            inventoryItem: { name: 'Burger Bun' },
            quantityConsumed: 1,
            unit: 'piece',
            unitCostAtConsumptionCents: 500,
            totalCostCents: 500,
            inventoryUpdateId: 'update-2',
            state: 'ACTIVE',
            createdAt: new Date('2026-06-15T10:00:01Z'),
          },
        ],
      }

      ;(mockPrisma.saleItem.findUnique as jest.Mock).mockResolvedValue(mockSaleItem)

      const result = await FinancialTruthService.getCostTraceability('item-1')

      expect(result.source).toBe('ACTUAL')
      expect(result.totalCostCents).toBe(2100)
      expect(result.recipeId).toBe('recipe-1')
      expect(result.recipeName).toBe('Burger Recipe')
      expect(result.consumptions).toHaveLength(2)
      expect(result.consumptions[0].inventoryItemName).toBe('Ground Beef')
      expect(result.consumptions[0].inventoryUpdateId).toBe('update-1')
    })

    it('should return estimated cost for items without consumption', async () => {
      const mockSaleItem = {
        id: 'item-2',
        saleId: 'sale-2',
        menuItemId: 'menu-2',
        menuItem: {
          name: 'Drink',
          costCents: 500,
          recipeId: null,
          recipe: null,
        },
        quantity: 2,
        inventoryConsumption: [],
      }

      ;(mockPrisma.saleItem.findUnique as jest.Mock).mockResolvedValue(mockSaleItem)

      const result = await FinancialTruthService.getCostTraceability('item-2')

      expect(result.source).toBe('ESTIMATED')
      expect(result.totalCostCents).toBe(1000) // 500 * 2
      expect(result.recipeId).toBeNull()
      expect(result.consumptions).toHaveLength(0)
    })
  })

  describe('getCombinedPeriodCost', () => {
    it('should combine actual and estimated costs correctly', async () => {
      // Mock actual consumption
      ;(mockPrisma.inventoryConsumption.aggregate as jest.Mock).mockResolvedValue({
        _sum: { totalCostCents: 80000 },
        _count: { id: 30 },
      })

      ;(mockPrisma.inventoryConsumption.groupBy as jest.Mock).mockResolvedValue([
        { saleItemId: 'item-1' },
        { saleItemId: 'item-2' },
      ])

      // Mock estimated cost for items without consumption
      ;(mockPrisma.saleItem.findMany as jest.Mock).mockResolvedValue([
        { id: 'item-3', menuItem: { costCents: 5000 }, quantity: 2 },
        { id: 'item-4', menuItem: { costCents: 3000 }, quantity: 1 },
      ])

      const result = await FinancialTruthService.getCombinedPeriodCost(
        'business-1',
        new Date('2026-06-01'),
        new Date('2026-06-30')
      )

      expect(result.actualCostCents).toBe(80000)
      expect(result.estimatedCostCents).toBe(13000) // (5000*2) + (3000*1)
      expect(result.totalCostCents).toBe(93000)
      expect(result.source).toBe('MIXED')
      expect(result.actualPercentage).toBeCloseTo(86.02, 1)
      expect(result.breakdown.consumptionRecords).toBe(30)
      expect(result.breakdown.saleItemsWithActual).toBe(2)
      expect(result.breakdown.saleItemsWithEstimated).toBe(2)
    })

    it('should return ACTUAL when all costs come from consumption', async () => {
      ;(mockPrisma.inventoryConsumption.aggregate as jest.Mock).mockResolvedValue({
        _sum: { totalCostCents: 50000 },
        _count: { id: 20 },
      })

      ;(mockPrisma.inventoryConsumption.groupBy as jest.Mock).mockResolvedValue([
        { saleItemId: 'item-1' },
      ])

      ;(mockPrisma.saleItem.findMany as jest.Mock).mockResolvedValue([])

      const result = await FinancialTruthService.getCombinedPeriodCost(
        'business-1',
        new Date('2026-06-01'),
        new Date('2026-06-30')
      )

      expect(result.source).toBe('ACTUAL')
      expect(result.actualPercentage).toBe(100)
    })

    it('should return ESTIMATED when no consumption records exist', async () => {
      ;(mockPrisma.inventoryConsumption.aggregate as jest.Mock).mockResolvedValue({
        _sum: { totalCostCents: null },
        _count: { id: 0 },
      })

      ;(mockPrisma.inventoryConsumption.groupBy as jest.Mock).mockResolvedValue([])

      ;(mockPrisma.saleItem.findMany as jest.Mock).mockResolvedValue([
        { id: 'item-1', menuItem: { costCents: 3000 }, quantity: 1 },
      ])

      const result = await FinancialTruthService.getCombinedPeriodCost(
        'business-1',
        new Date('2026-06-01'),
        new Date('2026-06-30')
      )

      expect(result.source).toBe('ESTIMATED')
      expect(result.actualPercentage).toBe(0)
    })
  })

  describe('Cost Source Labeling', () => {
    it('should clearly distinguish actual vs estimated costs', async () => {
      const mockSale = {
        id: 'sale-mixed',
        items: [
          {
            id: 'item-actual',
            menuItemId: 'menu-1',
            menuItem: { name: 'Burger', costCents: 3000 },
            quantity: 1,
            consumptionState: 'CONSUMED',
            inventoryConsumption: [
              { id: 'cons-1', totalCostCents: 3200, state: 'ACTIVE' },
            ],
          },
          {
            id: 'item-estimated',
            menuItemId: 'menu-2',
            menuItem: { name: 'Drink', costCents: 500 },
            quantity: 1,
            consumptionState: 'SKIPPED',
            inventoryConsumption: [],
          },
        ],
      }

      ;(mockPrisma.sale.findUnique as jest.Mock).mockResolvedValue(mockSale)

      const result = await FinancialTruthService.getSaleCost('sale-mixed')

      // Verify each item has correct source label
      const actualItem = result.itemBreakdown.find(i => i.saleItemId === 'item-actual')
      const estimatedItem = result.itemBreakdown.find(i => i.saleItemId === 'item-estimated')

      expect(actualItem?.source).toBe('ACTUAL')
      expect(actualItem?.actualCostCents).toBe(3200)
      expect(actualItem?.estimatedCostCents).toBe(3000)
      expect(actualItem?.costCents).toBe(3200) // Uses actual

      expect(estimatedItem?.source).toBe('ESTIMATED')
      expect(estimatedItem?.actualCostCents).toBeNull()
      expect(estimatedItem?.estimatedCostCents).toBe(500)
      expect(estimatedItem?.costCents).toBe(500) // Uses estimated
    })
  })
})
