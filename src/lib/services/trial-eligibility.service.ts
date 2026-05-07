import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

type EvalInput = {
  email: string
  phone: string
  deviceFingerprint?: string | null
  ipAddress?: string | null
  captchaToken?: string | null
}

type EvalResult = {
  allowed: boolean
  blockedReason?: string
  riskScore: number
  recordId?: string
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function hashHmac(value: string) {
  const secret = process.env.TRIAL_HASH_SECRET || ''
  return crypto.createHmac('sha256', secret).update(value).digest('hex')
}

function hashLegacy(value: string) {
  const secret = process.env.TRIAL_HASH_SECRET || ''
  return crypto.createHash('sha256').update(secret + '|' + value).digest('hex')
}

function ipToRange(ip?: string | null) {
  if (!ip) return 'unknown'
  const first = (ip.split(',')[0] || '').trim()
  if (!first) return 'unknown'
  if (first.includes(':')) return 'ipv6'
  const parts = first.split('.')
  if (parts.length !== 4) return 'unknown'
  return `${parts[0]}.${parts[1]}.${parts[2]}.0/24`
}

async function isDisposableEmail(email: string) {
  const domain = normalizeEmail(email).split('@')[1]
  if (!domain) return false
  const match = await prisma.disposableEmailDomain.findUnique({ where: { domain } }).catch(() => null)
  if (match) return true
  const envList = (process.env.DISPOSABLE_EMAIL_DOMAINS || '').split(',').map(d => d.trim().toLowerCase()).filter(Boolean)
  return envList.includes(domain)
}

export const TrialEligibilityService = {
  async evaluateAndRecord(input: EvalInput): Promise<EvalResult> {
    const email = normalizeEmail(input.email)
    const phone = input.phone
    const deviceFingerprint = input.deviceFingerprint || null
    const ipRange = ipToRange(input.ipAddress || null)

    const hashedEmail = hashHmac(email)
    const hashedPhone = hashHmac(phone)
    const legacyEmail = hashLegacy(email)
    const legacyPhone = hashLegacy(phone)

    let riskScore = 0
    let blocked = false
    let blockReason: string | undefined

    const disposable = await isDisposableEmail(email)
    if (disposable) {
      blocked = true
      blockReason = 'disposable_email'
      riskScore += 60
    }

    const [emailExisting, phoneExisting, fpExistingCount, ipRangeCount] = await Promise.all([
      prisma.trialEligibility.findFirst({ where: { OR: [{ hashedEmail }, { hashedEmail: legacyEmail }] } }),
      prisma.trialEligibility.findFirst({ where: { OR: [{ hashedPhone }, { hashedPhone: legacyPhone }] } }),
      deviceFingerprint ? prisma.trialEligibility.count({ where: { deviceFingerprint } }) : Promise.resolve(0),
      prisma.trialEligibility.count({ where: { ipRange } }),
    ])

    if (emailExisting) {
      blocked = true
      blockReason = blockReason || 'email_used'
      riskScore += 50
    }
    if (phoneExisting) {
      blocked = true
      blockReason = blockReason || 'phone_used'
      riskScore += 50
    }
    if (deviceFingerprint && fpExistingCount > 0) {
      // do not hard block solely on FP; contribute to risk
      riskScore += 30
    }

    const ipRangeLimit = parseInt(process.env.TRIAL_IP_RANGE_LIMIT || '5', 10)
    if (ipRange !== 'unknown' && ipRange !== 'ipv6' && ipRangeCount >= ipRangeLimit) {
      blocked = true
      blockReason = blockReason || 'ip_range_limit'
      riskScore += 40
    }

    const captchaEnabled = process.env.CAPTCHA_ENABLED === 'true'
    const captchaThreshold = parseInt(process.env.TRIAL_CAPTCHA_THRESHOLD || '70', 10)
    if (captchaEnabled && riskScore >= captchaThreshold) {
      const token = input.captchaToken || undefined
      const verified = await verifyCaptcha(token)
      if (!verified) {
        blocked = true
        blockReason = 'captcha_required'
      } else if (!blockReason) {
        blockReason = 'captcha_challenged'
      }
    }

    const rec = await prisma.trialEligibility.create({
      data: {
        hashedEmail,
        hashedPhone,
        deviceFingerprint: deviceFingerprint || undefined,
        ipRange,
        riskScore,
        blocked,
        blockReason,
      },
      select: { id: true },
    })

    return { allowed: !blocked, blockedReason: blockReason, riskScore, recordId: rec.id }
  },

  async markTrialUsedByHashes(params: { hashedEmail?: string; hashedPhone?: string }) {
    const { hashedEmail, hashedPhone } = params
    const where: any = {}
    if (hashedEmail) where.hashedEmail = hashedEmail
    else if (hashedPhone) where.hashedPhone = hashedPhone
    else return
    const latest = await prisma.trialEligibility.findFirst({ where, orderBy: { createdAt: 'desc' } })
    if (!latest) return
    if (!latest.trialUsedAt) {
      await prisma.trialEligibility.update({ where: { id: latest.id }, data: { trialUsedAt: new Date() } })
    }
  },

  async markTrialUsed(input: { email?: string; phone?: string }) {
    const { email, phone } = input
    if (email) {
      const e = normalizeEmail(email)
      const hashedEmail = hashHmac(e)
      const legacy = hashLegacy(e)
      const latest = await prisma.trialEligibility.findFirst({
        where: { OR: [{ hashedEmail }, { hashedEmail: legacy }] },
        orderBy: { createdAt: 'desc' },
      })
      if (latest && !latest.trialUsedAt) {
        await prisma.trialEligibility.update({ where: { id: latest.id }, data: { trialUsedAt: new Date() } })
      }
      return
    }
    if (phone) {
      const hashedPhone = hashHmac(phone)
      const legacy = hashLegacy(phone)
      const latest = await prisma.trialEligibility.findFirst({
        where: { OR: [{ hashedPhone }, { hashedPhone: legacy }] },
        orderBy: { createdAt: 'desc' },
      })
      if (latest && !latest.trialUsedAt) {
        await prisma.trialEligibility.update({ where: { id: latest.id }, data: { trialUsedAt: new Date() } })
      }
    }
  },
}

async function verifyCaptcha(token?: string) {
  if (!token) return false
  if (process.env.CAPTCHA_TEST_MODE === 'true') {
    const t = process.env.CAPTCHA_TEST_TOKEN || ''
    return t.length > 0 && token === t
  }
  return false
}
