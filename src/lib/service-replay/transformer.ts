/**
 * Service Replay™ - Event Transformer
 * 
 * Transforms TicketEvent and other operational events into ReplayEvent format.
 * Maps database models to the unified replay timeline.
 */

import type { ReplayEvent, ReplayEventType, ReplayEventCategory } from './types'
import { getEventCategory, EVENT_TYPE_METADATA } from './types'

// ─────────────────────────────────────────────────────────────────────────────
// TicketEvent Type Mapping
// ─────────────────────────────────────────────────────────────────────────────

const TICKET_EVENT_TYPE_MAP: Record<string, ReplayEventType> = {
  'ORDER_CREATED': 'ORDER_CREATED',
  'ORDER_UPDATED': 'ORDER_UPDATED',
  'ORDER_COMPLETED': 'ORDER_COMPLETED',
  'ORDER_CANCELED': 'ORDER_CANCELED',
  'ITEM_ROUTED': 'ITEM_ROUTED',
  'ITEM_ACCEPTED': 'ITEM_ACCEPTED',
  'ITEM_PREPARING': 'ITEM_PREPARING',
  'ITEM_READY': 'ITEM_READY',
  'ITEM_DELIVERED': 'ITEM_DELIVERED',
  'ITEM_CANCELED': 'ITEM_CANCELED',
  'SLA_WARNING': 'SLA_WARNING',
  'SLA_BREACH': 'SLA_BREACH',
  'STATION_CHANGED': 'STATION_CHANGED',
  'MANUAL_OVERRIDE': 'MANUAL_OVERRIDE',
  'RECONCILIATION': 'RECONCILIATION',
  'CONFLICT_DETECTED': 'CONFLICT_DETECTED',
  'INVALID_TRANSITION': 'INVALID_TRANSITION',
}

// ─────────────────────────────────────────────────────────────────────────────
// Database Event Interface (from Prisma)
// ─────────────────────────────────────────────────────────────────────────────

interface TicketEventWithRelations {
  id: string
  saleId: string
  saleItemId?: string | null
  stationId?: string | null
  eventType: string
  actorId?: string | null
  actorName?: string | null
  previousState?: string | null
  newState?: string | null
  metadata?: unknown // Prisma JsonValue type
  idempotencyKey?: string | null
  sequenceNumber?: number | null
  createdAt: Date
  
  // Relations
  sale?: {
    id: string
    orderNumber: string
    tableId?: string | null
    customerId?: string | null
    customerName?: string | null
    table?: {
      id: string
      number: string
      assignedWaiterId?: string | null
      assignedWaiter?: {
        id: string
        name: string
      } | null
    } | null
    customer?: {
      id: string
      name: string
    } | null
  } | null
  saleItem?: {
    id: string
    menuItem?: {
      name: string
    } | null
  } | null
  station?: {
    id: string
    name: string
    code: string
  } | null
  actor?: {
    id: string
    name: string
  } | null
}

// ─────────────────────────────────────────────────────────────────────────────
// Transform Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Transform a single TicketEvent into a ReplayEvent
 */
export function transformTicketEvent(event: TicketEventWithRelations): ReplayEvent {
  const eventType = TICKET_EVENT_TYPE_MAP[event.eventType] || 'ORDER_UPDATED'
  const category = getEventCategory(eventType)
  
  const replayEvent: ReplayEvent = {
    id: event.id,
    timestamp: event.createdAt.toISOString(),
    eventType,
    category,
    description: buildEventDescription(event, eventType),
    
    // Order info
    orderId: event.saleId,
    orderNumber: event.sale?.orderNumber,
    
    // Table info
    tableId: event.sale?.tableId || undefined,
    tableNumber: event.sale?.table?.number,
    
    // Waiter info
    waiterId: event.sale?.table?.assignedWaiterId || undefined,
    waiterName: event.sale?.table?.assignedWaiter?.name,
    
    // Station info
    stationId: event.stationId || undefined,
    stationName: event.station?.name,
    
    // Customer info
    customerId: event.sale?.customerId || undefined,
    customerName: event.sale?.customerName || event.sale?.customer?.name,
    
    // State tracking
    previousState: event.previousState || undefined,
    newState: event.newState || undefined,
    
    // Actor info
    actorId: event.actorId || undefined,
    actorName: event.actorName || event.actor?.name,
    actorSource: event.actorId ? 'user' : 'system',
    
    // Correlation
    correlationId: (event.metadata as Record<string, unknown> | null)?.correlationId as string | undefined,
    
    // Full metadata - safely spread if it's an object
    metadata: {
      ...(typeof event.metadata === 'object' && event.metadata !== null ? event.metadata as Record<string, unknown> : {}),
      saleItemId: event.saleItemId,
      itemName: event.saleItem?.menuItem?.name,
      sequenceNumber: event.sequenceNumber,
      idempotencyKey: event.idempotencyKey,
    },
  }
  
  return replayEvent
}

/**
 * Transform multiple TicketEvents into ReplayEvents
 */
export function transformTicketEvents(events: TicketEventWithRelations[]): ReplayEvent[] {
  return events.map(transformTicketEvent)
}

/**
 * Build a human-readable description for an event
 */
export function buildEventDescription(
  event: TicketEventWithRelations,
  eventType: ReplayEventType
): string {
  const metadata = EVENT_TYPE_METADATA[eventType]
  const baseDescription = metadata?.description || eventType
  
  const parts: string[] = []
  
  // Add order reference
  if (event.sale?.orderNumber) {
    parts.push(`Order #${event.sale.orderNumber}`)
  }
  
  // Add table reference
  if (event.sale?.table?.number) {
    parts.push(`Table ${event.sale.table.number}`)
  }
  
  // Add item reference for item-level events
  if (event.saleItem?.menuItem?.name) {
    parts.push(`"${event.saleItem.menuItem.name}"`)
  }
  
  // Add station reference
  if (event.station?.name) {
    parts.push(`at ${event.station.name}`)
  }
  
  // Add state transition
  if (event.previousState && event.newState) {
    parts.push(`(${event.previousState} → ${event.newState})`)
  } else if (event.newState) {
    parts.push(`→ ${event.newState}`)
  }
  
  // Add actor reference
  if (event.actorName || event.actor?.name) {
    parts.push(`by ${event.actorName || event.actor?.name}`)
  }
  
  if (parts.length === 0) {
    return baseDescription
  }
  
  return `${baseDescription}: ${parts.join(' • ')}`
}

// ─────────────────────────────────────────────────────────────────────────────
// Additional Event Transformers (for non-TicketEvent sources)
// ─────────────────────────────────────────────────────────────────────────────

interface PaymentEventData {
  id: string
  orderId: string
  orderNumber: string
  status: string
  previousStatus?: string
  paymentMethod: string
  amountCents: number
  timestamp: Date
  actorId?: string
  actorName?: string
  tableNumber?: string
}

/**
 * Transform payment status changes into ReplayEvents
 */
export function transformPaymentEvent(data: PaymentEventData): ReplayEvent {
  let eventType: ReplayEventType = 'PAYMENT_STARTED'
  let category: ReplayEventCategory = 'payment'
  
  if (data.status === 'PAID' || data.status === 'COMPLETED') {
    eventType = 'PAYMENT_COMPLETED'
    category = 'completed'
  } else if (data.status === 'FAILED' || data.status === 'CANCELED') {
    eventType = 'PAYMENT_FAILED'
    category = 'failure'
  }
  
  const amount = (data.amountCents / 100).toLocaleString()
  
  return {
    id: `payment-${data.id}`,
    timestamp: data.timestamp.toISOString(),
    eventType,
    category,
    description: `${EVENT_TYPE_METADATA[eventType].description}: Order #${data.orderNumber} • ${data.paymentMethod} • ${amount}`,
    orderId: data.orderId,
    orderNumber: data.orderNumber,
    tableNumber: data.tableNumber,
    paymentId: data.id,
    previousState: data.previousStatus,
    newState: data.status,
    actorId: data.actorId,
    actorName: data.actorName,
    actorSource: data.actorId ? 'user' : 'system',
    metadata: {
      paymentMethod: data.paymentMethod,
      amountCents: data.amountCents,
    },
  }
}

interface ReservationEventData {
  id: string
  confirmationCode: string
  status: string
  previousStatus?: string
  customerName: string
  partySize: number
  reservationDate: Date
  tableNumber?: string
  timestamp: Date
  actorId?: string
  actorName?: string
}

/**
 * Transform reservation status changes into ReplayEvents
 */
export function transformReservationEvent(data: ReservationEventData): ReplayEvent {
  let eventType: ReplayEventType = 'RESERVATION_CREATED'
  let category: ReplayEventCategory = 'reservation'
  
  if (data.status === 'CONFIRMED') {
    eventType = 'RESERVATION_CONFIRMED'
  } else if (data.status === 'SEATED') {
    eventType = 'RESERVATION_SEATED'
    category = 'completed'
  } else if (data.status === 'CANCELED' || data.status === 'NO_SHOW') {
    eventType = 'RESERVATION_CANCELED'
    category = 'failure'
  }
  
  return {
    id: `reservation-${data.id}-${data.status}`,
    timestamp: data.timestamp.toISOString(),
    eventType,
    category,
    description: `${EVENT_TYPE_METADATA[eventType].description}: ${data.customerName} • Party of ${data.partySize}${data.tableNumber ? ` • Table ${data.tableNumber}` : ''}`,
    reservationId: data.id,
    tableNumber: data.tableNumber,
    customerName: data.customerName,
    previousState: data.previousStatus,
    newState: data.status,
    actorId: data.actorId,
    actorName: data.actorName,
    actorSource: data.actorId ? 'user' : 'system',
    metadata: {
      confirmationCode: data.confirmationCode,
      partySize: data.partySize,
      reservationDate: data.reservationDate.toISOString(),
    },
  }
}

interface TableSessionEventData {
  id: string
  tableId: string
  tableNumber: string
  status: string
  previousStatus?: string
  timestamp: Date
  participantCount?: number
}

/**
 * Transform table session changes into ReplayEvents
 */
export function transformTableSessionEvent(data: TableSessionEventData): ReplayEvent {
  let eventType: ReplayEventType = 'SESSION_STARTED'
  let category: ReplayEventCategory = 'table'
  
  if (data.status === 'closed') {
    eventType = 'SESSION_CLOSED'
  } else if (data.status === 'active') {
    eventType = 'TABLE_OCCUPIED'
  }
  
  return {
    id: `session-${data.id}-${data.status}`,
    timestamp: data.timestamp.toISOString(),
    eventType,
    category,
    description: `${EVENT_TYPE_METADATA[eventType].description}: Table ${data.tableNumber}${data.participantCount ? ` • ${data.participantCount} guests` : ''}`,
    tableId: data.tableId,
    tableNumber: data.tableNumber,
    previousState: data.previousStatus,
    newState: data.status,
    actorSource: 'system',
    metadata: {
      sessionId: data.id,
      participantCount: data.participantCount,
    },
  }
}
