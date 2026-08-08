import { DiningSlipsPluginAdapter } from './slips.adapter'
import { routeDomainEvent } from '@/lib/die/business-as-plugin/conversion/event-router'
import { shadowBindings } from '@/lib/die/business-as-plugin/shadow/shadow-bindings'
import type { DiningSlipEventType } from './slips.contract'
import type { DomainEvent } from '@/lib/die/business-as-plugin/conversion/types'

export type DiningSlipShadowEvent =
  | 'SESSION_STARTED'
  | 'SESSION_UPDATED'
  | 'SESSION_CLOSED'
  | 'SLIP_CREATED'
  | 'SLIP_SENT_WHATSAPP'
  | 'SLIP_PAID'
  | 'HIGH_VALUE_SESSION'
  | 'LONG_DURATION_SESSION'
  | 'PAYMENT_EXCEPTION'

interface IngestInput {
  type: DiningSlipShadowEvent
  businessId: string
  sessionId?: string
  slipId?: string
  amountCents?: number
  durationMin?: number
  reason?: string
}

export async function ingestDiningSlipShadowEvent(input: IngestInput): Promise<void> {
  try {
    if (process.env.DIE_SHADOW_DINING_SLIPS_ENABLED !== 'true') return

    const adapter = new DiningSlipsPluginAdapter()
    const mapped: DiningSlipEventType = input.type

    const severity: DomainEvent['severity'] =
      input.type === 'PAYMENT_EXCEPTION' ? 'WARN' : input.type === 'LONG_DURATION_SESSION' ? 'WARN' : 'INFO'

    const ev: DomainEvent = {
      domain: 'dining-slips',
      type: mapped,
      timestamp: new Date().toISOString(),
      businessId: input.businessId,
      severity,
      data: {
        sessionId: input.sessionId,
        slipId: input.slipId,
        amountCents: input.amountCents,
        durationMin: input.durationMin,
        reason: input.reason,
      },
    }

    await routeDomainEvent(adapter, shadowBindings, ev)
  } catch (e) {
    console.debug('[Shadow][DiningSlips] ingest error (ignored):', (e as any)?.message)
  }
}
