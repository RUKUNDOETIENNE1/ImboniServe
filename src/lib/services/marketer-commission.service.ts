/**
 * Marketer Commission Service
 * Manages commission creation and lifecycle
 * ISOLATED from AffiliateCommission system
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { RevenueEventService } from './revenue-event.service';
import { MarketerWalletService } from './marketer-wallet.service';

const log = logger.child({ service: 'marketer-commission' });

// Commission rates
const SIGNUP_BONUS_CENTS = 5000000; // 50,000 RWF one-time
const RECURRING_RATE_PERCENT = 15; // 15% of subscription revenue
const MAX_RECURRING_MONTHS = 12; // 12 months max

// Validation period
const VALIDATION_PERIOD_DAYS = 7;

export class MarketerCommissionService {
  /**
   * Create signup bonus commission
   */
  static async createSignupBonus(params: {
    marketerId: string;
    businessId: string;
    description?: string;
  }) {
    // Check if signup bonus already exists
    const existing = await prisma.marketerCommission.findFirst({
      where: {
        marketerId: params.marketerId,
        businessId: params.businessId,
        type: 'SIGNUP_BONUS'
      }
    });

    if (existing) {
      log.warn('Signup bonus already exists', {
        marketerId: params.marketerId,
        businessId: params.businessId
      });
      return existing;
    }

    const lockedUntil = new Date();
    lockedUntil.setDate(lockedUntil.getDate() + VALIDATION_PERIOD_DAYS);

    const commission = await prisma.marketerCommission.create({
      data: {
        marketerId: params.marketerId,
        businessId: params.businessId,
        type: 'SIGNUP_BONUS',
        amountCents: SIGNUP_BONUS_CENTS,
        currency: 'RWF',
        status: 'PENDING',
        lockedUntil,
        description: params.description || 'Signup bonus for new business'
      }
    });

    // Add to wallet pending balance
    await MarketerWalletService.addToPending(
      params.marketerId,
      SIGNUP_BONUS_CENTS,
      'Signup bonus commission'
    );

    // Emit event
    await RevenueEventService.emit({
      type: 'COMMISSION_CREATED',
      entityType: 'commission',
      entityId: commission.id,
      payload: {
        marketerId: params.marketerId,
        businessId: params.businessId,
        type: 'SIGNUP_BONUS',
        amountCents: SIGNUP_BONUS_CENTS
      }
    });

    log.info('Signup bonus commission created', {
      commissionId: commission.id,
      marketerId: params.marketerId,
      businessId: params.businessId,
      amountCents: SIGNUP_BONUS_CENTS
    });

    return commission;
  }

  /**
   * Create recurring revenue commission
   * Called when invoice is paid
   */
  static async createRecurringCommission(params: {
    marketerId: string;
    businessId: string;
    invoiceId: string;
    invoiceAmountCents: number;
    description?: string;
  }) {
    // Count existing recurring commissions for this business
    const existingCount = await prisma.marketerCommission.count({
      where: {
        marketerId: params.marketerId,
        businessId: params.businessId,
        type: 'RECURRING_REVENUE',
        status: { not: 'VOID' }
      }
    });

    // Check if we've reached the max
    if (existingCount >= MAX_RECURRING_MONTHS) {
      log.info('Max recurring commissions reached', {
        marketerId: params.marketerId,
        businessId: params.businessId,
        count: existingCount
      });
      return null;
    }

    const periodMonth = existingCount + 1;
    const commissionAmount = Math.round(
      (params.invoiceAmountCents * RECURRING_RATE_PERCENT) / 100
    );

    const lockedUntil = new Date();
    lockedUntil.setDate(lockedUntil.getDate() + VALIDATION_PERIOD_DAYS);

    const commission = await prisma.marketerCommission.create({
      data: {
        marketerId: params.marketerId,
        businessId: params.businessId,
        invoiceId: params.invoiceId,
        type: 'RECURRING_REVENUE',
        amountCents: commissionAmount,
        currency: 'RWF',
        status: 'PENDING',
        lockedUntil,
        periodMonth,
        description: params.description || `Month ${periodMonth} recurring commission (${RECURRING_RATE_PERCENT}%)`
      }
    });

    // Add to wallet pending balance
    await MarketerWalletService.addToPending(
      params.marketerId,
      commissionAmount,
      `Recurring commission - Month ${periodMonth}`
    );

    // Emit event
    await RevenueEventService.emit({
      type: 'COMMISSION_CREATED',
      entityType: 'commission',
      entityId: commission.id,
      payload: {
        marketerId: params.marketerId,
        businessId: params.businessId,
        invoiceId: params.invoiceId,
        type: 'RECURRING_REVENUE',
        amountCents: commissionAmount,
        periodMonth
      }
    });

    log.info('Recurring commission created', {
      commissionId: commission.id,
      marketerId: params.marketerId,
      businessId: params.businessId,
      periodMonth,
      amountCents: commissionAmount
    });

    return commission;
  }

  /**
   * Validate pending commissions (run daily via cron)
   * Move from PENDING to VALIDATED after lock period
   */
  static async validatePendingCommissions(): Promise<number> {
    const now = new Date();

    // Find commissions ready for validation
    const readyCommissions = await prisma.marketerCommission.findMany({
      where: {
        status: 'PENDING',
        lockedUntil: {
          lte: now
        }
      }
    });

    let validated = 0;

    for (const commission of readyCommissions) {
      try {
        // Update commission status
        await prisma.marketerCommission.update({
          where: { id: commission.id },
          data: {
            status: 'VALIDATED',
            validatedAt: now
          }
        });

        // Move from pending to available in wallet
        await MarketerWalletService.validatePending(
          commission.marketerId,
          commission.amountCents,
          `Commission ${commission.id} validated`
        );

        // Emit event
        await RevenueEventService.emit({
          type: 'COMMISSION_VALIDATED',
          entityType: 'commission',
          entityId: commission.id,
          payload: {
            marketerId: commission.marketerId,
            amountCents: commission.amountCents
          }
        });

        validated++;

        log.info('Commission validated', {
          commissionId: commission.id,
          marketerId: commission.marketerId,
          amountCents: commission.amountCents
        });
      } catch (error) {
        log.error('Failed to validate commission', {
          error,
          commissionId: commission.id
        });
      }
    }

    log.info('Commission validation batch complete', { validated });
    return validated;
  }

  /**
   * Get commissions for a marketer
   */
  static async getCommissionsForMarketer(
    marketerId: string,
    params?: {
      status?: 'PENDING' | 'VALIDATED' | 'PAID' | 'VOID';
      type?: 'SIGNUP_BONUS' | 'RECURRING_REVENUE';
      limit?: number;
      offset?: number;
    }
  ) {
    const { status, type, limit = 50, offset = 0 } = params || {};

    return prisma.marketerCommission.findMany({
      where: {
        marketerId,
        ...(status && { status }),
        ...(type && { type })
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });
  }

  /**
   * Get commission stats for a marketer
   */
  static async getCommissionStats(marketerId: string) {
    const [total, pending, validated, paid] = await Promise.all([
      prisma.marketerCommission.aggregate({
        where: { marketerId },
        _sum: { amountCents: true },
        _count: true
      }),
      prisma.marketerCommission.aggregate({
        where: { marketerId, status: 'PENDING' },
        _sum: { amountCents: true },
        _count: true
      }),
      prisma.marketerCommission.aggregate({
        where: { marketerId, status: 'VALIDATED' },
        _sum: { amountCents: true },
        _count: true
      }),
      prisma.marketerCommission.aggregate({
        where: { marketerId, status: 'PAID' },
        _sum: { amountCents: true },
        _count: true
      })
    ]);

    return {
      total: {
        amountCents: total._sum.amountCents || 0,
        count: total._count
      },
      pending: {
        amountCents: pending._sum.amountCents || 0,
        count: pending._count
      },
      validated: {
        amountCents: validated._sum.amountCents || 0,
        count: validated._count
      },
      paid: {
        amountCents: paid._sum.amountCents || 0,
        count: paid._count
      }
    };
  }

  /**
   * Void a commission (admin action)
   */
  static async voidCommission(
    commissionId: string,
    reason: string,
    voidedBy: string
  ) {
    const commission = await prisma.marketerCommission.findUnique({
      where: { id: commissionId }
    });

    if (!commission) {
      throw new Error('Commission not found');
    }

    if (commission.status === 'PAID') {
      throw new Error('Cannot void paid commission');
    }

    // Update commission
    await prisma.marketerCommission.update({
      where: { id: commissionId },
      data: {
        status: 'VOID',
        description: `${commission.description} [VOIDED: ${reason}]`
      }
    });

    // If was pending, remove from wallet
    if (commission.status === 'PENDING') {
      await prisma.marketerWallet.update({
        where: { marketerId: commission.marketerId },
        data: {
          pendingBalance: { decrement: commission.amountCents },
          totalEarned: { decrement: commission.amountCents }
        }
      });
    }

    log.warn('Commission voided', {
      commissionId,
      reason,
      voidedBy
    });
  }
}
