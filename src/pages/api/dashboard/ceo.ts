/**
 * CEO Dashboard API
 * 
 * Phase: 1.2B
 * Governance: KPI_CATALOG_V2.md, FINANCIAL_DATA_GOVERNANCE.md
 * Data Source: FinancialLedgerEntry (PRIMARY for all revenue metrics)
 * 
 * Performance Target: <2s response time (p95)
 * 
 * This endpoint aggregates data from:
 * - FinancialLedgerEntry (revenue metrics)
 * - Watchdog services (operational health)
 * - Intelligence services (health scores, executive summary)
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { startOfDay, subDays, startOfMonth, endOfMonth } from 'date-fns'

// Import existing services
import { PaymentWatchdogService } from '@/lib/services/watchdog/payment-watchdog.service'
import { QueueWatchdogService } from '@/lib/services/watchdog/queue-watchdog.service'
import { ReconciliationWatchdogService } from '@/lib/services/watchdog/reconciliation-watchdog.service'
import { RevenueWatchdogService } from '@/lib/services/watchdog/revenue-watchdog.service'
import { SubscriptionWatchdogService } from '@/lib/services/watchdog/subscription-watchdog.service'
import { CustomerWatchdogService } from '@/lib/services/watchdog/customer-watchdog.service'
import { BranchHealthScoreService } from '@/lib/services/intelligence/branch-health-score.service'
import { CustomerHealthScoreService } from '@/lib/services/intelligence/customer-health-score.service'
import { ExecutiveSummaryService } from '@/lib/services/intelligence/executive-summary.service'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)
    
    if (!session?.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Check if user has CEO/executive access
    // @ts-ignore
    const userRole = session.user.role
    if (!['ADMIN', 'OWNER', 'CEO'].includes(userRole)) {
      return res.status(403).json({ error: 'Forbidden - CEO access required' })
    }

    const startTime = Date.now()

    // Fetch all data in parallel for performance
    const [
      businessHealth,
      revenue,
      customers,
      operations,
      hospitality,
      executiveInsight
    ] = await Promise.all([
      getBusinessHealthData(),
      getRevenueData(),
      getCustomerData(),
      getOperationsData(),
      getHospitalityData(),
      getExecutiveInsightData()
    ])

    const loadTime = Date.now() - startTime

    return res.status(200).json({
      businessHealth,
      revenue,
      customers,
      operations,
      hospitality,
      executiveInsight,
      loadTime
    })
  } catch (error) {
    console.error('CEO Dashboard API error:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

// 1. Business Health Overview Data
async function getBusinessHealthData() {
  try {
    // Get watchdog statuses
    const [
      revenueHealth,
      subscriptionHealth,
      customerHealth,
      paymentHealth
    ] = await Promise.all([
      RevenueWatchdogService.getHealth(),
      SubscriptionWatchdogService.getHealth(),
      CustomerWatchdogService.getHealth(),
      PaymentWatchdogService.getHealth()
    ])

    // Calculate overall business health score (0-100)
    // Weight: Revenue 30%, Subscriptions 25%, Customers 25%, Operations 20%
    const revenueScore = revenueHealth === 'HEALTHY' ? 100 : revenueHealth === 'WARNING' ? 70 : 30
    const subscriptionScore = subscriptionHealth === 'HEALTHY' ? 100 : subscriptionHealth === 'WARNING' ? 70 : 30
    const customerScore = customerHealth === 'HEALTHY' ? 100 : customerHealth === 'WARNING' ? 70 : 30
    const operationsScore = paymentHealth === 'HEALTHY' ? 100 : paymentHealth === 'WARNING' ? 70 : 30

    const overallScore = Math.round(
      revenueScore * 0.30 +
      subscriptionScore * 0.25 +
      customerScore * 0.25 +
      operationsScore * 0.20
    )

    // Determine status
    let status: 'EXCELLENT' | 'HEALTHY' | 'AT_RISK' | 'CRITICAL'
    if (overallScore >= 90) status = 'EXCELLENT'
    else if (overallScore >= 70) status = 'HEALTHY'
    else if (overallScore >= 50) status = 'AT_RISK'
    else status = 'CRITICAL'

    // Calculate 7-day trend (simplified - compare to last week's score)
    const trend = 2.5 // Placeholder - would calculate from historical data

    return {
      score: overallScore,
      status,
      trend,
      signals: {
        revenue: revenueHealth,
        subscriptions: subscriptionHealth,
        customers: customerHealth,
        operations: paymentHealth
      }
    }
  } catch (error) {
    console.error('Error getting business health data:', error)
    return {
      score: 0,
      status: 'CRITICAL' as const,
      trend: 0,
      signals: {
        revenue: 'CRITICAL' as const,
        subscriptions: 'CRITICAL' as const,
        customers: 'CRITICAL' as const,
        operations: 'CRITICAL' as const
      }
    }
  }
}

// 2. Revenue & Growth Data
async function getRevenueData() {
  try {
    const now = new Date()
    const currentMonthStart = startOfMonth(now)
    const currentMonthEnd = endOfMonth(now)
    const lastMonthStart = startOfMonth(subDays(now, 30))
    const lastMonthEnd = endOfMonth(subDays(now, 30))
    const last7Days = subDays(now, 7)
    const last30Days = subDays(now, 30)

    // MRR - Monthly Recurring Revenue from FinancialLedgerEntry
    // Per KPI_CATALOG_V2.md: Use FinancialLedgerEntry with eventType = 'SUBSCRIPTION_CHARGE'
    const [currentMRR, lastMonthMRR] = await Promise.all([
      prisma.financialLedgerEntry.aggregate({
        where: {
          eventType: 'SUBSCRIPTION_CHARGE',
          occurredAt: {
            gte: currentMonthStart,
            lte: currentMonthEnd
          }
        },
        _sum: { amountCents: true }
      }),
      prisma.financialLedgerEntry.aggregate({
        where: {
          eventType: 'SUBSCRIPTION_CHARGE',
          occurredAt: {
            gte: lastMonthStart,
            lte: lastMonthEnd
          }
        },
        _sum: { amountCents: true }
      })
    ])

    const mrr = (currentMRR._sum.amountCents || 0) / 100
    const lastMrr = (lastMonthMRR._sum.amountCents || 0) / 100
    const mrrChange = lastMrr > 0 ? ((mrr - lastMrr) / lastMrr) * 100 : 0

    // ARR = MRR × 12
    const arr = mrr * 12

    // GMV - Gross Merchandise Value from FinancialLedgerEntry
    // Per KPI_CATALOG_V2.md: Use eventType = 'PAYMENT_SUCCESS'
    const [currentGMV, lastMonthGMV] = await Promise.all([
      prisma.financialLedgerEntry.aggregate({
        where: {
          eventType: 'PAYMENT_SUCCESS',
          occurredAt: {
            gte: currentMonthStart,
            lte: currentMonthEnd
          }
        },
        _sum: { amountCents: true }
      }),
      prisma.financialLedgerEntry.aggregate({
        where: {
          eventType: 'PAYMENT_SUCCESS',
          occurredAt: {
            gte: lastMonthStart,
            lte: lastMonthEnd
          }
        },
        _sum: { amountCents: true }
      })
    ])

    const gmv = (currentGMV._sum.amountCents || 0) / 100
    const lastGmv = (lastMonthGMV._sum.amountCents || 0) / 100
    const gmvChange = lastGmv > 0 ? ((gmv - lastGmv) / lastGmv) * 100 : 0

    // Revenue Growth (7d and 30d)
    const [revenue7d, revenue14d, revenue30d, revenue60d] = await Promise.all([
      prisma.financialLedgerEntry.aggregate({
        where: {
          eventType: 'PAYMENT_SUCCESS',
          occurredAt: { gte: last7Days }
        },
        _sum: { amountCents: true }
      }),
      prisma.financialLedgerEntry.aggregate({
        where: {
          eventType: 'PAYMENT_SUCCESS',
          occurredAt: { gte: subDays(now, 14), lte: last7Days }
        },
        _sum: { amountCents: true }
      }),
      prisma.financialLedgerEntry.aggregate({
        where: {
          eventType: 'PAYMENT_SUCCESS',
          occurredAt: { gte: last30Days }
        },
        _sum: { amountCents: true }
      }),
      prisma.financialLedgerEntry.aggregate({
        where: {
          eventType: 'PAYMENT_SUCCESS',
          occurredAt: { gte: subDays(now, 60), lte: last30Days }
        },
        _sum: { amountCents: true }
      })
    ])

    const rev7d = (revenue7d._sum.amountCents || 0) / 100
    const rev14d = (revenue14d._sum.amountCents || 0) / 100
    const rev30d = (revenue30d._sum.amountCents || 0) / 100
    const rev60d = (revenue60d._sum.amountCents || 0) / 100

    const revenueGrowth7d = rev14d > 0 ? ((rev7d - rev14d) / rev14d) * 100 : 0
    const revenueGrowth30d = rev60d > 0 ? ((rev30d - rev60d) / rev60d) * 100 : 0

    // Revenue at Risk - REMOVED due to governance violation
    // Per FINANCIAL_DATA_GOVERNANCE.md: Revenue metrics must use FinancialLedgerEntry exclusively
    // Per KPI_CATALOG_V2.md line 235: Requires metadata.subscriptionStatus = 'GRACE_PERIOD'
    // Current schema does not support metadata.subscriptionStatus field
    // Using Subscription table proxy would violate governance
    // TODO: Re-implement when schema supports FinancialLedgerEntry.metadata.subscriptionStatus
    const revenueAtRisk = 0
    const revenueAtRiskPercent = 0

    // Top Customer Concentration
    // Get top 10 customers by revenue from FinancialLedgerEntry
    const topCustomers = await prisma.financialLedgerEntry.groupBy({
      by: ['customerId'],
      where: {
        eventType: 'PAYMENT_SUCCESS',
        occurredAt: { gte: last30Days },
        customerId: { not: null }
      },
      _sum: { amountCents: true },
      orderBy: { _sum: { amountCents: 'desc' } },
      take: 10
    })

    const topCustomerRevenue = topCustomers.reduce((sum, c) => sum + (c._sum.amountCents || 0), 0) / 100
    const totalRevenue = rev30d
    const topCustomerConcentration = totalRevenue > 0 ? (topCustomerRevenue / totalRevenue) * 100 : 0

    // Generate insight
    let insight = 'Revenue is stable.'
    if (mrrChange > 10) insight = `MRR grew ${mrrChange.toFixed(1)}% - strong subscription growth.`
    else if (mrrChange < -5) insight = `MRR declined ${Math.abs(mrrChange).toFixed(1)}% - investigate churn drivers.`
    else if (revenueAtRiskPercent > 15) insight = `${revenueAtRiskPercent.toFixed(1)}% of MRR at risk from grace period subscriptions.`
    else if (topCustomerConcentration > 40) insight = `High revenue concentration: top 10 customers represent ${topCustomerConcentration.toFixed(1)}% of revenue.`

    return {
      mrr,
      mrrChange,
      arr,
      gmv,
      gmvChange,
      revenueGrowth7d,
      revenueGrowth30d,
      revenueAtRisk,
      revenueAtRiskPercent,
      topCustomerConcentration,
      insight
    }
  } catch (error) {
    console.error('Error getting revenue data:', error)
    return {
      mrr: 0,
      mrrChange: 0,
      arr: 0,
      gmv: 0,
      gmvChange: 0,
      revenueGrowth7d: 0,
      revenueGrowth30d: 0,
      revenueAtRisk: 0,
      revenueAtRiskPercent: 0,
      topCustomerConcentration: 0,
      insight: 'Error loading revenue data'
    }
  }
}

// 3. Customer & Retention Data
async function getCustomerData() {
  try {
    // Get customer health distribution from CustomerHealthScoreService
    const healthDistribution = await CustomerHealthScoreService.getDistribution()

    // High-value dormant customers (customers with high LTV but no recent activity)
    const highValueDormant = await prisma.customer.count({
      where: {
        lifetimeSpendCents: { gte: 100000 }, // RWF 1000+
        lastVisit: { lte: subDays(new Date(), 30) }
      }
    })

    // Revenue Churn Rate - from FinancialLedgerEntry
    const currentMonthStart = startOfMonth(new Date())
    const lastMonthStart = startOfMonth(subDays(new Date(), 30))
    
    const [currentMRR, lastMRR] = await Promise.all([
      prisma.financialLedgerEntry.aggregate({
        where: {
          eventType: 'SUBSCRIPTION_CHARGE',
          occurredAt: { gte: currentMonthStart }
        },
        _sum: { amountCents: true }
      }),
      prisma.financialLedgerEntry.aggregate({
        where: {
          eventType: 'SUBSCRIPTION_CHARGE',
          occurredAt: { gte: lastMonthStart, lte: currentMonthStart }
        },
        _sum: { amountCents: true }
      })
    ])

    const mrr = (currentMRR._sum.amountCents || 0) / 100
    const lastMrr = (lastMRR._sum.amountCents || 0) / 100
    const revenueChurnRate = lastMrr > 0 ? Math.max(0, ((lastMrr - mrr) / lastMrr) * 100) : 0

    // Customer Churn Rate - per KPI_CATALOG_V2.md line 589-605
    // Definition: Percentage of customers who become inactive (no activity in 90 days)
    // Formula: (Churned Customers / Starting Customers) × 100
    // Churned Customer: No activity (sale, reservation, or visit) in last 90 days
    const totalCustomers = await prisma.customer.count()
    const inactiveCustomers = await prisma.customer.count({
      where: {
        lastVisit: { lte: subDays(new Date(), 90) }
      }
    })
    
    // Per KPI catalog, this measures current inactive rate (snapshot)
    // Note: This is "inactive customer rate" not "period churn rate"
    const customerChurnRate = totalCustomers > 0 ? (inactiveCustomers / totalCustomers) * 100 : 0

    // Retention Rate - inverse of churn rate
    const retentionRate = 100 - customerChurnRate

    // New vs Returning customers (last 30 days)
    const last30Days = subDays(new Date(), 30)
    const [newCustomers, returningCustomers] = await Promise.all([
      prisma.customer.count({
        where: {
          createdAt: { gte: last30Days }
        }
      }),
      prisma.customer.count({
        where: {
          createdAt: { lt: last30Days },
          lastVisit: { gte: last30Days }
        }
      })
    ])

    // Risk Summary
    const atRiskCustomers = await prisma.customer.count({
      where: {
        lastVisit: { 
          gte: subDays(new Date(), 90),
          lte: subDays(new Date(), 30)
        }
      }
    })

    const highValueLosses = await prisma.customer.count({
      where: {
        lifetimeSpendCents: { gte: 100000 },
        lastVisit: { lte: subDays(new Date(), 90) }
      }
    })

    const churnDrivers: string[] = []
    if (revenueChurnRate > 5) churnDrivers.push('High revenue churn')
    if (highValueLosses > 0) churnDrivers.push(`${highValueLosses} high-value customer losses`)
    if (customerChurnRate > 20) churnDrivers.push('High customer churn rate')

    return {
      healthDistribution,
      highValueDormant,
      revenueChurnRate,
      customerChurnRate,
      retentionRate,
      newCustomers,
      returningCustomers,
      riskSummary: {
        atRiskCount: atRiskCustomers,
        churnDrivers,
        highValueLosses
      }
    }
  } catch (error) {
    console.error('Error getting customer data:', error)
    return {
      healthDistribution: {
        excellent: 0,
        healthy: 0,
        atRisk: 0,
        critical: 0
      },
      highValueDormant: 0,
      revenueChurnRate: 0,
      customerChurnRate: 0,
      retentionRate: 0,
      newCustomers: 0,
      returningCustomers: 0,
      riskSummary: {
        atRiskCount: 0,
        churnDrivers: [],
        highValueLosses: 0
      }
    }
  }
}

// 4. Operations Health Data
async function getOperationsData() {
  try {
    // Get watchdog statuses
    const [paymentHealth, queueHealth] = await Promise.all([
      PaymentWatchdogService.getHealth(),
      QueueWatchdogService.getHealth()
    ])

    // Reconciliation backlog - REMOVED due to schema mismatch
    // Per KPI_CATALOG_V2.md line 439: Requires reconciliationStatus field
    // Current schema does not support FinancialLedgerEntry.reconciliationStatus
    // Using createdAt proxy would be unreliable (old entries may be reconciled)
    // TODO: Re-implement when schema supports reconciliationStatus field
    const reconciliationBacklog = 0

    // DLQ count from queue watchdog
    const dlqCount = await QueueWatchdogService.getDLQCount()

    // Provider failure rate from payment watchdog
    const providerFailureRate = await PaymentWatchdogService.getFailureRate()

    // Incidents in last 24h (count ERROR and CRITICAL alerts)
    const incidents24h = 0 // Would query alert log

    // Detect bottleneck
    let bottleneck: string | null = null
    if (dlqCount > 10) {
      bottleneck = 'High DLQ count - queue processing failures require investigation'
    } else if (providerFailureRate > 5) {
      bottleneck = `Payment provider failure rate at ${providerFailureRate.toFixed(1)}% - provider reliability issue`
    }

    return {
      paymentHealth,
      queueHealth,
      reconciliationBacklog,
      dlqCount,
      providerFailureRate,
      incidents24h,
      bottleneck
    }
  } catch (error) {
    console.error('Error getting operations data:', error)
    return {
      paymentHealth: 'CRITICAL' as const,
      queueHealth: 'CRITICAL' as const,
      reconciliationBacklog: 0,
      dlqCount: 0,
      providerFailureRate: 0,
      incidents24h: 0,
      bottleneck: 'Error loading operations data'
    }
  }
}

// 5. Hospitality Performance Data
async function getHospitalityData() {
  try {
    // Get all businesses (branches) with health scores
    const businesses = await prisma.business.findMany({
      select: {
        id: true,
        name: true
      }
    })

    // Optimize: Batch all revenue queries instead of N+1 pattern
    const currentMonthStart = startOfMonth(new Date())
    const lastMonthStart = startOfMonth(subDays(new Date(), 30))
    
    // Get all branch revenues in 2 queries instead of N×2 queries
    const [currentMonthRevenues, lastMonthRevenues, customerCounts] = await Promise.all([
      // Current month revenues grouped by branch
      prisma.financialLedgerEntry.groupBy({
        by: ['businessId'],
        where: {
          eventType: 'PAYMENT_SUCCESS',
          occurredAt: { gte: currentMonthStart }
        },
        _sum: { amountCents: true }
      }),
      // Last month revenues grouped by branch
      prisma.financialLedgerEntry.groupBy({
        by: ['businessId'],
        where: {
          eventType: 'PAYMENT_SUCCESS',
          occurredAt: { gte: lastMonthStart, lt: currentMonthStart }
        },
        _sum: { amountCents: true }
      }),
      // Customer counts grouped by branch
      prisma.customer.groupBy({
        by: ['businessId'],
        _count: { id: true }
      })
    ])

    // Create lookup maps for O(1) access
    const currentRevenueMap = new Map(
      currentMonthRevenues.map(r => [r.businessId, (r._sum.amountCents || 0) / 100])
    )
    const lastRevenueMap = new Map(
      lastMonthRevenues.map(r => [r.businessId, (r._sum.amountCents || 0) / 100])
    )
    const customerCountMap = new Map(
      customerCounts.map(c => [c.businessId, c._count.id])
    )

    // Calculate health scores in parallel (still N queries but unavoidable without caching)
    const healthScores = await Promise.all(
      businesses.map(b => BranchHealthScoreService.calculateScore(b.id))
    )

    // Assemble branch data using pre-fetched data
    const branchData = businesses.map((business, index) => {
      const revenue = currentRevenueMap.get(business.id) || 0
      const lastRevenue = lastRevenueMap.get(business.id) || 0
      const revenueChange = lastRevenue > 0 ? ((revenue - lastRevenue) / lastRevenue) * 100 : 0
      const customerCount = customerCountMap.get(business.id) || 0

      return {
        id: business.id,
        name: business.name,
        healthScore: healthScores[index],
        revenue,
        revenueChange,
        customerCount
      }
    })

    // Sort by health score and assign ranks
    const sortedBranches = branchData
      .sort((a, b) => b.healthScore - a.healthScore)
      .map((branch, index) => ({
        ...branch,
        rank: index + 1
      }))

    // Identify opportunities
    const opportunities: string[] = []
    
    // Find underperforming branches with high customer count
    const underperformingHighTraffic = sortedBranches.filter(
      b => b.healthScore < 70 && b.customerCount > 100
    )
    if (underperformingHighTraffic.length > 0) {
      opportunities.push(
        `${underperformingHighTraffic[0].name} has high traffic but low health score - operational improvement opportunity`
      )
    }

    // Find high performers with growth
    const highPerformersGrowing = sortedBranches.filter(
      b => b.healthScore >= 90 && b.revenueChange > 10
    )
    if (highPerformersGrowing.length > 0) {
      opportunities.push(
        `${highPerformersGrowing[0].name} showing strong growth - consider as model for other branches`
      )
    }

    // Find branches with declining revenue
    const decliningRevenue = sortedBranches.filter(b => b.revenueChange < -10)
    if (decliningRevenue.length > 0) {
      opportunities.push(
        `${decliningRevenue.length} branch(es) with declining revenue - requires immediate attention`
      )
    }

    return {
      branches: sortedBranches,
      opportunities
    }
  } catch (error) {
    console.error('Error getting hospitality data:', error)
    return {
      branches: [],
      opportunities: ['Error loading hospitality data']
    }
  }
}

// Executive Insight Data
async function getExecutiveInsightData() {
  try {
    // Get latest executive summary from ExecutiveSummaryService
    const summary = await ExecutiveSummaryService.getLatestSummary('DAILY')

    if (summary) {
      return {
        revenue: summary.revenue || 'No revenue insights available',
        customers: summary.customers || 'No customer insights available',
        operations: summary.operations || 'No operational insights available',
        risks: summary.risks || [],
        opportunities: summary.opportunities || [],
        generatedAt: summary.generatedAt.toISOString()
      }
    }

    // Fallback: generate basic insight
    return {
      revenue: 'Revenue data loading...',
      customers: 'Customer data loading...',
      operations: 'Operations data loading...',
      risks: [],
      opportunities: [],
      generatedAt: new Date().toISOString()
    }
  } catch (error) {
    console.error('Error getting executive insight:', error)
    return {
      revenue: 'Error loading revenue insights',
      customers: 'Error loading customer insights',
      operations: 'Error loading operational insights',
      risks: ['Error loading risk data'],
      opportunities: [],
      generatedAt: new Date().toISOString()
    }
  }
}
