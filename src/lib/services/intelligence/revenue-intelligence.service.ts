/**
 * Revenue Intelligence Service
 * 
 * Purpose: Revenue composition, concentration, and driver analysis
 * Governance: KPI_CATALOG_V2.md, FINANCIAL_DATA_GOVERNANCE.md
 * Data Source: FinancialLedgerEntry (exclusive)
 * 
 * Answers the question: "Where is money coming from?"
 * 
 * Provides:
 * - Revenue by source (subscription, marketplace, direct sales)
 * - Revenue by customer segment
 * - Revenue concentration risk
 * - Top revenue contributors
 * - Growth and decline drivers
 */

import { prisma } from '@/lib/prisma'
import { subDays } from 'date-fns'

export interface RevenueBySource {
  subscription: number
  marketplace: number
  directSales: number
  total: number
}

export interface RevenueBySegment {
  top10Percent: number
  middle40Percent: number
  bottom50Percent: number
}

export interface RevenueContributor {
  customerId: string
  customerName: string
  revenue: number
  revenuePercent: number
  growth: number
}

export interface RevenueDrivers {
  newCustomerRevenue: number
  expansionRevenue: number
  churnedRevenue: number
  contractionRevenue: number
}

export interface RevenueIntelligence {
  bySource: RevenueBySource
  bySegment: RevenueBySegment
  concentration: {
    rate: number
    status: 'HEALTHY' | 'WARNING' | 'CRITICAL'
  }
  topContributors: RevenueContributor[]
  drivers: RevenueDrivers
}

export class RevenueIntelligenceService {
  /**
   * Get comprehensive revenue intelligence
   */
  static async getIntelligence(period: 'last30d' | 'last90d' = 'last30d'): Promise<RevenueIntelligence> {
    const days = period === 'last30d' ? 30 : 90
    const startDate = subDays(new Date(), days)
    const endDate = new Date()

    const [bySource, bySegment, concentration, topContributors, drivers] = await Promise.all([
      this.getRevenueBySource(startDate, endDate),
      this.getRevenueBySegment(startDate, endDate),
      this.getRevenueConcentration(startDate, endDate),
      this.getTopContributors(startDate, endDate, 10),
      this.getRevenueDrivers(startDate, endDate)
    ])

    return {
      bySource,
      bySegment,
      concentration,
      topContributors,
      drivers
    }
  }

  /**
   * Get revenue by source
   * Sources: Subscription, Marketplace, Direct Sales
   * Per FINANCIAL_DATA_GOVERNANCE.md: Use FinancialLedgerEntry.eventType
   */
  private static async getRevenueBySource(startDate: Date, endDate: Date): Promise<RevenueBySource> {
    // Subscription revenue
    const subscriptionResult = await prisma.financialLedgerEntry.aggregate({
      where: {
        eventType: 'SUBSCRIPTION_CHARGE',
        occurredAt: { gte: startDate, lt: endDate }
      },
      _sum: { amountCents: true }
    })

    // Marketplace revenue
    const marketplaceResult = await prisma.financialLedgerEntry.aggregate({
      where: {
        eventType: 'MARKETPLACE_SALE',
        occurredAt: { gte: startDate, lt: endDate }
      },
      _sum: { amountCents: true }
    })

    // Direct sales revenue (PAYMENT_SUCCESS minus marketplace)
    const totalPaymentsResult = await prisma.financialLedgerEntry.aggregate({
      where: {
        eventType: 'PAYMENT_SUCCESS',
        occurredAt: { gte: startDate, lt: endDate }
      },
      _sum: { amountCents: true }
    })

    const subscription = (subscriptionResult._sum.amountCents || 0) / 100
    const marketplace = (marketplaceResult._sum.amountCents || 0) / 100
    const totalPayments = (totalPaymentsResult._sum.amountCents || 0) / 100
    const directSales = Math.max(0, totalPayments - marketplace - subscription)

    return {
      subscription,
      marketplace,
      directSales,
      total: subscription + marketplace + directSales
    }
  }

  /**
   * Get revenue by customer segment
   * Segments: Top 10%, Middle 40%, Bottom 50%
   */
  private static async getRevenueBySegment(startDate: Date, endDate: Date): Promise<RevenueBySegment> {
    // Get revenue grouped by customer
    const customerRevenues = await prisma.financialLedgerEntry.groupBy({
      by: ['customerId'],
      where: {
        eventType: 'PAYMENT_SUCCESS',
        occurredAt: { gte: startDate, lt: endDate },
        customerId: { not: null }
      },
      _sum: { amountCents: true }
    })

    // Sort by revenue descending
    const sorted = customerRevenues
      .map(cr => ({
        customerId: cr.customerId!,
        revenue: (cr._sum.amountCents || 0) / 100
      }))
      .sort((a, b) => b.revenue - a.revenue)

    const totalCustomers = sorted.length
    if (totalCustomers === 0) {
      return { top10Percent: 0, middle40Percent: 0, bottom50Percent: 0 }
    }

    // Calculate segment boundaries
    const top10Count = Math.ceil(totalCustomers * 0.1)
    const middle40Count = Math.ceil(totalCustomers * 0.4)

    // Sum revenue by segment
    const top10Percent = sorted.slice(0, top10Count).reduce((sum, c) => sum + c.revenue, 0)
    const middle40Percent = sorted.slice(top10Count, top10Count + middle40Count).reduce((sum, c) => sum + c.revenue, 0)
    const bottom50Percent = sorted.slice(top10Count + middle40Count).reduce((sum, c) => sum + c.revenue, 0)

    return {
      top10Percent,
      middle40Percent,
      bottom50Percent
    }
  }

  /**
   * Get revenue concentration
   * Per KPI_CATALOG_V2.md line 297-321: (Top 10 Customer Revenue / Total Revenue) × 100
   * Alert: WARN > 40%, CRITICAL > 60%
   */
  private static async getRevenueConcentration(startDate: Date, endDate: Date): Promise<{
    rate: number
    status: 'HEALTHY' | 'WARNING' | 'CRITICAL'
  }> {
    // Get top 10 customers by revenue
    const topCustomers = await prisma.financialLedgerEntry.groupBy({
      by: ['customerId'],
      where: {
        eventType: 'PAYMENT_SUCCESS',
        occurredAt: { gte: startDate, lt: endDate },
        customerId: { not: null }
      },
      _sum: { amountCents: true },
      orderBy: {
        _sum: {
          amountCents: 'desc'
        }
      },
      take: 10
    })

    // Get total revenue
    const totalResult = await prisma.financialLedgerEntry.aggregate({
      where: {
        eventType: 'PAYMENT_SUCCESS',
        occurredAt: { gte: startDate, lt: endDate }
      },
      _sum: { amountCents: true }
    })

    const top10Revenue = topCustomers.reduce((sum, c) => sum + (c._sum.amountCents || 0), 0) / 100
    const totalRevenue = (totalResult._sum.amountCents || 0) / 100

    const rate = totalRevenue > 0 ? (top10Revenue / totalRevenue) * 100 : 0

    let status: 'HEALTHY' | 'WARNING' | 'CRITICAL' = 'HEALTHY'
    if (rate > 60) status = 'CRITICAL'
    else if (rate > 40) status = 'WARNING'

    return { rate, status }
  }

  /**
   * Get top revenue contributors
   * Returns top N customers with revenue and growth
   */
  private static async getTopContributors(
    startDate: Date,
    endDate: Date,
    limit: number = 10
  ): Promise<RevenueContributor[]> {
    // Get current period revenue
    const currentRevenues = await prisma.financialLedgerEntry.groupBy({
      by: ['customerId'],
      where: {
        eventType: 'PAYMENT_SUCCESS',
        occurredAt: { gte: startDate, lt: endDate },
        customerId: { not: null }
      },
      _sum: { amountCents: true },
      orderBy: {
        _sum: {
          amountCents: 'desc'
        }
      },
      take: limit
    })

    // Get previous period revenue for growth calculation
    const periodDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const previousStartDate = subDays(startDate, periodDays)
    
    const previousRevenues = await prisma.financialLedgerEntry.groupBy({
      by: ['customerId'],
      where: {
        eventType: 'PAYMENT_SUCCESS',
        occurredAt: { gte: previousStartDate, lt: startDate },
        customerId: { in: currentRevenues.map(cr => cr.customerId!).filter(Boolean) }
      },
      _sum: { amountCents: true }
    })

    // Create lookup map for previous revenue
    const previousRevenueMap = new Map(
      previousRevenues.map(pr => [pr.customerId!, (pr._sum.amountCents || 0) / 100])
    )

    // Get total revenue for percentage calculation
    const totalResult = await prisma.financialLedgerEntry.aggregate({
      where: {
        eventType: 'PAYMENT_SUCCESS',
        occurredAt: { gte: startDate, lt: endDate }
      },
      _sum: { amountCents: true }
    })
    const totalRevenue = (totalResult._sum.amountCents || 0) / 100

    // Get customer names
    const customerIds = currentRevenues.map(cr => cr.customerId!).filter(Boolean)
    const customers = await prisma.customer.findMany({
      where: { id: { in: customerIds } },
      select: { id: true, name: true }
    })
    const customerNameMap = new Map(customers.map(c => [c.id, c.name]))

    // Build contributors list
    return currentRevenues.map(cr => {
      const customerId = cr.customerId!
      const revenue = (cr._sum.amountCents || 0) / 100
      const previousRevenue = previousRevenueMap.get(customerId) || 0
      const growth = previousRevenue > 0 ? ((revenue - previousRevenue) / previousRevenue) * 100 : 0
      const revenuePercent = totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0

      return {
        customerId,
        customerName: customerNameMap.get(customerId) || 'Unknown',
        revenue,
        revenuePercent,
        growth
      }
    })
  }

  /**
   * Get revenue drivers (growth and decline)
   * Identifies new customer revenue, expansion, churn, and contraction
   */
  private static async getRevenueDrivers(startDate: Date, endDate: Date): Promise<RevenueDrivers> {
    // Get customers who made first purchase in this period
    const newCustomers = await prisma.customer.findMany({
      where: {
        createdAt: { gte: startDate, lt: endDate }
      },
      select: { id: true }
    })

    const newCustomerIds = newCustomers.map(c => c.id)

    // New customer revenue
    const newCustomerRevenueResult = await prisma.financialLedgerEntry.aggregate({
      where: {
        eventType: 'PAYMENT_SUCCESS',
        occurredAt: { gte: startDate, lt: endDate },
        customerId: { in: newCustomerIds }
      },
      _sum: { amountCents: true }
    })

    const newCustomerRevenue = (newCustomerRevenueResult._sum.amountCents || 0) / 100

    // For expansion/contraction, we need to compare customer revenue period-over-period
    // This is a simplified calculation - full implementation would track individual customer changes
    const periodDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const previousStartDate = subDays(startDate, periodDays)

    // Get all customers with revenue in both periods
    const [currentCustomerRevenues, previousCustomerRevenues] = await Promise.all([
      prisma.financialLedgerEntry.groupBy({
        by: ['customerId'],
        where: {
          eventType: 'PAYMENT_SUCCESS',
          occurredAt: { gte: startDate, lt: endDate },
          customerId: { not: null, notIn: newCustomerIds }
        },
        _sum: { amountCents: true }
      }),
      prisma.financialLedgerEntry.groupBy({
        by: ['customerId'],
        where: {
          eventType: 'PAYMENT_SUCCESS',
          occurredAt: { gte: previousStartDate, lt: startDate },
          customerId: { not: null }
        },
        _sum: { amountCents: true }
      })
    ])

    const currentMap = new Map(
      currentCustomerRevenues.map(cr => [cr.customerId!, (cr._sum.amountCents || 0) / 100])
    )
    const previousMap = new Map(
      previousCustomerRevenues.map(pr => [pr.customerId!, (pr._sum.amountCents || 0) / 100])
    )

    let expansionRevenue = 0
    let contractionRevenue = 0
    let churnedRevenue = 0

    // Calculate expansion and contraction
    currentMap.forEach((currentRev, customerId) => {
      const previousRev = previousMap.get(customerId) || 0
      const change = currentRev - previousRev
      
      if (change > 0) {
        expansionRevenue += change
      } else if (change < 0) {
        contractionRevenue += Math.abs(change)
      }
    })

    // Calculate churned revenue (customers in previous period but not current)
    previousMap.forEach((previousRev, customerId) => {
      if (!currentMap.has(customerId)) {
        churnedRevenue += previousRev
      }
    })

    return {
      newCustomerRevenue,
      expansionRevenue,
      churnedRevenue,
      contractionRevenue
    }
  }
}
