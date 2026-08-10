import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { FinancialHealthService } from '@/lib/services/intelligence/financial-health.service'
import { FinancialOperationsService } from '@/lib/services/intelligence/financial-operations.service'
import { FinancialPrioritiesService } from '@/lib/services/intelligence/financial-priorities.service'
import { RevenueIntelligenceService } from '@/lib/services/intelligence/revenue-intelligence.service'
import { SubscriptionIntelligenceService } from '@/lib/services/intelligence/subscription-intelligence.service'
import { CfoInsightEngineService } from '@/lib/services/intelligence/cfo-insight-engine.service'
import { CfoNarrativeService } from '@/lib/services/intelligence/cfo-narrative.service'
import { CfoSignalCorrelationService } from '@/lib/services/intelligence/cfo-signal-correlation.service'
import { CfoFinancialImpactService } from '@/lib/services/intelligence/cfo-financial-impact.service'
import { PartnershipOperationalQueryService } from '@/lib/services/partnership-operational-query.service'
import { PaymentWatchdogService } from '@/lib/services/watchdog/payment-watchdog.service'
import { ReconciliationWatchdogService } from '@/lib/services/watchdog/reconciliation-watchdog.service'
import { SubscriptionWatchdogService } from '@/lib/services/watchdog/subscription-watchdog.service'
import { ExecutiveSummaryService } from '@/lib/services/intelligence/executive-summary.service'
import { subDays, startOfMonth } from 'date-fns'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const userRoles = (session.user as any).roles || [(session.user as any).role]
    const allowed = ['CFO', 'ADMIN', 'FINANCE', 'EXECUTIVE']
    const hasAccess = userRoles?.some((r: string) => allowed.includes(r))
    if (!hasAccess) {
      return res.status(403).json({ error: 'Insufficient permissions for CFO Operating Center' })
    }

    // Compose all financial intelligence in parallel — zero new services
    const [
      financialHealth,
      financialOperations,
      financialPriorities,
      revenueIntelligence,
      subscriptionIntelligence,
      cfoInsights,
      cfoNarratives,
      cfoCorrelations,
      commissionSummary,
      totalCommissionLiability,
      paymentHealth,
      reconciliationHealth,
      subscriptionHealth,
      dailySummary,
      pendingPayouts,
      failedPaymentsLast30d,
      refundEntries,
      ledgerEntryCount,
      reconciledEntries,
      subscriptionRevenue,
      marketplaceRevenue,
    ] = await Promise.all([
      FinancialHealthService.getMetrics(),
      FinancialOperationsService.getIntelligence(),
      FinancialPrioritiesService.getTopPriorities(8),
      RevenueIntelligenceService.getIntelligence('last30d'),
      SubscriptionIntelligenceService.getIntelligence(),
      CfoInsightEngineService.generateInsights(),
      CfoNarrativeService.generateNarratives(),
      CfoSignalCorrelationService.detectCorrelations(),
      PartnershipOperationalQueryService.getCommissionSummary(),
      PartnershipOperationalQueryService.getTotalCommissionLiability(),
      PaymentWatchdogService.getHealth(),
      ReconciliationWatchdogService.getHealth(),
      SubscriptionWatchdogService.getHealth(),
      ExecutiveSummaryService.generateDailySummary(),
      prisma.partnershipPayout.count({ where: { status: 'PENDING' } }),
      prisma.financialLedgerEntry.count({
        where: { eventType: 'PAYMENT_FAILED', occurredAt: { gte: subDays(new Date(), 30) } },
      }),
      prisma.financialLedgerEntry.aggregate({
        where: { eventType: 'PAYMENT_REFUNDED' as const, occurredAt: { gte: subDays(new Date(), 30) } },
        _sum: { amountCents: true },
        _count: { _all: true },
      }),
      prisma.financialLedgerEntry.count({
        where: { occurredAt: { gte: subDays(new Date(), 30) } },
      }),
      prisma.financialLedgerEntry.count({
        where: {
          occurredAt: { gte: subDays(new Date(), 30) },
          status: 'SUCCESS',
        },
      }),
      prisma.financialLedgerEntry.aggregate({
        where: {
          eventType: 'SUBSCRIPTION_CHARGE',
          occurredAt: { gte: startOfMonth(new Date()) },
        },
        _sum: { amountCents: true },
      }),
      prisma.financialLedgerEntry.aggregate({
        where: {
          eventType: 'MARKETPLACE_SALE',
          occurredAt: { gte: subDays(new Date(), 30) },
        },
        _sum: { amountCents: true },
      }),
    ])

    // ─── Financial Integrity Score ───
    const reconciliationRate = ledgerEntryCount > 0
      ? (reconciledEntries / ledgerEntryCount) * 100
      : 100
    const integrityScore = computeIntegrityScore(
      reconciliationRate,
      reconciliationHealth,
      paymentHealth,
      ledgerEntryCount
    )

    // ─── Financial Attention Items ───
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
        description: `${failedPaymentsLast30d} failed payments in last 30 days. Payment health is critical.`,
        severity: 'CRITICAL',
        action: 'Investigate payment failures',
        link: '/admin/operations-intelligence',
      })
    }

    if (reconciliationHealth === 'CRITICAL') {
      attentionItems.push({
        title: 'Reconciliation critical',
        description: 'Financial reconciliation is in critical state. Ledger integrity at risk.',
        severity: 'CRITICAL',
        action: 'Review reconciliation',
        link: '/admin/reconciliation',
      })
    }

    if (pendingPayouts > 0) {
      attentionItems.push({
        title: `${pendingPayouts} payouts pending approval`,
        description: 'Partner payouts awaiting approval and processing.',
        severity: 'HIGH',
        action: 'Review payouts',
        link: '/admin/payout-control',
      })
    }

    if (totalCommissionLiability.totalLiabilityCents > 0) {
      const liabilityRWF = Math.round(totalCommissionLiability.totalLiabilityCents / 100)
      attentionItems.push({
        title: `${liabilityRWF.toLocaleString()} RWF in outstanding commission liability`,
        description: `${totalCommissionLiability.totalCommissionCount} commissions pending across partners.`,
        severity: 'HIGH',
        action: 'Review commission liability',
        link: '/admin/payout-control',
      })
    }

    if (financialHealth.mrr.changePercent < -5) {
      attentionItems.push({
        title: `MRR declining ${Math.abs(financialHealth.mrr.changePercent).toFixed(1)}%`,
        description: 'Monthly recurring revenue showing significant decline.',
        severity: 'CRITICAL',
        action: 'Revenue review required',
        link: '/admin/revenue-analytics',
      })
    }

    if (financialHealth.revenueChurn.status === 'CRITICAL') {
      attentionItems.push({
        title: `Revenue churn at ${financialHealth.revenueChurn.rate.toFixed(1)}%`,
        description: 'Customer churn exceeding critical threshold.',
        severity: 'CRITICAL',
        action: 'Retention intervention',
        link: '/admin/subscriptions',
      })
    }

    if (revenueIntelligence.concentration.rate > 50) {
      attentionItems.push({
        title: `Revenue concentration at ${revenueIntelligence.concentration.rate.toFixed(1)}%`,
        description: 'Top 10 customers represent majority of revenue. Existential risk.',
        severity: 'HIGH',
        action: 'Diversify customer base',
        link: '/admin/revenue-analytics',
      })
    }

    if (failedPaymentsLast30d > 10) {
      attentionItems.push({
        title: `${failedPaymentsLast30d} failed payments in 30 days`,
        description: 'High volume of payment failures impacting revenue collection.',
        severity: 'HIGH',
        action: 'Review payment failures',
        link: '/admin/operations-intelligence',
      })
    }

    if (subscriptionHealth === 'CRITICAL') {
      attentionItems.push({
        title: 'Subscription health critical',
        description: 'Failed renewals or grace period subscriptions exceeding thresholds.',
        severity: 'HIGH',
        action: 'Review subscriptions',
        link: '/admin/subscriptions',
      })
    }

    const refundCount = refundEntries._count?._all ?? 0
    if (refundCount > 0) {
      const refundRWF = Math.round((refundEntries._sum?.amountCents || 0) / 100)
      attentionItems.push({
        title: `${refundCount} refunds in last 30 days (${refundRWF.toLocaleString()} RWF)`,
        description: 'Refund activity may indicate product or service issues.',
        severity: 'MEDIUM',
        action: 'Review refund patterns',
        link: '/admin/revenue-operations',
      })
    }

    // ─── AI Financial Assistant Recommendations ───
    const recommendations: Array<{
      question: string
      answer: string
      evidence: string[]
      confidence: number
      suggestedActions: string[]
    }> = []

    // 1. Executive summary narrative
    const execSummary = await CfoNarrativeService.generateExecutiveSummary()
    recommendations.push({
      question: 'What is the current financial position?',
      answer: execSummary,
      evidence: [
        `MRR: ${Math.round(financialHealth.mrr.value).toLocaleString()} RWF (${financialHealth.mrr.changePercent >= 0 ? '+' : ''}${financialHealth.mrr.changePercent.toFixed(1)}%)`,
        `Churn: ${financialHealth.revenueChurn.rate.toFixed(1)}% (${financialHealth.revenueChurn.status})`,
        `NRR: ${financialHealth.netRevenueRetention.rate.toFixed(1)}% (${financialHealth.netRevenueRetention.status})`,
      ],
      confidence: 90,
      suggestedActions: financialPriorities.slice(0, 2).map(p => p.action),
    })

    // 2. Top insight from CFO Insight Engine
    if (cfoInsights.topInsights.length > 0) {
      const top = cfoInsights.topInsights[0]
      recommendations.push({
        question: 'What financial risk requires attention?',
        answer: top.insight,
        evidence: [
          `Root cause: ${top.rootCause}`,
          `Metric: ${top.metricName} = ${top.currentValue}`,
          `Severity: ${top.severity}`,
        ],
        confidence: top.priority,
        suggestedActions: [top.action],
      })
    }

    // 3. Cross-system correlation
    if (cfoCorrelations.length > 0) {
      const topCorrelation = cfoCorrelations[0]
      recommendations.push({
        question: 'What cross-system pattern is detected?',
        answer: topCorrelation.description,
        evidence: topCorrelation.signals,
        confidence: topCorrelation.priority,
        suggestedActions: [topCorrelation.action],
      })
    }

    // 4. Financial impact assessment
    if (financialOperations.paymentHealth.successRate < 95) {
      const impact = await CfoFinancialImpactService.calculatePaymentFailureImpact(
        financialOperations.paymentHealth.successRate
      )
      recommendations.push({
        question: 'What is the revenue impact of payment failures?',
        answer: `Payment failures are costing approximately ${Math.round(impact.monthlyImpact || 0).toLocaleString()} RWF/month.`,
        evidence: [
          `Success rate: ${financialOperations.paymentHealth.successRate.toFixed(1)}%`,
          `Daily impact: ${Math.round(impact.dailyImpact || 0).toLocaleString()} RWF`,
          `Annualized: ${Math.round(impact.annualizedImpact || 0).toLocaleString()} RWF`,
        ],
        confidence: impact.confidence,
        suggestedActions: ['Review payment provider health', 'Implement retry strategies', 'Contact affected customers'],
      })
    }

    // 5. Concentration risk
    if (revenueIntelligence.concentration.rate > 40) {
      const concentrationImpact = await CfoFinancialImpactService.calculateConcentrationRevenueRisk(
        revenueIntelligence.concentration.rate
      )
      recommendations.push({
        question: 'What is the revenue concentration risk?',
        answer: `Losing one top customer would impact ${Math.round(concentrationImpact.monthlyImpact || 0).toLocaleString()} RWF/month.`,
        evidence: [
          `Concentration: ${revenueIntelligence.concentration.rate.toFixed(1)}%`,
          `Single customer annual risk: ${Math.round(concentrationImpact.annualizedImpact || 0).toLocaleString()} RWF`,
          `Catastrophic risk (all top): ${Math.round(concentrationImpact.catastrophicRisk || 0).toLocaleString()} RWF/year`,
        ],
        confidence: concentrationImpact.confidence,
        suggestedActions: ['Diversify customer base', 'Engage top customers for retention', 'Accelerate mid-market acquisition'],
      })
    }

    // ─── Cash & Collections ───
    const collections = {
      totalCollected30d: financialHealth.gmv.value,
      failedPayments: failedPaymentsLast30d,
      failedPaymentImpact: financialOperations.paymentHealth.revenueProtection.failedPaymentImpact,
      pendingPayouts,
      refundAmount: (refundEntries._sum?.amountCents || 0) / 100,
      refundCount: refundEntries._count?._all ?? 0,
      retrySuccessRate: financialOperations.paymentHealth.revenueProtection.retrySuccessRate,
      expectedInflow: financialHealth.mrr.value,
    }

    // ─── Liability Center ───
    const liabilities = {
      totalCommissionLiabilityCents: totalCommissionLiability.totalLiabilityCents,
      commissionCount: totalCommissionLiability.totalCommissionCount,
      topLiabilities: totalCommissionLiability.topLiabilities.slice(0, 5).map((l: any) => ({
        partnerName: l.partnershipId,
        amountCents: l.totalCents,
        status: 'PENDING',
      })),
      pendingPayouts,
      refundObligations: (refundEntries._sum?.amountCents || 0),
      refundCount: refundEntries._count?._all ?? 0,
    }

    // ─── Revenue Quality ───
    const revenueQuality = {
      bySource: revenueIntelligence.bySource,
      concentration: revenueIntelligence.concentration,
      topContributors: revenueIntelligence.topContributors.slice(0, 5),
      drivers: revenueIntelligence.drivers,
      segmentDistribution: revenueIntelligence.bySegment,
      subscriptionRevenue: (subscriptionRevenue._sum?.amountCents || 0) / 100,
      marketplaceRevenue: (marketplaceRevenue._sum?.amountCents || 0) / 100,
    }

    // ─── Forecast Center (deterministic, based on current trends) ───
    const forecast = {
      expectedMRR: financialHealth.mrr.value * (1 + financialHealth.mrr.changePercent / 100),
      expectedARR: financialHealth.mrr.value * 12 * (1 + financialHealth.mrr.changePercent / 100),
      revenueGrowthRate30d: financialHealth.revenueGrowth.rate30d,
      revenueGrowthRate90d: financialHealth.revenueGrowth.rate90d,
      growthStatus: financialHealth.revenueGrowth.status,
      mrrTrend: financialHealth.mrr.trend,
      confidence: computeForecastConfidence(financialHealth, ledgerEntryCount),
    }

    // ─── Financial Integrity Center ───
    const integrity = {
      overallScore: integrityScore,
      reconciliationRate,
      reconciliationStatus: reconciliationHealth,
      totalLedgerEntries: ledgerEntryCount,
      reconciledEntries,
      unreconciledEntries: ledgerEntryCount - reconciledEntries,
      paymentSystemHealth: paymentHealth,
      dataQualityScore: computeDataQualityScore(ledgerEntryCount, reconciledEntries),
      settlementDelayDays: financialOperations.reconciliationHealth.settlementDelayDays,
      available: financialOperations.reconciliationHealth.available,
    }

    return res.status(200).json({
      financialHealth,
      financialOperations,
      financialPriorities,
      revenueIntelligence,
      subscriptionIntelligence,
      cfoInsights,
      cfoNarratives,
      cfoCorrelations,
      collections,
      liabilities,
      revenueQuality,
      forecast,
      integrity,
      commissionSummary,
      totalCommissionLiability,
      paymentHealth,
      reconciliationHealth,
      subscriptionHealth,
      dailySummary,
      pendingPayouts,
      failedPayments: failedPaymentsLast30d,
      attentionItems,
      recommendations,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('CFO API Error:', error)
    return res.status(500).json({ error: 'Failed to load CFO Operating Center data' })
  }
}

function computeIntegrityScore(
  reconciliationRate: number,
  reconHealth: string,
  paymentHealth: string,
  ledgerCount: number
): number {
  let score = 100
  if (reconciliationRate < 95) score -= 20
  if (reconciliationRate < 80) score -= 15
  if (reconHealth === 'WARNING') score -= 10
  if (reconHealth === 'CRITICAL') score -= 25
  if (paymentHealth === 'WARNING') score -= 10
  if (paymentHealth === 'CRITICAL') score -= 20
  if (ledgerCount === 0) score -= 30
  return Math.max(0, Math.min(100, score))
}

function computeDataQualityScore(total: number, reconciled: number): number {
  if (total === 0) return 0
  return Math.round((reconciled / total) * 100)
}

function computeForecastConfidence(
  health: Awaited<ReturnType<typeof FinancialHealthService.getMetrics>>,
  ledgerCount: number
): number {
  let confidence = 50
  if (ledgerCount > 100) confidence += 20
  if (ledgerCount > 500) confidence += 10
  if (health.mrr.trend.length >= 6) confidence += 10
  if (health.revenueGrowth.status === 'STRONG' || health.revenueGrowth.status === 'MODERATE') confidence += 10
  return Math.min(100, confidence)
}
