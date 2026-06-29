import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { ingestCampaignShadowEvent } from '@/lib/die/business-as-plugin/campaigns/campaigns.shadow'

function shapeCampaign(p: any) {
  const cfg = (p.config || {}) as any
  const now = new Date()
  const scheduled = p.startDate && new Date(p.startDate) > now
  const status: 'DRAFT' | 'SCHEDULED' | 'SENT' | 'CANCELLED' = cfg.status || (scheduled ? 'SCHEDULED' : 'DRAFT')
  return {
    id: p.id,
    name: p.name,
    message: cfg.message || p.description || '',
    segment: cfg.segment || 'all',
    status,
    scheduledFor: scheduled ? new Date(p.startDate).toISOString() : undefined,
    sentAt: cfg.sentAt || undefined,
    metrics: {
      sent: cfg.metrics?.sent ?? 0,
      delivered: cfg.metrics?.delivered ?? 0,
      read: cfg.metrics?.read ?? 0,
      clicked: cfg.metrics?.clicked ?? 0,
    },
    createdAt: new Date(p.createdAt).toISOString(),
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session?.user) return res.status(401).json({ error: 'Unauthorized' })

  const businessId = (session.user as any).businessId || await (async () => {
    const user = await prisma.user.findUnique({ where: { email: String(session.user?.email) }, select: { businessId: true, business: true } })
    return user?.businessId || user?.business?.id || null
  })()

  if (!businessId) return res.status(400).json({ error: 'Business ID required' })

  if (req.method === 'GET') {
    try {
      const promotions = await prisma.promotion.findMany({
        where: { businessId, type: 'WHATSAPP_CAMPAIGN' },
        orderBy: { createdAt: 'desc' },
      })
      const campaigns = promotions.map(shapeCampaign)
      return res.status(200).json({ campaigns })
    } catch (error) {
      console.error('Campaigns GET error:', error)
      return res.status(500).json({ error: 'Failed to load campaigns' })
    }
  }

  if (req.method === 'POST') {
    try {
      const { name, message, segment = 'all', scheduledFor } = req.body as any
      if (!name || !message) return res.status(400).json({ error: 'name and message required' })

      const startDate = scheduledFor ? new Date(scheduledFor) : new Date()
      const endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000)
      const status: 'DRAFT' | 'SCHEDULED' = scheduledFor ? 'SCHEDULED' : 'DRAFT'

      const created = await prisma.promotion.create({
        data: {
          businessId,
          name,
          description: message.substring(0, 160),
          type: 'WHATSAPP_CAMPAIGN',
          config: {
            message,
            segment,
            status,
            metrics: { sent: 0, delivered: 0, read: 0, clicked: 0 },
          },
          startDate,
          endDate,
          daysOfWeek: [0,1,2,3,4,5,6],
          timeStart: null,
          timeEnd: null,
          isActive: !!scheduledFor,
        },
      })
      // Shadow: CAMPAIGN_CREATED/SCHEDULED
      try {
        await ingestCampaignShadowEvent({ type: 'CAMPAIGN_CREATED', businessId, campaignId: created.id, channel: 'whatsapp' }).catch(() => {})
        if (status === 'SCHEDULED') {
          await ingestCampaignShadowEvent({ type: 'CAMPAIGN_SCHEDULED', businessId, campaignId: created.id, channel: 'whatsapp' }).catch(() => {})
        }
      } catch {}

      return res.status(201).json({ campaign: shapeCampaign(created) })
    } catch (error) {
      console.error('Campaigns POST error:', error)
      return res.status(500).json({ error: 'Failed to create campaign' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
