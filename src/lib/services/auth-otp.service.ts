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
import { EmailService } from './email.service'
import { NotificationService } from './notification.service'

const OTP_TTL_MINUTES = 10
const MAX_VERIFY_ATTEMPTS = 5
const CONFIRM_TOKEN_TTL_MINUTES = 5

function generateNumericOTP(): string {
  return crypto.randomInt(100000, 999999).toString()
}

function hashOTP(otp: string): string {
  return crypto.createHash('sha256').update(otp + (process.env.NEXTAUTH_SECRET || '')).digest('hex')
}

function generateConfirmToken(): string {
  return crypto.randomBytes(32).toString('hex')
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
  }): Promise<string> {
    const { userId, ip, deviceId } = opts
    const otp = generateNumericOTP()
    const hashedOtp = hashOTP(otp)
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000)

    // Invalidate all previous unused OTPs for this user
    await prisma.userLoginOtp.updateMany({
      where: { userId, used: false },
      data: { used: true },
    })

    await prisma.userLoginOtp.create({
      data: { userId, hashedOtp, expiresAt, ip: ip ?? null, deviceId: deviceId ?? null },
    })

    return otp
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
  }): Promise<{ success: boolean; channel: 'email' | 'whatsapp' | 'both' | 'failed' }> {
    const { email, name, phone, ip, deviceId, userId } = opts
    const otp = await AuthOTPService.issue({ userId, ip, deviceId })

    let emailSent = false
    let whatsappSent = false

    // Primary: email
    const emailResult = await EmailService.sendLoginOTP({
      to: email,
      name,
      otp,
      ip,
      expiresMinutes: OTP_TTL_MINUTES,
    })
    emailSent = emailResult.success

    // Fallback / parallel: WhatsApp if phone is set
    if (phone) {
      const msg = `🔐 Your Imboni Serve login code: *${otp}*\n\nExpires in ${OTP_TTL_MINUTES} minutes. Do NOT share this code.`
      try {
        const waResult = await NotificationService.sendWhatsApp(phone, msg)
        whatsappSent = waResult.success
      } catch {
        // non-fatal
      }
    }

    if (!emailSent && !whatsappSent) {
      // Last resort: log to console (development only)
      if (process.env.NODE_ENV !== 'production') {
        console.info(`[AuthOTP] DEV OTP for user ${userId}: ${otp}`)
        return { success: true, channel: 'email' }
      }
      return { success: false, channel: 'failed' }
    }

    const channel = emailSent && whatsappSent ? 'both' : emailSent ? 'email' : 'whatsapp'
    return { success: true, channel }
  },

  /**
   * Verify the OTP submitted by the user.
   * Returns a short-lived confirmToken on success.
   */
  async verify(opts: {
    userId: string
    otp: string
  }): Promise<{ ok: true; confirmToken: string } | { ok: false; error: string }> {
    const { userId, otp } = opts
    const hashedOtp = hashOTP(otp)
    const now = new Date()

    const record = await prisma.userLoginOtp.findFirst({
      where: {
        userId,
        used: false,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!record) {
      return { ok: false, error: 'Code not found or expired. Request a new one.' }
    }

    if (record.hashedOtp !== hashedOtp) {
      return { ok: false, error: 'Invalid code. Check and try again.' }
    }

    // Issue a confirm token (one-time, short-lived) for NextAuth to consume
    const confirmToken = generateConfirmToken()
    const confirmExpiry = new Date(Date.now() + CONFIRM_TOKEN_TTL_MINUTES * 60 * 1000)

    await prisma.userLoginOtp.update({
      where: { id: record.id },
      data: {
        used: true,
        confirmToken,
        // Reuse expiresAt field as the confirmToken expiry window
        expiresAt: confirmExpiry,
      },
    })

    return { ok: true, confirmToken }
  },

  /**
   * Called by NextAuth authorize() — consumes the confirmToken to create a real session.
   * Returns the userId if token is valid; null otherwise.
   */
  async consumeConfirmToken(token: string): Promise<string | null> {
    const now = new Date()
    const record = await prisma.userLoginOtp.findUnique({
      where: { confirmToken: token },
      select: { id: true, userId: true, used: true, expiresAt: true },
    })

    if (!record) return null
    // Confirm tokens are stored with used=true (OTP was verified), confirmToken must still be present
    // and the expiresAt (repurposed as confirmToken TTL) must be in the future
    if (record.expiresAt < now) return null

    // Nullify confirmToken so it can't be replayed
    await prisma.userLoginOtp.update({
      where: { id: record.id },
      data: { confirmToken: null },
    })

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
