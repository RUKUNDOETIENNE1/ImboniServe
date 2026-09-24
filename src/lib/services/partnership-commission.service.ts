/**
 * PartnershipCommissionService
 *
 * Manages the complete commission lifecycle:
 *   - Accrual (create PENDING commission)
 *   - Validation (PENDING → VALIDATED)
 *   - Approval (VALIDATED → APPROVED)
 *   - Adjustment (modify amount with audit)
 *   - Reversal (any non-terminal → VOID)
 *   - Clawback (PAID → CLAWED_BACK with reason)
 *   - Payout linkage (link commission to payout, mark PAID)
 *   - Recurring subscription commissions
 *
 * All transitions emit events, log activities, and create audit records.
 */

import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { PartnershipEventService } from './partnership-event.service'
import { PartnershipService } from './partnership.service'

const log = logger.child({ service: 'partnership-commission' })

export type CommissionStatus =
  | 'PENDING'
  | 'VALIDATED'
  | 'APPROVED'
  | 'PAID'
  | 'VOID'
  | 'CLAWED_BACK'

export interface CommissionAccrueInput {
  partnershipId: string
  businessId: string
  codeId?: string
  campaignId?: string
  type: string
  amountCents: number
  currency: string
  ratePercent: number
  periodMonth: number
  description?: string
  accruedBy?: string
}

const VALID_TRANSITIONS: Record<CommissionStatus, CommissionStatus[]> = {
  PENDING: ['VALIDATED', 'VOID'],
  VALIDATED: ['APPROVED', 'VOID'],
  APPROVED: ['PAID', 'VOID'],
  PAID: ['CLAWED_BACK'],
  VOID: [],
  CLAWED_BACK: [],
}

export class PartnershipCommissionService {
  /**
   * Accrue a new commission (creates in PENDING status).
   */
  static async accrue(input: CommissionAccrueInput) {
    if (input.amountCents <= 0) {
      throw new Error('Commission amount must be positive')
    }

    const commission = await prisma.partnershipCommission.create({
      data: {
        partnershipId: input.partnershipId,
        businessId: input.businessId,
        codeId: input.codeId,
        campaignId: input.campaignId,
        type: input.type as any,
        status: 'PENDING',
        amountCents: input.amountCents,
        currency: input.currency,
        ratePercent: input.ratePercent,
        periodMonth: input.periodMonth,
        description: input.description,
      },
    })

    await PartnershipEventService.emit({
      type: 'COMMISSION_ACCRUED',
      entityType: 'partnership_commission',
      entityId: commission.id,
      payload: {
        partnershipId: input.partnershipId,
        businessId: input.businessId,
        amountCents: input.amountCents,
        currency: input.currency,
        type: input.type,
      },
      triggeredBy: input.accruedBy,
    })

    await PartnershipService.logActivity(
      input.partnershipId,
      'COMMISSION_ACCRUED',
      `Commission accrued: ${input.amountCents / 100} ${input.currency} (${input.type})`,
      input.accruedBy,
      { commissionId: commission.id, businessId: input.businessId },
    )

    log.info('Commission accrued', { commissionId: commission.id, partnershipId: input.partnershipId })
    return commission
  }

  /**
   * Validate a commission (PENDING → VALIDATED).
   */
  static async validate(commissionId: string, validatedBy?: string) {
    return this.transition(
      commissionId,
      'VALIDATED',
      'COMMISSION_VALIDATED',
      'Commission validated',
      validatedBy,
      { validatedAt: new Date() },
    )
  }

  /**
   * Approve a commission (VALIDATED → APPROVED).
   */
  static async approve(commissionId: string, approvedBy: string) {
    return this.transition(
      commissionId,
      'APPROVED',
      'COMMISSION_APPROVED',
      'Commission approved',
      approvedBy,
      { approvedBy, approvedAt: new Date() },
    )
  }

  /**
   * Adjust a commission amount.
   * Creates an audit record with old and new values.
   */
  static async adjust(
    commissionId: string,
    newAmountCents: number,
    adjustedBy: string,
    reason: string,
  ) {
    if (newAmountCents <= 0) {
      throw new Error('Adjusted amount must be positive')
    }

    const commission = await prisma.partnershipCommission.findUnique({
      where: { id: commissionId },
    })
    if (!commission) throw new Error(`Commission ${commissionId} not found`)
    if (commission.status === 'PAID' || commission.status === 'VOID' || commission.status === 'CLAWED_BACK') {
      throw new Error(`Cannot adjust commission in status ${commission.status}`)
    }

    const oldAmount = commission.amountCents
    const updated = await prisma.partnershipCommission.update({
      where: { id: commissionId },
      data: { amountCents: newAmountCents },
    })

    await PartnershipService.audit(
      commission.partnershipId,
      'COMMISSION_ADJUSTED',
      adjustedBy,
      String(oldAmount),
      String(newAmountCents),
      { commissionId, reason, oldAmountCents: oldAmount, newAmountCents },
    )

    await PartnershipService.logActivity(
      commission.partnershipId,
      'COMMISSION_ADJUSTED',
      `Commission adjusted from ${oldAmount / 100} to ${newAmountCents / 100}: ${reason}`,
      adjustedBy,
      { commissionId, oldAmountCents: oldAmount, newAmountCents, reason },
    )

    log.info('Commission adjusted', { commissionId, oldAmount, newAmountCents, reason })
    return updated
  }

  /**
   * Void a commission (any non-terminal → VOID).
   */
  static async void(commissionId: string, voidedBy: string, reason: string) {
    const commission = await prisma.partnershipCommission.findUnique({
      where: { id: commissionId },
    })
    if (!commission) throw new Error(`Commission ${commissionId} not found`)
    if (commission.status === 'VOID') {
      throw new Error('Commission is already voided')
    }
    if (commission.status === 'PAID' || commission.status === 'CLAWED_BACK') {
      throw new Error(`Cannot void a ${commission.status} commission — use clawback instead`)
    }

    this.assertValidTransition(commission.status as CommissionStatus, 'VOID')

    const updated = await prisma.partnershipCommission.update({
      where: { id: commissionId },
      data: { status: 'VOID' },
    })

    await PartnershipEventService.emit({
      type: 'COMMISSION_VOIDED',
      entityType: 'partnership_commission',
      entityId: commissionId,
      payload: { partnershipId: commission.partnershipId, reason },
      triggeredBy: voidedBy,
    })

    await PartnershipService.logActivity(
      commission.partnershipId,
      'COMMISSION_VOIDED',
      `Commission voided: ${reason}`,
      voidedBy,
      { commissionId, reason },
    )

    log.info('Commission voided', { commissionId, reason })
    return updated
  }

  /**
   * Clawback a paid commission (PAID → CLAWED_BACK).
   * Emits COMMISSION_CLAWED_BACK event.
   */
  static async clawback(
    commissionId: string,
    clawbackBy: string,
    clawbackReason: string,
  ) {
    const commission = await prisma.partnershipCommission.findUnique({
      where: { id: commissionId },
    })
    if (!commission) throw new Error(`Commission ${commissionId} not found`)
    if (commission.status !== 'PAID') {
      throw new Error(`Cannot clawback commission in status ${commission.status} — only PAID commissions can be clawed back`)
    }

    const updated = await prisma.partnershipCommission.update({
      where: { id: commissionId },
      data: {
        status: 'CLAWED_BACK',
        clawbackReason,
        clawbackDate: new Date(),
      },
    })

    await PartnershipEventService.emit({
      type: 'COMMISSION_CLAWED_BACK',
      entityType: 'partnership_commission',
      entityId: commissionId,
      payload: {
        partnershipId: commission.partnershipId,
        clawbackReason,
        amountCents: commission.amountCents,
      },
      triggeredBy: clawbackBy,
    })

    await PartnershipService.logActivity(
      commission.partnershipId,
      'COMMISSION_CLAWED_BACK',
      `Commission clawed back: ${clawbackReason}`,
      clawbackBy,
      { commissionId, clawbackReason, amountCents: commission.amountCents },
    )

    await PartnershipService.audit(
      commission.partnershipId,
      'COMMISSION_CLAWED_BACK',
      clawbackBy,
      'PAID',
      'CLAWED_BACK',
      { commissionId, clawbackReason },
    )

    log.info('Commission clawed back', { commissionId, clawbackReason })
    return updated
  }

  /**
   * Link a commission to a payout and mark as PAID.
   */
  static async linkToPayout(commissionId: string, payoutId: string, paidBy?: string) {
    const commission = await prisma.partnershipCommission.findUnique({
      where: { id: commissionId },
    })
    if (!commission) throw new Error(`Commission ${commissionId} not found`)
    if (commission.status !== 'APPROVED') {
      throw new Error(`Cannot link commission in status ${commission.status} — must be APPROVED`)
    }

    const updated = await prisma.partnershipCommission.update({
      where: { id: commissionId },
      data: {
        status: 'PAID',
        payoutId,
        paidAt: new Date(),
      },
    })

    await PartnershipEventService.emit({
      type: 'COMMISSION_PAID',
      entityType: 'partnership_commission',
      entityId: commissionId,
      payload: {
        partnershipId: commission.partnershipId,
        payoutId,
        amountCents: commission.amountCents,
      },
      triggeredBy: paidBy,
    })

    await PartnershipService.logActivity(
      commission.partnershipId,
      'COMMISSION_PAID',
      `Commission paid via payout ${payoutId}`,
      paidBy,
      { commissionId, payoutId },
    )

    log.info('Commission linked to payout', { commissionId, payoutId })
    return updated
  }

  /**
   * Accrue a recurring subscription commission.
   * Computes commission from subscription amount and rate.
   */
  static async accrueRecurring(params: {
    partnershipId: string
    businessId: string
    subscriptionAmountCents: number
    currency: string
    ratePercent: number
    periodMonth: number
    codeId?: string
    campaignId?: string
    description?: string
    accruedBy?: string
  }) {
    const commissionAmount = Math.round(
      (params.subscriptionAmountCents * params.ratePercent) / 100,
    )

    return this.accrue({
      partnershipId: params.partnershipId,
      businessId: params.businessId,
      codeId: params.codeId,
      campaignId: params.campaignId,
      type: 'RECURRING_REVENUE',
      amountCents: commissionAmount,
      currency: params.currency,
      ratePercent: params.ratePercent,
      periodMonth: params.periodMonth,
      description: params.description ?? `Recurring commission (${params.ratePercent}% of ${params.subscriptionAmountCents / 100} ${params.currency})`,
      accruedBy: params.accruedBy,
    })
  }

  /**
   * Get commission ledger for a partnership.
   */
  static async listForPartnership(partnershipId: string, params?: { status?: CommissionStatus; limit?: number; offset?: number }) {
    const { status, limit = 50, offset = 0 } = params || {}
    return prisma.partnershipCommission.findMany({
      where: {
        partnershipId,
        ...(status && { status: status as any }),
      },
      include: { payout: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    })
  }

  /**
   * Get total pending commission for a partnership.
   */
  static async getPendingTotal(partnershipId: string) {
    const result = await prisma.partnershipCommission.aggregate({
      where: { partnershipId, status: { in: ['PENDING', 'VALIDATED', 'APPROVED'] } },
      _sum: { amountCents: true },
      _count: true,
    })
    return {
      totalCents: result._sum.amountCents ?? 0,
      count: result._count,
    }
  }

  // ─── Private helpers ──────────────────────────────────────────────

  private static async transition(
    commissionId: string,
    newStatus: CommissionStatus,
    eventType: string,
    activityDescription: string,
    triggeredBy?: string,
    extraData?: Record<string, unknown>,
  ) {
    const commission = await prisma.partnershipCommission.findUnique({
      where: { id: commissionId },
    })
    if (!commission) throw new Error(`Commission ${commissionId} not found`)

    const currentStatus = commission.status as CommissionStatus
    this.assertValidTransition(currentStatus, newStatus)

    const updated = await prisma.partnershipCommission.update({
      where: { id: commissionId },
      data: { status: newStatus as any, ...extraData },
    })

    await PartnershipEventService.emit({
      type: eventType as any,
      entityType: 'partnership_commission',
      entityId: commissionId,
      payload: { partnershipId: commission.partnershipId, newStatus },
      triggeredBy,
    })

    await PartnershipService.logActivity(
      commission.partnershipId,
      newStatus as any,
      activityDescription,
      triggeredBy,
      { commissionId, ...extraData },
    )

    log.info('Commission transition', { commissionId, from: currentStatus, to: newStatus })
    return updated
  }

  private static assertValidTransition(from: CommissionStatus, to: CommissionStatus) {
    const allowed = VALID_TRANSITIONS[from]
    if (!allowed || !allowed.includes(to)) {
      throw new Error(`Invalid commission transition: ${from} → ${to}`)
    }
  }
}
