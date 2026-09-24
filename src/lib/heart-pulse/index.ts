/**
 * Heart Pulse Core - Event Backbone
 * 
 * Centralized event infrastructure for Heart of House Core.
 * Provides standardized event publishing, correlation tracking, and delivery monitoring.
 * 
 * @see IAS-001 (Event-Driven by Default, Observability First)
 * @see IEC-001 (Build Core Before Intelligence)
 * @see SADR-002 (Business-First Engineering)
 */

// Event Catalog
export type {
  HeartPulseEvent,
  HeartPulseEventTypeValue,
  OrderCreatedPayload,
  OrderUpdatedPayload,
  ItemsRoutedPayload,
  ItemUpdatedPayload,
  ItemStatusChangedPayload,
  KitchenStatusChangedPayload,
  IngredientsConsumedPayload,
  ConsumptionReversedPayload,
  PaymentConfirmedPayload,
  OrderReadyForPickupPayload,
  OrderPickedUpPayload,
  OrderDeliveredPayload,
} from './event-catalog'

export {
  HeartPulseEventType,
  HeartPulseChannel,
  EventOwnership,
  EventSubscribers,
} from './event-catalog'

// Publisher
export {
  publishHeartPulseEvent,
  publishHeartPulseEventBatch,
  publishLegacyEvent,
  generateCorrelationId,
  extractCorrelationId,
  getPublishStats,
  resetPublishStats,
} from './publisher'

// Re-export legacy Pusher functions for backward compatibility
export { triggerEvent, kitchenChannel, orderChannel } from '@/lib/pusher-server'
