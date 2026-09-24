import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { ExecutiveSummaryService } from '@/lib/services/intelligence/executive-summary.service'
import { PartnershipOperationalQueryService } from '@/lib/services/partnership-operational-query.service'
import { prisma } from '@/lib/prisma'
import { subDays } from 'date-fns'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const session = await getServerSession(req, res, authOptions)
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const userRoles = (session.user as any).roles || [(session.user as any).role]
  const allowed = ['PARTNERSHIP_DIRECTOR', 'ADMIN', 'PARTNERSHIP_MANAGER', 'EXECUTIVE']
  if (!userRoles.some((r: string) => allowed.includes(r))) {
    return res.status(403).json({ error: 'Insufficient permissions' })
  }

  try {
    const [
      dailySummary,
      weeklySummary,
      topPartnersBySignups,
      topPartnersByConversions,
      topPartnersByRevenue,
      campaignPerformance,
      regionalPerformance,
      partnershipTypeLTV,
      cacByPartnerType,
      commissionSummary,
      totalCommissionLiability,
      partnersRequiringAttention,
      expiringAgreements,
      pendingPayouts,
      activeBusinesses,
      totalBusinesses,
      newBusinesses7d,
      newBusinesses30d,
      totalPartnerships,
      activePartnerships,
      suspendedPartnerships,
      prospectPartnerships,
      appliedPartnerships,
      onboardedPartnerships,
      terminatedPartnerships,
      pendingApplications,
      underReviewApplications,
      approvedApplications,
      rejectedApplications,
      activeCampaigns,
      draftCampaigns,
      pausedCampaigns,
      completedCampaigns,
      activeCodes,
      totalCodes,
      exhaustedCodes,
      expiredCodes,
      activeAgreements,
      draftAgreements,
      expiredAgreements,
      terminatedAgreements,
      pendingSignatures,
      healthScores,
      riskProfiles,
      recentPayouts,
      paidPayouts30d,
      failedPayouts,
      partnersByType,
      partnersByRegion,
      partnersByStatus,
    ] = await Promise.all([
      ExecutiveSummaryService.generateDailySummary(),
      ExecutiveSummaryService.generateWeeklySummary(),
      PartnershipOperationalQueryService.getTopPartners({ metric: 'signups', limit: 10 }),
      PartnershipOperationalQueryService.getTopPartners({ metric: 'conversions', limit: 10 }),
      PartnershipOperationalQueryService.getTopPartners({ metric: 'revenue', limit: 10 }),
      PartnershipOperationalQueryService.getCampaignPerformance(20),
      PartnershipOperationalQueryService.getRegionalPerformance(),
      PartnershipOperationalQueryService.getPartnershipTypeLTV(),
      PartnershipOperationalQueryService.getCACByPartnerType(),
      PartnershipOperationalQueryService.getCommissionSummary(),
      PartnershipOperationalQueryService.getTotalCommissionLiability(),
      PartnershipOperationalQueryService.getPartnersRequiringAttention(),
      PartnershipOperationalQueryService.getExpiringAgreements(30),
      prisma.partnershipPayout.findMany({
        where: { status: 'PENDING' },
        include: { partnership: { select: { id: true, name: true, email: true, phone: true } } },
        orderBy: { createdAt: 'asc' },
        take: 20,
      }),
      prisma.business.count({ where: { isActive: true } }),
      prisma.business.count(),
      prisma.business.count({ where: { createdAt: { gte: subDays(new Date(), 7) } } }),
      prisma.business.count({ where: { createdAt: { gte: subDays(new Date(), 30) } } }),
      prisma.partnership.count(),
      prisma.partnership.count({ where: { status: 'ACTIVE' } }),
      prisma.partnership.count({ where: { status: 'SUSPENDED' } }),
      prisma.partnership.count({ where: { status: 'PROSPECT' } }),
      prisma.partnership.count({ where: { status: 'APPLIED' } }),
      prisma.partnership.count({ where: { status: 'ONBOARDED' } }),
      prisma.partnership.count({ where: { status: 'TERMINATED' } }),
      prisma.partnershipApplication.count({ where: { status: 'SUBMITTED' } }),
      prisma.partnershipApplication.count({ where: { status: 'UNDER_REVIEW' } }),
      prisma.partnershipApplication.count({ where: { status: 'APPROVED' } }),
      prisma.partnershipApplication.count({ where: { status: 'REJECTED' } }),
      prisma.partnershipCampaign.count({ where: { status: 'ACTIVE' } }),
      prisma.partnershipCampaign.count({ where: { status: 'DRAFT' } }),
      prisma.partnershipCampaign.count({ where: { status: 'PAUSED' } }),
      prisma.partnershipCampaign.count({ where: { status: 'COMPLETED' } }),
      prisma.partnershipCode.count({ where: { status: 'ACTIVE' } }),
      prisma.partnershipCode.count(),
      prisma.partnershipCode.count({ where: { status: 'EXHAUSTED' } }),
      prisma.partnershipCode.count({ where: { status: 'EXPIRED' } }),
      prisma.partnershipAgreement.count({ where: { status: 'ACTIVE' } }),
      prisma.partnershipAgreement.count({ where: { status: 'DRAFT' } }),
      prisma.partnershipAgreement.count({ where: { status: 'EXPIRED' } }),
      prisma.partnershipAgreement.count({ where: { status: 'TERMINATED' } }),
      prisma.partnershipAgreement.count({ where: { status: 'SENT' } }),
      prisma.partnershipHealthScore.findMany({
        include: {
          partnership: { select: { id: true, name: true, status: true, partnerType: true, region: true } },
        },
        orderBy: { score: 'desc' },
        take: 20,
      }),
      prisma.partnershipRiskProfile.findMany({
        where: { riskLevel: { in: ['HIGH', 'MEDIUM'] } },
        include: {
          partnership: { select: { id: true, name: true, status: true, partnerType: true } },
        },
        orderBy: { riskScore: 'desc' },
        take: 20,
      }),
      prisma.partnershipPayout.findMany({
        where: { status: { in: ['PAID', 'FAILED'] } },
        include: { partnership: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.partnershipPayout.aggregate({
        where: { status: 'PAID', paidAt: { gte: subDays(new Date(), 30) } },
        _sum: { amountCents: true },
        _count: true,
      }),
      prisma.partnershipPayout.count({ where: { status: 'FAILED' } }),
      prisma.partnership.groupBy({
        by: ['partnerType'],
        _count: true,
        _sum: { totalSignups: true, totalConversions: true, totalRevenueCents: true },
      }),
      prisma.partnership.groupBy({
        by: ['region'],
        _count: true,
        _sum: { totalSignups: true, totalConversions: true },
      }),
      prisma.partnership.groupBy({
        by: ['status'],
        _count: true,
      }),
    ])

    // ─── Compute Partnership Health Score ───────────────────────────────
    const partnershipHealthScore = computePartnershipHealthScore({
      totalPartnerships,
      activePartnerships,
      suspendedPartnerships,
      terminatedPartnerships,
      pendingApplications,
      activeCampaigns,
      activeAgreements,
      expiringAgreements: expiringAgreements.length,
      healthScores,
    })

    // ─── Compute Pipeline Stages ────────────────────────────────────────
    const pipeline = {
      prospect: prospectPartnerships,
      applied: appliedPartnerships,
      onboarded: onboardedPartnerships,
      active: activePartnerships,
      suspended: suspendedPartnerships,
      terminated: terminatedPartnerships,
      pendingApplications,
      underReviewApplications,
      approvedApplications,
      activeAgreements,
      activeCampaigns,
    }

    // ─── Build Attention Items ──────────────────────────────────────────
    const attentionItems = buildAttentionItems({
      expiringAgreements,
      partnersRequiringAttention,
      pausedCampaigns,
      suspendedPartnerships,
      pendingPayouts,
      failedPayouts,
      inactiveCodes: exhaustedCodes + expiredCodes,
      lowHealth: healthScores.filter((h) => h.grade === 'D' || h.grade === 'F'),
      highRisk: riskProfiles.filter((r) => r.riskLevel === 'HIGH'),
    })

    // ─── Build AI Recommendations ───────────────────────────────────────
    const recommendations = buildRecommendations({
      totalPartnerships,
      activePartnerships,
      suspendedPartnerships,
      pendingApplications,
      activeCampaigns,
      pausedCampaigns,
      draftCampaigns,
      expiringAgreements,
      commissionSummary,
      totalCommissionLiability,
      pendingPayouts,
      failedPayouts,
      healthScores,
      partnersByType,
      partnersByRegion,
      regionalPerformance,
      topPartnersBySignups,
      topPartnersByConversions,
      topPartnersByRevenue,
      campaignPerformance,
      activeCodes,
      totalCodes,
      exhaustedCodes,
      expiredCodes,
      newBusinesses7d,
      newBusinesses30d,
    })

    // ─── Build Opportunities ────────────────────────────────────────────
    const opportunities = buildOpportunities({
      partnersByType,
      partnersByRegion,
      regionalPerformance,
      campaignPerformance,
      topPartnersBySignups,
      activeCampaigns,
      draftCampaigns,
      prospectPartnerships,
      appliedPartnerships,
    })

    res.status(200).json({
      partnershipHealthScore,
      dailySummary,
      weeklySummary,
      pipeline,
      partnersByType: partnersByType.map((p) => ({
        partnerType: p.partnerType,
        count: p._count,
        totalSignups: p._sum.totalSignups ?? 0,
        totalConversions: p._sum.totalConversions ?? 0,
        totalRevenueCents: p._sum.totalRevenueCents ?? 0,
      })),
      partnersByRegion: partnersByRegion.map((r) => ({
        region: r.region ?? 'Unknown',
        count: r._count,
        totalSignups: r._sum.totalSignups ?? 0,
        totalConversions: r._sum.totalConversions ?? 0,
      })),
      partnersByStatus: partnersByStatus.map((s) => ({
        status: s.status,
        count: s._count,
      })),
      topPartnersBySignups,
      topPartnersByConversions,
      topPartnersByRevenue,
      campaignPerformance,
      regionalPerformance,
      partnershipTypeLTV,
      cacByPartnerType,
      commissionSummary,
      totalCommissionLiability,
      pendingPayouts: pendingPayouts.map((p) => ({
        id: p.id,
        partnershipId: p.partnershipId,
        partnershipName: p.partnership.name,
        amountCents: p.amountCents,
        currency: p.currency,
        method: p.method,
        status: p.status,
        createdAt: p.createdAt,
        recipientPhone: p.recipientPhone,
      })),
      recentPayouts: recentPayouts.map((p) => ({
        id: p.id,
        partnershipName: p.partnership.name,
        amountCents: p.amountCents,
        currency: p.currency,
        method: p.method,
        status: p.status,
        paidAt: p.paidAt,
        createdAt: p.createdAt,
      })),
      paidPayouts30d: {
        totalCents: paidPayouts30d._sum.amountCents ?? 0,
        count: paidPayouts30d._count,
      },
      failedPayouts,
      activeBusinesses,
      totalBusinesses,
      newBusinesses7d,
      newBusinesses30d,
      totalPartnerships,
      activePartnerships,
      suspendedPartnerships,
      prospectPartnerships,
      appliedPartnerships,
      onboardedPartnerships,
      terminatedPartnerships,
      pendingApplications,
      underReviewApplications,
      approvedApplications,
      rejectedApplications,
      activeCampaigns,
      draftCampaigns,
      pausedCampaigns,
      completedCampaigns,
      activeCodes,
      totalCodes,
      exhaustedCodes,
      expiredCodes,
      activeAgreements,
      draftAgreements,
      expiredAgreements,
      terminatedAgreements,
      pendingSignatures,
      expiringAgreements: expiringAgreements.map((a) => ({
        id: a.id,
        version: a.version,
        status: a.status,
        effectiveAt: a.effectiveAt,
        expiresAt: a.expiresAt,
        partnership: a.partnership,
      })),
      healthScores: healthScores.map((h) => ({
        partnershipId: h.partnershipId,
        partnership: h.partnership,
        score: h.score,
        grade: h.grade,
        acquisitionScore: h.acquisitionScore,
        conversionScore: h.conversionScore,
        revenueScore: h.revenueScore,
        engagementScore: h.engagementScore,
        riskComponentScore: h.riskComponentScore,
        trendDirection: h.trendDirection,
        previousScore: h.previousScore,
      })),
      riskProfiles: riskProfiles.map((r) => ({
        partnershipId: r.partnershipId,
        partnership: r.partnership,
        riskScore: r.riskScore,
        riskLevel: r.riskLevel,
        flags: r.flags,
      })),
      partnersRequiringAttention,
      attentionItems,
      recommendations,
      opportunities,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[partnership-director API]', error)
    return res.status(500).json({ error: 'Failed to generate partnership intelligence' })
  }
}

export default handler

// ─── Helper Functions ────────────────────────────────────────────────────

function computePartnershipHealthScore(params: {
  totalPartnerships: number
  activePartnerships: number
  suspendedPartnerships: number
  terminatedPartnerships: number
  pendingApplications: number
  activeCampaigns: number
  activeAgreements: number
  expiringAgreements: number
  healthScores: any[]
}): number {
  const {
    totalPartnerships,
    activePartnerships,
    suspendedPartnerships,
    terminatedPartnerships,
    pendingApplications,
    activeCampaigns,
    activeAgreements,
    expiringAgreements,
    healthScores,
  } = params

  if (totalPartnerships === 0) return 0

  let score = 40

  // Active ratio
  const activeRatio = activePartnerships / totalPartnerships
  if (activeRatio > 0.7) score += 20
  else if (activeRatio > 0.5) score += 15
  else if (activeRatio > 0.3) score += 8
  else score -= 10

  // Suspension rate
  const suspensionRate = suspendedPartnerships / totalPartnerships
  if (suspensionRate < 0.05) score += 10
  else if (suspensionRate > 0.15) score -= 15

  // Terminated rate
  const terminatedRate = terminatedPartnerships / totalPartnerships
  if (terminatedRate > 0.2) score -= 10

  // Application pipeline health
  if (pendingApplications > 0) score += 5

  // Campaign activity
  if (activeCampaigns > 0) score += 10

  // Agreement stability
  if (activeAgreements > 0 && expiringAgreements === 0) score += 5
  else if (expiringAgreements > 5) score -= 10

  // Average health score grade
  if (healthScores.length > 0) {
    const avgScore = healthScores.reduce((sum, h) => sum + h.score, 0) / healthScores.length
    if (avgScore >= 75) score += 10
    else if (avgScore >= 50) score += 5
    else if (avgScore < 30) score -= 10
  }

  return Math.max(0, Math.min(100, score))
}

function buildAttentionItems(params: {
  expiringAgreements: any[]
  partnersRequiringAttention: any
  pausedCampaigns: number
  suspendedPartnerships: number
  pendingPayouts: any[]
  failedPayouts: number
  inactiveCodes: number
  lowHealth: any[]
  highRisk: any[]
}): Array<{
  title: string
  description: string
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  action: string
  link: string
}> {
  const items: Array<{
    title: string
    description: string
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
    action: string
    link: string
  }> = []

  const {
    expiringAgreements,
    partnersRequiringAttention,
    pausedCampaigns,
    suspendedPartnerships,
    pendingPayouts,
    failedPayouts,
    inactiveCodes,
    lowHealth,
    highRisk,
  } = params

  // Expiring agreements
  if (expiringAgreements.length > 0) {
    const critical = expiringAgreements.filter((a) => {
      const days = a.expiresAt ? Math.ceil((new Date(a.expiresAt).getTime() - Date.now()) / 86400000) : 999
      return days <= 7
    })
    items.push({
      title: `${expiringAgreements.length} agreement${expiringAgreements.length > 1 ? 's' : ''} expiring within 30 days`,
      description: critical.length > 0
        ? `${critical.length} agreement(s) expire within 7 days — immediate renewal required.`
        : `Review and initiate renewal discussions for upcoming expirations.`,
      severity: critical.length > 0 ? 'CRITICAL' : 'HIGH',
      action: 'Review agreements and initiate renewals',
      link: '/admin/founder-partners',
    })
  }

  // Suspended partners
  if (suspendedPartnerships > 0) {
    items.push({
      title: `${suspendedPartnerships} suspended partner${suspendedPartnerships > 1 ? 's' : ''}`,
      description: `Suspended partners cannot generate new business. Review for reactivation or termination.`,
      severity: 'HIGH',
      action: 'Review suspended partners',
      link: '/admin/founder-partners',
    })
  }

  // Low health partners
  if (lowHealth.length > 0) {
    items.push({
      title: `${lowHealth.length} partner${lowHealth.length > 1 ? 's' : ''} with declining health (Grade D/F)`,
      description: `Health scores indicate deteriorating partner performance. Intervention recommended.`,
      severity: 'HIGH',
      action: 'Review partner health and plan intervention',
      link: '/admin/founder-partners',
    })
  }

  // High risk partners
  if (highRisk.length > 0) {
    items.push({
      title: `${highRisk.length} partner${highRisk.length > 1 ? 's' : ''} flagged as HIGH risk`,
      description: `Risk profiles indicate potential fraud or compliance concerns.`,
      severity: 'CRITICAL',
      action: 'Review risk flags and take appropriate action',
      link: '/admin/operations-intelligence',
    })
  }

  // Pending payouts
  if (pendingPayouts.length > 0) {
    items.push({
      title: `${pendingPayouts.length} payout${pendingPayouts.length > 1 ? 's' : ''} pending approval`,
      description: `Commission payouts awaiting approval and processing.`,
      severity: 'MEDIUM',
      action: 'Review and approve pending payouts',
      link: '/admin/payout-control',
    })
  }

  // Failed payouts
  if (failedPayouts > 0) {
    items.push({
      title: `${failedPayouts} failed payout${failedPayouts > 1 ? 's' : ''}`,
      description: `Payout processing failures require investigation and retry.`,
      severity: 'HIGH',
      action: 'Investigate failed payouts and retry',
      link: '/admin/payout-control',
    })
  }

  // Paused campaigns
  if (pausedCampaigns > 0) {
    items.push({
      title: `${pausedCampaigns} paused campaign${pausedCampaigns > 1 ? 's' : ''}`,
      description: `Paused campaigns are not generating new business. Review for reactivation or closure.`,
      severity: 'MEDIUM',
      action: 'Review paused campaigns',
      link: '/admin/founder-partners',
    })
  }

  // Inactive codes
  if (inactiveCodes > 0) {
    items.push({
      title: `${inactiveCodes} inactive founder code${inactiveCodes > 1 ? 's' : ''}`,
      description: `Exhausted or expired codes are no longer generating signups.`,
      severity: 'LOW',
      action: 'Review and refresh inactive codes',
      link: '/admin/founder-codes',
    })
  }

  // Pending applications
  const pendingApps = partnersRequiringAttention?.suspended?.length ?? 0
  if (pendingApps === 0 && suspendedPartnerships === 0 && items.length === 0) {
    items.push({
      title: 'No critical partnership items requiring attention',
      description: 'The partnership ecosystem is operating normally.',
      severity: 'LOW',
      action: 'Continue monitoring partnership health',
      link: '/admin/founder-partners',
    })
  }

  return items.sort((a, b) => {
    const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
    return order[a.severity] - order[b.severity]
  })
}

function buildRecommendations(params: {
  totalPartnerships: number
  activePartnerships: number
  suspendedPartnerships: number
  pendingApplications: number
  activeCampaigns: number
  pausedCampaigns: number
  draftCampaigns: number
  expiringAgreements: any[]
  commissionSummary: any
  totalCommissionLiability: any
  pendingPayouts: any[]
  failedPayouts: number
  healthScores: any[]
  partnersByType: any[]
  partnersByRegion: any[]
  regionalPerformance: any[]
  topPartnersBySignups: any[]
  topPartnersByConversions: any[]
  topPartnersByRevenue: any[]
  campaignPerformance: any[]
  activeCodes: number
  totalCodes: number
  exhaustedCodes: number
  expiredCodes: number
  newBusinesses7d: number
  newBusinesses30d: number
}): Array<{
  question: string
  answer: string
  evidence: string[]
  confidence: number
  expectedImpact: string
  suggestedActions: string[]
}> {
  const recs: Array<{
    question: string
    answer: string
    evidence: string[]
    confidence: number
    expectedImpact: string
    suggestedActions: string[]
  }> = []

  const {
    totalPartnerships,
    activePartnerships,
    suspendedPartnerships,
    pendingApplications,
    activeCampaigns,
    pausedCampaigns,
    draftCampaigns,
    expiringAgreements,
    commissionSummary,
    totalCommissionLiability,
    pendingPayouts,
    failedPayouts,
    healthScores,
    partnersByType,
    partnersByRegion,
    regionalPerformance,
    topPartnersBySignups,
    topPartnersByConversions,
    topPartnersByRevenue,
    campaignPerformance,
    activeCodes,
    totalCodes,
    exhaustedCodes,
    expiredCodes,
    newBusinesses7d,
    newBusinesses30d,
  } = params

  // 1. Partnership ecosystem health
  const activeRatio = totalPartnerships > 0 ? (activePartnerships / totalPartnerships) * 100 : 0
  recs.push({
    question: 'How healthy is our partnership ecosystem?',
    answer: activeRatio >= 70
      ? `The partnership ecosystem is healthy with ${activeRatio.toFixed(0)}% of partners active. ${activeCampaigns} active campaigns are driving business acquisition.`
      : activeRatio >= 50
        ? `The partnership ecosystem is moderate with ${activeRatio.toFixed(0)}% active. ${suspendedPartnerships} suspended partners need attention.`
        : `The partnership ecosystem needs attention — only ${activeRatio.toFixed(0)}% of partners are active. ${suspendedPartnerships} suspended and ${pendingApplications} pending applications indicate lifecycle bottlenecks.`,
    evidence: [
      `${totalPartnerships} total partnerships (${activePartnerships} active, ${suspendedPartnerships} suspended)`,
      `${pendingApplications} pending applications in the pipeline`,
      `${activeCampaigns} active campaigns generating business acquisition`,
      `${activeAgreementsCount(expiringAgreements)} active agreements, ${expiringAgreements.length} expiring within 30 days`,
    ],
    confidence: activeRatio >= 70 ? 85 : activeRatio >= 50 ? 70 : 60,
    expectedImpact: activeRatio >= 70
      ? 'Maintain current momentum; focus on expansion and renewal.'
      : 'Reactivating suspended partners and processing pending applications could increase active ratio by 10-20%.',
    suggestedActions: activeRatio >= 70
      ? ['Continue monitoring partner health', 'Focus on expansion into new regions', 'Launch new campaigns with top partners']
      : ['Review and reactivate suspended partners', 'Process pending applications promptly', 'Schedule partner check-ins for at-risk relationships'],
  })

  // 2. Campaign performance
  if (campaignPerformance.length > 0) {
    const topCampaign = campaignPerformance[0]
    const avgConversion = campaignPerformance.reduce((sum, c) => sum + c.conversionRate, 0) / campaignPerformance.length
    recs.push({
      question: 'Which campaigns are driving the most hospitality business growth?',
      answer: `Top campaign "${topCampaign.name}" has ${topCampaign.conversions} conversions at ${topCampaign.conversionRate.toFixed(1)}% conversion rate. Average campaign conversion rate is ${avgConversion.toFixed(1)}%.`,
      evidence: [
        `Top campaign: ${topCampaign.name} — ${topCampaign.signups} signups, ${topCampaign.conversions} conversions`,
        `Average conversion rate across ${campaignPerformance.length} campaigns: ${avgConversion.toFixed(1)}%`,
        `${pausedCampaigns} paused campaigns could be reactivated`,
        `${draftCampaigns} draft campaigns awaiting launch`,
      ],
      confidence: 80,
      expectedImpact: `Reactivating paused campaigns and launching drafts could add ${Math.round(pausedCampaigns * avgConversion)} additional conversions.`,
      suggestedActions: [
        `Replicate "${topCampaign.name}" strategy for new campaigns`,
        `Review and reactivate ${pausedCampaigns} paused campaigns`,
        `Launch ${draftCampaigns} draft campaigns with proven strategies`,
      ],
    })
  }

  // 3. Partner expansion opportunities
  if (regionalPerformance.length > 0) {
    const underpenetrated = regionalPerformance.filter((r) => r.partnerCount < 3 && r.totalSignups < 10)
    if (underpenetrated.length > 0) {
      recs.push({
        question: 'Where are the best opportunities for partnership expansion?',
        answer: `${underpenetrated.length} regions have low partnership penetration but represent untapped hospitality markets. Regions like ${underpenetrated.slice(0, 3).map((r) => r.region).join(', ')} show potential for growth.`,
        evidence: underpenetrated.slice(0, 5).map((r) =>
          `${r.region}: ${r.partnerCount} partners, ${r.totalSignups} signups, ${r.totalConversions} conversions`
        ),
        confidence: 70,
        expectedImpact: `Expanding into ${underpenetrated.length} underpenetrated regions could add ${underpenetrated.length * 5}+ new hospitality businesses.`,
        suggestedActions: [
          `Prioritize partner recruitment in ${underpenetrated.slice(0, 3).map((r) => r.region).join(', ')}`,
          'Develop region-specific partnership value propositions',
          'Leverage existing partners in adjacent regions for introductions',
        ],
      })
    }
  }

  // 4. Commission and payout health
  const totalLiability = totalCommissionLiability?.totalLiabilityCents ?? 0
  const pendingCount = pendingPayouts.length
  if (totalLiability > 0 || pendingCount > 0) {
    recs.push({
      question: 'What are our current financial obligations to partners?',
      answer: `Outstanding commission liability: ${Math.round(totalLiability / 100).toLocaleString()} RWF across ${totalCommissionLiability?.totalCommissionCount ?? 0} commissions. ${pendingCount} payouts pending approval. ${failedPayouts} failed payouts need attention.`,
      evidence: [
        `Total commission liability: ${Math.round(totalLiability / 100).toLocaleString()} RWF`,
        `${pendingCount} pending payouts awaiting approval`,
        `${failedPayouts} failed payouts requiring investigation`,
        `Commission breakdown: ${commissionSummary?.byStatus?.map((s: any) => `${s.status}: ${s.count}`).join(', ') || 'N/A'}`,
      ],
      confidence: 85,
      expectedImpact: 'Timely payout processing improves partner trust and retention, reducing churn risk by up to 30%.',
      suggestedActions: [
        `Approve ${pendingCount} pending payouts to maintain partner trust`,
        failedPayouts > 0 ? `Investigate ${failedPayouts} failed payouts and retry` : 'Monitor payout processing for issues',
        'Ensure commission validation pipeline is current',
      ],
    })
  }

  // 5. Partner health and risk
  const lowHealthCount = healthScores.filter((h) => h.grade === 'D' || h.grade === 'F').length
  const highPerformers = healthScores.filter((h) => h.grade === 'A' || h.grade === 'B').length
  if (healthScores.length > 0) {
    recs.push({
      question: 'Which partners need attention and which are ready for expansion?',
      answer: lowHealthCount > 0
        ? `${lowHealthCount} partner(s) have declining health (Grade D/F) and need intervention. ${highPerformers} high-performing partner(s) (Grade A/B) are ready for expansion conversations.`
        : `${highPerformers} partner(s) are performing well (Grade A/B). No critical health issues detected. Consider expansion discussions with top performers.`,
      evidence: [
        `${healthScores.length} partners with health scores`,
        `${highPerformers} high performers (Grade A/B)`,
        `${lowHealthCount} at-risk partners (Grade D/F)`,
        `Average health score: ${Math.round(healthScores.reduce((sum, h) => sum + h.score, 0) / healthScores.length)}/100`,
      ],
      confidence: 75,
      expectedImpact: 'Intervening with at-risk partners can prevent churn; expanding with top performers can increase revenue by 15-25%.',
      suggestedActions: [
        lowHealthCount > 0 ? `Schedule check-ins with ${lowHealthCount} at-risk partners` : 'Continue monitoring partner health',
        `Initiate expansion discussions with ${highPerformers} top-performing partners`,
        'Recognize and reward high-performing partners to maintain engagement',
      ],
    })
  }

  // 6. Code utilization
  if (totalCodes > 0) {
    const activeCodeRate = (activeCodes / totalCodes) * 100
    if (activeCodeRate < 60 || exhaustedCodes > 0 || expiredCodes > 0) {
      recs.push({
        question: 'Are founder codes being effectively utilized?',
        answer: activeCodeRate < 60
          ? `Only ${activeCodeRate.toFixed(0)}% of founder codes are active. ${exhaustedCodes} exhausted and ${expiredCodes} expired codes need refreshing.`
          : `Code utilization is healthy at ${activeCodeRate.toFixed(0)}% active. ${exhaustedCodes} exhausted codes may need replenishment.`,
        evidence: [
          `${activeCodes} active codes out of ${totalCodes} total`,
          `${exhaustedCodes} exhausted codes`,
          `${expiredCodes} expired codes`,
          `${newBusinesses7d} new businesses in last 7 days, ${newBusinesses30d} in last 30 days`,
        ],
        confidence: 70,
        expectedImpact: 'Refreshing inactive codes and launching new ones could increase business acquisition by 10-15%.',
        suggestedActions: [
          exhaustedCodes > 0 ? `Refresh ${exhaustedCodes} exhausted codes with new redemption limits` : 'Monitor code exhaustion rates',
          expiredCodes > 0 ? `Renew or replace ${expiredCodes} expired codes` : 'Set up proactive expiry alerts',
          'Issue new codes to top-performing partners for expanded reach',
        ],
      })
    }
  }

  return recs
}

function activeAgreementsCount(expiring: any[]): number {
  return expiring.length
}

function buildOpportunities(params: {
  partnersByType: any[]
  partnersByRegion: any[]
  regionalPerformance: any[]
  campaignPerformance: any[]
  topPartnersBySignups: any[]
  activeCampaigns: number
  draftCampaigns: number
  prospectPartnerships: number
  appliedPartnerships: number
}): Array<{
  type: string
  title: string
  description: string
  action: string
  expectedImpact: string
  link: string
}> {
  const opportunities: Array<{
    type: string
    title: string
    description: string
    action: string
    expectedImpact: string
    link: string
  }> = []

  const {
    partnersByType,
    partnersByRegion,
    regionalPerformance,
    campaignPerformance,
    topPartnersBySignups,
    activeCampaigns,
    draftCampaigns,
    prospectPartnerships,
    appliedPartnerships,
  } = params

  // Untapped partner types
  const allPartnerTypes = ['FOUNDER', 'STRATEGIC', 'CHANNEL', 'AFFILIATE', 'PROFESSIONAL_MARKETER', 'CUSTOMER_REFERRAL', 'BUSINESS_INVITE', 'HOSPITALITY_ASSOCIATION', 'TOURISM_BOARD', 'GOVERNMENT_PROGRAM', 'POS_PARTNER', 'MARKETPLACE_PARTNER', 'HARDWARE_RESELLER', 'TECHNOLOGY_INTEGRATOR', 'AI_CAMPAIGN_PARTNER']
  const existingTypes = partnersByType.map((p) => p.partnerType)
  const untappedTypes = allPartnerTypes.filter((t) => !existingTypes.includes(t))
  if (untappedTypes.length > 0) {
    opportunities.push({
      type: 'PARTNER_TYPE_EXPANSION',
      title: `${untappedTypes.length} untapped partner types available`,
      description: `Partner types not yet activated: ${untappedTypes.slice(0, 5).join(', ')}${untappedTypes.length > 5 ? '...' : ''}. These represent new channels for hospitality business acquisition.`,
      action: 'Develop partnership strategies for untapped partner types',
      expectedImpact: `Activating ${untappedTypes.length} new partner types could diversify acquisition channels and add 20-50+ new businesses.`,
      link: '/admin/founder-partners',
    })
  }

  // Underpenetrated regions
  const underpenetrated = regionalPerformance.filter((r) => r.partnerCount < 3)
  if (underpenetrated.length > 0) {
    opportunities.push({
      type: 'REGIONAL_EXPANSION',
      title: `${underpenetrated.length} regions with growth potential`,
      description: `Regions with fewer than 3 partners: ${underpenetrated.slice(0, 3).map((r) => r.region).join(', ')}${underpenetrated.length > 3 ? '...' : ''}.`,
      action: 'Recruit partners in underpenetrated regions',
      expectedImpact: `Regional expansion could add ${underpenetrated.length * 5}+ new hospitality businesses.`,
      link: '/admin/founder-partners',
    })
  }

  // Draft campaigns ready to launch
  if (draftCampaigns > 0) {
    opportunities.push({
      type: 'CAMPAIGN_LAUNCH',
      title: `${draftCampaigns} draft campaign${draftCampaigns > 1 ? 's' : ''} ready for launch`,
      description: `Draft campaigns are configured but not yet active. Launching them could immediately increase business acquisition.`,
      action: 'Review and launch draft campaigns',
      expectedImpact: `Launching ${draftCampaigns} campaigns could add ${draftCampaigns * 10}+ new signups.`,
      link: '/admin/founder-partners',
    })
  }

  // Application pipeline
  if (prospectPartnerships + appliedPartnerships > 0) {
    opportunities.push({
      type: 'PIPELINE_CONVERSION',
      title: `${prospectPartnerships + appliedPartnerships} partnership${prospectPartnerships + appliedPartnerships > 1 ? 's' : ''} in pipeline`,
      description: `${prospectPartnerships} prospects and ${appliedPartnerships} applied partnerships awaiting progression through the lifecycle.`,
      action: 'Accelerate pipeline progression through review and approval',
      expectedImpact: `Converting pipeline partners could add ${Math.round((prospectPartnerships + appliedPartnerships) * 0.5)} new active partners.`,
      link: '/admin/partnership-applications',
    })
  }

  // Top partner expansion
  if (topPartnersBySignups.length > 0 && topPartnersBySignups[0].totalSignups > 10) {
    opportunities.push({
      type: 'TOP_PARTNER_EXPANSION',
      title: `Top partner "${topPartnersBySignups[0].name}" is ready for expansion`,
      description: `${topPartnersBySignups[0].name} has ${topPartnersBySignups[0].totalSignups} signups and is a strong candidate for expanded partnership terms or new campaigns.`,
      action: 'Initiate expansion discussion with top-performing partner',
      expectedImpact: 'Expanded partnership could increase signups by 30-50% from this partner alone.',
      link: '/admin/founder-partners',
    })
  }

  return opportunities
}
