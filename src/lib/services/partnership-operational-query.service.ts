/**
 * PartnershipOperationalQueryService
 *
 * Read-only query service for cross-departmental operational needs:
 *
 *   Customer Support:
 *     - lookupCode(code) — full code details + partnership + redemption history
 *     - lookupBusinessAttribution(businessId) — who referred this business
 *     - getPartnershipTimeline(partnershipId) — full activity log
 *
 *   Finance:
 *     - getCommissionSummary(partnershipId?) — totals by status
 *     - getPayoutSummary(partnershipId?) — totals by status
 *     - getCommissionLedger(partnershipId, filters) — detailed ledger
 *
 *   Executive Leadership:
 *     - getTopPartners(limit) — by signups, conversions, revenue
 *     - getCampaignPerformance(limit) — by conversion rate
 *     - getPartnershipTypeLTV() — lifetime value by partner type
 *     - getRegionalPerformance() — signups/conversions by region
 *     - getExpiringAgreements(days) — agreements expiring within N days
 *     - getPartnersRequiringAttention() — suspended, low health, expiring
 *     - getTotalCommissionLiability() — across all partnerships
 *     - getCACByPartnerType() — customer acquisition cost
 *
 *   Legal & Compliance:
 *     - getAgreementHistory(partnershipId) — full amendment chain
 *     - getAuditTrail(partnershipId) — all audit records
 *     - getPartnerStatusHistory(partnershipId) — all status changes from events
 *     - getCodeOwnership(codeId) — who owns this code
 *     - getCommissionHistory(commissionId) — full lifecycle from events
 *     - getPayoutHistory(payoutId) — full lifecycle from events
 */

import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

const log = logger.child({ service: 'partnership-operational-queries' })

export class PartnershipOperationalQueryService {
  // ═══════════════════════════════════════════════════════════════════
  // Customer Support Queries
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Look up a code by its string value (e.g., "ISIMBI30").
   * Returns code details, partnership info, and redemption history.
   */
  static async lookupCode(code: string) {
    const pc = await prisma.partnershipCode.findUnique({
      where: { code },
      include: {
        partnership: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            partnerType: true,
            status: true,
            region: true,
          },
        },
        campaign: {
          select: { id: true, name: true, status: true },
        },
        _count: { select: { redemptions: true } },
      },
    })
    if (!pc) return null

    const redemptions = await prisma.partnershipCodeRedemption.findMany({
      where: { codeId: pc.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    return {
      code: pc.code,
      status: pc.status,
      trialDays: pc.trialDays,
      maxRedemptions: pc.maxRedemptions,
      redemptionCount: pc.redemptionCount,
      expiresAt: pc.expiresAt,
      label: pc.label,
      partnership: pc.partnership,
      campaign: pc.campaign,
      redemptions: redemptions.map((r) => ({
        id: r.id,
        businessId: r.businessId,
        trialDaysGranted: r.trialDaysGranted,
        redeemedAt: r.createdAt,
        ipAddress: r.ipAddress,
      })),
    }
  }

  /**
   * Look up attribution for a specific business.
   * Shows who referred this business and through what code.
   */
  static async lookupBusinessAttribution(businessId: string) {
    const attributions = await prisma.partnershipAttribution.findMany({
      where: { businessId },
      include: {
        partnership: {
          select: { id: true, name: true, partnerType: true, status: true },
        },
        code: {
          select: { id: true, code: true, status: true, trialDays: true },
        },
      },
      orderBy: { createdAt: 'asc' },
      take: 50,
    })

    const canonical = await prisma.acquisitionAttribution.findFirst({
      where: { businessId },
    })

    return {
      touches: attributions.map((a) => ({
        id: a.id,
        partnership: a.partnership,
        code: a.code,
        sourceType: a.sourceType,
        touchType: a.touchType,
        isCanonical: a.isCanonical,
        trialDaysOverride: a.trialDaysOverride,
        timestamp: a.createdAt,
      })),
      canonicalAttribution: canonical,
    }
  }

  /**
   * Get the full timeline for a partnership.
   * Combines activity logs and events in chronological order.
   */
  static async getPartnershipTimeline(partnershipId: string, limit: number = 100) {
    const [activities, events] = await Promise.all([
      prisma.partnershipActivityLog.findMany({
        where: { partnershipId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      prisma.partnershipEvent.findMany({
        where: { entityId: partnershipId, entityType: 'partnership' },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
    ])

    const merged = [
      ...activities.map((a) => ({
        type: 'activity' as const,
        id: a.id,
        timestamp: a.createdAt,
        activityType: a.type,
        description: a.description,
        metadata: a.metadata,
      })),
      ...events.map((e) => ({
        type: 'event' as const,
        id: e.id,
        timestamp: e.createdAt,
        eventType: e.type,
        payload: e.payload,
        triggeredBy: e.triggeredBy,
      })),
    ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

    return merged.slice(0, limit)
  }

  // ═══════════════════════════════════════════════════════════════════
  // Finance Queries
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Get commission summary by status for a partnership or all.
   */
  static async getCommissionSummary(partnershipId?: string) {
    const where = partnershipId ? { partnershipId } : {}
    const statuses = ['PENDING', 'VALIDATED', 'APPROVED', 'PAID', 'VOID', 'CLAWED_BACK'] as const

    const results = await Promise.all(
      statuses.map(async (status) => {
        const result = await prisma.partnershipCommission.aggregate({
          where: { ...where, status: status as any },
          _sum: { amountCents: true },
          _count: true,
        })
        return {
          status,
          count: result._count,
          totalCents: result._sum.amountCents ?? 0,
        }
      }),
    )

    return {
      byStatus: results,
      totalLiabilityCents: results
        .filter((r) => r.status === 'PENDING' || r.status === 'VALIDATED' || r.status === 'APPROVED')
        .reduce((sum, r) => sum + r.totalCents, 0),
      totalPaidCents: results.find((r) => r.status === 'PAID')?.totalCents ?? 0,
      totalClawedBackCents: results.find((r) => r.status === 'CLAWED_BACK')?.totalCents ?? 0,
    }
  }

  /**
   * Get detailed commission ledger with filters.
   */
  static async getCommissionLedger(params: {
    partnershipId?: string
    status?: string
    type?: string
    startDate?: Date
    endDate?: Date
    limit?: number
    offset?: number
  }) {
    const { partnershipId, status, type, startDate, endDate, limit = 50, offset = 0 } = params

    return prisma.partnershipCommission.findMany({
      where: {
        ...(partnershipId && { partnershipId }),
        ...(status && { status: status as any }),
        ...(type && { type: type as any }),
        ...(startDate && endDate && {
          createdAt: { gte: startDate, lte: endDate },
        }),
      },
      include: {
        partnership: { select: { id: true, name: true, partnerType: true } },
        payout: { select: { id: true, status: true, paidAt: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    })
  }

  // ═══════════════════════════════════════════════════════════════════
  // Executive Leadership Queries
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Top partners by total signups, conversions, or revenue.
   */
  static async getTopPartners(params: {
    metric: 'signups' | 'conversions' | 'revenue' | 'commission'
    limit?: number
    partnerType?: string
  }) {
    const { metric, limit = 10, partnerType } = params

    const orderBy: Record<string, any> = {
      signups: { totalSignups: 'desc' as const },
      conversions: { totalConversions: 'desc' as const },
      revenue: { totalRevenueCents: 'desc' as const },
      commission: { totalCommissionCents: 'desc' as const },
    }

    return prisma.partnership.findMany({
      where: {
        status: { in: ['ACTIVE', 'SUSPENDED'] },
        ...(partnerType && { partnerType: partnerType as any }),
      },
      orderBy: orderBy[metric],
      take: limit,
      select: {
        id: true,
        name: true,
        partnerType: true,
        status: true,
        region: true,
        totalSignups: true,
        totalConversions: true,
        totalRevenueCents: true,
        totalCommissionCents: true,
        totalPayoutsCents: true,
      },
    })
  }

  /**
   * Campaign performance ranked by conversion rate.
   */
  static async getCampaignPerformance(limit: number = 20) {
    const campaigns = await prisma.partnershipCampaign.findMany({
      where: { status: { in: ['ACTIVE', 'COMPLETED'] } },
      include: {
        partnership: { select: { id: true, name: true } },
      },
      orderBy: { actualConversions: 'desc' },
      take: limit,
    })

    return campaigns.map((c) => ({
      id: c.id,
      name: c.name,
      partnership: c.partnership,
      channel: c.channel,
      status: c.status,
      signups: c.actualSignups,
      conversions: c.actualConversions,
      conversionRate: c.actualSignups > 0 ? (c.actualConversions / c.actualSignups) * 100 : 0,
      revenueCents: c.actualRevenueCents,
      targetSignups: c.targetSignups,
      targetConversions: c.targetConversions,
    }))
  }

  /**
   * Lifetime value by partner type.
   */
  static async getPartnershipTypeLTV() {
    const result = await prisma.partnership.groupBy({
      by: ['partnerType'],
      _sum: {
        totalRevenueCents: true,
        totalCommissionCents: true,
        totalPayoutsCents: true,
      },
      _count: true,
    })

    return result.map((r) => ({
      partnerType: r.partnerType,
      partnerCount: r._count,
      totalRevenueCents: r._sum.totalRevenueCents ?? 0,
      totalCommissionCents: r._sum.totalCommissionCents ?? 0,
      totalPayoutsCents: r._sum.totalPayoutsCents ?? 0,
      avgRevenuePerPartner: r._count > 0 ? Math.round((r._sum.totalRevenueCents ?? 0) / r._count) : 0,
    }))
  }

  /**
   * Regional performance breakdown.
   */
  static async getRegionalPerformance() {
    const result = await prisma.partnership.groupBy({
      by: ['region'],
      _sum: {
        totalSignups: true,
        totalConversions: true,
        totalRevenueCents: true,
      },
      _count: true,
    })

    return result.map((r) => ({
      region: r.region ?? 'Unknown',
      partnerCount: r._count,
      totalSignups: r._sum.totalSignups ?? 0,
      totalConversions: r._sum.totalConversions ?? 0,
      totalRevenueCents: r._sum.totalRevenueCents ?? 0,
      conversionRate: (r._sum.totalSignups ?? 0) > 0
        ? ((r._sum.totalConversions ?? 0) / (r._sum.totalSignups ?? 0)) * 100
        : 0,
    }))
  }

  /**
   * Agreements expiring within N days.
   */
  static async getExpiringAgreements(days: number = 30) {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() + days)

    return prisma.partnershipAgreement.findMany({
      where: {
        status: 'ACTIVE',
        expiresAt: {
          gte: new Date(),
          lte: cutoff,
        },
      },
      include: {
        partnership: { select: { id: true, name: true, email: true, phone: true } },
      },
      orderBy: { expiresAt: 'asc' },
      take: 100,
    })
  }

  /**
   * Partners requiring attention:
   *   - Suspended partners
   *   - Low health score (grade D or F)
   *   - Agreements expiring within 30 days
   *   - High risk profiles
   */
  static async getPartnersRequiringAttention() {
    const [suspended, lowHealth, highRisk, expiringAgreements] = await Promise.all([
      prisma.partnership.findMany({
        where: { status: 'SUSPENDED' },
        select: { id: true, name: true, email: true, status: true, region: true },
        take: 100,
      }),
      prisma.partnershipHealthScore.findMany({
        where: { grade: { in: ['D', 'F'] } },
        include: {
          partnership: { select: { id: true, name: true, email: true, status: true } },
        },
        take: 100,
      }),
      prisma.partnershipRiskProfile.findMany({
        where: { riskLevel: 'HIGH' },
        include: {
          partnership: { select: { id: true, name: true, email: true, status: true } },
        },
        take: 100,
      }),
      this.getExpiringAgreements(30),
    ])

    return {
      suspended,
      lowHealth: lowHealth.map((h) => ({
        partnership: h.partnership,
        score: h.score,
        grade: h.grade,
      })),
      highRisk: highRisk.map((r) => ({
        partnership: r.partnership,
        riskScore: r.riskScore,
        riskLevel: r.riskLevel,
        flags: r.flags,
      })),
      expiringAgreements: expiringAgreements.map((a) => ({
        agreementId: a.id,
        version: a.version,
        expiresAt: a.expiresAt,
        partnership: a.partnership,
      })),
    }
  }

  /**
   * Total commission liability across all partnerships.
   */
  static async getTotalCommissionLiability() {
    const result = await prisma.partnershipCommission.aggregate({
      where: { status: { in: ['PENDING', 'VALIDATED', 'APPROVED'] } },
      _sum: { amountCents: true },
      _count: true,
    })

    const byPartnership = await prisma.partnershipCommission.groupBy({
      by: ['partnershipId'],
      where: { status: { in: ['PENDING', 'VALIDATED', 'APPROVED'] } },
      _sum: { amountCents: true },
      _count: true,
      orderBy: { _sum: { amountCents: 'desc' } },
      take: 20,
    })

    return {
      totalLiabilityCents: result._sum.amountCents ?? 0,
      totalCommissionCount: result._count,
      topLiabilities: byPartnership.map((p) => ({
        partnershipId: p.partnershipId,
        totalCents: p._sum.amountCents ?? 0,
        commissionCount: p._count,
      })),
    }
  }

  /**
   * Customer Acquisition Cost by partner type.
   * CAC = total payouts / total conversions (signups that converted).
   */
  static async getCACByPartnerType() {
    const result = await prisma.partnership.groupBy({
      by: ['partnerType'],
      _sum: {
        totalPayoutsCents: true,
        totalConversions: true,
        totalSignups: true,
      },
      _count: true,
    })

    return result.map((r) => {
      const totalPayouts = r._sum.totalPayoutsCents ?? 0
      const conversions = r._sum.totalConversions ?? 0
      const signups = r._sum.totalSignups ?? 0
      return {
        partnerType: r.partnerType,
        partnerCount: r._count,
        totalPayoutsCents: totalPayouts,
        totalSignups: signups,
        totalConversions: conversions,
        cacPerSignup: signups > 0 ? Math.round(totalPayouts / signups) : 0,
        cacPerConversion: conversions > 0 ? Math.round(totalPayouts / conversions) : 0,
      }
    })
  }

  // ═══════════════════════════════════════════════════════════════════
  // Legal & Compliance Queries
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Get full agreement history (amendment chain) for a partnership.
   */
  static async getAgreementHistory(partnershipId: string) {
    return prisma.partnershipAgreement.findMany({
      where: { partnershipId },
      orderBy: { effectiveAt: 'asc' },
      include: {
        previousAgreement: {
          select: { id: true, version: true, status: true },
        },
      },
      take: 50,
    })
  }

  /**
   * Get full audit trail for a partnership.
   */
  static async getAuditTrail(partnershipId: string, limit: number = 100) {
    return prisma.partnershipAuditRecord.findMany({
      where: { partnershipId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }

  /**
   * Get partner status history from events.
   */
  static async getPartnerStatusHistory(partnershipId: string) {
    return prisma.partnershipEvent.findMany({
      where: {
        entityId: partnershipId,
        type: {
          in: [
            'PARTNER_CREATED',
            'PARTNER_APPLIED',
            'PARTNER_ONBOARDED',
            'PARTNER_APPROVED',
            'PARTNER_SUSPENDED',
            'PARTNER_REACTIVATED',
            'PARTNER_TERMINATED',
            'PARTNER_TYPE_CHANGED',
          ],
        },
      },
      orderBy: { createdAt: 'asc' },
      take: 100,
    })
  }

  /**
   * Get code ownership details.
   */
  static async getCodeOwnership(codeId: string) {
    const code = await prisma.partnershipCode.findUnique({
      where: { id: codeId },
      include: {
        partnership: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            partnerType: true,
            status: true,
            organization: true,
            region: true,
          },
        },
        campaign: {
          select: { id: true, name: true, status: true, startDate: true, endDate: true },
        },
      },
    })
    if (!code) return null

    return {
      code: code.code,
      status: code.status,
      createdAt: code.createdAt,
      trialDays: code.trialDays,
      maxRedemptions: code.maxRedemptions,
      redemptionCount: code.redemptionCount,
      expiresAt: code.expiresAt,
      partnership: code.partnership,
      campaign: code.campaign,
    }
  }

  /**
   * Get commission lifecycle history from events.
   */
  static async getCommissionHistory(commissionId: string) {
    const commission = await prisma.partnershipCommission.findUnique({
      where: { id: commissionId },
      include: {
        partnership: { select: { id: true, name: true } },
        payout: { select: { id: true, status: true, paidAt: true } },
      },
    })
    if (!commission) return null

    const events = await prisma.partnershipEvent.findMany({
      where: { entityId: commissionId, entityType: 'partnership_commission' },
      orderBy: { createdAt: 'asc' },
      take: 50,
    })

    return {
      commission: {
        id: commission.id,
        status: commission.status,
        amountCents: commission.amountCents,
        currency: commission.currency,
        type: commission.type,
        periodMonth: commission.periodMonth,
        clawbackReason: commission.clawbackReason,
        clawbackDate: commission.clawbackDate,
        paidAt: commission.paidAt,
      },
      partnership: commission.partnership,
      payout: commission.payout,
      events: events.map((e) => ({
        type: e.type,
        timestamp: e.createdAt,
        triggeredBy: e.triggeredBy,
        payload: e.payload,
      })),
    }
  }

  /**
   * Get payout lifecycle history from events.
   */
  static async getPayoutHistory(payoutId: string) {
    const payout = await prisma.partnershipPayout.findUnique({
      where: { id: payoutId },
      include: {
        partnership: { select: { id: true, name: true, email: true, phone: true } },
        commissions: {
          select: { id: true, amountCents: true, status: true, type: true },
        },
      },
    })
    if (!payout) return null

    const events = await prisma.partnershipEvent.findMany({
      where: { entityId: payoutId, entityType: 'partnership_payout' },
      orderBy: { createdAt: 'asc' },
      take: 50,
    })

    return {
      payout: {
        id: payout.id,
        status: payout.status,
        amountCents: payout.amountCents,
        currency: payout.currency,
        method: payout.method,
        paidAt: payout.paidAt,
        referenceId: payout.referenceId,
        recipientPhone: payout.recipientPhone,
        recipientBank: payout.recipientBank,
        recipientAccount: payout.recipientAccount,
      },
      partnership: payout.partnership,
      commissions: payout.commissions,
      events: events.map((e) => ({
        type: e.type,
        timestamp: e.createdAt,
        triggeredBy: e.triggeredBy,
        payload: e.payload,
      })),
    }
  }
}
