import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { PartnershipCommissionService } from '@/lib/services/partnership-commission.service'
import { PartnershipPayoutService } from '@/lib/services/partnership-payout.service'
import { PartnershipOperationalQueryService } from '@/lib/services/partnership-operational-query.service'
import { withRateLimit } from '@/lib/middleware/withRateLimit'

const ALLOWED_ROLES = ['ADMIN', 'FINANCE', 'CFO', 'PARTNERSHIP_MANAGER', 'OPERATIONS_MANAGER', 'CEO', 'SUPPORT', 'LEGAL', 'EXECUTIVE']
const FINANCE_ROLES = ['ADMIN', 'FINANCE', 'CFO']

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session?.user?.email) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user?.roles?.some((r: string) => ALLOWED_ROLES.includes(r))) {
    return res.status(403).json({ error: 'Insufficient permissions' })
  }

  const canManage = user.roles?.some((r: string) => FINANCE_ROLES.includes(r))
  const userId = user.id

  // ─── GET: Load full revenue operations state ─────────────────────
  if (req.method === 'GET') {
    try {
      const { partnershipId, page = '1', limit = '50', status, type, startDate, endDate } = req.query

      const pageNum = parseInt(page as string, 10) || 1
      const limitNum = Math.min(parseInt(limit as string, 10) || 50, 200)
      const offset = (pageNum - 1) * limitNum

      const dateFilter = startDate && endDate
        ? { createdAt: { gte: new Date(startDate as string), lte: new Date(endDate as string) } }
        : {}

      // ─── Revenue Summary (from FinancialLedgerEntry per system rules) ───
      const [
        ledgerRevenue,
        ledgerRevenueLastMonth,
        commissionSummary,
        totalLiability,
        pendingPayouts,
        monthEndSummary,
        topRevenuePartners,
        activePartnerCount,
      ] = await Promise.all([
        // Total revenue from FinancialLedgerEntry (single source of truth)
        prisma.financialLedgerEntry.aggregate({
          where: {
            domain: 'SUBSCRIPTION',
            eventType: { in: ['PAYMENT_SUCCESS', 'SUBSCRIPTION_CHARGE', 'SUBSCRIPTION_RENEWED'] },
            ...dateFilter,
          },
          _sum: { amountCents: true, netAmountCents: true },
          _count: true,
        }),
        // Last month revenue for trend
        prisma.financialLedgerEntry.aggregate({
          where: {
            domain: 'SUBSCRIPTION',
            eventType: { in: ['PAYMENT_SUCCESS', 'SUBSCRIPTION_CHARGE', 'SUBSCRIPTION_RENEWED'] },
            occurredAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
              lt: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
          _sum: { amountCents: true },
        }),
        // Commission summary (all or by partnership)
        PartnershipOperationalQueryService.getCommissionSummary(
          partnershipId as string | undefined,
        ),
        // Total liability
        PartnershipOperationalQueryService.getTotalCommissionLiability(),
        // Pending payouts
        PartnershipPayoutService.getPendingPayouts(100),
        // Month-end summary
        PartnershipPayoutService.getMonthEndSummary(
          partnershipId as string | undefined,
        ),
        // Top revenue partners
        PartnershipOperationalQueryService.getTopPartners({
          metric: 'revenue',
          limit: 5,
        }),
        // Active partner count
        prisma.partnership.count({
          where: { status: 'ACTIVE', ...(partnershipId ? { id: partnershipId as string } : {}) },
        }),
      ])

      const totalRevenueCents = ledgerRevenue._sum.amountCents ?? 0
      const lastMonthRevenueCents = ledgerRevenueLastMonth._sum.amountCents ?? 0
      const currentMonthRevenueCents = await prisma.financialLedgerEntry.aggregate({
        where: {
          domain: 'SUBSCRIPTION',
          eventType: { in: ['PAYMENT_SUCCESS', 'SUBSCRIPTION_CHARGE', 'SUBSCRIPTION_RENEWED'] },
          occurredAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
        _sum: { amountCents: true },
      })

      const mrrCents = Math.round(currentMonthRevenueCents._sum.amountCents ?? 0)
      const avgRevenuePerPartner = activePartnerCount > 0
        ? Math.round(totalRevenueCents / activePartnerCount)
        : 0

      // Revenue trend (last 6 months from ledger)
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
      const ledgerTrend = await prisma.financialLedgerEntry.findMany({
        where: {
          domain: 'SUBSCRIPTION',
          eventType: { in: ['PAYMENT_SUCCESS', 'SUBSCRIPTION_CHARGE', 'SUBSCRIPTION_RENEWED'] },
          occurredAt: { gte: sixMonthsAgo },
        },
        select: { amountCents: true, occurredAt: true },
        orderBy: { occurredAt: 'asc' },
        take: 10000,
      })

      const monthlyTrend = computeMonthlyTrend(ledgerTrend)

      // ─── Commission Ledger ────────────────────────────────────────
      const commissions = await prisma.partnershipCommission.findMany({
        where: {
          ...(partnershipId ? { partnershipId: partnershipId as string } : {}),
          ...(status ? { status: status as any } : {}),
          ...(type ? { type: type as any } : {}),
          ...dateFilter,
        },
        include: {
          partnership: { select: { id: true, name: true, partnerType: true, region: true } },
          payout: { select: { id: true, status: true, paidAt: true, method: true } },
          campaign: { select: { id: true, name: true } },
          code: { select: { id: true, code: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limitNum,
        skip: offset,
      })

      const commissionCount = await prisma.partnershipCommission.count({
        where: {
          ...(partnershipId ? { partnershipId: partnershipId as string } : {}),
          ...(status ? { status: status as any } : {}),
          ...(type ? { type: type as any } : {}),
          ...dateFilter,
        },
      })

      // ─── Payout Batches ───────────────────────────────────────────
      const payouts = await prisma.partnershipPayout.findMany({
        where: {
          ...(partnershipId ? { partnershipId: partnershipId as string } : {}),
        },
        include: {
          partnership: { select: { id: true, name: true, email: true, phone: true } },
          _count: { select: { commissions: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limitNum,
        skip: offset,
      })

      // ─── Revenue Ledger (FinancialLedgerEntry) ────────────────────
      const ledgerEntries = await prisma.financialLedgerEntry.findMany({
        where: {
          ...(dateFilter),
        },
        orderBy: { occurredAt: 'desc' },
        take: limitNum,
        skip: offset,
      })

      const ledgerCount = await prisma.financialLedgerEntry.count({
        where: { ...dateFilter },
      })

      // ─── Liability Aging ──────────────────────────────────────────
      const liabilityAging = await computeLiabilityAging()

      // ─── Forecast ─────────────────────────────────────────────────
      const forecast = computeForecast({
        currentMrrCents: mrrCents,
        lastMonthRevenueCents,
        monthlyTrend,
        totalLiabilityCents: totalLiability.totalLiabilityCents,
        pendingPayoutsCount: pendingPayouts.length,
      })

      // ─── Reconciliation ───────────────────────────────────────────
      const reconciliation = await computeReconciliation()

      // ─── Financial Timeline (events) ──────────────────────────────
      const financialEvents = await prisma.partnershipEvent.findMany({
        where: {
          type: {
            in: [
              'COMMISSION_ACCRUED', 'COMMISSION_VALIDATED', 'COMMISSION_APPROVED',
              'COMMISSION_PAID', 'COMMISSION_VOIDED', 'COMMISSION_CLAWED_BACK',
              'PAYOUT_REQUESTED', 'PAYOUT_PAID', 'PAYOUT_REJECTED',
            ],
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      })

      // ─── Audit Records ────────────────────────────────────────────
      const auditRecords = await prisma.partnershipAuditRecord.findMany({
        where: {
          action: {
            contains: 'COMMISSION',
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      })

      // ─── Exceptions ───────────────────────────────────────────────
      const exceptions = await computeExceptions({
        commissions,
        payouts,
        totalLiability: totalLiability.totalLiabilityCents,
        reconciliation,
      })

      return res.status(200).json({
        summary: {
          mrrCents,
          totalRevenueCents,
          totalCommissionAccruedCents: commissionSummary.totalLiabilityCents + commissionSummary.totalPaidCents,
          totalApprovedCents: commissionSummary.byStatus.find((s: any) => s.status === 'APPROVED')?.totalCents ?? 0,
          totalPaidCents: commissionSummary.totalPaidCents,
          outstandingLiabilityCents: totalLiability.totalLiabilityCents,
          pendingPayoutsCount: pendingPayouts.length,
          forecastNextMonthCents: forecast.nextMonthRevenue,
          avgRevenuePerPartnerCents: avgRevenuePerPartner,
          highestRevenuePartner: topRevenuePartners[0] ?? null,
          revenueTrend: monthlyTrend,
          activePartnerCount,
        },
        commissions: {
          items: commissions.map((c) => ({
            id: c.id,
            partnership: c.partnership,
            businessId: c.businessId,
            type: c.type,
            status: c.status,
            amountCents: c.amountCents,
            currency: c.currency,
            ratePercent: c.ratePercent,
            periodMonth: c.periodMonth,
            description: c.description,
            createdAt: c.createdAt,
            payout: c.payout,
            campaign: c.campaign,
            code: c.code,
            clawbackReason: c.clawbackReason,
            clawbackDate: c.clawbackDate,
          })),
          total: commissionCount,
          page: pageNum,
          limit: limitNum,
        },
        payouts: {
          items: payouts.map((p) => ({
            id: p.id,
            partnership: p.partnership,
            amountCents: p.amountCents,
            currency: p.currency,
            method: p.method,
            status: p.status,
            createdAt: p.createdAt,
            approvedAt: p.approvedAt,
            paidAt: p.paidAt,
            referenceId: p.referenceId,
            recipientPhone: p.recipientPhone,
            commissionCount: p._count?.commissions ?? 0,
          })),
          total: payouts.length,
        },
        ledger: {
          items: ledgerEntries,
          total: ledgerCount,
          page: pageNum,
          limit: limitNum,
        },
        liability: {
          totalCents: totalLiability.totalLiabilityCents,
          commissionCount: totalLiability.totalCommissionCount,
          topLiabilities: totalLiability.topLiabilities,
          aging: liabilityAging,
        },
        forecast,
        reconciliation,
        timeline: financialEvents.map((e) => ({
          id: e.id,
          type: e.type,
          timestamp: e.createdAt,
          triggeredBy: e.triggeredBy,
          payload: e.payload,
        })),
        audit: auditRecords,
        exceptions,
        monthEndSummary,
        canManage,
      })
    } catch (error: any) {
      console.error('Revenue operations load error:', error)
      return res.status(500).json({ error: error.message || 'Internal server error' })
    }
  }

  // ─── PATCH: Perform financial actions ────────────────────────────
  if (req.method === 'PATCH') {
    if (!canManage) {
      return res.status(403).json({ error: 'Insufficient permissions to manage financial operations' })
    }

    try {
      const { action } = req.body

      switch (action) {
        // ─── Commission Actions ─────────────────────────────────────
        case 'validateCommission': {
          const { commissionId } = req.body
          if (!commissionId) return res.status(400).json({ error: 'Commission ID is required' })
          const result = await PartnershipCommissionService.validate(commissionId, userId)
          return res.status(200).json({ commission: result })
        }
        case 'approveCommission': {
          const { commissionId } = req.body
          if (!commissionId) return res.status(400).json({ error: 'Commission ID is required' })
          const result = await PartnershipCommissionService.approve(commissionId, userId)
          return res.status(200).json({ commission: result })
        }
        case 'adjustCommission': {
          const { commissionId, newAmountCents, reason } = req.body
          if (!commissionId) return res.status(400).json({ error: 'Commission ID is required' })
          if (!newAmountCents || newAmountCents <= 0) return res.status(400).json({ error: 'Valid amount is required' })
          if (!reason) return res.status(400).json({ error: 'Reason is required for adjustments' })
          const result = await PartnershipCommissionService.adjust(commissionId, parseInt(newAmountCents, 10), userId, reason)
          return res.status(200).json({ commission: result })
        }
        case 'voidCommission': {
          const { commissionId, reason } = req.body
          if (!commissionId) return res.status(400).json({ error: 'Commission ID is required' })
          if (!reason) return res.status(400).json({ error: 'Reason is required for voiding' })
          const result = await PartnershipCommissionService.void(commissionId, userId, reason)
          return res.status(200).json({ commission: result })
        }
        case 'clawbackCommission': {
          const { commissionId, reason } = req.body
          if (!commissionId) return res.status(400).json({ error: 'Commission ID is required' })
          if (!reason) return res.status(400).json({ error: 'Reason is required for clawback' })
          const result = await PartnershipCommissionService.clawback(commissionId, userId, reason)
          return res.status(200).json({ commission: result })
        }

        // ─── Payout Actions ─────────────────────────────────────────
        case 'createPayout': {
          const { partnershipId, amountCents, method, recipientPhone, recipientBank, recipientAccount } = req.body
          if (!partnershipId) return res.status(400).json({ error: 'Partnership ID is required' })
          if (!amountCents || amountCents <= 0) return res.status(400).json({ error: 'Valid amount is required' })
          if (!method) return res.status(400).json({ error: 'Payout method is required' })
          const result = await PartnershipPayoutService.create({
            partnershipId,
            amountCents: parseInt(amountCents, 10),
            method,
            recipientPhone,
            recipientBank,
            recipientAccount,
            createdBy: userId,
          })
          return res.status(200).json({ payout: result })
        }
        case 'approvePayout': {
          const { payoutId } = req.body
          if (!payoutId) return res.status(400).json({ error: 'Payout ID is required' })
          const result = await PartnershipPayoutService.approve(payoutId, userId)
          return res.status(200).json({ payout: result })
        }
        case 'processPayout': {
          const { payoutId } = req.body
          if (!payoutId) return res.status(400).json({ error: 'Payout ID is required' })
          const result = await PartnershipPayoutService.process(payoutId, userId)
          return res.status(200).json({ payout: result })
        }
        case 'markPayoutPaid': {
          const { payoutId, referenceId, providerResponse } = req.body
          if (!payoutId) return res.status(400).json({ error: 'Payout ID is required' })
          const result = await PartnershipPayoutService.markPaid(payoutId, userId, referenceId, providerResponse)
          return res.status(200).json({ payout: result })
        }
        case 'markPayoutFailed': {
          const { payoutId, failureReason } = req.body
          if (!payoutId) return res.status(400).json({ error: 'Payout ID is required' })
          const result = await PartnershipPayoutService.markFailed(payoutId, userId, failureReason)
          return res.status(200).json({ payout: result })
        }
        case 'rejectPayout': {
          const { payoutId, reason } = req.body
          if (!payoutId) return res.status(400).json({ error: 'Payout ID is required' })
          if (!reason) return res.status(400).json({ error: 'Reason is required for rejection' })
          const result = await PartnershipPayoutService.reject(payoutId, userId, reason)
          return res.status(200).json({ payout: result })
        }
        case 'retryFailedPayout': {
          const { payoutId } = req.body
          if (!payoutId) return res.status(400).json({ error: 'Payout ID is required' })
          const payout = await prisma.partnershipPayout.findUnique({ where: { id: payoutId } })
          if (!payout) return res.status(404).json({ error: 'Payout not found' })
          if (payout.status !== 'FAILED') return res.status(400).json({ error: 'Only FAILED payouts can be retried' })
          // Reset to PENDING for reprocessing
          const result = await prisma.partnershipPayout.update({
            where: { id: payoutId },
            data: { status: 'PENDING', failedAt: null, providerResponse: null },
          })
          return res.status(200).json({ payout: result })
        }

        default:
          return res.status(400).json({ error: `Unknown action: ${action}` })
      }
    } catch (error: any) {
      console.error('Revenue action error:', error)
      return res.status(500).json({ error: error.message || 'Internal server error' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

// ─── Monthly Trend Computation ────────────────────────────────────────
function computeMonthlyTrend(entries: Array<{ amountCents: number; occurredAt: Date }>) {
  const months: Record<string, number> = {}
  for (const entry of entries) {
    const d = entry.occurredAt
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    months[key] = (months[key] ?? 0) + entry.amountCents
  }
  return Object.entries(months)
    .map(([month, revenue]) => ({ month, revenueCents: revenue }))
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-6)
}

// ─── Liability Aging Buckets ──────────────────────────────────────────
async function computeLiabilityAging() {
  const now = new Date()
  const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const d60 = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
  const d90 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

  const [b0_30, b31_60, b61_90, b90plus] = await Promise.all([
    prisma.partnershipCommission.aggregate({
      where: { status: { in: ['PENDING', 'VALIDATED', 'APPROVED'] }, createdAt: { gte: d30 } },
      _sum: { amountCents: true }, _count: true,
    }),
    prisma.partnershipCommission.aggregate({
      where: { status: { in: ['PENDING', 'VALIDATED', 'APPROVED'] }, createdAt: { gte: d60, lt: d30 } },
      _sum: { amountCents: true }, _count: true,
    }),
    prisma.partnershipCommission.aggregate({
      where: { status: { in: ['PENDING', 'VALIDATED', 'APPROVED'] }, createdAt: { gte: d90, lt: d60 } },
      _sum: { amountCents: true }, _count: true,
    }),
    prisma.partnershipCommission.aggregate({
      where: { status: { in: ['PENDING', 'VALIDATED', 'APPROVED'] }, createdAt: { lt: d90 } },
      _sum: { amountCents: true }, _count: true,
    }),
  ])

  return [
    { bucket: '0-30 Days', totalCents: b0_30._sum.amountCents ?? 0, count: b0_30._count },
    { bucket: '31-60 Days', totalCents: b31_60._sum.amountCents ?? 0, count: b31_60._count },
    { bucket: '61-90 Days', totalCents: b61_90._sum.amountCents ?? 0, count: b61_90._count },
    { bucket: '90+ Days', totalCents: b90plus._sum.amountCents ?? 0, count: b90plus._count },
  ]
}

// ─── Forecast Computation ─────────────────────────────────────────────
function computeForecast(params: {
  currentMrrCents: number
  lastMonthRevenueCents: number
  monthlyTrend: Array<{ month: string; revenueCents: number }>
  totalLiabilityCents: number
  pendingPayoutsCount: number
}) {
  const { currentMrrCents, lastMonthRevenueCents, monthlyTrend, totalLiabilityCents, pendingPayoutsCount } = params

  // Simple linear projection from trend
  const trendValues = monthlyTrend.map((t) => t.revenueCents)
  const avgGrowth = trendValues.length >= 2
    ? (trendValues[trendValues.length - 1] - trendValues[0]) / (trendValues.length - 1)
    : 0

  const nextMonthRevenue = Math.round(currentMrrCents + avgGrowth)
  const nextMonthCommission = Math.round(nextMonthRevenue * 0.1) // estimated 10% commission rate
  const expectedPayoutVolume = Math.round(totalLiabilityCents * 0.7) // 70% of liability expected to be paid

  // Confidence based on trend consistency
  const variance = trendValues.length >= 2
    ? Math.sqrt(
        trendValues.reduce((sum, v) => sum + Math.pow(v - (trendValues.reduce((s, x) => s + x, 0) / trendValues.length), 2), 0) / trendValues.length,
      )
    : 0
  const meanRevenue = trendValues.length > 0 ? trendValues.reduce((s, x) => s + x, 0) / trendValues.length : 0
  const confidenceLevel = meanRevenue > 0
    ? variance / meanRevenue < 0.2 ? 'HIGH' : variance / meanRevenue < 0.4 ? 'MEDIUM' : 'LOW'
    : 'LOW'

  return {
    nextMonthRevenue,
    nextMonthCommission,
    expectedPayoutVolume,
    projectedPartnerGrowth: Math.round(avgGrowth / (meanRevenue || 1) * 100),
    recurringRevenueTrend: avgGrowth > 0 ? 'GROWING' : avgGrowth < 0 ? 'DECLINING' : 'STABLE',
    confidenceLevel,
    actual: {
      currentMrrCents,
      lastMonthRevenueCents,
    },
    projected: {
      nextMonthRevenueCents: nextMonthRevenue,
      nextMonthCommissionCents: nextMonthCommission,
      expectedPayoutVolumeCents: expectedPayoutVolume,
    },
  }
}

// ─── Reconciliation Computation ───────────────────────────────────────
async function computeReconciliation() {
  const [
    totalRevenue,
    totalCommissionsPaid,
    totalPayoutsPaid,
    approvedUnpaidCommissions,
    voidedCommissions,
    clawedBackCommissions,
    duplicatePayouts,
  ] = await Promise.all([
    prisma.financialLedgerEntry.aggregate({
      where: { domain: 'SUBSCRIPTION', eventType: { in: ['PAYMENT_SUCCESS', 'SUBSCRIPTION_CHARGE'] } },
      _sum: { amountCents: true },
    }),
    prisma.partnershipCommission.aggregate({
      where: { status: 'PAID' },
      _sum: { amountCents: true }, _count: true,
    }),
    prisma.partnershipPayout.aggregate({
      where: { status: 'PAID' },
      _sum: { amountCents: true }, _count: true,
    }),
    prisma.partnershipCommission.count({
      where: { status: 'APPROVED' },
    }),
    prisma.partnershipCommission.count({
      where: { status: 'VOID' },
    }),
    prisma.partnershipCommission.count({
      where: { status: 'CLAWED_BACK' },
    }),
    prisma.partnershipPayout.findMany({
      where: { status: 'PAID' },
      select: { id: true, partnershipId: true, amountCents: true },
      take: 500,
    }),
  ])

  const mismatches: Array<{ type: string; severity: 'warning' | 'error'; description: string; recommendation: string }> = []

  // Check: Unpaid approved commissions
  if (approvedUnpaidCommissions > 0) {
    mismatches.push({
      type: 'UNPAID_APPROVED_COMMISSIONS',
      severity: 'warning',
      description: `${approvedUnpaidCommissions} approved commissions have not been paid yet.`,
      recommendation: 'Create a payout batch to disburse approved commissions.',
    })
  }

  // Check: Commission vs payout mismatch
  const commissionsPaidTotal = totalCommissionsPaid._sum.amountCents ?? 0
  const payoutsPaidTotal = totalPayoutsPaid._sum.amountCents ?? 0
  if (Math.abs(commissionsPaidTotal - payoutsPaidTotal) > 100) { // > 1 RWF difference
    mismatches.push({
      type: 'COMMISSION_PAYOUT_MISMATCH',
      severity: 'warning',
      description: `Commission paid total (${commissionsPaidTotal}) differs from payout total (${payoutsPaidTotal}) by ${Math.abs(commissionsPaidTotal - payoutsPaidTotal)} cents.`,
      recommendation: 'Review payout batches for missing or extra commissions.',
    })
  }

  // Check: Duplicate payouts (same partnership + amount)
  const payoutKeys = new Map<string, number>()
  for (const p of duplicatePayouts as any[]) {
    const key = `${p.partnershipId}-${p.amountCents}`
    payoutKeys.set(key, (payoutKeys.get(key) ?? 0) + 1)
  }
  const duplicateCount = Array.from(payoutKeys.values()).filter((c) => c > 1).length
  if (duplicateCount > 0) {
    mismatches.push({
      type: 'DUPLICATE_PAYOUTS',
      severity: 'error',
      description: `${duplicateCount} potential duplicate payout(s) detected (same partnership + amount).`,
      recommendation: 'Review and void duplicate payouts immediately.',
    })
  }

  // Check: Voided commissions
  if (voidedCommissions > 0) {
    mismatches.push({
      type: 'VOIDED_COMMISSIONS',
      severity: 'warning',
      description: `${voidedCommissions} voided commission(s) in the system.`,
      recommendation: 'Review voided commissions for audit trail completeness.',
    })
  }

  // Check: Clawed back commissions
  if (clawedBackCommissions > 0) {
    mismatches.push({
      type: 'CLAWED_BACK_COMMISSIONS',
      severity: 'warning',
      description: `${clawedBackCommissions} clawed back commission(s) in the system.`,
      recommendation: 'Review clawback reasons and ensure recovery actions are complete.',
    })
  }

  return {
    revenue: { totalCents: totalRevenue._sum.amountCents ?? 0 },
    commissionsPaid: { totalCents: commissionsPaidTotal, count: totalCommissionsPaid._count },
    payoutsPaid: { totalCents: payoutsPaidTotal, count: totalPayoutsPaid._count },
    approvedUnpaid: approvedUnpaidCommissions,
    voided: voidedCommissions,
    clawedBack: clawedBackCommissions,
    balance: commissionsPaidTotal - payoutsPaidTotal,
    mismatches,
    status: mismatches.some((m) => m.severity === 'error') ? 'ERRORS' : mismatches.length > 0 ? 'WARNINGS' : 'CLEAN',
  }
}

// ─── Exception Detection ──────────────────────────────────────────────
async function computeExceptions(params: {
  commissions: any[]
  payouts: any[]
  totalLiability: number
  reconciliation: any
}) {
  const exceptions: Array<{
    key: string
    type: 'warning' | 'error' | 'info'
    title: string
    description: string
    action?: string
  }> = []

  // Commission stuck in PENDING for too long
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const stuckPending = params.commissions.filter(
    (c) => c.status === 'PENDING' && new Date(c.createdAt) < sevenDaysAgo,
  )
  if (stuckPending.length > 0) {
    exceptions.push({
      key: 'stuck-pending',
      type: 'warning',
      title: 'Commissions Stuck in Pending',
      description: `${stuckPending.length} commission(s) have been in PENDING status for 7+ days. Validation needed.`,
      action: 'validateCommission',
    })
  }

  // Failed payouts
  const failedPayouts = params.payouts.filter((p) => p.status === 'FAILED')
  if (failedPayouts.length > 0) {
    exceptions.push({
      key: 'failed-payouts',
      type: 'error',
      title: 'Failed Payouts',
      description: `${failedPayouts.length} payout(s) have failed. Retry or reject them.`,
      action: 'retryFailedPayout',
    })
  }

  // High liability
  if (params.totalLiability > 10000000) { // > 100,000 RWF
    exceptions.push({
      key: 'high-liability',
      type: 'warning',
      title: 'High Outstanding Liability',
      description: `Outstanding commission liability is ${(params.totalLiability / 100).toLocaleString()} RWF. Consider processing payouts.`,
    })
  }

  // Reconciliation errors
  const reconErrors = params.reconciliation.mismatches.filter((m: any) => m.severity === 'error')
  for (const err of reconErrors) {
    exceptions.push({
      key: `recon-${err.type}`,
      type: 'error',
      title: err.type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase()),
      description: err.description,
    })
  }

  // Reconciliation warnings
  const reconWarnings = params.reconciliation.mismatches.filter((m: any) => m.severity === 'warning')
  for (const warn of reconWarnings) {
    exceptions.push({
      key: `recon-${warn.type}`,
      type: 'warning',
      title: warn.type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase()),
      description: warn.description,
    })
  }

  // Large manual adjustments (from audit records)
  const largeAdjustments = await prisma.partnershipAuditRecord.findMany({
    where: {
      action: 'COMMISSION_ADJUSTED',
      createdAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
    },
    take: 20,
  })
  const significantAdjustments = largeAdjustments.filter((a) => {
    const metadata = a.metadata as any
    if (!metadata?.oldAmountCents || !metadata?.newAmountCents) return false
    return Math.abs(metadata.newAmountCents - metadata.oldAmountCents) > 50000 // > 500 RWF
  })
  if (significantAdjustments.length > 0) {
    exceptions.push({
      key: 'large-adjustments',
      type: 'info',
      title: 'Large Manual Adjustments',
      description: `${significantAdjustments.length} large commission adjustment(s) in the past 7 days. Review for audit.`,
    })
  }

  // Repeated clawbacks
  const recentClawbacks = await prisma.partnershipCommission.count({
    where: {
      status: 'CLAWED_BACK',
      clawbackDate: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
    },
  })
  if (recentClawbacks >= 3) {
    exceptions.push({
      key: 'repeated-clawbacks',
      type: 'warning',
      title: 'Repeated Clawbacks',
      description: `${recentClawbacks} clawback(s) in the past 30 days. Investigate pattern.`,
    })
  }

  return exceptions
}

export default withRateLimit(handler, { windowMs: 60000, maxRequests: 100 })
