import type { DomainEvent } from '@/lib/die/business-as-plugin/conversion/types'

export type InventoryEventType =
  | 'STOCK_ADD'
  | 'STOCK_REMOVE'
  | 'WASTE'
  | 'ADJUSTMENT'
  | 'LOW_STOCK_ALERT'
  // Shadow-mode normalized events (additive)
  | 'STOCK_UPDATED'
  | 'STOCK_LOW'
  | 'STOCK_OUT'
  | 'STOCK_RESTOCKED'
  | 'INVENTORY_ADJUSTMENT'
  | 'INVENTORY_WASTE_RECORDED'
  | 'INVENTORY_THRESHOLD_BREACH'

export interface InventoryEvent extends DomainEvent {
  domain: 'inventory'
  type: InventoryEventType
  data?: {
    inventoryItemId?: string
    quantity?: number
    previousStock?: number
    newStock?: number
    minStockLevel?: number
    unit?: string
    itemName?: string
    breachFromAbove?: boolean
    alertLevel?: 'MEDIUM' | 'HIGH' | 'CRITICAL'
  }
}
