/**
 * CFO Financial Impact Service
 * 
 * Purpose: Calculate deterministic revenue impact for operational events
 * 
 * Design Philosophy:
 * - NO ML/AI - only simple arithmetic
 * - Conservative estimates (underestimate, not overestimate)
 * - Time-bounded (daily, weekly, monthly)
 * - 100% FinancialLedgerEntry compliant
 */

import { prisma } from '@/lib/prisma'
import { subDays, startOfMonth } from 'date-fns'

export interface FinancialImpact {
  metric: string
  currentValue: string
  
  // Impact quantification
  dailyImpact?: number
  weeklyImpact?: number
  monthlyImpact?: number
  annualizedImpact?: number
  ltvImpact?: number
  
  // Risk assessment
  impactType: ImpactType
  confidence: number  // 0-100
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  
  // Additional context
  catastrophicRisk?: number
  unreconciledRevenue?: number
}

export type ImpactType = 
  | 'REVENUE_LOSS'
  | 'REVENUE_AT_RISK'
  | 'FUTURE_REVENUE_LOSS'
  | 'REVENUE_RECOGNITION_DELAY'
  | 'OPPORTUNITY_COST'

interface FinancialAverages {
  calculatedAt: Date
  avgDailyTransactions: number
  avgTransactionValue: number
  currentMRR: number
  avgSubscriptionValue: number
}

export class CfoFinancialImpactService {
  /**
   * Calculate payment failure revenue impact
   */
  static async calculatePaymentFailureImpact(
    successRate: number
  ): Promise<FinancialImpact> {
    const averages = await this.getFinancialAverages()
    
    // Calculate failure rate
    const failureRate = (100 - successRate) / 100
    
    // Calculate daily failed transactions
    const dailyFailedTransactions = averages.avgDailyTransactions * failureRate
    
    // Calculate daily revenue loss
    const dailyRevenueLoss = dailyFailedTransactions * averages.avgTransactionValue
    
    return {
      metric: 'Payment Success Rate',
      currentValue: `${successRate.toFixed(1)}%`,
      dailyImpact: dailyRevenueLoss,
      weeklyImpact: dailyRevenueLoss * 7,
      monthlyImpact: dailyRevenueLoss * 30,
      impactType: 'REVENUE_LOSS',
      confidence: 90  // High confidence - direct measurement
    }
  }

  /**
   * Calculate subscription deterioration impact
   */
  static async calculateSubscriptionDeteriorationImpact(
    declineRate: number
  ): Promise<FinancialImpact> {
    const averages = await this.getFinancialAverages()
    
    // Calculate monthly MRR loss from subscription decline
    const monthlyMRRLoss = averages.currentMRR * (Math.abs(declineRate) / 100)
    
    // Calculate annualized impact
    const annualizedImpact = monthlyMRRLoss * 12
    
    // Calculate customer lifetime value impact (assume 24-month LTV)
    const ltvImpact = monthlyMRRLoss * 24
    
    return {
      metric: 'Subscription Decline',
      currentValue: `${declineRate.toFixed(1)}%`,
      monthlyImpact: monthlyMRRLoss,
      annualizedImpact: annualizedImpact,
      ltvImpact: ltvImpact,
      impactType: 'FUTURE_REVENUE_LOSS',
      confidence: 75  // Medium confidence - assumes trend continues
    }
  }

  /**
   * Calculate churn revenue impact
   */
  static async calculateChurnRevenueImpact(
    churnRate: number
  ): Promise<FinancialImpact> {
    const averages = await this.getFinancialAverages()
    
    // Calculate monthly revenue lost to churn
    const monthlyChurnedMRR = averages.currentMRR * (churnRate / 100)
    
    // Calculate annualized churn impact
    const annualizedChurnImpact = monthlyChurnedMRR * 12
    
    // Calculate customer lifetime value lost (assume 24-month LTV)
    const ltvLost = monthlyChurnedMRR * 24
    
    return {
      metric: 'Revenue Churn',
      currentValue: `${churnRate.toFixed(1)}%`,
      monthlyImpact: monthlyChurnedMRR,
      annualizedImpact: annualizedChurnImpact,
      ltvImpact: ltvLost,
      impactType: 'REVENUE_LOSS',
      confidence: 85
    }
  }

  /**
   * Calculate concentration revenue risk
   */
  static async calculateConcentrationRevenueRisk(
    concentrationRate: number,
    topCustomerCount: number = 10
  ): Promise<FinancialImpact> {
    const averages = await this.getFinancialAverages()
    
    // Calculate revenue from top customers
    const topCustomerRevenue = averages.currentMRR * (concentrationRate / 100)
    
    // Calculate per-customer risk
    const perCustomerRisk = topCustomerRevenue / topCustomerCount
    
    // Annualized impact if one top customer churns
    const singleCustomerChurnImpact = perCustomerRisk * 12
    
    // LTV impact (24 months)
    const singleCustomerLTVImpact = perCustomerRisk * 24
    
    return {
      metric: 'Revenue Concentration',
      currentValue: `${concentrationRate.toFixed(1)}%`,
      monthlyImpact: perCustomerRisk,
      annualizedImpact: singleCustomerChurnImpact,
      ltvImpact: singleCustomerLTVImpact,
      catastrophicRisk: topCustomerRevenue * 12,  // If all top customers churn
      impactType: 'REVENUE_AT_RISK',
      confidence: 80
    }
  }

  /**
   * Get cached financial averages
   */
  private static async getFinancialAverages(): Promise<FinancialAverages> {
    // In production, this would check Redis cache
    // For now, calculate directly
    return await this.calculateFinancialAverages()
  }

  /**
   * Calculate financial averages from ledger
   */
  private static async calculateFinancialAverages(): Promise<FinancialAverages> {
    const thirtyDaysAgo = subDays(new Date(), 30)
    
    // Get payment transactions
    const payments = await prisma.financialLedgerEntry.findMany({
      where: {
        eventType: 'PAYMENT_SUCCESS',
        occurredAt: { gte: thirtyDaysAgo }
      },
      select: {
        amountCents: true
      }
    })
    
    // Calculate payment averages
    const avgDailyTransactions = payments.length / 30
    const totalPaymentValue = payments.reduce((sum, p) => sum + p.amountCents, 0)
    const avgTransactionValue = payments.length > 0 ? (totalPaymentValue / payments.length / 100) : 0
    
    // Get subscription data for current month
    const subscriptions = await prisma.financialLedgerEntry.findMany({
      where: {
        eventType: 'SUBSCRIPTION_CHARGE',
        occurredAt: { gte: startOfMonth(new Date()) }
      },
      select: {
        amountCents: true
      }
    })
    
    const currentMRR = subscriptions.reduce((sum, s) => sum + s.amountCents, 0) / 100
    const avgSubscriptionValue = subscriptions.length > 0 ? currentMRR / subscriptions.length : 0
    
    return {
      calculatedAt: new Date(),
      avgDailyTransactions,
      avgTransactionValue,
      currentMRR,
      avgSubscriptionValue
    }
  }

  /**
   * Calculate priority adjustment based on financial impact
   */
  static calculateFinancialPriority(
    basePriority: number,
    financialImpact: FinancialImpact
  ): number {
    let priority = basePriority
    
    // Adjust based on monthly impact
    if (financialImpact.monthlyImpact) {
      if (financialImpact.monthlyImpact > 100000) {
        priority += 15  // >$100K/month = major impact
      } else if (financialImpact.monthlyImpact > 50000) {
        priority += 10  // $50-100K/month = significant impact
      } else if (financialImpact.monthlyImpact > 10000) {
        priority += 5   // $10-50K/month = moderate impact
      }
    }
    
    // Adjust based on confidence
    const confidenceMultiplier = financialImpact.confidence / 100
    priority = priority * confidenceMultiplier
    
    // Cap at 100
    return Math.min(100, Math.round(priority))
  }

  /**
   * Format financial impact for display
   */
  static formatImpact(impact: FinancialImpact): string {
    const parts: string[] = []
    
    if (impact.dailyImpact) {
      parts.push(`$${(impact.dailyImpact / 1000).toFixed(1)}K/day`)
    }
    
    if (impact.monthlyImpact) {
      parts.push(`$${(impact.monthlyImpact / 1000).toFixed(1)}K/month`)
    }
    
    if (impact.annualizedImpact) {
      parts.push(`$${(impact.annualizedImpact / 1000).toFixed(1)}K/year`)
    }
    
    return parts.join(', ')
  }
}
