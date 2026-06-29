import { InventoryPluginAdapter } from './inventory.adapter'
import { routeDomainEvent } from '@/lib/die/business-as-plugin/conversion/event-router'
import { shadowBindings } from '@/lib/die/business-as-plugin/shadow/shadow-bindings'
import type { InventoryEventType } from './inventory.contract'
import type { DomainEvent } from '@/lib/die/business-as-plugin/conversion/types'

export type InventoryShadowEvent =
  | 'STOCK_UPDATED'
  | 'STOCK_LOW'
  | 'STOCK_OUT'
  | 'STOCK_RESTOCKED'
  | 'INVENTORY_ADJUSTMENT'
  | 'INVENTORY_WASTE_RECORDED'
  | 'INVENTORY_THRESHOLD_BREACH'

interface IngestInput {
  type: InventoryShadowEvent
  businessId: string
  inventoryItemId: string
  itemName?: string
  unit?: string
  quantity?: number
  previousStock?: number
  newStock?: number
  minStockLevel?: number
  alertLevel?: 'MEDIUM' | 'HIGH' | 'CRITICAL'
  breachFromAbove?: boolean
}

export async function ingestInventoryShadowEvent(input: IngestInput): Promise<void> {
  try {
    if (process.env.DIE_SHADOW_INVENTORY_ENABLED !== 'true') return

    const adapter = new InventoryPluginAdapter()
    const mapped: InventoryEventType = mapType(input.type)

    const severity: DomainEvent['severity'] =
      input.type === 'STOCK_OUT' ? 'CRITICAL' : input.type === 'STOCK_LOW' || input.type === 'INVENTORY_THRESHOLD_BREACH' ? 'WARN' : 'INFO'

    const ev: DomainEvent = {
      domain: 'inventory',
      type: mapped,
      timestamp: new Date().toISOString(),
      businessId: input.businessId,
      severity,
      data: {
        inventoryItemId: input.inventoryItemId,
        itemName: input.itemName,
        unit: input.unit,
        quantity: input.quantity,
        previousStock: input.previousStock,
        newStock: input.newStock,
        minStockLevel: input.minStockLevel,
        alertLevel: input.alertLevel,
        breachFromAbove: input.breachFromAbove,
      },
    }

    await routeDomainEvent(adapter, shadowBindings, ev)
  } catch (e) {
    console.debug('[Shadow][Inventory] ingest error (ignored):', (e as any)?.message)
  }
}

function mapType(t: InventoryShadowEvent): InventoryEventType {
  return t
}
