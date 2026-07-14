/**
 * Service Replay™ - Type Definitions
 * 
 * Core types for the operational playback experience.
 * Transforms Heart Pulse events into a visual timeline replay.
 * 
 * @see IAS-001 (Event-Driven by Default, Observability First)
 */

// ─────────────────────────────────────────────────────────────────────────────
// Event Categories & Colors
// ─────────────────────────────────────────────────────────────────────────────

export type ReplayEventCategory =
  | 'order'      // Blue - Order lifecycle
  | 'kitchen'    // Orange - Kitchen events
  | 'waiter'     // Purple - Waiter/service events
  | 'payment'    // Green - Payment events
  | 'reservation'// Purple - Reservation events
  | 'table'      // Cyan - Table status changes
  | 'inventory'  // Yellow - Inventory events
  | 'system'     // Gray - System events
  | 'failure'    // Red - Failures or cancellations
  | 'completed'  // Green - Completed events

export const EVENT_CATEGORY_COLORS: Record<ReplayEventCategory, { bg: string; text: string; border: string }> = {
  order: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  kitchen: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  waiter: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  payment: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  reservation: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
  table: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  inventory: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
  system: { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' },
  failure: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
}

// ─────────────────────────────────────────────────────────────────────────────
// Replay Event Types
// ─────────────────────────────────────────────────────────────────────────────

export type ReplayEventType =
  // Order Lifecycle
  | 'ORDER_CREATED'
  | 'ORDER_UPDATED'
  | 'ORDER_COMPLETED'
  | 'ORDER_CANCELED'
  // Item Lifecycle
  | 'ITEM_ROUTED'
  | 'ITEM_ACCEPTED'
  | 'ITEM_PREPARING'
  | 'ITEM_READY'
  | 'ITEM_DELIVERED'
  | 'ITEM_CANCELED'
  // Kitchen Events
  | 'KITCHEN_STARTED'
  | 'KITCHEN_COMPLETED'
  | 'STATION_CHANGED'
  // Waiter Events
  | 'WAITER_ASSIGNED'
  | 'ORDER_PICKED_UP'
  | 'ORDER_SERVED'
  // Payment Events
  | 'PAYMENT_STARTED'
  | 'PAYMENT_COMPLETED'
  | 'PAYMENT_FAILED'
  // Table Events
  | 'TABLE_OCCUPIED'
  | 'TABLE_CLEARED'
  | 'SESSION_STARTED'
  | 'SESSION_CLOSED'
  // Reservation Events
  | 'RESERVATION_CREATED'
  | 'RESERVATION_CONFIRMED'
  | 'RESERVATION_SEATED'
  | 'RESERVATION_CANCELED'
  // SLA Events
  | 'SLA_WARNING'
  | 'SLA_BREACH'
  // System Events
  | 'RECONCILIATION'
  | 'MANUAL_OVERRIDE'
  | 'CONFLICT_DETECTED'
  | 'INVALID_TRANSITION'

// ─────────────────────────────────────────────────────────────────────────────
// Replay Event Model
// ─────────────────────────────────────────────────────────────────────────────

export interface ReplayEvent {
  id: string
  timestamp: string
  eventType: ReplayEventType
  category: ReplayEventCategory
  
  // Human-readable description
  description: string
  
  // Associated entities (all optional)
  orderId?: string
  orderNumber?: string
  tableId?: string
  tableNumber?: string
  waiterId?: string
  waiterName?: string
  stationId?: string
  stationName?: string
  customerId?: string
  customerName?: string
  paymentId?: string
  reservationId?: string
  
  // State tracking
  previousState?: string
  newState?: string
  
  // Actor information
  actorId?: string
  actorName?: string
  actorSource?: 'user' | 'system' | 'api' | 'cron'
  
  // Correlation for related events
  correlationId?: string
  
  // Full metadata for detail view
  metadata?: Record<string, unknown>
}

// ─────────────────────────────────────────────────────────────────────────────
// Replay Session State
// ─────────────────────────────────────────────────────────────────────────────

export type PlaybackSpeed = 1 | 2 | 4 | 8

export type PlaybackState = 'idle' | 'playing' | 'paused' | 'completed'

export interface ReplaySession {
  // Time range
  startTime: string
  endTime: string
  
  // Current playback state
  playbackState: PlaybackState
  playbackSpeed: PlaybackSpeed
  
  // Current position in timeline
  currentTime: string
  currentEventIndex: number
  
  // Events loaded
  events: ReplayEvent[]
  totalEvents: number
  
  // Pagination
  hasMore: boolean
  nextCursor?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Replay Statistics (Live during playback)
// ─────────────────────────────────────────────────────────────────────────────

export interface ReplayStatistics {
  // Current state at replay time
  replayTime: string
  currentEvent?: ReplayEvent
  
  // Order metrics
  ordersActive: number
  ordersCompleted: number
  ordersCanceled: number
  
  // Table metrics
  tablesOccupied: number
  tablesAvailable: number
  
  // Kitchen metrics
  kitchenQueue: number
  itemsPreparing: number
  itemsReady: number
  
  // Payment metrics
  paymentsCompleted: number
  paymentsPending: number
  
  // Reservation metrics
  reservationsActive: number
  reservationsSeated: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Filter & Search
// ─────────────────────────────────────────────────────────────────────────────

export interface ReplayFilters {
  // Entity filters
  orderId?: string
  tableId?: string
  waiterId?: string
  stationId?: string
  customerId?: string
  reservationId?: string
  paymentId?: string
  
  // Type filters
  eventTypes?: ReplayEventType[]
  categories?: ReplayEventCategory[]
  
  // Status filters
  status?: string[]
  
  // Time filters
  startTime?: string
  endTime?: string
}

export interface ReplaySearchQuery {
  query: string
  filters?: ReplayFilters
}

// ─────────────────────────────────────────────────────────────────────────────
// API Request/Response Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ReplayEventsRequest {
  businessId: string
  startTime: string
  endTime: string
  filters?: ReplayFilters
  cursor?: string
  limit?: number
}

export interface ReplayEventsResponse {
  events: ReplayEvent[]
  totalCount: number
  hasMore: boolean
  nextCursor?: string
  statistics: ReplayStatistics
}

export interface ReplaySearchRequest {
  businessId: string
  query: string
  startTime: string
  endTime: string
  filters?: ReplayFilters
  limit?: number
}

export interface ReplaySearchResponse {
  events: ReplayEvent[]
  totalCount: number
  query: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Preset Time Ranges
// ─────────────────────────────────────────────────────────────────────────────

export type PresetTimeRange =
  | 'today_breakfast'
  | 'today_lunch'
  | 'today_dinner'
  | 'yesterday'
  | 'last_7_days'
  | 'custom'

export interface TimeRangePreset {
  key: PresetTimeRange
  label: string
  getRange: (timezone: string) => { start: string; end: string }
}

// ─────────────────────────────────────────────────────────────────────────────
// Event Type Metadata
// ─────────────────────────────────────────────────────────────────────────────

export interface EventTypeMetadata {
  type: ReplayEventType
  category: ReplayEventCategory
  label: string
  description: string
  icon: string
}

export const EVENT_TYPE_METADATA: Record<ReplayEventType, EventTypeMetadata> = {
  // Order Lifecycle
  ORDER_CREATED: { type: 'ORDER_CREATED', category: 'order', label: 'Order Created', description: 'New order placed', icon: 'plus-circle' },
  ORDER_UPDATED: { type: 'ORDER_UPDATED', category: 'order', label: 'Order Updated', description: 'Order details modified', icon: 'edit' },
  ORDER_COMPLETED: { type: 'ORDER_COMPLETED', category: 'completed', label: 'Order Completed', description: 'Order fully served', icon: 'check-circle' },
  ORDER_CANCELED: { type: 'ORDER_CANCELED', category: 'failure', label: 'Order Canceled', description: 'Order was canceled', icon: 'x-circle' },
  
  // Item Lifecycle
  ITEM_ROUTED: { type: 'ITEM_ROUTED', category: 'kitchen', label: 'Item Routed', description: 'Item sent to station', icon: 'arrow-right' },
  ITEM_ACCEPTED: { type: 'ITEM_ACCEPTED', category: 'kitchen', label: 'Item Accepted', description: 'Station accepted item', icon: 'check' },
  ITEM_PREPARING: { type: 'ITEM_PREPARING', category: 'kitchen', label: 'Item Preparing', description: 'Item being prepared', icon: 'flame' },
  ITEM_READY: { type: 'ITEM_READY', category: 'completed', label: 'Item Ready', description: 'Item ready for pickup', icon: 'check-circle' },
  ITEM_DELIVERED: { type: 'ITEM_DELIVERED', category: 'completed', label: 'Item Delivered', description: 'Item delivered to customer', icon: 'package-check' },
  ITEM_CANCELED: { type: 'ITEM_CANCELED', category: 'failure', label: 'Item Canceled', description: 'Item was canceled', icon: 'x-circle' },
  
  // Kitchen Events
  KITCHEN_STARTED: { type: 'KITCHEN_STARTED', category: 'kitchen', label: 'Kitchen Started', description: 'Kitchen started order', icon: 'flame' },
  KITCHEN_COMPLETED: { type: 'KITCHEN_COMPLETED', category: 'completed', label: 'Kitchen Completed', description: 'Kitchen finished order', icon: 'check-circle' },
  STATION_CHANGED: { type: 'STATION_CHANGED', category: 'kitchen', label: 'Station Changed', description: 'Item moved to different station', icon: 'shuffle' },
  
  // Waiter Events
  WAITER_ASSIGNED: { type: 'WAITER_ASSIGNED', category: 'waiter', label: 'Waiter Assigned', description: 'Waiter assigned to table', icon: 'user-plus' },
  ORDER_PICKED_UP: { type: 'ORDER_PICKED_UP', category: 'waiter', label: 'Order Picked Up', description: 'Waiter picked up order', icon: 'hand' },
  ORDER_SERVED: { type: 'ORDER_SERVED', category: 'completed', label: 'Order Served', description: 'Order served to customer', icon: 'utensils' },
  
  // Payment Events
  PAYMENT_STARTED: { type: 'PAYMENT_STARTED', category: 'payment', label: 'Payment Started', description: 'Payment initiated', icon: 'credit-card' },
  PAYMENT_COMPLETED: { type: 'PAYMENT_COMPLETED', category: 'completed', label: 'Payment Completed', description: 'Payment successful', icon: 'check-circle' },
  PAYMENT_FAILED: { type: 'PAYMENT_FAILED', category: 'failure', label: 'Payment Failed', description: 'Payment failed', icon: 'x-circle' },
  
  // Table Events
  TABLE_OCCUPIED: { type: 'TABLE_OCCUPIED', category: 'table', label: 'Table Occupied', description: 'Table now occupied', icon: 'users' },
  TABLE_CLEARED: { type: 'TABLE_CLEARED', category: 'table', label: 'Table Cleared', description: 'Table cleared', icon: 'check' },
  SESSION_STARTED: { type: 'SESSION_STARTED', category: 'table', label: 'Session Started', description: 'Table session started', icon: 'play' },
  SESSION_CLOSED: { type: 'SESSION_CLOSED', category: 'table', label: 'Session Closed', description: 'Table session closed', icon: 'stop' },
  
  // Reservation Events
  RESERVATION_CREATED: { type: 'RESERVATION_CREATED', category: 'reservation', label: 'Reservation Created', description: 'New reservation made', icon: 'calendar-plus' },
  RESERVATION_CONFIRMED: { type: 'RESERVATION_CONFIRMED', category: 'reservation', label: 'Reservation Confirmed', description: 'Reservation confirmed', icon: 'calendar-check' },
  RESERVATION_SEATED: { type: 'RESERVATION_SEATED', category: 'completed', label: 'Reservation Seated', description: 'Guest seated', icon: 'armchair' },
  RESERVATION_CANCELED: { type: 'RESERVATION_CANCELED', category: 'failure', label: 'Reservation Canceled', description: 'Reservation canceled', icon: 'calendar-x' },
  
  // SLA Events
  SLA_WARNING: { type: 'SLA_WARNING', category: 'system', label: 'SLA Warning', description: 'SLA threshold approaching', icon: 'alert-triangle' },
  SLA_BREACH: { type: 'SLA_BREACH', category: 'failure', label: 'SLA Breach', description: 'SLA threshold exceeded', icon: 'alert-octagon' },
  
  // System Events
  RECONCILIATION: { type: 'RECONCILIATION', category: 'system', label: 'Reconciliation', description: 'State reconciliation', icon: 'refresh-cw' },
  MANUAL_OVERRIDE: { type: 'MANUAL_OVERRIDE', category: 'system', label: 'Manual Override', description: 'Manual state change', icon: 'edit-3' },
  CONFLICT_DETECTED: { type: 'CONFLICT_DETECTED', category: 'failure', label: 'Conflict Detected', description: 'State conflict detected', icon: 'alert-circle' },
  INVALID_TRANSITION: { type: 'INVALID_TRANSITION', category: 'failure', label: 'Invalid Transition', description: 'Invalid state transition', icon: 'x-octagon' },
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

export function getEventCategory(eventType: ReplayEventType): ReplayEventCategory {
  return EVENT_TYPE_METADATA[eventType]?.category || 'system'
}

export function getEventLabel(eventType: ReplayEventType): string {
  return EVENT_TYPE_METADATA[eventType]?.label || eventType
}

export function getEventColors(category: ReplayEventCategory) {
  return EVENT_CATEGORY_COLORS[category] || EVENT_CATEGORY_COLORS.system
}

export function formatEventDescription(event: ReplayEvent): string {
  const parts: string[] = []
  
  if (event.orderNumber) {
    parts.push(`Order #${event.orderNumber}`)
  }
  if (event.tableNumber) {
    parts.push(`Table ${event.tableNumber}`)
  }
  if (event.stationName) {
    parts.push(`at ${event.stationName}`)
  }
  if (event.waiterName) {
    parts.push(`by ${event.waiterName}`)
  }
  
  const base = EVENT_TYPE_METADATA[event.eventType]?.description || event.eventType
  return parts.length > 0 ? `${base}: ${parts.join(' • ')}` : base
}
