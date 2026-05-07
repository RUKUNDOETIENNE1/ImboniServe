import { prisma } from '@/lib/prisma'

const ACTIVATION_BONUS_CENTS = 500_000 // 5,000 RWF
const TRAILING_SHARE_PERCENT = 15.0
const PAYOUT_DELAY_DAYS = 30
const CREDIT_EXPIRY_MONTHS = 6
const QUALIFICATION_THRESHOLD = 30 // slips
const QUALIFICATION_DAYS = 14

export class DiningCreditService {
  /**
   * Check if referred restaurant qualifies (30 slips in 14 days)
   */
  static async checkQualification(businessId: string, referralLinkId: string) {
    const restaurant = await prisma.business.findUnique({
      where: { id: businessId },
      select: { createdAt: true },
    })

    if (!restaurant) return false

    const qualificationDeadline = new Date(restaurant.createdAt)
    qualificationDeadline.setDate(qualificationDeadline.getDate() + QUALIFICATION_DAYS)

    if (new Date() > qualificationDeadline) return false

    const slipCount = await prisma.smartDiningSlip.count({
      where: {
        businessId: businessId,
        createdAt: {
          gte: restaurant.createdAt,
          lte: qualificationDeadline,
        },
      },
    })

    return slipCount >= QUALIFICATION_THRESHOLD
  }

  /**
   * Issue activation bonus (5,000 RWF) when qualification met
   */
  static async issueActivationBonus(referralLinkId: string, businessId: string) {
    const existingBonus = await prisma.diningCredit.findFirst({
      where: {
        referralLinkId,
        reason: 'ACTIVATION_BONUS',
      },
    })

    if (existingBonus) {
      return existingBonus
    }

    const credit = await prisma.diningCredit.create({
      data: {
        referralLinkId,
        amountCents: ACTIVATION_BONUS_CENTS,
        reason: 'ACTIVATION_BONUS',
        status: 'ACTIVE',
        expiresAt: this.calculateExpiryDate(),
      },
    })

    await prisma.referralLink.update({
      where: { id: referralLinkId },
      data: { qualifiedCount: { increment: 1 } },
    })

    return credit
  }

  /**
   * Accrue monthly trailing share (15% of subscription)
   */
  static async accrueTrailingShare(
    referralLinkId: string,
    businessId: string,
    subscriptionAmountCents: number,
    periodMonth: number
  ) {
    if (periodMonth > 12) return null

    const trailingShareCents = Math.round((subscriptionAmountCents * TRAILING_SHARE_PERCENT) / 100)

    const lockedUntil = new Date()
    lockedUntil.setDate(lockedUntil.getDate() + PAYOUT_DELAY_DAYS)

    const credit = await prisma.diningCredit.create({
      data: {
        referralLinkId,
        amountCents: trailingShareCents,
        reason: `TRAILING_SHARE_MONTH_${periodMonth}`,
        status: 'PENDING',
        expiresAt: this.calculateExpiryDate(),
      },
    })

    return credit
  }

  /**
   * Unlock pending credits after 30-day delay
   */
  static async unlockPendingCredits() {
    const now = new Date()

    const updated = await prisma.diningCredit.updateMany({
      where: {
        status: 'PENDING',
        createdAt: { lte: new Date(now.getTime() - PAYOUT_DELAY_DAYS * 24 * 60 * 60 * 1000) },
      },
      data: { status: 'ACTIVE' },
    })

    return updated.count
  }

  /**
   * Expire old credits (6 months)
   */
  static async expireOldCredits() {
    const now = new Date()

    const updated = await prisma.diningCredit.updateMany({
      where: {
        status: { in: ['ACTIVE', 'PENDING'] },
        expiresAt: { lte: now },
      },
      data: { status: 'EXPIRED' },
    })

    return updated.count
  }

  /**
   * Get wallet balance for a referral link (by phone)
   */
  static async getWalletBalance(phone: string) {
    const referralLink = await prisma.referralLink.findFirst({
      where: { clientPhone: phone },
      include: {
        credits: {
          where: {
            status: { in: ['ACTIVE', 'PENDING'] },
          },
        },
      },
    })

    if (!referralLink) {
      return {
        totalEarned: 0,
        available: 0,
        pending: 0,
        expiringSoon: 0,
      }
    }

    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    const totalEarned = referralLink.credits.reduce((sum, c) => sum + c.amountCents, 0)
    const available = referralLink.credits
      .filter((c) => c.status === 'ACTIVE')
      .reduce((sum, c) => sum + c.amountCents, 0)
    const pending = referralLink.credits
      .filter((c) => c.status === 'PENDING')
      .reduce((sum, c) => sum + c.amountCents, 0)
    const expiringSoon = referralLink.credits
      .filter((c) => c.status === 'ACTIVE' && c.expiresAt && c.expiresAt <= thirtyDaysFromNow)
      .reduce((sum, c) => sum + c.amountCents, 0)

    return {
      totalEarned,
      available,
      pending,
      expiringSoon,
      referralLink,
    }
  }

  /**
   * Redeem credits at POS (apply to bill)
   */
  static async redeemAtPOS(phone: string, amountCents: number, businessId: string) {
    const wallet = await this.getWalletBalance(phone)

    if (wallet.available < amountCents) {
      throw new Error('Insufficient credits')
    }

    const referralLink = wallet.referralLink
    if (!referralLink) {
      throw new Error('Referral link not found')
    }

    let remainingToRedeem = amountCents
    const creditsToRedeem = await prisma.diningCredit.findMany({
      where: {
        referralLinkId: referralLink.id,
        status: 'ACTIVE',
      },
      orderBy: { expiresAt: 'asc' },
    })

    for (const credit of creditsToRedeem) {
      if (remainingToRedeem <= 0) break

      const redeemAmount = Math.min(credit.amountCents, remainingToRedeem)

      await prisma.diningCredit.update({
        where: { id: credit.id },
        data: {
          amountCents: credit.amountCents - redeemAmount,
          status: credit.amountCents - redeemAmount === 0 ? 'REDEEMED' : 'ACTIVE',
          redeemedAt: new Date(),
          redeemedBusinessId: businessId,
        },
      })

      remainingToRedeem -= redeemAmount
    }

    return {
      redeemedCents: amountCents,
      remainingBalance: wallet.available - amountCents,
    }
  }

  /**
   * Cash out via MoMo (100% withdrawal)
   */
  static async cashOutMoMo(phone: string, amountCents: number, momoProvider: 'MTN' | 'AIRTEL') {
    const wallet = await this.getWalletBalance(phone)

    if (wallet.available < amountCents) {
      throw new Error('Insufficient credits')
    }

    const referralLink = wallet.referralLink
    if (!referralLink) {
      throw new Error('Referral link not found')
    }

    const trustCheck = await this.checkTrustConditions(referralLink.id)
    if (!trustCheck.eligible) {
      throw new Error(`Cash-out not available: ${trustCheck.reason}`)
    }

    let remainingToWithdraw = amountCents
    const creditsToWithdraw = await prisma.diningCredit.findMany({
      where: {
        referralLinkId: referralLink.id,
        status: 'ACTIVE',
      },
      orderBy: { expiresAt: 'asc' },
    })

    for (const credit of creditsToWithdraw) {
      if (remainingToWithdraw <= 0) break

      const withdrawAmount = Math.min(credit.amountCents, remainingToWithdraw)

      await prisma.diningCredit.update({
        where: { id: credit.id },
        data: {
          amountCents: credit.amountCents - withdrawAmount,
          status: credit.amountCents - withdrawAmount === 0 ? 'REDEEMED' : 'ACTIVE',
          redeemedAt: new Date(),
        },
      })

      remainingToWithdraw -= withdrawAmount
    }

    return {
      withdrawnCents: amountCents,
      remainingBalance: wallet.available - amountCents,
      momoProvider,
      phone,
    }
  }

  /**
   * Check trust conditions for MoMo cash-out
   */
  static async checkTrustConditions(referralLinkId: string) {
    const referralLink = await prisma.referralLink.findUnique({
      where: { id: referralLinkId },
    })

    if (!referralLink) {
      return { eligible: false, reason: 'Referral link not found' }
    }

    if (referralLink.qualifiedCount < 1) {
      return { eligible: false, reason: 'Need at least 1 qualified referral' }
    }

    const accountAge = Date.now() - referralLink.createdAt.getTime()
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000

    if (accountAge < thirtyDaysMs) {
      return { eligible: false, reason: 'Account must be at least 30 days old' }
    }

    return { eligible: true, reason: null }
  }

  /**
   * Calculate expiry date (6 months from now)
   */
  private static calculateExpiryDate(): Date {
    const expiry = new Date()
    expiry.setMonth(expiry.getMonth() + CREDIT_EXPIRY_MONTHS)
    return expiry
  }

  /**
   * Get referral stats for a phone number
   */
  static async getReferralStats(phone: string) {
    const referralLink = await prisma.referralLink.findFirst({
      where: { clientPhone: phone },
      include: {
        credits: true,
      },
    })

    if (!referralLink) {
      return {
        totalReferrals: 0,
        qualifiedReferrals: 0,
        totalEarned: 0,
        availableBalance: 0,
      }
    }

    const wallet = await this.getWalletBalance(phone)

    return {
      totalReferrals: referralLink.signupCount,
      qualifiedReferrals: referralLink.qualifiedCount,
      totalEarned: wallet.totalEarned,
      availableBalance: wallet.available,
      pendingBalance: wallet.pending,
      expiringSoon: wallet.expiringSoon,
    }
  }
}
