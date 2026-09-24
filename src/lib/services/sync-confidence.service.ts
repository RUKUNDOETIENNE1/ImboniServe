/**
 * Sync Confidence Service
 * Tracks sync state and confidence level for UI indicators
 * Reality Gap Fix: Priority 4
 * 
 * RULE: NEVER hide sync uncertainty, NEVER silently assume correctness
 */

export type SyncState = 'synced' | 'pending' | 'conflict' | 'outdated'

export interface SyncConfidence {
  state: SyncState
  lastSyncTime: Date | null
  pendingSince: Date | null
  conflictReason?: string
  isStale: boolean
}

export class SyncConfidenceService {
  private static itemStates = new Map<string, SyncConfidence>()
  private static orderStates = new Map<string, SyncConfidence>()

  /**
   * Mark item as synced
   */
  static markItemSynced(itemId: string): void {
    this.itemStates.set(itemId, {
      state: 'synced',
      lastSyncTime: new Date(),
      pendingSince: null,
      isStale: false,
    })
  }

  /**
   * Mark item as pending sync
   */
  static markItemPending(itemId: string): void {
    const existing = this.itemStates.get(itemId)

    this.itemStates.set(itemId, {
      state: 'pending',
      lastSyncTime: existing?.lastSyncTime || null,
      pendingSince: existing?.pendingSince || new Date(),
      isStale: false,
    })
  }

  /**
   * Mark item as conflict
   */
  static markItemConflict(itemId: string, reason: string): void {
    this.itemStates.set(itemId, {
      state: 'conflict',
      lastSyncTime: null,
      pendingSince: null,
      conflictReason: reason,
      isStale: false,
    })
  }

  /**
   * Mark item as outdated (needs refresh)
   */
  static markItemOutdated(itemId: string): void {
    const existing = this.itemStates.get(itemId)

    this.itemStates.set(itemId, {
      state: 'outdated',
      lastSyncTime: existing?.lastSyncTime || null,
      pendingSince: null,
      isStale: true,
    })
  }

  /**
   * Get item sync confidence
   */
  static getItemConfidence(itemId: string): SyncConfidence {
    const state = this.itemStates.get(itemId)

    if (!state) {
      // Unknown state - assume pending
      return {
        state: 'pending',
        lastSyncTime: null,
        pendingSince: new Date(),
        isStale: false,
      }
    }

    // Check if pending too long (>5 seconds = stale)
    if (state.state === 'pending' && state.pendingSince) {
      const pendingDuration = Date.now() - state.pendingSince.getTime()
      if (pendingDuration > 5000) {
        state.isStale = true
      }
    }

    return state
  }

  /**
   * Get visual indicator for item
   */
  static getItemIndicator(itemId: string): {
    color: 'green' | 'yellow' | 'red'
    icon: '🟢' | '🟡' | '🔴'
    label: string
    tooltip: string
  } {
    const confidence = this.getItemConfidence(itemId)

    switch (confidence.state) {
      case 'synced':
        return {
          color: 'green',
          icon: '🟢',
          label: 'Synced',
          tooltip: `Last synced: ${confidence.lastSyncTime?.toLocaleTimeString() || 'now'}`,
        }

      case 'pending':
        if (confidence.isStale) {
          return {
            color: 'red',
            icon: '🔴',
            label: 'Sync delayed',
            tooltip: 'Update taking longer than expected - check connection',
          }
        }
        return {
          color: 'yellow',
          icon: '🟡',
          label: 'Syncing...',
          tooltip: 'Update in progress',
        }

      case 'conflict':
        return {
          color: 'red',
          icon: '🔴',
          label: 'Conflict',
          tooltip: confidence.conflictReason || 'Conflicting update detected',
        }

      case 'outdated':
        return {
          color: 'red',
          icon: '🔴',
          label: 'Outdated',
          tooltip: 'Refresh needed - data may be stale',
        }

      default:
        return {
          color: 'yellow',
          icon: '🟡',
          label: 'Unknown',
          tooltip: 'Sync state unknown',
        }
    }
  }

  /**
   * Mark order as synced
   */
  static markOrderSynced(orderId: string): void {
    this.orderStates.set(orderId, {
      state: 'synced',
      lastSyncTime: new Date(),
      pendingSince: null,
      isStale: false,
    })
  }

  /**
   * Mark order as pending
   */
  static markOrderPending(orderId: string): void {
    const existing = this.orderStates.get(orderId)

    this.orderStates.set(orderId, {
      state: 'pending',
      lastSyncTime: existing?.lastSyncTime || null,
      pendingSince: existing?.pendingSince || new Date(),
      isStale: false,
    })
  }

  /**
   * Get order sync confidence
   */
  static getOrderConfidence(orderId: string): SyncConfidence {
    const state = this.orderStates.get(orderId)

    if (!state) {
      return {
        state: 'pending',
        lastSyncTime: null,
        pendingSince: new Date(),
        isStale: false,
      }
    }

    // Check if pending too long
    if (state.state === 'pending' && state.pendingSince) {
      const pendingDuration = Date.now() - state.pendingSince.getTime()
      if (pendingDuration > 5000) {
        state.isStale = true
      }
    }

    return state
  }

  /**
   * Clear stale states (cleanup)
   */
  static clearStaleStates(maxAge: number = 60000): void {
    const now = Date.now()

    // Clear item states
    for (const [itemId, state] of this.itemStates.entries()) {
      if (state.lastSyncTime && now - state.lastSyncTime.getTime() > maxAge) {
        this.itemStates.delete(itemId)
      }
    }

    // Clear order states
    for (const [orderId, state] of this.orderStates.entries()) {
      if (state.lastSyncTime && now - state.lastSyncTime.getTime() > maxAge) {
        this.orderStates.delete(orderId)
      }
    }
  }

  /**
   * Reset all states (e.g., on reconnect)
   */
  static resetAll(): void {
    this.itemStates.clear()
    this.orderStates.clear()
  }
}
