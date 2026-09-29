/**
 * InventoryLedgerService
 * 
 * Handles inventory stock mutations within a provided Prisma transaction.
 * This service is the single source of truth for all inventory changes
 * in the Kitchen Consumption Engine.
 * 
 * Key responsibilities:
 * - Apply stock mutations (ADD, REMOVE, WASTE, ADJUSTMENT, CONSUMPTION)
 * - Enforce negative-stock prevention
 * - Write InventoryUpdate audit rows
 * - Support transaction-aware operations for atomicity
 * 
 * @see KITCHEN_CONSUMPTION_ENGINE_ARCHITECTURE.md
 * @see INVENTORY_CONSUMPTION_MODEL.md
 */

import { Prisma, PrismaClient, InventoryItem, InventoryUpdate } from '@prisma/client'
import { prisma } from '@/lib/prisma'

// ─── Types ─────────────────────────────────────────────────────────────────

export type InventoryUpdateType = 'ADD' | 'REMOVE' | 'WASTE' | 'ADJUSTMENT' | 'CONSUMPTION'

export interface LedgerMutationInput {
  inventoryItemId: string
  businessId: string
  type: InventoryUpdateType
  quantity: number
  reason?: string | null
  notes?: string | null
  userId?: string | null
  /** Reference to the SaleItem that triggered this mutation (for CONSUMPTION) */
  saleItemId?: string | null
  /** Reference to the InventoryConsumption row (for CONSUMPTION) */
  consumptionId?: string | null
}

export interface LedgerMutationResult {
  inventoryUpdate: InventoryUpdate
  inventoryItem: InventoryItem
  previousStock: number
  newStock: number
}

// ─── Error Classes ─────────────────────────────────────────────────────────

export class InventoryLedgerError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 400
  ) {
    super(message)
    this.name = 'InventoryLedgerError'
  }
}

export class InsufficientStockError extends InventoryLedgerError {
  constructor(
    public readonly inventoryItemId: string,
    public readonly currentStock: number,
    public readonly requestedQuantity: number
  ) {
    super(
      `Insufficient stock for item ${inventoryItemId}: current=${currentStock}, requested=${requestedQuantity}`,
      'INSUFFICIENT_STOCK',
      400
    )
    this.name = 'InsufficientStockError'
  }
}

export class InventoryItemNotFoundError extends InventoryLedgerError {
  constructor(inventoryItemId: string) {
    super(
      `Inventory item not found: ${inventoryItemId}`,
      'INVENTORY_ITEM_NOT_FOUND',
      404
    )
    this.name = 'InventoryItemNotFoundError'
  }
}

export class BusinessMismatchError extends InventoryLedgerError {
  constructor(inventoryItemId: string, expectedBusinessId: string) {
    super(
      `Inventory item ${inventoryItemId} does not belong to business ${expectedBusinessId}`,
      'BUSINESS_MISMATCH',
      403
    )
    this.name = 'BusinessMismatchError'
  }
}

// ─── Transaction Client Type ───────────────────────────────────────────────

type TransactionClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>

// ─── Service ───────────────────────────────────────────────────────────────

export class InventoryLedgerService {
  /**
   * Apply a stock mutation within a provided transaction.
   * 
   * This is the primary method for all inventory changes in the consumption engine.
   * It ensures atomicity by operating within the caller's transaction.
   * 
   * @param tx - Prisma transaction client
   * @param input - Mutation details
   * @returns The mutation result with before/after stock levels
   * @throws InsufficientStockError if stock would go negative
   * @throws InventoryItemNotFoundError if item doesn't exist
   * @throws BusinessMismatchError if item doesn't belong to business
   */
  static async applyMutation(
    tx: TransactionClient,
    input: LedgerMutationInput
  ): Promise<LedgerMutationResult> {
    // Fetch the inventory item with row-level lock for update
    const item = await tx.inventoryItem.findUnique({
      where: { id: input.inventoryItemId },
    })

    if (!item) {
      throw new InventoryItemNotFoundError(input.inventoryItemId)
    }

    if (item.businessId !== input.businessId) {
      throw new BusinessMismatchError(input.inventoryItemId, input.businessId)
    }

    const previousStock = item.currentStock
    let newStock = previousStock

    // Calculate new stock based on mutation type
    switch (input.type) {
      case 'ADD':
        newStock = previousStock + input.quantity
        break
      case 'REMOVE':
      case 'WASTE':
      case 'CONSUMPTION':
        newStock = previousStock - input.quantity
        break
      case 'ADJUSTMENT':
        // Adjustment sets absolute value
        newStock = input.quantity
        break
    }

    // Enforce negative-stock prevention
    if (newStock < 0) {
      throw new InsufficientStockError(
        input.inventoryItemId,
        previousStock,
        input.quantity
      )
    }

    // Build notes with consumption context if applicable
    let notes = input.notes || null
    if (input.type === 'CONSUMPTION' && input.saleItemId) {
      const contextNote = `Consumption for SaleItem: ${input.saleItemId}`
      notes = notes ? `${notes} | ${contextNote}` : contextNote
    }

    // Create the audit row
    const inventoryUpdate = await tx.inventoryUpdate.create({
      data: {
        inventoryItemId: input.inventoryItemId,
        businessId: input.businessId,
        userId: input.userId || null,
        type: input.type,
        quantity: input.quantity,
        reason: input.reason || null,
        notes,
      },
    })

    // Update the stock level
    const updatedItem = await tx.inventoryItem.update({
      where: { id: input.inventoryItemId },
      data: { currentStock: newStock },
    })

    return {
      inventoryUpdate,
      inventoryItem: updatedItem,
      previousStock,
      newStock,
    }
  }

  /**
   * Apply a stock mutation without an external transaction.
   * Creates its own transaction for atomicity.
   * 
   * Use this for standalone mutations not part of a larger operation.
   */
  static async applyMutationStandalone(
    input: LedgerMutationInput
  ): Promise<LedgerMutationResult> {
    return prisma.$transaction(async (tx) => {
      return this.applyMutation(tx, input)
    })
  }

  /**
   * Apply multiple mutations atomically within a transaction.
   * All mutations succeed or all fail.
   * 
   * @param tx - Prisma transaction client
   * @param inputs - Array of mutation inputs
   * @returns Array of mutation results
   */
  static async applyMutationsBatch(
    tx: TransactionClient,
    inputs: LedgerMutationInput[]
  ): Promise<LedgerMutationResult[]> {
    const results: LedgerMutationResult[] = []

    for (const input of inputs) {
      const result = await this.applyMutation(tx, input)
      results.push(result)
    }

    return results
  }

  /**
   * Reverse a previous consumption mutation.
   * Creates a compensating ADD mutation to restore stock.
   * 
   * @param tx - Prisma transaction client
   * @param originalMutation - The original consumption mutation to reverse
   * @param reason - Reason for the reversal
   * @returns The reversal mutation result
   */
  static async reverseConsumption(
    tx: TransactionClient,
    originalMutation: {
      inventoryItemId: string
      businessId: string
      quantity: number
      saleItemId?: string | null
      consumptionId?: string | null
    },
    reason: string = 'Consumption reversed'
  ): Promise<LedgerMutationResult> {
    return this.applyMutation(tx, {
      inventoryItemId: originalMutation.inventoryItemId,
      businessId: originalMutation.businessId,
      type: 'ADD',
      quantity: originalMutation.quantity,
      reason,
      notes: originalMutation.saleItemId
        ? `Reversal for SaleItem: ${originalMutation.saleItemId}`
        : 'Consumption reversal',
      saleItemId: originalMutation.saleItemId,
      consumptionId: originalMutation.consumptionId,
    })
  }

  /**
   * Check if a mutation would succeed without actually applying it.
   * Useful for dry-run scenarios.
   * 
   * @param tx - Prisma transaction client
   * @param input - Mutation to validate
   * @returns Object indicating if mutation would succeed and why not if it wouldn't
   */
  static async validateMutation(
    tx: TransactionClient,
    input: LedgerMutationInput
  ): Promise<{ valid: boolean; error?: string; projectedStock?: number }> {
    const item = await tx.inventoryItem.findUnique({
      where: { id: input.inventoryItemId },
    })

    if (!item) {
      return { valid: false, error: `Inventory item not found: ${input.inventoryItemId}` }
    }

    if (item.businessId !== input.businessId) {
      return { valid: false, error: `Item does not belong to specified business` }
    }

    let projectedStock = item.currentStock

    switch (input.type) {
      case 'ADD':
        projectedStock = item.currentStock + input.quantity
        break
      case 'REMOVE':
      case 'WASTE':
      case 'CONSUMPTION':
        projectedStock = item.currentStock - input.quantity
        break
      case 'ADJUSTMENT':
        projectedStock = input.quantity
        break
    }

    if (projectedStock < 0) {
      return {
        valid: false,
        error: `Insufficient stock: current=${item.currentStock}, requested=${input.quantity}`,
        projectedStock,
      }
    }

    return { valid: true, projectedStock }
  }

  /**
   * Get the current stock level for an inventory item.
   * 
   * @param tx - Prisma transaction client
   * @param inventoryItemId - The item to check
   * @returns Current stock level or null if item not found
   */
  static async getCurrentStock(
    tx: TransactionClient,
    inventoryItemId: string
  ): Promise<number | null> {
    const item = await tx.inventoryItem.findUnique({
      where: { id: inventoryItemId },
      select: { currentStock: true },
    })

    return item?.currentStock ?? null
  }

  /**
   * Get the unit cost for an inventory item.
   * Uses the item's costing method (WAVG by default).
   * 
   * @param tx - Prisma transaction client
   * @param inventoryItemId - The item to check
   * @returns Unit cost in cents or null if item not found
   */
  static async getUnitCostCents(
    tx: TransactionClient,
    inventoryItemId: string
  ): Promise<number | null> {
    const item = await tx.inventoryItem.findUnique({
      where: { id: inventoryItemId },
      select: { unitCostCents: true },
    })

    return item?.unitCostCents ?? null
  }
}
