/**
 * Service Replay™ - Statistics Calculator
 * 
 * Calculates live statistics during replay playback.
 * Tracks orders, tables, kitchen queue, payments, and reservations.
 */

import type { ReplayEvent, ReplayStatistics } from './types'

// ─────────────────────────────────────────────────────────────────────────────
// State Tracking
// ─────────────────────────────────────────────────────────────────────────────

interface OrderState {
  orderId: string
  orderNumber: string
  status: 'active' | 'completed' | 'canceled'
  tableId?: string
  itemsInKitchen: number
  itemsPreparing: number
  itemsReady: number
  paymentStatus: 'pending' | 'completed' | 'failed'
}

interface TableState {
  tableId: string
  tableNumber: string
  status: 'available' | 'occupied'
  activeOrders: string[]
}

interface ReservationState {
  reservationId: string
  status: 'pending' | 'confirmed' | 'seated' | 'canceled'
}

interface ReplayState {
  orders: Map<string, OrderState>
  tables: Map<string, TableState>
  reservations: Map<string, ReservationState>
  kitchenQueue: Set<string> // item IDs in queue
  itemsPreparing: Set<string>
  itemsReady: Set<string>
}

// ─────────────────────────────────────────────────────────────────────────────
// Statistics Calculator
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create empty statistics object
 */
export function createEmptyStatistics(replayTime?: string): ReplayStatistics {
  return {
    replayTime: replayTime || new Date().toISOString(),
    currentEvent: undefined,
    ordersActive: 0,
    ordersCompleted: 0,
    ordersCanceled: 0,
    tablesOccupied: 0,
    tablesAvailable: 0,
    kitchenQueue: 0,
    itemsPreparing: 0,
    itemsReady: 0,
    paymentsCompleted: 0,
    paymentsPending: 0,
    reservationsActive: 0,
    reservationsSeated: 0,
  }
}

/**
 * Create initial replay state
 */
function createInitialState(): ReplayState {
  return {
    orders: new Map(),
    tables: new Map(),
    reservations: new Map(),
    kitchenQueue: new Set(),
    itemsPreparing: new Set(),
    itemsReady: new Set(),
  }
}

/**
 * Apply an event to the replay state
 */
function applyEventToState(state: ReplayState, event: ReplayEvent): void {
  switch (event.eventType) {
    // Order Lifecycle
    case 'ORDER_CREATED': {
      if (event.orderId) {
        state.orders.set(event.orderId, {
          orderId: event.orderId,
          orderNumber: event.orderNumber || '',
          status: 'active',
          tableId: event.tableId,
          itemsInKitchen: 0,
          itemsPreparing: 0,
          itemsReady: 0,
          paymentStatus: 'pending',
        })
        
        // Mark table as occupied
        if (event.tableId) {
          const table = state.tables.get(event.tableId) || {
            tableId: event.tableId,
            tableNumber: event.tableNumber || '',
            status: 'available' as const,
            activeOrders: [],
          }
          table.status = 'occupied'
          table.activeOrders.push(event.orderId)
          state.tables.set(event.tableId, table)
        }
      }
      break
    }
    
    case 'ORDER_COMPLETED': {
      if (event.orderId) {
        const order = state.orders.get(event.orderId)
        if (order) {
          order.status = 'completed'
        }
      }
      break
    }
    
    case 'ORDER_CANCELED': {
      if (event.orderId) {
        const order = state.orders.get(event.orderId)
        if (order) {
          order.status = 'canceled'
        }
      }
      break
    }
    
    // Item Lifecycle
    case 'ITEM_ROUTED': {
      const itemId = (event.metadata as any)?.saleItemId
      if (itemId) {
        state.kitchenQueue.add(itemId)
        if (event.orderId) {
          const order = state.orders.get(event.orderId)
          if (order) {
            order.itemsInKitchen++
          }
        }
      }
      break
    }
    
    case 'ITEM_ACCEPTED':
    case 'ITEM_PREPARING': {
      const itemId = (event.metadata as any)?.saleItemId
      if (itemId) {
        state.kitchenQueue.delete(itemId)
        state.itemsPreparing.add(itemId)
        if (event.orderId) {
          const order = state.orders.get(event.orderId)
          if (order) {
            order.itemsInKitchen = Math.max(0, order.itemsInKitchen - 1)
            order.itemsPreparing++
          }
        }
      }
      break
    }
    
    case 'ITEM_READY': {
      const itemId = (event.metadata as any)?.saleItemId
      if (itemId) {
        state.itemsPreparing.delete(itemId)
        state.itemsReady.add(itemId)
        if (event.orderId) {
          const order = state.orders.get(event.orderId)
          if (order) {
            order.itemsPreparing = Math.max(0, order.itemsPreparing - 1)
            order.itemsReady++
          }
        }
      }
      break
    }
    
    case 'ITEM_DELIVERED': {
      const itemId = (event.metadata as any)?.saleItemId
      if (itemId) {
        state.itemsReady.delete(itemId)
        if (event.orderId) {
          const order = state.orders.get(event.orderId)
          if (order) {
            order.itemsReady = Math.max(0, order.itemsReady - 1)
          }
        }
      }
      break
    }
    
    case 'ITEM_CANCELED': {
      const itemId = (event.metadata as any)?.saleItemId
      if (itemId) {
        state.kitchenQueue.delete(itemId)
        state.itemsPreparing.delete(itemId)
        state.itemsReady.delete(itemId)
      }
      break
    }
    
    // Payment Events
    case 'PAYMENT_COMPLETED': {
      if (event.orderId) {
        const order = state.orders.get(event.orderId)
        if (order) {
          order.paymentStatus = 'completed'
        }
      }
      break
    }
    
    case 'PAYMENT_FAILED': {
      if (event.orderId) {
        const order = state.orders.get(event.orderId)
        if (order) {
          order.paymentStatus = 'failed'
        }
      }
      break
    }
    
    // Table Events
    case 'TABLE_OCCUPIED':
    case 'SESSION_STARTED': {
      if (event.tableId) {
        const table = state.tables.get(event.tableId) || {
          tableId: event.tableId,
          tableNumber: event.tableNumber || '',
          status: 'available' as const,
          activeOrders: [],
        }
        table.status = 'occupied'
        state.tables.set(event.tableId, table)
      }
      break
    }
    
    case 'TABLE_CLEARED':
    case 'SESSION_CLOSED': {
      if (event.tableId) {
        const table = state.tables.get(event.tableId)
        if (table) {
          table.status = 'available'
          table.activeOrders = []
        }
      }
      break
    }
    
    // Reservation Events
    case 'RESERVATION_CREATED':
    case 'RESERVATION_CONFIRMED': {
      if (event.reservationId) {
        state.reservations.set(event.reservationId, {
          reservationId: event.reservationId,
          status: event.eventType === 'RESERVATION_CONFIRMED' ? 'confirmed' : 'pending',
        })
      }
      break
    }
    
    case 'RESERVATION_SEATED': {
      if (event.reservationId) {
        const reservation = state.reservations.get(event.reservationId)
        if (reservation) {
          reservation.status = 'seated'
        }
      }
      break
    }
    
    case 'RESERVATION_CANCELED': {
      if (event.reservationId) {
        const reservation = state.reservations.get(event.reservationId)
        if (reservation) {
          reservation.status = 'canceled'
        }
      }
      break
    }
  }
}

/**
 * Calculate statistics from current state
 */
function calculateStatsFromState(state: ReplayState, replayTime: string, currentEvent?: ReplayEvent): ReplayStatistics {
  let ordersActive = 0
  let ordersCompleted = 0
  let ordersCanceled = 0
  let paymentsCompleted = 0
  let paymentsPending = 0
  
  state.orders.forEach(order => {
    if (order.status === 'active') {
      ordersActive++
      if (order.paymentStatus === 'completed') {
        paymentsCompleted++
      } else if (order.paymentStatus === 'pending') {
        paymentsPending++
      }
    } else if (order.status === 'completed') {
      ordersCompleted++
      paymentsCompleted++
    } else if (order.status === 'canceled') {
      ordersCanceled++
    }
  })
  
  let tablesOccupied = 0
  let tablesAvailable = 0
  
  state.tables.forEach(table => {
    if (table.status === 'occupied') {
      tablesOccupied++
    } else {
      tablesAvailable++
    }
  })
  
  let reservationsActive = 0
  let reservationsSeated = 0
  
  state.reservations.forEach(reservation => {
    if (reservation.status === 'pending' || reservation.status === 'confirmed') {
      reservationsActive++
    } else if (reservation.status === 'seated') {
      reservationsSeated++
    }
  })
  
  return {
    replayTime,
    currentEvent,
    ordersActive,
    ordersCompleted,
    ordersCanceled,
    tablesOccupied,
    tablesAvailable,
    kitchenQueue: state.kitchenQueue.size,
    itemsPreparing: state.itemsPreparing.size,
    itemsReady: state.itemsReady.size,
    paymentsCompleted,
    paymentsPending,
    reservationsActive,
    reservationsSeated,
  }
}

/**
 * Calculate statistics at a specific point in the event timeline
 */
export function calculateStatistics(
  events: ReplayEvent[],
  upToIndex: number,
  replayTime?: string
): ReplayStatistics {
  const state = createInitialState()
  
  // Apply all events up to and including the specified index
  const eventsToProcess = events.slice(0, upToIndex + 1)
  
  for (const event of eventsToProcess) {
    applyEventToState(state, event)
  }
  
  const currentEvent = eventsToProcess[eventsToProcess.length - 1]
  const effectiveReplayTime = replayTime || currentEvent?.timestamp || new Date().toISOString()
  
  return calculateStatsFromState(state, effectiveReplayTime, currentEvent)
}

/**
 * Incrementally update statistics with a new event
 * More efficient than recalculating from scratch
 */
export class StatisticsTracker {
  private state: ReplayState
  private currentStats: ReplayStatistics
  
  constructor() {
    this.state = createInitialState()
    this.currentStats = createEmptyStatistics()
  }
  
  /**
   * Reset the tracker to initial state
   */
  reset(): void {
    this.state = createInitialState()
    this.currentStats = createEmptyStatistics()
  }
  
  /**
   * Apply an event and return updated statistics
   */
  applyEvent(event: ReplayEvent): ReplayStatistics {
    applyEventToState(this.state, event)
    this.currentStats = calculateStatsFromState(this.state, event.timestamp, event)
    return this.currentStats
  }
  
  /**
   * Get current statistics without applying new events
   */
  getStatistics(): ReplayStatistics {
    return this.currentStats
  }
  
  /**
   * Initialize from a batch of events
   */
  initializeFromEvents(events: ReplayEvent[]): ReplayStatistics {
    this.reset()
    for (const event of events) {
      applyEventToState(this.state, event)
    }
    const lastEvent = events[events.length - 1]
    this.currentStats = calculateStatsFromState(
      this.state,
      lastEvent?.timestamp || new Date().toISOString(),
      lastEvent
    )
    return this.currentStats
  }
}
