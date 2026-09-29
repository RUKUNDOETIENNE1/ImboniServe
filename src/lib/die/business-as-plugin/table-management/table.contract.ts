import type { DomainEvent } from '@/lib/die/business-as-plugin/conversion/types'

export type TableEventType = 'TABLE_STATUS_UPDATED' | 'WAITER_ASSIGNED' | 'TABLE_OCCUPIED' | 'TABLE_AVAILABLE' | 'TABLE_CLEANING'

export interface TableEvent extends DomainEvent {
  domain: 'table-management'
  type: TableEventType
  data?: {
    tableId?: string
    status?: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'CLEANING'
    waiterId?: string
  }
}
