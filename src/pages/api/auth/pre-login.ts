/**
 * POST /api/auth/pre-login
 *
 * Step 1 of the MFA login flow.
 * Validates email + password. On success, issues and sends an OTP.
 * Does NOT create a session — that happens after OTP verification.
 *
 * Rate limited: 10 attempts per 15 minutes per IP.
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { AuthOTPService } from '@/lib/services/auth-otp.service'
import { SecurityEventService } from '@/lib/services/security-event.service'
import { logAuthDebug, hashIdentifier, redactedEmail } from '@/lib/utils/auth-debug'
import { withRateLimit } from '@/lib/middleware/withRateLimit'

function getIP(req: NextApiRequest): string {
  return ((req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown')
    .split(',')[0]
    .trim()
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { email, password, debugRequestId } = req.body ?? {}
  const ip = getIP(req)
  const userAgent = req.headers['user-agent'] ?? null
  const requestId: string | null = typeof debugRequestId === 'string' ? debugRequestId : null

  logAuthDebug(requestId, 'password_validation', 'start', {
    email: redactedEmail(email),
    ip: hashIdentifier(ip),
  })

  if (!email || !password) {
    logAuthDebug(requestId, 'password_validation', 'fail', { reason: 'missing_credentials' })
    return res.status(400).json({ error: 'Email and password are required.' })
  }

  // Brute-force guard: block if too many recent failures from this IP or account
  const ipFailures = await SecurityEventService.countRecentFailures({ ip, windowMinutes: 15 })
  if (ipFailures >= 10) {
    await SecurityEventService.log({ eventType: 'BRUTE_FORCE_DETECTED', ip, userAgent, metadata: { email } })
    return res.status(429).json({ error: 'Too many failed attempts. Try again in 15 minutes.' })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { id: true, name: true, email: true, password: true, phone: true, isActive: true, whatsappNumber: true },
    })

    const validPassword = user ? await bcrypt.compare(password, user.password) : false

    if (!user || !user.isActive || !validPassword) {
      logAuthDebug(requestId, 'password_validation', 'fail', {
        reason: !user ? 'user_not_found' : !user.isActive ? 'account_inactive' : 'wrong_password',
        email: redactedEmail(email),
      })
      await SecurityEventService.log({
        userId: user?.id,
        eventType: 'LOGIN_FAILED',
        ip,
        userAgent,
        metadata: { email, reason: !user ? 'user_not_found' : !user.isActive ? 'account_inactive' : 'wrong_password' },
      })
      // Generic message prevents user enumeration
      return res.status(401).json({ error: 'Invalid email or password.' })
    }

    logAuthDebug(requestId, 'password_validation', 'success', {
      userId: user.id,
      email: redactedEmail(user.email),
    })

    // Check per-user brute force
    const userFailures = await SecurityEventService.countRecentFailures({ userId: user.id, windowMinutes: 15 })
    if (userFailures >= 10) {
      await SecurityEventService.log({ userId: user.id, eventType: 'BRUTE_FORCE_DETECTED', ip, userAgent })
      return res.status(429).json({ error: 'Account temporarily locked. Try again in 15 minutes.' })
    }

    // Send OTP
    const sendResult = await AuthOTPService.sendOTP({
      userId: user.id,
      email: user.email,
      name: user.name,
      phone: user.whatsappNumber || user.phone,
      ip,
      debugContext: { requestId, emailHash: hashIdentifier(user.email) },
    })

    await SecurityEventService.log({
      userId: user.id,
      eventType: 'MFA_OTP_SENT',
      ip,
      userAgent,
      metadata: { channel: sendResult.channel },
    })

    if (!sendResult.success) {
      logAuthDebug(requestId, 'otp_delivery', 'fail', {
        userId: user.id,
        email: redactedEmail(user.email),
        reason: sendResult.reason || 'send_failed',
      })
      return res.status(503).json({ error: 'Could not send verification code. Please verify email/phone settings or try again.' })
    }

    logAuthDebug(requestId, 'otp_delivery', 'success', {
      userId: user.id,
      channel: sendResult.channel,
      email: redactedEmail(user.email),
    })

    // Mask email for display
    const parts = user.email.split('@')
    const masked = `${parts[0].slice(0, 2)}***@${parts[1]}`

    return res.status(200).json({
      success: true,
      otpRequired: true,
      maskedEmail: masked,
      channel: sendResult.channel,
      message: `A 6-digit code was sent to ${masked}.`,
      debugRequestId: requestId ?? undefined,
      pendingToken: sendResult.pendingToken,
    })
  } catch (err: any) {
    logAuthDebug(requestId, 'password_validation', 'fail', { exception: err?.message || String(err) })
    return res.status(500).json({ error: 'Login service error. Please try again.' })
  }
}

export default withRateLimit(handler, {
  windowMs: 15 * 60 * 1000, // 15 min
  maxRequests: 10,
})

export const config = {
  runtime: 'nodejs',
}
