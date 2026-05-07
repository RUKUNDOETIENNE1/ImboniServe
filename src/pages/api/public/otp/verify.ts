import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { withRateLimit } from '@/lib/middleware/withRateLimit'

function normalizePhone(phone: string): string {
  const p = phone.trim()
  if (p.startsWith('+')) return p
  if (p.startsWith('07')) return `+250${p.slice(1)}`
  if (p.startsWith('2507')) return `+${p}`
  return p.startsWith('0') ? `+250${p.slice(1)}` : `+${p}`
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { branchId, phone, code } = req.body as { branchId?: string; phone?: string; code?: string }
    if (!branchId || !phone || !code) {
      return res.status(400).json({ error: 'branchId, phone and code are required' })
    }

    const phoneE164 = normalizePhone(phone)
    const identifier = `qr:${branchId}:${phoneE164}`

    const token = await prisma.verificationToken.findUnique({
      where: { identifier_token: { identifier, token: code } }
    })

    if (!token) {
      return res.status(400).json({ error: 'Invalid code' })
    }

    if (token.expires < new Date()) {
      await prisma.verificationToken.delete({ where: { identifier_token: { identifier, token: code } } })
      return res.status(400).json({ error: 'Code expired' })
    }

    const now = new Date()
    await prisma.customer.upsert({
      where: { businessId_phone: { businessId: branchId, phone: phoneE164 } },
      create: { businessId: branchId, phone: phoneE164, name: 'QR Customer', phoneVerified: true, phoneVerifiedAt: now, otpAttempts: 0, lastOtpRequestAt: now },
      update: { phoneVerified: true, phoneVerifiedAt: now, otpAttempts: 0 }
    })

    await prisma.verificationToken.delete({ where: { identifier_token: { identifier, token: code } } })

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('OTP verify error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

// IP throttle: 10/hour per IP
export default withRateLimit(handler, { windowMs: 60 * 60 * 1000, maxRequests: 10 })
