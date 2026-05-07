import { prisma } from '@/lib/prisma'
import { NotificationService } from './notification.service'
import { logger } from '@/lib/logger'

const OTP_TTL_MINUTES = 10
const MAX_ATTEMPTS = 5
const RATE_LIMIT_WINDOW_MINUTES = 15
const MAX_REQUESTS_PER_WINDOW = 3

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

function normalizePhone(phone: string): string {
  const p = phone.trim()
  if (p.startsWith('+')) return p
  if (p.startsWith('07')) return `+250${p.slice(1)}`
  if (p.startsWith('2507')) return `+${p}`
  return p.startsWith('0') ? `+250${p.slice(1)}` : `+${p}`
}

export class OTPService {
  static async sendOTP(phone: string, businessId: string): Promise<{ success: boolean; error?: string }> {
    const normalizedPhone = normalizePhone(phone)

    const customer = await prisma.customer.findUnique({
      where: { businessId_phone: { businessId, phone: normalizedPhone } },
    })

    const now = new Date()
    if (customer) {
      const windowStart = new Date(now.getTime() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000)
      if (customer.lastOtpRequestAt && customer.lastOtpRequestAt > windowStart) {
        if (customer.otpAttempts >= MAX_REQUESTS_PER_WINDOW) {
          return { success: false, error: 'Too many OTP requests. Please wait before trying again.' }
        }
      }
    }

    const otp = generateOTP()
    const expiresAt = new Date(now.getTime() + OTP_TTL_MINUTES * 60 * 1000)
    const hashedOtp = Buffer.from(otp).toString('base64')

    await prisma.customer.upsert({
      where: { businessId_phone: { businessId, phone: normalizedPhone } },
      update: {
        lastOtpRequestAt: now,
        otpAttempts: { increment: 1 },
        preferences: { otpHash: hashedOtp, otpExpiresAt: expiresAt.toISOString() },
      },
      create: {
        businessId,
        phone: normalizedPhone,
        name: normalizedPhone,
        lastOtpRequestAt: now,
        otpAttempts: 1,
        preferences: { otpHash: hashedOtp, otpExpiresAt: expiresAt.toISOString() },
      },
    })

    const message = `Your Imboni verification code is: *${otp}*\n\nValid for ${OTP_TTL_MINUTES} minutes. Do not share this code.`
    const result = await NotificationService.sendWhatsApp(normalizedPhone, message)

    if (!result.success) {
      logger.warn('OTP send failed', { phone: normalizedPhone, error: result.error })
      return { success: false, error: 'Failed to send OTP. Check your WhatsApp number.' }
    }

    logger.info('OTP sent', { phone: normalizedPhone, businessId })
    return { success: true }
  }

  static async verifyOTP(
    phone: string,
    businessId: string,
    otp: string
  ): Promise<{ success: boolean; customerId?: string; error?: string }> {
    const normalizedPhone = normalizePhone(phone)

    const customer = await prisma.customer.findUnique({
      where: { businessId_phone: { businessId, phone: normalizedPhone } },
    })

    if (!customer) return { success: false, error: 'Phone number not found' }

    const prefs = customer.preferences as any
    if (!prefs?.otpHash || !prefs?.otpExpiresAt) {
      return { success: false, error: 'No OTP requested. Please request a new code.' }
    }

    if (new Date(prefs.otpExpiresAt) < new Date()) {
      return { success: false, error: 'OTP expired. Please request a new code.' }
    }

    const expectedOtp = Buffer.from(prefs.otpHash, 'base64').toString()
    if (otp !== expectedOtp) {
      const attempts = (prefs.verifyAttempts || 0) + 1
      if (attempts >= MAX_ATTEMPTS) {
        await prisma.customer.update({
          where: { id: customer.id },
          data: { preferences: { ...prefs, otpHash: null, otpExpiresAt: null, verifyAttempts: 0 } },
        })
        return { success: false, error: 'Too many incorrect attempts. Request a new code.' }
      }
      await prisma.customer.update({
        where: { id: customer.id },
        data: { preferences: { ...prefs, verifyAttempts: attempts } },
      })
      return { success: false, error: `Incorrect code. ${MAX_ATTEMPTS - attempts} attempts remaining.` }
    }

    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        phoneVerified: true,
        phoneVerifiedAt: new Date(),
        otpAttempts: 0,
        preferences: { ...prefs, otpHash: null, otpExpiresAt: null, verifyAttempts: 0 },
      },
    })

    logger.info('OTP verified', { phone: normalizedPhone, customerId: customer.id })
    return { success: true, customerId: customer.id }
  }
}
