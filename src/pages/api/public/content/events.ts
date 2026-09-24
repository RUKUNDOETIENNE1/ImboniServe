import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

const VALID_EVENT_TYPES = [
  'PAGE_VIEW',
  'READ_COMPLETE',
  'SHARE',
  'CTA_CLICK',
  'NEWSLETTER_SIGNUP',
  'DEMO_REQUEST',
]

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { articleId, eventType, metadata } = req.body || {}

  if (!eventType || !VALID_EVENT_TYPES.includes(eventType)) {
    return res.status(400).json({ error: `Invalid eventType. Valid types: ${VALID_EVENT_TYPES.join(', ')}` })
  }

  if (articleId) {
    const article = await (prisma as any).editorialArticle.findFirst({
      where: { id: articleId, status: 'PUBLISHED' },
      select: { id: true },
    })
    if (!article) return res.status(404).json({ error: 'Article not found or not published' })
  }

  const utmSource = req.cookies.im_utm_source || null
  const utmMedium = req.cookies.im_utm_medium || null
  const utmCampaign = req.cookies.im_utm_campaign || null
  const refCode = req.cookies.im_ref || null

  let sessionId = req.cookies.im_session_id || null
  if (!sessionId) {
    sessionId = `s_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
  }

  await (prisma as any).contentEvent.create({
    data: {
      articleId: articleId || null,
      eventType,
      metadata: metadata || null,
      sessionId,
      utmSource,
      utmMedium,
      utmCampaign,
      refCode,
    },
  })

  return res.status(200).json({ success: true })
}
