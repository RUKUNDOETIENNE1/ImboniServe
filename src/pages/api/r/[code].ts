import type { NextApiRequest, NextApiResponse } from 'next'
import { ReferralTrackingTierService } from '@/lib/services/referral-tracking-tier.service'

/**
 * Referral link redirect endpoint
 * URL: /api/r/{code}
 * 
 * Tracks the click and redirects to the main menu
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { code } = req.query

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Invalid referral code' })
  }

  try {
    // Extract tracking data
    const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 
                     req.socket.remoteAddress
    const userAgent = req.headers['user-agent']
    const deviceId = req.cookies['device_id'] // Set by client-side

    // Track the click
    const result = await ReferralTrackingTierService.trackClick({
      referralCode: code,
      ipAddress,
      userAgent,
      deviceId
    })

    if (!result.success) {
      console.warn(`Referral click blocked: ${result.error}`)
      // Still redirect even if blocked, but don't set cookie
      return res.redirect(302, '/')
    }

    // Set referral cookie (expires in 30 days)
    const cookieMaxAge = 30 * 24 * 60 * 60 // 30 days in seconds
    res.setHeader(
      'Set-Cookie',
      `referral_code=${code}; Path=/; Max-Age=${cookieMaxAge}; HttpOnly; SameSite=Lax`
    )

    // Redirect to home page
    return res.redirect(302, '/')
  } catch (error) {
    console.error('Error handling referral redirect:', error)
    return res.redirect(302, '/')
  }
}
