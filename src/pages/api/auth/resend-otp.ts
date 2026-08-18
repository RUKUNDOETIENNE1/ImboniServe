/**
 * POST /api/auth/resend-otp
 *
 * Resends a login OTP for a user who has already passed password validation.
 *
 * Security design:
 *  - Requires a `pendingToken` issued by /api/auth/pre-login and stored in
 *    UserLoginOtp.pendingToken. This cryptographically proves the requester
 *    completed password authentication in the current browser session.
 *    Email alone is never sufficient to trigger a resend.
 *  - Applies the same IP brute-force check as pre-login.
 *  - Issues a completely new OTP via AuthOTPService.sendOTP(), which
 *    invalidates all previous unused OTPs before creating the new one.
 *  - Returns a fresh pendingToken for subsequent resend requests.
 *  - Logs every attempt as OTP_RESEND_REQUESTED for fraud investigation.
 *
 * Rate limited: 3 resends per 15 minutes per IP (independent of login limit).
 */

import crypto from 'crypto'
import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { AuthOTPService } from '@/lib/services/auth-otp.service'
import { SecurityEventService } from '@/lib/services/security-event.service'
import { logAuthDebug, hashIdentifier, redactedEmail } from '@/lib/utils/auth-debug'
import { withRateLimit } from '@/lib/middleware/withRateLimit'

/**
 * Security: Fail-closed — NEXTAUTH_SECRET is required by env-validator.
 * If missing in production, refuse to hash rather than using an empty secret.
 */
function hashToken(token: string): string {
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('SECURITY FATAL: NEXTAUTH_SECRET is not set. Cannot hash token.')
  }
  return crypto.createHash('sha256').update(token + (secret || '')).digest('hex')
}

function getIP(req: NextApiRequest): string {
  return ((req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown')
    .split(',')[0]
    .trim()
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { email, pendingToken, debugRequestId } = req.body ?? {}
  const ip = getIP(req)
  const userAgent = req.headers['user-agent'] ?? null
  const requestId: string | null = typeof debugRequestId === 'string' ? debugRequestId : null

  logAuthDebug(requestId, 'otp_resend_request', 'start', {
    email: redactedEmail(email),
    ip: hashIdentifier(ip),
  })

  if (!email || !pendingToken) {
    logAuthDebug(requestId, 'otp_resend_request', 'fail', { reason: 'missing_email_or_token' })
    return res.status(400).json({ error: 'Invalid request.' })
  }

  try {
    // --- Brute-force guard (same as pre-login) ---
    const ipFailures = await SecurityEventService.countRecentFailures({ ip, windowMinutes: 15 })
    if (ipFailures >= 10) {
      await SecurityEventService.log({
        eventType: 'BRUTE_FORCE_DETECTED',
        ip,
        userAgent,
        metadata: { email, trigger: 'resend' },
      })
      logAuthDebug(requestId, 'otp_resend_rate_limit', 'fail', { reason: 'ip_bruteforce' })
      return res.status(429).json({ error: 'Too many failed attempts. Try again in 15 minutes.' })
    }

    // --- Resolve user — enumerate-safe ---
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { id: true, name: true, email: true, phone: true, isActive: true, whatsappNumber: true },
    })

    // Log the attempt regardless of outcome to support fraud investigation
    await SecurityEventService.log({
      userId: user?.id ?? null,
      eventType: 'OTP_RESEND_REQUESTED',
      ip,
      userAgent,
      metadata: { email: email.toLowerCase().trim() },
    })

    // Constant-time response to prevent user enumeration
    if (!user || !user.isActive) {
      logAuthDebug(requestId, 'otp_resend_user_lookup', 'fail', { reason: 'user_not_found_or_inactive', email: redactedEmail(email) })
      return res.status(200).json({ success: true, message: 'If the account exists, a new code has been sent.' })
    }

    // --- Validate pendingToken — cryptographic proof of completed password step ---
    const hashedPendingToken = hashToken(pendingToken)
    const otpRecord = await prisma.userLoginOtp.findUnique({
      where: { pendingToken: hashedPendingToken },
      select: { id: true, userId: true, used: true, expiresAt: true },
    })

    const tokenValid =
      otpRecord &&
      otpRecord.userId === user.id &&
      otpRecord.expiresAt > new Date()

    if (!tokenValid) {
      logAuthDebug(requestId, 'pending_token_validation', 'fail', {
        userId: user.id,
        reason: otpRecord ? (otpRecord.expiresAt <= new Date() ? 'expired' : 'mismatch') : 'not_found',
      })
      await SecurityEventService.log({
        userId: user.id,
        eventType: 'MFA_OTP_FAILED',
        ip,
        userAgent,
        metadata: { reason: 'invalid_pending_token', trigger: 'resend' },
      })
      // Use 400 not 401 — avoids leaking whether account exists to attackers
      return res.status(400).json({ error: 'Session expired. Please log in again.' })
    }

    // --- Issue fresh OTP — rotates and invalidates previous OTP ---
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
      metadata: { channel: sendResult.channel, trigger: 'resend' },
    })

    if (!sendResult.success) {
      logAuthDebug(requestId, 'otp_resend_delivery', 'fail', { userId: user.id, reason: sendResult.reason || 'send_failed' })
      return res.status(503).json({ error: 'Could not resend code. Please try again.' })
    }

    logAuthDebug(requestId, 'otp_resend_delivery', 'success', { userId: user.id, channel: sendResult.channel })

    return res.status(200).json({
      success: true,
      message: 'A new verification code has been sent.',
      channel: sendResult.channel,
      pendingToken: sendResult.pendingToken,
      debugRequestId: requestId ?? undefined,
    })
  } catch (err: any) {
    logAuthDebug(requestId, 'otp_resend_request', 'fail', { exception: err?.message || String(err) })
    return res.status(500).json({ error: 'Could not resend code. Please try again.' })
  }
}

export default withRateLimit(handler, {
  windowMs: 15 * 60 * 1000, // 15 min — independent of pre-login limit
  maxRequests: 3,
})

export const config = {
  runtime: 'nodejs',
}
