import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { ExecutiveSummaryService } from '@/lib/services/intelligence/executive-summary.service'
import { FinancialHealthService } from '@/lib/services/intelligence/financial-health.service'
import { FinancialPrioritiesService } from '@/lib/services/intelligence/financial-priorities.service'
import { PartnershipOperationalQueryService } from '@/lib/services/partnership-operational-query.service'
import { PaymentWatchdogService } from '@/lib/services/watchdog/payment-watchdog.service'
import { QueueWatchdogService } from '@/lib/services/watchdog/queue-watchdog.service'
import { ReconciliationWatchdogService } from '@/lib/services/watchdog/reconciliation-watchdog.service'
import { SubscriptionWatchdogService } from '@/lib/services/watchdog/subscription-watchdog.service'
import { prisma } from '@/lib/prisma'

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
    const [
      dailySummary,
      weeklySummary,
      latestSummary,
      financialHealth,
      financialPriorities,
      topPartners,
      campaignPerformance,
      partnerTypeLTV,
      commissionSummary,
      totalCommissionLiability,
      partnersRequiringAttention,
      paymentHealth,
      queueHealth,
      reconciliationHealth,
      subscriptionHealth,
      activeBusinesses,
      activePartners,
      pendingApplications,
      pendingPayouts,
      expiringAgreements,
      regionalPerformance,
    ] = await Promise.all([
      ExecutiveSummaryService.generateDailySummary(),
      ExecutiveSummaryService.generateWeeklySummary(),
      ExecutiveSummaryService.getLatestSummary('DAILY'),
      FinancialHealthService.getMetrics(),
      FinancialPrioritiesService.getTopPriorities(5),
      PartnershipOperationalQueryService.getTopPartners({ metric: 'revenue', limit: 5 }),
      PartnershipOperationalQueryService.getCampaignPerformance(5),
      PartnershipOperationalQueryService.getPartnershipTypeLTV(),
      PartnershipOperationalQueryService.getCommissionSummary(),
      PartnershipOperationalQueryService.getTotalCommissionLiability(),
      PartnershipOperationalQueryService.getPartnersRequiringAttention(),
      PaymentWatchdogService.getHealth(),
      QueueWatchdogService.getHealth(),
      ReconciliationWatchdogService.getHealth(),
      SubscriptionWatchdogService.getHealth(),
      prisma.business.count({ where: { isActive: true } }),
      prisma.partnership.count({ where: { status: 'ACTIVE' } }),
      prisma.partnershipApplication.count({ where: { status: 'SUBMITTED' } }),
      prisma.partnershipPayout.count({ where: { status: 'PENDING' } }),
      PartnershipOperationalQueryService.getExpiringAgreements(30),
      PartnershipOperationalQueryService.getRegionalPerformance(),
    ])

    // Compose CEO-specific attention items
    const attentionItems: Array<{
      title: string
      description: string
      severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
      action: string
      link: string
    }> = []

    if (partnersRequiringAttention.suspended?.length > 0) {
      attentionItems.push({
        title: `${partnersRequiringAttention.suspended.length} suspended partners`,
        description: 'Partners are currently suspended and may need intervention',
        severity: 'HIGH',
        action: 'Review suspended partners',
        link: '/admin/founder-partners',
      })
    }

    if (pendingApplications > 0) {
      attentionItems.push({
        title: `${pendingApplications} pending partnership applications`,
        description: 'Applications awaiting review and decision',
        severity: 'MEDIUM',
        action: 'Review applications',
        link: '/admin/partnership-applications',
      })
    }

    if (pendingPayouts > 0) {
      attentionItems.push({
        title: `${pendingPayouts} payouts awaiting approval`,
        description: 'Partner payouts pending approval',
        severity: 'HIGH',
        action: 'Review payouts',
        link: '/admin/payout-control',
      })
    }

    if (expiringAgreements?.length > 0) {
      attentionItems.push({
        title: `${expiringAgreements.length} agreements expiring within 30 days`,
        description: 'Partnership agreements need renewal decisions',
        severity: 'MEDIUM',
        action: 'Review agreements',
        link: '/admin/founder-partners',
      })
    }

    if (paymentHealth === 'CRITICAL') {
      attentionItems.push({
        title: 'Payment system critical',
        description: 'Payment health is in critical state',
        severity: 'CRITICAL',
        action: 'Escalate to COO',
        link: '/admin/operations-intelligence',
      })
    }

    if (queueHealth === 'CRITICAL') {
      attentionItems.push({
        title: 'Queue system critical',
        description: 'Processing queue is in critical state',
        severity: 'CRITICAL',
        action: 'Escalate to operations',
        link: '/admin/operations-intelligence',
      })
    }

    if (reconciliationHealth === 'CRITICAL') {
      attentionItems.push({
        title: 'Reconciliation critical',
        description: 'Financial reconciliation is in critical state',
        severity: 'CRITICAL',
        action: 'Review reconciliation',
        link: '/admin/reconciliation',
      })
    }

    if (dailySummary.subscriptions.failedRenewals > 5) {
      attentionItems.push({
        title: `${dailySummary.subscriptions.failedRenewals} failed subscription renewals`,
        description: 'High number of failed renewals in the last 24 hours',
        severity: 'HIGH',
        action: 'Review payment retry logic',
        link: '/admin/subscriptions',
      })
    }

    if (dailySummary.subscriptions.inGrace > 10) {
      attentionItems.push({
        title: `${dailySummary.subscriptions.inGrace} subscriptions in grace period`,
        description: 'Revenue at risk from grace period subscriptions',
        severity: 'MEDIUM',
        action: 'Initiate rescue campaigns',
        link: '/admin/subscriptions',
      })
    }

    // Sort by severity
    const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
    attentionItems.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])

    // Compose company health scores
    const healthScores = {
      growth: {
        score: computeGrowthScore(financialHealth, weeklySummary),
        status: '' as 'HEALTHY' | 'WARNING' | 'CRITICAL',
        explanation: '',
      },
      revenue: {
        score: computeRevenueScore(financialHealth),
        status: '' as 'HEALTHY' | 'WARNING' | 'CRITICAL',
        explanation: '',
      },
      operations: {
        score: computeOperationsScore(paymentHealth, queueHealth, reconciliationHealth),
        status: '' as 'HEALTHY' | 'WARNING' | 'CRITICAL',
        explanation: '',
      },
      founderEcosystem: {
        score: computeFounderScore(activePartners, pendingApplications, partnersRequiringAttention),
        status: '' as 'HEALTHY' | 'WARNING' | 'CRITICAL',
        explanation: '',
      },
      restaurantEcosystem: {
        score: computeRestaurantScore(activeBusinesses, dailySummary),
        status: '' as 'HEALTHY' | 'WARNING' | 'CRITICAL',
        explanation: '',
      },
      customerSuccess: {
        score: computeCustomerScore(dailySummary, subscriptionHealth),
        status: '' as 'HEALTHY' | 'WARNING' | 'CRITICAL',
        explanation: '',
      },
      financialHealth: {
        score: computeFinancialScore(financialHealth),
        status: '' as 'HEALTHY' | 'WARNING' | 'CRITICAL',
        explanation: '',
      },
    }

    // Assign statuses and explanations
    for (const key of Object.keys(healthScores) as Array<keyof typeof healthScores>) {
      const s = healthScores[key].score
      healthScores[key].status = s >= 70 ? 'HEALTHY' : s >= 40 ? 'WARNING' : 'CRITICAL'
    }

    healthScores.growth.explanation =
      `Revenue ${weeklySummary.revenue.trend === 'UP' ? 'growing' : weeklySummary.revenue.trend === 'DOWN' ? 'declining' : 'stable'} at ${Math.abs(weeklySummary.revenue.changePercent).toFixed(1)}%. ${weeklySummary.customers.newCustomers} new customers this week, ${weeklySummary.customers.churnedCustomers} churned.`

    healthScores.revenue.explanation =
      `MRR: ${(financialHealth.mrr.value / 100).toLocaleString()} RWF (${financialHealth.mrr.changePercent >= 0 ? '+' : ''}${financialHealth.mrr.changePercent.toFixed(1)}%). ARR: ${(financialHealth.arr.value / 100).toLocaleString()} RWF.`

    healthScores.operations.explanation =
      `Payment: ${paymentHealth}. Queue: ${queueHealth}. Reconciliation: ${reconciliationHealth}.`

    healthScores.founderEcosystem.explanation =
      `${activePartners} active partners, ${pendingApplications} pending applications, ${partnersRequiringAttention.suspended?.length || 0} suspended.`

    healthScores.restaurantEcosystem.explanation =
      `${activeBusinesses} active businesses. ${dailySummary.branches.topPerformer ? `Top: ${dailySummary.branches.topPerformer.name}` : 'No branch data'}.`

    healthScores.customerSuccess.explanation =
      `${dailySummary.customers.activeCount} active customers. ${dailySummary.customers.healthDistribution.atRisk + dailySummary.customers.healthDistribution.critical} at-risk/critical. ${dailySummary.subscriptions.inGrace} in grace period.`

    healthScores.financialHealth.explanation =
      `Churn: ${financialHealth.revenueChurn.rate.toFixed(1)}% (${financialHealth.revenueChurn.status}). NRR: ${financialHealth.netRevenueRetention.rate.toFixed(1)}% (${financialHealth.netRevenueRetention.status}). Concentration risk: ${financialHealth.revenueGrowth.status}.`

    // Overall health
    const allScores = Object.values(healthScores).map(h => h.score)
    const overallScore = Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
    const overallStatus = overallScore >= 70 ? 'HEALTHY' : overallScore >= 40 ? 'WARNING' : 'CRITICAL'

    // AI Executive Assistant — deterministic recommendations
    const recommendations: Array<{
      question: string
      answer: string
      evidence: string[]
      confidence: number
      suggestedActions: string[]
    }> = []

    if (latestSummary) {
      recommendations.push({
        question: 'What changed overnight?',
        answer: latestSummary.revenue,
        evidence: [
          `Revenue: ${latestSummary.revenue}`,
          `Customers: ${latestSummary.customers}`,
          `Operations: ${latestSummary.operations}`,
        ],
        confidence: 85,
        suggestedActions: latestSummary.risks.length > 0 ? latestSummary.risks : ['No immediate action required'],
      })
    }

    if (financialPriorities.length > 0) {
      const top = financialPriorities[0]
      recommendations.push({
        question: 'What should I prioritize this week?',
        answer: top.title,
        evidence: [
          `Metric: ${top.metricValue} (threshold: ${top.threshold})`,
          `Trend: ${top.trend}`,
          `Category: ${top.category}`,
        ],
        confidence: top.severity,
        suggestedActions: [top.action],
      })
    }

    if (topPartners.length > 0) {
      const best = topPartners[0]
      recommendations.push({
        question: 'Which Founder Partner deserves investment?',
        answer: `${best.name || 'Top partner'} shows the strongest performance.`,
        evidence: [
          `Revenue: ${Math.round((best.totalRevenueCents || 0) / 100).toLocaleString()} RWF`,
          `Conversions: ${best.totalConversions || 0}`,
          `Partner type: ${best.partnerType || 'N/A'}`,
        ],
        confidence: 80,
        suggestedActions: [
          'Increase campaign budget',
          'Offer tier upgrade',
          'Schedule quarterly review',
        ],
      })
    }

    if (campaignPerformance.length > 0) {
      const topCampaign = campaignPerformance[0]
      recommendations.push({
        question: 'Which campaign is performing best?',
        answer: `${topCampaign.name || 'Top campaign'} is the top performer.`,
        evidence: [
          `Conversions: ${topCampaign.conversions || 0}`,
          `Revenue: ${Math.round((topCampaign.revenueCents || 0) / 100).toLocaleString()} RWF`,
          `Status: ${topCampaign.status}`,
        ],
        confidence: 75,
        suggestedActions: ['Expand campaign budget', 'Replicate strategy for other partners'],
      })
    }

    return res.status(200).json({
      dailySummary,
      weeklySummary,
      latestSummary,
      financialHealth,
      financialPriorities,
      topPartners,
      campaignPerformance,
      partnerTypeLTV,
      commissionSummary,
      totalCommissionLiability,
      partnersRequiringAttention,
      paymentHealth,
      queueHealth,
      reconciliationHealth,
      subscriptionHealth,
      activeBusinesses,
      activePartners,
      pendingApplications,
      pendingPayouts,
      expiringAgreements,
      regionalPerformance,
      attentionItems,
      healthScores: { ...healthScores, overall: { score: overallScore, status: overallStatus } },
      recommendations,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('CEO API Error:', error)
    return res.status(500).json({ error: 'Failed to load CEO operating center data' })
  }
}

function computeGrowthScore(
  financialHealth: Awaited<ReturnType<typeof FinancialHealthService.getMetrics>>,
  weekly: Awaited<ReturnType<typeof ExecutiveSummaryService.generateWeeklySummary>>
): number {
  let score = 50
  if (weekly.revenue.trend === 'UP') score += 20
  else if (weekly.revenue.trend === 'DOWN') score -= 20
  if (weekly.customers.netChange > 0) score += 15
  else if (weekly.customers.netChange < 0) score -= 15
  if (financialHealth.revenueGrowth.status === 'STRONG') score += 15
  else if (financialHealth.revenueGrowth.status === 'NEGATIVE') score -= 15
  return Math.max(0, Math.min(100, score))
}

function computeRevenueScore(
  financialHealth: Awaited<ReturnType<typeof FinancialHealthService.getMetrics>>
): number {
  let score = 50
  if (financialHealth.mrr.status === 'GROWTH') score += 25
  else if (financialHealth.mrr.status === 'DECLINE') score -= 25
  if (financialHealth.netRevenueRetention.rate >= 100) score += 15
  else if (financialHealth.netRevenueRetention.rate < 90) score -= 15
  if (financialHealth.revenueChurn.status === 'HEALTHY') score += 10
  else if (financialHealth.revenueChurn.status === 'CRITICAL') score -= 10
  return Math.max(0, Math.min(100, score))
}

function computeOperationsScore(
  payment: string,
  queue: string,
  reconciliation: string
): number {
  let score = 100
  if (payment === 'CRITICAL') score -= 35
  else if (payment === 'WARNING') score -= 15
  if (queue === 'CRITICAL') score -= 30
  else if (queue === 'WARNING') score -= 12
  if (reconciliation === 'CRITICAL') score -= 25
  else if (reconciliation === 'WARNING') score -= 10
  return Math.max(0, score)
}

function computeFounderScore(
  activePartners: number,
  pendingApplications: number,
  attention: Awaited<ReturnType<typeof PartnershipOperationalQueryService.getPartnersRequiringAttention>>
): number {
  let score = 70
  const suspended = attention.suspended?.length || 0
  const highRisk = attention.highRisk?.length || 0
  if (suspended > 2) score -= 20
  else if (suspended > 0) score -= 10
  if (highRisk > 3) score -= 15
  else if (highRisk > 0) score -= 8
  if (activePartners > 10) score += 10
  if (pendingApplications > 5) score += 5
  return Math.max(0, Math.min(100, score))
}

function computeRestaurantScore(
  activeBusinesses: number,
  daily: Awaited<ReturnType<typeof ExecutiveSummaryService.generateDailySummary>>
): number {
  let score = 70
  if (activeBusinesses > 50) score += 15
  else if (activeBusinesses > 20) score += 8
  else if (activeBusinesses < 5) score -= 15
  if (daily.subscriptions.failedRenewals > 5) score -= 10
  return Math.max(0, Math.min(100, score))
}

function computeCustomerScore(
  daily: Awaited<ReturnType<typeof ExecutiveSummaryService.generateDailySummary>>,
  subscriptionHealth: string
): number {
  let score = 70
  const atRiskPercent = daily.customers.activeCount > 0
    ? ((daily.customers.healthDistribution.atRisk + daily.customers.healthDistribution.critical) / daily.customers.activeCount) * 100
    : 0
  if (atRiskPercent > 30) score -= 25
  else if (atRiskPercent > 15) score -= 12
  if (subscriptionHealth === 'CRITICAL') score -= 15
  else if (subscriptionHealth === 'WARNING') score -= 8
  if (daily.subscriptions.inGrace > 10) score -= 10
  return Math.max(0, Math.min(100, score))
}

function computeFinancialScore(
  financialHealth: Awaited<ReturnType<typeof FinancialHealthService.getMetrics>>
): number {
  let score = 50
  if (financialHealth.mrr.status === 'GROWTH') score += 20
  else if (financialHealth.mrr.status === 'DECLINE') score -= 20
  if (financialHealth.revenueChurn.status === 'HEALTHY') score += 15
  else if (financialHealth.revenueChurn.status === 'CRITICAL') score -= 15
  if (financialHealth.netRevenueRetention.status === 'EXCELLENT') score += 15
  else if (financialHealth.netRevenueRetention.status === 'CRITICAL') score -= 15
  return Math.max(0, Math.min(100, score))
}

export default handler
