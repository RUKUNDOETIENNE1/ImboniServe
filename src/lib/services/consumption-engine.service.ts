/**
 * ConsumptionEngineService
 * 
 * Core engine for inventory consumption when kitchen items are prepared.
 * This service is triggered when a SaleItem transitions from NEW → PREPARING.
 * 
 * Key responsibilities:
 * - Resolve recipe for a SaleItem via MenuItem.recipeId
 * - Expand ingredients (including sub-recipes with bounded recursion)
 * - Compute normalized quantities based on recipe yield
 * - Compute cost-at-consumption using InventoryItem.unitCostCents
 * - Write InventoryConsumption audit rows
 * - Use InventoryLedgerService for stock mutations
 * - Handle consumption reversal for cancelled items
 * 
 * @see KITCHEN_CONSUMPTION_ENGINE_ARCHITECTURE.md
 * @see INVENTORY_CONSUMPTION_MODEL.md
 */

import { Prisma, PrismaClient, InventoryConsumption, SaleItem, Recipe, RecipeIngredient, InventoryItem } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { InventoryLedgerService, InsufficientStockError } from './inventory-ledger.service'

// ─── Constants ─────────────────────────────────────────────────────────────

/** Maximum depth for sub-recipe expansion to prevent infinite loops */
const MAX_SUB_RECIPE_DEPTH = 3

/** Consumption states for SaleItem.consumptionState */
export const ConsumptionState = {
  PENDING: 'PENDING',
  CONSUMED: 'CONSUMED',
  REVERSED: 'REVERSED',
  SKIPPED: 'SKIPPED',
} as const

export type ConsumptionStateType = typeof ConsumptionState[keyof typeof ConsumptionState]

// ─── Types ─────────────────────────────────────────────────────────────────

export interface ConsumptionLine {
  inventoryItemId: string
  inventoryItemName: string
  recipeIngredientId: string
  quantity: number
  unit: string
  unitCostCents: number
  totalCostCents: number
}

export interface ConsumptionResult {
  saleItemId: string
  recipeId: string | null
  recipeVersion: number | null
  state: ConsumptionStateType
  lines: ConsumptionLine[]
  totalCostCents: number
  consumptionIds: string[]
  inventoryUpdateIds: string[]
}

export interface ReversalResult {
  saleItemId: string
  originalConsumptionIds: string[]
  reversalConsumptionIds: string[]
  totalReversedCostCents: number
}

export interface DryRunResult {
  saleItemId: string
  recipeId: string | null
  wouldSucceed: boolean
  lines: ConsumptionLine[]
  totalCostCents: number
  errors: string[]
}

// ─── Error Classes ─────────────────────────────────────────────────────────

export class ConsumptionEngineError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 400
  ) {
    super(message)
    this.name = 'ConsumptionEngineError'
  }
}

export class SaleItemNotFoundError extends ConsumptionEngineError {
  constructor(saleItemId: string) {
    super(`SaleItem not found: ${saleItemId}`, 'SALE_ITEM_NOT_FOUND', 404)
    this.name = 'SaleItemNotFoundError'
  }
}

export class NoRecipeError extends ConsumptionEngineError {
  constructor(menuItemId: string) {
    super(`No recipe attached to MenuItem: ${menuItemId}`, 'NO_RECIPE', 400)
    this.name = 'NoRecipeError'
  }
}

export class RecipeNotActiveError extends ConsumptionEngineError {
  constructor(recipeId: string) {
    super(`Recipe is not active: ${recipeId}`, 'RECIPE_NOT_ACTIVE', 400)
    this.name = 'RecipeNotActiveError'
  }
}

export class AlreadyConsumedError extends ConsumptionEngineError {
  constructor(saleItemId: string, currentState: string) {
    super(
      `SaleItem ${saleItemId} already processed: state=${currentState}`,
      'ALREADY_CONSUMED',
      409
    )
    this.name = 'AlreadyConsumedError'
  }
}

export class SubRecipeDepthExceededError extends ConsumptionEngineError {
  constructor(recipeId: string, depth: number) {
    super(
      `Sub-recipe depth exceeded for recipe ${recipeId}: depth=${depth}, max=${MAX_SUB_RECIPE_DEPTH}`,
      'SUB_RECIPE_DEPTH_EXCEEDED',
      400
    )
    this.name = 'SubRecipeDepthExceededError'
  }
}

// ─── Transaction Client Type ───────────────────────────────────────────────

type TransactionClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>

// ─── Expanded Ingredient Type ──────────────────────────────────────────────

interface ExpandedIngredient {
  recipeIngredientId: string
  inventoryItemId: string
  inventoryItem: InventoryItem
  quantity: number
  unit: string
}

// ─── Service ───────────────────────────────────────────────────────────────

export class ConsumptionEngineService {
  /**
   * Consume inventory for a SaleItem.
   * 
   * This is the main entry point called when a SaleItem transitions to PREPARING.
   * It atomically:
   * 1. Validates the SaleItem and its consumptionState
   * 2. Resolves the recipe from MenuItem
   * 3. Expands all ingredients (including sub-recipes)
   * 4. Computes quantities and costs
   * 5. Deducts inventory via InventoryLedgerService
   * 6. Creates InventoryConsumption audit rows
   * 7. Updates SaleItem.consumptionState to CONSUMED
   * 
   * @param tx - Prisma transaction client
   * @param saleItemId - The SaleItem to consume for
   * @param actorUserId - The user performing the action (optional)
   * @returns ConsumptionResult with all consumption details
   */
  static async consumeForSaleItem(
    tx: TransactionClient,
    saleItemId: string,
    actorUserId?: string
  ): Promise<ConsumptionResult> {
    // 1. Fetch SaleItem with MenuItem and Recipe
    const saleItem = await tx.saleItem.findUnique({
      where: { id: saleItemId },
      include: {
        menuItem: {
          include: {
            recipe: {
              include: {
                ingredients: {
                  include: {
                    inventoryItem: true,
                    subRecipe: {
                      include: {
                        ingredients: {
                          include: {
                            inventoryItem: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        sale: {
          select: {
            businessId: true,
          },
        },
      },
    })

    if (!saleItem) {
      throw new SaleItemNotFoundError(saleItemId)
    }

    const businessId = saleItem.sale.businessId

    // 2. Check consumptionState - idempotency guard
    if (saleItem.consumptionState === ConsumptionState.CONSUMED) {
      throw new AlreadyConsumedError(saleItemId, ConsumptionState.CONSUMED)
    }
    if (saleItem.consumptionState === ConsumptionState.REVERSED) {
      throw new AlreadyConsumedError(saleItemId, ConsumptionState.REVERSED)
    }
    if (saleItem.consumptionState === ConsumptionState.SKIPPED) {
      throw new AlreadyConsumedError(saleItemId, ConsumptionState.SKIPPED)
    }

    // 3. Check for recipe
    const recipe = saleItem.menuItem.recipe
    if (!recipe) {
      // No recipe attached - mark as SKIPPED and return
      await tx.saleItem.update({
        where: { id: saleItemId },
        data: { consumptionState: ConsumptionState.SKIPPED },
      })

      return {
        saleItemId,
        recipeId: null,
        recipeVersion: null,
        state: ConsumptionState.SKIPPED,
        lines: [],
        totalCostCents: 0,
        consumptionIds: [],
        inventoryUpdateIds: [],
      }
    }

    // 4. Check recipe is active (published)
    if (!recipe.isActive || !recipe.notes?.startsWith('__PUBLISHED__')) {
      throw new RecipeNotActiveError(recipe.id)
    }

    // 5. Expand ingredients (including sub-recipes)
    const expandedIngredients = await this.expandIngredients(
      tx,
      recipe.ingredients,
      saleItem.quantity,
      recipe.yieldQuantity,
      0
    )

    // 6. Process each ingredient
    const lines: ConsumptionLine[] = []
    const consumptionIds: string[] = []
    const inventoryUpdateIds: string[] = []
    let totalCostCents = 0

    for (const ingredient of expandedIngredients) {
      const unitCostCents = ingredient.inventoryItem.unitCostCents || 0
      const lineTotalCostCents = Math.round(ingredient.quantity * unitCostCents)

      // Deduct from inventory
      const ledgerResult = await InventoryLedgerService.applyMutation(tx, {
        inventoryItemId: ingredient.inventoryItemId,
        businessId,
        type: 'CONSUMPTION',
        quantity: ingredient.quantity,
        reason: `Recipe consumption: ${recipe.name}`,
        saleItemId,
        userId: actorUserId,
      })

      // Create InventoryConsumption record
      const consumption = await tx.inventoryConsumption.create({
        data: {
          businessId,
          saleItemId,
          inventoryItemId: ingredient.inventoryItemId,
          recipeId: recipe.id,
          recipeIngredientId: ingredient.recipeIngredientId,
          quantityConsumed: ingredient.quantity,
          unit: ingredient.unit,
          unitCostAtConsumptionCents: unitCostCents,
          totalCostCents: lineTotalCostCents,
          inventoryUpdateId: ledgerResult.inventoryUpdate.id,
          state: 'ACTIVE',
          actorUserId,
        },
      })

      lines.push({
        inventoryItemId: ingredient.inventoryItemId,
        inventoryItemName: ingredient.inventoryItem.name,
        recipeIngredientId: ingredient.recipeIngredientId,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
        unitCostCents,
        totalCostCents: lineTotalCostCents,
      })

      consumptionIds.push(consumption.id)
      inventoryUpdateIds.push(ledgerResult.inventoryUpdate.id)
      totalCostCents += lineTotalCostCents
    }

    // 7. Update SaleItem.consumptionState
    await tx.saleItem.update({
      where: { id: saleItemId },
      data: { consumptionState: ConsumptionState.CONSUMED },
    })

    return {
      saleItemId,
      recipeId: recipe.id,
      recipeVersion: recipe.version,
      state: ConsumptionState.CONSUMED,
      lines,
      totalCostCents,
      consumptionIds,
      inventoryUpdateIds,
    }
  }

  /**
   * Reverse consumption for a SaleItem.
   * 
   * Called when a SaleItem is cancelled after being prepared.
   * Creates compensating InventoryConsumption rows and restores stock.
   * 
   * @param tx - Prisma transaction client
   * @param saleItemId - The SaleItem to reverse
   * @param reasonCode - Reason for reversal
   * @param actorUserId - The user performing the action
   * @returns ReversalResult with reversal details
   */
  static async reverseForSaleItem(
    tx: TransactionClient,
    saleItemId: string,
    reasonCode: string = 'CANCELLED',
    actorUserId?: string
  ): Promise<ReversalResult> {
    // 1. Fetch SaleItem
    const saleItem = await tx.saleItem.findUnique({
      where: { id: saleItemId },
      include: {
        sale: {
          select: { businessId: true },
        },
      },
    })

    if (!saleItem) {
      throw new SaleItemNotFoundError(saleItemId)
    }

    // 2. Check consumptionState
    if (saleItem.consumptionState !== ConsumptionState.CONSUMED) {
      throw new ConsumptionEngineError(
        `Cannot reverse SaleItem ${saleItemId}: state=${saleItem.consumptionState}, expected=CONSUMED`,
        'INVALID_STATE_FOR_REVERSAL',
        400
      )
    }

    const businessId = saleItem.sale.businessId

    // 3. Fetch all active consumptions for this SaleItem
    const consumptions = await tx.inventoryConsumption.findMany({
      where: {
        saleItemId,
        state: 'ACTIVE',
      },
      include: {
        inventoryItem: true,
      },
    })

    if (consumptions.length === 0) {
      // No consumptions to reverse - just update state
      await tx.saleItem.update({
        where: { id: saleItemId },
        data: { consumptionState: ConsumptionState.REVERSED },
      })

      return {
        saleItemId,
        originalConsumptionIds: [],
        reversalConsumptionIds: [],
        totalReversedCostCents: 0,
      }
    }

    // 4. Create reversal for each consumption
    const originalConsumptionIds: string[] = []
    const reversalConsumptionIds: string[] = []
    let totalReversedCostCents = 0

    for (const consumption of consumptions) {
      // Restore inventory
      const ledgerResult = await InventoryLedgerService.reverseConsumption(
        tx,
        {
          inventoryItemId: consumption.inventoryItemId,
          businessId,
          quantity: consumption.quantityConsumed,
          saleItemId,
          consumptionId: consumption.id,
        },
        `Reversal: ${reasonCode}`
      )

      // Create reversal consumption record
      const reversalConsumption = await tx.inventoryConsumption.create({
        data: {
          businessId,
          saleItemId,
          inventoryItemId: consumption.inventoryItemId,
          recipeId: consumption.recipeId,
          recipeIngredientId: consumption.recipeIngredientId,
          quantityConsumed: -consumption.quantityConsumed, // Negative for reversal
          unit: consumption.unit,
          unitCostAtConsumptionCents: consumption.unitCostAtConsumptionCents,
          totalCostCents: -consumption.totalCostCents, // Negative for reversal
          inventoryUpdateId: ledgerResult.inventoryUpdate.id,
          state: 'REVERSAL',
          reversedByConsumptionId: null, // This IS the reversal
          reasonCode,
          actorUserId,
        },
      })

      // Mark original consumption as reversed
      await tx.inventoryConsumption.update({
        where: { id: consumption.id },
        data: {
          state: 'REVERSED',
          reversedByConsumptionId: reversalConsumption.id,
        },
      })

      originalConsumptionIds.push(consumption.id)
      reversalConsumptionIds.push(reversalConsumption.id)
      totalReversedCostCents += consumption.totalCostCents
    }

    // 5. Update SaleItem.consumptionState
    await tx.saleItem.update({
      where: { id: saleItemId },
      data: { consumptionState: ConsumptionState.REVERSED },
    })

    return {
      saleItemId,
      originalConsumptionIds,
      reversalConsumptionIds,
      totalReversedCostCents,
    }
  }

  /**
   * Perform a dry run of consumption without actually modifying data.
   * Useful for previewing what would be consumed and checking for errors.
   * 
   * @param tx - Prisma transaction client
   * @param saleItemId - The SaleItem to simulate
   * @returns DryRunResult with projected consumption
   */
  static async dryRun(
    tx: TransactionClient,
    saleItemId: string
  ): Promise<DryRunResult> {
    const errors: string[] = []

    // 1. Fetch SaleItem
    const saleItem = await tx.saleItem.findUnique({
      where: { id: saleItemId },
      include: {
        menuItem: {
          include: {
            recipe: {
              include: {
                ingredients: {
                  include: {
                    inventoryItem: true,
                    subRecipe: {
                      include: {
                        ingredients: {
                          include: {
                            inventoryItem: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        sale: {
          select: { businessId: true },
        },
      },
    })

    if (!saleItem) {
      return {
        saleItemId,
        recipeId: null,
        wouldSucceed: false,
        lines: [],
        totalCostCents: 0,
        errors: [`SaleItem not found: ${saleItemId}`],
      }
    }

    const businessId = saleItem.sale.businessId
    const recipe = saleItem.menuItem.recipe

    if (!recipe) {
      return {
        saleItemId,
        recipeId: null,
        wouldSucceed: true, // Would be SKIPPED, which is valid
        lines: [],
        totalCostCents: 0,
        errors: [],
      }
    }

    // Check recipe state
    if (!recipe.isActive || !recipe.notes?.startsWith('__PUBLISHED__')) {
      errors.push(`Recipe ${recipe.id} is not published`)
    }

    // Expand ingredients
    let expandedIngredients: ExpandedIngredient[] = []
    try {
      expandedIngredients = await this.expandIngredients(
        tx,
        recipe.ingredients,
        saleItem.quantity,
        recipe.yieldQuantity,
        0
      )
    } catch (e) {
      if (e instanceof SubRecipeDepthExceededError) {
        errors.push(e.message)
      } else {
        throw e
      }
    }

    // Check stock availability
    const lines: ConsumptionLine[] = []
    let totalCostCents = 0

    for (const ingredient of expandedIngredients) {
      const unitCostCents = ingredient.inventoryItem.unitCostCents || 0
      const lineTotalCostCents = Math.round(ingredient.quantity * unitCostCents)

      // Validate stock
      const validation = await InventoryLedgerService.validateMutation(tx, {
        inventoryItemId: ingredient.inventoryItemId,
        businessId,
        type: 'CONSUMPTION',
        quantity: ingredient.quantity,
      })

      if (!validation.valid) {
        errors.push(
          `Insufficient stock for ${ingredient.inventoryItem.name}: ${validation.error}`
        )
      }

      lines.push({
        inventoryItemId: ingredient.inventoryItemId,
        inventoryItemName: ingredient.inventoryItem.name,
        recipeIngredientId: ingredient.recipeIngredientId,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
        unitCostCents,
        totalCostCents: lineTotalCostCents,
      })

      totalCostCents += lineTotalCostCents
    }

    return {
      saleItemId,
      recipeId: recipe.id,
      wouldSucceed: errors.length === 0,
      lines,
      totalCostCents,
      errors,
    }
  }

  /**
   * Expand recipe ingredients, including sub-recipes.
   * Handles yield scaling and bounded recursion.
   */
  private static async expandIngredients(
    tx: TransactionClient,
    ingredients: (RecipeIngredient & {
      inventoryItem: InventoryItem | null
      subRecipe?: (Recipe & {
        ingredients: (RecipeIngredient & {
          inventoryItem: InventoryItem | null
        })[]
      }) | null
    })[],
    portionQuantity: number,
    recipeYield: number,
    depth: number
  ): Promise<ExpandedIngredient[]> {
    if (depth > MAX_SUB_RECIPE_DEPTH) {
      throw new SubRecipeDepthExceededError('unknown', depth)
    }

    const expanded: ExpandedIngredient[] = []
    const scaleFactor = portionQuantity / recipeYield

    for (const ingredient of ingredients) {
      // Skip optional ingredients for now (could be configurable)
      if (ingredient.isOptional) {
        continue
      }

      if (ingredient.inventoryItemId && ingredient.inventoryItem) {
        // Direct inventory item
        const scaledQuantity = ingredient.quantity * scaleFactor * ingredient.yieldFactor

        expanded.push({
          recipeIngredientId: ingredient.id,
          inventoryItemId: ingredient.inventoryItemId,
          inventoryItem: ingredient.inventoryItem,
          quantity: scaledQuantity,
          unit: ingredient.unit,
        })
      } else if (ingredient.subRecipeId && ingredient.subRecipe) {
        // Sub-recipe - recursively expand
        const subRecipeIngredients = ingredient.subRecipe.ingredients.map(i => ({
          ...i,
          subRecipe: null, // Prevent further nesting in type
        }))

        const subExpanded = await this.expandIngredients(
          tx,
          subRecipeIngredients as any,
          ingredient.quantity * scaleFactor,
          ingredient.subRecipe.yieldQuantity,
          depth + 1
        )

        expanded.push(...subExpanded)
      }
    }

    return expanded
  }

  /**
   * Get consumption history for a SaleItem.
   */
  static async getConsumptionHistory(
    tx: TransactionClient,
    saleItemId: string
  ): Promise<InventoryConsumption[]> {
    return tx.inventoryConsumption.findMany({
      where: { saleItemId },
      orderBy: { createdAt: 'asc' },
      include: {
        inventoryItem: true,
        recipe: true,
      },
    })
  }

  /**
   * Get total food cost for a Sale.
   */
  static async getSaleFoodCost(
    tx: TransactionClient,
    saleId: string
  ): Promise<number> {
    const result = await tx.inventoryConsumption.aggregate({
      where: {
        saleItem: {
          saleId,
        },
        state: 'ACTIVE',
      },
      _sum: {
        totalCostCents: true,
      },
    })

    return result._sum.totalCostCents || 0
  }
}
