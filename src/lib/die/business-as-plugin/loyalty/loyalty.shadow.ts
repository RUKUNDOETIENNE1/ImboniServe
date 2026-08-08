import { LoyaltyPluginAdapter } from './loyalty.adapter'
import { routeDomainEvent } from '@/lib/die/business-as-plugin/conversion/event-router'
import { shadowBindings } from '@/lib/die/business-as-plugin/shadow/shadow-bindings'
import type { LoyaltyEventType } from './loyalty.contract'
import type { DomainEvent } from '@/lib/die/business-as-plugin/conversion/types'

export type LoyaltyShadowEvent = 'POINTS_EARNED' | 'POINTS_REDEEMED' | 'VIP_TIER_CHANGED' | 'REDEMPTION_DENIED'

interface IngestInput {
  type: LoyaltyShadowEvent
  businessId: string
  customerId?: string
  points?: number
  vipTier?: string
  reason?: string
}

export async function ingestLoyaltyShadowEvent(input: IngestInput): Promise<void> {
  try {
    if (process.env.DIE_SHADOW_LOYALTY_ENABLED !== 'true') return

    const adapter = new LoyaltyPluginAdapter()
    const mapped: LoyaltyEventType = input.type

    const severity: DomainEvent['severity'] = input.type === 'REDEMPTION_DENIED' ? 'WARN' : 'INFO'

    const ev: DomainEvent = {
      domain: 'loyalty',
      type: mapped,
      timestamp: new Date().toISOString(),
      businessId: input.businessId,
      severity,
      data: {
        customerId: input.customerId,
        points: input.points,
        vipTier: input.vipTier,
        reason: input.reason,
      },
    }

    await routeDomainEvent(adapter, shadowBindings, ev)
  } catch (e) {
    console.debug('[Shadow][Loyalty] ingest error (ignored):', (e as any)?.message)
  }
}
