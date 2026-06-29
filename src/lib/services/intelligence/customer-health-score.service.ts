/**
 * Customer Health Score Service
 * Calculates 0-100 health score for customers based on platform signals
 */

import { prisma } from '@/lib/prisma'

export interface CustomerHealthScore {
  customerId: string
  score: number
  category: 'EXCELLENT' | 'HEALTHY' | 'AT_RISK' | 'CRITICAL'
  signals: {
    recencyScore: number
    frequencyScore: number
    monetaryScore: number
    paymentHealthScore: number
    engagementScore: number
  }
  calculatedAt: Date
}

export class CustomerHealthScoreService {
  /**
   * Calculate health score for a single customer
   */
  static async calculateScore(customerId: string): Promise<CustomerHealthScore> {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        sales: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    })

    if (!customer) {
      throw new Error(`Customer ${customerId} not found`)
    }

    // Calculate individual signal scores
    const recencyScore = this.calculateRecencyScore(customer.lastVisit)
    const frequencyScore = this.calculateFrequencyScore(customer.visitCount, customer.createdAt)
    const monetaryScore = this.calculateMonetaryScore(customer.lifetimeSpendCents)
    const paymentHealthScore = this.calculatePaymentHealthScore(customer.sales)
    const engagementScore = this.calculateEngagementScore(customer.lastVisit, customer.visitCount)

    // Weighted average (total = 100)
    const score = Math.round(
      recencyScore * 0.25 + // 25% weight
        frequencyScore * 0.2 + // 20% weight
        monetaryScore * 0.25 + // 25% weight
        paymentHealthScore * 0.15 + // 15% weight
        engagementScore * 0.15 // 15% weight
    )

    // Determine category
    const category = this.determineCategory(score)

    return {
      customerId,
      score,
      category,
      signals: {
        recencyScore,
        frequencyScore,
        monetaryScore,
        paymentHealthScore,
        engagementScore,
      },
      calculatedAt: new Date(),
    }
  }

  /**
   * Calculate health scores for multiple customers
   */
  static async calculateBulkScores(customerIds: string[]): Promise<CustomerHealthScore[]> {
    const scores: CustomerHealthScore[] = []

    for (const customerId of customerIds) {
      try {
        const score = await this.calculateScore(customerId)
        scores.push(score)
      } catch (error) {
        console.error(`Failed to calculate score for customer ${customerId}:`, error)
      }
    }

    return scores
  }

  /**
   * Calculate recency score (0-100)
   * Recent activity = higher score
   */
  private static calculateRecencyScore(lastVisit: Date | null): number {
    if (!lastVisit) return 0

    const daysSinceLastVisit = (Date.now() - lastVisit.getTime()) / (1000 * 60 * 60 * 24)

    if (daysSinceLastVisit <= 7) return 100 // Within 1 week
    if (daysSinceLastVisit <= 14) return 90 // Within 2 weeks
    if (daysSinceLastVisit <= 30) return 75 // Within 1 month
    if (daysSinceLastVisit <= 60) return 50 // Within 2 months
    if (daysSinceLastVisit <= 90) return 25 // Within 3 months
    return 0 // Over 3 months
  }

  /**
   * Calculate frequency score (0-100)
   * More visits = higher score
   */
  private static calculateFrequencyScore(visitCount: number, createdAt: Date): number {
    const accountAgeDays = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
    const visitsPerMonth = (visitCount / accountAgeDays) * 30

    if (visitsPerMonth >= 8) return 100 // 2+ visits per week
    if (visitsPerMonth >= 4) return 85 // 1+ visit per week
    if (visitsPerMonth >= 2) return 70 // 2+ visits per month
    if (visitsPerMonth >= 1) return 50 // 1+ visit per month
    if (visitsPerMonth >= 0.5) return 30 // 1 visit every 2 months
    return 10 // Very infrequent
  }

  /**
   * Calculate monetary score (0-100)
   * Higher lifetime spend = higher score
   */
  private static calculateMonetaryScore(lifetimeSpendCents: number): number {
    const lifetimeSpend = lifetimeSpendCents / 100 // Convert to RWF

    if (lifetimeSpend >= 500000) return 100 // 500k+ RWF
    if (lifetimeSpend >= 200000) return 90 // 200k+ RWF
    if (lifetimeSpend >= 100000) return 80 // 100k+ RWF
    if (lifetimeSpend >= 50000) return 70 // 50k+ RWF
    if (lifetimeSpend >= 20000) return 55 // 20k+ RWF
    if (lifetimeSpend >= 10000) return 40 // 10k+ RWF
    if (lifetimeSpend >= 5000) return 25 // 5k+ RWF
    return 10 // Under 5k RWF
  }

  /**
   * Calculate payment health score (0-100)
   * Successful payments = higher score
   */
  private static calculatePaymentHealthScore(sales: any[]): number {
    if (sales.length === 0) return 50 // Neutral for no sales

    // Check last 10 sales for payment issues
    const recentSales = sales.slice(0, 10)
    const successfulPayments = recentSales.filter((s) => s.paymentStatus === 'PAID').length
    const successRate = successfulPayments / recentSales.length

    if (successRate >= 0.95) return 100 // 95%+ success
    if (successRate >= 0.85) return 85 // 85%+ success
    if (successRate >= 0.7) return 70 // 70%+ success
    if (successRate >= 0.5) return 50 // 50%+ success
    return 25 // Under 50% success
  }

  /**
   * Calculate engagement score (0-100)
   * Combination of recency and frequency
   */
  private static calculateEngagementScore(lastVisit: Date | null, visitCount: number): number {
    if (!lastVisit) return 0

    const daysSinceLastVisit = (Date.now() - lastVisit.getTime()) / (1000 * 60 * 60 * 24)

    // Engaged if recent visit AND multiple visits
    if (daysSinceLastVisit <= 14 && visitCount >= 5) return 100
    if (daysSinceLastVisit <= 30 && visitCount >= 3) return 80
    if (daysSinceLastVisit <= 60 && visitCount >= 2) return 60
    if (daysSinceLastVisit <= 90) return 40
    return 20
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
   * Get health score distribution for a business
   */
  static async getScoreDistribution(businessId: string): Promise<{
    excellent: number
    healthy: number
    atRisk: number
    critical: number
    total: number
  }> {
    const customers = await prisma.customer.findMany({
      where: { businessId },
      select: { id: true },
    })

    const scores = await this.calculateBulkScores(customers.map((c) => c.id))

    return {
      excellent: scores.filter((s) => s.category === 'EXCELLENT').length,
      healthy: scores.filter((s) => s.category === 'HEALTHY').length,
      atRisk: scores.filter((s) => s.category === 'AT_RISK').length,
      critical: scores.filter((s) => s.category === 'CRITICAL').length,
      total: scores.length,
    }
  }

  /**
   * Get health distribution for all customers (for CEO Dashboard)
   * Optimized version using direct aggregation instead of calculating individual scores
   * Performance: O(1) database queries instead of O(n) score calculations
   */
  static async getDistribution(): Promise<{
    excellent: number
    healthy: number
    atRisk: number
    critical: number
  }> {
    const now = new Date()
    const thirtyDaysAgo = subDays(now, 30)
    const sixtyDaysAgo = subDays(now, 60)
    const ninetyDaysAgo = subDays(now, 90)

    // Use simplified heuristics for fast categorization
    // Excellent: visited in last 30 days AND high engagement
    // Healthy: visited in last 60 days
    // At Risk: visited 60-90 days ago
    // Critical: no visit in 90+ days

    const [excellent, healthy, atRisk, critical] = await Promise.all([
      // Excellent: Recent activity (last 30 days)
      prisma.customer.count({
        where: {
          lastVisit: { gte: thirtyDaysAgo }
        }
      }),
      // Healthy: Active in last 60 days but not in last 30
      prisma.customer.count({
        where: {
          lastVisit: { gte: sixtyDaysAgo, lt: thirtyDaysAgo }
        }
      }),
      // At Risk: Active 60-90 days ago
      prisma.customer.count({
        where: {
          lastVisit: { gte: ninetyDaysAgo, lt: sixtyDaysAgo }
        }
      }),
      // Critical: No activity in 90+ days
      prisma.customer.count({
        where: {
          lastVisit: { lt: ninetyDaysAgo }
        }
      })
    ])

    return {
      excellent,
      healthy,
      atRisk,
      critical,
    }
  }
}
