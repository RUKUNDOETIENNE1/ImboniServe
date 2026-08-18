import { CampaignsPluginAdapter } from './campaigns.adapter'
import { routeDomainEvent } from '@/lib/die/business-as-plugin/conversion/event-router'
import { shadowBindings } from '@/lib/die/business-as-plugin/shadow/shadow-bindings'
import type { CampaignEventType } from './campaigns.contract'
import type { DomainEvent } from '@/lib/die/business-as-plugin/conversion/types'

export type CampaignShadowEvent =
  | 'CAMPAIGN_CREATED'
  | 'CAMPAIGN_SCHEDULED'
  | 'CAMPAIGN_STARTED'
  | 'CAMPAIGN_COMPLETED'
  | 'CAMPAIGN_FAILED'
  | 'HIGH_CONVERSION_CAMPAIGN'
  | 'LOW_CONVERSION_CAMPAIGN'

interface IngestInput {
  type: CampaignShadowEvent
  businessId: string
  campaignId?: string
  channel?: 'whatsapp' | 'email' | 'sms'
  metrics?: Record<string, unknown>
}

export async function ingestCampaignShadowEvent(input: IngestInput): Promise<void> {
  try {
    if (process.env.DIE_SHADOW_CAMPAIGNS_ENABLED !== 'true') return

    const adapter = new CampaignsPluginAdapter()
    const mapped: CampaignEventType = input.type

    const severity: DomainEvent['severity'] =
      input.type === 'CAMPAIGN_FAILED' ? 'WARN' : 'INFO'

    const ev: DomainEvent = {
      domain: 'campaigns',
      type: mapped,
      timestamp: new Date().toISOString(),
      businessId: input.businessId,
      severity,
      data: {
        campaignId: input.campaignId,
        channel: input.channel,
        metrics: input.metrics as any,
      },
    }

    await routeDomainEvent(adapter, shadowBindings, ev)
  } catch (e) {
    console.debug('[Shadow][Campaigns] ingest error (ignored):', (e as any)?.message)
  }
}
