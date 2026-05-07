import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export class ReferralService {
  /**
   * Generate unique referral link for a client
   */
  static async generateReferralLink(
    clientPhone: string,
    clientName?: string,
    clientEmail?: string,
    businessId?: string
  ) {
    const existingLink = await prisma.referralLink.findFirst({
      where: { clientPhone },
    })

    if (existingLink) {
      return existingLink
    }

    const code = this.generateUniqueCode()

    const referralLink = await prisma.referralLink.create({
      data: {
        code,
        clientPhone,
        clientName,
        clientEmail,
        businessId: businessId || '',
      },
    })

    return referralLink
  }

  /**
   * Track referral link click
   */
  static async trackClick(code: string, metadata?: any) {
    const referralLink = await prisma.referralLink.findUnique({
      where: { code },
    })

    if (!referralLink) {
      return null
    }

    await prisma.referralLink.update({
      where: { code },
      data: { clickCount: { increment: 1 } },
    })

    return referralLink
  }

  /**
   * Track restaurant signup via referral
   */
  static async trackSignup(code: string, businessId: string) {
    const referralLink = await prisma.referralLink.findUnique({
      where: { code },
    })

    if (!referralLink) {
      return null
    }

    await prisma.referralLink.update({
      where: { code },
      data: { signupCount: { increment: 1 } },
    })

    await prisma.business.update({
      where: { id: businessId },
      data: { referredByAffiliateId: null },
    })

    return referralLink
  }

  /**
   * Check and process qualification for a referred restaurant
   */
  static async processQualification(businessId: string) {
    const restaurant = await prisma.business.findUnique({
      where: { id: businessId },
    })

    if (!restaurant) return null

    const referralLinks = await prisma.referralLink.findMany({
      where: { businessId: businessId },
    })

    for (const link of referralLinks) {
      const { DiningCreditService } = require('./dining-credit.service')
      const isQualified = await DiningCreditService.checkQualification(businessId, link.id)

      if (isQualified) {
        const existingBonus = await prisma.diningCredit.findFirst({
          where: {
            referralLinkId: link.id,
            reason: 'ACTIVATION_BONUS',
          },
        })

        if (!existingBonus) {
          await DiningCreditService.issueActivationBonus(link.id, businessId)
        }
      }
    }

    return true
  }

  /**
   * Get referral link by code
   */
  static async getReferralLinkByCode(code: string) {
    return prisma.referralLink.findUnique({
      where: { code },
      include: {
        credits: {
          where: {
            status: { in: ['ACTIVE', 'PENDING'] },
          },
        },
      },
    })
  }

  /**
   * Get referral link by phone
   */
  static async getReferralLinkByPhone(phone: string) {
    return prisma.referralLink.findFirst({
      where: { clientPhone: phone },
      include: {
        credits: true,
      },
    })
  }

  /**
   * Generate unique 8-character code
   */
  private static generateUniqueCode(): string {
    return crypto.randomBytes(4).toString('hex').toUpperCase()
  }

  /**
   * Get share URLs for a referral code
   */
  static getShareURLs(code: string, baseUrl: string) {
    const referralUrl = `${baseUrl}/r/${code}`

    const whatsappOwnerMessage = encodeURIComponent(
      `Hi 👋\n\nI dined at a restaurant using Imboni Serve.\nIt made ordering and billing very smooth.\n\nYou can check it here: ${referralUrl}`
    )

    const whatsappPublicMessage = encodeURIComponent(
      `Just had an amazing dining experience! The restaurant uses Imboni Serve for seamless service. Check it out: ${referralUrl}`
    )

    return {
      referralUrl,
      whatsappOwner: `https://wa.me/?text=${whatsappOwnerMessage}`,
      whatsappPublic: `https://wa.me/?text=${whatsappPublicMessage}`,
      copyText: `Share Imboni Serve and earn rewards! ${referralUrl}`,
    }
  }

  /**
   * Anti-fraud: Check for self-referral
   */
  static async checkSelfReferral(referralCode: string, restaurantOwnerId: string) {
    const referralLink = await prisma.referralLink.findUnique({
      where: { code: referralCode },
    })

    if (!referralLink) return false

    const owner = await prisma.user.findUnique({
      where: { id: restaurantOwnerId },
    })

    if (!owner) return false

    return referralLink.clientPhone === owner.phone || referralLink.clientEmail === owner.email
  }

  /**
   * Get referral performance stats
   */
  static async getReferralPerformance(code: string) {
    const referralLink = await prisma.referralLink.findUnique({
      where: { code },
      include: {
        credits: true,
      },
    })

    if (!referralLink) {
      return null
    }

    const totalEarned = referralLink.credits.reduce((sum, c) => sum + c.amountCents, 0)
    const activeCredits = referralLink.credits
      .filter((c) => c.status === 'ACTIVE')
      .reduce((sum, c) => sum + c.amountCents, 0)

    return {
      code: referralLink.code,
      clicks: referralLink.clickCount,
      signups: referralLink.signupCount,
      qualified: referralLink.qualifiedCount,
      totalEarned,
      activeCredits,
      conversionRate: referralLink.clickCount > 0 ? (referralLink.signupCount / referralLink.clickCount) * 100 : 0,
    }
  }
}
