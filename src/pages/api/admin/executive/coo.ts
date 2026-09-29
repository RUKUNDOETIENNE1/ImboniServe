import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { ExecutiveSummaryService } from '@/lib/services/intelligence/executive-summary.service'
import { PartnershipOperationalQueryService } from '@/lib/services/partnership-operational-query.service'
import { PaymentWatchdogService } from '@/lib/services/watchdog/payment-watchdog.service'
import { QueueWatchdogService } from '@/lib/services/watchdog/queue-watchdog.service'
import { ReconciliationWatchdogService } from '@/lib/services/watchdog/reconciliation-watchdog.service'
import { SubscriptionWatchdogService } from '@/lib/services/watchdog/subscription-watchdog.service'
import { CustomerHealthScoreService } from '@/lib/services/intelligence/customer-health-score.service'
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
  const allowed = ['COO', 'ADMIN', 'OPERATIONS_MANAGER', 'EXECUTIVE']
  if (!userRoles.some((r: string) => allowed.includes(r))) {
    return res.status(403).json({ error: 'Insufficient permissions' })
  }

  try {
    const [
      dailySummary,
      weeklySummary,
      paymentHealth,
      queueHealth,
      reconciliationHealth,
      subscriptionHealth,
      partnersRequiringAttention,
      regionalPerformance,
      expiringAgreements,
      activeBusinesses,
      inactiveBusinesses,
      totalBusinesses,
      newBusinessesYesterday,
      pendingApplications,
      applicationsUnderReview,
      approvedApplications,
      rejectedApplications,
      totalPartnerships,
      activePartnerships,
      onboardedPartnerships,
      suspendedPartnerships,
      appliedPartnerships,
      pendingAgreements,
      activeAgreements,
      expiredAgreements,
      draftCampaigns,
      activeCampaigns,
      pausedCampaigns,
      openSupportConversations,
      pendingSupport,
      resolvedSupport,
      highPrioritySupport,
      unassignedSupport,
      supportAssignedTo,
      totalCodes,
      activeCodes,
      expiredCodes,
      partnershipHealthScores,
      branchHealthScores,
      customerHealthDistribution,
      pendingPayouts,
      newPartnershipsYesterday,
      resolvedSupportYesterday,
    ] = await Promise.all([
      ExecutiveSummaryService.generateDailySummary(),
      ExecutiveSummaryService.generateWeeklySummary(),
      PaymentWatchdogService.getHealth(),
      QueueWatchdogService.getHealth(),
      ReconciliationWatchdogService.getHealth(),
      SubscriptionWatchdogService.getHealth(),
      PartnershipOperationalQueryService.getPartnersRequiringAttention(),
      PartnershipOperationalQueryService.getRegionalPerformance(),
      PartnershipOperationalQueryService.getExpiringAgreements(30),
      prisma.business.count({ where: { isActive: true } }),
      prisma.business.count({ where: { isActive: false } }),
      prisma.business.count(),
      prisma.business.count({ where: { createdAt: { gte: subDays(new Date(), 1) } } }),
      prisma.partnershipApplication.count({ where: { status: 'SUBMITTED' } }),
      prisma.partnershipApplication.count({ where: { status: 'UNDER_REVIEW' } }),
      prisma.partnershipApplication.count({ where: { status: 'APPROVED' } }),
      prisma.partnershipApplication.count({ where: { status: 'REJECTED' } }),
      prisma.partnership.count(),
      prisma.partnership.count({ where: { status: 'ACTIVE' } }),
      prisma.partnership.count({ where: { status: 'ONBOARDED' } }),
      prisma.partnership.count({ where: { status: 'SUSPENDED' } }),
      prisma.partnership.count({ where: { status: 'APPLIED' } }),
      prisma.partnershipAgreement.count({ where: { status: 'DRAFT' } }),
      prisma.partnershipAgreement.count({ where: { status: 'SIGNED' } }),
      prisma.partnershipAgreement.count({ where: { status: 'EXPIRED' } }),
      prisma.partnershipCampaign.count({ where: { status: 'DRAFT' } }),
      prisma.partnershipCampaign.count({ where: { status: 'ACTIVE' } }),
      prisma.partnershipCampaign.count({ where: { status: 'PAUSED' } }),
      prisma.supportConversation.count({ where: { status: 'OPEN' } }),
      prisma.supportConversation.count({ where: { status: 'PENDING' } }),
      prisma.supportConversation.count({ where: { status: 'RESOLVED' } }),
      prisma.supportConversation.count({ where: { priority: 'HIGH', status: { in: ['OPEN', 'PENDING'] } } }),
      prisma.supportConversation.count({ where: { assignedToId: null, status: { in: ['OPEN', 'PENDING'] } } }),
      prisma.supportConversation.count({ where: { assignedToId: { not: null }, status: { in: ['OPEN', 'PENDING'] } } }),
      prisma.partnershipCode.count(),
      prisma.partnershipCode.count({ where: { status: 'ACTIVE' } }),
      prisma.partnershipCode.count({ where: { status: 'EXPIRED' } }),
      prisma.partnershipHealthScore.findMany({
        orderBy: { score: 'desc' },
        take: 10,
        include: { partnership: { select: { name: true, partnerType: true, status: true } } },
      }),
      prisma.branch.findMany({
        take: 5,
        include: { business: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      CustomerHealthScoreService.getDistribution(),
      prisma.partnershipPayout.count({ where: { status: 'PENDING' } }),
      prisma.partnership.count({ where: { createdAt: { gte: subDays(new Date(), 1) } } }),
      prisma.supportConversation.count({ where: { status: 'RESOLVED', updatedAt: { gte: subDays(new Date(), 1) } } }),
    ])

    // ─── Compute Operations Score ───
    let opsScore = 100
    if (paymentHealth === 'CRITICAL') opsScore -= 20
    else if (paymentHealth === 'WARNING') opsScore -= 10
    if (queueHealth === 'CRITICAL') opsScore -= 15
    else if (queueHealth === 'WARNING') opsScore -= 8
    if (reconciliationHealth === 'CRITICAL') opsScore -= 15
    else if (reconciliationHealth === 'WARNING') opsScore -= 8
    if (subscriptionHealth === 'CRITICAL') opsScore -= 10
    else if (subscriptionHealth === 'WARNING') opsScore -= 5
    if (pendingApplications > 10) opsScore -= 10
    if (openSupportConversations > 20) opsScore -= 10
    if (suspendedPartnerships > 0) opsScore -= 5
    const operationsScore = Math.max(0, Math.min(100, opsScore))

    // ─── Operational Health Areas ───
    const operationalHealth = [
      {
        area: 'Platform',
        health: queueHealth,
        trend: 'STABLE' as const,
        risk: queueHealth === 'CRITICAL' ? 'Queue backlog critical' : queueHealth === 'WARNING' ? 'Queue backlog growing' : 'No risks',
        link: '/admin/operations-intelligence',
      },
      {
        area: 'Hospitality Business Operations',
        health: inactiveBusinesses > activeBusinesses * 0.3 ? 'WARNING' : 'HEALTHY',
        trend: newBusinessesYesterday > 0 ? 'UP' : 'FLAT',
        risk: inactiveBusinesses > activeBusinesses * 0.3 ? `${inactiveBusinesses} inactive businesses` : 'No risks',
        link: '/admin/restaurants',
      },
      {
        area: 'Founder Operations',
        health: suspendedPartnerships > 0 ? 'WARNING' : pendingApplications > 5 ? 'WARNING' : 'HEALTHY',
        trend: newPartnershipsYesterday > 0 ? 'UP' : 'FLAT',
        risk: suspendedPartnerships > 0 ? `${suspendedPartnerships} suspended partners` : pendingApplications > 5 ? `${pendingApplications} pending applications` : 'No risks',
        link: '/admin/founder-partners',
      },
      {
        area: 'Support',
        health: openSupportConversations > 20 ? 'CRITICAL' : openSupportConversations > 10 ? 'WARNING' : 'HEALTHY',
        trend: resolvedSupportYesterday > 0 ? 'UP' : 'FLAT',
        risk: openSupportConversations > 20 ? `${openSupportConversations} open conversations` : unassignedSupport > 0 ? `${unassignedSupport} unassigned` : 'No risks',
        link: '/admin/support',
      },
      {
        area: 'Payments',
        health: paymentHealth,
        trend: 'STABLE' as const,
        risk: paymentHealth === 'CRITICAL' ? 'Payment system critical' : paymentHealth === 'WARNING' ? 'Payment issues detected' : 'No risks',
        link: '/admin/operations-intelligence',
      },
      {
        area: 'Revenue Operations',
        health: reconciliationHealth,
        trend: 'STABLE' as const,
        risk: reconciliationHealth === 'CRITICAL' ? 'Reconciliation critical' : reconciliationHealth === 'WARNING' ? 'Reconciliation behind' : 'No risks',
        link: '/admin/revenue-operations',
      },
      {
        area: 'Internal Teams',
        health: unassignedSupport > 5 ? 'WARNING' : 'HEALTHY',
        trend: 'STABLE' as const,
        risk: unassignedSupport > 5 ? `${unassignedSupport} unassigned support items` : 'No risks',
        link: '/admin/users',
      },
    ]

    // ─── Workflow Performance ───
    const workflows = [
      {
        name: 'Application → Approval',
        currentDuration: '2-5 days',
        targetDuration: '3 days',
        trend: pendingApplications > 10 ? 'SLOW' : 'ON_TRACK',
        bottleneck: pendingApplications > 10 ? `${pendingApplications} pending applications` : 'None',
        link: '/admin/partnership-applications',
      },
      {
        name: 'Approval → Activation',
        currentDuration: '1-3 days',
        targetDuration: '2 days',
        trend: onboardedPartnerships > 0 ? 'ON_TRACK' : 'SLOW',
        bottleneck: appliedPartnerships > 5 ? `${appliedPartnerships} in APPLIED status` : 'None',
        link: '/admin/founder-partners',
      },
      {
        name: 'Activation → Campaign',
        currentDuration: '3-7 days',
        targetDuration: '5 days',
        trend: draftCampaigns > activeCampaigns ? 'SLOW' : 'ON_TRACK',
        bottleneck: draftCampaigns > 0 ? `${draftCampaigns} draft campaigns` : 'None',
        link: '/admin/founder-partners',
      },
      {
        name: 'Hospitality Business Signup → Active',
        currentDuration: '1-2 days',
        targetDuration: '1 day',
        trend: newBusinessesYesterday > 0 ? 'ON_TRACK' : 'SLOW',
        bottleneck: inactiveBusinesses > 0 ? `${inactiveBusinesses} inactive businesses` : 'None',
        link: '/admin/restaurants',
      },
      {
        name: 'Trial → Subscription',
        currentDuration: '30 days',
        targetDuration: '30 days',
        trend: subscriptionHealth === 'HEALTHY' ? 'ON_TRACK' : 'SLOW',
        bottleneck: subscriptionHealth !== 'HEALTHY' ? 'Subscription health issues' : 'None',
        link: '/admin/subscriptions',
      },
      {
        name: 'Commission → Payout',
        currentDuration: 'Monthly',
        targetDuration: 'Monthly',
        trend: pendingPayouts > 5 ? 'SLOW' : 'ON_TRACK',
        bottleneck: pendingPayouts > 0 ? `${pendingPayouts} pending payouts` : 'None',
        link: '/admin/payout-control',
      },
    ]

    // ─── Attention Items ───
    const attentionItems: Array<{
      title: string
      description: string
      severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
      action: string
      link: string
    }> = []

    if (paymentHealth === 'CRITICAL') {
      attentionItems.push({
        title: 'Payment system critical',
        description: 'Payment processing is experiencing critical failures.',
        severity: 'CRITICAL',
        action: 'Investigate payment system',
        link: '/admin/operations-intelligence',
      })
    }

    if (queueHealth === 'CRITICAL') {
      attentionItems.push({
        title: 'Queue backlog critical',
        description: 'Processing queues are critically backed up.',
        severity: 'CRITICAL',
        action: 'Review queue health',
        link: '/admin/operations-intelligence',
      })
    }

    if (pendingApplications > 5) {
      attentionItems.push({
        title: `${pendingApplications} applications pending review`,
        description: 'Founder partner applications are awaiting review.',
        severity: 'HIGH',
        action: 'Review applications',
        link: '/admin/partnership-applications',
      })
    }

    if (openSupportConversations > 15) {
      attentionItems.push({
        title: `${openSupportConversations} open support conversations`,
        description: 'Support backlog is growing.',
        severity: 'HIGH',
        action: 'Review support queue',
        link: '/admin/support',
      })
    }

    if (unassignedSupport > 3) {
      attentionItems.push({
        title: `${unassignedSupport} unassigned support conversations`,
        description: 'Support conversations have no assigned staff member.',
        severity: 'HIGH',
        action: 'Assign support staff',
        link: '/admin/support',
      })
    }

    if (highPrioritySupport > 0) {
      attentionItems.push({
        title: `${highPrioritySupport} high-priority support items`,
        description: 'High-priority support conversations need attention.',
        severity: 'HIGH',
        action: 'Handle high-priority items',
        link: '/admin/support',
      })
    }

    if (suspendedPartnerships > 0) {
      attentionItems.push({
        title: `${suspendedPartnerships} suspended partners`,
        description: 'Partnerships are currently suspended.',
        severity: 'MEDIUM',
        action: 'Review suspended partners',
        link: '/admin/founder-partners',
      })
    }

    if (inactiveBusinesses > activeBusinesses * 0.3) {
      attentionItems.push({
        title: `${inactiveBusinesses} inactive businesses`,
        description: 'Significant portion of businesses are inactive.',
        severity: 'MEDIUM',
        action: 'Review inactive businesses',
        link: '/admin/restaurants',
      })
    }

    if (pendingPayouts > 0) {
      attentionItems.push({
        title: `${pendingPayouts} pending payouts`,
        description: 'Partner payouts are awaiting approval.',
        severity: 'MEDIUM',
        action: 'Review payouts',
        link: '/admin/payout-control',
      })
    }

    if (expiringAgreements.length > 0) {
      attentionItems.push({
        title: `${expiringAgreements.length} agreements expiring within 30 days`,
        description: 'Partnership agreements need renewal review.',
        severity: 'LOW',
        action: 'Review expiring agreements',
        link: '/admin/founder-partners',
      })
    }

    // ─── AI Operations Assistant Recommendations ───
    const recommendations: Array<{
      question: string
      answer: string
      evidence: string[]
      confidence: number
      suggestedActions: string[]
    }> = []

    if (pendingApplications > 5) {
      recommendations.push({
        question: 'Where is the biggest operational bottleneck?',
        answer: `${pendingApplications} founder partner applications are pending review. This is the primary bottleneck in the onboarding pipeline.`,
        evidence: [
          `Pending applications: ${pendingApplications}`,
          `Under review: ${applicationsUnderReview}`,
          `Approved: ${approvedApplications}`,
        ],
        confidence: 85,
        suggestedActions: ['Review pending applications', 'Assign review staff', 'Prioritize oldest applications'],
      })
    }

    if (unassignedSupport > 3) {
      recommendations.push({
        question: 'What operational risk requires attention?',
        answer: `${unassignedSupport} support conversations are unassigned. Customers may experience delayed responses.`,
        evidence: [
          `Unassigned: ${unassignedSupport}`,
          `Open conversations: ${openSupportConversations}`,
          `High priority: ${highPrioritySupport}`,
        ],
        confidence: 80,
        suggestedActions: ['Assign support staff', 'Prioritize high-priority items', 'Review staffing levels'],
      })
    }

    if (operationsScore < 70) {
      recommendations.push({
        question: 'What should Operations do today?',
        answer: `Operations score is ${operationsScore}/100. Focus on resolving critical health issues first.`,
        evidence: [
          `Payment health: ${paymentHealth}`,
          `Queue health: ${queueHealth}`,
          `Reconciliation: ${reconciliationHealth}`,
          `Support: ${openSupportConversations} open`,
        ],
        confidence: 75,
        suggestedActions: ['Investigate critical systems', 'Clear support backlog', 'Review queue health'],
      })
    }

    if (inactiveBusinesses > activeBusinesses * 0.3 && activeBusinesses > 0) {
      recommendations.push({
        question: 'What operational improvement is recommended?',
        answer: `${Math.round((inactiveBusinesses / totalBusinesses) * 100)}% of businesses are inactive. Consider re-engagement campaigns.`,
        evidence: [
          `Active: ${activeBusinesses}`,
          `Inactive: ${inactiveBusinesses}`,
          `Total: ${totalBusinesses}`,
        ],
        confidence: 70,
        suggestedActions: ['Launch re-engagement campaign', 'Contact inactive businesses', 'Review onboarding quality'],
      })
    }

    // ─── Capacity Center ───
    const capacity = {
      supportWorkload: openSupportConversations + pendingSupport,
      pendingApprovals: pendingApplications,
      openInvestigations: suspendedPartnerships,
      dailyThroughput: newBusinessesYesterday + newPartnershipsYesterday,
      assignedSupport: supportAssignedTo,
      unassignedSupport,
      expansionReadiness: operationsScore >= 80 && openSupportConversations < 10,
    }

    // ─── Hospitality Business Operations ───
    const restaurantOps = {
      awaitingApproval: 0,
      inactiveBusinesses,
      activeBusinesses,
      totalBusinesses,
      newYesterday: newBusinessesYesterday,
      regionalDistribution: regionalPerformance,
      activationRate: totalBusinesses > 0 ? Math.round((activeBusinesses / totalBusinesses) * 100) : 0,
      followUpNeeded: await prisma.business.count({
        where: {
          isActive: true,
          followUpDay10Done: false,
          createdAt: { lte: subDays(new Date(), 10) },
        },
      }),
    }

    // ─── Founder Operations ───
    const founderOps = {
      applications: {
        pending: pendingApplications,
        underReview: applicationsUnderReview,
        approved: approvedApplications,
        rejected: rejectedApplications,
      },
      activationPipeline: {
        applied: appliedPartnerships,
        onboarded: onboardedPartnerships,
        active: activePartnerships,
        suspended: suspendedPartnerships,
      },
      agreementStatus: {
        pending: pendingAgreements,
        active: activeAgreements,
        expired: expiredAgreements,
      },
      campaignReadiness: {
        draft: draftCampaigns,
        active: activeCampaigns,
        paused: pausedCampaigns,
      },
      codeGeneration: {
        total: totalCodes,
        active: activeCodes,
        expired: expiredCodes,
      },
      partnerHealth: partnershipHealthScores.map((h: any) => ({
        partnerName: h.partnership?.name || 'Unknown',
        score: h.score,
        grade: h.grade,
        trend: h.trendDirection || 'STABLE',
        status: h.partnership?.status || 'UNKNOWN',
      })),
      operationalDelays: pendingApplications > 5 ? `${pendingApplications} applications pending` : 'None',
    }

    // ─── Support Operations ───
    const supportOps = {
      openTickets: openSupportConversations,
      pendingTickets: pendingSupport,
      resolvedTickets: resolvedSupport,
      highPriority: highPrioritySupport,
      unassigned: unassignedSupport,
      assigned: supportAssignedTo,
      resolvedYesterday: resolvedSupportYesterday,
      slaCompliance: resolvedSupport > 0 ? Math.round((resolvedSupport / (openSupportConversations + pendingSupport + resolvedSupport)) * 100) : 100,
      workload: openSupportConversations + pendingSupport,
    }

    return res.status(200).json({
      operationsScore,
      dailySummary,
      weeklySummary,
      paymentHealth,
      queueHealth,
      reconciliationHealth,
      subscriptionHealth,
      operationalHealth,
      restaurantOps,
      founderOps,
      supportOps,
      workflows,
      capacity,
      attentionItems,
      recommendations,
      branchHealthScores: branchHealthScores.map((b: any) => ({
        name: b.name || 'Unknown',
        businessName: b.business?.name || 'Unknown',
        score: 0,
      })),
      customerHealthDistribution,
      partnersRequiringAttention,
      expiringAgreements,
      generatedAt: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('[COO API] Error:', error)
    return res.status(500).json({ error: 'Failed to generate COO intelligence' })
  }
}

export default handler
