/**
 * State Machine Service
 * Enforces valid state transitions for SaleItem.itemStatus
 * Phase 3: Operational Hardening
 */

import type { ItemStatus } from '@prisma/client'

export interface TransitionValidation {
  isValid: boolean
  error?: string
  allowedTransitions?: ItemStatus[]
}

export class StateMachineService {
  /**
   * Define allowed state transitions
   * This is the single source of truth for state flow
   */
  private static readonly TRANSITIONS: Record<ItemStatus, ItemStatus[]> = {
    NEW: ['PREPARING', 'CANCELED'],
    PREPARING: ['READY', 'CANCELED'],
    READY: ['DELIVERED', 'CANCELED'],
    DELIVERED: [], // Terminal state
    CANCELED: [], // Terminal state
  }

  /**
   * Validate if a state transition is allowed
   */
  static validateTransition(
    currentState: ItemStatus | null,
    newState: ItemStatus
  ): TransitionValidation {
    // If no current state, only NEW is allowed
    if (!currentState) {
      if (newState === 'NEW') {
        return { isValid: true }
      }
      return {
        isValid: false,
        error: `Cannot transition from null to ${newState}. Only NEW is allowed.`,
        allowedTransitions: ['NEW'],
      }
    }

    // Check if transition is allowed
    const allowed = this.TRANSITIONS[currentState] || []

    if (allowed.includes(newState)) {
      return { isValid: true }
    }

    // Same state is idempotent (allowed)
    if (currentState === newState) {
      return { isValid: true }
    }

    return {
      isValid: false,
      error: `Invalid transition from ${currentState} to ${newState}`,
      allowedTransitions: allowed,
    }
  }

  /**
   * Get all allowed transitions for a given state
   */
  static getAllowedTransitions(currentState: ItemStatus | null): ItemStatus[] {
    if (!currentState) {
      return ['NEW']
    }

    return this.TRANSITIONS[currentState] || []
  }

  /**
   * Check if a state is terminal (no further transitions)
   */
  static isTerminalState(state: ItemStatus): boolean {
    return this.TRANSITIONS[state]?.length === 0
  }

  /**
   * Get the expected next state(s) for normal flow
   */
  static getExpectedNextStates(currentState: ItemStatus | null): ItemStatus[] {
    if (!currentState) return ['NEW']

    // Return non-CANCELED transitions as "expected" flow
    const allowed = this.TRANSITIONS[currentState] || []
    return allowed.filter((s) => s !== 'CANCELED')
  }

  /**
   * Validate and sanitize state transition with detailed error
   */
  static validateAndExplain(
    currentState: ItemStatus | null,
    newState: ItemStatus,
    context?: {
      itemId?: string
      orderId?: string
      stationId?: string
    }
  ): TransitionValidation & { contextMessage?: string } {
    const validation = this.validateTransition(currentState, newState)

    if (!validation.isValid) {
      let contextMessage = validation.error

      if (context) {
        const parts = []
        if (context.itemId) parts.push(`Item: ${context.itemId}`)
        if (context.orderId) parts.push(`Order: ${context.orderId}`)
        if (context.stationId) parts.push(`Station: ${context.stationId}`)

        if (parts.length > 0) {
          contextMessage = `${validation.error} (${parts.join(', ')})`
        }
      }

      return {
        ...validation,
        contextMessage,
      }
    }

    return validation
  }

  /**
   * Check if transition represents forward progress
   */
  static isForwardProgress(currentState: ItemStatus | null, newState: ItemStatus): boolean {
    const stateOrder: ItemStatus[] = ['NEW', 'PREPARING', 'READY', 'DELIVERED']

    const currentIndex = currentState ? stateOrder.indexOf(currentState) : -1
    const newIndex = stateOrder.indexOf(newState)

    return newIndex > currentIndex
  }

  /**
   * Resolve conflict between concurrent updates
   * Returns the state that should win
   */
  static resolveConflict(
    state1: ItemStatus,
    timestamp1: Date,
    state2: ItemStatus,
    timestamp2: Date
  ): ItemStatus {
    // If states are the same, no conflict
    if (state1 === state2) return state1

    // Terminal states always win
    if (this.isTerminalState(state1)) return state1
    if (this.isTerminalState(state2)) return state2

    // Forward progress wins over backward
    const state1Forward = this.isForwardProgress(state2, state1)
    const state2Forward = this.isForwardProgress(state1, state2)

    if (state1Forward && !state2Forward) return state1
    if (state2Forward && !state1Forward) return state2

    // If both forward or both backward, latest timestamp wins
    return timestamp1 > timestamp2 ? state1 : state2
  }
}
