/**
 * AI Credit Purchase Service
 * Handles credit package purchases and fulfillment.
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { getOrCreateWallet, adjustBalance } from './credit-wallet.service';
import { AICreditLedgerEntryType } from '@prisma/client';

const log = logger.child({ service: 'credit-purchase' });

export interface CreditPackage {
  id: string;
  code: string;
  name: string;
  description: string | null;
  credits: number;
  priceCents: number;
  currency: string;
  bonusCredits: number;
  isActive: boolean;
  sortOrder: number;
}

/** Default credit packages */
const DEFAULT_PACKAGES: Array<{
  code: string;
  name: string;
  description: string;
  credits: number;
  priceCents: number;
  bonusCredits: number;
  sortOrder: number;
}> = [
  { code: 'pack_500', name: '500 Credits', description: '500 AI credits', credits: 500, priceCents: 500000, bonusCredits: 0, sortOrder: 1 },
  { code: 'pack_2000', name: '2,000 Credits', description: '2,000 AI credits — most popular', credits: 2000, priceCents: 1800000, bonusCredits: 100, sortOrder: 2 },
  { code: 'pack_5000', name: '5,000 Credits', description: '5,000 AI credits — best value', credits: 5000, priceCents: 4000000, bonusCredits: 500, sortOrder: 3 },
  { code: 'pack_10000', name: '10,000 Credits', description: '10,000 AI credits for heavy usage', credits: 10000, priceCents: 7500000, bonusCredits: 1500, sortOrder: 4 },
];

/**
 * Seed default credit packages
 */
export async function seedDefaultPackages(): Promise<void> {
  for (const pkg of DEFAULT_PACKAGES) {
    await prisma.aICreditPackage.upsert({
      where: { code: pkg.code },
      create: { ...pkg, currency: 'RWF', isActive: true },
      update: {},
    });
  }
  log.info('Default credit packages seeded', { count: DEFAULT_PACKAGES.length });
}

/**
 * Get all active credit packages
 */
export async function getActivePackages(): Promise<CreditPackage[]> {
  const records = await prisma.aICreditPackage.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });

  return records.map(toPackage);
}

/**
 * Get a specific package by code
 */
export async function getPackageByCode(code: string): Promise<CreditPackage | null> {
  const record = await prisma.aICreditPackage.findUnique({
    where: { code },
  });
  return record ? toPackage(record) : null;
}

/**
 * Fulfill a credit purchase after payment is confirmed.
 * Called by the payment success webhook.
 * Idempotent — safe to call multiple times with the same transactionId.
 */
export async function fulfillPurchase(
  businessId: string,
  packageCode: string,
  paymentTransactionId: string
): Promise<{ creditsGranted: number; bonusGranted: number; newBalance: number }> {
  // Idempotency check — if we've already fulfilled this purchase, skip
  const idempotencyKey = `purchase_${paymentTransactionId}`;
  const existing = await prisma.aICreditLedgerEntry.findUnique({
    where: { idempotencyKey },
  });

  if (existing) {
    log.info('Purchase already fulfilled (idempotent)', { paymentTransactionId });
    return { creditsGranted: 0, bonusGranted: 0, newBalance: existing.balanceAfter };
  }

  const pkg = await getPackageByCode(packageCode);
  if (!pkg) {
    throw new Error(`Credit package not found: ${packageCode}`);
  }

  const wallet = await getOrCreateWallet(businessId);
  const totalCredits = pkg.credits + pkg.bonusCredits;

  const result = await adjustBalance(wallet.id, businessId, totalCredits, AICreditLedgerEntryType.PURCHASE, {
    operation: `Purchased ${pkg.name}`,
    requestId: paymentTransactionId,
    metadata: {
      packageCode,
      packageName: pkg.name,
      credits: pkg.credits,
      bonusCredits: pkg.bonusCredits,
      priceCents: pkg.priceCents,
      paymentTransactionId,
    },
    idempotencyKey,
    adjustPurchasedCredits: pkg.credits,
    adjustBonusCredits: pkg.bonusCredits,
    adjustLifetimePurchased: pkg.credits,
  });

  log.info('Credit purchase fulfilled', {
    businessId,
    packageCode,
    credits: pkg.credits,
    bonusCredits: pkg.bonusCredits,
    newBalance: result.balanceAfter,
  });

  return {
    creditsGranted: pkg.credits,
    bonusGranted: pkg.bonusCredits,
    newBalance: result.balanceAfter,
  };
}

/**
 * Grant bonus credits (admin or promotional)
 */
export async function grantBonusCredits(
  businessId: string,
  credits: number,
  reason: string,
  opts?: { userId?: string; idempotencyKey?: string }
): Promise<{ newBalance: number }> {
  const wallet = await getOrCreateWallet(businessId);

  const result = await adjustBalance(wallet.id, businessId, credits, AICreditLedgerEntryType.BONUS, {
    operation: reason,
    userId: opts?.userId,
    metadata: { reason, type: 'bonus' },
    idempotencyKey: opts?.idempotencyKey,
    adjustBonusCredits: credits,
  });

  log.info('Bonus credits granted', { businessId, credits, reason, newBalance: result.balanceAfter });

  return { newBalance: result.balanceAfter };
}

/**
 * Revoke credits (admin adjustment)
 */
export async function revokeCredits(
  businessId: string,
  credits: number,
  reason: string,
  opts?: { userId?: string; idempotencyKey?: string }
): Promise<{ newBalance: number }> {
  const wallet = await getOrCreateWallet(businessId);

  if (wallet.balance < credits) {
    throw new Error(`Cannot revoke ${credits} credits: balance is only ${wallet.balance}`);
  }

  const result = await adjustBalance(wallet.id, businessId, -credits, AICreditLedgerEntryType.ADJUSTMENT, {
    operation: reason,
    userId: opts?.userId,
    metadata: { reason, type: 'revocation' },
    idempotencyKey: opts?.idempotencyKey,
  });

  log.info('Credits revoked', { businessId, credits, reason, newBalance: result.balanceAfter });

  return { newBalance: result.balanceAfter };
}

function toPackage(p: any): CreditPackage {
  return {
    id: p.id,
    code: p.code,
    name: p.name,
    description: p.description,
    credits: p.credits,
    priceCents: p.priceCents,
    currency: p.currency,
    bonusCredits: p.bonusCredits,
    isActive: p.isActive,
    sortOrder: p.sortOrder,
  };
}
