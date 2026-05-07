import { prisma } from '@/lib/prisma'

export interface CostAnomalyCheckInput {
  businessId: string
  supplierId: string
  grnItemId?: string
  productName: string
  unit: string
  observedUnitPriceCents: number
  daysWindow?: number // trailing window to compare against
  thresholdPercent?: number // percent delta to trigger
}

export class CostAnomalyService {
  static isEnabled() {
    return process.env.AI_CPA_ENABLED !== 'false'
  }

  static async evaluateAndMaybeAlert(input: CostAnomalyCheckInput) {
    if (!this.isEnabled()) return null

    try {
      const daysWindow = input.daysWindow ?? 90
      const thresholdPercent = input.thresholdPercent ?? Number(process.env.CPA_THRESHOLD_PERCENT ?? 10)
      const sinceDate = new Date(Date.now() - daysWindow * 24 * 60 * 60 * 1000)

      // Weighted averages over trailing window for same supplier + product name
      const rows = await prisma.$queryRaw<Array<{
        wavg_price: number | null
        wavg_sq: number | null
      }>>`
        SELECT 
          COALESCE(SUM(gi."unitPriceCents" * gi."receivedQuantity")::float / NULLIF(SUM(gi."receivedQuantity")::float, 0), 0) AS wavg_price,
          COALESCE(SUM(gi."receivedQuantity" * gi."unitPriceCents" * gi."unitPriceCents")::float / NULLIF(SUM(gi."receivedQuantity")::float, 0), 0) AS wavg_sq
        FROM "GoodsReceivedNoteItem" gi
        JOIN "GoodsReceivedNote" g ON gi."grnId" = g."id"
        WHERE g."supplierId" = ${input.supplierId}
          AND gi."productName" = ${input.productName}
          AND g."receivedAt" >= ${sinceDate}
          AND (${input.grnItemId ?? null} IS NULL OR gi."id" <> ${input.grnItemId ?? null})
      `

      const agg = rows?.[0] ?? { wavg_price: 0, wavg_sq: 0 }
      const trailingAvg = Math.max(0, Number(agg.wavg_price ?? 0))
      const variance = Math.max(0, Number(agg.wavg_sq ?? 0) - trailingAvg * trailingAvg)
      const stddev = Math.sqrt(variance)

      if (trailingAvg <= 0) {
        // Not enough history to form an opinion
        return null
      }

      const observed = input.observedUnitPriceCents
      const deltaPercent = ((observed - trailingAvg) / trailingAvg) * 100
      const zScore = stddev > 0 ? (observed - trailingAvg) / stddev : null

      const trigger = deltaPercent >= thresholdPercent || (zScore !== null && zScore >= 2.0)
      if (!trigger) return null

      const severity = (deltaPercent >= 15 || (zScore !== null && zScore >= 3.0)) ? 'HIGH' : 'MEDIUM'

      await prisma.$executeRaw`
        INSERT INTO "CostAnomalyAlert" (
          "businessId", "supplierId", "grnItemId", "productName", "unit",
          "observedUnitPriceCents", "trailingAvgUnitPriceCents", "trailingStdDevCents",
          "deltaPercent", "zScore", "thresholdPercent", "severity", "status", "createdAt"
        ) VALUES (
          ${input.businessId}, ${input.supplierId}, ${input.grnItemId ?? null}, ${input.productName}, ${input.unit},
          ${observed}, ${Math.round(trailingAvg)}, ${stddev || null},
          ${deltaPercent}, ${zScore}, ${thresholdPercent}, ${severity}, 'OPEN', NOW()
        )
      `

      return {
        observed,
        trailingAvg,
        stddev,
        deltaPercent,
        zScore,
        severity,
        thresholdPercent,
      }
    } catch (error) {
      console.error('[CostAnomalyService] evaluateAndMaybeAlert error:', error)
      return null
    }
  }

  static async listAlerts(businessId: string, status?: string, limit = 100) {
    try {
      const normalized = status && ['OPEN', 'ACKNOWLEDGED', 'DISMISSED', 'RESOLVED'].includes(status.toUpperCase())
        ? status.toUpperCase()
        : null

      const alerts = await prisma.$queryRaw<Array<any>>`
        SELECT a.*, s.name as "supplierName"
        FROM "CostAnomalyAlert" a
        JOIN "Supplier" s ON a."supplierId" = s."id"
        WHERE a."businessId" = ${businessId}
          AND (${normalized} IS NULL OR a."status" = ${normalized})
        ORDER BY a."createdAt" DESC
        LIMIT ${limit}
      `

      return alerts
    } catch (error) {
      console.error('[CostAnomalyService] listAlerts error:', error)
      return []
    }
  }

  static async updateAlertStatus(id: string, businessId: string, status: string, notes?: string) {
    try {
      const normalized = status.toUpperCase()
      if (!['OPEN', 'ACKNOWLEDGED', 'DISMISSED', 'RESOLVED'].includes(normalized)) {
        throw new Error('Invalid status')
      }

      await prisma.$executeRaw`
        UPDATE "CostAnomalyAlert"
        SET "status" = ${normalized}, "notes" = COALESCE(${notes ?? null}, "notes"),
            "resolvedAt" = CASE WHEN ${normalized} = 'RESOLVED' THEN NOW() ELSE "resolvedAt" END
        WHERE "id" = ${id} AND "businessId" = ${businessId}
      `

      return { id, status: normalized, notes }
    } catch (error) {
      console.error('[CostAnomalyService] updateAlertStatus error:', error)
      throw error
    }
  }
}
