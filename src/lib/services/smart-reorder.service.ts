import { prisma } from '@/lib/prisma'

export interface ReorderSuggestion {
  inventoryItemId: string
  name: string
  unit: string
  currentStock: number
  minStockLevel: number
  demandPerDay: number
  leadTimeDays: number
  safetyStock: number
  reorderPoint: number
  suggestedQty: number
  explanation: {
    windowDays: number
    consumedInWindow: number
  }
}

export interface GetSuggestionsInput {
  businessId: string
  supplierId?: string
  daysWindow?: number
  safetyStockDays?: number
  includeAll?: boolean
  limit?: number
}

export class SmartReorderService {
  static isEnabled() {
    return process.env.AI_SRO_ENABLED !== 'false'
  }

  static async getLeadTimeDays(supplierId?: string) {
    if (!supplierId) return Number(process.env.DEFAULT_LEAD_TIME_DAYS ?? 2)
    const supplier = await prisma.supplier.findUnique({ where: { id: supplierId as string } }) as any
    return supplier?.leadTimeDays ?? Number(process.env.DEFAULT_LEAD_TIME_DAYS ?? 2)
  }

  static async getConsumedQty(businessId: string, inventoryItemId: string, since: Date) {
    try {
      const rows = await prisma.$queryRaw<Array<{ consumed: number }>>`
        SELECT COALESCE(SUM(CASE WHEN iu."type" IN ('REMOVE','WASTE') THEN iu."quantity" ELSE 0 END), 0) AS consumed
        FROM "InventoryUpdate" iu
        WHERE iu."businessId" = ${businessId}
          AND iu."inventoryItemId" = ${inventoryItemId}
          AND iu."createdAt" >= ${since}
      `
      return Number(rows?.[0]?.consumed ?? 0)
    } catch (error) {
      console.error('[SmartReorderService] getConsumedQty error:', error)
      return 0
    }
  }

  static async getSuggestions(input: GetSuggestionsInput): Promise<ReorderSuggestion[]> {
    if (!this.isEnabled()) return []

    try {
      const daysWindow = input.daysWindow ?? Number(process.env.SRO_DAYS_WINDOW ?? 14)
      const safetyStockDays = input.safetyStockDays ?? Number(process.env.SRO_SAFETY_STOCK_DAYS ?? 1)
      const leadTimeDays = await this.getLeadTimeDays(input.supplierId)
      const since = new Date(Date.now() - daysWindow * 24 * 60 * 60 * 1000)

      const items = await prisma.inventoryItem.findMany({
        where: { businessId: input.businessId, isActive: true },
        select: { id: true, name: true, unit: true, currentStock: true, minStockLevel: true },
        orderBy: { name: 'asc' },
      })

    const suggestions: ReorderSuggestion[] = []
    for (const it of items) {
      const consumed = await this.getConsumedQty(input.businessId, it.id, since)
      const demandPerDay = consumed / daysWindow
      const safetyStock = Math.max(it.minStockLevel, demandPerDay * safetyStockDays)
      const reorderPoint = demandPerDay * leadTimeDays + safetyStock
      const suggested = Math.max(0, reorderPoint - it.currentStock)
      const suggestedQty = Math.ceil(suggested)

      if (input.includeAll || suggestedQty > 0) {
        suggestions.push({
          inventoryItemId: it.id,
          name: it.name,
          unit: it.unit,
          currentStock: it.currentStock,
          minStockLevel: it.minStockLevel,
          demandPerDay,
          leadTimeDays,
          safetyStock,
          reorderPoint,
          suggestedQty,
          explanation: {
            windowDays: daysWindow,
            consumedInWindow: consumed,
          },
        })
      }
    }

      const sorted = suggestions.sort((a, b) => (b.suggestedQty - a.suggestedQty))
      return input.limit ? sorted.slice(0, input.limit) : sorted
    } catch (error) {
      console.error('[SmartReorderService] getSuggestions error:', error)
      return []
    }
  }

  static async logDecision(params: {
    businessId: string
    inventoryItemId: string
    userId?: string
    suggestedQty: number
    chosenQty: number
    action: 'ACCEPTED' | 'EDITED' | 'REJECTED'
    explanation?: any
  }) {
    try {
      const explanationJson = params.explanation ? JSON.stringify(params.explanation) : null
      await prisma.$executeRaw`
        INSERT INTO "ReorderSuggestionLog" ("businessId", "inventoryItemId", "userId", "suggestedQty", "chosenQty", "action", "explanation", "createdAt")
        VALUES (${params.businessId}, ${params.inventoryItemId}, ${params.userId ?? null}, ${params.suggestedQty}, ${params.chosenQty}, ${params.action}, ${explanationJson}::jsonb, NOW())
      `
      return { ok: true }
    } catch (error) {
      console.error('[SmartReorderService] logDecision error:', error)
      throw error
    }
  }
}
