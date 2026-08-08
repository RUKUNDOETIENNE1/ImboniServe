/**
 * FinancialTruthService
 * 
 * Provides actual operational food cost calculations derived from InventoryConsumption.
 * This is the authoritative source of financial truth for the Restaurant Operating System.
 * 
 * Key responsibilities:
 * - Calculate actual food cost from InventoryConsumption records
 * - Provide fallback to estimated costs for historical data
 * - Support drill-down traceability from executive reports to inventory
 * - Clearly distinguish actual vs estimated costs
 * 
 * @see KITCHEN_CONSUMPTION_ENGINE_ARCHITECTURE.md
 * @see FINANCIAL_TRUTH_MIGRATION_REPORT.md
 */

import { prisma } from '@/lib/prisma'
import { Prisma, PrismaClient } from '@prisma/client'

// ─── Types ─────────────────────────────────────────────────────────────────

export type CostSource = 'ACTUAL' | 'ESTIMATED' | 'MIXED'

export interface SaleCostResult {
  saleId: string
  actualCostCents: number
  estimatedCostCents: number
  totalCostCents: number
  source: CostSource
  itemBreakdown: SaleItemCostResult[]
}

export interface SaleItemCostResult {
  saleItemId: string
  menuItemId: string
  menuItemName: string
  quantity: number
  actualCostCents: number | null
  estimatedCostCents: number
  costCents: number
  source: CostSource
  consumptionState: string | null
  consumptionIds: string[]
}

export interface PeriodCostResult {
  startDate: Date
  endDate: Date
  actualCostCents: number
  estimatedCostCents: number
  totalCostCents: number
  source: CostSource
  salesWithActualCost: number
  salesWithEstimatedCost: number
  totalSales: number
  actualCostPercentage: number
}

export interface CostTraceability {
  saleId: string
  saleItemId: string
  menuItemId: string
  menuItemName: string
  recipeId: string | null
  recipeName: string | null
  consumptions: ConsumptionTrace[]
  totalCostCents: number
  source: CostSource
}

export interface ConsumptionTrace {
  consumptionId: string
  inventoryItemId: string
  inventoryItemName: string
  quantityConsumed: number
  unit: string
  unitCostAtConsumptionCents: number
  totalCostCents: number
  inventoryUpdateId: string | null
  state: string
  createdAt: Date
}

// ─── Transaction Client Type ───────────────────────────────────────────────

type TransactionClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>

// ─── Service ───────────────────────────────────────────────────────────────

export class FinancialTruthService {
  /**
   * Get the actual food cost for a single sale.
   * Falls back to estimated cost for items without consumption records.
   */
  static async getSaleCost(saleId: string): Promise<SaleCostResult> {
    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        items: {
          include: {
            menuItem: true,
            inventoryConsumption: {
              where: { state: 'ACTIVE' },
            },
          },
        },
      },
    })

    if (!sale) {
      throw new Error(`Sale not found: ${saleId}`)
    }

    const itemBreakdown: SaleItemCostResult[] = []
    let totalActualCostCents = 0
    let totalEstimatedCostCents = 0

    for (const item of sale.items) {
      const estimatedCostCents = item.menuItem.costCents * item.quantity
      
      // Sum actual consumption costs
      const actualCostCents = item.inventoryConsumption.reduce(
        (sum, c) => sum + c.totalCostCents,
        0
      )

      const hasActualCost = item.inventoryConsumption.length > 0
      const source: CostSource = hasActualCost ? 'ACTUAL' : 'ESTIMATED'
      const costCents = hasActualCost ? actualCostCents : estimatedCostCents

      itemBreakdown.push({
        saleItemId: item.id,
        menuItemId: item.menuItemId,
        menuItemName: item.menuItem.name,
        quantity: item.quantity,
        actualCostCents: hasActualCost ? actualCostCents : null,
        estimatedCostCents,
        costCents,
        source,
        consumptionState: item.consumptionState,
        consumptionIds: item.inventoryConsumption.map(c => c.id),
      })

      if (hasActualCost) {
        totalActualCostCents += actualCostCents
      } else {
        totalEstimatedCostCents += estimatedCostCents
      }
    }

    // Determine overall source
    const hasAnyActual = totalActualCostCents > 0
    const hasAnyEstimated = totalEstimatedCostCents > 0
    let source: CostSource
    if (hasAnyActual && hasAnyEstimated) {
      source = 'MIXED'
    } else if (hasAnyActual) {
      source = 'ACTUAL'
    } else {
      source = 'ESTIMATED'
    }

    return {
      saleId,
      actualCostCents: totalActualCostCents,
      estimatedCostCents: totalEstimatedCostCents,
      totalCostCents: totalActualCostCents + totalEstimatedCostCents,
      source,
      itemBreakdown,
    }
  }

  /**
   * Get aggregated food cost for a period.
   * Uses actual consumption where available, estimated otherwise.
   */
  static async getPeriodCost(
    businessId: string,
    startDate: Date,
    endDate: Date
  ): Promise<PeriodCostResult> {
    // Get all completed sales in the period
    const sales = await prisma.sale.findMany({
      where: {
        businessId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        paymentStatus: 'COMPLETED',
      },
      include: {
        items: {
          include: {
            menuItem: true,
            inventoryConsumption: {
              where: { state: 'ACTIVE' },
            },
          },
        },
      },
    })

    let totalActualCostCents = 0
    let totalEstimatedCostCents = 0
    let salesWithActualCost = 0
    let salesWithEstimatedCost = 0

    for (const sale of sales) {
      let saleHasActual = false
      let saleHasEstimated = false

      for (const item of sale.items) {
        const hasConsumption = item.inventoryConsumption.length > 0

        if (hasConsumption) {
          const actualCost = item.inventoryConsumption.reduce(
            (sum, c) => sum + c.totalCostCents,
            0
          )
          totalActualCostCents += actualCost
          saleHasActual = true
        } else {
          const estimatedCost = item.menuItem.costCents * item.quantity
          totalEstimatedCostCents += estimatedCost
          saleHasEstimated = true
        }
      }

      // Count sales by cost source
      if (saleHasActual && !saleHasEstimated) {
        salesWithActualCost++
      } else if (!saleHasActual && saleHasEstimated) {
        salesWithEstimatedCost++
      } else if (saleHasActual && saleHasEstimated) {
        // Mixed - count as actual since we have some real data
        salesWithActualCost++
      }
    }

    const totalCostCents = totalActualCostCents + totalEstimatedCostCents
    const totalSales = sales.length
    const actualCostPercentage = totalCostCents > 0
      ? (totalActualCostCents / totalCostCents) * 100
      : 0

    // Determine overall source
    let source: CostSource
    if (totalActualCostCents > 0 && totalEstimatedCostCents > 0) {
      source = 'MIXED'
    } else if (totalActualCostCents > 0) {
      source = 'ACTUAL'
    } else {
      source = 'ESTIMATED'
    }

    return {
      startDate,
      endDate,
      actualCostCents: totalActualCostCents,
      estimatedCostCents: totalEstimatedCostCents,
      totalCostCents,
      source,
      salesWithActualCost,
      salesWithEstimatedCost,
      totalSales,
      actualCostPercentage,
    }
  }

  /**
   * Get daily cost breakdown for a period.
   * Useful for trend analysis and daily reports.
   */
  static async getDailyCostBreakdown(
    businessId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    date: Date
    actualCostCents: number
    estimatedCostCents: number
    totalCostCents: number
    source: CostSource
    salesCount: number
  }[]> {
    const days: Date[] = []
    const current = new Date(startDate)
    while (current <= endDate) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }

    const results = await Promise.all(
      days.map(async (day) => {
        const dayStart = new Date(day)
        dayStart.setHours(0, 0, 0, 0)
        const dayEnd = new Date(day)
        dayEnd.setHours(23, 59, 59, 999)

        const periodCost = await this.getPeriodCost(businessId, dayStart, dayEnd)

        return {
          date: dayStart,
          actualCostCents: periodCost.actualCostCents,
          estimatedCostCents: periodCost.estimatedCostCents,
          totalCostCents: periodCost.totalCostCents,
          source: periodCost.source,
          salesCount: periodCost.totalSales,
        }
      })
    )

    return results
  }

  /**
   * Get full traceability for a sale item's cost.
   * Supports drill-down from executive reports to inventory.
   */
  static async getCostTraceability(saleItemId: string): Promise<CostTraceability> {
    const saleItem = await prisma.saleItem.findUnique({
      where: { id: saleItemId },
      include: {
        sale: true,
        menuItem: {
          include: {
            recipe: true,
          },
        },
        inventoryConsumption: {
          include: {
            inventoryItem: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!saleItem) {
      throw new Error(`SaleItem not found: ${saleItemId}`)
    }

    const consumptions: ConsumptionTrace[] = saleItem.inventoryConsumption.map(c => ({
      consumptionId: c.id,
      inventoryItemId: c.inventoryItemId,
      inventoryItemName: c.inventoryItem.name,
      quantityConsumed: c.quantityConsumed,
      unit: c.unit,
      unitCostAtConsumptionCents: c.unitCostAtConsumptionCents,
      totalCostCents: c.totalCostCents,
      inventoryUpdateId: c.inventoryUpdateId,
      state: c.state,
      createdAt: c.createdAt,
    }))

    const actualCostCents = consumptions
      .filter(c => c.state === 'ACTIVE')
      .reduce((sum, c) => sum + c.totalCostCents, 0)

    const hasActualCost = consumptions.length > 0
    const estimatedCostCents = saleItem.menuItem.costCents * saleItem.quantity
    const totalCostCents = hasActualCost ? actualCostCents : estimatedCostCents
    const source: CostSource = hasActualCost ? 'ACTUAL' : 'ESTIMATED'

    return {
      saleId: saleItem.saleId,
      saleItemId: saleItem.id,
      menuItemId: saleItem.menuItemId,
      menuItemName: saleItem.menuItem.name,
      recipeId: saleItem.menuItem.recipeId,
      recipeName: saleItem.menuItem.recipe?.name || null,
      consumptions,
      totalCostCents,
      source,
    }
  }

  /**
   * Aggregate actual consumption cost directly from InventoryConsumption.
   * This is the most efficient query for large datasets.
   */
  static async getAggregatedConsumptionCost(
    businessId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalActualCostCents: number
    consumptionCount: number
    uniqueSaleItems: number
  }> {
    const result = await prisma.inventoryConsumption.aggregate({
      where: {
        businessId,
        state: 'ACTIVE',
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        totalCostCents: true,
      },
      _count: {
        id: true,
      },
    })

    // Count unique sale items
    const uniqueSaleItems = await prisma.inventoryConsumption.groupBy({
      by: ['saleItemId'],
      where: {
        businessId,
        state: 'ACTIVE',
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    })

    return {
      totalActualCostCents: result._sum.totalCostCents || 0,
      consumptionCount: result._count.id,
      uniqueSaleItems: uniqueSaleItems.length,
    }
  }

  /**
   * Get estimated cost for sales without consumption records.
   * Used to calculate fallback costs for historical data.
   */
  static async getEstimatedCostForSalesWithoutConsumption(
    businessId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalEstimatedCostCents: number
    saleItemCount: number
  }> {
    // Find sale items that have no consumption records
    const saleItemsWithoutConsumption = await prisma.saleItem.findMany({
      where: {
        sale: {
          businessId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          paymentStatus: 'COMPLETED',
        },
        inventoryConsumption: {
          none: {},
        },
      },
      include: {
        menuItem: true,
      },
    })

    let totalEstimatedCostCents = 0
    for (const item of saleItemsWithoutConsumption) {
      totalEstimatedCostCents += item.menuItem.costCents * item.quantity
    }

    return {
      totalEstimatedCostCents,
      saleItemCount: saleItemsWithoutConsumption.length,
    }
  }

  /**
   * Get combined cost (actual + estimated fallback) for a period.
   * This is the primary method for executive reporting.
   */
  static async getCombinedPeriodCost(
    businessId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalCostCents: number
    actualCostCents: number
    estimatedCostCents: number
    source: CostSource
    actualPercentage: number
    breakdown: {
      consumptionRecords: number
      saleItemsWithActual: number
      saleItemsWithEstimated: number
    }
  }> {
    // Get actual consumption cost
    const actualResult = await this.getAggregatedConsumptionCost(
      businessId,
      startDate,
      endDate
    )

    // Get estimated cost for items without consumption
    const estimatedResult = await this.getEstimatedCostForSalesWithoutConsumption(
      businessId,
      startDate,
      endDate
    )

    const totalCostCents = actualResult.totalActualCostCents + estimatedResult.totalEstimatedCostCents
    const actualPercentage = totalCostCents > 0
      ? (actualResult.totalActualCostCents / totalCostCents) * 100
      : 0

    // Determine source
    let source: CostSource
    if (actualResult.totalActualCostCents > 0 && estimatedResult.totalEstimatedCostCents > 0) {
      source = 'MIXED'
    } else if (actualResult.totalActualCostCents > 0) {
      source = 'ACTUAL'
    } else {
      source = 'ESTIMATED'
    }

    return {
      totalCostCents,
      actualCostCents: actualResult.totalActualCostCents,
      estimatedCostCents: estimatedResult.totalEstimatedCostCents,
      source,
      actualPercentage,
      breakdown: {
        consumptionRecords: actualResult.consumptionCount,
        saleItemsWithActual: actualResult.uniqueSaleItems,
        saleItemsWithEstimated: estimatedResult.saleItemCount,
      },
    }
  }
}
