/**
 * DIE Analytics — Product Intelligence Service
 * Block 5B: Intelligence & Analytics Layer
 */

import { prisma } from '@/lib/prisma'
import type {
  ProductMetrics,
  ProductIntelligenceReport,
  AnalyticsQueryOptions,
} from './analytics-types'
import {
  getDateRange,
  safeDivide,
  calculateVolatility,
  calculateGrowthRate,
} from './analytics-utils'

export class ProductIntelligenceService {
  /**
   * Get comprehensive product metrics for a single product
   */
  static async getProductMetrics(
    productId: string,
    productType: 'INVENTORY_ITEM' | 'SUPPLIER_PRODUCT',
    businessId: string,
    dateRange = getDateRange('year')
  ): Promise<ProductMetrics | null> {
    const p: any = prisma

    // Fetch product details
    let productName = 'Unknown Product'
    if (productType === 'INVENTORY_ITEM') {
      const inventoryItem = await p.inventoryItem.findUnique({
        where: { id: productId },
        select: { id: true, name: true, businessId: true },
      })
      if (!inventoryItem || inventoryItem.businessId !== businessId) return null
      productName = inventoryItem.name
    } else {
      const supplierProduct = await p.supplierProduct.findUnique({
        where: { id: productId },
        select: { id: true, name: true },
      })
      if (!supplierProduct) return null
      productName = supplierProduct.name
    }

    // Fetch all line items for this product
    const whereClause: any = {
      scannedDocument: {
        businessId,
        createdAt: { gte: dateRange.from, lte: dateRange.to },
      },
    }

    if (productType === 'INVENTORY_ITEM') {
      whereClause.productId = productId
    } else {
      whereClause.supplierProductId = productId
    }

    const items = await p.scannedDocumentItem.findMany({
      where: whereClause,
      select: {
        id: true,
        quantity: true,
        unitPriceCents: true,
        totalPriceCents: true,
        scannedDocument: {
          select: {
            createdAt: true,
            supplierId: true,
            anomalyAlerts: { select: { id: true } },
          },
        },
      },
    })

    if (items.length === 0) {
      if (productType === 'SUPPLIER_PRODUCT') {
        return null
      }
      return {
        productId,
        productName,
        productType,
        purchaseVolume: 0,
        purchaseFrequency: 0,
        totalSpend: 0,
        averagePrice: 0,
        priceVolatility: 0,
        supplierCount: 0,
        anomalyCount: 0,
        lastPurchaseDate: null,
        priceChange30d: null,
        priceChange90d: null,
      }
    }

    const purchaseVolume = items.reduce((sum: any, item: any) => sum + (item.quantity || 0), 0)
    const totalSpend = items.reduce((sum: any, item: any) => sum + (item.totalPriceCents || 0), 0)

    const prices = items
      .map((item: any) => item.unitPriceCents)
      .filter((p: any): p is number => p !== null && p > 0)

    const averagePrice = prices.length > 0 ? prices.reduce((sum: any, p: any) => sum + p, 0) / prices.length : 0
    const priceVolatility = calculateVolatility(prices)

    const uniqueSuppliers = new Set(
      items.map((item: any) => item.scannedDocument.supplierId).filter((s: any): s is string => s !== null)
    )
    const supplierCount = uniqueSuppliers.size

    const anomalyCount = items.reduce(
      (sum: any, item: any) => sum + item.scannedDocument.anomalyAlerts.length,
      0
    )

    const sortedDates = items
      .map((item: any) => item.scannedDocument.createdAt)
      .sort((a: any, b: any) => a.getTime() - b.getTime())
    const lastPurchaseDate = sortedDates[sortedDates.length - 1]
    const firstPurchaseDate = sortedDates[0]

    const daysActive = Math.max(1, (lastPurchaseDate.getTime() - firstPurchaseDate.getTime()) / (24 * 60 * 60 * 1000))
    const purchaseFrequency = (items.length / daysActive) * 30

    // Calculate price changes
    const now = new Date()
    const days30Ago = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const days90Ago = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

    const recent30Items = items.filter((item: any) => item.scannedDocument.createdAt >= days30Ago)
    const prev30Items = items.filter(
      (item: any) =>
        item.scannedDocument.createdAt < days30Ago &&
        item.scannedDocument.createdAt >= new Date(days30Ago.getTime() - 30 * 24 * 60 * 60 * 1000)
    )

    const recent30Prices = recent30Items
      .map((item: any) => item.unitPriceCents)
      .filter((p: any): p is number => p !== null && p > 0)
    const prev30Prices = prev30Items
      .map((item: any) => item.unitPriceCents)
      .filter((p: any): p is number => p !== null && p > 0)

    const avg30 = recent30Prices.length > 0 ? recent30Prices.reduce((sum: any, p: any) => sum + p, 0) / recent30Prices.length : null
    const avgPrev30 = prev30Prices.length > 0 ? prev30Prices.reduce((sum: any, p: any) => sum + p, 0) / prev30Prices.length : null

    const priceChange30d = avg30 !== null && avgPrev30 !== null ? calculateGrowthRate(avg30, avgPrev30) : null

    const recent90Items = items.filter((item: any) => item.scannedDocument.createdAt >= days90Ago)
    const prev90Items = items.filter(
      (item: any) =>
        item.scannedDocument.createdAt < days90Ago &&
        item.scannedDocument.createdAt >= new Date(days90Ago.getTime() - 90 * 24 * 60 * 60 * 1000)
    )

    const recent90Prices = recent90Items
      .map((item: any) => item.unitPriceCents)
      .filter((p: any): p is number => p !== null && p > 0)
    const prev90Prices = prev90Items
      .map((item: any) => item.unitPriceCents)
      .filter((p: any): p is number => p !== null && p > 0)

    const avg90 = recent90Prices.length > 0 ? recent90Prices.reduce((sum: any, p: any) => sum + p, 0) / recent90Prices.length : null
    const avgPrev90 = prev90Prices.length > 0 ? prev90Prices.reduce((sum: any, p: any) => sum + p, 0) / prev90Prices.length : null

    const priceChange90d = avg90 !== null && avgPrev90 !== null ? calculateGrowthRate(avg90, avgPrev90) : null

    return {
      productId,
      productName,
      productType,
      purchaseVolume,
      purchaseFrequency,
      totalSpend,
      averagePrice,
      priceVolatility,
      supplierCount,
      anomalyCount,
      lastPurchaseDate,
      priceChange30d,
      priceChange90d,
    }
  }

  /**
   * Get comprehensive product intelligence report
   */
  static async getProductIntelligence(
    options: AnalyticsQueryOptions
  ): Promise<ProductIntelligenceReport> {
    const { businessId, dateRange = getDateRange('year'), limit = 10 } = options
    const p: any = prisma

    // Fetch all products referenced in scanned documents
    const inventoryItems = await p.scannedDocumentItem.findMany({
      where: {
        productId: { not: null },
        scannedDocument: {
          businessId,
          createdAt: { gte: dateRange.from, lte: dateRange.to },
        },
      },
      select: { productId: true },
      distinct: ['productId'],
    })

    const supplierProducts = await p.scannedDocumentItem.findMany({
      where: {
        supplierProductId: { not: null },
        scannedDocument: {
          businessId,
          createdAt: { gte: dateRange.from, lte: dateRange.to },
        },
      },
      select: { supplierProductId: true },
      distinct: ['supplierProductId'],
    })

    // Fetch metrics for all products in parallel
    const inventoryMetricsPromises = inventoryItems.map((item: any) =>
      this.getProductMetrics(item.productId, 'INVENTORY_ITEM', businessId, dateRange)
    )

    const supplierMetricsPromises = supplierProducts.map((item: any) =>
      this.getProductMetrics(item.supplierProductId, 'SUPPLIER_PRODUCT', businessId, dateRange)
    )

    const allMetrics = (
      await Promise.all([...inventoryMetricsPromises, ...supplierMetricsPromises])
    ).filter((m): m is ProductMetrics => m !== null)

    // Top products by spend
    const topProducts = [...allMetrics]
      .sort((a, b: any) => b.totalSpend - a.totalSpend)
      .slice(0, limit)

    // Fastest growing by volume
    const fastestGrowing = allMetrics
      .filter((m) => m.priceChange30d !== null && m.purchaseVolume > 0)
      .map((m) => ({
        ...m,
        growthRate: m.priceChange30d!,
      }))
      .sort((a, b: any) => b.growthRate - a.growthRate)
      .slice(0, limit)

    // Rising prices
    const risingPrices = allMetrics
      .filter((m) => m.priceChange30d !== null && m.priceChange30d > 10)
      .map((m) => ({
        ...m,
        priceIncrease: m.priceChange30d!,
      }))
      .sort((a, b: any) => b.priceIncrease - a.priceIncrease)
      .slice(0, limit)

    // Falling prices
    const fallingPrices = allMetrics
      .filter((m) => m.priceChange30d !== null && m.priceChange30d < -10)
      .map((m) => ({
        ...m,
        priceDecrease: Math.abs(m.priceChange30d!),
      }))
      .sort((a, b: any) => b.priceDecrease - a.priceDecrease)
      .slice(0, limit)

    // High risk (high anomaly rate or high volatility)
    const highRisk = allMetrics
      .filter((m) => {
        const anomalyRate = safeDivide(m.anomalyCount, m.purchaseVolume)
        return anomalyRate > 0.2 || m.priceVolatility > 30
      })
      .sort((a, b: any) => {
        const aRisk = safeDivide(a.anomalyCount, a.purchaseVolume) + a.priceVolatility / 100
        const bRisk = safeDivide(b.anomalyCount, b.purchaseVolume) + b.priceVolatility / 100
        return bRisk - aRisk
      })
      .slice(0, limit)

    // Single supplier dependency
    const singleSupplierDeps = await Promise.all(
      allMetrics
        .filter((m) => m.supplierCount === 1 && m.totalSpend > 0)
        .slice(0, limit)
        .map(async (m) => {
          const item = await p.scannedDocumentItem.findFirst({
            where:
              m.productType === 'INVENTORY_ITEM'
                ? { productId: m.productId }
                : { supplierProductId: m.productId },
            include: {
              scannedDocument: {
                select: {
                  supplier: { select: { name: true } },
                },
              },
            },
          })

          return {
            ...m,
            supplierName: item?.scannedDocument?.supplier?.name || 'Unknown',
          }
        })
    )

    // Procurement opportunities (products with significant price variance across suppliers)
    const multiSupplierProducts = allMetrics.filter((m) => m.supplierCount > 1)
    const opportunities = await Promise.all(
      multiSupplierProducts.slice(0, limit).map(async (m) => {
        const items = await p.scannedDocumentItem.findMany({
          where:
            m.productType === 'INVENTORY_ITEM'
              ? { productId: m.productId }
              : { supplierProductId: m.productId },
          include: {
            scannedDocument: {
              select: {
                supplier: { select: { id: true, name: true } },
              },
            },
          },
        })

        const supplierPrices = items
          .filter((item: any) => item.unitPriceCents && item.scannedDocument.supplier)
          .map((item: any) => ({
            supplierId: item.scannedDocument.supplier.id,
            supplierName: item.scannedDocument.supplier.name,
            price: item.unitPriceCents,
          }))

        if (supplierPrices.length < 2) return null

        const avgBySupplier = new Map<string, { name: string; total: number; count: number }>()
        for (const sp of supplierPrices) {
          const existing = avgBySupplier.get(sp.supplierId) || { name: sp.supplierName, total: 0, count: 0 }
          existing.total += sp.price
          existing.count += 1
          avgBySupplier.set(sp.supplierId, existing)
        }

        const averages = Array.from(avgBySupplier.entries()).map(([id, data]) => ({
          supplierId: id,
          supplierName: data.name,
          avgPrice: data.total / data.count,
        }))

        const sorted = averages.sort((a, b: any) => a.avgPrice - b.avgPrice)
        const lowest = sorted[0]
        const highest = sorted[sorted.length - 1]

        if (highest.avgPrice - lowest.avgPrice < lowest.avgPrice * 0.1) return null

        return {
          productId: m.productId,
          productName: m.productName,
          currentPrice: highest.avgPrice,
          lowestPrice: lowest.avgPrice,
          savingsPotential: highest.avgPrice - lowest.avgPrice,
          recommendedSupplier: lowest.supplierName,
        }
      })
    )

    const procurementOpportunities = opportunities.filter((o): o is NonNullable<typeof o> => o !== null)

    const totalProducts = allMetrics.length
    const activeProducts = allMetrics.filter(
      (m) => m.lastPurchaseDate && (new Date().getTime() - m.lastPurchaseDate.getTime()) / (24 * 60 * 60 * 1000) <= 90
    ).length
    const totalSpend = allMetrics.reduce((sum: any, m) => sum + m.totalSpend, 0)
    const averagePrice = safeDivide(
      allMetrics.reduce((sum: any, m) => sum + m.averagePrice, 0),
      totalProducts
    )
    const highRiskCount = highRisk.length

    return {
      topProducts,
      fastestGrowing,
      risingPrices,
      fallingPrices,
      highRisk,
      singleSupplier: singleSupplierDeps,
      procurementOpportunities,
      summary: {
        totalProducts,
        activeProducts,
        totalSpend,
        averagePrice,
        highRiskCount,
      },
    }
  }
}
