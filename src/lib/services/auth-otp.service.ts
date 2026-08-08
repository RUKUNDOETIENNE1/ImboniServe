/**
 * Auth OTP Service — Manages login MFA verification codes.
 *
 * Flow:
 *  1. validateCredentials(email, password)  → user object (or null)
 *  2. sendLoginOTP(userId, email, name, ip) → sends 6-digit code via email + WhatsApp fallback
 *  3. verifyOTP(userId, otp)               → returns { ok, confirmToken } if valid
 *  4. consumeConfirmToken(token)            → used in NextAuth authorize() to complete session
 */

import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { logAuthDebug } from '@/lib/utils/auth-debug'
import { EmailService } from './email.service'
import { NotificationService } from './notification.service'

const OTP_TTL_MINUTES = 15
const MAX_VERIFY_ATTEMPTS = 5
const CONFIRM_TOKEN_TTL_MINUTES = 5

function generateNumericOTP(): string {
  return crypto.randomInt(100000, 999999).toString()
}

function hashOTP(otp: string): string {
  return crypto.createHash('sha256').update(otp + (process.env.NEXTAUTH_SECRET || '')).digest('hex')
}

/** Hash an opaque token before storing in the database. Raw value is returned to client only. */
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token + (process.env.NEXTAUTH_SECRET || '')).digest('hex')
}

function generateConfirmToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

type DebugContext = {
  requestId?: string | null
  emailHash?: string | null
}

export const AuthOTPService = {
  /**
   * Invalidates old unused OTPs for a user and issues a new one.
   * Returns the raw OTP (to send to user) — never stored plain.
   */
  async issue(opts: {
    userId: string
    ip?: string
    deviceId?: string
    debugContext?: DebugContext
  }): Promise<{ otp: string; pendingToken: string }> {
    const { userId, ip, deviceId, debugContext } = opts
    const requestId = debugContext?.requestId ?? null
    logAuthDebug(requestId, 'otp_generation', 'start', { userId })
    const otp = generateNumericOTP()
    const hashedOtp = hashOTP(otp)
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000)
    const pendingToken = crypto.randomBytes(32).toString('hex')
    const hashedPendingToken = hashToken(pendingToken)

    // Invalidate all previous unused OTPs for this user
    logAuthDebug(requestId, 'otp_invalidate_previous', 'start', { userId })
    await prisma.userLoginOtp.updateMany({
      where: { userId, used: false },
      data: { used: true },
    })
    logAuthDebug(requestId, 'otp_invalidate_previous', 'success', { userId })

    const record = await prisma.userLoginOtp.create({
      data: { userId, hashedOtp, expiresAt, pendingToken: hashedPendingToken, ip: ip ?? null, deviceId: deviceId ?? null },
      select: { id: true },
    })

    logAuthDebug(requestId, 'otp_storage', 'success', {
      userId,
      userLoginOtpId: record.id,
      expiresAt: expiresAt.toISOString(),
    })

    return { otp, pendingToken }
  },

  /**
   * Send OTP to user via email (primary) + WhatsApp (fallback if phone set).
   */
  async sendOTP(opts: {
    userId: string
    email: string
    name: string
    phone?: string | null
    ip?: string
    deviceId?: string
    debugContext?: DebugContext
  }): Promise<{ success: boolean; channel: 'email' | 'whatsapp' | 'both' | 'failed'; pendingToken?: string; reason?: string }> {
    const { email, name, phone, ip, deviceId, userId, debugContext } = opts
    const requestId = debugContext?.requestId ?? null
    logAuthDebug(requestId, 'otp_delivery_start', 'start', { userId, channelRequested: phone ? 'email+whatsapp' : 'email' })
    const { otp, pendingToken } = await AuthOTPService.issue({ userId, ip, deviceId, debugContext })

    let emailSent = false
    let whatsappSent = false

    // Primary: email
    try {
      const emailResult = await EmailService.sendLoginOTP({
        to: email,
        name,
        otp,
        ip,
        expiresMinutes: OTP_TTL_MINUTES,
      })
      emailSent = emailResult.success
      if (!emailResult.success) {
        logAuthDebug(requestId, 'otp_delivery_email', 'fail', { userId, error: emailResult.error || 'unknown_error' })
      }
    } catch (e: any) {
      logAuthDebug(requestId, 'otp_delivery_email', 'fail', { userId, exception: e?.message || String(e) })
    }

    // Fallback / parallel: WhatsApp if phone is set
    if (phone) {
      const msg = `🔐 Your Imboni Serve login code: *${otp}*\n\nExpires in ${OTP_TTL_MINUTES} minutes. Do NOT share this code.`
      try {
        const waResult = await NotificationService.sendWhatsApp(phone, msg)
        whatsappSent = waResult.success
        if (!waResult.success) {
          logAuthDebug(requestId, 'otp_delivery_whatsapp', 'fail', { userId, error: waResult.error || waResult.message })
        }
      } catch (e: any) {
        logAuthDebug(requestId, 'otp_delivery_whatsapp', 'fail', { userId, exception: e?.message || String(e) })
      }
    }

    if (!emailSent && !whatsappSent) {
      logAuthDebug(requestId, 'otp_delivery_complete', 'fail', { userId, reason: 'no_channel_succeeded' })
      // Last resort: log to console (development only)
      if (process.env.NODE_ENV !== 'production') {
        logAuthDebug(requestId, 'otp_delivery_dev_fallback', 'success', { userId })
        return { success: true, channel: 'email', pendingToken }
      }
      return { success: false, channel: 'failed', reason: 'no_channel_succeeded' }
    }

    const channel = emailSent && whatsappSent ? 'both' : emailSent ? 'email' : 'whatsapp'
    logAuthDebug(requestId, 'otp_delivery_complete', 'success', { userId, channel })
    return { success: true, channel, pendingToken }
  },

  /**
   * Verify the OTP submitted by the user.
   * Returns a short-lived confirmToken on success.
   */
  async verify(opts: {
    userId: string
    otp: string
    debugContext?: DebugContext
  }): Promise<{ ok: true; confirmToken: string } | { ok: false; error: string }> {
    const { userId, otp, debugContext } = opts
    const requestId = debugContext?.requestId ?? null
    const hashedOtp = hashOTP(otp)
    const now = new Date()

    logAuthDebug(requestId, 'otp_verification_request', 'start', { userId })

    const record = await prisma.userLoginOtp.findFirst({
      where: {
        userId,
        used: false,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!record) {
      logAuthDebug(requestId, 'otp_lookup', 'fail', { userId, reason: 'no_unused_record' })
      return { ok: false, error: 'Code not found or expired. Request a new one.' }
    }

    logAuthDebug(requestId, 'otp_lookup', 'success', { userId, userLoginOtpId: record.id, expiresAt: record.expiresAt.toISOString() })

    if (record.hashedOtp !== hashedOtp) {
      logAuthDebug(requestId, 'otp_match', 'fail', { userId, userLoginOtpId: record.id })
      return { ok: false, error: 'Invalid code. Check and try again.' }
    }

    // Issue a confirm token (one-time, short-lived) for NextAuth to consume
    const confirmToken = generateConfirmToken()
    const hashedConfirmToken = hashToken(confirmToken)
    const confirmExpiry = new Date(Date.now() + CONFIRM_TOKEN_TTL_MINUTES * 60 * 1000)

    logAuthDebug(requestId, 'confirm_token_creation', 'start', { userId, userLoginOtpId: record.id, confirmExpiry: confirmExpiry.toISOString() })

    await prisma.userLoginOtp.update({
      where: { id: record.id },
      data: {
        used: true,
        confirmToken: hashedConfirmToken,
        // Reuse expiresAt field as the confirmToken expiry window
        expiresAt: confirmExpiry,
      },
    })

    logAuthDebug(requestId, 'confirm_token_creation', 'success', { userId, userLoginOtpId: record.id })
    return { ok: true, confirmToken }
  },

  /**
   * Called by NextAuth authorize() — consumes the confirmToken to create a real session.
   * Returns the userId if token is valid; null otherwise.
   */
  async consumeConfirmToken(token: string, debugContext?: DebugContext): Promise<string | null> {
    const now = new Date()
    const hashedToken = hashToken(token)
    const requestId = debugContext?.requestId ?? null

    logAuthDebug(requestId, 'confirm_token_lookup', 'start', {})

    const record = await prisma.userLoginOtp.findUnique({
      where: { confirmToken: hashedToken },
      select: { id: true, userId: true, used: true, expiresAt: true },
    })

    if (!record) {
      logAuthDebug(requestId, 'confirm_token_lookup', 'fail', { reason: 'not_found' })
      return null
    }
    // Confirm tokens are stored with used=true (OTP was verified), confirmToken must still be present
    // and the expiresAt (repurposed as confirmToken TTL) must be in the future
    if (record.expiresAt < now) {
      logAuthDebug(requestId, 'confirm_token_expired', 'fail', {
        userLoginOtpId: record.id,
        expiresAt: record.expiresAt.toISOString(),
        now: now.toISOString(),
      })
      return null
    }

    // Nullify confirmToken so it can't be replayed
    await prisma.userLoginOtp.update({
      where: { id: record.id },
      data: { confirmToken: null },
    })

    logAuthDebug(requestId, 'confirm_token_consumed', 'success', { userLoginOtpId: record.id, userId: record.userId })
    return record.userId
  },

  /**
   * Cleanup expired OTPs older than 1 hour (call from cron or request lifecycle).
   */
  async cleanup(): Promise<void> {
    const cutoff = new Date(Date.now() - 60 * 60 * 1000)
    await prisma.userLoginOtp.deleteMany({
      where: { createdAt: { lt: cutoff } },
    })
  },
}
