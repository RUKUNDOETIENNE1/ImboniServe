import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { ExecutiveSummaryService } from '@/lib/services/intelligence/executive-summary.service'
import { FinancialHealthService } from '@/lib/services/intelligence/financial-health.service'
import { FinancialPrioritiesService } from '@/lib/services/intelligence/financial-priorities.service'
import { CustomerHealthScoreService } from '@/lib/services/intelligence/customer-health-score.service'
import { SubscriptionIntelligenceService } from '@/lib/services/intelligence/subscription-intelligence.service'
import { PartnershipOperationalQueryService } from '@/lib/services/partnership-operational-query.service'
import { PaymentWatchdogService } from '@/lib/services/watchdog/payment-watchdog.service'
import { QueueWatchdogService } from '@/lib/services/watchdog/queue-watchdog.service'
import { ReconciliationWatchdogService } from '@/lib/services/watchdog/reconciliation-watchdog.service'
import { SubscriptionWatchdogService } from '@/lib/services/watchdog/subscription-watchdog.service'
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
  const allowed = ['CEO', 'ADMIN', 'EXECUTIVE']
  if (!userRoles.some((r: string) => allowed.includes(r))) {
    return res.status(403).json({ error: 'Insufficient permissions' })
  }

  try {
    const now = new Date()
    const sevenDaysAgo = subDays(now, 7)
    const thirtyDaysAgo = subDays(now, 30)
    const sixtyDaysAgo = subDays(now, 60)
    const ninetyDaysAgo = subDays(now, 90)

    // ─── Compose all services in parallel (same services as all 6 centers) ─────
    const [
      dailySummary,
      weeklySummary,
      financialHealth,
      financialPriorities,
      customerHealthDistribution,
      subscriptionIntelligence,
      topPartnersByRevenue,
      topPartnersBySignups,
      campaignPerformance,
      regionalPerformance,
      partnershipTypeLTV,
      cacByPartnerType,
      commissionSummary,
      totalCommissionLiability,
      partnersRequiringAttention,
      expiringAgreements,
      paymentHealth,
      queueHealth,
      reconciliationHealth,
      subscriptionHealth,
      activeBusinesses,
      totalBusinesses,
      inactiveBusinesses,
      newBusinesses7d,
      newBusinesses30d,
      trialBusinesses,
      activeSubscriptions,
      trialSubscriptions,
      gracePeriodSubscriptions,
      pastDueSubscriptions,
      cancelledSubscriptions30d,
      activePartners,
      totalPartnerships,
      suspendedPartnerships,
      pendingApplications,
      activeCampaigns,
      draftCampaigns,
      totalBranches,
      activeBranches,
      totalCustomers,
      activeCustomers30d,
      dormantCustomers90d,
      newCustomers7d,
      openSupportConversations,
      highPrioritySupport,
      totalUsers,
      activeUsers7d,
      businessesWithRecentSales,
      totalSales7d,
      qrEnabledBusinesses,
      remoteOrderEnabledBusinesses,
      lowActivityBusinesses,
      noRecentActivityBusinesses,
      pendingPayouts,
    ] = await Promise.all([
      ExecutiveSummaryService.generateDailySummary(),
      ExecutiveSummaryService.generateWeeklySummary(),
      FinancialHealthService.getMetrics(),
      FinancialPrioritiesService.getTopPriorities(5),
      CustomerHealthScoreService.getDistribution(),
      SubscriptionIntelligenceService.getIntelligence(),
      PartnershipOperationalQueryService.getTopPartners({ metric: 'revenue', limit: 5 }),
      PartnershipOperationalQueryService.getTopPartners({ metric: 'signups', limit: 5 }),
      PartnershipOperationalQueryService.getCampaignPerformance(10),
      PartnershipOperationalQueryService.getRegionalPerformance(),
      PartnershipOperationalQueryService.getPartnershipTypeLTV(),
      PartnershipOperationalQueryService.getCACByPartnerType(),
      PartnershipOperationalQueryService.getCommissionSummary(),
      PartnershipOperationalQueryService.getTotalCommissionLiability(),
      PartnershipOperationalQueryService.getPartnersRequiringAttention(),
      PartnershipOperationalQueryService.getExpiringAgreements(30),
      PaymentWatchdogService.getHealth(),
      QueueWatchdogService.getHealth(),
      ReconciliationWatchdogService.getHealth(),
      SubscriptionWatchdogService.getHealth(),
      prisma.business.count({ where: { isActive: true } }),
      prisma.business.count(),
      prisma.business.count({ where: { isActive: false } }),
      prisma.business.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.business.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.business.count({ where: { trialEndDate: { gte: now } } }),
      prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      prisma.subscription.count({ where: { status: 'TRIAL' } }),
      prisma.subscription.count({ where: { status: 'GRACE_PERIOD' } }),
      prisma.subscription.count({ where: { status: 'PAST_DUE' } }),
      prisma.subscription.count({ where: { status: 'CANCELLED', updatedAt: { gte: thirtyDaysAgo } } }),
      prisma.partnership.count({ where: { status: 'ACTIVE' } }),
      prisma.partnership.count(),
      prisma.partnership.count({ where: { status: 'SUSPENDED' } }),
      prisma.partnershipApplication.count({ where: { status: 'SUBMITTED' } }),
      prisma.partnershipCampaign.count({ where: { status: 'ACTIVE' } }),
      prisma.partnershipCampaign.count({ where: { status: 'DRAFT' } }),
      prisma.branch.count(),
      prisma.branch.count({ where: { isActive: true } }),
      prisma.customer.count(),
      prisma.customer.count({ where: { lastVisit: { gte: thirtyDaysAgo } } }),
      prisma.customer.count({ where: { lastVisit: { lt: ninetyDaysAgo } } }),
      prisma.customer.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.supportConversation.count({ where: { status: 'OPEN' } }),
      prisma.supportConversation.count({ where: { status: 'OPEN', priority: 'HIGH' } }),
      prisma.user.count({ where: { business: { isNot: null } } }),
      prisma.user.count({ where: { business: { isNot: null }, updatedAt: { gte: sevenDaysAgo } } }),
      prisma.business.count({ where: { sales: { some: { createdAt: { gte: sevenDaysAgo } } } } }),
      prisma.sale.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.business.count({ where: { enableQRInVenue: true } }),
      prisma.business.count({ where: { enableQRRemote: true } }),
      prisma.business.count({ where: { isActive: true, updatedAt: { lt: thirtyDaysAgo } } }),
      prisma.business.count({ where: { isActive: true, updatedAt: { lt: sixtyDaysAgo } } }),
      prisma.partnershipPayout.count({ where: { status: 'PENDING' } }),
    ])

    // ─── Compute Center Health Scores ────────────────────────────────
    const retentionRate = activeSubscriptions + cancelledSubscriptions30d > 0
      ? Math.round((activeSubscriptions / (activeSubscriptions + cancelledSubscriptions30d)) * 100)
      : 100
    const churnRate = activeSubscriptions + cancelledSubscriptions30d > 0
      ? Math.round((cancelledSubscriptions30d / (activeSubscriptions + cancelledSubscriptions30d)) * 100)
      : 0
    const adoptionRate = totalBusinesses > 0
      ? Math.round((businessesWithRecentSales / totalBusinesses) * 100)
      : 0
    const activeRatio = totalBusinesses > 0
      ? Math.round((activeBusinesses / totalBusinesses) * 100)
      : 0

    // Finance health score (from CFO center)
    const financeScore = computeFinanceScore(financialHealth)
    // Operations health score (from COO center)
    const operationsScore = computeOpsScore(paymentHealth, queueHealth, reconciliationHealth)
    // Growth health score (from CMO center)
    const growthScore = computeGrowthScore(weeklySummary, newBusinesses7d, activeCampaigns)
    // Partnership health score (from Partnership Director center)
    const partnershipScore = computePartnershipScore(activePartners, totalPartnerships, suspendedPartnerships, activeCampaigns, expiringAgreements)
    // Customer success health score (from Customer Success Director center)
    const customerSuccessScore = computeCustomerSuccessScore(activeBusinesses, totalBusinesses, inactiveBusinesses, gracePeriodSubscriptions, pastDueSubscriptions, cancelledSubscriptions30d, lowActivityBusinesses, noRecentActivityBusinesses)

    const centerScores = {
      finance: { score: financeScore, status: scoreToStatus(financeScore), center: 'CFO' },
      operations: { score: operationsScore, status: scoreToStatus(operationsScore), center: 'COO' },
      growth: { score: growthScore, status: scoreToStatus(growthScore), center: 'CMO' },
      partnership: { score: partnershipScore, status: scoreToStatus(partnershipScore), center: 'Partnership Director' },
      customerSuccess: { score: customerSuccessScore, status: scoreToStatus(customerSuccessScore), center: 'Customer Success Director' },
    }

    const allScores = Object.values(centerScores).map(c => c.score)
    const overallScore = Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
    const overallStatus = scoreToStatus(overallScore)

    // ─── Generate Cross-Center Executive Decisions ───────────────────
    const executiveDecisions = generateExecutiveDecisions({
      dailySummary, weeklySummary, financialHealth, financialPriorities,
      centerScores, overallScore,
      activeBusinesses, totalBusinesses, inactiveBusinesses, newBusinesses7d, newBusinesses30d,
      trialBusinesses, activeSubscriptions, trialSubscriptions, gracePeriodSubscriptions,
      pastDueSubscriptions, cancelledSubscriptions30d, retentionRate, churnRate,
      adoptionRate, activeRatio,
      activePartners, totalPartnerships, suspendedPartnerships, pendingApplications,
      activeCampaigns, draftCampaigns,
      totalCustomers, activeCustomers30d, dormantCustomers90d, newCustomers7d,
      openSupportConversations, highPrioritySupport,
      lowActivityBusinesses, noRecentActivityBusinesses,
      topPartnersByRevenue, topPartnersBySignups, campaignPerformance, regionalPerformance,
      partnershipTypeLTV, cacByPartnerType,
      commissionSummary, totalCommissionLiability,
      partnersRequiringAttention, expiringAgreements,
      paymentHealth, queueHealth, reconciliationHealth, subscriptionHealth,
      totalBranches, activeBranches, totalUsers, activeUsers7d,
      businessesWithRecentSales, totalSales7d,
      qrEnabledBusinesses, remoteOrderEnabledBusinesses, pendingPayouts,
    })

    // ─── Generate Executive Priority Queue ───────────────────────────
    const priorityQueue = generatePriorityQueue({
      centerScores, financialPriorities,
      gracePeriodSubscriptions, pastDueSubscriptions, cancelledSubscriptions30d,
      suspendedPartnerships, pendingApplications, pendingPayouts,
      expiringAgreements, trialBusinesses,
      lowActivityBusinesses, noRecentActivityBusinesses,
      highPrioritySupport, openSupportConversations,
      paymentHealth, queueHealth, reconciliationHealth,
      partnersRequiringAttention,
    })

    // ─── Generate Trend Explanations ─────────────────────────────────
    const trendExplanations = generateTrendExplanations({
      dailySummary, weeklySummary, financialHealth,
      newBusinesses7d, newBusinesses30d, newCustomers7d,
      activeBusinesses, inactiveBusinesses,
      activeSubscriptions, cancelledSubscriptions30d, gracePeriodSubscriptions,
      activeCampaigns, activePartners, retentionRate, churnRate, adoptionRate,
    })

    // ─── Generate Business Risks ─────────────────────────────────────
    const businessRisks = generateBusinessRisks({
      financialHealth, centerScores,
      gracePeriodSubscriptions, pastDueSubscriptions, cancelledSubscriptions30d,
      inactiveBusinesses, activeBusinesses,
      suspendedPartnerships, lowActivityBusinesses, noRecentActivityBusinesses,
      dormantCustomers90d, totalCustomers,
      paymentHealth, queueHealth, reconciliationHealth,
      churnRate, retentionRate,
    })

    // ─── Generate Growth Opportunities ───────────────────────────────
    const growthOpportunities = generateGrowthOpportunities({
      topPartnersByRevenue, topPartnersBySignups, campaignPerformance, regionalPerformance,
      partnershipTypeLTV, cacByPartnerType,
      trialBusinesses, draftCampaigns,
      qrEnabledBusinesses, remoteOrderEnabledBusinesses, totalBusinesses,
      activePartners, pendingApplications,
      newBusinesses7d, newBusinesses30d,
      activeCustomers30d, totalCustomers, dormantCustomers90d,
    })

    res.status(200).json({
      overallScore,
      overallStatus,
      centerScores,
      executiveDecisions,
      priorityQueue,
      trendExplanations,
      businessRisks,
      growthOpportunities,
      // Cross-center evidence
      financialHealth: {
        mrr: financialHealth.mrr,
        arr: financialHealth.arr,
        revenueChurn: financialHealth.revenueChurn,
        netRevenueRetention: financialHealth.netRevenueRetention,
        revenueGrowth: financialHealth.revenueGrowth,
      },
      operationalHealth: {
        paymentHealth,
        queueHealth,
        reconciliationHealth,
        subscriptionHealth,
      },
      subscriptionIntelligence,
      customerHealthDistribution,
      // Key metrics
      metrics: {
        activeBusinesses, totalBusinesses, inactiveBusinesses,
        newBusinesses7d, newBusinesses30d, trialBusinesses,
        activeSubscriptions, trialSubscriptions, gracePeriodSubscriptions,
        pastDueSubscriptions, cancelledSubscriptions30d,
        retentionRate, churnRate, adoptionRate, activeRatio,
        activePartners, totalPartnerships, suspendedPartnerships,
        pendingApplications, activeCampaigns, draftCampaigns,
        totalCustomers, activeCustomers30d, dormantCustomers90d, newCustomers7d,
        openSupportConversations, highPrioritySupport,
        totalBranches, activeBranches, totalUsers, activeUsers7d,
        businessesWithRecentSales, totalSales7d,
        qrEnabledBusinesses, remoteOrderEnabledBusinesses,
        lowActivityBusinesses, noRecentActivityBusinesses, pendingPayouts,
      },
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[executive-intelligence API]', error)
    return res.status(500).json({ error: 'Failed to generate executive intelligence' })
  }
}

export default handler

// ─── Score Computation ───────────────────────────────────────────────────

function scoreToStatus(score: number): 'HEALTHY' | 'WARNING' | 'CRITICAL' {
  if (score >= 70) return 'HEALTHY'
  if (score >= 40) return 'WARNING'
  return 'CRITICAL'
}

function computeFinanceScore(fh: any): number {
  let s = 50
  if (fh.mrr?.status === 'GROWTH') s += 20
  else if (fh.mrr?.status === 'DECLINE') s -= 20
  if (fh.netRevenueRetention?.rate >= 100) s += 15
  else if (fh.netRevenueRetention?.rate < 90) s -= 15
  if (fh.revenueChurn?.status === 'HEALTHY') s += 10
  else if (fh.revenueChurn?.status === 'CRITICAL') s -= 10
  if (fh.revenueGrowth?.status === 'STRONG') s += 5
  else if (fh.revenueGrowth?.status === 'NEGATIVE') s -= 5
  return Math.max(0, Math.min(100, s))
}

function computeOpsScore(payment: string, queue: string, reconciliation: string): number {
  let s = 100
  if (payment === 'CRITICAL') s -= 35
  else if (payment === 'WARNING') s -= 15
  if (queue === 'CRITICAL') s -= 30
  else if (queue === 'WARNING') s -= 12
  if (reconciliation === 'CRITICAL') s -= 25
  else if (reconciliation === 'WARNING') s -= 10
  return Math.max(0, s)
}

function computeGrowthScore(weekly: any, newBiz7d: number, activeCampaigns: number): number {
  let s = 50
  if (weekly.revenue?.trend === 'UP') s += 15
  else if (weekly.revenue?.trend === 'DOWN') s -= 15
  if (weekly.customers?.netChange > 0) s += 10
  else if (weekly.customers?.netChange < 0) s -= 10
  if (newBiz7d > 0) s += 10
  if (activeCampaigns > 0) s += 10
  if (activeCampaigns > 3) s += 5
  return Math.max(0, Math.min(100, s))
}

function computePartnershipScore(active: number, total: number, suspended: number, campaigns: number, expiring: any[]): number {
  let s = 40
  if (total > 0) {
    const activeRate = active / total
    if (activeRate > 0.7) s += 20
    else if (activeRate > 0.5) s += 15
    else if (activeRate > 0.3) s += 8
    else s -= 10
  }
  if (suspended === 0) s += 10
  else if (suspended > 3) s -= 15
  if (campaigns > 0) s += 10
  if (campaigns > 3) s += 5
  if (!expiring || expiring.length === 0) s += 5
  else if (expiring.length > 5) s -= 10
  return Math.max(0, Math.min(100, s))
}

function computeCustomerSuccessScore(activeBiz: number, totalBiz: number, inactiveBiz: number, grace: number, pastDue: number, cancelled30d: number, lowAct: number, noAct: number): number {
  let s = 40
  if (totalBiz > 0) {
    const r = activeBiz / totalBiz
    if (r > 0.8) s += 20
    else if (r > 0.6) s += 15
    else if (r > 0.4) s += 8
    else s -= 10
  }
  if (inactiveBiz / Math.max(totalBiz, 1) < 0.1) s += 10
  else if (inactiveBiz / Math.max(totalBiz, 1) > 0.3) s -= 15
  if (grace === 0 && pastDue === 0) s += 10
  else if (grace > 5 || pastDue > 3) s -= 10
  if (cancelled30d === 0) s += 5
  else if (cancelled30d > 5) s -= 10
  if (noAct > activeBiz * 0.3) s -= 10
  return Math.max(0, Math.min(100, s))
}

// ─── Cross-Center Executive Decisions ────────────────────────────────────

function generateExecutiveDecisions(p: any): Array<{
  decision: string
  evidence: Array<{ source: string; metric: string; value: string }>
  reasoning: string
  confidence: number
  expectedImpact: string
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  suggestedActions: string[]
  centers: string[]
}> {
  const decisions: Array<{
    decision: string
    evidence: Array<{ source: string; metric: string; value: string }>
    reasoning: string
    confidence: number
    expectedImpact: string
    priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
    suggestedActions: string[]
    centers: string[]
  }> = []

  // 1. Revenue + Growth + Partnership = Marketing ROI cross-center decision
  const revenueTrend = p.weeklySummary?.revenue?.trend || 'FLAT'
  const revenueChange = p.weeklySummary?.revenue?.changePercent || 0
  const topCampaign = p.campaignPerformance?.[0]
  const topPartner = p.topPartnersByRevenue?.[0]

  if (revenueTrend !== 'FLAT' || p.activeCampaigns > 0) {
    const revenueDir = revenueTrend === 'UP' ? 'growing' : revenueTrend === 'DOWN' ? 'declining' : 'stable'
    decisions.push({
      decision: revenueTrend === 'DOWN'
        ? 'Investigate revenue decline — identify root cause across growth and partnership channels.'
        : revenueTrend === 'UP'
          ? 'Revenue is growing — identify which channels to double down on.'
          : 'Revenue is stable — identify growth acceleration opportunities.',
      evidence: [
        { source: 'CFO Center', metric: 'Revenue Trend', value: `${revenueDir} (${revenueChange >= 0 ? '+' : ''}${revenueChange.toFixed(1)}%)` },
        { source: 'CFO Center', metric: 'MRR', value: `${Math.round((p.financialHealth?.mrr?.value || 0) / 100).toLocaleString()} RWF` },
        { source: 'CMO Center', metric: 'Active Campaigns', value: p.activeCampaigns.toString() },
        { source: 'Partnership Director', metric: 'Active Partners', value: p.activePartners.toString() },
        ...(topCampaign ? [{ source: 'CMO Center', metric: 'Top Campaign', value: `${topCampaign.name || 'N/A'} (${topCampaign.conversions || 0} conversions)` }] : []),
        ...(topPartner ? [{ source: 'Partnership Director', metric: 'Top Partner', value: `${topPartner.name || 'N/A'} (${Math.round((topPartner.totalRevenueCents || 0) / 100).toLocaleString()} RWF)` }] : []),
      ],
      reasoning: revenueTrend === 'DOWN'
        ? `Revenue declined ${Math.abs(revenueChange).toFixed(1)}% this week. Cross-referencing CMO campaign data (${p.activeCampaigns} active campaigns) and Partnership Director data (${p.activePartners} active partners) suggests the decline may stem from ${p.cancelledSubscriptions30d > 0 ? `${p.cancelledSubscriptions30d} recent subscription cancellations` : 'reduced acquisition'} rather than a marketing spend issue.`
        : `Revenue ${revenueDir} at ${Math.abs(revenueChange).toFixed(1)}%. ${topCampaign ? `Top campaign "${topCampaign.name}" drives ${topCampaign.conversions || 0} conversions.` : ''} ${topPartner ? `Top partner "${topPartner.name}" generates ${Math.round((topPartner.totalRevenueCents || 0) / 100).toLocaleString()} RWF.` : ''}`,
      confidence: 80,
      expectedImpact: revenueTrend === 'DOWN'
        ? 'Addressing root cause could recover 5-15% revenue within 30 days.'
        : 'Doubling down on top channels could accelerate growth by 10-20%.',
      priority: revenueTrend === 'DOWN' ? 'HIGH' : 'MEDIUM',
      suggestedActions: revenueTrend === 'DOWN'
        ? ['Analyze cancellation reasons via Customer Success', 'Review campaign ROI via CMO', 'Check payment failures via COO']
        : ['Scale top-performing campaign', 'Increase investment in top partner', 'Replicate winning strategy in new regions'],
      centers: ['CFO', 'CMO', 'Partnership Director'],
    })
  }

  // 2. Customer Success + Finance = Churn + Revenue Risk
  if (p.churnRate > 3 || p.gracePeriodSubscriptions > 0 || p.pastDueSubscriptions > 0 || p.cancelledSubscriptions30d > 0) {
    decisions.push({
      decision: 'Address retention risk — churn and payment failures are impacting revenue stability.',
      evidence: [
        { source: 'Customer Success', metric: 'Retention Rate', value: `${p.retentionRate}%` },
        { source: 'Customer Success', metric: 'Churn Rate', value: `${p.churnRate}%` },
        { source: 'CFO Center', metric: 'Revenue Churn', value: `${p.financialHealth?.revenueChurn?.rate?.toFixed(1) || 0}%` },
        { source: 'Customer Success', metric: 'Grace Period Subscriptions', value: p.gracePeriodSubscriptions.toString() },
        { source: 'Customer Success', metric: 'Past Due Subscriptions', value: p.pastDueSubscriptions.toString() },
        { source: 'Customer Success', metric: 'Cancellations (30d)', value: p.cancelledSubscriptions30d.toString() },
      ],
      reasoning: `Retention is at ${p.retentionRate}% with ${p.cancelledSubscriptions30d} cancellations in 30 days. ${p.gracePeriodSubscriptions} subscriptions in grace period represent at-risk revenue. ${p.pastDueSubscriptions} past due subscriptions indicate payment collection issues that require both Customer Success outreach and COO payment system review.`,
      confidence: 85,
      expectedImpact: `Recovering ${p.gracePeriodSubscriptions + p.pastDueSubscriptions} at-risk subscriptions could protect ${((p.gracePeriodSubscriptions + p.pastDueSubscriptions) * 5000 / 100).toLocaleString()} RWF in MRR.`,
      priority: p.pastDueSubscriptions > 3 || p.churnRate > 10 ? 'CRITICAL' : 'HIGH',
      suggestedActions: [
        p.gracePeriodSubscriptions > 0 ? `Initiate rescue outreach for ${p.gracePeriodSubscriptions} grace period subscriptions` : '',
        p.pastDueSubscriptions > 0 ? `Resolve payment issues for ${p.pastDueSubscriptions} past due subscriptions` : '',
        'Conduct exit interviews with recently cancelled customers',
        'Review payment retry logic with COO',
      ].filter(Boolean),
      centers: ['Customer Success Director', 'CFO', 'COO'],
    })
  }

  // 3. Partnership + Customer Success + CMO = Acquisition Quality
  if (p.activePartners > 0 && p.totalBusinesses > 0) {
    const partnerAcquisitionRate = p.newBusinesses30d > 0 ? Math.round((p.newBusinesses30d / Math.max(p.activePartners, 1)) * 10) / 10 : 0
    decisions.push({
      decision: p.lowActivityBusinesses > p.activeBusinesses * 0.2
        ? 'Improve onboarding quality — high acquisition but low adoption suggests onboarding gaps.'
        : 'Partner acquisition quality is healthy — focus on scaling proven channels.',
      evidence: [
        { source: 'Partnership Director', metric: 'Active Partners', value: p.activePartners.toString() },
        { source: 'CMO Center', metric: 'New Businesses (30d)', value: p.newBusinesses30d.toString() },
        { source: 'Customer Success', metric: 'Adoption Rate', value: `${p.adoptionRate}%` },
        { source: 'Customer Success', metric: 'Low Activity Businesses', value: p.lowActivityBusinesses.toString() },
        { source: 'Customer Success', metric: 'No Activity (60d+)', value: p.noRecentActivityBusinesses.toString() },
      ],
      reasoning: `${p.activePartners} active partners generated ${p.newBusinesses30d} new businesses in 30 days (${partnerAcquisitionRate} per partner). However, ${p.lowActivityBusinesses} businesses show low activity and ${p.noRecentActivityBusinesses} have no activity in 60+ days. ${p.lowActivityBusinesses > p.activeBusinesses * 0.2 ? 'This suggests the bottleneck is post-acquisition onboarding, not acquisition volume.' : 'Acquisition quality is healthy — businesses are activating and engaging.'}`,
      confidence: 75,
      expectedImpact: p.lowActivityBusinesses > p.activeBusinesses * 0.2
        ? 'Improving onboarding completion could increase active business rate by 15-25%.'
        : 'Scaling proven partner channels could increase acquisition by 20-30%.',
      priority: p.lowActivityBusinesses > p.activeBusinesses * 0.3 ? 'HIGH' : 'MEDIUM',
      suggestedActions: p.lowActivityBusinesses > p.activeBusinesses * 0.2
        ? ['Invest in onboarding improvement rather than marketing spend', 'Provide post-activation training programs', 'Assign success managers to new businesses']
        : ['Scale top-performing partner channels', 'Launch draft campaigns', 'Expand to underpenetrated regions'],
      centers: ['Partnership Director', 'Customer Success Director', 'CMO'],
    })
  }

  // 4. Operations + Finance = Operational Cost Drivers
  if (p.paymentHealth !== 'HEALTHY' || p.queueHealth !== 'HEALTHY' || p.reconciliationHealth !== 'HEALTHY') {
    const unhealthySystems = [
      p.paymentHealth !== 'HEALTHY' ? `Payment (${p.paymentHealth})` : '',
      p.queueHealth !== 'HEALTHY' ? `Queue (${p.queueHealth})` : '',
      p.reconciliationHealth !== 'HEALTHY' ? `Reconciliation (${p.reconciliationHealth})` : '',
    ].filter(Boolean)

    decisions.push({
      decision: `Resolve operational issues in ${unhealthySystems.join(', ')} — they may be impacting revenue collection and customer experience.`,
      evidence: [
        { source: 'COO Center', metric: 'Payment Health', value: p.paymentHealth },
        { source: 'COO Center', metric: 'Queue Health', value: p.queueHealth },
        { source: 'COO Center', metric: 'Reconciliation Health', value: p.reconciliationHealth },
        { source: 'CFO Center', metric: 'Failed Renewals', value: (p.dailySummary?.subscriptions?.failedRenewals || 0).toString() },
        { source: 'Customer Success', metric: 'Grace Period Subs', value: p.gracePeriodSubscriptions.toString() },
      ],
      reasoning: `${unhealthySystems.length} operational system${unhealthySystems.length > 1 ? 's are' : ' is'} degraded. This directly impacts revenue: ${p.dailySummary?.subscriptions?.failedRenewals || 0} failed renewals may be caused by payment system issues, and ${p.gracePeriodSubscriptions} grace period subscriptions could escalate to cancellations if not resolved.`,
      confidence: 90,
      expectedImpact: 'Resolving operational issues could prevent 10-30% of at-risk subscriptions from churning.',
      priority: unhealthySystems.some(s => s.includes('CRITICAL')) ? 'CRITICAL' : 'HIGH',
      suggestedActions: [
        p.paymentHealth !== 'HEALTHY' ? 'Investigate payment processing failures and retry logic' : '',
        p.queueHealth !== 'HEALTHY' ? 'Review queue backlogs and processing delays' : '',
        p.reconciliationHealth !== 'HEALTHY' ? 'Address reconciliation discrepancies' : '',
        'Coordinate with CFO on revenue impact assessment',
      ].filter(Boolean),
      centers: ['COO', 'CFO', 'Customer Success Director'],
    })
  }

  // 5. CEO-level strategic — company health synthesis
  decisions.push({
    decision: p.overallScore >= 70
      ? 'Company health is strong — focus on expansion and strategic growth initiatives.'
      : p.overallScore >= 40
        ? 'Company health needs attention — prioritize the weakest operational area before investing in growth.'
        : 'Company health is critical — stabilize operations before any growth initiatives.',
    evidence: Object.entries(p.centerScores).map(([key, val]: [string, any]) => ({
      source: `${val.center}`,
      metric: `${key.charAt(0).toUpperCase() + key.slice(1)} Score`,
      value: `${val.score}/100 (${val.status})`,
    })),
    reasoning: `Overall company health is ${p.overallScore}/100 (${scoreToStatus(p.overallScore)}). ${
      Object.entries(p.centerScores)
        .filter(([, v]: [string, any]) => v.status === 'CRITICAL')
        .map(([k, v]: [string, any]) => `${v.center} is critical at ${v.score}/100`)
        .join('. ') || 'No centers are in critical state.'
    }. ${
      Object.entries(p.centerScores)
        .filter(([, v]: [string, any]) => v.status === 'WARNING')
        .map(([k, v]: [string, any]) => `${v.center} needs attention at ${v.score}/100`)
        .join('. ') || ''
    }`,
    confidence: 85,
    expectedImpact: p.overallScore >= 70
      ? 'Strategic investments in growth can yield 15-25% revenue increase in the next quarter.'
      : 'Stabilizing weak areas first will create a foundation for sustainable growth.',
    priority: p.overallScore < 40 ? 'CRITICAL' : p.overallScore < 70 ? 'HIGH' : 'MEDIUM',
    suggestedActions: [
      ...Object.entries(p.centerScores)
        .filter(([, v]: [string, any]) => v.status === 'CRITICAL')
        .map(([k, v]: [string, any]) => `Address critical issues in ${v.center} (score: ${v.score}/100)`),
      ...Object.entries(p.centerScores)
        .filter(([, v]: [string, any]) => v.status === 'WARNING')
        .map(([k, v]: [string, any]) => `Review warnings in ${v.center} (score: ${v.score}/100)`),
      p.overallScore >= 70 ? 'Focus leadership time on strategic growth initiatives' : 'Stabilize before expanding',
    ],
    centers: ['CEO', 'CFO', 'COO', 'CMO', 'Partnership Director', 'Customer Success Director'],
  })

  // 6. Growth + Customer Success = Where to expand
  if (p.regionalPerformance && p.regionalPerformance.length > 0) {
    const topRegion = p.regionalPerformance[0]
    const underperforming = p.regionalPerformance.filter((r: any) => (r.signups || 0) < 3)
    decisions.push({
      decision: underperforming.length > 0
        ? `Expand into ${underperforming.length} underpenetrated region${underperforming.length > 1 ? 's' : ''} while maintaining strength in top-performing areas.`
        : 'All regions are performing — optimize existing presence for deeper penetration.',
      evidence: [
        { source: 'CMO Center', metric: 'Top Region', value: `${topRegion.region || topRegion.city || 'N/A'} (${topRegion.signups || 0} signups)` },
        { source: 'CMO Center', metric: 'Underpenetrated Regions', value: underperforming.length.toString() },
        { source: 'Customer Success', metric: 'Active Businesses', value: p.activeBusinesses.toString() },
        { source: 'Partnership Director', metric: 'Regional Partners', value: p.activePartners.toString() },
      ],
      reasoning: `Regional analysis shows ${p.regionalPerformance.length} active regions. ${topRegion.region || topRegion.city || 'Top region'} leads with ${topRegion.signups || 0} signups. ${underperforming.length > 0 ? `${underperforming.length} regions have fewer than 3 signups — these represent expansion opportunities where partnership and marketing investment could yield high returns.` : 'All regions are performing above threshold.'}`,
      confidence: 70,
      expectedImpact: underperforming.length > 0
        ? `Regional expansion could add ${underperforming.length * 5}+ new hospitality businesses in underserved markets.`
        : 'Deepening presence in existing regions could increase per-region revenue by 10-15%.',
      priority: 'MEDIUM',
      suggestedActions: underperforming.length > 0
        ? ['Deploy partners to underpenetrated regions', 'Launch targeted campaigns for new markets', 'Provide regional onboarding support']
        : ['Increase partner density in top regions', 'Launch upsell campaigns in strongest markets'],
      centers: ['CMO', 'Partnership Director', 'Customer Success Director'],
    })
  }

  // 7. Weekly focus recommendation
  const weakestCenter = Object.entries(p.centerScores)
    .sort(([, a]: [string, any], [, b]: [string, any]) => a.score - b.score)[0]
  const strongestCenter = Object.entries(p.centerScores)
    .sort(([, a]: [string, any], [, b]: [string, any]) => b.score - a.score)[0]

  if (weakestCenter && strongestCenter) {
    decisions.push({
      decision: `This week, focus leadership attention on ${(weakestCenter[1] as any).center} (weakest at ${(weakestCenter[1] as any).score}/100) while leveraging ${(strongestCenter[1] as any).center} momentum (strongest at ${(strongestCenter[1] as any).score}/100).`,
      evidence: [
        { source: (weakestCenter[1] as any).center, metric: 'Health Score', value: `${(weakestCenter[1] as any).score}/100 (${(weakestCenter[1] as any).status})` },
        { source: (strongestCenter[1] as any).center, metric: 'Health Score', value: `${(strongestCenter[1] as any).score}/100 (${(strongestCenter[1] as any).status})` },
      ],
      reasoning: `Cross-center analysis shows ${(weakestCenter[1] as any).center} as the area most needing attention (${(weakestCenter[1] as any).score}/100) while ${(strongestCenter[1] as any).center} is performing well (${(strongestCenter[1] as any).score}/100). Focusing on the weakest link will have the highest marginal impact on overall company health.`,
      confidence: 75,
      expectedImpact: `Improving ${(weakestCenter[1] as any).center} from ${(weakestCenter[1] as any).score} to ${Math.min((weakestCenter[1] as any).score + 15, 100)} would raise overall company health by ${Math.round(15 / 5)} points.`,
      priority: (weakestCenter[1] as any).status === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
      suggestedActions: [
        `Schedule deep-dive review with ${(weakestCenter[1] as any).center}`,
        `Identify top 3 actionable improvements in ${weakestCenter[0]}`,
        `Leverage ${(strongestCenter[1] as any).center} best practices for other areas`,
      ],
      centers: [(weakestCenter[1] as any).center, (strongestCenter[1] as any).center],
    })
  }

  return decisions
}

// ─── Priority Queue ──────────────────────────────────────────────────────

function generatePriorityQueue(p: any): Array<{
  title: string
  description: string
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  center: string
  action: string
  link: string
}> {
  const items: Array<{
    title: string
    description: string
    priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
    center: string
    action: string
    link: string
  }> = []

  // Critical operational issues
  if (p.paymentHealth === 'CRITICAL') {
    items.push({ title: 'Payment system critical', description: 'Payment processing is in critical state — revenue collection affected.', priority: 'CRITICAL', center: 'COO', action: 'Investigate payment failures', link: '/admin/operations-intelligence' })
  }
  if (p.queueHealth === 'CRITICAL') {
    items.push({ title: 'Queue system critical', description: 'Processing queue is in critical state — operations affected.', priority: 'CRITICAL', center: 'COO', action: 'Review queue backlogs', link: '/admin/operations-intelligence' })
  }
  if (p.reconciliationHealth === 'CRITICAL') {
    items.push({ title: 'Reconciliation critical', description: 'Financial reconciliation is in critical state.', priority: 'CRITICAL', center: 'COO', action: 'Address reconciliation issues', link: '/admin/operations-intelligence' })
  }

  // High-priority support
  if (p.highPrioritySupport > 0) {
    items.push({ title: `${p.highPrioritySupport} high-priority support issues`, description: 'High-priority customer issues require immediate attention.', priority: 'CRITICAL', center: 'Customer Success', action: 'Resolve high-priority support', link: '/admin/operations-intelligence' })
  }

  // Past due subscriptions
  if (p.pastDueSubscriptions > 0) {
    items.push({ title: `${p.pastDueSubscriptions} past due subscriptions`, description: 'Revenue at immediate risk from payment failures.', priority: 'CRITICAL', center: 'CFO', action: 'Resolve payment issues', link: '/admin/subscriptions' })
  }

  // Grace period
  if (p.gracePeriodSubscriptions > 0) {
    items.push({ title: `${p.gracePeriodSubscriptions} grace period subscriptions`, description: 'Subscriptions at risk of cancellation.', priority: 'HIGH', center: 'Customer Success', action: 'Initiate rescue outreach', link: '/admin/subscriptions' })
  }

  // Suspended partners
  if (p.suspendedPartnerships > 0) {
    items.push({ title: `${p.suspendedPartnerships} suspended partners`, description: 'Partners are suspended and may need intervention.', priority: 'HIGH', center: 'Partnership Director', action: 'Review suspended partners', link: '/admin/founder-partners' })
  }

  // Pending payouts
  if (p.pendingPayouts > 0) {
    items.push({ title: `${p.pendingPayouts} pending partner payouts`, description: 'Partner payouts awaiting approval.', priority: 'HIGH', center: 'Partnership Director', action: 'Approve payouts', link: '/admin/payout-control' })
  }

  // Cancelled subscriptions
  if (p.cancelledSubscriptions30d > 0) {
    items.push({ title: `${p.cancelledSubscriptions30d} cancellations in 30 days`, description: 'Recent cancellations indicate churn risk.', priority: 'HIGH', center: 'Customer Success', action: 'Analyze cancellation patterns', link: '/admin/subscriptions' })
  }

  // Pending applications
  if (p.pendingApplications > 0) {
    items.push({ title: `${p.pendingApplications} pending applications`, description: 'Partnership applications awaiting review.', priority: 'MEDIUM', center: 'Partnership Director', action: 'Review applications', link: '/admin/partnership-applications' })
  }

  // Expiring agreements
  if (p.expiringAgreements?.length > 0) {
    items.push({ title: `${p.expiringAgreements.length} agreements expiring in 30 days`, description: 'Partnership agreements need renewal.', priority: 'MEDIUM', center: 'Partnership Director', action: 'Review agreements', link: '/admin/founder-partners' })
  }

  // No activity businesses
  if (p.noRecentActivityBusinesses > 0) {
    items.push({ title: `${p.noRecentActivityBusinesses} businesses with no activity (60d+)`, description: 'At risk of churn.', priority: 'MEDIUM', center: 'Customer Success', action: 'Initiate re-engagement', link: '/admin/restaurants' })
  }

  // Low activity businesses
  if (p.lowActivityBusinesses > 0) {
    items.push({ title: `${p.lowActivityBusinesses} businesses with low activity (30d+)`, description: 'Adoption issues require training support.', priority: 'MEDIUM', center: 'Customer Success', action: 'Provide adoption support', link: '/admin/restaurants' })
  }

  // Financial priorities
  if (p.financialPriorities?.length > 0) {
    const top = p.financialPriorities[0]
    items.push({ title: top.title || 'Top financial priority', description: top.description || 'Financial metric needs attention.', priority: 'MEDIUM', center: 'CFO', action: top.action || 'Review financial priority', link: '/admin/revenue-operations' })
  }

  // Open support
  if (p.openSupportConversations > 5) {
    items.push({ title: `${p.openSupportConversations} open support conversations`, description: 'High support volume may indicate systemic issues.', priority: 'LOW', center: 'Customer Success', action: 'Review support queue', link: '/admin/operations-intelligence' })
  }

  const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
  return items.sort((a, b) => severityOrder[a.priority] - severityOrder[b.priority])
}

// ─── Trend Explanations ──────────────────────────────────────────────────

function generateTrendExplanations(p: any): Array<{
  metric: string
  trend: 'UP' | 'DOWN' | 'FLAT'
  explanation: string
  centers: string[]
}> {
  const trends: Array<{ metric: string; trend: 'UP' | 'DOWN' | 'FLAT'; explanation: string; centers: string[] }> = []

  const revTrend = p.weeklySummary?.revenue?.trend || 'FLAT'
  const revChange = p.weeklySummary?.revenue?.changePercent || 0
  trends.push({
    metric: 'Revenue',
    trend: revTrend,
    explanation: revTrend === 'UP'
      ? `Revenue grew ${Math.abs(revChange).toFixed(1)}% this week. ${p.newBusinesses7d} new businesses and ${p.activeCampaigns} active campaigns are driving growth. Retention at ${p.retentionRate}% supports continued momentum.`
      : revTrend === 'DOWN'
        ? `Revenue declined ${Math.abs(revChange).toFixed(1)}% this week. ${p.cancelledSubscriptions30d} cancellations and ${p.gracePeriodSubscriptions} grace period subscriptions are contributing factors. ${p.inactiveBusinesses} inactive businesses suggest adoption challenges.`
        : `Revenue is stable this week. ${p.newBusinesses7d} new businesses offset by ${p.cancelledSubscriptions30d} cancellations maintain equilibrium.`,
    centers: ['CFO', 'CMO', 'Customer Success Director'],
  })

  const custTrend = p.newCustomers7d > 5 ? 'UP' : p.newCustomers7d === 0 ? 'DOWN' : 'FLAT'
  trends.push({
    metric: 'Customer Acquisition',
    trend: custTrend,
    explanation: `${p.newCustomers7d} new customers in 7 days. ${p.newBusinesses7d} new hospitality businesses onboarded. ${p.activePartners} active partners driving acquisition through ${p.activeCampaigns} campaigns.`,
    centers: ['CMO', 'Partnership Director', 'Customer Success Director'],
  })

  const retTrend = p.churnRate > 5 ? 'DOWN' : p.churnRate === 0 ? 'UP' : 'FLAT'
  trends.push({
    metric: 'Retention',
    trend: retTrend,
    explanation: `Retention rate: ${p.retentionRate}%. Churn rate: ${p.churnRate}%. ${p.cancelledSubscriptions30d} cancellations in 30 days. ${p.gracePeriodSubscriptions} in grace period. ${p.dormantCustomers90d} dormant customers across the platform.`,
    centers: ['Customer Success Director', 'CFO'],
  })

  const adoptTrend = p.adoptionRate > 60 ? 'UP' : p.adoptionRate < 30 ? 'DOWN' : 'FLAT'
  trends.push({
    metric: 'Platform Adoption',
    trend: adoptTrend,
    explanation: `Adoption rate: ${p.adoptionRate}%. ${p.activeBusinesses} of ${p.activeBusinesses + p.inactiveBusinesses} businesses are active. ${p.lowActivityBusinesses || 0} have low activity. ${p.activeBranches || 0} of ${p.totalBranches || 0} branches active.`,
    centers: ['Customer Success Director', 'COO'],
  })

  return trends
}

// ─── Business Risks ──────────────────────────────────────────────────────

function generateBusinessRisks(p: any): Array<{
  risk: string
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  explanation: string
  mitigationActions: string[]
  centers: string[]
}> {
  const risks: Array<{ risk: string; severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'; explanation: string; mitigationActions: string[]; centers: string[] }> = []

  // Revenue risk
  if (p.financialHealth?.revenueChurn?.status === 'CRITICAL' || p.churnRate > 10) {
    risks.push({
      risk: 'Revenue churn is elevated',
      severity: 'CRITICAL',
      explanation: `Revenue churn at ${p.financialHealth?.revenueChurn?.rate?.toFixed(1) || p.churnRate}%. ${p.cancelledSubscriptions30d} cancellations and ${p.gracePeriodSubscriptions} grace period subscriptions threaten MRR stability.`,
      mitigationActions: ['Launch retention campaign for at-risk subscriptions', 'Review pricing and value proposition', 'Improve onboarding to reduce early churn'],
      centers: ['CFO', 'Customer Success Director'],
    })
  }

  // Operational risk
  if (p.paymentHealth === 'CRITICAL' || p.queueHealth === 'CRITICAL' || p.reconciliationHealth === 'CRITICAL') {
    risks.push({
      risk: 'Operational systems degraded',
      severity: 'CRITICAL',
      explanation: `Payment: ${p.paymentHealth}. Queue: ${p.queueHealth}. Reconciliation: ${p.reconciliationHealth}. System degradation directly impacts revenue collection and customer experience.`,
      mitigationActions: ['Escalate to engineering for immediate resolution', 'Implement payment retry improvements', 'Monitor system health continuously'],
      centers: ['COO', 'CFO'],
    })
  }

  // Customer attrition risk
  if (p.inactiveBusinesses > p.activeBusinesses * 0.3) {
    risks.push({
      risk: 'High business inactivity rate',
      severity: 'HIGH',
      explanation: `${p.inactiveBusinesses} inactive businesses (${Math.round(p.inactiveBusinesses / (p.activeBusinesses + p.inactiveBusinesses) * 100)}% of total). Combined with ${p.noRecentActivityBusinesses || 0} active businesses with no recent activity, this suggests systemic adoption or satisfaction issues.`,
      mitigationActions: ['Investigate root causes of inactivity', 'Improve post-onboarding support', 'Consider win-back campaigns for inactive businesses'],
      centers: ['Customer Success Director', 'CMO'],
    })
  }

  // Partnership dependency risk
  if (p.suspendedPartnerships > 0 || (p.expiringAgreements && p.expiringAgreements.length > 5)) {
    risks.push({
      risk: 'Partnership ecosystem instability',
      severity: 'HIGH',
      explanation: `${p.suspendedPartnerships} suspended partners and ${p.expiringAgreements?.length || 0} agreements expiring in 30 days. Partnership instability can reduce acquisition velocity and harm existing business relationships.`,
      mitigationActions: ['Review and resolve suspended partnerships', 'Proactively renew expiring agreements', 'Diversify partner acquisition sources'],
      centers: ['Partnership Director', 'CMO'],
    })
  }

  // Customer concentration risk
  if (p.dormantCustomers90d > p.totalCustomers * 0.4 && p.totalCustomers > 0) {
    risks.push({
      risk: 'High customer dormancy rate',
      severity: 'MEDIUM',
      explanation: `${p.dormantCustomers90d} dormant customers (${Math.round(p.dormantCustomers90d / p.totalCustomers * 100)}% of ${p.totalCustomers} total). Platform-wide dormancy suggests businesses are not successfully engaging their end customers.`,
      mitigationActions: ['Provide customer engagement best practices to businesses', 'Develop loyalty program guidance', 'Support businesses with re-engagement campaigns'],
      centers: ['Customer Success Director', 'COO'],
    })
  }

  return risks
}

// ─── Growth Opportunities ────────────────────────────────────────────────

function generateGrowthOpportunities(p: any): Array<{
  opportunity: string
  expectedImpact: string
  evidence: Array<{ source: string; metric: string; value: string }>
  suggestedActions: string[]
  centers: string[]
}> {
  const opps: Array<{ opportunity: string; expectedImpact: string; evidence: Array<{ source: string; metric: string; value: string }>; suggestedActions: string[]; centers: string[] }> = []

  // Top partner expansion
  if (p.topPartnersByRevenue?.length > 0) {
    const top = p.topPartnersByRevenue[0]
    opps.push({
      opportunity: `Scale top-performing partner "${top.name || 'N/A'}" — highest revenue generator in the ecosystem.`,
      expectedImpact: `Doubling investment in top partner could yield ${Math.round((top.totalRevenueCents || 0) / 100 * 0.5).toLocaleString()} RWF additional revenue.`,
      evidence: [
        { source: 'Partnership Director', metric: 'Partner Revenue', value: `${Math.round((top.totalRevenueCents || 0) / 100).toLocaleString()} RWF` },
        { source: 'Partnership Director', metric: 'Conversions', value: (top.totalConversions || 0).toString() },
      ],
      suggestedActions: ['Increase campaign budget for top partner', 'Offer expanded agreement terms', 'Replicate strategy with similar partners'],
      centers: ['Partnership Director', 'CFO'],
    })
  }

  // Campaign scaling
  if (p.campaignPerformance?.length > 0) {
    const topCampaign = p.campaignPerformance[0]
    if (topCampaign.conversions > 0) {
      opps.push({
        opportunity: `Scale top-performing campaign "${topCampaign.name || 'N/A'}" — best conversion rate in the portfolio.`,
        expectedImpact: `Expanding this campaign could generate ${Math.round((topCampaign.conversions || 0) * 1.5)} additional conversions.`,
        evidence: [
          { source: 'CMO Center', metric: 'Campaign Conversions', value: (topCampaign.conversions || 0).toString() },
          { source: 'CMO Center', metric: 'Campaign Revenue', value: `${Math.round((topCampaign.revenueCents || 0) / 100).toLocaleString()} RWF` },
        ],
        suggestedActions: ['Increase campaign budget', 'Expand to additional regions', 'Apply learnings to draft campaigns'],
        centers: ['CMO', 'Partnership Director'],
      })
    }
  }

  // Trial conversion
  if (p.trialBusinesses > 0) {
    opps.push({
      opportunity: `Convert ${p.trialBusinesses} trial business${p.trialBusinesses > 1 ? 'es' : ''} to paid subscriptions.`,
      expectedImpact: `Converting all trials could add ${p.trialBusinesses} new active subscriptions to MRR.`,
      evidence: [
        { source: 'Customer Success', metric: 'Trial Businesses', value: p.trialBusinesses.toString() },
        { source: 'CMO Center', metric: 'New Businesses (7d)', value: p.newBusinesses7d.toString() },
      ],
      suggestedActions: ['Provide white-glove onboarding for trial businesses', 'Offer conversion incentives', 'Schedule demo calls for businesses nearing trial end'],
      centers: ['Customer Success Director', 'CMO'],
    })
  }

  // Draft campaigns
  if (p.draftCampaigns > 0) {
    opps.push({
      opportunity: `Launch ${p.draftCampaigns} draft campaign${p.draftCampaigns > 1 ? 's' : ''} — ready for activation.`,
      expectedImpact: `Each campaign launch could generate 5-15 new hospitality business signups.`,
      evidence: [
        { source: 'CMO Center', metric: 'Draft Campaigns', value: p.draftCampaigns.toString() },
        { source: 'CMO Center', metric: 'Active Campaigns', value: p.activeCampaigns.toString() },
      ],
      suggestedActions: ['Review and activate draft campaigns', 'Assign partner resources to new campaigns', 'Set conversion targets'],
      centers: ['CMO', 'Partnership Director'],
    })
  }

  // Feature adoption
  const qrGap = p.totalBusinesses - p.qrEnabledBusinesses
  const remoteGap = p.totalBusinesses - p.remoteOrderEnabledBusinesses
  if (qrGap > 0 || remoteGap > 0) {
    opps.push({
      opportunity: `Enable QR and remote ordering for ${Math.max(qrGap, remoteGap)} additional businesses — increases transaction volume.`,
      expectedImpact: `Feature adoption could increase per-business transaction volume by 15-30%.`,
      evidence: [
        { source: 'Customer Success', metric: 'QR Enabled', value: `${p.qrEnabledBusinesses}/${p.totalBusinesses}` },
        { source: 'Customer Success', metric: 'Remote Enabled', value: `${p.remoteOrderEnabledBusinesses}/${p.totalBusinesses}` },
      ],
      suggestedActions: ['Promote QR ordering adoption', 'Provide remote ordering setup assistance', 'Share feature adoption success stories'],
      centers: ['Customer Success Director', 'COO'],
    })
  }

  // Regional expansion
  if (p.regionalPerformance) {
    const underpenetrated = p.regionalPerformance.filter((r: any) => (r.signups || 0) < 3)
    if (underpenetrated.length > 0) {
      opps.push({
        opportunity: `Expand into ${underpenetrated.length} underpenetrated region${underpenetrated.length > 1 ? 's' : ''}.`,
        expectedImpact: `Regional expansion could add ${underpenetrated.length * 5}+ new hospitality businesses.`,
        evidence: [
          { source: 'CMO Center', metric: 'Underpenetrated Regions', value: underpenetrated.length.toString() },
          { source: 'Partnership Director', metric: 'Active Partners', value: p.activePartners.toString() },
        ],
        suggestedActions: ['Deploy partners to new regions', 'Launch regional marketing campaigns', 'Provide localized onboarding support'],
        centers: ['CMO', 'Partnership Director', 'Customer Success Director'],
      })
    }
  }

  // Dormant customer re-engagement
  if (p.dormantCustomers90d > 0) {
    opps.push({
      opportunity: `Re-engage ${p.dormantCustomers90d} dormant customer${p.dormantCustomers90d > 1 ? 's' : ''} across the platform.`,
      expectedImpact: `Re-engaging 30-40% of dormant customers could increase platform activity by 10-20%.`,
      evidence: [
        { source: 'Customer Success', metric: 'Dormant Customers (90d+)', value: p.dormantCustomers90d.toString() },
        { source: 'Customer Success', metric: 'Active Customers (30d)', value: p.activeCustomers30d.toString() },
      ],
      suggestedActions: ['Share customer re-engagement strategies with businesses', 'Develop loyalty program guidance', 'Support businesses with win-back campaigns'],
      centers: ['Customer Success Director', 'CMO'],
    })
  }

  return opps
}
