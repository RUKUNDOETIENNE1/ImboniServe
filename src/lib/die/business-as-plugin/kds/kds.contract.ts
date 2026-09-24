import type { DomainEvent } from '@/lib/die/business-as-plugin/conversion/types'

export type KDSEventType =
  | 'ORDER_CREATED'
  | 'ITEM_ROUTED'
  | 'ITEM_PREPARING'
  | 'ITEM_READY'
  | 'ORDER_SERVED'
  | 'ROUTING_FAILED'
  | 'BACKLOG_ALERT'

export interface KDSEvent extends DomainEvent {
  domain: 'kds'
  type: KDSEventType
  data?: {
    saleId?: string
    stationId?: string
    itemId?: string
    delayMs?: number
  }
}
