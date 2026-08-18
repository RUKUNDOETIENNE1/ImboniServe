import type { DomainEvent } from '@/lib/die/business-as-plugin/conversion/types'

export type CampaignEventType =
  // Legacy/basic
  | 'CAMPAIGN_SCHEDULED'
  | 'CAMPAIGN_SENT'
  | 'CAMPAIGN_FAILED'
  // Shadow-mode normalized
  | 'CAMPAIGN_CREATED'
  | 'CAMPAIGN_STARTED'
  | 'CAMPAIGN_COMPLETED'
  | 'HIGH_CONVERSION_CAMPAIGN'
  | 'LOW_CONVERSION_CAMPAIGN'

export interface CampaignEvent extends DomainEvent {
  domain: 'campaigns'
  type: CampaignEventType
  data?: {
    campaignId?: string
    channel?: 'whatsapp' | 'email' | 'sms'
    metrics?: Record<string, unknown>
  }
}
