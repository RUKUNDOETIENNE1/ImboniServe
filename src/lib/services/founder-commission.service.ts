import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { PartnershipEventService } from './partnership-event.service'
import { FounderCommissionStatus } from '@prisma/client'

const log = logger.child({ service: 'founder-commission' })

const DEFAULT_COMMISSION_RATE = 15.0
const MAX_RECURRING_MONTHS = 12
const LOCK_PERIOD_DAYS = 7

export class FounderCommissionService {
  static async createCommissionForPayment(params: {
    businessId: string
    invoiceId?: string
    paymentTransactionId?: string
    amountCents: number
    currency?: string
  }) {
    const { businessId, invoiceId, amountCents, currency = 'RWF' } = params

    const attribution = await prisma.acquisitionAttribution.findUnique({
      where: { businessId },
      include: {
        business: {
          include: {
            subscription: true,
          },
        },
      },
    })

    if (!attribution || attribution.sourceType !== 'FOUNDER_CODE') {
      return null
    }

    const founderCode = await prisma.founderCode.findUnique({
      where: { id: attribution.sourceId! },
      include: { partner: true },
    })

    if (!founderCode || !founderCode.partner) {
      return null
    }

    const partner = founderCode.partner
    if (partner.status !== 'ACTIVE') {
      return null
    }

    // Determine commission rate from agreement or default
    const agreement = await prisma.partnerAgreement.findUnique({
      where: { partnerId: partner.id },
    })

    const commissionRate = agreement?.terms
      ? (agreement.terms as any)?.commissionRatePercent ?? DEFAULT_COMMISSION_RATE
      : DEFAULT_COMMISSION_RATE

    // Count existing recurring commissions for this business
    const existingCount = await prisma.founderCommission.count({
      where: {
        partnerId: partner.id,
        businessId,
        type: 'RECURRING_REVENUE',
        status: { not: 'VOID' },
      },
    })

    if (existingCount >= MAX_RECURRING_MONTHS) {
      log.info('Max recurring commissions reached', { partnerId: partner.id, businessId })
      return null
    }

    const periodMonth = existingCount + 1
    const commissionAmountCents = Math.round((amountCents * commissionRate) / 100)

    const lockedUntil = new Date()
    lockedUntil.setDate(lockedUntil.getDate() + LOCK_PERIOD_DAYS)

    const isFirstPayment = existingCount === 0

    // Create recurring commission
    const commission = await prisma.founderCommission.create({
      data: {
        partnerId: partner.id,
        businessId,
        codeId: founderCode.id,
        invoiceId: invoiceId ?? null,
        type: 'RECURRING_REVENUE',
        amountCents: commissionAmountCents,
        currency,
        ratePercent: commissionRate,
        status: 'PENDING',
        lockedUntil,
        periodMonth,
        description: `Month ${periodMonth} recurring commission (${commissionRate}%)`,
      },
    })

    await PartnershipEventService.emit({
      type: 'COMMISSION_ACCRUED',
      entityType: 'commission',
      entityId: commission.id,
      payload: {
        partnerId: partner.id,
        businessId,
        amountCents: commissionAmountCents,
        periodMonth,
        type: 'RECURRING_REVENUE',
      },
    })

    // Create signup bonus on first payment
    if (isFirstPayment) {
      const bonusAmountCents = 0 // Signup bonus is configurable per agreement; default 0 unless agreement specifies
      const agreementBonus = agreement?.terms
        ? (agreement.terms as any)?.signupBonusCents ?? 0
        : 0

      if (agreementBonus > 0) {
        const bonus = await prisma.founderCommission.create({
          data: {
            partnerId: partner.id,
            businessId,
            codeId: founderCode.id,
            invoiceId: invoiceId ?? null,
            type: 'SIGNUP_BONUS',
            amountCents: agreementBonus,
            currency,
            ratePercent: 0,
            status: 'PENDING',
            lockedUntil,
            description: 'Signup bonus for first referred payment',
          },
        })

        await PartnershipEventService.emit({
          type: 'COMMISSION_ACCRUED',
          entityType: 'commission',
          entityId: bonus.id,
          payload: {
            partnerId: partner.id,
            businessId,
            amountCents: agreementBonus,
            type: 'SIGNUP_BONUS',
          },
        })
      }
    }

    log.info('Founder commission created', {
      commissionId: commission.id,
      partnerId: partner.id,
      businessId,
      periodMonth,
      amountCents: commissionAmountCents,
    })

    return commission
  }

  static async validatePendingCommissions(): Promise<number> {
    const now = new Date()
    const ready = await prisma.founderCommission.findMany({
      where: {
        status: 'PENDING',
        lockedUntil: { lte: now },
      },
    })

    let validated = 0
    for (const commission of ready) {
      try {
        await prisma.founderCommission.update({
          where: { id: commission.id },
          data: {
            status: 'VALIDATED',
            validatedAt: now,
          },
        })

        await PartnershipEventService.emit({
          type: 'COMMISSION_VALIDATED',
          entityType: 'commission',
          entityId: commission.id,
          payload: {
            partnerId: commission.partnerId,
            amountCents: commission.amountCents,
          },
        })

        validated++
      } catch (error) {
        log.error('Failed to validate commission', { error, commissionId: commission.id })
      }
    }

    log.info('Commission validation batch complete', { validated })
    return validated
  }

  static async getCommissionsForPartner(params: {
    partnerId: string
    status?: FounderCommissionStatus
    limit?: number
    offset?: number
  }) {
    const { partnerId, status, limit = 50, offset = 0 } = params
    return prisma.founderCommission.findMany({
      where: {
        partnerId,
        ...(status && { status }),
      },
      include: {
        business: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    })
  }

  static async getCommissionStats(partnerId: string) {
    const [total, pending, validated, paid] = await Promise.all([
      prisma.founderCommission.aggregate({
        where: { partnerId, status: { not: 'VOID' } },
        _sum: { amountCents: true },
        _count: true,
      }),
      prisma.founderCommission.aggregate({
        where: { partnerId, status: 'PENDING' },
        _sum: { amountCents: true },
        _count: true,
      }),
      prisma.founderCommission.aggregate({
        where: { partnerId, status: 'VALIDATED' },
        _sum: { amountCents: true },
        _count: true,
      }),
      prisma.founderCommission.aggregate({
        where: { partnerId, status: 'PAID' },
        _sum: { amountCents: true },
        _count: true,
      }),
    ])

    return {
      total: { amountCents: total._sum.amountCents || 0, count: total._count },
      pending: { amountCents: pending._sum.amountCents || 0, count: pending._count },
      validated: { amountCents: validated._sum.amountCents || 0, count: validated._count },
      paid: { amountCents: paid._sum.amountCents || 0, count: paid._count },
    }
  }

  static async requestPayout(params: {
    partnerId: string
    method: 'MTN_MOBILE_MONEY' | 'AIRTEL_MONEY' | 'BANK_TRANSFER'
    recipientPhone?: string
    recipientBank?: string
    recipientAccount?: string
  }) {
    const MIN_PAYOUT_CENTS = 1_000_000 // 10,000 RWF

    const validatedCommissions = await prisma.founderCommission.aggregate({
      where: { partnerId: params.partnerId, status: 'VALIDATED' },
      _sum: { amountCents: true },
    })

    const totalValidated = validatedCommissions._sum.amountCents || 0
    if (totalValidated < MIN_PAYOUT_CENTS) {
      throw new Error(`Minimum payout is 10,000 RWF. You have ${totalValidated / 100} RWF available.`)
    }

    const payout = await prisma.founderPartnerPayout.create({
      data: {
        partnerId: params.partnerId,
        amountCents: totalValidated,
        currency: 'RWF',
        method: params.method,
        status: 'PENDING',
        recipientPhone: params.recipientPhone,
        recipientBank: params.recipientBank,
        recipientAccount: params.recipientAccount,
      },
    })

    await PartnershipEventService.emit({
      type: 'PAYOUT_REQUESTED',
      entityType: 'payout',
      entityId: payout.id,
      payload: { partnerId: params.partnerId, amountCents: totalValidated },
    })

    log.info('Payout requested', { payoutId: payout.id, partnerId: params.partnerId })
    return payout
  }

  static async approvePayout(params: {
    payoutId: string
    approvedBy: string
  }) {
    const payout = await prisma.founderPartnerPayout.findUnique({
      where: { id: params.payoutId },
    })

    if (!payout) throw new Error('Payout not found')
    if (payout.status !== 'PENDING') throw new Error(`Cannot approve: payout status is ${payout.status}`)

    const updated = await prisma.founderPartnerPayout.update({
      where: { id: params.payoutId },
      data: {
        status: 'APPROVED',
        approvedBy: params.approvedBy,
        approvedAt: new Date(),
      },
    })

    await PartnershipEventService.emit({
      type: 'PAYOUT_APPROVED',
      entityType: 'payout',
      entityId: params.payoutId,
      payload: { approvedBy: params.approvedBy },
      triggeredBy: params.approvedBy,
    })

    return updated
  }

  static async markPayoutPaid(params: {
    payoutId: string
    referenceId?: string
    providerResponse?: string
  }) {
    const payout = await prisma.founderPartnerPayout.findUnique({
      where: { id: params.payoutId },
    })

    if (!payout) throw new Error('Payout not found')
    if (payout.status !== 'APPROVED') throw new Error(`Cannot mark paid: payout status is ${payout.status}`)

    const updated = await prisma.founderPartnerPayout.update({
      where: { id: params.payoutId },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        referenceId: params.referenceId,
        providerResponse: params.providerResponse,
      },
    })

    // Mark all validated commissions for this partner as paid
    await prisma.founderCommission.updateMany({
      where: {
        partnerId: payout.partnerId,
        status: 'VALIDATED',
      },
      data: { status: 'PAID', paidAt: new Date() },
    })

    await PartnershipEventService.emit({
      type: 'PAYOUT_PAID',
      entityType: 'payout',
      entityId: params.payoutId,
      payload: { referenceId: params.referenceId },
    })

    log.info('Payout marked paid', { payoutId: params.payoutId })
    return updated
  }
}
