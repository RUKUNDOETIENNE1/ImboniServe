import { EventManagementPluginAdapter } from './events.adapter'
import { routeDomainEvent } from '@/lib/die/business-as-plugin/conversion/event-router'
import { shadowBindings } from '@/lib/die/business-as-plugin/shadow/shadow-bindings'
import type { BizEventEventType } from './events.contract'
import type { DomainEvent } from '@/lib/die/business-as-plugin/conversion/types'

export type EventsShadowEvent = 'EVENT_CREATED' | 'TICKET_BOOKED' | 'CAPACITY_ALERT' | 'ATTENDANCE_UPDATED' | 'EVENT_COMPLETED' | 'SPIKE_DETECTED'

interface IngestInput {
  type: EventsShadowEvent
  businessId: string
  eventId?: string
  tickets?: number
  capacity?: number
  severity?: 'INFO' | 'WARN' | 'CRITICAL'
}

export async function ingestEventsShadowEvent(input: IngestInput): Promise<void> {
  try {
    if (process.env.DIE_SHADOW_EVENTS_ENABLED !== 'true') return

    const adapter = new EventManagementPluginAdapter()
    const mapped: BizEventEventType = input.type

    const severity: DomainEvent['severity'] = input.severity || (input.type === 'CAPACITY_ALERT' || input.type === 'SPIKE_DETECTED' ? 'WARN' : 'INFO')

    const ev: DomainEvent = {
      domain: 'events',
      type: mapped,
      timestamp: new Date().toISOString(),
      businessId: input.businessId,
      severity,
      data: {
        eventId: input.eventId,
        tickets: input.tickets,
        capacity: input.capacity,
        severity: severity,
      },
    }

    await routeDomainEvent(adapter, shadowBindings, ev)
  } catch (e) {
    console.debug('[Shadow][Events] ingest error (ignored):', (e as any)?.message)
  }
}
