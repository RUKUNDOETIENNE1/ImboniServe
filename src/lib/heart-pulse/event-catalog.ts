/**
 * Heart Pulse Core - Event Catalog
 * 
 * Centralized registry of all operational events in Heart of House Core.
 * Every event follows a standard contract for consistency and observability.
 * 
 * @see IAS-001 (Event-Driven by Default)
 * @see IEC-001 (Build Core Before Intelligence)
 */

// ─────────────────────────────────────────────────────────────────────────────
// Event Contract Standard
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Standard event envelope for all Heart Pulse events.
 * Every event must conform to this structure.
 */
export interface HeartPulseEvent<TPayload = unknown> {
  /** Unique identifier for this event instance */
  eventId: string
  
  /** Event type from the catalog */
  eventType: string
  
  /** Schema version (currently v1 for all events) */
  eventVersion: number
  
  /** Business context */
  businessId: string
  
  /** Correlation ID for tracking related events across workflow */
  correlationId: string
  
  /** ISO timestamp when event was created */
  timestamp: string
  
  /** Actor who triggered the event (optional) */
  actor?: {
    userId?: string
    userName?: string
    source: 'user' | 'system' | 'api' | 'cron'
  }
  
  /** Event-specific payload */
  payload: TPayload
}

// ─────────────────────────────────────────────────────────────────────────────
// Event Types Registry
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Canonical event type names.
 * Use these constants to avoid typos and ensure consistency.
 */
export const HeartPulseEventType = {
  // Order Lifecycle Events
  ORDER_CREATED: 'order.created',
  ORDER_UPDATED: 'order.updated',
  ORDER_COMPLETED: 'order.completed',
  ORDER_CANCELED: 'order.canceled',
  
  // Item Lifecycle Events
  ITEM_ROUTED: 'item.routed',
  ITEM_UPDATED: 'item.updated',
  ITEM_STATUS_CHANGED: 'item.status.changed',
  ITEM_ACCEPTED: 'item.accepted',
  ITEM_PREPARING: 'item.preparing',
  ITEM_READY: 'item.ready',
  ITEM_DELIVERED: 'item.delivered',
  ITEM_CANCELED: 'item.canceled',
  
  // Station Events
  ITEMS_ROUTED_TO_STATION: 'items.routed',
  STATION_ITEM_UPDATED: 'station.item.updated',
  
  // Kitchen Status Events
  KITCHEN_STATUS_CHANGED: 'kitchen.status.changed',
  
  // Waiter Workflow Events
  ORDER_READY_FOR_PICKUP: 'order.ready_for_pickup',
  ORDER_PICKED_UP: 'order.picked_up',
  ORDER_DELIVERED: 'order.delivered',
  
  // Consumption Events
  INGREDIENTS_CONSUMED: 'ingredients.consumed',
  CONSUMPTION_REVERSED: 'consumption.reversed',
  
  // SLA Events
  SLA_WARNING: 'sla.warning',
  SLA_BREACH: 'sla.breach',
  
  // Payment Events
  PAYMENT_CONFIRMED: 'payment.confirmed',
  PAYMENT_FAILED: 'payment.failed',
} as const

export type HeartPulseEventTypeValue = typeof HeartPulseEventType[keyof typeof HeartPulseEventType]

// ─────────────────────────────────────────────────────────────────────────────
// Event Payload Definitions
// ─────────────────────────────────────────────────────────────────────────────

export interface OrderCreatedPayload {
  orderId: string
  orderNumber: string
  orderSource: string
  tableNumber?: string
  participantName?: string
  items: Array<{
    menuItemName: string
    quantity: number
    unitPriceCents: number
    notes?: string
    instructionTags?: string[]
  }>
  scheduledAt?: string
}

export interface OrderUpdatedPayload {
  orderId: string
  orderNumber: string
  kitchenStatus: string
  previousStatus?: string
}

export interface ItemsRoutedPayload {
  orderId: string
  orderNumber: string
  itemIds: string[]
  stationId: string
  stationCode?: string
}

export interface ItemUpdatedPayload {
  itemId: string
  saleId: string
  orderNumber: string
  itemStatus: string
  previousStatus?: string
  consumptionTriggered?: boolean
  reversalTriggered?: boolean
}

export interface ItemStatusChangedPayload {
  itemId: string
  itemStatus: string
  previousStatus?: string
}

export interface KitchenStatusChangedPayload {
  kitchenStatus: string
  previousStatus?: string
}

export interface IngredientsConsumedPayload {
  saleItemId: string
  recipeId: string | null
  totalCostCents: number
  lineCount: number
}

export interface ConsumptionReversedPayload {
  saleItemId: string
  totalReversedCostCents: number
  reasonCode: string
}

export interface PaymentConfirmedPayload {
  orderId: string
  orderNumber: string
  paymentMethod: string
  amountCents: number
}

export interface OrderReadyForPickupPayload {
  orderId: string
  orderNumber: string
  tableNumber?: string
  readyAt: string
  stationSummary: Array<{
    stationId: string
    stationName: string
    itemCount: number
    allReady: boolean
  }>
}

export interface OrderPickedUpPayload {
  orderId: string
  orderNumber: string
  pickedUpBy: string
  pickedUpAt: string
}

export interface OrderDeliveredPayload {
  orderId: string
  orderNumber: string
  deliveredBy: string
  deliveredAt: string
  tableNumber?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Channel Naming Convention
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Standard channel names for Pusher.
 * Use these helpers to ensure consistent channel naming.
 */
export const HeartPulseChannel = {
  /** Kitchen-wide channel for a business */
  kitchen: (businessId: string) => `private-kitchen-${businessId}`,
  
  /** Station-specific channel */
  station: (stationId: string) => `private-station-${stationId}`,
  
  /** Order-specific channel */
  order: (orderId: string) => `private-order-${orderId}`,
  
  /** Business-wide operational channel */
  business: (businessId: string) => `private-business-${businessId}`,
} as const

// ─────────────────────────────────────────────────────────────────────────────
// Event Ownership Registry
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Documents which service/API owns each event type.
 * This helps developers understand event sources.
 */
export const EventOwnership = {
  [HeartPulseEventType.ORDER_CREATED]: 'KitchenDispatchService',
  [HeartPulseEventType.ORDER_UPDATED]: '/api/kitchen/update-status',
  [HeartPulseEventType.ORDER_COMPLETED]: 'WorkflowEngine',
  [HeartPulseEventType.ORDER_CANCELED]: 'WorkflowEngine',
  
  [HeartPulseEventType.ITEM_ROUTED]: 'KitchenDispatchService',
  [HeartPulseEventType.ITEM_UPDATED]: '/api/station/update-item-status',
  [HeartPulseEventType.ITEM_STATUS_CHANGED]: '/api/station/update-item-status',
  [HeartPulseEventType.ITEM_ACCEPTED]: 'SaleItemStatusService',
  [HeartPulseEventType.ITEM_PREPARING]: 'SaleItemStatusService',
  [HeartPulseEventType.ITEM_READY]: 'SaleItemStatusService',
  [HeartPulseEventType.ITEM_DELIVERED]: 'SaleItemStatusService',
  [HeartPulseEventType.ITEM_CANCELED]: 'SaleItemStatusService',
  
  [HeartPulseEventType.ITEMS_ROUTED_TO_STATION]: 'KitchenDispatchService',
  [HeartPulseEventType.STATION_ITEM_UPDATED]: '/api/station/update-item-status',
  
  [HeartPulseEventType.KITCHEN_STATUS_CHANGED]: '/api/kitchen/update-status',
  
  [HeartPulseEventType.ORDER_READY_FOR_PICKUP]: '/api/kitchen/update-status',
  [HeartPulseEventType.ORDER_PICKED_UP]: '/api/waiter/pickup-order',
  [HeartPulseEventType.ORDER_DELIVERED]: '/api/waiter/deliver-order',
  
  [HeartPulseEventType.INGREDIENTS_CONSUMED]: 'ConsumptionEngineService',
  [HeartPulseEventType.CONSUMPTION_REVERSED]: 'ConsumptionEngineService',
  
  [HeartPulseEventType.SLA_WARNING]: 'SLAMonitorService',
  [HeartPulseEventType.SLA_BREACH]: 'SLAMonitorService',
  
  [HeartPulseEventType.PAYMENT_CONFIRMED]: '/api/orders/[id]/confirm-payment',
  [HeartPulseEventType.PAYMENT_FAILED]: 'PaymentService',
} as const

// ─────────────────────────────────────────────────────────────────────────────
// Subscriber Registry
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Documents known subscribers for each event type.
 * This helps understand event impact and dependencies.
 */
export const EventSubscribers = {
  [HeartPulseEventType.ORDER_CREATED]: [
    'KDS (/dashboard/kds)',
    'Kitchen Board (/dashboard/kitchen)',
  ],
  
  [HeartPulseEventType.ITEMS_ROUTED_TO_STATION]: [
    'KDS (/dashboard/kds)',
  ],
  
  [HeartPulseEventType.ITEM_UPDATED]: [
    'KDS (/dashboard/kds)',
    'Kitchen Board (/dashboard/kitchen)',
  ],
  
  [HeartPulseEventType.ITEM_STATUS_CHANGED]: [
    'Customer Order View',
    'Waiter Dashboard (/dashboard/waiter)',
  ],
  
  [HeartPulseEventType.KITCHEN_STATUS_CHANGED]: [
    'Customer Order View',
    'Waiter Dashboard (/dashboard/waiter)',
  ],
  
  [HeartPulseEventType.ORDER_UPDATED]: [
    'Kitchen Board (/dashboard/kitchen)',
    'Waiter Dashboard (/dashboard/waiter)',
  ],
  
  [HeartPulseEventType.ORDER_READY_FOR_PICKUP]: [
    'Waiter Dashboard (/dashboard/waiter)',
  ],
  
  [HeartPulseEventType.ORDER_PICKED_UP]: [
    'Waiter Dashboard (/dashboard/waiter)',
    'Kitchen Board (/dashboard/kitchen)',
  ],
  
  [HeartPulseEventType.ORDER_DELIVERED]: [
    'Waiter Dashboard (/dashboard/waiter)',
    'Kitchen Board (/dashboard/kitchen)',
    'Customer Order View',
  ],
} as const
