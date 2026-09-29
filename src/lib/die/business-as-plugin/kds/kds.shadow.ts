import { KDSPluginAdapter } from './kds.adapter'
import { routeDomainEvent } from '@/lib/die/business-as-plugin/conversion/event-router'
import { shadowBindings } from '@/lib/die/business-as-plugin/shadow/shadow-bindings'
import type { KDSEventType } from './kds.contract'
import type { DomainEvent } from '@/lib/die/business-as-plugin/conversion/types'

export type KDSShadowType = 'ORDER_RECEIVED' | 'ORDER_UPDATED' | 'ORDER_COMPLETED' | 'ORDER_DELAYED'

interface IngestInput {
  type: KDSShadowType
  businessId: string
  saleId: string
  orderNumber?: string
  stationId?: string
  itemId?: string
  stage?: 'PREPARING' | 'READY' | 'DELIVERED'
  delayMs?: number
}

export async function ingestKDSShadowEvent(input: IngestInput): Promise<void> {
  try {
    if (process.env.DIE_SHADOW_KDS_ENABLED !== 'true') return

    const adapter = new KDSPluginAdapter()

    const mappedType = mapToKDSType(input)
    const ev: DomainEvent = {
      domain: 'kds',
      type: mappedType,
      timestamp: new Date().toISOString(),
      businessId: input.businessId,
      severity: input.type === 'ORDER_DELAYED' ? 'WARN' : 'INFO',
      data: {
        saleId: input.saleId,
        orderNumber: input.orderNumber,
        stationId: input.stationId,
        itemId: input.itemId,
        delayMs: input.delayMs,
      } as any,
    }

    await routeDomainEvent(adapter, shadowBindings, ev)
  } catch (e) {
    console.debug('[Shadow][KDS] ingest error (ignored):', (e as any)?.message)
  }
}

function mapToKDSType(input: IngestInput): KDSEventType {
  switch (input.type) {
    case 'ORDER_RECEIVED':
      return 'ORDER_CREATED'
    case 'ORDER_UPDATED':
      if (input.stage === 'PREPARING') return 'ITEM_PREPARING'
      if (input.stage === 'READY') return 'ITEM_READY'
      if (input.stage === 'DELIVERED') return 'ORDER_SERVED'
      return 'ITEM_PREPARING'
    case 'ORDER_COMPLETED':
      return 'ORDER_SERVED'
    case 'ORDER_DELAYED':
      return 'BACKLOG_ALERT'
    default:
      return 'ITEM_PREPARING'
  }
}
