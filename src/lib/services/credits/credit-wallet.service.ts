/**
 * AI Credit Wallet Service
 * Manages wallet lifecycle: creation, balance queries, monthly allocation renewal.
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { appendLedgerEntry } from './credit-ledger.service';
import { AICreditLedgerEntryType } from '@prisma/client';

const log = logger.child({ service: 'credit-wallet' });

export interface CreditWallet {
  id: string;
  businessId: string;
  balance: number;
  reservedBalance: number;
  monthlyAllocation: number;
  purchasedCredits: number;
  bonusCredits: number;
  lifetimeConsumed: number;
  lifetimePurchased: number;
  lifetimeAllocated: number;
  lastRenewalAt: Date | null;
  nextRenewalAt: Date | null;
  maxBalance: number | null;
}

/** Plan-based monthly credit allocations */
const PLAN_ALLOCATION_MAP: Record<string, number> = {
  FREE: 0,
  STARTER: 0,
  ESSENTIALS: 100,
  PROFESSIONAL: 500,
  GROWTH: 500,
  BUSINESS: 2000,
  PREMIUM: 10000,
  ENTERPRISE: 0, // Configurable — set via admin
};

/**
 * Get or create a credit wallet for a business
 */
export async function getOrCreateWallet(businessId: string): Promise<CreditWallet> {
  let wallet = await prisma.aICreditWallet.findUnique({
    where: { businessId },
  });

  if (!wallet) {
    // Determine allocation from the business's plan
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        plan: { select: { code: true, aiCreditsMonthly: true } },
      },
    });

    const planCode = business?.plan?.code || 'STARTER';
    const planMonthly = business?.plan?.aiCreditsMonthly || 0;
    const monthlyAllocation = planMonthly || PLAN_ALLOCATION_MAP[planCode] || 0;

    const now = new Date();
    const nextRenewal = new Date(now);
    nextRenewal.setMonth(nextRenewal.getMonth() + 1);
    nextRenewal.setDate(1);
    nextRenewal.setHours(0, 0, 0, 0);

    wallet = await prisma.aICreditWallet.create({
      data: {
        businessId,
        balance: monthlyAllocation,
        monthlyAllocation,
        lifetimeAllocated: monthlyAllocation,
        lastRenewalAt: now,
        nextRenewalAt: nextRenewal,
      },
    });

    // Record initial allocation in ledger
    await appendLedgerEntry({
      walletId: wallet.id,
      businessId,
      entryType: AICreditLedgerEntryType.ALLOCATION,
      operation: 'Initial wallet creation',
      credits: monthlyAllocation,
      balanceBefore: 0,
      balanceAfter: monthlyAllocation,
      metadata: { planCode, monthlyAllocation },
    });

    log.info('Credit wallet created', { businessId, monthlyAllocation });
  }

  return toWallet(wallet);
}

/**
 * Get wallet without creating (returns null if not found)
 */
export async function getWallet(businessId: string): Promise<CreditWallet | null> {
  const wallet = await prisma.aICreditWallet.findUnique({
    where: { businessId },
  });
  return wallet ? toWallet(wallet) : null;
}

/**
 * Get the current spendable balance (total minus reserved)
 */
export async function getAvailableBalance(businessId: string): Promise<number> {
  const wallet = await getOrCreateWallet(businessId);
  return wallet.balance - wallet.reservedBalance;
}

/**
 * Renew monthly allocation for a single business.
 * Called by the monthly cron or lazily when credits are checked.
 */
export async function renewMonthlyAllocation(businessId: string): Promise<{ renewed: boolean; creditsGranted: number; newBalance: number }> {
  const wallet = await getOrCreateWallet(businessId);

  // Check if renewal is due
  if (wallet.nextRenewalAt && wallet.nextRenewalAt > new Date()) {
    return { renewed: false, creditsGranted: 0, newBalance: wallet.balance };
  }

  // Get current plan allocation
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      plan: { select: { code: true, aiCreditsMonthly: true } },
    },
  });

  const planCode = business?.plan?.code || 'STARTER';
  const planMonthly = business?.plan?.aiCreditsMonthly || 0;
  const monthlyAllocation = planMonthly || PLAN_ALLOCATION_MAP[planCode] || 0;

  const now = new Date();
  const nextRenewal = new Date(now);
  nextRenewal.setMonth(nextRenewal.getMonth() + 1);
  nextRenewal.setDate(1);
  nextRenewal.setHours(0, 0, 0, 0);

  // Check max balance policy
  const maxBalance = wallet.maxBalance;
  const creditsToGrant = maxBalance !== null
    ? Math.min(monthlyAllocation, Math.max(0, maxBalance - wallet.balance))
    : monthlyAllocation;

  const updated = await prisma.aICreditWallet.update({
    where: { id: wallet.id },
    data: {
      balance: { increment: creditsToGrant },
      monthlyAllocation,
      lastRenewalAt: now,
      nextRenewalAt: nextRenewal,
      lifetimeAllocated: { increment: creditsToGrant },
    },
  });

  if (creditsToGrant > 0) {
    await appendLedgerEntry({
      walletId: wallet.id,
      businessId,
      entryType: AICreditLedgerEntryType.ALLOCATION,
      operation: 'Monthly renewal',
      credits: creditsToGrant,
      balanceBefore: wallet.balance,
      balanceAfter: updated.balance,
      metadata: { planCode, monthlyAllocation, maxBalanceCapped: maxBalance !== null && creditsToGrant < monthlyAllocation },
    });
  }

  log.info('Monthly allocation renewed', { businessId, creditsGranted: creditsToGrant, newBalance: updated.balance });

  return { renewed: true, creditsGranted: creditsToGrant, newBalance: updated.balance };
}

/**
 * Renew allocations for all businesses whose nextRenewalAt has passed.
 * Called by the monthly cron job.
 */
export async function renewAllDueAllocations(): Promise<{ processed: number; totalCreditsGranted: number }> {
  const dueWallets = await prisma.aICreditWallet.findMany({
    where: {
      nextRenewalAt: { lte: new Date() },
    },
    select: { businessId: true },
  });

  let processed = 0;
  let totalCreditsGranted = 0;

  for (const w of dueWallets) {
    try {
      const result = await renewMonthlyAllocation(w.businessId);
      processed++;
      totalCreditsGranted += result.creditsGranted;
    } catch (err: any) {
      log.error('Failed to renew allocation', { businessId: w.businessId, error: err.message });
    }
  }

  log.info('Batch allocation renewal complete', { processed, totalCreditsGranted });
  return { processed, totalCreditsGranted };
}

/**
 * Update wallet balance atomically and record in ledger.
 * Internal use — called by the consumption engine and purchase service.
 */
export async function adjustBalance(
  walletId: string,
  businessId: string,
  delta: number,
  entryType: AICreditLedgerEntryType,
  opts?: {
    feature?: string;
    operation?: string;
    requestId?: string;
    userId?: string;
    aiProvider?: string;
    tokensUsed?: number;
    costUSD?: number;
    metadata?: Record<string, any>;
    idempotencyKey?: string;
    adjustPurchasedCredits?: number;
    adjustBonusCredits?: number;
    adjustLifetimeConsumed?: number;
    adjustLifetimePurchased?: number;
  }
): Promise<{ balanceBefore: number; balanceAfter: number }> {
  // Use a transaction to ensure atomicity
  const result = await prisma.$transaction(async (tx) => {
    const wallet = await tx.aICreditWallet.findUniqueOrThrow({
      where: { id: walletId },
    });

    const balanceBefore = wallet.balance;
    const balanceAfter = balanceBefore + delta;

    if (balanceAfter < 0) {
      throw new Error(`Insufficient credits: balance ${balanceBefore}, delta ${delta}`);
    }

    const updateData: any = { balance: balanceAfter };
    if (opts?.adjustPurchasedCredits) updateData.purchasedCredits = wallet.purchasedCredits + opts.adjustPurchasedCredits;
    if (opts?.adjustBonusCredits) updateData.bonusCredits = wallet.bonusCredits + opts.adjustBonusCredits;
    if (opts?.adjustLifetimeConsumed) updateData.lifetimeConsumed = wallet.lifetimeConsumed + opts.adjustLifetimeConsumed;
    if (opts?.adjustLifetimePurchased) updateData.lifetimePurchased = wallet.lifetimePurchased + opts.adjustLifetimePurchased;

    await tx.aICreditWallet.update({
      where: { id: walletId },
      data: updateData,
    });

    await tx.aICreditLedgerEntry.create({
      data: {
        walletId,
        businessId,
        entryType,
        feature: opts?.feature,
        operation: opts?.operation,
        credits: delta,
        balanceBefore,
        balanceAfter,
        requestId: opts?.requestId,
        userId: opts?.userId,
        aiProvider: opts?.aiProvider,
        tokensUsed: opts?.tokensUsed,
        costUSD: opts?.costUSD,
        metadata: opts?.metadata ? opts.metadata as any : undefined,
        idempotencyKey: opts?.idempotencyKey,
      },
    });

    return { balanceBefore, balanceAfter };
  });

  log.info('Balance adjusted', { walletId, entryType, delta, balanceAfter: result.balanceAfter });
  return result;
}

function toWallet(w: any): CreditWallet {
  return {
    id: w.id,
    businessId: w.businessId,
    balance: w.balance,
    reservedBalance: w.reservedBalance,
    monthlyAllocation: w.monthlyAllocation,
    purchasedCredits: w.purchasedCredits,
    bonusCredits: w.bonusCredits,
    lifetimeConsumed: w.lifetimeConsumed,
    lifetimePurchased: w.lifetimePurchased,
    lifetimeAllocated: w.lifetimeAllocated,
    lastRenewalAt: w.lastRenewalAt,
    nextRenewalAt: w.nextRenewalAt,
    maxBalance: w.maxBalance,
  };
}
