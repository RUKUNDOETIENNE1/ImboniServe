/**
 * Marketer Payout Service
 * Manages payout requests and processing
 * Integrates with MoMo service for actual transfers
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { RevenueEventService } from './revenue-event.service';
import { RevenueAlertService } from './revenue-alert.service';
import { MarketerWalletService } from './marketer-wallet.service';
import { MarketerRiskService } from './marketer-risk.service';
import { MoMoService } from './momo.service';
import { RevenueNotificationService } from './revenue-notification.service';
import { PayoutAutoApprovalService } from './payout-auto-approval.service';

const log = logger.child({ service: 'marketer-payout' });

// Payout limits
const MIN_PAYOUT_CENTS = 1000000; // 10,000 RWF minimum
const MAX_PAYOUT_CENTS = 100000000; // 1,000,000 RWF maximum per request

export class MarketerPayoutService {
  /**
   * Request a payout
   */
  static async requestPayout(params: {
    marketerId: string;
    amountCents: number;
    method: 'MTN_MOBILE_MONEY' | 'AIRTEL_MONEY' | 'BANK_TRANSFER';
    recipientPhone?: string;
    recipientBank?: string;
    recipientAccount?: string;
  }) {
    // Validate amount
    if (params.amountCents < MIN_PAYOUT_CENTS) {
      throw new Error(`Minimum payout is ${MIN_PAYOUT_CENTS / 100} RWF`);
    }

    if (params.amountCents > MAX_PAYOUT_CENTS) {
      throw new Error(`Maximum payout is ${MAX_PAYOUT_CENTS / 100} RWF`);
    }

    // Check wallet balance
    const wallet = await MarketerWalletService.getWallet(params.marketerId);
    if (!wallet || wallet.availableBalance < params.amountCents) {
      throw new Error('Insufficient available balance');
    }

    // Lock funds in wallet
    await MarketerWalletService.lockForPayout(
      params.marketerId,
      params.amountCents
    );

    // Get marketer details for email
    const marketer = await prisma.professionalMarketer.findUnique({
      where: { id: params.marketerId }
    });

    if (!marketer) {
      throw new Error('Marketer not found');
    }

    // Create payout request
    const payout = await prisma.marketerPayout.create({
      data: {
        marketerId: params.marketerId,
        amountCents: params.amountCents,
        currency: 'RWF',
        method: params.method,
        status: 'PENDING',
        recipientPhone: params.recipientPhone,
        recipientBank: params.recipientBank,
        recipientAccount: params.recipientAccount
      }
    });

    // Update risk profile
    await MarketerRiskService.updateRiskOnPayoutRequest(
      params.marketerId,
      params.amountCents
    );

    // Emit event
    await RevenueEventService.emit({
      type: 'PAYOUT_REQUESTED',
      entityType: 'payout',
      entityId: payout.id,
      payload: {
        marketerId: params.marketerId,
        amountCents: params.amountCents,
        method: params.method
      }
    });

    log.info('Payout requested', {
      payoutId: payout.id,
      marketerId: params.marketerId,
      amountCents: params.amountCents
    });

    // Send email notification (async, don't block)
    RevenueNotificationService.sendPayoutRequested({
      email: marketer.email,
      name: marketer.name,
      amountCents: params.amountCents,
      method: params.method,
      payoutId: payout.id
    }).catch(err => log.error('Failed to send payout requested email', { error: err }));

    // Auto-approval evaluation (non-blocking for request flow)
    try {
      const { approve, reasons } = await PayoutAutoApprovalService.shouldAutoApprove({
        marketerId: params.marketerId,
        amountCents: params.amountCents
      });

      if (approve) {
        await this.approvePayout(payout.id, 'system:auto-approval');
        await RevenueEventService.emit({
          type: 'PAYOUT_AUTO_APPROVED',
          entityType: 'payout',
          entityId: payout.id,
          payload: { marketerId: params.marketerId, amountCents: params.amountCents, reasons }
        });
        // Notify marketer
        RevenueNotificationService.sendPayoutApproved({
          email: marketer.email,
          name: marketer.name,
          amountCents: params.amountCents,
          method: params.method,
          payoutId: payout.id
        }).catch(err => log.error('Failed to send payout approved email (auto)', { error: err }));
      }
    } catch (err) {
      log.warn('Auto-approval evaluation failed', { error: err, payoutId: payout.id });
    }

    return payout;
  }

  /**
   * Approve a payout (admin action)
   */
  static async approvePayout(
    payoutId: string,
    approvedBy: string
  ) {
    const payout = await prisma.marketerPayout.findUnique({
      where: { id: payoutId },
      include: { marketer: true }
    });

    if (!payout) {
      throw new Error('Payout not found');
    }

    if (payout.status !== 'PENDING') {
      throw new Error(`Cannot approve payout with status: ${payout.status}`);
    }

    // Update status
    await prisma.marketerPayout.update({
      where: { id: payoutId },
      data: {
        status: 'APPROVED',
        approvedBy,
        approvedAt: new Date()
      }
    });

    // Emit event
    await RevenueEventService.emit({
      type: 'PAYOUT_APPROVED',
      entityType: 'payout',
      entityId: payoutId,
      payload: {
        marketerId: payout.marketerId,
        amountCents: payout.amountCents,
        approvedBy
      },
      triggeredBy: approvedBy
    });

    log.info('Payout approved', {
      payoutId,
      approvedBy
    });

    // Email notify marketer (async)
    if (payout?.marketer?.email) {
      RevenueNotificationService.sendPayoutApproved({
        email: payout.marketer.email,
        name: payout.marketer.name,
        amountCents: payout.amountCents,
        method: payout.method,
        payoutId: payoutId
      }).catch(err => log.error('Failed to send payout approved email', { error: err }));
    }

    return payout;
  }

  /**
   * Reject a payout (admin action)
   */
  static async rejectPayout(
    payoutId: string,
    reason: string,
    rejectedBy: string
  ) {
    const payout = await prisma.marketerPayout.findUnique({
      where: { id: payoutId }
    });

    if (!payout) {
      throw new Error('Payout not found');
    }

    if (payout.status !== 'PENDING') {
      throw new Error(`Cannot reject payout with status: ${payout.status}`);
    }

    // Update status
    await prisma.marketerPayout.update({
      where: { id: payoutId },
      data: {
        status: 'REJECTED',
        rejectedBy,
        rejectedAt: new Date(),
        rejectReason: reason
      }
    });

    // Restore locked funds to available
    await MarketerWalletService.restoreLockedFunds(
      payout.marketerId,
      payout.amountCents
    );

    // Emit event
    await RevenueEventService.emit({
      type: 'PAYOUT_REJECTED',
      entityType: 'payout',
      entityId: payoutId,
      payload: {
        marketerId: payout.marketerId,
        amountCents: payout.amountCents,
        reason,
        rejectedBy
      },
      triggeredBy: rejectedBy
    });

    log.warn('Payout rejected', {
      payoutId,
      reason,
      rejectedBy
    });

    // Email notify marketer (async)
    try {
      const marketer = await prisma.professionalMarketer.findUnique({ where: { id: payout.marketerId } });
      if (marketer?.email) {
        RevenueNotificationService.sendPayoutRejected({
          email: marketer.email,
          name: marketer.name,
          amountCents: payout.amountCents,
          reason,
          payoutId
        }).catch(err => log.error('Failed to send payout rejected email', { error: err }));
      }
    } catch (err) {
      log.error('Error sending rejection email', { error: err });
    }

    return payout;
  }

  /**
   * Process approved payout (execute transfer)
   */
  static async processPayout(payoutId: string) {
    const payout = await prisma.marketerPayout.findUnique({
      where: { id: payoutId },
      include: {
        marketer: true
      }
    });

    if (!payout) {
      throw new Error('Payout not found');
    }

    if (payout.status !== 'APPROVED') {
      throw new Error(`Cannot process payout with status: ${payout.status}`);
    }

    // Update to processing
    await prisma.marketerPayout.update({
      where: { id: payoutId },
      data: {
        status: 'PROCESSING',
        processedAt: new Date()
      }
    });

    // Emit event
    await RevenueEventService.emit({
      type: 'PAYOUT_PROCESSING',
      entityType: 'payout',
      entityId: payoutId,
      payload: {
        marketerId: payout.marketerId,
        amountCents: payout.amountCents,
        method: payout.method
      }
    });

    try {
      let result;

      // Execute transfer based on method
      if (payout.method === 'MTN_MOBILE_MONEY') {
        if (!payout.recipientPhone) {
          throw new Error('Recipient phone required for MTN');
        }
        result = await MoMoService.initiateMTNPayment({
          amountCents: payout.amountCents,
          currency: payout.currency,
          orderId: payout.id,
          orderNumber: `PAYOUT-${payout.id.slice(0,8).toUpperCase()}`,
          customerPhone: payout.recipientPhone,
          customerName: payout.marketer.name,
          provider: 'MTN'
        });
      } else if (payout.method === 'AIRTEL_MONEY') {
        if (!payout.recipientPhone) {
          throw new Error('Recipient phone required for Airtel');
        }
        result = await MoMoService.initiateAirtelPayment({
          amountCents: payout.amountCents,
          currency: payout.currency,
          orderId: payout.id,
          orderNumber: `PAYOUT-${payout.id.slice(0,8).toUpperCase()}`,
          customerPhone: payout.recipientPhone,
          customerName: payout.marketer.name,
          provider: 'AIRTEL'
        });
      } else {
        throw new Error('Bank transfer not yet implemented');
      }

      if (result.success) {
        // Mark as paid
        await this.markPayoutPaid(
          payoutId,
          result.transactionId || undefined
        );
      } else {
        // Mark as failed
        await this.markPayoutFailed(
          payoutId,
          result.error || 'Payment failed'
        );
      }

      return result;
    } catch (error) {
      // Mark as failed
      await this.markPayoutFailed(
        payoutId,
        error instanceof Error ? error.message : 'Unknown error'
      );
      throw error;
    }
  }

  /**
   * Mark payout as paid (internal)
   */
  private static async markPayoutPaid(
    payoutId: string,
    referenceId?: string
  ) {
    const payout = await prisma.marketerPayout.update({
      where: { id: payoutId },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        referenceId
      }
    });

    // Complete payout in wallet (remove from locked)
    await MarketerWalletService.completePayout(
      payout.marketerId,
      payout.amountCents
    );

    // Update risk profile
    await MarketerRiskService.updateRiskOnPayoutSuccess(
      payout.marketerId,
      payout.amountCents
    );

    // Emit event
    await RevenueEventService.emit({
      type: 'PAYOUT_PAID',
      entityType: 'payout',
      entityId: payoutId,
      payload: {
        marketerId: payout.marketerId,
        amountCents: payout.amountCents,
        referenceId
      }
    });

    log.info('Payout completed successfully', {
      payoutId,
      referenceId
    });

    // Email notify marketer (async)
    try {
      const marketer = await prisma.professionalMarketer.findUnique({ where: { id: payout.marketerId } });
      if (marketer?.email) {
        RevenueNotificationService.sendPayoutCompleted({
          email: marketer.email,
          name: marketer.name,
          amountCents: payout.amountCents,
          method: payout.method,
          payoutId,
          transactionId: referenceId
        }).catch(err => log.error('Failed to send payout completed email', { error: err }));
      }
    } catch (err) {
      log.error('Error sending payout completed email', { error: err });
    }

    return payout;
  }

  /**
   * Mark payout as failed (internal)
   */
  private static async markPayoutFailed(
    payoutId: string,
    errorMessage: string
  ) {
    const payout = await prisma.marketerPayout.update({
      where: { id: payoutId },
      data: {
        status: 'FAILED',
        failedAt: new Date(),
        providerResponse: errorMessage
      }
    });

    // Restore locked funds to available
    await MarketerWalletService.restoreLockedFunds(
      payout.marketerId,
      payout.amountCents
    );

    // Create alert
    await RevenueAlertService.createAlert({
      severity: 'WARNING',
      type: 'payout_failed',
      message: `Payout ${payoutId} failed: ${errorMessage}`,
      entityType: 'payout',
      entityId: payoutId,
      metadata: {
        marketerId: payout.marketerId,
        amountCents: payout.amountCents,
        error: errorMessage
      }
    });

    // Emit event
    await RevenueEventService.emit({
      type: 'PAYOUT_FAILED',
      entityType: 'payout',
      entityId: payoutId,
      payload: {
        marketerId: payout.marketerId,
        amountCents: payout.amountCents,
        error: errorMessage
      }
    });

    log.error('Payout failed', {
      payoutId,
      error: errorMessage
    });

    // Email notify marketer (async)
    try {
      const marketer = await prisma.professionalMarketer.findUnique({ where: { id: payout.marketerId } });
      if (marketer?.email) {
        RevenueNotificationService.sendPayoutRejected({
          email: marketer.email,
          name: marketer.name,
          amountCents: payout.amountCents,
          reason: errorMessage,
          payoutId
        }).catch(err => log.error('Failed to send payout failed email', { error: err }));
      }
    } catch (err) {
      log.error('Error sending payout failed email', { error: err });
    }

    return payout;
  }

  /**
   * Get payouts for a marketer
   */
  static async getPayoutsForMarketer(
    marketerId: string,
    params?: {
      status?: 'PENDING' | 'APPROVED' | 'PROCESSING' | 'PAID' | 'FAILED' | 'REJECTED';
      limit?: number;
      offset?: number;
    }
  ) {
    const { status, limit = 50, offset = 0 } = params || {};

    return prisma.marketerPayout.findMany({
      where: {
        marketerId,
        ...(status && { status })
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });
  }

  /**
   * Get pending payouts (for admin queue)
   */
  static async getPendingPayouts(limit: number = 50) {
    return prisma.marketerPayout.findMany({
      where: { status: 'PENDING' },
      include: {
        marketer: {
          include: {
            riskProfile: true
          }
        }
      },
      orderBy: { createdAt: 'asc' },
      take: limit
    });
  }

  /**
   * Get payout stats
   */
  static async getPayoutStats(marketerId?: string) {
    const where = marketerId ? { marketerId } : {};

    const [total, pending, approved, paid, failed] = await Promise.all([
      prisma.marketerPayout.aggregate({
        where,
        _sum: { amountCents: true },
        _count: true
      }),
      prisma.marketerPayout.aggregate({
        where: { ...where, status: 'PENDING' },
        _sum: { amountCents: true },
        _count: true
      }),
      prisma.marketerPayout.aggregate({
        where: { ...where, status: 'APPROVED' },
        _sum: { amountCents: true },
        _count: true
      }),
      prisma.marketerPayout.aggregate({
        where: { ...where, status: 'PAID' },
        _sum: { amountCents: true },
        _count: true
      }),
      prisma.marketerPayout.aggregate({
        where: { ...where, status: 'FAILED' },
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
      approved: {
        amountCents: approved._sum.amountCents || 0,
        count: approved._count
      },
      paid: {
        amountCents: paid._sum.amountCents || 0,
        count: paid._count
      },
      failed: {
        amountCents: failed._sum.amountCents || 0,
        count: failed._count
      }
    };
  }
}
