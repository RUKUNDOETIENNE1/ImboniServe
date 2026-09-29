import type { DomainEvent } from '@/lib/die/business-as-plugin/conversion/types'

export type ReservationEventType = 'BOOKING_CREATED' | 'BOOKING_UPDATED' | 'BOOKING_CANCELLED' | 'CAPACITY_ALERT'

export interface ReservationEvent extends DomainEvent {
  domain: 'reservations'
  type: ReservationEventType
  data?: {
    reservationId?: string
    partySize?: number
    scheduledAt?: string
    reason?: string
  }
}
