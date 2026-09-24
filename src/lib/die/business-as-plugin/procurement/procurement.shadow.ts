import { ProcurementPluginAdapter } from './procurement.adapter'
import { routeDomainEvent } from '@/lib/die/business-as-plugin/conversion/event-router'
import { shadowBindings } from '@/lib/die/business-as-plugin/shadow/shadow-bindings'
import type { ProcurementEventType } from './procurement.contract'
import type { DomainEvent } from '@/lib/die/business-as-plugin/conversion/types'

export type ProcurementShadowEvent =
  | 'PURCHASE_ORDER_CREATED'
  | 'PURCHASE_ORDER_APPROVED'
  | 'PURCHASE_ORDER_SENT'
  | 'PURCHASE_ORDER_RECEIVED'
  | 'PURCHASE_ORDER_CANCELLED'
  | 'GOODS_RECEIVED'
  | 'PROCUREMENT_DELAY'
  | 'PROCUREMENT_EXCEPTION'

interface IngestInput {
  type: ProcurementShadowEvent
  businessId: string
  poId?: string
  supplierId?: string
  orderNumber?: string
  expectedAt?: string
  deliveredAt?: string
  delayMs?: number
  reason?: string
}

export async function ingestProcurementShadowEvent(input: IngestInput): Promise<void> {
  try {
    if (process.env.DIE_SHADOW_PROCUREMENT_ENABLED !== 'true') return

    const adapter = new ProcurementPluginAdapter()
    const mapped: ProcurementEventType = input.type

    const severity: DomainEvent['severity'] =
      input.type === 'PROCUREMENT_EXCEPTION' ? 'CRITICAL' : input.type === 'PROCUREMENT_DELAY' ? 'WARN' : 'INFO'

    const ev: DomainEvent = {
      domain: 'procurement',
      type: mapped,
      timestamp: new Date().toISOString(),
      businessId: input.businessId,
      severity,
      data: {
        poId: input.poId,
        supplierId: input.supplierId,
        orderNumber: input.orderNumber,
        expectedAt: input.expectedAt,
        deliveredAt: input.deliveredAt,
        delayMs: input.delayMs,
        reason: input.reason,
      },
    }

    await routeDomainEvent(adapter, shadowBindings, ev)
  } catch (e) {
    console.debug('[Shadow][Procurement] ingest error (ignored):', (e as any)?.message)
  }
}
