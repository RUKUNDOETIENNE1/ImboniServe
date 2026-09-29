import type { DomainEvent } from '@/lib/die/business-as-plugin/conversion/types'

export type LoyaltyEventType = 'POINTS_EARNED' | 'POINTS_REDEEMED' | 'VIP_TIER_CHANGED' | 'REDEMPTION_DENIED'

export interface LoyaltyEvent extends DomainEvent {
  domain: 'loyalty'
  type: LoyaltyEventType
  data?: {
    customerId?: string
    points?: number
    vipTier?: string
  }
}
