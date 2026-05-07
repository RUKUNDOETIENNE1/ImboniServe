/**
 * Professional Marketer Service
 * Manages B2B business acquisition agents
 * ISOLATED from existing referral systems
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { RevenueEventService } from './revenue-event.service';
import { nanoid } from 'nanoid';

const log = logger.child({ service: 'professional-marketer' });

export class ProfessionalMarketerService {
  /**
   * Create a new marketer
   */
  static async createMarketer(params: {
    name: string;
    email: string;
    phone: string;
    userId?: string;
    onboardedBy?: string;
    notes?: string;
  }) {
    // Generate unique referral code
    const referralCode = `MKT-${nanoid(10).toUpperCase()}`;

    const marketer = await prisma.professionalMarketer.create({
      data: {
        name: params.name,
        email: params.email,
        phone: params.phone,
        userId: params.userId,
        referralCode,
        onboardedBy: params.onboardedBy,
        notes: params.notes,
        status: 'ACTIVE',
        // Create wallet automatically
        wallet: {
          create: {
            availableBalance: 0,
            pendingBalance: 0,
            lockedBalance: 0,
            totalEarned: 0,
            totalPaidOut: 0
          }
        },
        // Create risk profile automatically
        riskProfile: {
          create: {
            riskScore: 0,
            riskLevel: 'LOW',
            flags: [],
            totalPayouts: 0,
            avgPayoutCents: 0
          }
        }
      },
      include: {
        wallet: true,
        riskProfile: true
      }
    });

    // Emit event
    await RevenueEventService.emit({
      type: 'MARKETER_CREATED',
      entityType: 'marketer',
      entityId: marketer.id,
      payload: {
        name: marketer.name,
        email: marketer.email,
        referralCode: marketer.referralCode
      },
      triggeredBy: params.onboardedBy
    });

    log.info('Marketer created', {
      marketerId: marketer.id,
      referralCode: marketer.referralCode
    });

    return marketer;
  }

  /**
   * Get marketer by ID
   */
  static async getMarketer(marketerId: string) {
    return prisma.professionalMarketer.findUnique({
      where: { id: marketerId },
      include: {
        wallet: true,
        riskProfile: true,
        referredBusinesses: true,
        commissions: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        payouts: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });
  }

  /**
   * Get marketer by referral code
   */
  static async getMarketerByReferralCode(referralCode: string) {
    return prisma.professionalMarketer.findUnique({
      where: { referralCode },
      include: {
        wallet: true,
        riskProfile: true
      }
    });
  }

  /**
   * Get marketer by email
   */
  static async getMarketerByEmail(email: string) {
    return prisma.professionalMarketer.findUnique({
      where: { email },
      include: {
        wallet: true,
        riskProfile: true
      }
    });
  }

  /**
   * List all marketers
   */
  static async listMarketers(params?: {
    status?: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
    limit?: number;
    offset?: number;
  }) {
    const { status, limit = 50, offset = 0 } = params || {};

    return prisma.professionalMarketer.findMany({
      where: {
        ...(status && { status })
      },
      include: {
        wallet: true,
        riskProfile: true,
        _count: {
          select: {
            referredBusinesses: true,
            commissions: true,
            payouts: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });
  }

  /**
   * Suspend a marketer
   */
  static async suspendMarketer(
    marketerId: string,
    reason: string,
    suspendedBy: string
  ) {
    const marketer = await prisma.professionalMarketer.update({
      where: { id: marketerId },
      data: {
        status: 'SUSPENDED',
        suspendedAt: new Date(),
        suspensionReason: reason
      }
    });

    // Emit event
    await RevenueEventService.emit({
      type: 'MARKETER_SUSPENDED',
      entityType: 'marketer',
      entityId: marketerId,
      payload: {
        reason,
        suspendedBy
      },
      triggeredBy: suspendedBy
    });

    log.warn('Marketer suspended', { marketerId, reason });

    return marketer;
  }

  /**
   * Reactivate a marketer
   */
  static async reactivateMarketer(
    marketerId: string,
    reactivatedBy: string
  ) {
    const marketer = await prisma.professionalMarketer.update({
      where: { id: marketerId },
      data: {
        status: 'ACTIVE',
        suspendedAt: null,
        suspensionReason: null
      }
    });

    log.info('Marketer reactivated', { marketerId, reactivatedBy });

    return marketer;
  }

  /**
   * Get marketer dashboard data
   */
  static async getMarketerDashboard(marketerId: string) {
    const [marketer, commissionStats, payoutStats, recentActivity] = await Promise.all([
      this.getMarketer(marketerId),
      
      // Commission stats
      prisma.marketerCommission.aggregate({
        where: { marketerId },
        _sum: { amountCents: true },
        _count: true
      }),

      // Payout stats
      prisma.marketerPayout.aggregate({
        where: { marketerId, status: 'PAID' },
        _sum: { amountCents: true },
        _count: true
      }),

      // Recent events
      RevenueEventService.getEventsForEntity('marketer', marketerId, 20)
    ]);

    return {
      marketer,
      stats: {
        totalCommissions: commissionStats._sum.amountCents || 0,
        commissionCount: commissionStats._count,
        totalPayouts: payoutStats._sum.amountCents || 0,
        payoutCount: payoutStats._count
      },
      recentActivity
    };
  }
}
