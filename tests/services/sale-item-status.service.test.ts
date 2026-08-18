/**
 * UNIT TESTS: SaleItemStatusService
 * Tests status transitions, consumption triggers, and reversal
 * 
 * Priority: HIGHEST
 * Coverage Target: 100%
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import type { Mock } from 'jest-mock'

// Mock StateMachineService
const mockStateMachineService = {
  validateTransition: jest.fn() as Mock<any>,
  getAllowedTransitions: jest.fn() as Mock<any>,
}

jest.mock('@/lib/services/state-machine.service', () => ({
  StateMachineService: mockStateMachineService,
}))

// Mock ConsumptionEngineService
const mockConsumptionEngineService = {
  consumeForSaleItem: jest.fn() as Mock<any>,
  reverseForSaleItem: jest.fn() as Mock<any>,
  dryRun: jest.fn() as Mock<any>,
}

jest.mock('@/lib/services/consumption-engine.service', () => ({
  ConsumptionEngineService: mockConsumptionEngineService,
  ConsumptionState: {
    PENDING: 'PENDING',
    CONSUMED: 'CONSUMED',
    REVERSED: 'REVERSED',
    SKIPPED: 'SKIPPED',
  },
}))

// Mock TicketEventService
const mockTicketEventService = {
  recordEventTx: jest.fn() as Mock<any>,
}

jest.mock('@/lib/services/ticket-event.service', () => ({
  TicketEventService: mockTicketEventService,
}))

// Mock Prisma client
const mockPrisma = {
  saleItem: {
    findUnique: jest.fn() as Mock<any>,
    update: jest.fn() as Mock<any>,
  },
  $transaction: jest.fn((fn: any) => fn(mockPrisma)) as Mock<any>,
}

jest.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}))

// Import after mocking
import {
  SaleItemStatusService,
  SaleItemStatusError,
  InvalidTransitionError,
  SaleItemNotFoundError,
  StationMismatchError,
} from '@/lib/services/sale-item-status.service'

describe('SaleItemStatusService', () => {
  const businessId = 'biz-123'
  const saleItemId = 'sale-item-123'
  const saleId = 'sale-123'
  const stationId = 'station-123'
  const userId = 'user-123'

  const mockSaleItem = {
    id: saleItemId,
    saleId,
    menuItemId: 'menu-item-123',
    itemStatus: 'NEW',
    consumptionState: 'PENDING',
    stationId,
    quantity: 1,
    sale: {
      id: saleId,
      businessId,
      orderNumber: 'ORD-001',
    },
    menuItem: {
      name: 'Grilled Chicken',
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    // Reset environment variables
    delete process.env.KITCHEN_CONSUMPTION_ENGINE_MODE
    delete process.env.KITCHEN_CONSUMPTION_PILOT_BUSINESS_IDS
  })

  // ─── Basic Transitions ───────────────────────────────────────────────────

  describe('Basic transitions', () => {
    it('should transition from NEW to PREPARING', async () => {
      mockPrisma.saleItem.findUnique.mockResolvedValue(mockSaleItem)
      mockStateMachineService.validateTransition.mockReturnValue({ isValid: true })
      mockPrisma.saleItem.update.mockResolvedValue({
        ...mockSaleItem,
        itemStatus: 'PREPARING',
        prepStartedAt: new Date(),
      })
      mockTicketEventService.recordEventTx.mockResolvedValue({ id: 'event-1' })

      const result = await SaleItemStatusService.transition({
        saleItemId,
        newStatus: 'PREPARING',
        actorUserId: userId,
      })

      expect(result.success).toBe(true)
      expect(result.previousStatus).toBe('NEW')
      expect(result.newStatus).toBe('PREPARING')
      expect(result.idempotent).toBe(false)
      expect(mockPrisma.saleItem.update).toHaveBeenCalledWith({
        where: { id: saleItemId },
        data: expect.objectContaining({
          itemStatus: 'PREPARING',
          prepStartedAt: expect.any(Date),
        }),
      })
    })

    it('should transition from PREPARING to READY', async () => {
      mockPrisma.saleItem.findUnique.mockResolvedValue({
        ...mockSaleItem,
        itemStatus: 'PREPARING',
      })
      mockStateMachineService.validateTransition.mockReturnValue({ isValid: true })
      mockPrisma.saleItem.update.mockResolvedValue({
        ...mockSaleItem,
        itemStatus: 'READY',
        readyAt: new Date(),
      })
      mockTicketEventService.recordEventTx.mockResolvedValue({ id: 'event-1' })

      const result = await SaleItemStatusService.transition({
        saleItemId,
        newStatus: 'READY',
      })

      expect(result.success).toBe(true)
      expect(result.newStatus).toBe('READY')
      expect(mockPrisma.saleItem.update).toHaveBeenCalledWith({
        where: { id: saleItemId },
        data: expect.objectContaining({
          itemStatus: 'READY',
          readyAt: expect.any(Date),
        }),
      })
    })

    it('should transition from READY to DELIVERED', async () => {
      mockPrisma.saleItem.findUnique.mockResolvedValue({
        ...mockSaleItem,
        itemStatus: 'READY',
      })
      mockStateMachineService.validateTransition.mockReturnValue({ isValid: true })
      mockPrisma.saleItem.update.mockResolvedValue({
        ...mockSaleItem,
        itemStatus: 'DELIVERED',
        deliveredAt: new Date(),
      })
      mockTicketEventService.recordEventTx.mockResolvedValue({ id: 'event-1' })

      const result = await SaleItemStatusService.transition({
        saleItemId,
        newStatus: 'DELIVERED',
      })

      expect(result.success).toBe(true)
      expect(result.newStatus).toBe('DELIVERED')
    })

    it('should handle idempotent transition (same state)', async () => {
      mockPrisma.saleItem.findUnique.mockResolvedValue(mockSaleItem)
      mockStateMachineService.validateTransition.mockReturnValue({ isValid: true })

      const result = await SaleItemStatusService.transition({
        saleItemId,
        newStatus: 'NEW', // Same as current
      })

      expect(result.success).toBe(true)
      expect(result.idempotent).toBe(true)
      expect(mockPrisma.saleItem.update).not.toHaveBeenCalled()
    })
  })

  // ─── Invalid Transitions ─────────────────────────────────────────────────

  describe('Invalid transitions', () => {
    it('should reject invalid transition', async () => {
      mockPrisma.saleItem.findUnique.mockResolvedValue(mockSaleItem)
      mockStateMachineService.validateTransition.mockReturnValue({
        isValid: false,
        error: 'Invalid transition',
        allowedTransitions: ['PREPARING', 'CANCELED'],
      })

      await expect(
        SaleItemStatusService.transition({
          saleItemId,
          newStatus: 'DELIVERED', // Invalid from NEW
        })
      ).rejects.toThrow(InvalidTransitionError)
    })

    it('should reject non-existent SaleItem', async () => {
      mockPrisma.saleItem.findUnique.mockResolvedValue(null)

      await expect(
        SaleItemStatusService.transition({
          saleItemId: 'non-existent',
          newStatus: 'PREPARING',
        })
      ).rejects.toThrow(SaleItemNotFoundError)
    })

    it('should reject station mismatch', async () => {
      mockPrisma.saleItem.findUnique.mockResolvedValue(mockSaleItem)

      await expect(
        SaleItemStatusService.transition({
          saleItemId,
          newStatus: 'PREPARING',
          stationId: 'different-station',
        })
      ).rejects.toThrow(StationMismatchError)
    })
  })

  // ─── Consumption Trigger ─────────────────────────────────────────────────

  describe('Consumption trigger (NEW → PREPARING)', () => {
    beforeEach(() => {
      process.env.KITCHEN_CONSUMPTION_ENGINE_MODE = 'enforce'
      process.env.KITCHEN_CONSUMPTION_PILOT_BUSINESS_IDS = businessId
    })

    it('should trigger consumption on NEW → PREPARING in enforce mode', async () => {
      mockPrisma.saleItem.findUnique.mockResolvedValue(mockSaleItem)
      mockStateMachineService.validateTransition.mockReturnValue({ isValid: true })
      mockConsumptionEngineService.consumeForSaleItem.mockResolvedValue({
        saleItemId,
        recipeId: 'recipe-123',
        recipeVersion: 1,
        state: 'CONSUMED',
        lines: [{ inventoryItemId: 'inv-1', quantity: 150, totalCostCents: 7500 }],
        totalCostCents: 7500,
        consumptionIds: ['c-1'],
        inventoryUpdateIds: ['u-1'],
      })
      mockPrisma.saleItem.update.mockResolvedValue({
        ...mockSaleItem,
        itemStatus: 'PREPARING',
      })
      mockTicketEventService.recordEventTx.mockResolvedValue({ id: 'event-1' })

      const result = await SaleItemStatusService.transition({
        saleItemId,
        newStatus: 'PREPARING',
        actorUserId: userId,
      })

      expect(result.success).toBe(true)
      expect(result.consumptionResult).toBeDefined()
      expect(result.consumptionResult?.state).toBe('CONSUMED')
      expect(mockConsumptionEngineService.consumeForSaleItem).toHaveBeenCalledWith(
        mockPrisma,
        saleItemId,
        userId
      )
    })

    it('should NOT trigger consumption when engine mode is off', async () => {
      process.env.KITCHEN_CONSUMPTION_ENGINE_MODE = 'off'

      mockPrisma.saleItem.findUnique.mockResolvedValue(mockSaleItem)
      mockStateMachineService.validateTransition.mockReturnValue({ isValid: true })
      mockPrisma.saleItem.update.mockResolvedValue({
        ...mockSaleItem,
        itemStatus: 'PREPARING',
      })
      mockTicketEventService.recordEventTx.mockResolvedValue({ id: 'event-1' })

      const result = await SaleItemStatusService.transition({
        saleItemId,
        newStatus: 'PREPARING',
      })

      expect(result.success).toBe(true)
      expect(result.consumptionResult).toBeUndefined()
      expect(mockConsumptionEngineService.consumeForSaleItem).not.toHaveBeenCalled()
    })

    it('should NOT trigger consumption when business not in pilot', async () => {
      process.env.KITCHEN_CONSUMPTION_PILOT_BUSINESS_IDS = 'other-business'

      mockPrisma.saleItem.findUnique.mockResolvedValue(mockSaleItem)
      mockStateMachineService.validateTransition.mockReturnValue({ isValid: true })
      mockPrisma.saleItem.update.mockResolvedValue({
        ...mockSaleItem,
        itemStatus: 'PREPARING',
      })
      mockTicketEventService.recordEventTx.mockResolvedValue({ id: 'event-1' })

      const result = await SaleItemStatusService.transition({
        saleItemId,
        newStatus: 'PREPARING',
      })

      expect(result.consumptionResult).toBeUndefined()
      expect(mockConsumptionEngineService.consumeForSaleItem).not.toHaveBeenCalled()
    })

    it('should run dry-run in shadow mode', async () => {
      process.env.KITCHEN_CONSUMPTION_ENGINE_MODE = 'shadow'

      mockPrisma.saleItem.findUnique.mockResolvedValue(mockSaleItem)
      mockStateMachineService.validateTransition.mockReturnValue({ isValid: true })
      mockConsumptionEngineService.dryRun.mockResolvedValue({
        saleItemId,
        recipeId: 'recipe-123',
        wouldSucceed: true,
        lines: [],
        totalCostCents: 7500,
        errors: [],
      })
      mockPrisma.saleItem.update.mockResolvedValue({
        ...mockSaleItem,
        itemStatus: 'PREPARING',
      })
      mockTicketEventService.recordEventTx.mockResolvedValue({ id: 'event-1' })

      const result = await SaleItemStatusService.transition({
        saleItemId,
        newStatus: 'PREPARING',
      })

      expect(result.success).toBe(true)
      expect(result.consumptionResult).toBeUndefined() // No actual consumption
      expect(mockConsumptionEngineService.dryRun).toHaveBeenCalled()
      expect(mockConsumptionEngineService.consumeForSaleItem).not.toHaveBeenCalled()
    })
  })

  // ─── Consumption Reversal ────────────────────────────────────────────────

  describe('Consumption reversal (PREPARING/READY → CANCELED)', () => {
    beforeEach(() => {
      process.env.KITCHEN_CONSUMPTION_ENGINE_MODE = 'enforce'
      process.env.KITCHEN_CONSUMPTION_PILOT_BUSINESS_IDS = businessId
    })

    it('should trigger reversal on PREPARING → CANCELED', async () => {
      mockPrisma.saleItem.findUnique.mockResolvedValue({
        ...mockSaleItem,
        itemStatus: 'PREPARING',
        consumptionState: 'CONSUMED',
      })
      mockStateMachineService.validateTransition.mockReturnValue({ isValid: true })
      mockConsumptionEngineService.reverseForSaleItem.mockResolvedValue({
        saleItemId,
        originalConsumptionIds: ['c-1'],
        reversalConsumptionIds: ['r-1'],
        totalReversedCostCents: 7500,
      })
      mockPrisma.saleItem.update.mockResolvedValue({
        ...mockSaleItem,
        itemStatus: 'CANCELED',
      })
      mockTicketEventService.recordEventTx.mockResolvedValue({ id: 'event-1' })

      const result = await SaleItemStatusService.transition({
        saleItemId,
        newStatus: 'CANCELED',
        actorUserId: userId,
      })

      expect(result.success).toBe(true)
      expect(result.reversalResult).toBeDefined()
      expect(result.reversalResult?.totalReversedCostCents).toBe(7500)
      expect(mockConsumptionEngineService.reverseForSaleItem).toHaveBeenCalled()
    })

    it('should NOT trigger reversal if consumption was SKIPPED', async () => {
      mockPrisma.saleItem.findUnique.mockResolvedValue({
        ...mockSaleItem,
        itemStatus: 'PREPARING',
        consumptionState: 'SKIPPED',
      })
      mockStateMachineService.validateTransition.mockReturnValue({ isValid: true })
      mockPrisma.saleItem.update.mockResolvedValue({
        ...mockSaleItem,
        itemStatus: 'CANCELED',
      })
      mockTicketEventService.recordEventTx.mockResolvedValue({ id: 'event-1' })

      const result = await SaleItemStatusService.transition({
        saleItemId,
        newStatus: 'CANCELED',
      })

      expect(result.success).toBe(true)
      expect(result.reversalResult).toBeUndefined()
      expect(mockConsumptionEngineService.reverseForSaleItem).not.toHaveBeenCalled()
    })

    it('should NOT trigger reversal when engine mode is off', async () => {
      process.env.KITCHEN_CONSUMPTION_ENGINE_MODE = 'off'

      mockPrisma.saleItem.findUnique.mockResolvedValue({
        ...mockSaleItem,
        itemStatus: 'PREPARING',
        consumptionState: 'CONSUMED',
      })
      mockStateMachineService.validateTransition.mockReturnValue({ isValid: true })
      mockPrisma.saleItem.update.mockResolvedValue({
        ...mockSaleItem,
        itemStatus: 'CANCELED',
      })
      mockTicketEventService.recordEventTx.mockResolvedValue({ id: 'event-1' })

      const result = await SaleItemStatusService.transition({
        saleItemId,
        newStatus: 'CANCELED',
      })

      expect(result.reversalResult).toBeUndefined()
      expect(mockConsumptionEngineService.reverseForSaleItem).not.toHaveBeenCalled()
    })
  })

  // ─── Error Classes ───────────────────────────────────────────────────────

  describe('Error classes', () => {
    it('InvalidTransitionError has correct properties', () => {
      const error = new InvalidTransitionError('NEW', 'DELIVERED', ['PREPARING', 'CANCELED'])
      expect(error.code).toBe('INVALID_TRANSITION')
      expect(error.statusCode).toBe(400)
      expect(error.currentStatus).toBe('NEW')
      expect(error.newStatus).toBe('DELIVERED')
      expect(error.allowedTransitions).toEqual(['PREPARING', 'CANCELED'])
    })

    it('SaleItemNotFoundError has correct properties', () => {
      const error = new SaleItemNotFoundError(saleItemId)
      expect(error.code).toBe('SALE_ITEM_NOT_FOUND')
      expect(error.statusCode).toBe(404)
    })

    it('StationMismatchError has correct properties', () => {
      const error = new StationMismatchError(saleItemId, 'expected', 'actual')
      expect(error.code).toBe('STATION_MISMATCH')
      expect(error.statusCode).toBe(400)
    })
  })

  // ─── Helper Methods ──────────────────────────────────────────────────────

  describe('Helper methods', () => {
    it('should get current status', async () => {
      mockPrisma.saleItem.findUnique.mockResolvedValue({
        itemStatus: 'PREPARING',
        consumptionState: 'CONSUMED',
      })
      mockStateMachineService.getAllowedTransitions.mockReturnValue(['READY', 'CANCELED'])

      const result = await SaleItemStatusService.getStatus(saleItemId)

      expect(result).toEqual({
        itemStatus: 'PREPARING',
        consumptionState: 'CONSUMED',
        allowedTransitions: ['READY', 'CANCELED'],
      })
    })

    it('should return null for non-existent item', async () => {
      mockPrisma.saleItem.findUnique.mockResolvedValue(null)

      const result = await SaleItemStatusService.getStatus('non-existent')

      expect(result).toBeNull()
    })

    it('should validate transition without performing it', async () => {
      mockPrisma.saleItem.findUnique.mockResolvedValue({
        itemStatus: 'NEW',
      })
      mockStateMachineService.validateTransition.mockReturnValue({
        isValid: true,
      })

      const result = await SaleItemStatusService.validateTransition(
        saleItemId,
        'PREPARING'
      )

      expect(result.valid).toBe(true)
      expect(result.currentStatus).toBe('NEW')
    })
  })

  // ─── Batch Transitions ───────────────────────────────────────────────────

  describe('Batch transitions', () => {
    it('should transition multiple items atomically', async () => {
      mockPrisma.saleItem.findUnique
        .mockResolvedValueOnce(mockSaleItem)
        .mockResolvedValueOnce({ ...mockSaleItem, id: 'sale-item-456' })

      mockStateMachineService.validateTransition.mockReturnValue({ isValid: true })
      mockPrisma.saleItem.update
        .mockResolvedValueOnce({ ...mockSaleItem, itemStatus: 'PREPARING' })
        .mockResolvedValueOnce({ ...mockSaleItem, id: 'sale-item-456', itemStatus: 'PREPARING' })

      mockTicketEventService.recordEventTx.mockResolvedValue({ id: 'event-1' })

      const results = await SaleItemStatusService.transitionBatch([
        { saleItemId, newStatus: 'PREPARING' },
        { saleItemId: 'sale-item-456', newStatus: 'PREPARING' },
      ])

      expect(results).toHaveLength(2)
      expect(results[0].success).toBe(true)
      expect(results[1].success).toBe(true)
    })
  })
})
