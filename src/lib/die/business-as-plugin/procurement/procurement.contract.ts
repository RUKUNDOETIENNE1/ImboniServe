import type { DomainEvent } from '@/lib/die/business-as-plugin/conversion/types'

export type ProcurementEventType =
  | 'PO_CREATED'
  | 'PO_APPROVED'
  | 'GRN_RECEIVED'
  | 'SUPPLIER_DELIVERED'
  | 'PAYOUT_INITIATED'
  | 'MISMATCH_ALERT'
  // Shadow-mode normalized events (additive)
  | 'PURCHASE_ORDER_CREATED'
  | 'PURCHASE_ORDER_APPROVED'
  | 'PURCHASE_ORDER_SENT'
  | 'PURCHASE_ORDER_RECEIVED'
  | 'PURCHASE_ORDER_CANCELLED'
  | 'GOODS_RECEIVED'
  | 'PROCUREMENT_DELAY'
  | 'PROCUREMENT_EXCEPTION'

export interface ProcurementEvent extends DomainEvent {
  domain: 'procurement'
  type: ProcurementEventType
  data?: {
    poId?: string
    grnId?: string
    supplierId?: string
    mismatchAmountCents?: number
    businessId?: string
    orderNumber?: string
    expectedAt?: string
    deliveredAt?: string
    delayMs?: number
    reason?: string
  }
}
