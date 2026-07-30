import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { PartnershipEventService } from './partnership-event.service'
import { PartnerStatus, FounderCodeStatus, CampaignStatus } from '@prisma/client'
import { nanoid } from 'nanoid'

const log = logger.child({ service: 'founder-partner' })

export class FounderPartnerService {
  static async createPartner(params: {
    name: string
    email: string
    phone: string
    userId?: string
    partnerType?: 'FOUNDER' | 'STRATEGIC' | 'CHANNEL'
    organization?: string
    region?: string
    notes?: string
    onboardedBy?: string
  }) {
    const partner = await prisma.founderPartner.create({
      data: {
        name: params.name,
        email: params.email.toLowerCase().trim(),
        phone: params.phone,
        userId: params.userId,
        partnerType: params.partnerType ?? 'FOUNDER',
        status: 'PROSPECT',
        organization: params.organization,
        region: params.region,
        notes: params.notes,
        onboardedBy: params.onboardedBy,
      },
    })

    await PartnershipEventService.emit({
      type: 'PARTNER_CREATED',
      entityType: 'partner',
      entityId: partner.id,
      payload: { name: partner.name, partnerType: partner.partnerType },
      triggeredBy: params.onboardedBy,
    })

    log.info('Founder Partner created', { partnerId: partner.id, name: partner.name })
    return partner
  }

  static async submitApplication(params: {
    partnerId: string
    motivation?: string
    experience?: string
    networkSize?: string
    references?: Record<string, unknown>
  }) {
    const partner = await prisma.founderPartner.findUnique({
      where: { id: params.partnerId },
    })

    if (!partner) throw new Error('Partner not found')
    if (partner.status !== 'PROSPECT') {
      throw new Error(`Cannot apply: partner status is ${partner.status}`)
    }

    const application = await prisma.founderPartnerApplication.create({
      data: {
        partnerId: params.partnerId,
        motivation: params.motivation,
        experience: params.experience,
        networkSize: params.networkSize,
        references: params.references as any,
        status: 'SUBMITTED',
      },
    })

    await prisma.founderPartner.update({
      where: { id: params.partnerId },
      data: { status: 'APPLIED' },
    })

    await PartnershipEventService.emit({
      type: 'PARTNER_APPLIED',
      entityType: 'partner',
      entityId: params.partnerId,
      payload: { applicationId: application.id },
    })

    log.info('Application submitted', { partnerId: params.partnerId })
    return application
  }

  static async approvePartner(params: {
    partnerId: string
    reviewedBy: string
    reviewNotes?: string
    commissionRatePercent?: number
  }) {
    const partner = await prisma.founderPartner.findUnique({
      where: { id: params.partnerId },
      include: { application: true },
    })

    if (!partner) throw new Error('Partner not found')
    if (partner.status !== 'APPLIED') {
      throw new Error(`Cannot approve: partner status is ${partner.status}`)
    }

    await prisma.founderPartner.update({
      where: { id: params.partnerId },
      data: {
        status: 'ACTIVE',
        onboardedAt: new Date(),
        onboardedBy: params.reviewedBy,
      },
    })

    if (partner.application) {
      await prisma.founderPartnerApplication.update({
        where: { partnerId: params.partnerId },
        data: {
          status: 'APPROVED',
          reviewedBy: params.reviewedBy,
          reviewedAt: new Date(),
          reviewNotes: params.reviewNotes,
        },
      })
    }

    await PartnershipEventService.emit({
      type: 'PARTNER_APPROVED',
      entityType: 'partner',
      entityId: params.partnerId,
      payload: { reviewedBy: params.reviewedBy },
      triggeredBy: params.reviewedBy,
    })

    log.info('Partner approved', { partnerId: params.partnerId })
    return prisma.founderPartner.findUnique({ where: { id: params.partnerId } })
  }

  static async rejectPartner(params: {
    partnerId: string
    reviewedBy: string
    reviewNotes?: string
  }) {
    const partner = await prisma.founderPartner.findUnique({
      where: { id: params.partnerId },
    })

    if (!partner) throw new Error('Partner not found')
    if (partner.status !== 'APPLIED') {
      throw new Error(`Cannot reject: partner status is ${partner.status}`)
    }

    await prisma.founderPartner.update({
      where: { id: params.partnerId },
      data: { status: 'TERMINATED' },
    })

    if (partner.application) {
      await prisma.founderPartnerApplication.update({
        where: { partnerId: params.partnerId },
        data: {
          status: 'REJECTED',
          reviewedBy: params.reviewedBy,
          reviewedAt: new Date(),
          reviewNotes: params.reviewNotes,
        },
      })
    }

    await PartnershipEventService.emit({
      type: 'PARTNER_TERMINATED',
      entityType: 'partner',
      entityId: params.partnerId,
      payload: { reason: 'Application rejected', reviewedBy: params.reviewedBy },
      triggeredBy: params.reviewedBy,
    })

    log.info('Partner rejected', { partnerId: params.partnerId })
  }

  static async suspendPartner(params: {
    partnerId: string
    reason: string
    suspendedBy: string
  }) {
    const partner = await prisma.founderPartner.findUnique({
      where: { id: params.partnerId },
    })

    if (!partner) throw new Error('Partner not found')
    if (partner.status !== 'ACTIVE') {
      throw new Error(`Cannot suspend: partner status is ${partner.status}`)
    }

    await prisma.founderPartner.update({
      where: { id: params.partnerId },
      data: {
        status: 'SUSPENDED',
        notes: `[Suspended: ${params.reason}]`,
      },
    })

    await prisma.founderCode.updateMany({
      where: { partnerId: params.partnerId, status: 'ACTIVE' },
      data: { status: 'PAUSED' },
    })

    await PartnershipEventService.emit({
      type: 'PARTNER_SUSPENDED',
      entityType: 'partner',
      entityId: params.partnerId,
      payload: { reason: params.reason },
      triggeredBy: params.suspendedBy,
    })

    log.warn('Partner suspended', { partnerId: params.partnerId, reason: params.reason })
  }

  static async reactivatePartner(params: {
    partnerId: string
    reactivatedBy: string
  }) {
    const partner = await prisma.founderPartner.findUnique({
      where: { id: params.partnerId },
    })

    if (!partner) throw new Error('Partner not found')
    if (partner.status !== 'SUSPENDED') {
      throw new Error(`Cannot reactivate: partner status is ${partner.status}`)
    }

    await prisma.founderPartner.update({
      where: { id: params.partnerId },
      data: { status: 'ACTIVE' },
    })

    await prisma.founderCode.updateMany({
      where: { partnerId: params.partnerId, status: 'PAUSED' },
      data: { status: 'ACTIVE' },
    })

    await PartnershipEventService.emit({
      type: 'PARTNER_APPROVED',
      entityType: 'partner',
      entityId: params.partnerId,
      payload: { reason: 'Reactivated' },
      triggeredBy: params.reactivatedBy,
    })

    log.info('Partner reactivated', { partnerId: params.partnerId })
  }

  static async getPartner(partnerId: string) {
    return prisma.founderPartner.findUnique({
      where: { id: partnerId },
      include: {
        application: true,
        agreement: true,
        codes: { include: { _count: { select: { redemptions: true } } } },
        campaigns: true,
        commissions: { orderBy: { createdAt: 'desc' }, take: 20 },
        payouts: { orderBy: { createdAt: 'desc' }, take: 10 },
        activities: { orderBy: { createdAt: 'desc' }, take: 20 },
        riskProfile: true,
      },
    })
  }

  static async getPartnerByUserId(userId: string) {
    return prisma.founderPartner.findUnique({
      where: { userId },
    })
  }

  static async listPartners(params?: {
    status?: PartnerStatus
    partnerType?: 'FOUNDER' | 'STRATEGIC' | 'CHANNEL'
    limit?: number
    offset?: number
  }) {
    const { status, partnerType, limit = 50, offset = 0 } = params || {}
    return prisma.founderPartner.findMany({
      where: {
        ...(status && { status }),
        ...(partnerType && { partnerType }),
      },
      include: {
        _count: {
          select: {
            codes: true,
            commissions: true,
            payouts: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    })
  }

  static async getPartnerDashboard(partnerId: string) {
    const partner = await this.getPartner(partnerId)
    if (!partner) throw new Error('Partner not found')

    const [
      totalSignups,
      totalConversions,
      totalCommissionCents,
      pendingCommissionCents,
      paidCommissionCents,
      activeCodes,
      totalRedemptions,
    ] = await Promise.all([
      prisma.founderCodeRedemption.count({
        where: { code: { partnerId } },
      }),
      prisma.acquisitionAttribution.count({
        where: {
          sourceType: 'FOUNDER_CODE',
          sourceId: { in: await prisma.founderCode.findMany({ where: { partnerId }, select: { id: true } }).then(codes => codes.map(c => c.id)) },
        },
      }),
      prisma.founderCommission.aggregate({
        where: { partnerId, status: { not: 'VOID' } },
        _sum: { amountCents: true },
      }),
      prisma.founderCommission.aggregate({
        where: { partnerId, status: 'PENDING' },
        _sum: { amountCents: true },
      }),
      prisma.founderCommission.aggregate({
        where: { partnerId, status: 'PAID' },
        _sum: { amountCents: true },
      }),
      prisma.founderCode.count({
        where: { partnerId, status: 'ACTIVE' },
      }),
      prisma.founderCodeRedemption.count({
        where: { code: { partnerId } },
      }),
    ])

    return {
      partner,
      stats: {
        totalSignups,
        totalConversions,
        totalCommissionCents: totalCommissionCents._sum.amountCents || 0,
        pendingCommissionCents: pendingCommissionCents._sum.amountCents || 0,
        paidCommissionCents: paidCommissionCents._sum.amountCents || 0,
        activeCodes,
        totalRedemptions,
      },
      recentCommissions: partner.commissions,
      recentPayouts: partner.payouts,
      recentActivities: partner.activities,
    }
  }

  static async logActivity(params: {
    partnerId: string
    type: string
    description?: string
    metadata?: Record<string, unknown>
  }) {
    return prisma.partnerActivity.create({
      data: {
        partnerId: params.partnerId,
        type: params.type,
        description: params.description,
        metadata: params.metadata as any,
      },
    })
  }

  static async createAuditLog(params: {
    partnerId: string
    action: string
    actorId?: string
    oldValue?: string
    newValue?: string
    metadata?: Record<string, unknown>
  }) {
    return prisma.partnershipAuditLog.create({
      data: {
        partnerId: params.partnerId,
        action: params.action,
        actorId: params.actorId,
        oldValue: params.oldValue,
        newValue: params.newValue,
        metadata: params.metadata as any,
      },
    })
  }
}
