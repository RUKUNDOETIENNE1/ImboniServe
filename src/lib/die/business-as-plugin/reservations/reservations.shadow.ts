import { ReservationsPluginAdapter } from './reservations.adapter'
import type { ReservationEventType } from './reservations.contract'
import type { DomainEvent } from '@/lib/die/business-as-plugin/conversion/types'
import { routeDomainEvent } from '@/lib/die/business-as-plugin/conversion/event-router'
import { shadowBindings } from '@/lib/die/business-as-plugin/shadow/shadow-bindings'

interface IngestInput {
  type: ReservationEventType | 'CONFIRMED' | 'NO_SHOW'
  businessId: string
  reservationId: string
  partySize?: number
  reason?: string
  scheduledAtIso?: string
}

export async function ingestReservationShadowEvent(input: IngestInput): Promise<void> {
  try {
    // Feature flag OFF by default
    if (process.env.DIE_SHADOW_RESERVATIONS_ENABLED !== 'true') return

    const adapter = new ReservationsPluginAdapter()

    const ev: DomainEvent = {
      domain: 'reservations',
      type: mapToReservationType(input.type),
      timestamp: new Date().toISOString(),
      businessId: input.businessId,
      severity: input.type === 'CAPACITY_ALERT' ? 'WARN' : 'INFO',
      data: {
        reservationId: input.reservationId,
        partySize: input.partySize,
        scheduledAt: input.scheduledAtIso,
        reason: input.reason,
      },
    }

    await routeDomainEvent(adapter, shadowBindings, ev)
  } catch (e) {
    // Never throw; shadow mode must not impact runtime
    console.debug('[Shadow][Reservations] ingest error (ignored):', (e as any)?.message)
  }
}

function mapToReservationType(t: IngestInput['type']): ReservationEventType {
  if (t === 'CONFIRMED') return 'BOOKING_UPDATED'
  if (t === 'NO_SHOW') return 'BOOKING_CANCELLED'
  return t as ReservationEventType
}
