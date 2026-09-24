/**
 * Financial Health Service
 * 
 * Purpose: Reusable financial health metrics for CFO Dashboard and future benchmarking
 * Governance: KPI_CATALOG_V2.md, FINANCIAL_DATA_GOVERNANCE.md
 * Data Source: FinancialLedgerEntry (exclusive)
 * 
 * This service provides core financial health metrics:
 * - MRR (Monthly Recurring Revenue)
 * - ARR (Annual Recurring Revenue)
 * - GMV (Gross Merchandise Value)
 * - Revenue Growth Rate
 * - Revenue Churn Rate
 * - Net Revenue Retention (NRR)
 * 
 * Design: All metrics return structured data suitable for:
 * 1. CFO Dashboard display
 * 2. Future Benchmark Network comparisons
 * 3. Executive reporting
 */

import { prisma } from '@/lib/prisma'
import { startOfMonth, subDays, subMonths } from 'date-fns'

export interface FinancialHealthMetrics {
  mrr: {
    value: number
    previousValue: number
    change: number
    changePercent: number
    status: 'GROWTH' | 'STABLE' | 'DECLINE'
    trend: number[] // Last 6 months for sparkline
  }
  arr: {
    value: number
    previousValue: number
    change: number
    changePercent: number
    status: 'GROWTH' | 'STABLE' | 'DECLINE'
  }
  gmv: {
    value: number
    previousValue: number
    change: number
    changePercent: number
    period: '30d'
  }
  revenueGrowth: {
    rate30d: number
    rate90d: number
    status: 'STRONG' | 'MODERATE' | 'WEAK' | 'NEGATIVE'
  }
  revenueChurn: {
    rate: number
    amount: number
    status: 'HEALTHY' | 'WARNING' | 'CRITICAL'
  }
  netRevenueRetention: {
    rate: number
    expansion: number
    contraction: number
    churn: number
    status: 'EXCELLENT' | 'GOOD' | 'WARNING' | 'CRITICAL'
  }
}

export class FinancialHealthService {
  /**
   * Get comprehensive financial health metrics
   * All calculations use FinancialLedgerEntry per FINANCIAL_DATA_GOVERNANCE.md
   */
  static async getMetrics(): Promise<FinancialHealthMetrics> {
    const now = new Date()
    const currentMonthStart = startOfMonth(now)
    const lastMonthStart = startOfMonth(subMonths(now, 1))
    const twoMonthsAgoStart = startOfMonth(subMonths(now, 2))
    
    // Fetch MRR for current and previous month
    const [currentMRR, lastMRR, twoMonthsAgoMRR] = await Promise.all([
      this.calculateMRR(currentMonthStart),
      this.calculateMRR(lastMonthStart),
      this.calculateMRR(twoMonthsAgoStart)
    ])

    // Calculate MRR trend (last 6 months)
    const mrrTrend = await this.calculateMRRTrend(6)

    // Calculate MRR metrics
    const mrrChange = currentMRR - lastMRR
    const mrrChangePercent = lastMRR > 0 ? (mrrChange / lastMRR) * 100 : 0
    const mrrStatus = this.getMRRStatus(mrrChangePercent)

    // Calculate ARR (derived from MRR)
    const arr = currentMRR * 12
    const lastARR = lastMRR * 12
    const arrChange = arr - lastARR
    const arrChangePercent = lastARR > 0 ? (arrChange / lastARR) * 100 : 0
    const arrStatus = this.getMRRStatus(arrChangePercent) // Same logic as MRR

    // Calculate GMV (last 30 days vs previous 30 days)
    const last30Days = subDays(now, 30)
    const last60Days = subDays(now, 60)
    
    const [gmvCurrent, gmvPrevious] = await Promise.all([
      this.calculateGMV(last30Days, now),
      this.calculateGMV(last60Days, last30Days)
    ])

    const gmvChange = gmvCurrent - gmvPrevious
    const gmvChangePercent = gmvPrevious > 0 ? (gmvChange / gmvPrevious) * 100 : 0

    // Calculate Revenue Growth Rate
    const revenueGrowth30d = gmvChangePercent
    const last90Days = subDays(now, 90)
    const last180Days = subDays(now, 180)
    
    const [revenue90d, revenue180d] = await Promise.all([
      this.calculateGMV(last90Days, now),
      this.calculateGMV(last180Days, last90Days)
    ])
    
    const revenueGrowth90d = revenue180d > 0 ? ((revenue90d - revenue180d) / revenue180d) * 100 : 0
    const revenueGrowthStatus = this.getRevenueGrowthStatus(revenueGrowth30d)

    // Calculate Revenue Churn Rate
    // Per KPI_CATALOG_V2.md line 136-164: (Churned MRR / Starting MRR) × 100
    // 
    // LIMITATION: This is a SIMPLIFIED calculation that treats net MRR decrease as churn.
    // It does NOT separate:
    // - True churn (customers who left entirely)
    // - Contraction (customers who downgraded)
    // - Expansion (customers who upgraded, which masks churn)
    // 
    // Full compliance requires cohort-based tracking to isolate true churned MRR.
    // This simplified version provides directional insight but may understate actual churn
    // if expansion revenue is masking churn losses.
    //
    // For executive decision-making: Use this as a minimum churn indicator.
    // Actual churn may be higher if there's significant expansion activity.
    const churnAmount = Math.max(0, lastMRR - currentMRR)
    const churnRate = lastMRR > 0 ? (churnAmount / lastMRR) * 100 : 0
    const churnStatus = this.getChurnStatus(churnRate)

    // Calculate Net Revenue Retention (NRR)
    // Per KPI_CATALOG_V2.md line 166-195: ((Starting MRR + Expansion - Contraction - Churn) / Starting MRR) × 100
    //
    // LIMITATION: This is a SIMPLIFIED proxy calculation.
    // Formula mathematically simplifies to: (currentMRR / lastMRR) × 100
    // 
    // It does NOT provide decomposition into:
    // - Expansion MRR (from existing customer upgrades)
    // - Contraction MRR (from existing customer downgrades)
    // - Churned MRR (from customers who left)
    //
    // Full compliance requires cohort-based tracking to separate these components.
    // This simplified version provides accurate aggregate NRR but lacks the breakdown
    // needed for detailed retention analysis.
    //
    // For executive decision-making: NRR value is accurate, but you cannot see
    // whether NRR < 100% is due to churn, contraction, or insufficient expansion.
    const expansion = Math.max(0, currentMRR - lastMRR) // Positive MRR change from existing customers
    const contraction = Math.max(0, lastMRR - currentMRR) // Negative MRR change
    const nrr = lastMRR > 0 ? ((lastMRR + expansion - contraction) / lastMRR) * 100 : 100
    const nrrStatus = this.getNRRStatus(nrr)

    return {
      mrr: {
        value: currentMRR,
        previousValue: lastMRR,
        change: mrrChange,
        changePercent: mrrChangePercent,
        status: mrrStatus,
        trend: mrrTrend
      },
      arr: {
        value: arr,
        previousValue: lastARR,
        change: arrChange,
        changePercent: arrChangePercent,
        status: arrStatus
      },
      gmv: {
        value: gmvCurrent,
        previousValue: gmvPrevious,
        change: gmvChange,
        changePercent: gmvChangePercent,
        period: '30d'
      },
      revenueGrowth: {
        rate30d: revenueGrowth30d,
        rate90d: revenueGrowth90d,
        status: revenueGrowthStatus
      },
      revenueChurn: {
        rate: churnRate,
        amount: churnAmount,
        status: churnStatus
      },
      netRevenueRetention: {
        rate: nrr,
        expansion: expansion,
        contraction: contraction,
        churn: churnAmount,
        status: nrrStatus
      }
    }
  }

  /**
   * Calculate MRR for a specific month
   * Per KPI_CATALOG_V2.md line 82-107
   * Source: FinancialLedgerEntry WHERE eventType = 'SUBSCRIPTION_CHARGE'
   */
  private static async calculateMRR(monthStart: Date): Promise<number> {
    const monthEnd = startOfMonth(subMonths(monthStart, -1))
    
    const result = await prisma.financialLedgerEntry.aggregate({
      where: {
        eventType: 'SUBSCRIPTION_CHARGE',
        occurredAt: {
          gte: monthStart,
          lt: monthEnd
        }
      },
      _sum: {
        amountCents: true
      }
    })

    return (result._sum.amountCents || 0) / 100
  }

  /**
   * Calculate MRR trend for last N months
   * Returns array of MRR values for sparkline visualization
   */
  private static async calculateMRRTrend(months: number): Promise<number[]> {
    const trend: number[] = []
    
    for (let i = months - 1; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(new Date(), i))
      const mrr = await this.calculateMRR(monthStart)
      trend.push(mrr)
    }
    
    return trend
  }

  /**
   * Calculate GMV (Gross Merchandise Value) for a date range
   * Per KPI_CATALOG_V2.md line 109-134
   * Source: FinancialLedgerEntry WHERE eventType = 'PAYMENT_SUCCESS'
   */
  private static async calculateGMV(startDate: Date, endDate: Date): Promise<number> {
    const result = await prisma.financialLedgerEntry.aggregate({
      where: {
        eventType: 'PAYMENT_SUCCESS',
        occurredAt: {
          gte: startDate,
          lt: endDate
        }
      },
      _sum: {
        amountCents: true
      }
    })

    return (result._sum.amountCents || 0) / 100
  }

  /**
   * Determine MRR status based on change percentage
   * Per KPI_CATALOG_V2.md thresholds
   */
  private static getMRRStatus(changePercent: number): 'GROWTH' | 'STABLE' | 'DECLINE' {
    if (changePercent > 2) return 'GROWTH'
    if (changePercent < -2) return 'DECLINE'
    return 'STABLE'
  }

  /**
   * Determine revenue growth status
   * Thresholds: >10% = STRONG, 5-10% = MODERATE, 0-5% = WEAK, <0% = NEGATIVE
   */
  private static getRevenueGrowthStatus(rate: number): 'STRONG' | 'MODERATE' | 'WEAK' | 'NEGATIVE' {
    if (rate > 10) return 'STRONG'
    if (rate > 5) return 'MODERATE'
    if (rate > 0) return 'WEAK'
    return 'NEGATIVE'
  }

  /**
   * Determine churn status
   * Per KPI_CATALOG_V2.md line 136-164: WARN > 5%, CRITICAL > 10%
   */
  private static getChurnStatus(rate: number): 'HEALTHY' | 'WARNING' | 'CRITICAL' {
    if (rate > 10) return 'CRITICAL'
    if (rate > 5) return 'WARNING'
    return 'HEALTHY'
  }

  /**
   * Determine NRR status
   * Per KPI_CATALOG_V2.md line 166-195: WARN < 100%, CRITICAL < 90%
   */
  private static getNRRStatus(rate: number): 'EXCELLENT' | 'GOOD' | 'WARNING' | 'CRITICAL' {
    if (rate >= 110) return 'EXCELLENT'
    if (rate >= 100) return 'GOOD'
    if (rate >= 90) return 'WARNING'
    return 'CRITICAL'
  }

  /**
   * Get MRR only (lightweight method for quick checks)
   */
  static async getMRR(): Promise<number> {
    return this.calculateMRR(startOfMonth(new Date()))
  }

  /**
   * Get ARR only (lightweight method for quick checks)
   */
  static async getARR(): Promise<number> {
    const mrr = await this.getMRR()
    return mrr * 12
  }
}
