/**
 * DIE Analytics — Supplier Intelligence Service
 * Block 5B: Intelligence & Analytics Layer
 */

import { prisma } from '@/lib/prisma'
import type {
  SupplierMetrics,
  SupplierIntelligenceReport,
  AnalyticsQueryOptions,
} from './analytics-types'
import {
  getDateRange,
  calculateHealthScore,
  safeDivide,
  calculateGrowthRate,
  aggregateToTimeSeries,
} from './analytics-utils'

export class SupplierIntelligenceService {
  /**
   * Get comprehensive supplier metrics for a single supplier
   */
  static async getSupplierMetrics(
    supplierId: string,
    businessId: string,
    dateRange = getDateRange('year')
  ): Promise<SupplierMetrics | null> {
    const p: any = prisma

    // Fetch all documents for this supplier in the date range
    const documents = await p.scannedDocument.findMany({
      where: {
        businessId,
        supplierId,
        createdAt: { gte: dateRange.from, lte: dateRange.to },
      },
      select: {
        id: true,
        totalCents: true,
        createdAt: true,
        status: true,
        lifecycleState: true,
        reconciliation: {
          select: {
            state: true,
            matchType: true,
          },
        },
        anomalyAlerts: {
          select: { id: true },
        },
      },
    })

    if (documents.length === 0) return null

    const supplier = await p.supplier.findUnique({
      where: { id: supplierId },
      select: { id: true, name: true },
    })

    const now = new Date()
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)

    const totalSpend = documents.reduce((sum: any, doc: any) => sum + (doc.totalCents || 0), 0)
    const monthlySpend = documents
      .filter((doc: any) => doc.createdAt >= monthAgo)
      .reduce((sum: any, doc: any) => sum + (doc.totalCents || 0), 0)
    const quarterlySpend = documents
      .filter((doc: any) => doc.createdAt >= quarterAgo)
      .reduce((sum: any, doc: any) => sum + (doc.totalCents || 0), 0)
    const yearlySpend = documents
      .filter((doc: any) => doc.createdAt >= yearAgo)
      .reduce((sum: any, doc: any) => sum + (doc.totalCents || 0), 0)

    const invoiceCount = documents.length
    const averageInvoiceValue = safeDivide(totalSpend, invoiceCount)

    const sortedDates = documents.map((d: any) => d.createdAt).sort((a: any, b: any) => a.getTime() - b.getTime())
    const firstInvoiceDate = sortedDates[0]
    const lastInvoiceDate = sortedDates[sortedDates.length - 1]
    const daysSinceLastInvoice = Math.floor((now.getTime() - lastInvoiceDate.getTime()) / (24 * 60 * 60 * 1000))

    const daysActive = Math.max(1, (lastInvoiceDate.getTime() - firstInvoiceDate.getTime()) / (24 * 60 * 60 * 1000))
    const invoiceFrequency = (invoiceCount / daysActive) * 30

    const reconciliationCount = documents.filter((d: any) => d.reconciliation).length
    const successfulReconciliations = documents.filter(
      (d: any) => d.reconciliation && ['MATCHED_PO', 'MATCHED_GRN'].includes(d.reconciliation.state)
    ).length
    const reconciliationSuccessRate = safeDivide(successfulReconciliations, reconciliationCount)

    const totalAnomalies = documents.reduce((sum: any, doc: any) => sum + doc.anomalyAlerts.length, 0)
    const anomalyRate = safeDivide(totalAnomalies, invoiceCount)

    const approvedCount = documents.filter((d: any) => ['APPROVED', 'APPLIED'].includes(d.status || d.lifecycleState || '')).length
    const approvalRate = safeDivide(approvedCount, invoiceCount)

    const reliabilityScore = calculateHealthScore({
      successRate: reconciliationSuccessRate,
      anomalyRate: Math.min(anomalyRate, 1),
      approvalRate,
    })

    const riskScore = Math.round(
      (1 - reconciliationSuccessRate) * 40 +
      Math.min(anomalyRate * 100, 40) +
      (daysSinceLastInvoice > 90 ? 20 : 0)
    )

    const confidenceScore = Math.round(
      reconciliationSuccessRate * 50 +
      (1 - Math.min(anomalyRate, 1)) * 30 +
      Math.min(invoiceCount / 10, 1) * 20
    )

    return {
      supplierId,
      supplierName: supplier?.name || 'Unknown Supplier',
      totalSpend,
      monthlySpend,
      quarterlySpend,
      yearlySpend,
      invoiceCount,
      averageInvoiceValue,
      invoiceFrequency,
      reconciliationSuccessRate,
      anomalyRate,
      reliabilityScore,
      riskScore,
      confidenceScore,
      lastInvoiceDate,
      firstInvoiceDate,
      daysSinceLastInvoice,
    }
  }

  /**
   * Get comprehensive supplier intelligence report
   */
  static async getSupplierIntelligence(
    options: AnalyticsQueryOptions
  ): Promise<SupplierIntelligenceReport> {
    const { businessId, dateRange = getDateRange('year'), limit = 10 } = options
    const p: any = prisma

    // Fetch all suppliers for this business
    const supplierLinks = await p.scannedDocument.findMany({
      where: {
        businessId,
        supplierId: { not: null },
      },
      select: { supplierId: true },
      distinct: ['supplierId'],
    })

    const supplierIds = supplierLinks
      .map((link: any) => link.supplierId)
      .filter((id: unknown): id is string => typeof id === 'string' && id.length > 0)

    if (supplierIds.length === 0) {
      return {
        topSuppliers: [],
        fastestGrowing: [],
        highRisk: [],
        mostReliable: [],
        inactive: [],
        spendTrend: [],
        summary: {
          totalSuppliers: 0,
          activeSuppliers: 0,
          totalSpend: 0,
          averageSpend: 0,
          highRiskCount: 0,
        },
      }
    }

    // Fetch all supplier metrics in parallel
    const metricsPromises = supplierIds.map((supplierId: string) =>
      this.getSupplierMetrics(supplierId, businessId, dateRange)
    )
    const allMetrics = (await Promise.all(metricsPromises)).filter((m): m is SupplierMetrics => m !== null)

    // Top suppliers by spend
    const topSuppliers = [...allMetrics]
      .sort((a, b) => b.totalSpend - a.totalSpend)
      .slice(0, limit)

    // Calculate growth rates (compare last 30 days vs previous 30 days)
    const now = new Date()
    const last30Start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const prev30Start = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

    const growthMetrics = await Promise.all(
      allMetrics.map(async (m) => {
        const [last30Docs, prev30Docs] = await Promise.all([
          p.scannedDocument.findMany({
            where: {
              businessId,
              supplierId: m.supplierId,
              createdAt: { gte: last30Start, lte: now },
            },
            select: { totalCents: true },
          }),
          p.scannedDocument.findMany({
            where: {
              businessId,
              supplierId: m.supplierId,
              createdAt: { gte: prev30Start, lt: last30Start },
            },
            select: { totalCents: true },
          }),
        ])

        const last30Spend = last30Docs.reduce((sum: number, d: any) => sum + (d.totalCents || 0), 0)
        const prev30Spend = prev30Docs.reduce((sum: number, d: any) => sum + (d.totalCents || 0), 0)
        const growthRate = calculateGrowthRate(last30Spend, prev30Spend)

        return { ...m, growthRate }
      })
    )

    const fastestGrowing = growthMetrics
      .filter((m) => m.growthRate > 0)
      .sort((a: any, b: any) => b.growthRate - a.growthRate)
      .slice(0, limit)

    // High risk suppliers
    const highRisk = allMetrics
      .filter((m) => m.riskScore >= 60)
      .sort((a: any, b: any) => b.riskScore - a.riskScore)
      .slice(0, limit)

    // Most reliable suppliers
    const mostReliable = allMetrics
      .filter((m) => m.invoiceCount >= 3)
      .sort((a: any, b: any) => b.reliabilityScore - a.reliabilityScore)
      .slice(0, limit)

    // Inactive suppliers (no invoice in last 90 days)
    const inactive = allMetrics
      .filter((m) => m.daysSinceLastInvoice !== null && m.daysSinceLastInvoice > 90)
      .map((m) => ({
        supplierId: m.supplierId,
        supplierName: m.supplierName,
        daysSinceLastInvoice: m.daysSinceLastInvoice!,
      }))
      .sort((a: any, b: any) => b.daysSinceLastInvoice - a.daysSinceLastInvoice)
      .slice(0, limit)

    // Spend trend over time
    const allDocuments = await p.scannedDocument.findMany({
      where: {
        businessId,
        createdAt: { gte: dateRange.from, lte: dateRange.to },
        supplierId: { not: null },
      },
      select: {
        createdAt: true,
        totalCents: true,
      },
    })

    const spendTrend = aggregateToTimeSeries(
      allDocuments,
      (d: any) => d.createdAt,
      (d: any) => d.totalCents || 0,
      dateRange.from,
      dateRange.to,
      'month'
    )

    const totalSuppliers = supplierIds.length
    const activeSuppliers = allMetrics.filter((m) => m.daysSinceLastInvoice !== null && m.daysSinceLastInvoice <= 90).length
    const totalSpend = allMetrics.reduce((sum: any, m) => sum + m.totalSpend, 0)
    const averageSpend = safeDivide(totalSpend, totalSuppliers)
    const highRiskCount = allMetrics.filter((m) => m.riskScore >= 60).length

    return {
      topSuppliers,
      fastestGrowing,
      highRisk,
      mostReliable,
      inactive,
      spendTrend,
      summary: {
        totalSuppliers,
        activeSuppliers,
        totalSpend,
        averageSpend,
        highRiskCount,
      },
    }
  }
}
