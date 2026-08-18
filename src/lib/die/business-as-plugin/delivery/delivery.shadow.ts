import { DeliveryPluginAdapter } from './delivery.adapter'
import { routeDomainEvent } from '@/lib/die/business-as-plugin/conversion/event-router'
import { shadowBindings } from '@/lib/die/business-as-plugin/shadow/shadow-bindings'
import type { DeliveryEventType } from './delivery.contract'
import type { DomainEvent } from '@/lib/die/business-as-plugin/conversion/types'

export type DeliveryShadowEvent =
  | 'DELIVERY_CREATED'
  | 'DELIVERY_ASSIGNED'
  | 'DELIVERY_ACCEPTED'
  | 'DELIVERY_PICKED_UP'
  | 'DELIVERY_IN_TRANSIT'
  | 'DELIVERY_COMPLETED'
  | 'DELIVERY_DELAYED'
  | 'DELIVERY_FAILED'
  | 'DELIVERY_CANCELLED'
  | 'DELIVERY_DRIVER_ALERT'

interface IngestInput {
  type: DeliveryShadowEvent
  businessId: string
  orderId?: string
  orderNumber?: string
  driverId?: string
  routeId?: string
  expectedAt?: string
  pickedUpAt?: string
  deliveredAt?: string
  delayMs?: number
  reason?: string
}

export async function ingestDeliveryShadowEvent(input: IngestInput): Promise<void> {
  try {
    if (process.env.DIE_SHADOW_DELIVERY_ENABLED !== 'true') return

    const adapter = new DeliveryPluginAdapter()
    const mapped: DeliveryEventType = input.type

    const severity: DomainEvent['severity'] =
      input.type === 'DELIVERY_FAILED' ? 'CRITICAL' : input.type === 'DELIVERY_DELAYED' || input.type === 'DELIVERY_DRIVER_ALERT' ? 'WARN' : 'INFO'

    const ev: DomainEvent = {
      domain: 'delivery',
      type: mapped,
      timestamp: new Date().toISOString(),
      businessId: input.businessId,
      severity,
      data: {
        orderId: input.orderId,
        orderNumber: input.orderNumber,
        driverId: input.driverId,
        routeId: input.routeId,
        expectedAt: input.expectedAt,
        pickedUpAt: input.pickedUpAt,
        deliveredAt: input.deliveredAt,
        delayMs: input.delayMs,
        reason: input.reason,
      },
    }

    await routeDomainEvent(adapter, shadowBindings, ev)
  } catch (e) {
    console.debug('[Shadow][Delivery] ingest error (ignored):', (e as any)?.message)
  }
}
