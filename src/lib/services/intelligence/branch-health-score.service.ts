/**
 * Branch Health Score Service
 * Calculates 0-100 health score for branches based on operational and financial signals
 */

import { prisma } from '@/lib/prisma'

export interface BranchHealthScore {
  branchId: string
  score: number
  category: 'EXCELLENT' | 'HEALTHY' | 'AT_RISK' | 'CRITICAL'
  signals: {
    revenueScore: number
    customerHealthScore: number
    paymentSuccessScore: number
    operationalScore: number
    growthScore: number
  }
  calculatedAt: Date
}

export class BranchHealthScoreService {
  /**
   * Calculate health score for a single branch
   */
  static async calculateScore(branchId: string): Promise<BranchHealthScore> {
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      include: {
        business: {
          include: {
            customers: true,
            paymentTransactions: {
              where: {
                createdAt: {
                  gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
                },
              },
            },
          },
        },
      },
    })

    if (!branch) {
      throw new Error(`Branch ${branchId} not found`)
    }

    // Calculate individual signal scores
    const revenueScore = await this.calculateRevenueScore(branch.business.id)
    const customerHealthScore = await this.calculateCustomerHealthScore(branch.business.id)
    const paymentSuccessScore = this.calculatePaymentSuccessScore(
      branch.business.paymentTransactions
    )
    const operationalScore = await this.calculateOperationalScore(branch.business.id)
    const growthScore = await this.calculateGrowthScore(branch.business.id)

    // Weighted average (total = 100)
    const score = Math.round(
      revenueScore * 0.3 + // 30% weight
        customerHealthScore * 0.25 + // 25% weight
        paymentSuccessScore * 0.2 + // 20% weight
        operationalScore * 0.15 + // 15% weight
        growthScore * 0.1 // 10% weight
    )

    // Determine category
    const category = this.determineCategory(score)

    return {
      branchId,
      score,
      category,
      signals: {
        revenueScore,
        customerHealthScore,
        paymentSuccessScore,
        operationalScore,
        growthScore,
      },
      calculatedAt: new Date(),
    }
  }

  /**
   * Calculate revenue score (0-100)
   * Based on revenue performance vs targets
   */
  private static async calculateRevenueScore(businessId: string): Promise<number> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    // Get revenue from FinancialLedgerEntry
    const revenue = await prisma.financialLedgerEntry.aggregate({
      where: {
        businessId,
        eventType: 'PAYMENT_SUCCESS',
        occurredAt: {
          gte: thirtyDaysAgo,
        },
      },
      _sum: {
        amountCents: true,
      },
    })

    const totalRevenue = revenue._sum.amountCents || 0
    const revenueRWF = totalRevenue / 100

    // Score based on monthly revenue
    if (revenueRWF >= 5000000) return 100 // 5M+ RWF/month
    if (revenueRWF >= 2000000) return 90 // 2M+ RWF/month
    if (revenueRWF >= 1000000) return 80 // 1M+ RWF/month
    if (revenueRWF >= 500000) return 70 // 500k+ RWF/month
    if (revenueRWF >= 200000) return 55 // 200k+ RWF/month
    if (revenueRWF >= 100000) return 40 // 100k+ RWF/month
    if (revenueRWF >= 50000) return 25 // 50k+ RWF/month
    return 10 // Under 50k RWF/month
  }

  /**
   * Calculate customer health score (0-100)
   * Based on active customers and customer health
   */
  private static async calculateCustomerHealthScore(businessId: string): Promise<number> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    // Get active customers (visited in last 30 days)
    const activeCustomers = await prisma.customer.count({
      where: {
        businessId,
        lastVisit: {
          gte: thirtyDaysAgo,
        },
      },
    })

    // Get total customers
    const totalCustomers = await prisma.customer.count({
      where: { businessId },
    })

    if (totalCustomers === 0) return 50 // Neutral for new branches

    const activeRate = activeCustomers / totalCustomers

    // Score based on active customer rate
    if (activeRate >= 0.5) return 100 // 50%+ active
    if (activeRate >= 0.3) return 85 // 30%+ active
    if (activeRate >= 0.2) return 70 // 20%+ active
    if (activeRate >= 0.1) return 50 // 10%+ active
    return 25 // Under 10% active
  }

  /**
   * Calculate payment success score (0-100)
   * Based on payment success rate
   */
  private static calculatePaymentSuccessScore(transactions: any[]): number {
    if (transactions.length === 0) return 50 // Neutral for no transactions

    const successful = transactions.filter((t) => t.status === 'SUCCESS').length
    const successRate = successful / transactions.length

    if (successRate >= 0.95) return 100 // 95%+ success
    if (successRate >= 0.9) return 90 // 90%+ success
    if (successRate >= 0.85) return 80 // 85%+ success
    if (successRate >= 0.75) return 65 // 75%+ success
    if (successRate >= 0.6) return 45 // 60%+ success
    return 25 // Under 60% success
  }

  /**
   * Calculate operational score (0-100)
   * Based on operational incidents and system health
   */
  private static async calculateOperationalScore(businessId: string): Promise<number> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    // Count failed payments (operational issue indicator)
    const failedPayments = await prisma.paymentTransaction.count({
      where: {
        businessId,
        status: 'FAILED',
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
    })

    // Score based on failure count
    if (failedPayments === 0) return 100 // No failures
    if (failedPayments <= 2) return 90 // 1-2 failures
    if (failedPayments <= 5) return 75 // 3-5 failures
    if (failedPayments <= 10) return 55 // 6-10 failures
    if (failedPayments <= 20) return 35 // 11-20 failures
    return 15 // 20+ failures
  }

  /**
   * Calculate growth score (0-100)
   * Based on customer and revenue growth trends
   */
  private static async calculateGrowthScore(businessId: string): Promise<number> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)

    // Get revenue for last 30 days
    const recentRevenue = await prisma.financialLedgerEntry.aggregate({
      where: {
        businessId,
        eventType: 'PAYMENT_SUCCESS',
        occurredAt: {
          gte: thirtyDaysAgo,
        },
      },
      _sum: {
        amountCents: true,
      },
    })

    // Get revenue for previous 30 days
    const previousRevenue = await prisma.financialLedgerEntry.aggregate({
      where: {
        businessId,
        eventType: 'PAYMENT_SUCCESS',
        occurredAt: {
          gte: sixtyDaysAgo,
          lt: thirtyDaysAgo,
        },
      },
      _sum: {
        amountCents: true,
      },
    })

    const recent = recentRevenue._sum.amountCents || 0
    const previous = previousRevenue._sum.amountCents || 0

    if (previous === 0) return 50 // Neutral for new branches

    const growthRate = ((recent - previous) / previous) * 100

    // Score based on growth rate
    if (growthRate >= 50) return 100 // 50%+ growth
    if (growthRate >= 25) return 90 // 25%+ growth
    if (growthRate >= 10) return 80 // 10%+ growth
    if (growthRate >= 0) return 65 // Positive growth
    if (growthRate >= -10) return 45 // Slight decline
    if (growthRate >= -25) return 25 // Moderate decline
    return 10 // Severe decline
  }

  /**
   * Determine category based on score
   */
  private static determineCategory(
    score: number
  ): 'EXCELLENT' | 'HEALTHY' | 'AT_RISK' | 'CRITICAL' {
    if (score >= 90) return 'EXCELLENT'
    if (score >= 70) return 'HEALTHY'
    if (score >= 50) return 'AT_RISK'
    return 'CRITICAL'
  }

  /**
   * Get branch rankings for a business
   */
  static async getBranchRankings(businessId: string): Promise<
    Array<{
      branchId: string
      branchName: string
      score: number
      category: string
      rank: number
    }>
  > {
    const branches = await prisma.branch.findMany({
      where: { businessId },
      select: { id: true, name: true },
    })

    const scores = await Promise.all(branches.map((b) => this.calculateScore(b.id)))

    // Sort by score descending
    const ranked = scores
      .map((s, index) => ({
        branchId: s.branchId,
        branchName: branches.find((b) => b.id === s.branchId)?.name || 'Unknown',
        score: s.score,
        category: s.category,
        rank: 0, // Will be set below
      }))
      .sort((a, b) => b.score - a.score)
      .map((item, index) => ({
        ...item,
        rank: index + 1,
      }))

    return ranked
  }
}
