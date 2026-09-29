import type { DomainEvent } from '@/lib/die/business-as-plugin/conversion/types'

export type DeliveryEventType =
  // Legacy/basic events
  | 'DELIVERY_DISPATCHED'
  | 'DRIVER_ASSIGNED'
  | 'EN_ROUTE'
  | 'DELIVERED'
  | 'DELIVERY_DELAY_ALERT'
  // Shadow-mode normalized events (additive)
  | 'DELIVERY_CREATED'
  | 'DELIVERY_ASSIGNED'
  | 'DELIVERY_ACCEPTED'
  | 'DELIVERY_PICKED_UP'
  | 'DELIVERY_IN_TRANSIT'
  | 'DELIVERY_COMPLETED'
  | 'DELIVERY_DELAYED'
  | 'DELIVERY_FAILED'
  | 'DELIVERY_CANCELLED'
  | 'DELIVERY_DRIVER_ALERT'

export interface DeliveryEvent extends DomainEvent {
  domain: 'delivery'
  type: DeliveryEventType
  data?: {
    orderId?: string
    driverId?: string
    routeId?: string
    orderNumber?: string
    delayMin?: number
    delayMs?: number
    expectedAt?: string
    pickedUpAt?: string
    deliveredAt?: string
    reason?: string
  }
}
