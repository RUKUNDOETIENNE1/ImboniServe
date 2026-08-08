import { SuppliersPluginAdapter } from './suppliers.adapter'
import { routeDomainEvent } from '@/lib/die/business-as-plugin/conversion/event-router'
import { shadowBindings } from '@/lib/die/business-as-plugin/shadow/shadow-bindings'
import type { SupplierEventType } from './suppliers.contract'
import type { DomainEvent } from '@/lib/die/business-as-plugin/conversion/types'

export type SupplierShadowEvent =
  | 'SUPPLIER_CREATED'
  | 'SUPPLIER_UPDATED'
  | 'SUPPLIER_ORDER_ASSIGNED'
  | 'SUPPLIER_DELIVERY_COMPLETED'
  | 'SUPPLIER_DELIVERY_DELAYED'
  | 'SUPPLIER_DELIVERY_FAILED'
  | 'SUPPLIER_PERFORMANCE_ALERT'

interface IngestInput {
  type: SupplierShadowEvent
  businessId: string
  supplierId?: string
  orderId?: string
  orderNumber?: string
  delayMs?: number
  reason?: string
  performanceScore?: number
}

export async function ingestSuppliersShadowEvent(input: IngestInput): Promise<void> {
  try {
    if (process.env.DIE_SHADOW_SUPPLIERS_ENABLED !== 'true') return

    const adapter = new SuppliersPluginAdapter()
    const mapped: SupplierEventType = input.type

    const severity: DomainEvent['severity'] =
      input.type === 'SUPPLIER_DELIVERY_FAILED' ? 'CRITICAL' : input.type === 'SUPPLIER_DELIVERY_DELAYED' || input.type === 'SUPPLIER_PERFORMANCE_ALERT' ? 'WARN' : 'INFO'

    const ev: DomainEvent = {
      domain: 'suppliers',
      type: mapped,
      timestamp: new Date().toISOString(),
      businessId: input.businessId,
      severity,
      data: {
        supplierId: input.supplierId,
        orderId: input.orderId,
        orderNumber: input.orderNumber,
        delayMs: input.delayMs,
        reason: input.reason,
        performanceScore: input.performanceScore,
      },
    }

    await routeDomainEvent(adapter, shadowBindings, ev)
  } catch (e) {
    console.debug('[Shadow][Suppliers] ingest error (ignored):', (e as any)?.message)
  }
}
