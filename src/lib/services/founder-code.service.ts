import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { PartnershipEventService } from './partnership-event.service'
import { FounderPartnerService } from './founder-partner.service'
import { FounderCodeStatus } from '@prisma/client'

const log = logger.child({ service: 'founder-code' })

const CODE_REGEX = /^[A-Z]{2,8}[0-9]{0,3}$/

export class FounderCodeService {
  static validateCodeFormat(code: string): boolean {
    return CODE_REGEX.test(code.toUpperCase())
  }

  static async createCode(params: {
    code: string
    partnerId: string
    trialDays?: number
    campaignId?: string
    expiresAt?: Date
    maxRedemptions?: number
    label?: string
    notes?: string
    createdBy?: string
  }) {
    const upperCode = params.code.toUpperCase()

    if (!this.validateCodeFormat(upperCode)) {
      throw new Error('Code must match format: 2-8 letters followed by 0-3 digits (e.g. ISIMBI30)')
    }

    const partner = await prisma.founderPartner.findUnique({
      where: { id: params.partnerId },
    })
    if (!partner) throw new Error('Partner not found')
    if (partner.status !== 'ACTIVE') {
      throw new Error(`Cannot create code: partner status is ${partner.status}`)
    }

    // Cross-table collision check
    const existing = await prisma.founderCode.findUnique({ where: { code: upperCode } })
    if (existing) throw new Error('Code already exists')

    const affiliateCollision = await prisma.affiliate.findUnique({ where: { code: upperCode } })
    if (affiliateCollision) throw new Error('Code collides with existing affiliate code')

    const marketerCollision = await prisma.professionalMarketer.findUnique({ where: { referralCode: upperCode } })
    if (marketerCollision) throw new Error('Code collides with existing marketer code')

    const referralCollision = await prisma.referralLink.findUnique({ where: { code: upperCode } })
    if (referralCollision) throw new Error('Code collides with existing referral link code')

    const code = await prisma.founderCode.create({
      data: {
        code: upperCode,
        partnerId: params.partnerId,
        trialDays: params.trialDays ?? 30,
        campaignId: params.campaignId,
        expiresAt: params.expiresAt,
        maxRedemptions: params.maxRedemptions,
        label: params.label,
        notes: params.notes,
        status: 'ACTIVE',
      },
    })

    await PartnershipEventService.emit({
      type: 'CODE_CREATED',
      entityType: 'founder_code',
      entityId: code.id,
      payload: { code: upperCode, partnerId: params.partnerId, trialDays: code.trialDays },
      triggeredBy: params.createdBy,
    })

    await FounderPartnerService.logActivity({
      partnerId: params.partnerId,
      type: 'CODE_CREATED',
      description: `Founder Code ${upperCode} created`,
    })

    log.info('Founder Code created', { codeId: code.id, code: upperCode })
    return code
  }

  static async updateCodeStatus(params: {
    codeId: string
    status: FounderCodeStatus
    updatedBy?: string
  }) {
    const code = await prisma.founderCode.findUnique({
      where: { id: params.codeId },
    })
    if (!code) throw new Error('Code not found')

    const updated = await prisma.founderCode.update({
      where: { id: params.codeId },
      data: { status: params.status },
    })

    const eventType = params.status === 'PAUSED' ? 'CODE_PAUSED' :
                      params.status === 'REVOKED' ? 'CODE_REVOKED' : 'CODE_CREATED'

    await PartnershipEventService.emit({
      type: eventType as any,
      entityType: 'founder_code',
      entityId: params.codeId,
      payload: { code: code.code, newStatus: params.status },
      triggeredBy: params.updatedBy,
    })

    log.info('Code status updated', { codeId: params.codeId, status: params.status })
    return updated
  }

  static async listCodes(params?: {
    partnerId?: string
    status?: FounderCodeStatus
    limit?: number
    offset?: number
  }) {
    const { partnerId, status, limit = 50, offset = 0 } = params || {}
    return prisma.founderCode.findMany({
      where: {
        ...(partnerId && { partnerId }),
        ...(status && { status }),
      },
      include: {
        partner: { select: { id: true, name: true, email: true } },
        campaign: { select: { id: true, name: true } },
        _count: { select: { redemptions: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    })
  }

  static async redeemCode(params: {
    codeId: string
    businessId: string
    userId?: string
    ipAddress?: string
    userAgent?: string
  }): Promise<{ redeemed: boolean; trialDaysGranted: number }> {
    const code = await prisma.founderCode.findUnique({
      where: { id: params.codeId },
    })

    if (!code || code.status !== 'ACTIVE') {
      return { redeemed: false, trialDaysGranted: 0 }
    }

    if (code.expiresAt && code.expiresAt < new Date()) {
      return { redeemed: false, trialDaysGranted: 0 }
    }

    if (code.maxRedemptions != null && code.redemptionCount >= code.maxRedemptions) {
      return { redeemed: false, trialDaysGranted: 0 }
    }

    // Idempotent: check if redemption already exists
    const existing = await prisma.founderCodeRedemption.findUnique({
      where: {
        codeId_businessId: { codeId: params.codeId, businessId: params.businessId },
      },
    })

    if (existing) {
      return { redeemed: true, trialDaysGranted: existing.trialDaysGranted }
    }

    const redemption = await prisma.founderCodeRedemption.create({
      data: {
        codeId: params.codeId,
        businessId: params.businessId,
        userId: params.userId,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        trialDaysGranted: code.trialDays,
      },
    })

    await prisma.founderCode.update({
      where: { id: params.codeId },
      data: { redemptionCount: { increment: 1 } },
    })

    await PartnershipEventService.emit({
      type: 'CODE_REDEEMED',
      entityType: 'founder_code',
      entityId: params.codeId,
      payload: {
        businessId: params.businessId,
        trialDaysGranted: code.trialDays,
      },
    })

    log.info('Founder Code redeemed', {
      codeId: params.codeId,
      businessId: params.businessId,
      trialDays: code.trialDays,
    })

    return { redeemed: true, trialDaysGranted: code.trialDays }
  }

  static async getCodeByCodeString(code: string) {
    return prisma.founderCode.findUnique({
      where: { code: code.toUpperCase() },
      include: { partner: true, campaign: true },
    })
  }
}
