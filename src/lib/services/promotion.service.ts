import { prisma } from '@/lib/prisma'
import { formatCurrency } from '@/lib/utils/currency'
import { Promotion } from '@prisma/client'

export class PromotionService {
  static async getActivePromotions(businessId: string): Promise<any[]> {
    const now = new Date()
    const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay()
    const timeHHMM = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

    const promotions = await prisma.promotion.findMany({
      where: {
        businessId,
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
    })

    return promotions.filter(p => {
      if (p.daysOfWeek.length > 0 && !p.daysOfWeek.includes(dayOfWeek)) return false
      if (p.timeStart && p.timeEnd) {
        if (timeHHMM < p.timeStart || timeHHMM > p.timeEnd) return false
      }
      if (p.usageLimit !== null && p.usageCount >= p.usageLimit) return false
      return true
    })
  }

  static async calculateDiscount(
    promotionId: string,
    subtotalCents: number
  ): Promise<{ discountCents: number; description: string }> {
    const promotion = await prisma.promotion.findUnique({ where: { id: promotionId } })
    if (!promotion) return { discountCents: 0, description: '' }

    const config = promotion.config as any
    let discountCents = 0

    switch (promotion.type) {
      case 'DISCOUNT_PERCENT':
        discountCents = Math.round(subtotalCents * (config.percent / 100))
        if (config.maxDiscountCents) discountCents = Math.min(discountCents, config.maxDiscountCents)
        break
      case 'DISCOUNT_FIXED':
        discountCents = config.amountCents || 0
        break
      case 'HAPPY_HOUR':
        discountCents = Math.round(subtotalCents * (config.percent / 100))
        break
    }

    if (config.minPurchaseCents && subtotalCents < config.minPurchaseCents) {
      const currency = 'RWF' // Default currency for promotions
      return { discountCents: 0, description: `Min purchase ${formatCurrency(config.minPurchaseCents / 100, currency)} required` }
    }

    return { discountCents, description: promotion.name }
  }

  static async applyPromotion(params: {
    promotionId: string; saleId: string; discountCents: number
  }) {
    await prisma.$transaction([
      prisma.promotionRedemption.create({
        data: {
          promotionId: params.promotionId,
          saleId: params.saleId,
          discountCents: params.discountCents,
        },
      }),
      prisma.promotion.update({
        where: { id: params.promotionId },
        data: { usageCount: { increment: 1 } },
      }),
    ])
  }

  static async createPromotion(businessId: string, data: {
    name: string; description?: string; type: string
    config: Record<string, unknown>; startDate: Date; endDate: Date
    daysOfWeek?: number[]; timeStart?: string; timeEnd?: string; usageLimit?: number
  }) {
    return prisma.promotion.create({
      data: { ...data, businessId, daysOfWeek: data.daysOfWeek || [], config: data.config as any },
    })
  }

  static async getPromotions(businessId: string) {
    return prisma.promotion.findMany({
      where: { businessId },
      include: { _count: { select: { redemptions: true } } },
      orderBy: { createdAt: 'desc' },
    })
  }
}
