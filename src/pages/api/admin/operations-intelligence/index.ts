import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { PartnershipOperationalQueryService } from '@/lib/services/partnership-operational-query.service'
import { PartnershipCommissionService } from '@/lib/services/partnership-commission.service'
import { PartnershipPayoutService } from '@/lib/services/partnership-payout.service'
import { withRateLimit } from '@/lib/middleware/withRateLimit'

const ALLOWED_ROLES = [
  'ADMIN', 'FINANCE', 'CFO', 'PARTNERSHIP_MANAGER', 'OPERATIONS_MANAGER',
  'CEO', 'SUPPORT', 'LEGAL', 'EXECUTIVE', 'MARKETING', 'SALES',
]
const ACTION_ROLES = ['ADMIN', 'FINANCE', 'CFO', 'OPERATIONS_MANAGER', 'SUPPORT']

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session?.user?.email) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user?.roles?.some((r: string) => ALLOWED_ROLES.includes(r))) {
    return res.status(403).json({ error: 'Insufficient permissions' })
  }

  const canResolve = user.roles?.some((r: string) => ACTION_ROLES.includes(r))
  const userId = user.id

  // ─── GET: Load operations intelligence state ─────────────────────
  if (req.method === 'GET') {
    try {
      const {
        query: searchQuery,
        entityType,
        entityId,
        page = '1',
        limit = '50',
        startDate,
        endDate,
      } = req.query

      const pageNum = parseInt(page as string, 10) || 1
      const limitNum = Math.min(parseInt(limit as string, 10) || 50, 200)
      const offset = (pageNum - 1) * limitNum

      const dateFilter = startDate && endDate
        ? { createdAt: { gte: new Date(startDate as string), lte: new Date(endDate as string) } }
        : {}

      // ─── Universal Investigation Search ────────────────────────────
      let searchResults: any = null
      if (searchQuery && typeof searchQuery === 'string' && searchQuery.trim().length >= 2) {
        searchResults = await performUniversalSearch(searchQuery.trim(), limitNum)
      }

      // ─── Operations Timeline ──────────────────────────────────────
      const timeline = await prisma.partnershipEvent.findMany({
        where: {
          ...dateFilter,
          ...(entityType && entityId
            ? { entityType: entityType as string, entityId: entityId as string }
            : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: limitNum,
        skip: offset,
      })

      const timelineCount = await prisma.partnershipEvent.count({
        where: {
          ...dateFilter,
          ...(entityType && entityId
            ? { entityType: entityType as string, entityId: entityId as string }
            : {}),
        },
      })

      // ─── Attribution Explorer ──────────────────────────────────────
      const attributions = await prisma.partnershipAttribution.findMany({
        take: limitNum,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: {
          partnership: { select: { id: true, name: true, partnerType: true, status: true } },
          code: { select: { id: true, code: true, status: true, trialDays: true } },
        },
      })

      // ─── Campaign Intelligence ────────────────────────────────────
      const campaigns = await prisma.partnershipCampaign.findMany({
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          partnership: { select: { id: true, name: true, partnerType: true } },
          _count: { select: { codes: true, commissions: true } },
        },
      })

      // ─── Audit Center ─────────────────────────────────────────────
      const auditRecords = await prisma.partnershipAuditRecord.findMany({
        orderBy: { createdAt: 'desc' },
        take: limitNum,
        skip: offset,
      })

      const auditCount = await prisma.partnershipAuditRecord.count()

      // ─── Exception Investigation ──────────────────────────────────
      const exceptions = await detectExceptions()

      // ─── System Health Signals ────────────────────────────────────
      const health = await computeSystemHealth()

      // ─── Financial Trace (if entityId provided) ───────────────────
      let financialTrace: any = null
      if (entityId && typeof entityId === 'string') {
        financialTrace = await buildFinancialTrace(entityId as string)
      }

      // ─── Customer Journey (if entityId is a businessId) ───────────
      let customerJourney: any = null
      if (entityId && typeof entityId === 'string') {
        customerJourney = await buildCustomerJourney(entityId as string)
      }

      return res.status(200).json({
        searchResults,
        timeline: {
          items: timeline.map((e) => ({
            id: e.id,
            type: e.type,
            entityType: e.entityType,
            entityId: e.entityId,
            timestamp: e.createdAt,
            triggeredBy: e.triggeredBy,
            payload: e.payload,
          })),
          total: timelineCount,
          page: pageNum,
          limit: limitNum,
        },
        attributions: attributions.map((a) => ({
          id: a.id,
          partnership: a.partnership,
          businessId: a.businessId,
          code: a.code,
          sourceType: a.sourceType,
          touchType: a.touchType,
          isCanonical: a.isCanonical,
          sourceCode: a.sourceCode,
          utmSource: a.utmSource,
          utmMedium: a.utmMedium,
          utmCampaign: a.utmCampaign,
          ipAddress: a.ipAddress,
          trialDaysOverride: a.trialDaysOverride,
          createdAt: a.createdAt,
        })),
        campaigns: campaigns.map((c) => ({
          id: c.id,
          name: c.name,
          partnership: c.partnership,
          channel: c.channel,
          status: c.status,
          startDate: c.startDate,
          endDate: c.endDate,
          targetSignups: c.targetSignups,
          targetConversions: c.targetConversions,
          actualSignups: c.actualSignups,
          actualConversions: c.actualConversions,
          actualRevenueCents: c.actualRevenueCents,
          budgetCents: c.budgetCents,
          codeCount: c._count?.codes ?? 0,
          commissionCount: c._count?.commissions ?? 0,
          conversionRate: c.actualSignups > 0 ? (c.actualConversions / c.actualSignups) * 100 : 0,
          createdAt: c.createdAt,
        })),
        audit: {
          items: auditRecords,
          total: auditCount,
          page: pageNum,
          limit: limitNum,
        },
        exceptions,
        health,
        financialTrace,
        customerJourney,
        canResolve,
      })
    } catch (error: any) {
      console.error('Operations intelligence load error:', error)
      return res.status(500).json({ error: error.message || 'Internal server error' })
    }
  }

  // ─── PATCH: Resolution actions ────────────────────────────────────
  if (req.method === 'PATCH') {
    if (!canResolve) {
      return res.status(403).json({ error: 'Insufficient permissions to perform resolution actions' })
    }

    try {
      const { action } = req.body

      switch (action) {
        case 'approveCommission': {
          const { commissionId } = req.body
          if (!commissionId) return res.status(400).json({ error: 'Commission ID is required' })
          const result = await PartnershipCommissionService.approve(commissionId, userId)
          return res.status(200).json({ commission: result })
        }
        case 'validateCommission': {
          const { commissionId } = req.body
          if (!commissionId) return res.status(400).json({ error: 'Commission ID is required' })
          const result = await PartnershipCommissionService.validate(commissionId, userId)
          return res.status(200).json({ commission: result })
        }
        case 'triggerPayout': {
          const { partnershipId, amountCents, method, recipientPhone } = req.body
          if (!partnershipId) return res.status(400).json({ error: 'Partnership ID is required' })
          if (!amountCents || amountCents <= 0) return res.status(400).json({ error: 'Valid amount is required' })
          if (!method) return res.status(400).json({ error: 'Payout method is required' })
          const result = await PartnershipPayoutService.create({
            partnershipId,
            amountCents: parseInt(amountCents, 10),
            method,
            recipientPhone,
            createdBy: userId,
          })
          return res.status(200).json({ payout: result })
        }
        case 'pauseCampaign': {
          const { campaignId } = req.body
          if (!campaignId) return res.status(400).json({ error: 'Campaign ID is required' })
          const result = await prisma.partnershipCampaign.update({
            where: { id: campaignId },
            data: { status: 'PAUSED' },
          })
          return res.status(200).json({ campaign: result })
        }
        case 'resumeCampaign': {
          const { campaignId } = req.body
          if (!campaignId) return res.status(400).json({ error: 'Campaign ID is required' })
          const result = await prisma.partnershipCampaign.update({
            where: { id: campaignId },
            data: { status: 'ACTIVE' },
          })
          return res.status(200).json({ campaign: result })
        }
        case 'extendTrial': {
          const { businessId, additionalDays } = req.body
          if (!businessId) return res.status(400).json({ error: 'Business ID is required' })
          if (!additionalDays || additionalDays <= 0) return res.status(400).json({ error: 'Valid days required' })
          const business = await prisma.business.findUnique({ where: { id: businessId } })
          if (!business) return res.status(404).json({ error: 'Business not found' })
          const currentTrialEnd = business.trialEndDate ?? new Date()
          const newTrialEnd = new Date(currentTrialEnd.getTime() + additionalDays * 24 * 60 * 60 * 1000)
          const result = await prisma.business.update({
            where: { id: businessId },
            data: { trialEndDate: newTrialEnd },
          })
          return res.status(200).json({ business: result })
        }
        case 'addInternalNote': {
          const { partnershipId, note } = req.body
          if (!partnershipId) return res.status(400).json({ error: 'Partnership ID is required' })
          if (!note) return res.status(400).json({ error: 'Note is required' })
          const result = await prisma.partnershipActivityLog.create({
            data: {
              partnershipId,
              type: 'INTERNAL_NOTE',
              description: note,
              metadata: { addedBy: userId, addedAt: new Date().toISOString() },
            },
          })
          return res.status(200).json({ activity: result })
        }
        case 'assignInvestigation': {
          const { partnershipId, assignedTo, reason } = req.body
          if (!partnershipId) return res.status(400).json({ error: 'Partnership ID is required' })
          if (!assignedTo) return res.status(400).json({ error: 'Assignee is required' })
          const result = await prisma.partnershipActivityLog.create({
            data: {
              partnershipId,
              type: 'INVESTIGATION_ASSIGNED',
              description: `Investigation assigned: ${reason ?? 'No reason provided'}`,
              metadata: { assignedTo, assignedBy: userId, reason },
            },
          })
          return res.status(200).json({ activity: result })
        }

        default:
          return res.status(400).json({ error: `Unknown action: ${action}` })
      }
    } catch (error: any) {
      console.error('Resolution action error:', error)
      return res.status(500).json({ error: error.message || 'Internal server error' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

// ─── Universal Search ─────────────────────────────────────────────────
async function performUniversalSearch(query: string, limit: number) {
  const results: Array<{
    type: string
    id: string
    title: string
    subtitle: string
    status?: string
    link: string
  }> = []

  const q = query.toLowerCase()

  // Search partnerships
  const partnerships = await prisma.partnership.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
        { id: query },
      ],
    },
    take: 10,
    select: { id: true, name: true, email: true, phone: true, partnerType: true, status: true, region: true },
  })
  for (const p of partnerships) {
    results.push({
      type: 'partnership',
      id: p.id,
      title: p.name,
      subtitle: `${p.partnerType} · ${p.email}`,
      status: p.status,
      link: `/admin/founder-partners?id=${p.id}`,
    })
  }

  // Search businesses
  const businesses = await prisma.business.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
        { id: query },
      ],
    },
    take: 10,
    select: { id: true, name: true, phone: true, city: true, approvalStatus: true, trialEndDate: true },
  })
  for (const b of businesses) {
    results.push({
      type: 'business',
      id: b.id,
      title: b.name,
      subtitle: `${b.city} · ${b.phone}`,
      status: b.approvalStatus,
      link: `/admin/restaurants?id=${b.id}`,
    })
  }

  // Search codes
  const codes = await prisma.partnershipCode.findMany({
    where: {
      OR: [
        { code: { contains: q, mode: 'insensitive' } },
        { id: query },
      ],
    },
    take: 10,
    include: {
      partnership: { select: { id: true, name: true } },
    },
  })
  for (const c of codes) {
    results.push({
      type: 'code',
      id: c.id,
      title: c.code,
      subtitle: `Partner: ${c.partnership.name} · Trial: ${c.trialDays}d`,
      status: c.status,
      link: `/admin/founder-codes?code=${c.code}`,
    })
  }

  // Search campaigns
  const campaigns = await prisma.partnershipCampaign.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { id: query },
      ],
    },
    take: 10,
    include: { partnership: { select: { id: true, name: true } } },
  })
  for (const c of campaigns) {
    results.push({
      type: 'campaign',
      id: c.id,
      title: c.name,
      subtitle: `Partner: ${c.partnership.name} · Channel: ${c.channel ?? '—'}`,
      status: c.status,
      link: `/admin/founder-partners?campaign=${c.id}`,
    })
  }

  // Search commissions
  if (query.match(/^[a-z0-9]{20,}$/i)) {
    const commission = await prisma.partnershipCommission.findUnique({
      where: { id: query },
      include: { partnership: { select: { id: true, name: true } } },
    })
    if (commission) {
      results.push({
        type: 'commission',
        id: commission.id,
        title: `Commission ${(commission.amountCents / 100).toLocaleString()} RWF`,
        subtitle: `Partner: ${commission.partnership.name} · ${commission.status}`,
        status: commission.status,
        link: `/admin/revenue-operations?commission=${commission.id}`,
      })
    }
  }

  // Search payouts
  if (query.match(/^[a-z0-9]{20,}$/i)) {
    const payout = await prisma.partnershipPayout.findUnique({
      where: { id: query },
      include: { partnership: { select: { id: true, name: true } } },
    })
    if (payout) {
      results.push({
        type: 'payout',
        id: payout.id,
        title: `Payout ${(payout.amountCents / 100).toLocaleString()} RWF`,
        subtitle: `Partner: ${payout.partnership.name} · ${payout.status}`,
        status: payout.status,
        link: `/admin/revenue-operations?payout=${payout.id}`,
      })
    }
  }

  // Search applications (email/phone are on Partnership, not PartnershipApplication)
  const applications = await prisma.partnershipApplication.findMany({
    where: {
      OR: [
        { id: query },
        { partnership: { email: { contains: q, mode: 'insensitive' } } },
        { partnership: { phone: { contains: q, mode: 'insensitive' } } },
      ],
    },
    take: 5,
    include: { partnership: { select: { id: true, name: true, email: true, phone: true } } },
  })
  for (const a of applications) {
    results.push({
      type: 'application',
      id: a.id,
      title: a.partnership?.name ?? 'Unknown',
      subtitle: `Application · ${a.partnership?.email ?? '—'} · ${a.partnership?.phone ?? '—'}`,
      status: a.status,
      link: `/admin/partnership-applications?id=${a.id}`,
    })
  }

  // Search agreements
  const agreements = await prisma.partnershipAgreement.findMany({
    where: { id: query },
    take: 5,
    include: { partnership: { select: { id: true, name: true } } },
  })
  for (const a of agreements) {
    results.push({
      type: 'agreement',
      id: a.id,
      title: `Agreement v${a.version}`,
      subtitle: `Partner: ${a.partnership.name} · ${a.status}`,
      status: a.status,
      link: `/admin/founder-partners?agreement=${a.id}`,
    })
  }

  return {
    query,
    results: results.slice(0, limit),
    total: results.length,
  }
}

// ─── Financial Trace ──────────────────────────────────────────────────
async function buildFinancialTrace(entityId: string) {
  // Try as businessId first, then partnershipId
  const [ledgerEntries, commissions, payouts] = await Promise.all([
    prisma.financialLedgerEntry.findMany({
      where: { businessId: entityId },
      orderBy: { occurredAt: 'desc' },
      take: 50,
    }),
    prisma.partnershipCommission.findMany({
      where: {
        OR: [
          { businessId: entityId },
          { partnershipId: entityId },
        ],
      },
      include: {
        partnership: { select: { id: true, name: true } },
        payout: { select: { id: true, status: true, paidAt: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.partnershipPayout.findMany({
      where: { partnershipId: entityId },
      include: {
        partnership: { select: { id: true, name: true } },
        _count: { select: { commissions: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
  ])

  // Audit records for this entity
  const auditRecords = await prisma.partnershipAuditRecord.findMany({
    where: { partnershipId: entityId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  return {
    ledger: ledgerEntries.map((e) => ({
      id: e.id,
      eventType: e.eventType,
      domain: e.domain,
      amountCents: e.amountCents,
      currency: e.currency,
      netAmountCents: e.netAmountCents,
      gateway: e.gateway,
      invoiceNumber: e.invoiceNumber,
      occurredAt: e.occurredAt,
    })),
    commissions: commissions.map((c) => ({
      id: c.id,
      partnership: c.partnership,
      type: c.type,
      status: c.status,
      amountCents: c.amountCents,
      currency: c.currency,
      ratePercent: c.ratePercent,
      createdAt: c.createdAt,
      payout: c.payout,
    })),
    payouts: payouts.map((p) => ({
      id: p.id,
      partnership: p.partnership,
      amountCents: p.amountCents,
      currency: p.currency,
      method: p.method,
      status: p.status,
      createdAt: p.createdAt,
      paidAt: p.paidAt,
      commissionCount: p._count?.commissions ?? 0,
    })),
    audit: auditRecords,
  }
}

// ─── Customer Journey ─────────────────────────────────────────────────
async function buildCustomerJourney(businessId: string) {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      id: true, name: true, phone: true, city: true,
      approvalStatus: true, trialStartDate: true, trialEndDate: true,
      createdAt: true, isActive: true, ownerId: true,
    },
  })

  if (!business) return null

  const [attribution, redemptions, subscriptions, ledgerEntries, commissions, events] = await Promise.all([
    // Attribution
    prisma.acquisitionAttribution.findUnique({ where: { businessId } }),
    // Code redemptions
    prisma.partnershipCodeRedemption.findMany({
      where: { businessId },
      include: { code: { select: { id: true, code: true, trialDays: true, status: true } } },
      orderBy: { createdAt: 'asc' },
      take: 50,
    }),
    // Subscriptions
    prisma.subscription.findMany({
      where: { businessId },
      orderBy: { createdAt: 'asc' },
      take: 10,
    }),
    // Revenue from ledger
    prisma.financialLedgerEntry.findMany({
      where: { businessId },
      orderBy: { occurredAt: 'desc' },
      take: 20,
      select: { id: true, eventType: true, amountCents: true, currency: true, occurredAt: true, status: true },
    }),
    // Commissions for this business
    prisma.partnershipCommission.findMany({
      where: { businessId },
      include: { partnership: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'asc' },
      take: 20,
    }),
    // Events for this business
    prisma.partnershipEvent.findMany({
      where: { entityType: 'business', entityId: businessId },
      orderBy: { createdAt: 'asc' },
      take: 50,
    }),
  ])

  // Build journey steps
  const steps: Array<{ step: string; timestamp: string | null; status: string; details?: any }> = []

  steps.push({ step: 'Signup', timestamp: business.createdAt.toISOString(), status: 'Completed', details: { name: business.name, phone: business.phone, city: business.city } })

  if (attribution) {
    steps.push({
      step: 'Attribution',
      timestamp: attribution.createdAt.toISOString(),
      status: String(attribution.status),
      details: { sourceType: attribution.sourceType, sourceCode: attribution.sourceCode, trialDaysOverride: attribution.trialDaysOverride },
    })
  }

  for (const r of redemptions) {
    steps.push({
      step: 'Code Redemption',
      timestamp: r.createdAt.toISOString(),
      status: 'Completed',
      details: { code: r.code.code, trialDaysGranted: r.trialDaysGranted },
    })
  }

  if (business.trialStartDate) {
    steps.push({ step: 'Trial Started', timestamp: business.trialStartDate.toISOString(), status: 'Active', details: { trialEndDate: business.trialEndDate?.toISOString() } })
  }
  if (business.trialEndDate && new Date(business.trialEndDate) < new Date()) {
    steps.push({ step: 'Trial Expired', timestamp: business.trialEndDate.toISOString(), status: 'Completed' })
  }

  steps.push({ step: 'Approval', timestamp: null, status: business.approvalStatus, details: { isActive: business.isActive } })

  for (const sub of subscriptions) {
    steps.push({
      step: 'Subscription',
      timestamp: sub.createdAt.toISOString(),
      status: String(sub.status),
      details: { planId: sub.planId, amount: (sub as any).amountCents },
    })
  }

  if (ledgerEntries.length > 0) {
    const totalRevenue = ledgerEntries.reduce((sum, e) => sum + e.amountCents, 0)
    steps.push({
      step: 'Revenue',
      timestamp: ledgerEntries[0].occurredAt.toISOString(),
      status: `${ledgerEntries.length} entries`,
      details: { totalCents: totalRevenue },
    })
  }

  for (const c of commissions) {
    steps.push({
      step: 'Commission',
      timestamp: c.createdAt.toISOString(),
      status: String(c.status),
      details: { partnership: c.partnership.name, amountCents: c.amountCents, type: c.type },
    })
  }

  return {
    business,
    steps: steps.sort((a, b) => {
      if (!a.timestamp) return 1
      if (!b.timestamp) return -1
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    }),
    attribution,
    redemptions: redemptions.map((r) => ({ code: r.code.code, trialDaysGranted: r.trialDaysGranted, redeemedAt: r.createdAt })),
    subscriptions: subscriptions.map((s) => ({ id: s.id, status: s.status, createdAt: s.createdAt })),
    ledgerEntries,
    commissions: commissions.map((c) => ({ id: c.id, partnership: c.partnership.name, status: c.status, amountCents: c.amountCents, type: c.type })),
    events: events.map((e) => ({ type: e.type, timestamp: e.createdAt, triggeredBy: e.triggeredBy })),
  }
}

// ─── Exception Detection ──────────────────────────────────────────────
async function detectExceptions() {
  const exceptions: Array<{
    key: string
    type: 'warning' | 'error' | 'info'
    title: string
    description: string
    cause: string
    severity: 'low' | 'medium' | 'high'
    recommendation: string
    affectedEntities?: string[]
    action?: string
  }> = []

  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  // 1. Missing Attribution
  const businessesWithoutAttribution = await prisma.business.findMany({
    where: {
      createdAt: { gte: sevenDaysAgo },
      NOT: { acquisitionAttribution: {} },
    },
    take: 20,
    select: { id: true, name: true, createdAt: true },
  })
  if (businessesWithoutAttribution.length > 0) {
    exceptions.push({
      key: 'missing-attribution',
      type: 'warning',
      title: 'Missing Attribution',
      description: `${businessesWithoutAttribution.length} business(es) created in the last 7 days have no attribution record.`,
      cause: 'Attribution was not recorded during signup, possibly due to direct organic traffic or system error.',
      severity: 'medium',
      recommendation: 'Review these businesses and manually record attribution if a referral source is identified.',
      affectedEntities: businessesWithoutAttribution.map((b) => b.id),
    })
  }

  // 2. Duplicate Attribution
  const allAttributions = await prisma.partnershipAttribution.findMany({
    select: { id: true, businessId: true },
    take: 500,
  })
  const attrCounts = new Map<string, number>()
  for (const a of allAttributions) {
    attrCounts.set(a.businessId, (attrCounts.get(a.businessId) ?? 0) + 1)
  }
  const duplicateAttributions = Array.from(attrCounts.entries()).filter(([, c]) => c > 1)
  if (duplicateAttributions.length > 0) {
    exceptions.push({
      key: 'duplicate-attribution',
      type: 'error',
      title: 'Duplicate Attribution',
      description: `${duplicateAttributions.length} business(es) have multiple attribution records.`,
      cause: 'Multiple attribution touches were recorded for the same business, possibly due to multiple code redemptions.',
      severity: 'high',
      recommendation: 'Review and designate the correct canonical attribution.',
      affectedEntities: duplicateAttributions.map(([id]) => id),
    })
  }

  // 3. Expired Code Used
  const expiredCodeRedemptions = await prisma.partnershipCodeRedemption.findMany({
    where: {
      code: { status: 'EXPIRED' },
    },
    include: { code: { select: { code: true, expiresAt: true } } },
    take: 10,
    orderBy: { createdAt: 'desc' },
  })
  if (expiredCodeRedemptions.length > 0) {
    exceptions.push({
      key: 'expired-code-used',
      type: 'warning',
      title: 'Expired Code Used',
      description: `${expiredCodeRedemptions.length} redemption(s) found using expired codes.`,
      cause: 'Code was redeemed after its expiration date, possibly due to a race condition or manual override.',
      severity: 'medium',
      recommendation: 'Verify if the trial was correctly applied and consider revoking if unauthorized.',
      affectedEntities: expiredCodeRedemptions.map((r) => r.code.code),
    })
  }

  // 4. Missing Commission
  const businessesWithRevenue = await prisma.financialLedgerEntry.findMany({
    where: { eventType: { in: ['PAYMENT_SUCCESS', 'SUBSCRIPTION_CHARGE'] } },
    select: { businessId: true },
    distinct: ['businessId'],
    take: 100,
  })
  const businessIdsWithRevenue = businessesWithRevenue.map((b) => b.businessId)
  if (businessIdsWithRevenue.length > 0) {
    const businessesWithCommission = await prisma.partnershipCommission.findMany({
      where: { businessId: { in: businessIdsWithRevenue } },
      select: { businessId: true },
      distinct: ['businessId'],
    })
    const withCommissionSet = new Set(businessesWithCommission.map((c) => c.businessId))
    const missingCommission = businessIdsWithRevenue.filter((id) => !withCommissionSet.has(id))
    if (missingCommission.length > 0) {
      exceptions.push({
        key: 'missing-commission',
        type: 'error',
        title: 'Missing Commission',
        description: `${missingCommission.length} business(es) with revenue have no commission record.`,
        cause: 'Commission was not accrued for these businesses, possibly due to missing attribution or a service error.',
        severity: 'high',
        recommendation: 'Investigate attribution for these businesses and manually accrue commission if warranted.',
        affectedEntities: missingCommission.slice(0, 20),
      })
    }
  }

  // 5. Campaign Stalled
  const stalledCampaigns = await prisma.partnershipCampaign.findMany({
    where: {
      status: 'ACTIVE',
      updatedAt: { lt: sevenDaysAgo },
    },
    take: 10,
    select: { id: true, name: true, partnershipId: true, actualSignups: true, targetSignups: true },
  })
  if (stalledCampaigns.length > 0) {
    exceptions.push({
      key: 'campaign-stalled',
      type: 'warning',
      title: 'Campaign Stalled',
      description: `${stalledCampaigns.length} active campaign(s) have had no activity for 7+ days.`,
      cause: 'Campaign may have exhausted its distribution channels or the partner has stopped promoting.',
      severity: 'medium',
      recommendation: 'Contact the partner to discuss campaign performance or consider pausing.',
      affectedEntities: stalledCampaigns.map((c) => c.id),
      action: 'pauseCampaign',
    })
  }

  // 6. Inactive Partner
  const inactivePartners = await prisma.partnership.findMany({
    where: {
      status: 'ACTIVE',
      updatedAt: { lt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
    },
    take: 10,
    select: { id: true, name: true, email: true },
  })
  if (inactivePartners.length > 0) {
    exceptions.push({
      key: 'inactive-partner',
      type: 'info',
      title: 'Inactive Partner',
      description: `${inactivePartners.length} active partner(s) have had no activity for 30+ days.`,
      cause: 'Partner may have disengaged or lost interest.',
      severity: 'low',
      recommendation: 'Reach out to re-engage the partner and assess their needs.',
      affectedEntities: inactivePartners.map((p) => p.id),
    })
  }

  // 7. Payment Failure
  const failedPayments = await prisma.financialLedgerEntry.count({
    where: {
      eventType: 'PAYMENT_FAILED',
      occurredAt: { gte: sevenDaysAgo },
    },
  })
  if (failedPayments > 0) {
    exceptions.push({
      key: 'payment-failure',
      type: 'error',
      title: 'Payment Failure',
      description: `${failedPayments} payment failure(s) in the last 7 days.`,
      cause: 'Payment gateway returned a failure, possibly due to insufficient funds or network issues.',
      severity: 'high',
      recommendation: 'Review failed payment details and retry or contact the customer.',
    })
  }

  // 8. Ledger Mismatch
  const ledgerRevenue = await prisma.financialLedgerEntry.aggregate({
    where: { eventType: { in: ['PAYMENT_SUCCESS', 'SUBSCRIPTION_CHARGE'] } },
    _sum: { amountCents: true },
  })
  const commissionPaid = await prisma.partnershipCommission.aggregate({
    where: { status: 'PAID' },
    _sum: { amountCents: true },
  })
  const payoutPaid = await prisma.partnershipPayout.aggregate({
    where: { status: 'PAID' },
    _sum: { amountCents: true },
  })
  const commissionPayoutDiff = Math.abs((commissionPaid._sum.amountCents ?? 0) - (payoutPaid._sum.amountCents ?? 0))
  if (commissionPayoutDiff > 100) {
    exceptions.push({
      key: 'ledger-mismatch',
      type: 'warning',
      title: 'Ledger Mismatch',
      description: `Commission paid total differs from payout total by ${commissionPayoutDiff} cents.`,
      cause: 'Some commissions may not have been included in payouts, or payouts include non-commission amounts.',
      severity: 'medium',
      recommendation: 'Review payout batches for missing or extra commissions.',
    })
  }

  return exceptions
}

// ─── System Health Computation ────────────────────────────────────────
async function computeSystemHealth() {
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  // Attribution Health: % of businesses with attribution
  const totalBusinesses = await prisma.business.count()
  const businessesWithAttribution = await prisma.acquisitionAttribution.count()
  const attributionHealth = totalBusinesses > 0
    ? Math.round((businessesWithAttribution / totalBusinesses) * 100)
    : 100

  // Campaign Health: % of active campaigns with recent activity
  const activeCampaigns = await prisma.partnershipCampaign.count({ where: { status: 'ACTIVE' } })
  const stalledCampaigns = await prisma.partnershipCampaign.count({
    where: { status: 'ACTIVE', updatedAt: { lt: sevenDaysAgo } },
  })
  const campaignHealth = activeCampaigns > 0
    ? Math.round(((activeCampaigns - stalledCampaigns) / activeCampaigns) * 100)
    : 100

  // Revenue Health: revenue in last 7 days vs previous 7 days
  const last7DaysRevenue = await prisma.financialLedgerEntry.aggregate({
    where: {
      eventType: { in: ['PAYMENT_SUCCESS', 'SUBSCRIPTION_CHARGE'] },
      occurredAt: { gte: sevenDaysAgo },
    },
    _sum: { amountCents: true },
  })
  const prev7DaysStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
  const prev7DaysRevenue = await prisma.financialLedgerEntry.aggregate({
    where: {
      eventType: { in: ['PAYMENT_SUCCESS', 'SUBSCRIPTION_CHARGE'] },
      occurredAt: { gte: prev7DaysStart, lt: sevenDaysAgo },
    },
    _sum: { amountCents: true },
  })
  const currentRev = last7DaysRevenue._sum.amountCents ?? 0
  const prevRev = prev7DaysRevenue._sum.amountCents ?? 0
  const revenueChange = prevRev > 0 ? ((currentRev - prevRev) / prevRev) * 100 : 0
  const revenueHealth = revenueChange >= 0 ? 100 : Math.max(0, 100 + revenueChange)

  // Commission Health: % of commissions not stuck
  const totalCommissions = await prisma.partnershipCommission.count()
  const stuckCommissions = await prisma.partnershipCommission.count({
    where: { status: 'PENDING', createdAt: { lt: sevenDaysAgo } },
  })
  const commissionHealth = totalCommissions > 0
    ? Math.round(((totalCommissions - stuckCommissions) / totalCommissions) * 100)
    : 100

  // Notification Health: (simplified — no notification model to query)
  const notificationHealth = 100

  // Support Health: pending investigations
  const pendingInvestigations = await prisma.partnershipActivityLog.count({
    where: { type: 'INVESTIGATION_ASSIGNED' },
  })
  const supportHealth = pendingInvestigations === 0 ? 100 : Math.max(50, 100 - pendingInvestigations * 5)

  // Overall Partnership Health
  const activePartners = await prisma.partnership.count({ where: { status: 'ACTIVE' } })
  const suspendedPartners = await prisma.partnership.count({ where: { status: 'SUSPENDED' } })
  const partnershipHealth = activePartners + suspendedPartners > 0
    ? Math.round((activePartners / (activePartners + suspendedPartners)) * 100)
    : 100

  function healthStatus(score: number): 'healthy' | 'warning' | 'critical' {
    if (score >= 80) return 'healthy'
    if (score >= 50) return 'warning'
    return 'critical'
  }

  const signals = [
    { name: 'Attribution Health', score: attributionHealth, status: healthStatus(attributionHealth), detail: `${businessesWithAttribution}/${totalBusinesses} businesses attributed` },
    { name: 'Campaign Health', score: campaignHealth, status: healthStatus(campaignHealth), detail: `${stalledCampaigns} stalled of ${activeCampaigns} active` },
    { name: 'Revenue Health', score: revenueHealth, status: healthStatus(revenueHealth), detail: `${revenueChange >= 0 ? '+' : ''}${revenueChange.toFixed(1)}% vs last week` },
    { name: 'Commission Health', score: commissionHealth, status: healthStatus(commissionHealth), detail: `${stuckCommissions} stuck of ${totalCommissions} total` },
    { name: 'Notification Health', score: notificationHealth, status: healthStatus(notificationHealth), detail: 'All systems operational' },
    { name: 'Support Health', score: supportHealth, status: healthStatus(supportHealth), detail: `${pendingInvestigations} pending investigation(s)` },
    { name: 'Partnership Health', score: partnershipHealth, status: healthStatus(partnershipHealth), detail: `${activePartners} active, ${suspendedPartners} suspended` },
  ]

  const overallScore = Math.round(signals.reduce((sum, s) => sum + s.score, 0) / signals.length)

  return {
    signals,
    overallScore,
    overallStatus: healthStatus(overallScore),
  }
}

export default withRateLimit(handler, { windowMs: 60000, maxRequests: 100 })
