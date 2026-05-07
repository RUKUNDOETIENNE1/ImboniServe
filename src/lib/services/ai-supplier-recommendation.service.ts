import { prisma } from '@/lib/prisma'

interface SupplierScore {
  supplierId: string
  supplier: any
  totalScore: number
  scores: {
    proximity: number
    pricing: number
    availability: number
    reliability: number
  }
  distance?: number
  reasoning: string
  simpleReasoning?: string
  isBestChoice?: boolean
  userPreferenceBoost?: number
}

interface RecommendationParams {
  businessId: string
  productCategory?: string
  maxResults?: number
  includeReasons?: boolean
}

export class AISupplierRecommendationService {
  private static readonly WEIGHTS = {
    proximity: 0.35,
    pricing: 0.30,
    availability: 0.25,
    reliability: 0.10
  }

  private static readonly USER_PREFERENCE_WEIGHT = 0.15

  private static readonly MAX_DISTANCE_KM = 100

  static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371
    const dLat = this.toRad(lat2 - lat1)
    const dLon = this.toRad(lon2 - lon1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private static toRad(degrees: number): number {
    return degrees * (Math.PI / 180)
  }

  private static calculateProximityScore(distanceKm: number): number {
    if (distanceKm <= 5) return 100
    if (distanceKm <= 10) return 90
    if (distanceKm <= 20) return 75
    if (distanceKm <= 50) return 50
    if (distanceKm <= 100) return 25
    return 0
  }

  private static async calculatePricingScore(
    supplierId: string,
    category?: string
  ): Promise<number> {
    const products = await prisma.marketplaceProduct.findMany({
      where: {
        supplierId,
        ...(category && { category }),
        isAvailable: true
      },
      select: { unitPriceCents: true }
    })

    if (products.length === 0) return 50

    const allProducts = await prisma.marketplaceProduct.findMany({
      where: {
        ...(category && { category }),
        isAvailable: true
      },
      select: { unitPriceCents: true }
    })

    if (allProducts.length === 0) return 50

    const avgSupplierPrice =
      products.reduce((sum: number, p: { unitPriceCents: number }) => sum + p.unitPriceCents, 0) / products.length
    const avgMarketPrice =
      allProducts.reduce((sum: number, p: { unitPriceCents: number }) => sum + p.unitPriceCents, 0) / allProducts.length

    const priceRatio = avgSupplierPrice / avgMarketPrice

    if (priceRatio <= 0.8) return 100
    if (priceRatio <= 0.9) return 90
    if (priceRatio <= 1.0) return 80
    if (priceRatio <= 1.1) return 60
    if (priceRatio <= 1.2) return 40
    return 20
  }

  private static async calculateAvailabilityScore(
    supplierId: string,
    category?: string
  ): Promise<number> {
    const totalProducts = await prisma.marketplaceProduct.count({
      where: {
        supplierId,
        ...(category && { category })
      }
    })

    const availableProducts = await prisma.marketplaceProduct.count({
      where: {
        supplierId,
        ...(category && { category }),
        isAvailable: true
      }
    })

    if (totalProducts === 0) return 0

    const availabilityRate = (availableProducts / totalProducts) * 100

    if (availabilityRate >= 95) return 100
    if (availabilityRate >= 85) return 85
    if (availabilityRate >= 75) return 70
    if (availabilityRate >= 60) return 50
    return 30
  }

  private static async calculateReliabilityScore(
    supplierId: string
  ): Promise<number> {
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
      select: { isVerified: true }
    })

    const completedOrders = await prisma.marketplaceOrder.count({
      where: {
        items: {
          some: {
            product: {
              supplierId
            }
          }
        },
        status: 'DELIVERED'
      }
    })

    const totalOrders = await prisma.marketplaceOrder.count({
      where: {
        items: {
          some: {
            product: {
              supplierId
            }
          }
        }
      }
    })

    let score = 50

    if (supplier?.isVerified) {
      score += 30
    }

    if (totalOrders > 0) {
      const completionRate = (completedOrders / totalOrders) * 100
      if (completionRate >= 95) score += 20
      else if (completionRate >= 85) score += 15
      else if (completionRate >= 75) score += 10
      else if (completionRate >= 60) score += 5
    }

    return Math.min(score, 100)
  }

  private static generateReasoning(scores: SupplierScore['scores'], distance?: number): string {
    const reasons: string[] = []

    if (scores.proximity >= 90) {
      reasons.push(`Very close (${distance?.toFixed(1)}km)`)
    } else if (scores.proximity >= 75) {
      reasons.push(`Nearby location (${distance?.toFixed(1)}km)`)
    }

    if (scores.pricing >= 90) {
      reasons.push('Competitive pricing')
    } else if (scores.pricing >= 80) {
      reasons.push('Good value')
    }

    if (scores.availability >= 90) {
      reasons.push('High product availability')
    } else if (scores.availability >= 70) {
      reasons.push('Good stock levels')
    }
    
    if (scores.reliability >= 80) {
      reasons.push('Verified & reliable')
    } else if (scores.reliability >= 60) {
      reasons.push('Established supplier')
    }

    return reasons.length > 0 ? reasons.join(', ') : 'Available supplier'
  }

  private static generateSimpleReasoning(scores: SupplierScore['scores'], distance?: number): string {
    const parts: string[] = []

    if (distance && distance <= 10) {
      parts.push('Closest')
    } else if (scores.proximity >= 70) {
      parts.push('Nearby')
    }

    if (scores.pricing >= 80) {
      parts.push('cheaper than others')
    } else if (scores.pricing >= 60) {
      parts.push('good price')
    }

    if (scores.availability >= 80) {
      parts.push('in stock')
    }

    return parts.length > 0 ? parts.join(' + ') : 'Available now'
  }

  static async getUserPreferenceBoost(businessId: string, supplierId: string): Promise<number> {
    const recentLogs = await prisma.supplierRecommendationLog.findMany({
      where: {
        businessId,
        supplierId,
        createdAt: {
          gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    })

    if (recentLogs.length === 0) return 0

    let boost = 0
    const orderedCount = recentLogs.filter((log: any) => log.action === 'ordered' || log.action === 'approved').length
    const clickedCount = recentLogs.filter((log: any) => log.action === 'clicked').length
    const dismissedCount = recentLogs.filter((log: any) => log.action === 'dismissed').length

    boost += (orderedCount * 10)
    boost += (clickedCount * 3)
    boost -= (dismissedCount * 5)

    return Math.max(0, Math.min(boost, 30))
  }

  static async logRecommendationInteraction(
    businessId: string,
    userId: string,
    supplierId: string,
    action: string,
    productName?: string,
    score?: number
  ): Promise<void> {
    await prisma.supplierRecommendationLog.create({
      data: {
        businessId,
        userId,
        supplierId,
        productName,
        action,
        recommendationScore: score,
        metadata: {}
      }
    })
  }

  static validateCoordinates(business: any, suppliers: any[]): {
    hasBusinessCoords: boolean
    suppliersWithCoords: any[]
    canUseDistance: boolean
  } {
    const hasBusinessCoords = !!(business?.latitude && business?.longitude)
    const suppliersWithCoords = suppliers.filter(
      s => s.latitude !== null && s.longitude !== null
    )
    const canUseDistance = hasBusinessCoords && suppliersWithCoords.length > 0

    return {
      hasBusinessCoords,
      suppliersWithCoords,
      canUseDistance
    }
  }

  static async getRecommendations({
    businessId,
    productCategory,
    maxResults = 10,
    includeReasons = true
  }: RecommendationParams): Promise<SupplierScore[]> {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { latitude: true, longitude: true, city: true }
    })

    if (!business) {
      throw new Error('Business not found')
    }

    const suppliers = await prisma.supplier.findMany({
      where: {
        isActive: true,
        marketplaceProducts: {
          some: {
            isAvailable: true,
            ...(productCategory && { category: productCategory })
          }
        }
      },
      include: {
        marketplaceProducts: {
          where: {
            isAvailable: true,
            ...(productCategory && { category: productCategory })
          },
          select: {
            id: true,
            name: true,
            category: true,
            unitPriceCents: true,
            isAvailable: true
          }
        }
      }
    })

    const scoredSuppliers: SupplierScore[] = await Promise.all(
      suppliers.map(async (supplier: typeof suppliers[0]) => {
        let distance: number | undefined
        let proximityScore = 50

        if (
          business.latitude &&
          business.longitude &&
          supplier.latitude &&
          supplier.longitude
        ) {
          distance = this.calculateDistance(
            business.latitude,
            business.longitude,
            supplier.latitude,
            supplier.longitude
          )
          proximityScore = this.calculateProximityScore(distance)
        } else if (business.city === supplier.city) {
          proximityScore = 70
        }

        const pricingScore = await this.calculatePricingScore(
          supplier.id,
          productCategory
        )
        const availabilityScore = await this.calculateAvailabilityScore(
          supplier.id,
          productCategory
        )
        const reliabilityScore = await this.calculateReliabilityScore(supplier.id)

        const scores = {
          proximity: proximityScore,
          pricing: pricingScore,
          availability: availabilityScore,
          reliability: reliabilityScore
        }

        const userPreferenceBoost = await this.getUserPreferenceBoost(businessId, supplier.id)

        const baseScore =
          proximityScore * this.WEIGHTS.proximity +
          pricingScore * this.WEIGHTS.pricing +
          availabilityScore * this.WEIGHTS.availability +
          reliabilityScore * this.WEIGHTS.reliability

        const totalScore = baseScore + (userPreferenceBoost * this.USER_PREFERENCE_WEIGHT)

        return {
          supplierId: supplier.id,
          supplier,
          totalScore,
          scores,
          distance,
          reasoning: includeReasons ? this.generateReasoning(scores, distance) : '',
          simpleReasoning: this.generateSimpleReasoning(scores, distance),
          userPreferenceBoost
        }
      })
    )

    const sorted = scoredSuppliers.sort((a, b) => b.totalScore - a.totalScore)
    
    if (sorted.length > 0) {
      sorted[0].isBestChoice = true
    }

    return sorted.slice(0, maxResults)
  }

  static async getSmartSupplierSuggestions(
    businessId: string,
    productName?: string
  ): Promise<{
    recommendations: SupplierScore[]
    insights: {
      averageDistance: number
      bestPriceSupplier: SupplierScore | null
      nearestSupplier: SupplierScore | null
      mostReliable: SupplierScore | null
    }
  }> {
    const recommendations = await this.getRecommendations({
      businessId,
      maxResults: 10,
      includeReasons: true
    })

    const insights = {
      averageDistance:
        recommendations
          .filter((r) => r.distance !== undefined)
          .reduce((sum, r) => sum + (r.distance || 0), 0) /
        recommendations.filter((r) => r.distance !== undefined).length || 0,
      bestPriceSupplier:
        recommendations.sort((a, b) => b.scores.pricing - a.scores.pricing)[0] || null,
      nearestSupplier:
        recommendations.sort((a, b) => (a.distance || 999) - (b.distance || 999))[0] ||
        null,
      mostReliable:
        recommendations.sort((a, b) => b.scores.reliability - a.scores.reliability)[0] ||
        null
    }

    return {
      recommendations: recommendations.sort((a, b) => b.totalScore - a.totalScore),
      insights
    }
  }
}
