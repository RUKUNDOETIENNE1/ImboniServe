/**
 * PartnershipPayoutService
 *
 * Manages payout lifecycle:
 *   - Create (PENDING) — with optional commission linkage
 *   - Approve (PENDING → APPROVED)
 *   - Process (APPROVED → PROCESSING)
 *   - Mark paid (PROCESSING → PAID) — links all included commissions
 *   - Fail (PROCESSING → FAILED)
 *   - Reject (PENDING/APPROVED → REJECTED)
 *
 * Also provides finance operational queries:
 *   - Get pending payouts
 *   - Get payout by ID with commissions
 *   - List payouts for a partnership
 *   - Month-end summary
 */

import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { PartnershipEventService } from './partnership-event.service'
import { PartnershipService } from './partnership.service'
import { PartnershipCommissionService } from './partnership-commission.service'

const log = logger.child({ service: 'partnership-payout' })

export type PayoutStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'PROCESSING'
  | 'PAID'
  | 'FAILED'
  | 'REJECTED'

export interface PayoutCreateInput {
  partnershipId: string
  amountCents: number
  currency?: string
  method: 'MTN_MOBILE_MONEY' | 'AIRTEL_MONEY' | 'BANK_TRANSFER'
  commissionIds?: string[]
  recipientPhone?: string
  recipientBank?: string
  recipientAccount?: string
  createdBy?: string
}

const VALID_TRANSITIONS: Record<PayoutStatus, PayoutStatus[]> = {
  PENDING: ['APPROVED', 'REJECTED'],
  APPROVED: ['PROCESSING', 'REJECTED'],
  PROCESSING: ['PAID', 'FAILED'],
  PAID: [],
  FAILED: [],
  REJECTED: [],
}

export class PartnershipPayoutService {
  /**
   * Create a new payout.
   * Optionally links commission IDs to be included in this payout.
   */
  static async create(input: PayoutCreateInput) {
    if (input.amountCents <= 0) {
      throw new Error('Payout amount must be positive')
    }

    const partnership = await prisma.partnership.findUnique({
      where: { id: input.partnershipId },
    })
    if (!partnership) throw new Error(`Partnership ${input.partnershipId} not found`)
    if (partnership.status === 'TERMINATED') {
      throw new Error('Cannot create payouts for a terminated partnership')
    }

    const payout = await prisma.partnershipPayout.create({
      data: {
        partnershipId: input.partnershipId,
        amountCents: input.amountCents,
        currency: input.currency ?? 'RWF',
        method: input.method,
        status: 'PENDING',
        recipientPhone: input.recipientPhone,
        recipientBank: input.recipientBank,
        recipientAccount: input.recipientAccount,
      },
    })

    await PartnershipEventService.emit({
      type: 'PAYOUT_REQUESTED',
      entityType: 'partnership_payout',
      entityId: payout.id,
      payload: {
        partnershipId: input.partnershipId,
        amountCents: input.amountCents,
        currency: input.currency ?? 'RWF',
        method: input.method,
      },
      triggeredBy: input.createdBy,
    })

    await PartnershipService.logActivity(
      input.partnershipId,
      'PAYOUT_REQUESTED',
      `Payout requested: ${input.amountCents / 100} ${input.currency ?? 'RWF'} via ${input.method}`,
      input.createdBy,
      { payoutId: payout.id },
    )

    log.info('Payout created', { payoutId: payout.id, partnershipId: input.partnershipId })
    return payout
  }

  /**
   * Approve a payout (PENDING → APPROVED).
   */
  static async approve(payoutId: string, approvedBy: string) {
    return this.transition(
      payoutId,
      'APPROVED',
      'PAYOUT_REQUESTED',
      'Payout approved',
      approvedBy,
      { approvedBy, approvedAt: new Date() },
    )
  }

  /**
   * Mark payout as processing (APPROVED → PROCESSING).
   */
  static async process(payoutId: string, processedBy?: string) {
    return this.transition(
      payoutId,
      'PROCESSING',
      'PAYOUT_REQUESTED',
      'Payout processing',
      processedBy,
      { processedAt: new Date() },
    )
  }

  /**
   * Mark payout as paid (PROCESSING → PAID).
   * Links all APPROVED commissions for this partnership to this payout.
   */
  static async markPaid(
    payoutId: string,
    paidBy?: string,
    referenceId?: string,
    providerResponse?: string,
  ) {
    const payout = await prisma.partnershipPayout.findUnique({
      where: { id: payoutId },
    })
    if (!payout) throw new Error(`Payout ${payoutId} not found`)
    if (payout.status !== 'PROCESSING') {
      throw new Error(`Cannot mark payout as paid in status ${payout.status} — must be PROCESSING`)
    }

    const updated = await prisma.partnershipPayout.update({
      where: { id: payoutId },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        referenceId,
        providerResponse,
      },
    })

    // Link all APPROVED commissions for this partnership to this payout
    const approvedCommissions = await prisma.partnershipCommission.findMany({
      where: { partnershipId: payout.partnershipId, status: 'APPROVED' },
    })

    for (const commission of approvedCommissions) {
      await PartnershipCommissionService.linkToPayout(commission.id, payoutId, paidBy)
    }

    await PartnershipEventService.emit({
      type: 'PAYOUT_REQUESTED',
      entityType: 'partnership_payout',
      entityId: payoutId,
      payload: {
        partnershipId: payout.partnershipId,
        status: 'PAID',
        commissionCount: approvedCommissions.length,
      },
      triggeredBy: paidBy,
    })

    await PartnershipService.logActivity(
      payout.partnershipId,
      'PAYOUT_PAID',
      `Payout paid: ${payout.amountCents / 100} ${payout.currency} (${approvedCommissions.length} commissions)`,
      paidBy,
      { payoutId, commissionCount: approvedCommissions.length, referenceId },
    )

    log.info('Payout marked paid', { payoutId, commissionCount: approvedCommissions.length })
    return updated
  }

  /**
   * Mark payout as failed (PROCESSING → FAILED).
   */
  static async markFailed(
    payoutId: string,
    failedBy?: string,
    failureReason?: string,
  ) {
    return this.transition(
      payoutId,
      'FAILED',
      'PAYOUT_REQUESTED',
      `Payout failed${failureReason ? ': ' + failureReason : ''}`,
      failedBy,
      { failedAt: new Date(), providerResponse: failureReason },
    )
  }

  /**
   * Reject a payout (PENDING/APPROVED → REJECTED).
   */
  static async reject(
    payoutId: string,
    rejectedBy: string,
    rejectReason: string,
  ) {
    const payout = await prisma.partnershipPayout.findUnique({
      where: { id: payoutId },
    })
    if (!payout) throw new Error(`Payout ${payoutId} not found`)
    if (payout.status === 'PAID' || payout.status === 'FAILED') {
      throw new Error(`Cannot reject payout in status ${payout.status}`)
    }

    this.assertValidTransition(payout.status as PayoutStatus, 'REJECTED')

    const updated = await prisma.partnershipPayout.update({
      where: { id: payoutId },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
        rejectedBy,
        rejectReason,
      },
    })

    await PartnershipService.logActivity(
      payout.partnershipId,
      'PAYOUT_REJECTED',
      `Payout rejected: ${rejectReason}`,
      rejectedBy,
      { payoutId, rejectReason },
    )

    log.info('Payout rejected', { payoutId, rejectReason })
    return updated
  }

  /**
   * Get payout by ID with commissions included.
   */
  static async getById(payoutId: string) {
    return prisma.partnershipPayout.findUnique({
      where: { id: payoutId },
      include: {
        commissions: true,
        partnership: { select: { id: true, name: true, email: true, phone: true } },
      },
    })
  }

  /**
   * List payouts for a partnership.
   */
  static async listForPartnership(partnershipId: string, params?: { status?: PayoutStatus; limit?: number; offset?: number }) {
    const { status, limit = 50, offset = 0 } = params || {}
    return prisma.partnershipPayout.findMany({
      where: {
        partnershipId,
        ...(status && { status: status as any }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    })
  }

  /**
   * Get all pending payouts (for finance month-end review).
   */
  static async getPendingPayouts(limit: number = 100) {
    return prisma.partnershipPayout.findMany({
      where: { status: { in: ['PENDING', 'APPROVED'] } },
      include: {
        partnership: { select: { id: true, name: true, email: true, phone: true } },
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
    })
  }

  /**
   * Month-end payout summary for a partnership or all partnerships.
   */
  static async getMonthEndSummary(partnershipId?: string) {
    const where = partnershipId ? { partnershipId } : {}
    const [pending, approved, paid, failed, rejected, totalLiability] = await Promise.all([
      prisma.partnershipPayout.count({ where: { ...where, status: 'PENDING' } }),
      prisma.partnershipPayout.count({ where: { ...where, status: 'APPROVED' } }),
      prisma.partnershipPayout.aggregate({
        where: { ...where, status: 'PAID' },
        _sum: { amountCents: true },
        _count: true,
      }),
      prisma.partnershipPayout.count({ where: { ...where, status: 'FAILED' } }),
      prisma.partnershipPayout.count({ where: { ...where, status: 'REJECTED' } }),
      prisma.partnershipCommission.aggregate({
        where: { ...where, status: { in: ['PENDING', 'VALIDATED', 'APPROVED'] } },
        _sum: { amountCents: true },
        _count: true,
      }),
    ])

    return {
      pendingCount: pending,
      approvedCount: approved,
      paid: {
        count: paid._count,
        totalCents: paid._sum.amountCents ?? 0,
      },
      failedCount: failed,
      rejectedCount: rejected,
      outstandingLiability: {
        count: totalLiability._count,
        totalCents: totalLiability._sum.amountCents ?? 0,
      },
    }
  }

  // ─── Private helpers ──────────────────────────────────────────────

  private static async transition(
    payoutId: string,
    newStatus: PayoutStatus,
    eventType: string,
    activityDescription: string,
    triggeredBy?: string,
    extraData?: Record<string, unknown>,
  ) {
    const payout = await prisma.partnershipPayout.findUnique({
      where: { id: payoutId },
    })
    if (!payout) throw new Error(`Payout ${payoutId} not found`)

    const currentStatus = payout.status as PayoutStatus
    this.assertValidTransition(currentStatus, newStatus)

    const updated = await prisma.partnershipPayout.update({
      where: { id: payoutId },
      data: { status: newStatus as any, ...extraData },
    })

    await PartnershipEventService.emit({
      type: eventType as any,
      entityType: 'partnership_payout',
      entityId: payoutId,
      payload: { partnershipId: payout.partnershipId, newStatus },
      triggeredBy,
    })

    await PartnershipService.logActivity(
      payout.partnershipId,
      newStatus as any,
      activityDescription,
      triggeredBy,
      { payoutId, ...extraData },
    )

    log.info('Payout transition', { payoutId, from: currentStatus, to: newStatus })
    return updated
  }

  private static assertValidTransition(from: PayoutStatus, to: PayoutStatus) {
    const allowed = VALID_TRANSITIONS[from]
    if (!allowed || !allowed.includes(to)) {
      throw new Error(`Invalid payout transition: ${from} → ${to}`)
    }
  }
}
