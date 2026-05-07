/**
 * POST /api/auth/verify-mfa-otp
 *
 * Step 2 of the MFA login flow.
 * Verifies the 6-digit OTP submitted by the user.
 * On success, returns a one-time confirmToken that NextAuth will consume.
 *
 * Rate limited: 5 per 10 min per IP.
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { AuthOTPService } from '@/lib/services/auth-otp.service'
import { SecurityEventService } from '@/lib/services/security-event.service'
import { withRateLimit } from '@/lib/middleware/withRateLimit'

function getIP(req: NextApiRequest): string {
  return ((req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown')
    .split(',')[0]
    .trim()
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { email, otp } = req.body ?? {}
  const ip = getIP(req)
  const userAgent = req.headers['user-agent'] ?? null

  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and verification code are required.' })
  }

  if (!/^\d{6}$/.test(String(otp).trim())) {
    return res.status(400).json({ error: 'Invalid code format. Enter the 6-digit code.' })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { id: true, isActive: true },
    })

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid request.' })
    }

    const result = await AuthOTPService.verify({ userId: user.id, otp: String(otp).trim() })

    if (!result.ok) {
      await SecurityEventService.log({
        userId: user.id,
        eventType: 'MFA_OTP_FAILED',
        ip,
        userAgent,
        metadata: { reason: result.error },
      })
      return res.status(401).json({ error: result.error })
    }

    await SecurityEventService.log({
      userId: user.id,
      eventType: 'MFA_OTP_VERIFIED',
      ip,
      userAgent,
    })

    // Update last login timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    return res.status(200).json({
      success: true,
      confirmToken: result.confirmToken,
      email: email.toLowerCase().trim(),
    })
  } catch (err) {
    console.error('[verify-mfa-otp] Error:', err)
    return res.status(500).json({ error: 'Verification service error. Please try again.' })
  }
}

export default withRateLimit(handler, {
  windowMs: 10 * 60 * 1000, // 10 min
  maxRequests: 5,
})
