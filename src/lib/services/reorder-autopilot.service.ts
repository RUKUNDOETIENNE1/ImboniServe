import { prisma } from '@/lib/prisma'
import { AISupplierRecommendationService } from './ai-supplier-recommendation.service'

interface LowStockItem {
  id: string
  name: string
  currentStock: number
  minStock: number
  unit: string
  category?: string
  stockPercentage: number
  urgency: 'critical' | 'low' | 'warning'
}

interface ReorderSuggestion {
  item: LowStockItem
  recommendedSupplier: {
    id: string
    name: string
    distance?: number
    pricing: number
    reasoning: string
    productId: string
    unitPrice: number
    estimatedTotal: number
  }
  suggestedQuantity: number
  estimatedCost: number
  autoApproved: boolean
}

export class ReorderAutopilotService {
  private static readonly CRITICAL_THRESHOLD = 0.2 // 20% of min stock
  private static readonly LOW_THRESHOLD = 0.5 // 50% of min stock
  private static readonly WARNING_THRESHOLD = 0.8 // 80% of min stock

  static async detectLowStock(businessId: string): Promise<LowStockItem[]> {
    const inventory = await prisma.inventoryItem.findMany({
      where: {
        businessId,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        currentStock: true,
        minStockLevel: true,
        unit: true,
        category: true
      }
    })

    const lowStockItems: LowStockItem[] = inventory
      .filter(item => item.currentStock <= item.minStockLevel)
      .map(item => {
        const stockPercentage = item.currentStock / item.minStockLevel
        let urgency: 'critical' | 'low' | 'warning'

        if (stockPercentage <= this.CRITICAL_THRESHOLD) {
          urgency = 'critical'
        } else if (stockPercentage <= this.LOW_THRESHOLD) {
          urgency = 'low'
        } else {
          urgency = 'warning'
        }

        return {
          id: item.id,
          name: item.name,
          currentStock: item.currentStock,
          minStock: item.minStockLevel,
          unit: item.unit,
          category: item.category || undefined,
          stockPercentage,
          urgency
        }
      })
      .sort((a, b) => a.stockPercentage - b.stockPercentage)

    return lowStockItems
  }

  static async generateReorderSuggestions(
    businessId: string,
    lowStockItems?: LowStockItem[]
  ): Promise<ReorderSuggestion[]> {
    if (!lowStockItems) {
      lowStockItems = await this.detectLowStock(businessId)
    }

    if (lowStockItems.length === 0) {
      return []
    }

    const suggestions: ReorderSuggestion[] = []

    for (const item of lowStockItems) {
      try {
        const recommendations = await AISupplierRecommendationService.getRecommendations({
          businessId,
          productCategory: item.category,
          maxResults: 5,
          includeReasons: true
        })

        if (recommendations.length === 0) continue

        const bestSupplier = recommendations[0]

        const matchingProduct = await prisma.marketplaceProduct.findFirst({
          where: {
            supplierId: bestSupplier.supplierId,
            name: { contains: item.name, mode: 'insensitive' },
            isAvailable: true
          },
          orderBy: {
            unitPriceCents: 'asc'
          }
        })

        if (!matchingProduct) continue

        const suggestedQuantity = Math.max(
          item.minStock * 2 - item.currentStock,
          item.minStock
        )

        const estimatedCost = (matchingProduct.unitPriceCents / 100) * suggestedQuantity

        const simpleReasoning = this.generateSimpleReasoning(
          bestSupplier.scores,
          bestSupplier.distance
        )

        suggestions.push({
          item,
          recommendedSupplier: {
            id: bestSupplier.supplierId,
            name: bestSupplier.supplier.name,
            distance: bestSupplier.distance,
            pricing: bestSupplier.scores.pricing,
            reasoning: simpleReasoning,
            productId: matchingProduct.id,
            unitPrice: matchingProduct.unitPriceCents / 100,
            estimatedTotal: estimatedCost
          },
          suggestedQuantity,
          estimatedCost,
          autoApproved: false
        })
      } catch (error) {
        console.error(`Error generating suggestion for ${item.name}:`, error)
      }
    }

    return suggestions
  }

  private static generateSimpleReasoning(
    scores: { proximity: number; pricing: number; availability: number; reliability: number },
    distance?: number
  ): string {
    const reasons: string[] = []

    if (scores.proximity >= 85 && distance) {
      reasons.push(`Only ${distance.toFixed(1)}km away`)
    } else if (scores.proximity >= 70) {
      reasons.push('Nearby location')
    }

    if (scores.pricing >= 85) {
      reasons.push('Best price')
    } else if (scores.pricing >= 70) {
      reasons.push('Good value')
    }

    if (scores.availability >= 85) {
      reasons.push('In stock')
    }

    if (scores.reliability >= 80) {
      reasons.push('Verified & reliable')
    }

    return reasons.length > 0 ? reasons.join(' • ') : 'Available supplier'
  }

  static async createReorderFromSuggestion(
    businessId: string,
    suggestion: ReorderSuggestion,
    userId: string
  ): Promise<any> {
    const order = await prisma.marketplaceOrder.create({
      data: {
        businessId,
        userId,
        orderNumber: `AUTO-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        status: 'PENDING',
        totalAmountCents: Math.round(suggestion.estimatedCost * 100),
        paymentMethod: 'OTHER' as any,
        paymentStatus: 'PENDING' as any,
        items: {
          create: {
            productId: suggestion.recommendedSupplier.productId,
            quantity: suggestion.suggestedQuantity,
            unitPriceCents: Math.round(suggestion.recommendedSupplier.unitPrice * 100),
            totalPriceCents: Math.round(suggestion.estimatedCost * 100)
          }
        }
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                supplier: true
              }
            }
          }
        }
      }
    })

    await this.logReorderAction(businessId, suggestion, userId, 'approved')

    return order
  }

  static async logReorderAction(
    businessId: string,
    suggestion: ReorderSuggestion,
    userId: string,
    action: 'approved' | 'dismissed' | 'modified'
  ): Promise<void> {
    await prisma.supplierRecommendationLog.create({
      data: {
        businessId,
        userId,
        supplierId: suggestion.recommendedSupplier.id,
        productName: suggestion.item.name,
        action,
        recommendationScore: 0,
        metadata: {
          urgency: suggestion.item.urgency,
          suggestedQuantity: suggestion.suggestedQuantity,
          estimatedCost: suggestion.estimatedCost,
          reasoning: suggestion.recommendedSupplier.reasoning
        }
      }
    })
  }

  static async getAutopilotDashboard(businessId: string): Promise<{
    lowStockCount: number
    criticalCount: number
    suggestions: ReorderSuggestion[]
    totalEstimatedCost: number
  }> {
    const lowStockItems = await this.detectLowStock(businessId)
    const suggestions = await this.generateReorderSuggestions(businessId, lowStockItems)

    const criticalCount = lowStockItems.filter(item => item.urgency === 'critical').length
    const totalEstimatedCost = suggestions.reduce((sum, s) => sum + s.estimatedCost, 0)

    return {
      lowStockCount: lowStockItems.length,
      criticalCount,
      suggestions,
      totalEstimatedCost
    }
  }
}
