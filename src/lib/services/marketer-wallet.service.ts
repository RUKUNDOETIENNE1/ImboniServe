/**
 * Marketer Wallet Service
 * Manages marketer financial balances
 * ISOLATED from DiningCredit system
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { RevenueEventService } from './revenue-event.service';

const log = logger.child({ service: 'marketer-wallet' });

export class MarketerWalletService {
  /**
   * Get wallet for marketer
   */
  static async getWallet(marketerId: string) {
    return prisma.marketerWallet.findUnique({
      where: { marketerId }
    });
  }

  /**
   * Add to pending balance (when commission is created)
   */
  static async addToPending(
    marketerId: string,
    amountCents: number,
    description: string
  ) {
    const wallet = await prisma.marketerWallet.update({
      where: { marketerId },
      data: {
        pendingBalance: { increment: amountCents },
        totalEarned: { increment: amountCents }
      }
    });

    await RevenueEventService.emit({
      type: 'WALLET_UPDATED',
      entityType: 'wallet',
      entityId: wallet.id,
      payload: {
        marketerId,
        action: 'add_to_pending',
        amountCents,
        description,
        newPendingBalance: wallet.pendingBalance
      }
    });

    log.info('Added to pending balance', {
      marketerId,
      amountCents,
      newPendingBalance: wallet.pendingBalance
    });

    return wallet;
  }

  /**
   * Move from pending to available (after validation period)
   */
  static async validatePending(
    marketerId: string,
    amountCents: number,
    description: string
  ) {
    const wallet = await prisma.marketerWallet.update({
      where: { marketerId },
      data: {
        pendingBalance: { decrement: amountCents },
        availableBalance: { increment: amountCents }
      }
    });

    await RevenueEventService.emit({
      type: 'WALLET_UPDATED',
      entityType: 'wallet',
      entityId: wallet.id,
      payload: {
        marketerId,
        action: 'validate_pending',
        amountCents,
        description,
        newAvailableBalance: wallet.availableBalance
      }
    });

    log.info('Validated pending balance', {
      marketerId,
      amountCents,
      newAvailableBalance: wallet.availableBalance
    });

    return wallet;
  }

  /**
   * Lock funds for payout
   */
  static async lockForPayout(
    marketerId: string,
    amountCents: number
  ) {
    // Check available balance
    const wallet = await this.getWallet(marketerId);
    if (!wallet || wallet.availableBalance < amountCents) {
      throw new Error('Insufficient available balance');
    }

    const updatedWallet = await prisma.marketerWallet.update({
      where: { marketerId },
      data: {
        availableBalance: { decrement: amountCents },
        lockedBalance: { increment: amountCents }
      }
    });

    await RevenueEventService.emit({
      type: 'WALLET_UPDATED',
      entityType: 'wallet',
      entityId: updatedWallet.id,
      payload: {
        marketerId,
        action: 'lock_for_payout',
        amountCents,
        newLockedBalance: updatedWallet.lockedBalance
      }
    });

    log.info('Locked funds for payout', {
      marketerId,
      amountCents,
      newLockedBalance: updatedWallet.lockedBalance
    });

    return updatedWallet;
  }

  /**
   * Complete payout (remove from locked)
   */
  static async completePayout(
    marketerId: string,
    amountCents: number
  ) {
    const wallet = await prisma.marketerWallet.update({
      where: { marketerId },
      data: {
        lockedBalance: { decrement: amountCents },
        totalPaidOut: { increment: amountCents }
      }
    });

    await RevenueEventService.emit({
      type: 'WALLET_UPDATED',
      entityType: 'wallet',
      entityId: wallet.id,
      payload: {
        marketerId,
        action: 'complete_payout',
        amountCents,
        newTotalPaidOut: wallet.totalPaidOut
      }
    });

    log.info('Completed payout', {
      marketerId,
      amountCents,
      newTotalPaidOut: wallet.totalPaidOut
    });

    return wallet;
  }

  /**
   * Restore locked funds (payout failed)
   */
  static async restoreLockedFunds(
    marketerId: string,
    amountCents: number
  ) {
    const wallet = await prisma.marketerWallet.update({
      where: { marketerId },
      data: {
        lockedBalance: { decrement: amountCents },
        availableBalance: { increment: amountCents }
      }
    });

    await RevenueEventService.emit({
      type: 'WALLET_UPDATED',
      entityType: 'wallet',
      entityId: wallet.id,
      payload: {
        marketerId,
        action: 'restore_locked',
        amountCents,
        newAvailableBalance: wallet.availableBalance
      }
    });

    log.warn('Restored locked funds after payout failure', {
      marketerId,
      amountCents
    });

    return wallet;
  }

  /**
   * Get wallet balance summary
   */
  static async getBalanceSummary(marketerId: string) {
    const wallet = await this.getWallet(marketerId);
    if (!wallet) {
      return null;
    }

    return {
      availableBalance: wallet.availableBalance,
      pendingBalance: wallet.pendingBalance,
      lockedBalance: wallet.lockedBalance,
      totalEarned: wallet.totalEarned,
      totalPaidOut: wallet.totalPaidOut,
      netBalance: wallet.availableBalance + wallet.pendingBalance + wallet.lockedBalance
    };
  }
}
