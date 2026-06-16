import { prisma } from '@/lib/prisma'
import { FraudDetectionService } from './fraud-detection.service'

/**
 * Unified Tier-Based Referral & Rewards System
 * 
 * Tier 1: B2B Affiliates (15% for 12 months) - handled by affiliate.service.ts
 * Tier 2: Customer Referrals (1,000 RWF fixed, one-time)
 * Tier 3: Casual Sharing (500 RWF fixed, one-time)
 */
export class ReferralTrackingTierService {
  // Tier 2: Customer referrals (Dining Slip)
  private static readonly TIER_2_WELCOME_BONUS_CENTS = 100000 // 1,000 RWF
  
  // Tier 3: Casual sharing (Table invites)
  private static readonly TIER_3_INVITE_REWARD_CENTS = 50000 // 500 RWF
  
  // Lifecycle validation
  private static readonly LOCK_PERIOD_DAYS = 7 // 7-day validation period
  
  /**
   * Calculate lock period end date
   */
  private static calculateLockUntil(): Date {
    const lockUntil = new Date()
    lockUntil.setDate(lockUntil.getDate() + this.LOCK_PERIOD_DAYS)
    return lockUntil
  }

  /**
   * Track a referral link click (Tier 2)
   */
  static async trackClick(params: {
    referralCode: string
    ipAddress?: string
    userAgent?: string
    deviceId?: string
  }): Promise<{ success: boolean; clickId?: string; error?: string }> {
    try {
      // Find referral link
      const referralLink = await prisma.referralLink.findUnique({
        where: { code: params.referralCode }
      })

      if (!referralLink) {
        return { success: false, error: 'Invalid referral code' }
      }

      // Fraud check
      const fraudCheck = await FraudDetectionService.checkReferralClick({
        referralLinkId: referralLink.id,
        ipAddress: params.ipAddress,
        deviceId: params.deviceId,
        userAgent: params.userAgent
      })

      if (fraudCheck.action === 'BLOCKED') {
        return { success: false, error: 'Click blocked due to suspicious activity' }
      }

      // Track click
      const click = await prisma.referralClick.create({
        data: {
          referralLinkId: referralLink.id,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
          deviceId: params.deviceId
        }
      })

      // Update click count
      await prisma.referralLink.update({
        where: { id: referralLink.id },
        data: { clickCount: { increment: 1 } }
      })

      return { success: true, clickId: click.id }
    } catch (error) {
      console.error('Error tracking click:', error)
      return { success: false, error: 'Failed to track click' }
    }
  }

  /**
   * Award Tier 2 welcome bonus (1,000 RWF fixed reward)
   * Triggered after first valid order from referred customer
   */
  static async awardWelcomeBonus(params: {
    customerId: string
    phone: string
    referralCode: string
    ipAddress?: string
    deviceId?: string
  }): Promise<{ success: boolean; error?: string }> {
    try {
      // Find referral link
      const referralLink = await prisma.referralLink.findUnique({
        where: { code: params.referralCode }
      })

      if (!referralLink) {
        return { success: false, error: 'Invalid referral code' }
      }

      // Check if bonus already claimed
      const existingBonus = await prisma.referralReward.findFirst({
        where: {
          customerId: params.customerId,
          type: 'WELCOME_BONUS'
        }
      })

      if (existingBonus) {
        return { success: false, error: 'Welcome bonus already claimed' }
      }

      // Fraud check for signup
      const fraudCheck = await FraudDetectionService.checkSignup({
        phone: params.phone,
        referralLinkId: referralLink.id,
        ipAddress: params.ipAddress,
        deviceId: params.deviceId
      })

      // Tier 2 welcome bonus amount
      const bonusAmount = this.TIER_2_WELCOME_BONUS_CENTS

      // Award bonus to both referrer and new customer
      await prisma.$transaction(async (tx) => {
        // Bonus for new customer
        await tx.referralReward.create({
          data: {
            referralLinkId: referralLink.id,
            customerId: params.customerId,
            tier: 'TIER_2',
            type: 'WELCOME_BONUS',
            amountCents: bonusAmount,
            status: fraudCheck.action === 'ALLOWED' ? 'VALIDATED' : 'EARNED',
            lockUntil: this.calculateLockUntil(),
            triggeredBy: null,
            description: `Tier 2 welcome bonus (1,000 RWF) for new customer signup`,
            metadata: { fraudScore: fraudCheck.riskScore }
          }
        })

        // Bonus for referrer (as DiningCredit with 90-day expiry)
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 90)

        await tx.diningCredit.create({
          data: {
            referralLinkId: referralLink.id,
            amountCents: bonusAmount,
            reason: `Tier 2 referral bonus for bringing ${params.phone}`,
            expiresAt,
            status: 'ACTIVE'
          }
        })

        // Update referral link stats
        await tx.referralLink.update({
          where: { id: referralLink.id },
          data: {
            signupCount: { increment: 1 },
            qualifiedCount: { increment: 1 }
          }
        })

        // Mark click as converted
        await tx.referralClick.updateMany({
          where: {
            referralLinkId: referralLink.id,
            customerId: null,
            deviceId: params.deviceId
          },
          data: {
            convertedAt: new Date(),
            customerId: params.customerId
          }
        })
      })

      return { success: true }
    } catch (error) {
      console.error('Error awarding welcome bonus:', error)
      return { success: false, error: 'Failed to award welcome bonus' }
    }
  }

  /**
   * Award Tier 3 table invite reward (500 RWF fixed reward)
   * Triggered when 2+ friends accept table invite
   */
  static async awardTableInviteReward(params: {
    inviterId: string
    sessionId: string
  }): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if inviter has 2+ accepted invites
      const acceptedInvites = await prisma.tableSessionInvite.count({
        where: {
          inviterId: params.inviterId,
          status: 'ACCEPTED'
        }
      })

      if (acceptedInvites < 2) {
        return { success: false, error: 'Need 2+ accepted invites to qualify' }
      }

      // Check if reward already earned
      const existingReward = await prisma.referralReward.findFirst({
        where: {
          customerId: params.inviterId,
          tier: 'TIER_3',
          type: 'TABLE_INVITE',
          metadata: {
            path: ['sessionId'],
            equals: params.sessionId
          }
        }
      })

      if (existingReward) {
        return { success: false, error: 'Reward already earned for this session' }
      }

      const session = await prisma.tableSession.findUnique({
        where: { id: params.sessionId },
        select: { businessId: true },
      })
      if (!session) {
        return { success: false, error: 'Session not found' }
      }

      const referralLink = await prisma.referralLink.findFirst({
        where: { businessId: session.businessId },
        select: { id: true },
      })
      if (!referralLink) {
        return { success: false, error: 'No referral link configured for this business' }
      }

      // Award Tier 3 reward
      await prisma.referralReward.create({
        data: {
          referralLinkId: referralLink.id,
          customerId: params.inviterId,
          tier: 'TIER_3',
          type: 'TABLE_INVITE',
          amountCents: this.TIER_3_INVITE_REWARD_CENTS,
          status: 'VALIDATED', // Auto-validated for table invites
          lockUntil: this.calculateLockUntil(),
          triggeredBy: params.sessionId,
          description: `Tier 3 table invite reward (500 RWF) for 2+ accepted invites`,
          metadata: { sessionId: params.sessionId, acceptedCount: acceptedInvites }
        }
      })

      return { success: true }
    } catch (error) {
      console.error('Error awarding table invite reward:', error)
      return { success: false, error: 'Failed to award table invite reward' }
    }
  }

  /**
   * Process lifecycle validation (EARNED → VALIDATED → WITHDRAWABLE)
   * Run this as a cron job daily
   */
  static async processLifecycleValidation(): Promise<{ processed: number }> {
    const now = new Date()
    let processed = 0

    try {
      // Step 1: EARNED → VALIDATED (after order confirmed, not refunded)
      const earnedRewards = await prisma.referralReward.findMany({
        where: {
          status: 'EARNED',
          createdAt: { lte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // 24 hours old
        }
      })

      for (const reward of earnedRewards) {
        if (reward.triggeredBy) {
          // Check if order still valid (not refunded)
          const order = await prisma.sale.findUnique({
            where: { id: reward.triggeredBy }
          })

          if (order && order.status !== 'REFUNDED') {
            await prisma.referralReward.update({
              where: { id: reward.id },
              data: {
                status: 'VALIDATED',
                validatedAt: now
              }
            })
            processed++
          }
        }
      }

      // Step 2: VALIDATED → WITHDRAWABLE (after lock period)
      const validatedRewards = await prisma.referralReward.updateMany({
        where: {
          status: 'VALIDATED',
          lockUntil: { lte: now }
        },
        data: {
          status: 'WITHDRAWABLE',
          withdrawableAt: now
        }
      })

      processed += validatedRewards.count

      return { processed }
    } catch (error) {
      console.error('Error processing lifecycle validation:', error)
      return { processed: 0 }
    }
  }

  /**
   * Get dashboard data for a referral link (Tier 2)
   */
  static async getAffiliateDashboard(referralLinkId: string) {
    try {
      const [referralLink, rewards, monthlyEarnings, recentClicks] = await Promise.all([
        prisma.referralLink.findUnique({
          where: { id: referralLinkId }
        }),
        prisma.referralReward.findMany({
          where: { referralLinkId },
          orderBy: { createdAt: 'desc' },
          take: 50
        }),
        prisma.affiliateEarnings.findMany({
          where: { referralLinkId },
          orderBy: { month: 'desc' },
          take: 6
        }),
        prisma.referralClick.count({
          where: {
            referralLinkId,
            clickedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
          }
        })
      ])

      const totalEarnings = rewards
        .filter(r => r.status === 'WITHDRAWABLE' || r.status === 'PAID')
        .reduce((sum, r) => sum + r.amountCents, 0)

      const pendingEarnings = rewards
        .filter(r => r.status === 'EARNED' || r.status === 'VALIDATED')
        .reduce((sum, r) => sum + r.amountCents, 0)

      return {
        referralLink,
        stats: {
          totalClicks: referralLink?.clickCount || 0,
          totalSignups: referralLink?.signupCount || 0,
          totalQualified: referralLink?.qualifiedCount || 0,
          totalEarnings,
          pendingEarnings,
          recentClicks
        },
        monthlyEarnings
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error)
      throw error
    }
  }
}
