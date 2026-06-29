import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { sendCampaignMessages } from '@/lib/whatsapp/campaign-scheduler'
import { ingestCampaignShadowEvent } from '@/lib/die/business-as-plugin/campaigns/campaigns.shadow'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const session = await getServerSession(req, res, authOptions)
  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { id } = req.query
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Campaign ID required' })
  }

  try {
    // Shadow: CAMPAIGN_STARTED
    try {
      const businessId = (session.user as any)?.businessId || ''
      if (businessId) await ingestCampaignShadowEvent({ type: 'CAMPAIGN_STARTED', businessId, campaignId: id as string, channel: 'whatsapp' }).catch(() => {})
    } catch {}

    const metrics = await sendCampaignMessages(id)
    
    // Shadow: completion vs failure heuristic
    try {
      const businessId = (session.user as any)?.businessId || ''
      if (businessId) {
        if (metrics.failed > 0 && metrics.sent === 0) {
          await ingestCampaignShadowEvent({ type: 'CAMPAIGN_FAILED', businessId, campaignId: id as string, channel: 'whatsapp' }).catch(() => {})
        } else {
          await ingestCampaignShadowEvent({ type: 'CAMPAIGN_COMPLETED', businessId, campaignId: id as string, channel: 'whatsapp', metrics: (metrics as any) }).catch(() => {})
          const denominator = Math.max(metrics.sent + metrics.failed, 1)
          const rate = metrics.sent / denominator
          if (rate >= 0.85) await ingestCampaignShadowEvent({ type: 'HIGH_CONVERSION_CAMPAIGN', businessId, campaignId: id as string, channel: 'whatsapp', metrics: ({ delivery_success_rate: rate } as any) }).catch(() => {})
          else if (rate < 0.6) await ingestCampaignShadowEvent({ type: 'LOW_CONVERSION_CAMPAIGN', businessId, campaignId: id as string, channel: 'whatsapp', metrics: ({ delivery_success_rate: rate } as any) }).catch(() => {})
        }
      }
    } catch {}
    return res.status(200).json({ 
      success: true, 
      metrics,
      message: `Campaign sent: ${metrics.sent} messages delivered, ${metrics.failed} failed`
    })
  } catch (error) {
    console.error('Campaign send error:', error)
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to send campaign' 
    })
  }
}
