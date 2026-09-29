import type { DomainEvent } from '@/lib/die/business-as-plugin/conversion/types'

export type SupplierEventType =
  | 'SUPPLIER_CREATED'
  | 'SUPPLIER_UPDATED'
  | 'SUPPLIER_ORDER_ASSIGNED'
  | 'SUPPLIER_DELIVERY_COMPLETED'
  | 'SUPPLIER_DELIVERY_DELAYED'
  | 'SUPPLIER_DELIVERY_FAILED'
  | 'SUPPLIER_PERFORMANCE_ALERT'

export interface SupplierEvent extends DomainEvent {
  domain: 'suppliers'
  type: SupplierEventType
  data?: {
    supplierId?: string
    businessId?: string
    orderId?: string
    orderNumber?: string
    delayMs?: number
    reason?: string
    performanceScore?: number
  }
}
