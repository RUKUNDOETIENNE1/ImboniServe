/**
 * SaleItemStatusService
 * 
 * Owns all SaleItem.itemStatus transitions for kitchen execution.
 * This is the single point of control for status changes, ensuring:
 * - State machine validation
 * - Consumption trigger on NEW → PREPARING
 * - Consumption reversal on PREPARING/READY → CANCELED
 * - Atomic transaction handling
 * - TicketEvent audit trail
 * 
 * @see KITCHEN_CONSUMPTION_ENGINE_ARCHITECTURE.md
 * @see KITCHEN_CONSUMPTION_IMPLEMENTATION_EXECUTION_CONTRACT.md
 */

import { Prisma, PrismaClient, ItemStatus, SaleItem, TicketEventType } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { StateMachineService } from './state-machine.service'
import { ConsumptionEngineService, ConsumptionState, ConsumptionResult, ReversalResult } from './consumption-engine.service'
import { TicketEventService } from './ticket-event.service'

// ─── Types ─────────────────────────────────────────────────────────────────

export interface TransitionInput {
  saleItemId: string
  newStatus: ItemStatus
  stationId?: string
  actorUserId?: string
  idempotencyKey?: string
  metadata?: Record<string, any>
}

export interface TransitionResult {
  success: boolean
  saleItem: SaleItem
  previousStatus: ItemStatus | null
  newStatus: ItemStatus
  consumptionResult?: ConsumptionResult
  reversalResult?: ReversalResult
  idempotent: boolean
  ticketEventId?: string
}

// ─── Feature Flags ─────────────────────────────────────────────────────────

export type ConsumptionEngineMode = 'off' | 'shadow' | 'enforce'

function getConsumptionEngineMode(): ConsumptionEngineMode {
  const mode = process.env.KITCHEN_CONSUMPTION_ENGINE_MODE || 'off'
  if (mode === 'shadow' || mode === 'enforce') return mode
  return 'off'
}

function getPilotBusinessIds(): string[] {
  const ids = process.env.KITCHEN_CONSUMPTION_PILOT_BUSINESS_IDS || ''
  return ids.split(',').map(id => id.trim()).filter(Boolean)
}

function isBusinessInPilot(businessId: string): boolean {
  const pilotIds = getPilotBusinessIds()
  // Empty list means disabled for all
  if (pilotIds.length === 0) return false
  return pilotIds.includes(businessId)
}

// ─── Error Classes ─────────────────────────────────────────────────────────

export class SaleItemStatusError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 400
  ) {
    super(message)
    this.name = 'SaleItemStatusError'
  }
}

export class InvalidTransitionError extends SaleItemStatusError {
  constructor(
    public readonly currentStatus: ItemStatus | null,
    public readonly newStatus: ItemStatus,
    public readonly allowedTransitions: ItemStatus[]
  ) {
    super(
      `Invalid transition from ${currentStatus || 'null'} to ${newStatus}. Allowed: ${allowedTransitions.join(', ') || 'none'}`,
      'INVALID_TRANSITION',
      400
    )
    this.name = 'InvalidTransitionError'
  }
}

export class SaleItemNotFoundError extends SaleItemStatusError {
  constructor(saleItemId: string) {
    super(`SaleItem not found: ${saleItemId}`, 'SALE_ITEM_NOT_FOUND', 404)
    this.name = 'SaleItemNotFoundError'
  }
}

export class StationMismatchError extends SaleItemStatusError {
  constructor(saleItemId: string, expectedStationId: string, actualStationId: string | null) {
    super(
      `SaleItem ${saleItemId} does not belong to station ${expectedStationId} (actual: ${actualStationId || 'none'})`,
      'STATION_MISMATCH',
      400
    )
    this.name = 'StationMismatchError'
  }
}

// ─── Transaction Client Type ───────────────────────────────────────────────

type TransactionClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>

// ─── Service ───────────────────────────────────────────────────────────────

export class SaleItemStatusService {
  /**
   * Transition a SaleItem to a new status.
   * 
   * This is the main entry point for all status changes.
   * It handles:
   * - State machine validation
   * - Consumption on NEW → PREPARING
   * - Reversal on PREPARING/READY → CANCELED
   * - TicketEvent recording
   * 
   * @param input - Transition details
   * @returns TransitionResult with all details
   */
  static async transition(input: TransitionInput): Promise<TransitionResult> {
    return prisma.$transaction(async (tx) => {
      return this.transitionTx(tx, input)
    })
  }

  /**
   * Transition within an existing transaction.
   * Use this when you need to include the transition in a larger atomic operation.
   */
  static async transitionTx(
    tx: TransactionClient,
    input: TransitionInput
  ): Promise<TransitionResult> {
    const { saleItemId, newStatus, stationId, actorUserId, idempotencyKey, metadata } = input

    // 1. Fetch SaleItem
    const saleItem = await tx.saleItem.findUnique({
      where: { id: saleItemId },
      include: {
        sale: {
          select: {
            id: true,
            businessId: true,
            orderNumber: true,
          },
        },
        menuItem: {
          select: {
            name: true,
          },
        },
      },
    })

    if (!saleItem) {
      throw new SaleItemNotFoundError(saleItemId)
    }

    const businessId = saleItem.sale.businessId
    const previousStatus = saleItem.itemStatus

    // 2. Verify station if provided
    if (stationId && saleItem.stationId !== stationId) {
      throw new StationMismatchError(saleItemId, stationId, saleItem.stationId)
    }

    // 3. Validate state transition
    const validation = StateMachineService.validateTransition(previousStatus, newStatus)

    if (!validation.isValid) {
      throw new InvalidTransitionError(
        previousStatus,
        newStatus,
        validation.allowedTransitions || []
      )
    }

    // 4. Handle idempotent case (same state)
    if (previousStatus === newStatus) {
      return {
        success: true,
        saleItem: saleItem as SaleItem,
        previousStatus,
        newStatus,
        idempotent: true,
      }
    }

    // 5. Prepare update data
    const now = new Date()
    const updateData: Prisma.SaleItemUpdateInput = {
      itemStatus: newStatus,
    }

    switch (newStatus) {
      case 'PREPARING':
        updateData.prepStartedAt = now
        break
      case 'READY':
        updateData.readyAt = now
        break
      case 'DELIVERED':
        updateData.deliveredAt = now
        break
    }

    // 6. Handle consumption based on transition
    let consumptionResult: ConsumptionResult | undefined
    let reversalResult: ReversalResult | undefined

    const engineMode = getConsumptionEngineMode()
    const inPilot = isBusinessInPilot(businessId)

    // NEW → PREPARING: Trigger consumption
    if (previousStatus === 'NEW' && newStatus === 'PREPARING') {
      if (engineMode === 'enforce' && inPilot) {
        consumptionResult = await ConsumptionEngineService.consumeForSaleItem(
          tx,
          saleItemId,
          actorUserId
        )
      } else if (engineMode === 'shadow' && inPilot) {
        // Shadow mode: dry run only, no actual consumption
        const dryRun = await ConsumptionEngineService.dryRun(tx, saleItemId)
        // Log shadow result for monitoring
        console.log('[ConsumptionEngine:Shadow]', {
          saleItemId,
          businessId,
          wouldSucceed: dryRun.wouldSucceed,
          totalCostCents: dryRun.totalCostCents,
          errors: dryRun.errors,
        })
      }
    }

    // PREPARING/READY → CANCELED: Trigger reversal
    if (
      (previousStatus === 'PREPARING' || previousStatus === 'READY') &&
      newStatus === 'CANCELED'
    ) {
      if (engineMode === 'enforce' && inPilot) {
        // Only reverse if consumption was actually done
        if (saleItem.consumptionState === ConsumptionState.CONSUMED) {
          reversalResult = await ConsumptionEngineService.reverseForSaleItem(
            tx,
            saleItemId,
            'CANCELED',
            actorUserId
          )
        }
      }
    }

    // 7. Update SaleItem
    const updatedItem = await tx.saleItem.update({
      where: { id: saleItemId },
      data: updateData,
    })

    // 8. Record TicketEvent
    const eventTypeMap: Record<ItemStatus, TicketEventType> = {
      NEW: 'ITEM_CREATED',
      PREPARING: 'ITEM_PREPARING',
      READY: 'ITEM_READY',
      DELIVERED: 'ITEM_DELIVERED',
      CANCELED: 'ITEM_CANCELED',
    }

    let ticketEventId: string | undefined

    try {
      const ticketEvent = await TicketEventService.recordEventTx(tx, {
        saleId: saleItem.sale.id,
        saleItemId,
        stationId: saleItem.stationId || undefined,
        eventType: eventTypeMap[newStatus],
        actorId: actorUserId,
        previousState: previousStatus || undefined,
        newState: newStatus,
        metadata: {
          ...metadata,
          itemName: saleItem.menuItem.name,
          orderNumber: saleItem.sale.orderNumber,
          consumptionResult: consumptionResult
            ? {
                state: consumptionResult.state,
                totalCostCents: consumptionResult.totalCostCents,
                lineCount: consumptionResult.lines.length,
              }
            : undefined,
          reversalResult: reversalResult
            ? {
                totalReversedCostCents: reversalResult.totalReversedCostCents,
                lineCount: reversalResult.originalConsumptionIds.length,
              }
            : undefined,
        },
        idempotencyKey: idempotencyKey ? `status-${idempotencyKey}` : undefined,
      })
      ticketEventId = ticketEvent?.id
    } catch (eventError) {
      // Log but don't fail the transition
      console.error('[SaleItemStatusService] Failed to record TicketEvent:', eventError)
    }

    // 9. Record consumption-specific events
    if (consumptionResult && consumptionResult.state === ConsumptionState.CONSUMED) {
      try {
        await TicketEventService.recordEventTx(tx, {
          saleId: saleItem.sale.id,
          saleItemId,
          stationId: saleItem.stationId || undefined,
          eventType: 'INGREDIENTS_CONSUMED' as TicketEventType,
          actorId: actorUserId,
          metadata: {
            recipeId: consumptionResult.recipeId,
            recipeVersion: consumptionResult.recipeVersion,
            totalCostCents: consumptionResult.totalCostCents,
            lines: consumptionResult.lines.map(l => ({
              inventoryItemId: l.inventoryItemId,
              quantity: l.quantity,
              unit: l.unit,
              totalCostCents: l.totalCostCents,
            })),
          },
          idempotencyKey: idempotencyKey ? `consume-${idempotencyKey}` : undefined,
        })
      } catch (eventError) {
        console.error('[SaleItemStatusService] Failed to record INGREDIENTS_CONSUMED event:', eventError)
      }
    }

    if (reversalResult) {
      try {
        await TicketEventService.recordEventTx(tx, {
          saleId: saleItem.sale.id,
          saleItemId,
          stationId: saleItem.stationId || undefined,
          eventType: 'CONSUMPTION_REVERSED' as TicketEventType,
          actorId: actorUserId,
          metadata: {
            totalReversedCostCents: reversalResult.totalReversedCostCents,
            originalConsumptionIds: reversalResult.originalConsumptionIds,
            reversalConsumptionIds: reversalResult.reversalConsumptionIds,
            reasonCode: 'CANCELED',
          },
          idempotencyKey: idempotencyKey ? `reverse-${idempotencyKey}` : undefined,
        })
      } catch (eventError) {
        console.error('[SaleItemStatusService] Failed to record CONSUMPTION_REVERSED event:', eventError)
      }
    }

    return {
      success: true,
      saleItem: updatedItem,
      previousStatus,
      newStatus,
      consumptionResult,
      reversalResult,
      idempotent: false,
      ticketEventId,
    }
  }

  /**
   * Batch transition multiple SaleItems.
   * All transitions happen atomically.
   */
  static async transitionBatch(
    inputs: TransitionInput[]
  ): Promise<TransitionResult[]> {
    return prisma.$transaction(async (tx) => {
      const results: TransitionResult[] = []

      for (const input of inputs) {
        const result = await this.transitionTx(tx, input)
        results.push(result)
      }

      return results
    })
  }

  /**
   * Get the current status of a SaleItem.
   */
  static async getStatus(saleItemId: string): Promise<{
    itemStatus: ItemStatus
    consumptionState: string | null
    allowedTransitions: ItemStatus[]
  } | null> {
    const saleItem = await prisma.saleItem.findUnique({
      where: { id: saleItemId },
      select: {
        itemStatus: true,
        consumptionState: true,
      },
    })

    if (!saleItem) return null

    return {
      itemStatus: saleItem.itemStatus,
      consumptionState: saleItem.consumptionState,
      allowedTransitions: StateMachineService.getAllowedTransitions(saleItem.itemStatus),
    }
  }

  /**
   * Check if a transition would be valid without performing it.
   */
  static async validateTransition(
    saleItemId: string,
    newStatus: ItemStatus
  ): Promise<{
    valid: boolean
    currentStatus: ItemStatus | null
    error?: string
    allowedTransitions?: ItemStatus[]
  }> {
    const saleItem = await prisma.saleItem.findUnique({
      where: { id: saleItemId },
      select: { itemStatus: true },
    })

    if (!saleItem) {
      return {
        valid: false,
        currentStatus: null,
        error: 'SaleItem not found',
      }
    }

    const validation = StateMachineService.validateTransition(
      saleItem.itemStatus,
      newStatus
    )

    return {
      valid: validation.isValid,
      currentStatus: saleItem.itemStatus,
      error: validation.error,
      allowedTransitions: validation.allowedTransitions,
    }
  }
}
