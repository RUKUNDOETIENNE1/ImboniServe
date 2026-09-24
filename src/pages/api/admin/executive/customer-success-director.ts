import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { ExecutiveSummaryService } from '@/lib/services/intelligence/executive-summary.service'
import { CustomerHealthScoreService } from '@/lib/services/intelligence/customer-health-score.service'
import { SubscriptionIntelligenceService } from '@/lib/services/intelligence/subscription-intelligence.service'
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
  const allowed = ['CUSTOMER_SUCCESS_DIRECTOR', 'ADMIN', 'CUSTOMER_SUCCESS_MANAGER', 'EXECUTIVE']
  if (!userRoles.some((r: string) => allowed.includes(r))) {
    return res.status(403).json({ error: 'Insufficient permissions' })
  }

  try {
    const now = new Date()
    const sevenDaysAgo = subDays(now, 7)
    const thirtyDaysAgo = subDays(now, 30)
    const sixtyDaysAgo = subDays(now, 60)
    const ninetyDaysAgo = subDays(now, 90)

    const [
      dailySummary,
      weeklySummary,
      customerHealthDistribution,
      subscriptionIntelligence,
      activeBusinesses,
      totalBusinesses,
      inactiveBusinesses,
      newBusinesses7d,
      newBusinesses30d,
      newActivations7d,
      newActivations30d,
      trialBusinesses,
      trialExpiringSoon,
      activeSubscriptions,
      trialSubscriptions,
      gracePeriodSubscriptions,
      pastDueSubscriptions,
      cancelledSubscriptions30d,
      subscriptionsRenewingSoon,
      totalBranches,
      activeBranches,
      totalCustomers,
      activeCustomers30d,
      activeCustomers7d,
      newCustomers7d,
      newCustomers30d,
      dormantCustomers90d,
      businessesByType,
      businessesByCity,
      businessesByPlan,
      topBusinessesByRevenue,
      topBusinessesByCustomers,
      topBusinessesByActivity,
      lowActivityBusinesses,
      noRecentActivityBusinesses,
      openSupportConversations,
      highPrioritySupport,
      recentSupportConversations,
      totalUsers,
      activeUsers7d,
      activeUsers30d,
      renewalsNext30d,
      expansionCandidates,
      qrEnabledBusinesses,
      remoteOrderEnabledBusinesses,
      businessesWithRecentSales,
      totalSales7d,
      totalSales30d,
    ] = await Promise.all([
      ExecutiveSummaryService.generateDailySummary(),
      ExecutiveSummaryService.generateWeeklySummary(),
      CustomerHealthScoreService.getDistribution(),
      SubscriptionIntelligenceService.getIntelligence(),
      prisma.business.count({ where: { isActive: true } }),
      prisma.business.count(),
      prisma.business.count({ where: { isActive: false } }),
      prisma.business.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.business.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.business.count({
        where: {
          isActive: true,
          trialEndDate: { gte: sevenDaysAgo },
        },
      }),
      prisma.business.count({
        where: {
          isActive: true,
          trialEndDate: { gte: thirtyDaysAgo },
        },
      }),
      prisma.business.count({
        where: {
          trialEndDate: { gte: now },
        },
      }),
      prisma.business.findMany({
        where: {
          trialEndDate: { gte: now, lte: subDays(now, -7) },
        },
        select: {
          id: true,
          name: true,
          trialEndDate: true,
          city: true,
          businessType: true,
        },
        orderBy: { trialEndDate: 'asc' },
        take: 10,
      }),
      prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      prisma.subscription.count({ where: { status: 'TRIAL' } }),
      prisma.subscription.count({ where: { status: 'GRACE_PERIOD' } }),
      prisma.subscription.count({ where: { status: 'PAST_DUE' } }),
      prisma.subscription.count({
        where: {
          status: 'CANCELLED',
          updatedAt: { gte: thirtyDaysAgo },
        },
      }),
      prisma.subscription.findMany({
        where: {
          status: 'ACTIVE',
          nextBillingDate: { gte: now, lte: subDays(now, -30) },
          isAutoRenew: true,
        },
        include: {
          business: { select: { id: true, name: true, city: true, businessType: true } },
        },
        orderBy: { nextBillingDate: 'asc' },
        take: 10,
      }),
      prisma.branch.count(),
      prisma.branch.count({ where: { isActive: true } }),
      prisma.customer.count(),
      prisma.customer.count({ where: { lastVisit: { gte: thirtyDaysAgo } } }),
      prisma.customer.count({ where: { lastVisit: { gte: sevenDaysAgo } } }),
      prisma.customer.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.customer.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.customer.count({ where: { lastVisit: { lt: ninetyDaysAgo } } }),
      prisma.business.groupBy({
        by: ['businessType'],
        _count: true,
      }),
      prisma.business.groupBy({
        by: ['city'],
        _count: true,
        orderBy: { _count: { city: 'desc' } },
        take: 10,
      }),
      prisma.business.groupBy({
        by: ['planId'],
        _count: true,
      }),
      prisma.business.findMany({
        where: { isActive: true },
        include: {
          _count: { select: { sales: true, customers: true, branches: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.business.findMany({
        where: { isActive: true },
        include: {
          _count: { select: { customers: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.business.findMany({
        where: {
          isActive: true,
          updatedAt: { gte: sevenDaysAgo },
        },
        select: {
          id: true,
          name: true,
          city: true,
          businessType: true,
          updatedAt: true,
        },
        orderBy: { updatedAt: 'desc' },
        take: 10,
      }),
      prisma.business.count({
        where: {
          isActive: true,
          updatedAt: { lt: thirtyDaysAgo },
        },
      }),
      prisma.business.count({
        where: {
          isActive: true,
          updatedAt: { lt: sixtyDaysAgo },
        },
      }),
      prisma.supportConversation.count({
        where: { status: 'OPEN' },
      }),
      prisma.supportConversation.count({
        where: { status: 'OPEN', priority: 'HIGH' },
      }),
      prisma.supportConversation.findMany({
        where: { status: 'OPEN' },
        include: {
          business: { select: { id: true, name: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: 10,
      }),
      prisma.user.count({
        where: { business: { isNot: null } },
      }),
      prisma.user.count({
        where: {
          business: { isNot: null },
          updatedAt: { gte: sevenDaysAgo },
        },
      }),
      prisma.user.count({
        where: {
          business: { isNot: null },
          updatedAt: { gte: thirtyDaysAgo },
        },
      }),
      prisma.subscription.count({
        where: {
          status: 'ACTIVE',
          nextBillingDate: { gte: now, lte: subDays(now, -30) },
        },
      }),
      prisma.business.findMany({
        where: {
          isActive: true,
          branches: { some: { isActive: true } },
          customers: { some: { lastVisit: { gte: thirtyDaysAgo } } },
        },
        include: {
          _count: {
            select: { branches: true, customers: true },
          },
        },
        take: 10,
      }),
      prisma.business.count({ where: { enableQRInVenue: true } }),
      prisma.business.count({ where: { enableQRRemote: true } }),
      prisma.business.count({
        where: {
          sales: { some: { createdAt: { gte: sevenDaysAgo } } },
        },
      }),
      prisma.sale.count({
        where: { createdAt: { gte: sevenDaysAgo } },
      }),
      prisma.sale.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
    ])

    // ─── Compute Customer Success Health Score ───────────────────────
    const customerSuccessHealthScore = computeCustomerSuccessHealthScore({
      totalBusinesses,
      activeBusinesses,
      inactiveBusinesses,
      activeSubscriptions,
      trialSubscriptions,
      gracePeriodSubscriptions,
      pastDueSubscriptions,
      cancelledSubscriptions30d,
      activeCustomers30d,
      totalCustomers,
      dormantCustomers90d,
      openSupportConversations,
      highPrioritySupport,
      noRecentActivityBusinesses,
    })

    // ─── Compute Retention Rate ──────────────────────────────────────
    const retentionRate = computeRetentionRate(activeSubscriptions, cancelledSubscriptions30d)

    // ─── Compute Adoption Rate ───────────────────────────────────────
    const adoptionRate = totalBusinesses > 0
      ? Math.round((businessesWithRecentSales / totalBusinesses) * 100)
      : 0

    // ─── Compute Activation Rate ─────────────────────────────────────
    const activationRate = totalBusinesses > 0
      ? Math.round((activeBusinesses / totalBusinesses) * 100)
      : 0

    // ─── Compute Churn Rate ──────────────────────────────────────────
    const churnRate = computeChurnRate(activeSubscriptions, cancelledSubscriptions30d)

    // ─── Build Customer Journey Pipeline ─────────────────────────────
    const journey = {
      lead: totalBusinesses - activeBusinesses - inactiveBusinesses > 0
        ? totalBusinesses - activeBusinesses
        : 0,
      trial: trialBusinesses,
      activation: newActivations30d,
      onboarding: newBusinesses30d,
      adoption: businessesWithRecentSales,
      healthy: activeBusinesses - lowActivityBusinesses - noRecentActivityBusinesses > 0
        ? activeBusinesses - lowActivityBusinesses - noRecentActivityBusinesses
        : 0,
      expansion: expansionCandidates.length,
      advocate: 0, // Derived from high-engagement businesses
    }

    // ─── Build Attention Items ───────────────────────────────────────
    const attentionItems = buildAttentionItems({
      trialExpiringSoon,
      gracePeriodSubscriptions,
      pastDueSubscriptions,
      lowActivityBusinesses,
      noRecentActivityBusinesses,
      dormantCustomers90d,
      openSupportConversations,
      highPrioritySupport,
      renewalsNext30d,
      cancelledSubscriptions30d,
      inactiveBusinesses,
    })

    // ─── Build AI Recommendations ────────────────────────────────────
    const recommendations = buildRecommendations({
      customerSuccessHealthScore,
      activeBusinesses,
      totalBusinesses,
      inactiveBusinesses,
      trialBusinesses,
      trialExpiringSoon,
      activeSubscriptions,
      gracePeriodSubscriptions,
      pastDueSubscriptions,
      cancelledSubscriptions30d,
      retentionRate,
      churnRate,
      adoptionRate,
      activationRate,
      activeCustomers30d,
      totalCustomers,
      dormantCustomers90d,
      newCustomers7d,
      newCustomers30d,
      openSupportConversations,
      highPrioritySupport,
      lowActivityBusinesses,
      noRecentActivityBusinesses,
      businessesByType,
      businessesByCity,
      topBusinessesByActivity,
      expansionCandidates,
      qrEnabledBusinesses,
      remoteOrderEnabledBusinesses,
      totalBranches,
      activeBranches,
    })

    // ─── Build Opportunities ─────────────────────────────────────────
    const opportunities = buildOpportunities({
      expansionCandidates,
      trialExpiringSoon,
      lowActivityBusinesses,
      noRecentActivityBusinesses,
      qrEnabledBusinesses,
      remoteOrderEnabledBusinesses,
      totalBusinesses,
      activeBusinesses,
      businessesByCity,
      topBusinessesByActivity,
      dormantCustomers90d,
      totalCustomers,
      activeCustomers30d,
    })

    res.status(200).json({
      customerSuccessHealthScore,
      retentionRate,
      churnRate,
      adoptionRate,
      activationRate,
      dailySummary,
      weeklySummary,
      customerHealthDistribution,
      subscriptionIntelligence,
      journey,
      activeBusinesses,
      totalBusinesses,
      inactiveBusinesses,
      newBusinesses7d,
      newBusinesses30d,
      newActivations7d,
      newActivations30d,
      trialBusinesses,
      trialExpiringSoon,
      activeSubscriptions,
      trialSubscriptions,
      gracePeriodSubscriptions,
      pastDueSubscriptions,
      cancelledSubscriptions30d,
      subscriptionsRenewingSoon,
      totalBranches,
      activeBranches,
      totalCustomers,
      activeCustomers30d,
      activeCustomers7d,
      newCustomers7d,
      newCustomers30d,
      dormantCustomers90d,
      businessesByType: businessesByType.map((b) => ({
        businessType: b.businessType || 'Unknown',
        count: b._count,
      })),
      businessesByCity: businessesByCity.map((b) => ({
        city: b.city,
        count: b._count,
      })),
      businessesByPlan: businessesByPlan.map((b) => ({
        planId: b.planId,
        count: b._count,
      })),
      topBusinessesByRevenue: topBusinessesByRevenue.map((b) => ({
        id: b.id,
        name: b.name,
        city: b.city,
        businessType: b.businessType,
        salesCount: b._count.sales,
        customerCount: b._count.customers,
        branchCount: b._count.branches,
      })),
      topBusinessesByCustomers: topBusinessesByCustomers.map((b) => ({
        id: b.id,
        name: b.name,
        city: b.city,
        businessType: b.businessType,
        customerCount: b._count.customers,
      })),
      topBusinessesByActivity: topBusinessesByActivity.map((b) => ({
        id: b.id,
        name: b.name,
        city: b.city,
        businessType: b.businessType,
        updatedAt: b.updatedAt,
      })),
      lowActivityBusinesses,
      noRecentActivityBusinesses,
      openSupportConversations,
      highPrioritySupport,
      recentSupportConversations: recentSupportConversations.map((c) => ({
        id: c.id,
        subject: c.subject,
        status: c.status,
        priority: c.priority,
        businessName: c.business.name,
        updatedAt: c.updatedAt,
      })),
      totalUsers,
      activeUsers7d,
      activeUsers30d,
      renewalsNext30d,
      expansionCandidates: expansionCandidates.map((b) => ({
        id: b.id,
        name: b.name,
        city: b.city,
        businessType: b.businessType,
        branchCount: b._count.branches,
        customerCount: b._count.customers,
      })),
      qrEnabledBusinesses,
      remoteOrderEnabledBusinesses,
      businessesWithRecentSales,
      totalSales7d,
      totalSales30d,
      attentionItems,
      recommendations,
      opportunities,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[customer-success-director API]', error)
    return res.status(500).json({ error: 'Failed to generate customer success intelligence' })
  }
}

export default handler

// ─── Helper Functions ────────────────────────────────────────────────────

function computeCustomerSuccessHealthScore(params: {
  totalBusinesses: number
  activeBusinesses: number
  inactiveBusinesses: number
  activeSubscriptions: number
  trialSubscriptions: number
  gracePeriodSubscriptions: number
  pastDueSubscriptions: number
  cancelledSubscriptions30d: number
  activeCustomers30d: number
  totalCustomers: number
  dormantCustomers90d: number
  openSupportConversations: number
  highPrioritySupport: number
  noRecentActivityBusinesses: number
}): number {
  const {
    totalBusinesses,
    activeBusinesses,
    inactiveBusinesses,
    activeSubscriptions,
    gracePeriodSubscriptions,
    pastDueSubscriptions,
    cancelledSubscriptions30d,
    activeCustomers30d,
    totalCustomers,
    dormantCustomers90d,
    openSupportConversations,
    highPrioritySupport,
    noRecentActivityBusinesses,
  } = params

  if (totalBusinesses === 0) return 0

  let score = 40

  // Active business ratio
  const activeRatio = activeBusinesses / totalBusinesses
  if (activeRatio > 0.8) score += 20
  else if (activeRatio > 0.6) score += 15
  else if (activeRatio > 0.4) score += 8
  else score -= 10

  // Inactive business rate
  const inactiveRate = inactiveBusinesses / totalBusinesses
  if (inactiveRate < 0.1) score += 10
  else if (inactiveRate > 0.3) score -= 15

  // Subscription health
  if (activeSubscriptions > 0 && gracePeriodSubscriptions === 0 && pastDueSubscriptions === 0) score += 10
  else if (gracePeriodSubscriptions > 5 || pastDueSubscriptions > 3) score -= 10

  // Cancellation rate
  if (cancelledSubscriptions30d === 0) score += 5
  else if (cancelledSubscriptions30d > 5) score -= 10

  // Customer engagement
  if (totalCustomers > 0) {
    const activeCustomerRate = activeCustomers30d / totalCustomers
    if (activeCustomerRate > 0.3) score += 10
    else if (activeCustomerRate > 0.15) score += 5
    else score -= 5

    const dormantRate = dormantCustomers90d / totalCustomers
    if (dormantRate > 0.5) score -= 10
  }

  // Support burden
  if (openSupportConversations === 0) score += 5
  if (highPrioritySupport > 3) score -= 10

  // Business activity
  if (noRecentActivityBusinesses > activeBusinesses * 0.3) score -= 10

  return Math.max(0, Math.min(100, score))
}

function computeRetentionRate(activeSubscriptions: number, cancelled30d: number): number {
  const total = activeSubscriptions + cancelled30d
  if (total === 0) return 100
  return Math.round((activeSubscriptions / total) * 100)
}

function computeChurnRate(activeSubscriptions: number, cancelled30d: number): number {
  const total = activeSubscriptions + cancelled30d
  if (total === 0) return 0
  return Math.round((cancelled30d / total) * 100)
}

function buildAttentionItems(params: {
  trialExpiringSoon: any[]
  gracePeriodSubscriptions: number
  pastDueSubscriptions: number
  lowActivityBusinesses: number
  noRecentActivityBusinesses: number
  dormantCustomers90d: number
  openSupportConversations: number
  highPrioritySupport: number
  renewalsNext30d: number
  cancelledSubscriptions30d: number
  inactiveBusinesses: number
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
    trialExpiringSoon,
    gracePeriodSubscriptions,
    pastDueSubscriptions,
    lowActivityBusinesses,
    noRecentActivityBusinesses,
    dormantCustomers90d,
    openSupportConversations,
    highPrioritySupport,
    renewalsNext30d,
    cancelledSubscriptions30d,
    inactiveBusinesses,
  } = params

  // Trials expiring soon
  if (trialExpiringSoon.length > 0) {
    const critical = trialExpiringSoon.filter((b) => {
      const days = b.trialEndDate ? Math.ceil((new Date(b.trialEndDate).getTime() - Date.now()) / 86400000) : 999
      return days <= 3
    })
    items.push({
      title: `${trialExpiringSoon.length} hospitality business${trialExpiringSoon.length > 1 ? 'es' : ''} with trial expiring within 7 days`,
      description: critical.length > 0
        ? `${critical.length} business(es) expire within 3 days — immediate conversion action required.`
        : `Review trial businesses and initiate conversion conversations.`,
      severity: critical.length > 0 ? 'CRITICAL' : 'HIGH',
      action: 'Review trial businesses and drive conversion',
      link: '/admin/restaurants',
    })
  }

  // Grace period subscriptions
  if (gracePeriodSubscriptions > 0) {
    items.push({
      title: `${gracePeriodSubscriptions} subscription${gracePeriodSubscriptions > 1 ? 's' : ''} in grace period`,
      description: `Businesses in grace period are at risk of cancellation. Initiate rescue outreach immediately.`,
      severity: 'HIGH',
      action: 'Review grace period subscriptions and initiate rescue',
      link: '/admin/subscriptions',
    })
  }

  // Past due subscriptions
  if (pastDueSubscriptions > 0) {
    items.push({
      title: `${pastDueSubscriptions} past due subscription${pastDueSubscriptions > 1 ? 's' : ''}`,
      description: `Past due subscriptions indicate payment issues requiring immediate attention.`,
      severity: 'CRITICAL',
      action: 'Review past due subscriptions and resolve payment issues',
      link: '/admin/subscriptions',
    })
  }

  // No recent activity businesses
  if (noRecentActivityBusinesses > 0) {
    items.push({
      title: `${noRecentActivityBusinesses} active business${noRecentActivityBusinesses > 1 ? 'es' : ''} with no activity in 60+ days`,
      description: `These businesses are at risk of churn. Re-engagement is critical.`,
      severity: 'HIGH',
      action: 'Initiate re-engagement outreach for inactive businesses',
      link: '/admin/restaurants',
    })
  }

  // Low activity businesses
  if (lowActivityBusinesses > 0) {
    items.push({
      title: `${lowActivityBusinesses} active business${lowActivityBusinesses > 1 ? 'es' : ''} with low activity (30+ days)`,
      description: `Low activity indicates adoption issues. Training and support recommended.`,
      severity: 'MEDIUM',
      action: 'Provide adoption support and training to low-activity businesses',
      link: '/admin/restaurants',
    })
  }

  // Dormant customers
  if (dormantCustomers90d > 0) {
    items.push({
      title: `${dormantCustomers90d} dormant customer${dormantCustomers90d > 1 ? 's' : ''} (90+ days no visit)`,
      description: `Dormant customers across the platform indicate business-level engagement issues.`,
      severity: 'MEDIUM',
      action: 'Review dormant customer patterns and support business re-engagement',
      link: '/admin/operations-intelligence',
    })
  }

  // High priority support
  if (highPrioritySupport > 0) {
    items.push({
      title: `${highPrioritySupport} high-priority support conversation${highPrioritySupport > 1 ? 's' : ''} open`,
      description: `High-priority support issues require immediate attention to prevent customer dissatisfaction.`,
      severity: 'CRITICAL',
      action: 'Review and resolve high-priority support conversations',
      link: '/admin/operations-intelligence',
    })
  }

  // Open support conversations
  if (openSupportConversations > 5) {
    items.push({
      title: `${openSupportConversations} open support conversation${openSupportConversations > 1 ? 's' : ''}`,
      description: `High volume of open support conversations may indicate systemic issues.`,
      severity: 'MEDIUM',
      action: 'Review support queue and prioritize resolution',
      link: '/admin/operations-intelligence',
    })
  }

  // Renewals approaching
  if (renewalsNext30d > 0) {
    items.push({
      title: `${renewalsNext30d} subscription renewal${renewalsNext30d > 1 ? 's' : ''} in next 30 days`,
      description: `Upcoming renewals require proactive engagement to ensure continuation.`,
      severity: 'MEDIUM',
      action: 'Review upcoming renewals and conduct success check-ins',
      link: '/admin/subscriptions',
    })
  }

  // Recent cancellations
  if (cancelledSubscriptions30d > 0) {
    items.push({
      title: `${cancelledSubscriptions30d} cancellation${cancelledSubscriptions30d > 1 ? 's' : ''} in last 30 days`,
      description: `Recent cancellations indicate churn risk. Review cancellation reasons and patterns.`,
      severity: 'HIGH',
      action: 'Analyze cancellation patterns and implement retention improvements',
      link: '/admin/subscriptions',
    })
  }

  // Inactive businesses
  if (inactiveBusinesses > 0) {
    items.push({
      title: `${inactiveBusinesses} inactive hospitality business${inactiveBusinesses > 1 ? 'es' : ''}`,
      description: `Inactive businesses represent lost customers. Review for reactivation potential.`,
      severity: 'LOW',
      action: 'Review inactive businesses for reactivation opportunities',
      link: '/admin/restaurants',
    })
  }

  return items
}

function buildRecommendations(params: {
  customerSuccessHealthScore: number
  activeBusinesses: number
  totalBusinesses: number
  inactiveBusinesses: number
  trialBusinesses: number
  trialExpiringSoon: any[]
  activeSubscriptions: number
  gracePeriodSubscriptions: number
  pastDueSubscriptions: number
  cancelledSubscriptions30d: number
  retentionRate: number
  churnRate: number
  adoptionRate: number
  activationRate: number
  activeCustomers30d: number
  totalCustomers: number
  dormantCustomers90d: number
  newCustomers7d: number
  newCustomers30d: number
  openSupportConversations: number
  highPrioritySupport: number
  lowActivityBusinesses: number
  noRecentActivityBusinesses: number
  businessesByType: any[]
  businessesByCity: any[]
  topBusinessesByActivity: any[]
  expansionCandidates: any[]
  qrEnabledBusinesses: number
  remoteOrderEnabledBusinesses: number
  totalBranches: number
  activeBranches: number
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
    customerSuccessHealthScore,
    activeBusinesses,
    totalBusinesses,
    inactiveBusinesses,
    trialBusinesses,
    trialExpiringSoon,
    activeSubscriptions,
    gracePeriodSubscriptions,
    pastDueSubscriptions,
    cancelledSubscriptions30d,
    retentionRate,
    churnRate,
    adoptionRate,
    activationRate,
    activeCustomers30d,
    totalCustomers,
    dormantCustomers90d,
    newCustomers7d,
    newCustomers30d,
    openSupportConversations,
    highPrioritySupport,
    lowActivityBusinesses,
    noRecentActivityBusinesses,
    businessesByCity,
    topBusinessesByActivity,
    expansionCandidates,
    qrEnabledBusinesses,
    remoteOrderEnabledBusinesses,
    totalBranches,
    activeBranches,
  } = params

  // 1. Overall customer success health
  const activeRatio = totalBusinesses > 0 ? (activeBusinesses / totalBusinesses) * 100 : 0
  recs.push({
    question: 'How healthy is our customer success ecosystem?',
    answer: customerSuccessHealthScore >= 70
      ? `Customer success is healthy with a score of ${customerSuccessHealthScore}/100. ${activeRatio.toFixed(0)}% of businesses are active, retention is ${retentionRate}%, and adoption is ${adoptionRate}%.`
      : customerSuccessHealthScore >= 50
        ? `Customer success needs attention with a score of ${customerSuccessHealthScore}/100. ${inactiveBusinesses} inactive businesses and ${lowActivityBusinesses} low-activity businesses require intervention.`
        : `Customer success is critical with a score of ${customerSuccessHealthScore}/100. Only ${activeRatio.toFixed(0)}% of businesses are active, ${churnRate}% churn rate, and ${noRecentActivityBusinesses} businesses with no recent activity.`,
    evidence: [
      `${totalBusinesses} total businesses (${activeBusinesses} active, ${inactiveBusinesses} inactive)`,
      `Retention rate: ${retentionRate}%, Churn rate: ${churnRate}%`,
      `Adoption rate: ${adoptionRate}%, Activation rate: ${activationRate}%`,
      `${activeSubscriptions} active subscriptions, ${gracePeriodSubscriptions} in grace, ${pastDueSubscriptions} past due`,
    ],
    confidence: customerSuccessHealthScore >= 70 ? 85 : customerSuccessHealthScore >= 50 ? 70 : 60,
    expectedImpact: customerSuccessHealthScore >= 70
      ? 'Maintain current success programs; focus on expansion and advocacy.'
      : 'Targeted intervention on at-risk businesses could improve retention by 15-25%.',
    suggestedActions: customerSuccessHealthScore >= 70
      ? ['Continue monitoring customer health', 'Focus on expansion opportunities', 'Develop advocacy programs']
      : ['Prioritize at-risk businesses for immediate outreach', 'Review adoption barriers', 'Implement proactive success check-ins'],
  })

  // 2. Trial conversion
  if (trialBusinesses > 0) {
    recs.push({
      question: 'How are our trial businesses progressing toward activation?',
      answer: trialExpiringSoon.length > 0
        ? `${trialBusinesses} businesses are in trial, with ${trialExpiringSoon.length} expiring within 7 days. Conversion action is needed immediately.`
        : `${trialBusinesses} businesses are in trial. No immediate expirations, but proactive engagement will improve conversion rates.`,
      evidence: [
        `${trialBusinesses} businesses currently in trial`,
        `${trialExpiringSoon.length} trials expiring within 7 days`,
        trialExpiringSoon[0] ? `Soonest: ${trialExpiringSoon[0].name} (${trialExpiringSoon[0].trialEndDate ? new Date(trialExpiringSoon[0].trialEndDate).toLocaleDateString() : 'N/A'})` : '',
      ].filter(Boolean),
      confidence: 80,
      expectedImpact: 'Proactive trial engagement can increase conversion rates by 20-30%.',
      suggestedActions: [
        trialExpiringSoon.length > 0 ? `Contact ${trialExpiringSoon.length} businesses with expiring trials today` : 'Schedule check-ins with all trial businesses',
        'Provide onboarding assistance to ensure trial businesses experience value',
        'Prepare conversion offers for businesses nearing trial end',
      ],
    })
  }

  // 3. Retention and churn
  if (churnRate > 3 || cancelledSubscriptions30d > 0 || gracePeriodSubscriptions > 0) {
    recs.push({
      question: 'What is our retention risk and what actions should we take?',
      answer: `Retention rate is ${retentionRate}% with ${cancelledSubscriptions30d} cancellations in the last 30 days. ${gracePeriodSubscriptions} subscriptions in grace period and ${pastDueSubscriptions} past due indicate elevated churn risk.`,
      evidence: [
        `Retention rate: ${retentionRate}%`,
        `${cancelledSubscriptions30d} cancellations in last 30 days`,
        `${gracePeriodSubscriptions} subscriptions in grace period`,
        `${pastDueSubscriptions} past due subscriptions`,
      ],
      confidence: 85,
      expectedImpact: 'Proactive retention outreach can recover 30-50% of at-risk subscriptions.',
      suggestedActions: [
        gracePeriodSubscriptions > 0 ? `Initiate rescue outreach for ${gracePeriodSubscriptions} grace period subscriptions` : 'Monitor subscription health continuously',
        pastDueSubscriptions > 0 ? `Resolve payment issues for ${pastDueSubscriptions} past due subscriptions` : 'Ensure payment processing is healthy',
        'Conduct exit interviews with recently cancelled customers to identify patterns',
      ],
    })
  }

  // 4. Adoption and engagement
  if (totalBusinesses > 0) {
    recs.push({
      question: 'How well are businesses adopting and engaging with the platform?',
      answer: adoptionRate >= 60
        ? `Adoption is healthy at ${adoptionRate}% — ${activeBusinesses} of ${totalBusinesses} businesses are actively using the platform. ${qrEnabledBusinesses} businesses have QR ordering enabled.`
        : `Adoption needs improvement at ${adoptionRate}%. ${lowActivityBusinesses} businesses show low activity and ${noRecentActivityBusinesses} have no recent activity. Training and onboarding support recommended.`,
      evidence: [
        `Adoption rate: ${adoptionRate}% (${activeBusinesses}/${totalBusinesses} active)`,
        `${lowActivityBusinesses} businesses with low activity (30+ days)`,
        `${noRecentActivityBusinesses} businesses with no activity (60+ days)`,
        `QR ordering enabled: ${qrEnabledBusinesses} businesses, Remote ordering: ${remoteOrderEnabledBusinesses}`,
        `${activeBranches} active branches out of ${totalBranches} total`,
      ],
      confidence: 75,
      expectedImpact: 'Improving adoption from current levels could increase customer lifetime value by 20-40%.',
      suggestedActions: [
        lowActivityBusinesses > 0 ? `Provide targeted training to ${lowActivityBusinesses} low-activity businesses` : 'Continue monitoring adoption metrics',
        noRecentActivityBusinesses > 0 ? `Initiate re-engagement for ${noRecentActivityBusinesses} inactive businesses` : 'Maintain engagement programs',
        `Promote QR and remote ordering features (currently ${qrEnabledBusinesses + remoteOrderEnabledBusinesses} businesses enabled)`,
      ],
    })
  }

  // 5. Customer engagement
  if (totalCustomers > 0) {
    const activeCustomerRate = (activeCustomers30d / totalCustomers) * 100
    recs.push({
      question: 'How engaged are end customers across the platform?',
      answer: activeCustomerRate >= 30
        ? `Customer engagement is healthy with ${activeCustomers30d} active customers (${activeCustomerRate.toFixed(0)}% of ${totalCustomers} total). ${newCustomers7d} new customers in the last 7 days.`
        : `Customer engagement needs attention — only ${activeCustomerRate.toFixed(0)}% of customers are active. ${dormantCustomers90d} dormant customers (90+ days) indicate business-level engagement gaps.`,
      evidence: [
        `${activeCustomers30d} active customers (30d) out of ${totalCustomers} total`,
        `${newCustomers7d} new customers in last 7 days, ${newCustomers30d} in last 30 days`,
        `${dormantCustomers90d} dormant customers (90+ days no visit)`,
        `Active customer rate: ${activeCustomerRate.toFixed(1)}%`,
      ],
      confidence: 75,
      expectedImpact: 'Supporting businesses to re-engage dormant customers could increase platform activity by 15-25%.',
      suggestedActions: [
        dormantCustomers90d > 0 ? `Help businesses re-engage ${dormantCustomers90d} dormant customers` : 'Continue monitoring customer engagement',
        'Share customer engagement best practices with low-performing businesses',
        'Develop customer loyalty program guidance for businesses',
      ],
    })
  }

  // 6. Expansion opportunities
  if (expansionCandidates.length > 0) {
    recs.push({
      question: 'Which businesses are ready for expansion?',
      answer: `${expansionCandidates.length} businesses show expansion signals — active branches, engaged customers, and consistent activity. These are candidates for upsell to higher plans or additional branches.`,
      evidence: expansionCandidates.slice(0, 5).map((b) =>
        `${b.name} (${b.city}) — ${b._count.branches} branches, ${b._count.customers} customers`
      ),
      confidence: 70,
      expectedImpact: `Expanding ${expansionCandidates.length} ready businesses could increase revenue by 15-25% from this segment.`,
      suggestedActions: [
        `Initiate expansion conversations with top ${Math.min(5, expansionCandidates.length)} candidates`,
        'Prepare upsell proposals highlighting multi-branch or premium plan benefits',
        'Leverage success stories from similar businesses that have expanded',
      ],
    })
  }

  // 7. Support health
  if (openSupportConversations > 0 || highPrioritySupport > 0) {
    recs.push({
      question: 'How is our support workload affecting customer success?',
      answer: highPrioritySupport > 0
        ? `${highPrioritySupport} high-priority support conversations are open out of ${openSupportConversations} total. High-priority items need immediate resolution to prevent customer dissatisfaction.`
        : `${openSupportConversations} support conversations are open. No high-priority items, but response time affects customer satisfaction.`,
      evidence: [
        `${openSupportConversations} open support conversations`,
        `${highPrioritySupport} high-priority conversations`,
        `Recent activity: ${topBusinessesByActivity.length} businesses updated in last 7 days`,
      ],
      confidence: 80,
      expectedImpact: 'Resolving support issues promptly can improve customer satisfaction scores by 20-30%.',
      suggestedActions: [
        highPrioritySupport > 0 ? `Resolve ${highPrioritySupport} high-priority support conversations immediately` : 'Maintain support response standards',
        'Review support patterns to identify systemic issues',
        'Proactively check in with businesses that have open support conversations',
      ],
    })
  }

  return recs
}

function buildOpportunities(params: {
  expansionCandidates: any[]
  trialExpiringSoon: any[]
  lowActivityBusinesses: number
  noRecentActivityBusinesses: number
  qrEnabledBusinesses: number
  remoteOrderEnabledBusinesses: number
  totalBusinesses: number
  activeBusinesses: number
  businessesByCity: any[]
  topBusinessesByActivity: any[]
  dormantCustomers90d: number
  totalCustomers: number
  activeCustomers30d: number
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
    expansionCandidates,
    trialExpiringSoon,
    lowActivityBusinesses,
    noRecentActivityBusinesses,
    qrEnabledBusinesses,
    remoteOrderEnabledBusinesses,
    totalBusinesses,
    activeBusinesses,
    businessesByCity,
    topBusinessesByActivity,
    dormantCustomers90d,
    totalCustomers,
    activeCustomers30d,
  } = params

  // Expansion candidates
  if (expansionCandidates.length > 0) {
    opportunities.push({
      type: 'EXPANSION',
      title: `${expansionCandidates.length} business${expansionCandidates.length > 1 ? 'es' : ''} ready for expansion`,
      description: `Businesses with active branches and engaged customers are candidates for upsell or multi-branch expansion.`,
      action: 'Initiate expansion conversations with ready businesses',
      expectedImpact: `Could increase revenue by 15-25% from ${expansionCandidates.length} expansion-ready businesses.`,
      link: '/admin/restaurants',
    })
  }

  // Trial conversion
  if (trialExpiringSoon.length > 0) {
    opportunities.push({
      type: 'TRIAL_CONVERSION',
      title: `${trialExpiringSoon.length} trial business${trialExpiringSoon.length > 1 ? 'es' : ''} ready for conversion`,
      description: `Trials expiring soon represent immediate conversion opportunities with proper engagement.`,
      action: 'Drive trial-to-subscription conversion with targeted outreach',
      expectedImpact: `Converting ${trialExpiringSoon.length} trials could add ${trialExpiringSoon.length} new active subscriptions.`,
      link: '/admin/restaurants',
    })
  }

  // Adoption improvement
  if (lowActivityBusinesses > 0) {
    opportunities.push({
      type: 'ADOPTION_IMPROVEMENT',
      title: `${lowActivityBusinesses} business${lowActivityBusinesses > 1 ? 'es' : ''} with adoption improvement potential`,
      description: `Low-activity businesses can benefit from training, onboarding refreshers, and feature education.`,
      action: 'Provide adoption training and support to low-activity businesses',
      expectedImpact: `Improving adoption for ${lowActivityBusinesses} businesses could increase their lifetime value by 20-40%.`,
      link: '/admin/restaurants',
    })
  }

  // Re-engagement
  if (noRecentActivityBusinesses > 0) {
    opportunities.push({
      type: 'RE_ENGAGEMENT',
      title: `${noRecentActivityBusinesses} business${noRecentActivityBusinesses > 1 ? 'es' : ''} needing re-engagement`,
      description: `Businesses with no activity in 60+ days need proactive outreach to prevent churn.`,
      action: 'Launch re-engagement campaign for inactive businesses',
      expectedImpact: `Re-engaging ${noRecentActivityBusinesses} businesses could recover 30-40% to active status.`,
      link: '/admin/restaurants',
    })
  }

  // Feature adoption
  const featureReady = totalBusinesses - qrEnabledBusinesses - remoteOrderEnabledBusinesses
  if (featureReady > 0) {
    opportunities.push({
      type: 'FEATURE_ADOPTION',
      title: `${featureReady} business${featureReady > 1 ? 'es' : ''} could benefit from QR and remote ordering`,
      description: `Only ${qrEnabledBusinesses} businesses have QR ordering and ${remoteOrderEnabledBusinesses} have remote ordering enabled. Feature adoption drives engagement.`,
      action: 'Promote QR and remote ordering features to eligible businesses',
      expectedImpact: `Enabling QR/remote ordering for ${featureReady} businesses could increase their transaction volume by 15-30%.`,
      link: '/admin/restaurants',
    })
  }

  // Customer re-engagement
  if (dormantCustomers90d > 0 && totalCustomers > 0) {
    opportunities.push({
      type: 'CUSTOMER_RE_ENGAGEMENT',
      title: `${dormantCustomers90d} dormant customer${dormantCustomers90d > 1 ? 's' : ''} across platform`,
      description: `Dormant customers represent re-engagement opportunities. Supporting businesses with re-engagement strategies can recover lost activity.`,
      action: 'Share customer re-engagement strategies with businesses',
      expectedImpact: `Re-engaging dormant customers could increase platform-wide activity by 10-20%.`,
      link: '/admin/operations-intelligence',
    })
  }

  // Regional expansion
  const underpenetrated = businessesByCity.filter((c) => c.count < 3)
  if (underpenetrated.length > 0) {
    opportunities.push({
      type: 'REGIONAL_EXPANSION',
      title: `${underpenetrated.length} cities with growth potential`,
      description: `Cities with fewer than 3 businesses represent expansion opportunities for customer success coverage.`,
      action: 'Develop customer success strategies for underpenetrated cities',
      expectedImpact: `Expanding customer success coverage to ${underpenetrated.length} cities could support ${underpenetrated.length * 5}+ new businesses.`,
      link: '/admin/restaurants',
    })
  }

  // Success milestones
  if (topBusinessesByActivity.length > 0) {
    opportunities.push({
      type: 'SUCCESS_MILESTONE',
      title: `${topBusinessesByActivity.length} highly active businesses ready for advocacy`,
      description: `Businesses with recent activity are candidates for case studies, testimonials, and advocacy programs.`,
      action: 'Develop advocacy program for highly engaged businesses',
      expectedImpact: `Advocacy from ${topBusinessesByActivity.length} businesses could accelerate new customer acquisition by 10-15%.`,
      link: '/admin/restaurants',
    })
  }

  return opportunities
}
