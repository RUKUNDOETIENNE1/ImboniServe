/**
 * Subscription Intelligence Service
 * 
 * Purpose: Subscription dynamics and risk monitoring
 * Governance: KPI_CATALOG_V2.md
 * 
 * Answers: "What recurring revenue is vulnerable?"
 * 
 * Note: Some metrics (Revenue at Risk, Grace Aging) require schema updates
 * and are marked as TODO until FinancialLedgerEntry.metadata is available
 */

import { prisma } from '@/lib/prisma'
import { subDays } from 'date-fns'

export interface SubscriptionIntelligence {
  activeSubscriptions: {
    count: number
    change: number
    changePercent: number
  }
  revenueAtRisk: {
    amount: number
    percent: number
    status: 'HEALTHY' | 'WARNING' | 'CRITICAL'
    available: boolean // False until schema supports
  }
  graceAgingDistribution: {
    days0to7: number
    days8to14: number
    days15to30: number
    days30plus: number
    available: boolean // False until schema supports
  }
  dynamics: {
    expansionMRR: number
    contractionMRR: number
    netChange: number
  }
}

export class SubscriptionIntelligenceService {
  /**
   * Get comprehensive subscription intelligence
   */
  static async getIntelligence(): Promise<SubscriptionIntelligence> {
    const [activeSubscriptions, dynamics] = await Promise.all([
      this.getActiveSubscriptions(),
      this.getSubscriptionDynamics()
    ])

    // Revenue at Risk and Grace Aging require schema updates
    const revenueAtRisk = {
      amount: 0,
      percent: 0,
      status: 'HEALTHY' as const,
      available: false
    }

    const graceAgingDistribution = {
      days0to7: 0,
      days8to14: 0,
      days15to30: 0,
      days30plus: 0,
      available: false
    }

    return {
      activeSubscriptions,
      revenueAtRisk,
      graceAgingDistribution,
      dynamics
    }
  }

  /**
   * Get active subscription count and trend
   */
  private static async getActiveSubscriptions(): Promise<{
    count: number
    change: number
    changePercent: number
  }> {
    const now = new Date()
    const last30Days = subDays(now, 30)

    const [currentCount, previousCount] = await Promise.all([
      prisma.subscription.count({
        where: {
          status: { in: ['ACTIVE', 'TRIAL'] }
        }
      }),
      prisma.subscription.count({
        where: {
          status: { in: ['ACTIVE', 'TRIAL'] },
          createdAt: { lte: last30Days }
        }
      })
    ])

    const change = currentCount - previousCount
    const changePercent = previousCount > 0 ? (change / previousCount) * 100 : 0

    return {
      count: currentCount,
      change,
      changePercent
    }
  }

  /**
   * Get subscription dynamics (expansion and contraction MRR)
   * This is a simplified calculation - full implementation would track
   * individual subscription changes
   */
  private static async getSubscriptionDynamics(): Promise<{
    expansionMRR: number
    contractionMRR: number
    netChange: number
  }> {
    // For now, return placeholder values
    // Full implementation requires tracking subscription amount changes over time
    return {
      expansionMRR: 0,
      contractionMRR: 0,
      netChange: 0
    }
  }
}
