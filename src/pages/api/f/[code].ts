import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { PartnershipEventService } from '@/lib/services/partnership-event.service'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { code } = req.query
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Invalid founder code' })
  }

  try {
    const founderCode = await prisma.founderCode.findUnique({
      where: { code: code.toUpperCase() },
      include: { partner: true },
    })

    if (!founderCode || founderCode.status !== 'ACTIVE') {
      return res.redirect(302, '/signup')
    }

    if (founderCode.expiresAt && founderCode.expiresAt < new Date()) {
      return res.redirect(302, '/signup')
    }

    if (founderCode.maxRedemptions != null && founderCode.redemptionCount >= founderCode.maxRedemptions) {
      return res.redirect(302, '/signup')
    }

    const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress
    const userAgent = req.headers['user-agent']

    await PartnershipEventService.emit({
      type: 'CODE_REDEEMED',
      entityType: 'founder_code',
      entityId: founderCode.id,
      payload: {
        action: 'redirect_click',
        code: founderCode.code,
        ipAddress,
      },
    })

    const cookieMaxAge = 30 * 24 * 60 * 60
    const cookieFlags = `Path=/; Max-Age=${cookieMaxAge}; HttpOnly; SameSite=Lax`
    res.setHeader('Set-Cookie', [
      `im_ref=${founderCode.code}; ${cookieFlags}`,
      `referral_code=${founderCode.code}; ${cookieFlags}`,
    ])

    return res.redirect(302, `/signup?ref=${founderCode.code}`)
  } catch (error) {
    console.error('Founder code redirect error:', error)
    return res.redirect(302, '/signup')
  }
}
