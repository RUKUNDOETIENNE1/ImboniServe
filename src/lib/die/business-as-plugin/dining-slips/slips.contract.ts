import type { DomainEvent } from '@/lib/die/business-as-plugin/conversion/types'

export type DiningSlipEventType =
  // Legacy/basic events
  | 'SLIP_GENERATED'
  | 'SLIP_SENT_WHATSAPP'
  | 'SLIP_EDITED'
  | 'PROCUREMENT_DOC_GENERATED'
  | 'SEND_FAILED'
  // Shadow-mode normalized events
  | 'SESSION_STARTED'
  | 'SESSION_UPDATED'
  | 'SESSION_CLOSED'
  | 'SLIP_CREATED'
  | 'SLIP_PAID'
  | 'HIGH_VALUE_SESSION'
  | 'LONG_DURATION_SESSION'
  | 'PAYMENT_EXCEPTION'

export interface DiningSlipEvent extends DomainEvent {
  domain: 'dining-slips'
  type: DiningSlipEventType
  data?: {
    slipId?: string
    sessionId?: string
    saleId?: string
    templateType?: string
    amountCents?: number
    durationMin?: number
    reason?: string
  }
}
