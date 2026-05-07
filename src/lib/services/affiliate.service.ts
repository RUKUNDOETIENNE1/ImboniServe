import { prisma } from '@/lib/prisma'

export class AffiliateService {
  /**
   * Create commission when an invoice is paid
   * 15% recurring for up to 12 months
   */
  static async createCommissionForInvoice(invoiceId: string) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        subscription: {
          include: {
            business: {
              include: {
                referredByAffiliate: true,
              },
            },
          },
        },
      },
    })

    if (!invoice || !invoice.subscription.business.referredByAffiliate) {
      return null
    }

    const affiliate = invoice.subscription.business.referredByAffiliate
    if (affiliate.status !== 'ACTIVE') {
      return null
    }

    // Count existing commissions for this restaurant
    const existingCommissions = await prisma.affiliateCommission.count({
      where: {
        affiliateId: affiliate.id,
        businessId: invoice.subscription.businessId,
        status: { not: 'void' },
      },
    })

    // Only create commissions for first 12 payments
    if (existingCommissions >= 12) {
      return null
    }

    const periodMonth = existingCommissions + 1
    const commissionRate = affiliate.commissionRatePercent ?? 15.0
    const commissionAmountCents = Math.round((invoice.amountCents * commissionRate) / 100)

    // 7-day lock period
    const lockedUntil = new Date()
    lockedUntil.setDate(lockedUntil.getDate() + 7)

    const commission = await prisma.affiliateCommission.create({
      data: {
        affiliateId: affiliate.id,
        businessId: invoice.subscription.businessId,
        invoiceId: invoice.id,
        amountCents: commissionAmountCents,
        currency: invoice.currency,
        status: 'pending',
        type: periodMonth === 1 ? 'first_payment' : 'renewal',
        periodMonth,
        lockedUntil,
      },
    })

    return commission
  }

  /**
   * Approve commissions after lock period
   */
  static async approveLockedCommissions() {
    const now = new Date()
    
    const approved = await prisma.affiliateCommission.updateMany({
      where: {
        status: 'pending',
        lockedUntil: { lte: now },
      },
      data: {
        status: 'approved',
      },
    })

    return approved.count
  }

  /**
   * Get affiliate stats
   */
  static async getAffiliateStats(affiliateId: string) {
    const [
      totalReferrals,
      activeReferrals,
      totalCommissions,
      pendingCommissions,
      approvedCommissions,
      paidCommissions,
    ] = await Promise.all([
      prisma.business.count({
        where: { referredByAffiliateId: affiliateId },
      }),
      prisma.business.count({
        where: {
          referredByAffiliateId: affiliateId,
          isActive: true,
        },
      }),
      prisma.affiliateCommission.aggregate({
        where: {
          affiliateId,
          status: { not: 'void' },
        },
        _sum: { amountCents: true },
      }),
      prisma.affiliateCommission.aggregate({
        where: {
          affiliateId,
          status: 'pending',
        },
        _sum: { amountCents: true },
      }),
      prisma.affiliateCommission.aggregate({
        where: {
          affiliateId,
          status: 'approved',
        },
        _sum: { amountCents: true },
      }),
      prisma.affiliateCommission.aggregate({
        where: {
          affiliateId,
          status: 'paid',
        },
        _sum: { amountCents: true },
      }),
    ])

    return {
      totalReferrals,
      activeReferrals,
      totalEarnings: totalCommissions._sum.amountCents || 0,
      pendingEarnings: pendingCommissions._sum.amountCents || 0,
      approvedEarnings: approvedCommissions._sum.amountCents || 0,
      paidEarnings: paidCommissions._sum.amountCents || 0,
    }
  }

  /**
   * Request payout (minimum 10,000 RWF = 1,000,000 cents)
   */
  static async requestPayout(affiliateId: string) {
    const MIN_PAYOUT_CENTS = 1_000_000 // 10,000 RWF

    const approvedCommissions = await prisma.affiliateCommission.aggregate({
      where: {
        affiliateId,
        status: 'approved',
      },
      _sum: { amountCents: true },
    })

    const totalApproved = approvedCommissions._sum.amountCents || 0

    if (totalApproved < MIN_PAYOUT_CENTS) {
      throw new Error(`Minimum payout is 10,000 RWF. You have ${totalApproved / 100} RWF available.`)
    }

    const payout = await prisma.affiliatePayout.create({
      data: {
        affiliateId,
        totalAmountCents: totalApproved,
        status: 'requested',
      },
    })

    return payout
  }

  /**
   * Admin: Mark payout as paid and update commissions
   */
  static async markPayoutPaid(payoutId: string, method: string, reference: string) {
    const payout = await prisma.affiliatePayout.findUnique({
      where: { id: payoutId },
    })

    if (!payout) {
      throw new Error('Payout not found')
    }

    if (payout.status === 'paid') {
      throw new Error('Payout already marked as paid')
    }

    // Update payout
    const updatedPayout = await prisma.affiliatePayout.update({
      where: { id: payoutId },
      data: {
        status: 'paid',
        method,
        reference,
        paidAt: new Date(),
      },
    })

    // Mark all approved commissions for this affiliate as paid
    await prisma.affiliateCommission.updateMany({
      where: {
        affiliateId: payout.affiliateId,
        status: 'approved',
      },
      data: {
        status: 'paid',
      },
    })

    return updatedPayout
  }

  /**
   * Get affiliate by code
   */
  static async getAffiliateByCode(code: string) {
    return prisma.affiliate.findUnique({
      where: { code },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })
  }

  /**
   * Generate short affiliate code (IMB-XXXXX format)
   */
  static generateAffiliateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Exclude similar chars
    let code = 'IMB-'
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

  /**
   * Generate affiliate signup link
   */
  static getAffiliateSignupLink(code: string, baseUrl: string = 'https://imboni.rw'): string {
    return `${baseUrl}/signup?aff=${code}`
  }

  /**
   * Generate affiliate deep link for mobile app
   */
  static getAffiliateDeepLink(code: string): string {
    return `imboniserve://signup?aff=${code}`
  }

  /**
   * Create new affiliate
   */
  static async createAffiliate(data: {
    code?: string
    name: string
    userId?: string
    commissionRatePercent?: number
  }) {
    const affiliateCode = data.code || this.generateAffiliateCode()
    
    return prisma.affiliate.create({
      data: {
        code: affiliateCode.toUpperCase(),
        name: data.name,
        userId: data.userId,
        commissionRatePercent: data.commissionRatePercent,
        status: 'ACTIVE',
      },
    })
  }

  /**
   * Apply affiliate code during signup
   */
  static async applyAffiliateCode(businessId: string, code: string) {
    const affiliate = await this.getAffiliateByCode(code.toUpperCase())
    
    if (!affiliate || affiliate.status !== 'ACTIVE') {
      throw new Error('Invalid or inactive affiliate code')
    }

    await prisma.business.update({
      where: { id: businessId },
      data: { referredByAffiliateId: affiliate.id },
    })

    return affiliate
  }
}
