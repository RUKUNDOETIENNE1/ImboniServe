import type { DomainEvent } from '@/lib/die/business-as-plugin/conversion/types'

export type BizEventEventType =
  | 'EVENT_CREATED'
  | 'TICKET_BOOKED'
  | 'CAPACITY_ALERT'
  | 'ATTENDANCE_UPDATED'
  | 'EVENT_COMPLETED'
  | 'SPIKE_DETECTED'

export interface BizEventEvent extends DomainEvent {
  domain: 'events'
  type: BizEventEventType
  data?: {
    eventId?: string
    tickets?: number
    capacity?: number
    severity?: 'INFO' | 'WARN' | 'CRITICAL'
  }
}
