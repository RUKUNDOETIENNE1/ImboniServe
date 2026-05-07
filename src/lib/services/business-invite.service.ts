import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

const INVITE_FREE_MONTHS = 1
const INVITE_CREDIT_CENTS = 500000
const QUALIFICATION_SLIPS = 30
const QUALIFICATION_DAYS = 30
const LOCK_DAYS = 14
const EXPIRY_DAYS = 180
const MAX_CREDITS_PER_YEAR = 10
const FRAUD_FLAG_THRESHOLD = 3

export class BusinessInviteService {
  static generateCode(): string {
    return `INV-${crypto.randomBytes(4).toString('hex').toUpperCase()}`
  }

  static async getOrCreateCode(referrerId: string): Promise<string> {
    const existing = await prisma.businessInvite.findFirst({
      where: { referrerId, status: 'PENDING' },
    })
    if (existing) return existing.code

    const code = this.generateCode()
    await prisma.businessInvite.create({
      data: { code, referrerId },
    })
    return code
  }

  static async attributeInvite(code: string, inviteeId: string): Promise<{ ok: boolean; reason?: string }> {
    const invite = await prisma.businessInvite.findUnique({ where: { code } })

    if (!invite) return { ok: false, reason: 'invalid_code' }
    if (invite.status !== 'PENDING') return { ok: false, reason: 'code_already_used' }
    if (invite.inviteeId) return { ok: false, reason: 'code_already_used' }

    if (invite.referrerId === inviteeId) return { ok: false, reason: 'self_referral' }

    const referrer = await prisma.business.findUnique({
      where: { id: invite.referrerId },
      include: { owner: true },
    })
    const invitee = await prisma.business.findUnique({
      where: { id: inviteeId },
      include: { owner: true },
    })

    if (!referrer || !invitee) return { ok: false, reason: 'business_not_found' }

    if (
      referrer.owner.email === invitee.owner.email ||
      referrer.owner.phone === invitee.owner.phone
    ) {
      return { ok: false, reason: 'self_referral' }
    }

    await prisma.businessInvite.update({
      where: { code },
      data: { inviteeId, status: 'SIGNED_UP' },
    })

    await this.checkFraudFlag(invite.referrerId)

    return { ok: true }
  }

  static async processQualification(inviteeId: string): Promise<void> {
    const invite = await prisma.businessInvite.findFirst({
      where: { inviteeId, status: { in: ['SIGNED_UP', 'QUALIFYING'] } },
    })

    if (!invite) return

    const windowStart = new Date(invite.createdAt)
    windowStart.setDate(windowStart.getDate() + QUALIFICATION_DAYS)

    if (new Date() > windowStart) {
      await prisma.businessInvite.update({
        where: { id: invite.id },
        data: { status: 'EXPIRED' },
      })
      return
    }

    const slipCount = await prisma.smartDiningSlip.count({
      where: {
        saleId: {
          in: (
            await prisma.sale.findMany({
              where: { businessId: inviteeId },
              select: { id: true },
            })
          ).map((s) => s.id),
        },
        createdAt: {
          gte: invite.createdAt,
        },
      },
    })

    if (slipCount >= QUALIFICATION_SLIPS) {
      await prisma.businessInvite.update({
        where: { id: invite.id },
        data: { status: 'QUALIFYING' },
      })
    }
  }

  static async processPaymentQualification(inviteeId: string): Promise<void> {
    const invite = await prisma.businessInvite.findFirst({
      where: { inviteeId, status: 'QUALIFYING' },
    })

    if (!invite) return

    const referrer = await prisma.business.findUnique({ where: { id: invite.referrerId } })
    if (!referrer) return

    const yearStart = new Date()
    yearStart.setFullYear(yearStart.getFullYear() - 1)
    const creditCount = await prisma.inviteCredit.count({
      where: {
        businessId: invite.referrerId,
        createdAt: { gte: yearStart },
        status: { notIn: ['VOIDED'] },
      },
    })

    if (creditCount >= MAX_CREDITS_PER_YEAR) {
      await prisma.businessInvite.update({
        where: { id: invite.id },
        data: { status: 'FRAUD_FLAGGED', flagReason: 'annual_credit_cap_reached' },
      })
      return
    }

    const now = new Date()
    const lockedUntil = new Date(now)
    lockedUntil.setDate(lockedUntil.getDate() + LOCK_DAYS)

    const expiresAt = new Date(now)
    expiresAt.setDate(expiresAt.getDate() + EXPIRY_DAYS)

    // Determine credit value from referrer's active subscription plan
    const referrerSub = await prisma.subscription.findFirst({
      where: { businessId: invite.referrerId, status: 'ACTIVE' },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    })
    const inviteeSub = await prisma.subscription.findFirst({
      where: { businessId: inviteeId, status: 'ACTIVE' },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    })

    const referrerCreditCents = referrerSub ? referrerSub.plan.priceCents * INVITE_FREE_MONTHS : INVITE_CREDIT_CENTS
    const inviteeCreditCents = inviteeSub ? inviteeSub.plan.priceCents * INVITE_FREE_MONTHS : INVITE_CREDIT_CENTS

    await prisma.$transaction([
      prisma.businessInvite.update({
        where: { id: invite.id },
        data: { status: 'QUALIFIED', qualifiedAt: now, creditLockedUntil: lockedUntil },
      }),
      // 1 free month credit for referrer
      prisma.inviteCredit.create({
        data: {
          businessId: invite.referrerId,
          inviteId: invite.id,
          role: 'REFERRER',
          amountCents: referrerCreditCents,
          status: 'LOCKED',
          lockedUntil,
          expiresAt,
        },
      }),
      // 1 free month credit for invitee
      prisma.inviteCredit.create({
        data: {
          businessId: inviteeId,
          inviteId: invite.id,
          role: 'INVITEE',
          amountCents: inviteeCreditCents,
          status: 'LOCKED',
          lockedUntil,
          expiresAt,
        },
      }),
      // Track free months granted
      prisma.business.update({
        where: { id: invite.referrerId },
        data: { freeMonthsGranted: { increment: INVITE_FREE_MONTHS } },
      }),
    ])
  }

  static async unlockDueCredits(): Promise<number> {
    const now = new Date()
    const result = await prisma.inviteCredit.updateMany({
      where: { status: 'LOCKED', lockedUntil: { lte: now } },
      data: { status: 'ACTIVE' },
    })

    await prisma.businessInvite.updateMany({
      where: {
        status: 'QUALIFIED',
        creditLockedUntil: { lte: now },
      },
      data: { status: 'CREDITED', creditIssuedAt: now },
    })

    return result.count
  }

  static async expireStalePending(): Promise<void> {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - QUALIFICATION_DAYS)
    await prisma.businessInvite.updateMany({
      where: {
        status: { in: ['SIGNED_UP', 'QUALIFYING'] },
        createdAt: { lte: cutoff },
      },
      data: { status: 'EXPIRED' },
    })

    await prisma.inviteCredit.updateMany({
      where: { status: 'ACTIVE', expiresAt: { lte: new Date() } },
      data: { status: 'EXPIRED' },
    })
  }

  static async getInviteStats(referrerId: string) {
    const invites = await prisma.businessInvite.findMany({
      where: { referrerId },
      include: { credits: true, invitee: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    })

    const credits = await prisma.inviteCredit.findMany({
      where: { businessId: referrerId, role: 'REFERRER' },
    })

    const totalCredits = credits.filter((c) => c.status !== 'VOIDED').reduce((s, c) => s + c.amountCents, 0)
    const availableCredits = credits.filter((c) => c.status === 'ACTIVE').reduce((s, c) => s + c.amountCents, 0)

    return {
      invites,
      totalCreditsEarnedCents: totalCredits,
      availableCreditsCents: availableCredits,
      freeMonthsEarned: credits.filter((c) => c.status !== 'VOIDED').length,
      qualified: invites.filter((i) => ['QUALIFIED', 'CREDITED'].includes(i.status)).length,
      pending: invites.filter((i) => ['PENDING', 'SIGNED_UP', 'QUALIFYING'].includes(i.status)).length,
    }
  }

  private static async checkFraudFlag(referrerId: string): Promise<void> {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentCount = await prisma.businessInvite.count({
      where: {
        referrerId,
        status: { not: 'PENDING' },
        updatedAt: { gte: thirtyDaysAgo },
      },
    })

    if (recentCount >= FRAUD_FLAG_THRESHOLD) {
      await prisma.businessInvite.updateMany({
        where: { referrerId, status: { notIn: ['CREDITED', 'FRAUD_FLAGGED', 'EXPIRED'] } },
        data: { flaggedForReview: true, flagReason: 'high_velocity' },
      })
    }
  }
}
