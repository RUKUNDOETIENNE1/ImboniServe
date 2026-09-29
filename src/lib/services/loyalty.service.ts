import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

const log = logger.child({ service: 'loyalty' })

const DEFAULT_EARN_RULE = { pointsPerHundredRWF: 1 }
const DEFAULT_REDEEM_RULE = { pointsPerHundredRWF: 1, minimumRedemption: 100 }

export class LoyaltyService {
  static async getBalance(customerId: string, businessId?: string): Promise<number> {
    const result = await prisma.pointsLedger.groupBy({
      by: ['customerId'],
      where: {
        customerId,
        ...(businessId ? { businessId } : {}),
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      _sum: { amount: true },
    })
    return result[0]?._sum?.amount ?? 0
  }

  static async getHistory(customerId: string, businessId?: string) {
    return prisma.pointsLedger.findMany({
      where: {
        customerId,
        ...(businessId ? { businessId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
  }

  static async earnPoints(params: {
    customerId: string
    businessId: string
    saleId?: string
    amountCents: number
    description?: string
  }) {
    const rule = await this.getEarnRule(params.businessId)
    const pointsEarned = Math.floor((params.amountCents / 100) * rule.pointsPerHundredRWF)
    if (pointsEarned <= 0) return { pointsEarned: 0 }

    const expiresAt = new Date()
    expiresAt.setFullYear(expiresAt.getFullYear() + 1)

    await prisma.pointsLedger.create({
      data: {
        customerId: params.customerId,
        businessId: params.businessId,
        amount: pointsEarned,
        type: 'PURCHASE',
        description: params.description || `Earned on sale`,
        saleId: params.saleId,
        expiresAt,
      },
    })

    await prisma.customer.update({
      where: { id: params.customerId },
      data: { loyaltyPoints: { increment: pointsEarned } },
    })

    log.info('Points earned', { customerId: params.customerId, pointsEarned })
    return { pointsEarned }
  }

  static async redeemPoints(params: {
    customerId: string
    businessId: string
    saleId?: string
    points: number
  }): Promise<{ success: boolean; discountCents: number; error?: string }> {
    const balance = await this.getBalance(params.customerId, params.businessId)
    if (balance < params.points) {
      return { success: false, discountCents: 0, error: 'Insufficient points' }
    }

    const rule = await this.getRedeemRule(params.businessId)
    if (params.points < rule.minimumRedemption) {
      return { success: false, discountCents: 0, error: `Minimum redemption is ${rule.minimumRedemption} points` }
    }

    const discountCents = Math.floor(params.points * (100 / rule.pointsPerHundredRWF))

    await prisma.pointsLedger.create({
      data: {
        customerId: params.customerId,
        businessId: params.businessId,
        amount: -params.points,
        type: 'REDEMPTION',
        description: `Redeemed for discount`,
        saleId: params.saleId,
      },
    })

    await prisma.customer.update({
      where: { id: params.customerId },
      data: { loyaltyPoints: { decrement: params.points } },
    })

    log.info('Points redeemed', { customerId: params.customerId, points: params.points, discountCents })
    return { success: true, discountCents }
  }

  private static async getEarnRule(businessId: string) {
    const rule = await prisma.loyaltyRule.findFirst({
      where: { businessId, type: 'EARNING', isActive: true },
    })
    return rule ? (rule.config as any) : DEFAULT_EARN_RULE
  }

  private static async getRedeemRule(businessId: string) {
    return DEFAULT_REDEEM_RULE
  }
}
