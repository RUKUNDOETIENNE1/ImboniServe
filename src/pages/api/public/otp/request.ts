import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { withRateLimit } from '@/lib/middleware/withRateLimit'
import { NotificationService } from '@/lib/services/notification.service'

function normalizePhone(phone: string): string {
  let p = phone.trim()
  if (p.startsWith('+')) return p
  // Rwanda default: if starts with 07/078/079 -> +2507..
  if (p.startsWith('07')) return `+250${p.slice(1)}`
  if (p.startsWith('2507')) return `+${p}`
  return p.startsWith('0') ? `+250${p.slice(1)}` : `+${p}`
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { branchId, phone } = req.body as { branchId?: string; phone?: string }
    if (!branchId || !phone) {
      return res.status(400).json({ error: 'branchId and phone are required' })
    }

    const business = await prisma.business.findUnique({ where: { id: branchId }, select: { id: true, name: true } })
    if (!business) return res.status(404).json({ error: 'Business not found' })

    const phoneE164 = normalizePhone(phone)

    // Per-phone throttle: max 5 OTP actions per 15 minutes window
    const now = new Date()
    const existing = await prisma.customer.findUnique({
      where: { businessId_phone: { businessId: branchId, phone: phoneE164 } },
      select: { id: true, otpAttempts: true, lastOtpRequestAt: true }
    })

    if (existing && existing.lastOtpRequestAt && now.getTime() - new Date(existing.lastOtpRequestAt).getTime() < 15 * 60 * 1000) {
      if ((existing.otpAttempts || 0) >= 5) {
        return res.status(429).json({ error: 'Too many OTP requests. Please try again later.' })
      }
      await prisma.customer.update({
        where: { id: existing.id },
        data: { otpAttempts: (existing.otpAttempts || 0) + 1, lastOtpRequestAt: now }
      })
    } else {
      // New window or new customer
      if (existing) {
        await prisma.customer.update({ where: { id: existing.id }, data: { otpAttempts: 1, lastOtpRequestAt: now } })
      } else {
        await prisma.customer.create({ data: { businessId: branchId, phone: phoneE164, name: 'QR Customer', otpAttempts: 1, lastOtpRequestAt: now } })
      }
    }

    // Create a 6-digit OTP code
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const identifier = `qr:${branchId}:${phoneE164}`

    // Clear previous tokens for this identifier
    await prisma.verificationToken.deleteMany({ where: { identifier } })

    // Token expires in 10 minutes
    const expires = new Date(Date.now() + 10 * 60 * 1000)
    await prisma.verificationToken.create({ data: { identifier, token: code, expires } })

    // Send via WhatsApp (optional)
    try {
      await NotificationService.sendWhatsApp(phoneE164, `Imboni Serve verification code: ${code}. Expires in 10 minutes.`)
    } catch (e) {
      console.log('[OTP] WhatsApp not configured or failed; code:', code)
    }

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('OTP request error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

// IP throttle: 10/hour per IP
export default withRateLimit(handler, { windowMs: 60 * 60 * 1000, maxRequests: 10 })
