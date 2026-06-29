import type { DomainEvent } from '@/lib/die/business-as-plugin/conversion/types'

export type WaiterCallEventType = 'WAITER_CALLED' | 'CALL_ACKNOWLEDGED' | 'CALL_RESOLVED' | 'SLA_BREACH_ALERT'

export interface WaiterCallEvent extends DomainEvent {
  domain: 'waiter-calls'
  type: WaiterCallEventType
  data?: {
    callId?: string
    tableId?: string
    reason?: string
    priority?: number
    waitTimeSec?: number
  }
}
