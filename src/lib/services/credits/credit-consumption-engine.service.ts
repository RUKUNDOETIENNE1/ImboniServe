/**
 * AI Credit Consumption Engine
 * Implements the full lifecycle: check → reserve → execute → commit/release.
 * Failed AI operations NEVER consume credits.
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { getOrCreateWallet, adjustBalance } from './credit-wallet.service';
import { getFeatureCost } from './feature-cost-registry.service';
import { AICreditLedgerEntryType, AICreditReservationStatus } from '@prisma/client';

const log = logger.child({ service: 'credit-consumption-engine' });

const RESERVATION_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

export interface CreditCheckResult {
  allowed: boolean;
  creditsAvailable: number;
  creditsRequired: number;
  creditsRemaining: number;
  message?: string;
}

export interface ReservationResult {
  reservationId: string;
  requestId: string;
  creditsReserved: number;
  expiresAt: Date;
}

export interface ConsumeResult {
  success: boolean;
  creditsConsumed: number;
  balanceAfter: number;
  reservationId: string;
  requestId: string;
}

/**
 * Step 1: Check if business has sufficient credits for a feature.
 */
export async function checkCredits(
  businessId: string,
  featureKey: string,
  overrideCost?: number
): Promise<CreditCheckResult> {
  const wallet = await getOrCreateWallet(businessId);
  const creditsRequired = overrideCost ?? await getFeatureCost(featureKey);
  const creditsAvailable = wallet.balance - wallet.reservedBalance;

  const allowed = creditsAvailable >= creditsRequired;

  return {
    allowed,
    creditsAvailable,
    creditsRequired,
    creditsRemaining: allowed ? creditsAvailable - creditsRequired : creditsAvailable,
    message: allowed
      ? undefined
      : `Insufficient AI credits. You need ${creditsRequired} credits but have ${creditsAvailable} available.`,
  };
}

/**
 * Step 2: Reserve credits for an upcoming AI operation.
 * Creates a PENDING reservation and increments reservedBalance.
 * Use the returned requestId as the idempotency key for the entire operation.
 */
export async function reserveCredits(
  businessId: string,
  featureKey: string,
  opts?: { userId?: string; operation?: string; overrideCost?: number; metadata?: Record<string, any> }
): Promise<ReservationResult> {
  const wallet = await getOrCreateWallet(businessId);
  const creditsRequired = opts?.overrideCost ?? await getFeatureCost(featureKey);
  const available = wallet.balance - wallet.reservedBalance;

  if (available < creditsRequired) {
    throw new Error(`Insufficient credits: need ${creditsRequired}, available ${available}`);
  }

  const requestId = `req_${featureKey}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const expiresAt = new Date(Date.now() + RESERVATION_TIMEOUT_MS);

  const reservation = await prisma.aICreditReservation.create({
    data: {
      walletId: wallet.id,
      businessId,
      feature: featureKey,
      operation: opts?.operation,
      creditsReserved: creditsRequired,
      status: AICreditReservationStatus.PENDING,
      requestId,
      userId: opts?.userId,
      expiresAt,
      metadata: opts?.metadata ? opts.metadata as any : undefined,
    },
  });

  // Increment reservedBalance
  await prisma.aICreditWallet.update({
    where: { id: wallet.id },
    data: { reservedBalance: { increment: creditsRequired } },
  });

  // Record reservation in ledger
  await adjustBalance(wallet.id, businessId, 0, AICreditLedgerEntryType.RESERVATION, {
    feature: featureKey,
    operation: opts?.operation,
    requestId,
    userId: opts?.userId,
    metadata: { reservationId: reservation.id, creditsReserved: creditsRequired, expiresAt: expiresAt.toISOString() },
    idempotencyKey: `reserve_${requestId}`,
  });

  log.info('Credits reserved', { businessId, featureKey, creditsRequired, requestId });

  return {
    reservationId: reservation.id,
    requestId,
    creditsReserved: creditsRequired,
    expiresAt,
  };
}

/**
 * Step 3a: Commit a reservation after successful AI operation.
 * Deducts credits from balance, decrements reservedBalance, records consumption.
 */
export async function commitReservation(
  requestId: string,
  opts?: {
    tokensUsed?: number;
    costUSD?: number;
    aiProvider?: string;
    metadata?: Record<string, any>;
    actualCost?: number; // For dynamic features — overrides reserved amount
  }
): Promise<ConsumeResult> {
  const reservation = await prisma.aICreditReservation.findUnique({
    where: { requestId },
    include: { wallet: true },
  });

  if (!reservation) {
    throw new Error(`Reservation not found: ${requestId}`);
  }

  if (reservation.status === AICreditReservationStatus.COMMITTED) {
    log.info('Reservation already committed (idempotent)', { requestId });
    return {
      success: true,
      creditsConsumed: reservation.creditsReserved,
      balanceAfter: reservation.wallet.balance,
      reservationId: reservation.id,
      requestId,
    };
  }

  if (reservation.status === AICreditReservationStatus.RELEASED) {
    throw new Error(`Cannot commit released reservation: ${requestId}`);
  }

  if (reservation.status === AICreditReservationStatus.EXPIRED) {
    throw new Error(`Cannot commit expired reservation: ${requestId}`);
  }

  const creditsToConsume = opts?.actualCost ?? reservation.creditsReserved;
  const wallet = reservation.wallet;

  // Use transaction for atomic commit
  await prisma.$transaction(async (tx) => {
    // 1. Update reservation status
    await tx.aICreditReservation.update({
      where: { id: reservation.id },
      data: {
        status: AICreditReservationStatus.COMMITTED,
        committedAt: new Date(),
      },
    });

    // 2. Deduct from balance and reservedBalance
    await tx.aICreditWallet.update({
      where: { id: wallet.id },
      data: {
        balance: { decrement: creditsToConsume },
        reservedBalance: { decrement: reservation.creditsReserved },
        lifetimeConsumed: { increment: creditsToConsume },
      },
    });

    // 3. Record consumption in ledger
    await tx.aICreditLedgerEntry.create({
      data: {
        walletId: wallet.id,
        businessId: reservation.businessId,
        entryType: AICreditLedgerEntryType.CONSUMPTION,
        feature: reservation.feature,
        operation: reservation.operation,
        credits: -creditsToConsume,
        balanceBefore: wallet.balance,
        balanceAfter: wallet.balance - creditsToConsume,
        requestId,
        userId: reservation.userId,
        aiProvider: opts?.aiProvider,
        tokensUsed: opts?.tokensUsed,
        costUSD: opts?.costUSD,
        metadata: opts?.metadata ? opts.metadata as any : undefined,
        idempotencyKey: `commit_${requestId}`,
      },
    });
  });

  const updatedWallet = await prisma.aICreditWallet.findUniqueOrThrow({ where: { id: wallet.id } });

  log.info('Reservation committed', {
    requestId,
    feature: reservation.feature,
    creditsConsumed: creditsToConsume,
    balanceAfter: updatedWallet.balance,
  });

  return {
    success: true,
    creditsConsumed: creditsToConsume,
    balanceAfter: updatedWallet.balance,
    reservationId: reservation.id,
    requestId,
  };
}

/**
 * Step 3b: Release a reservation after a failed AI operation.
 * Credits are returned — NO deduction occurs.
 */
export async function releaseReservation(
  requestId: string,
  reason?: string
): Promise<{ released: boolean; creditsReturned: number }> {
  const reservation = await prisma.aICreditReservation.findUnique({
    where: { requestId },
    include: { wallet: true },
  });

  if (!reservation) {
    log.warn('Reservation not found for release', { requestId });
    return { released: false, creditsReturned: 0 };
  }

  if (reservation.status === AICreditReservationStatus.RELEASED) {
    log.info('Reservation already released (idempotent)', { requestId });
    return { released: true, creditsReturned: reservation.creditsReserved };
  }

  if (reservation.status === AICreditReservationStatus.COMMITTED) {
    log.warn('Cannot release committed reservation', { requestId });
    return { released: false, creditsReturned: 0 };
  }

  const wallet = reservation.wallet;

  await prisma.$transaction(async (tx) => {
    // 1. Update reservation status
    await tx.aICreditReservation.update({
      where: { id: reservation.id },
      data: {
        status: AICreditReservationStatus.RELEASED,
        releasedAt: new Date(),
      },
    });

    // 2. Decrement reservedBalance (credits go back to available)
    await tx.aICreditWallet.update({
      where: { id: wallet.id },
      data: {
        reservedBalance: { decrement: reservation.creditsReserved },
      },
    });

    // 3. Record release in ledger (no balance change — just reserved → available)
    await tx.aICreditLedgerEntry.create({
      data: {
        walletId: wallet.id,
        businessId: reservation.businessId,
        entryType: AICreditLedgerEntryType.RESERVATION_RELEASE,
        feature: reservation.feature,
        operation: reservation.operation,
        credits: 0,
        balanceBefore: wallet.balance,
        balanceAfter: wallet.balance,
        requestId,
        userId: reservation.userId,
        metadata: { reason: reason || 'AI operation failed', reservationId: reservation.id } as any,
        idempotencyKey: `release_${requestId}`,
      },
    });
  });

  log.info('Reservation released', { requestId, reason, creditsReturned: reservation.creditsReserved });

  return { released: true, creditsReturned: reservation.creditsReserved };
}

/**
 * Expire stale reservations that have timed out.
 * Called periodically to clean up abandoned reservations.
 */
export async function expireStaleReservations(): Promise<{ expired: number }> {
  const stale = await prisma.aICreditReservation.findMany({
    where: {
      status: AICreditReservationStatus.PENDING,
      expiresAt: { lt: new Date() },
    },
    select: { requestId: true },
  });

  let expired = 0;
  for (const r of stale) {
    try {
      await releaseReservation(r.requestId, 'Reservation expired (timeout)');
      expired++;
    } catch (err: any) {
      log.error('Failed to expire reservation', { requestId: r.requestId, error: err.message });
    }
  }

  if (expired > 0) {
    log.info('Stale reservations expired', { count: expired });
  }

  return { expired };
}

/**
 * High-level convenience: check + reserve + execute + commit/release.
 * Wraps the full lifecycle so AI features only need one call.
 *
 * Usage:
 *   const result = await executeWithCredits(businessId, 'scanner', async () => {
 *     return await callOpenAI(...);
 *   });
 */
export async function executeWithCredits<T>(
  businessId: string,
  featureKey: string,
  operation: () => Promise<T>,
  opts?: {
    userId?: string;
    operationName?: string;
    metadata?: Record<string, any>;
    overrideCost?: number;
  }
): Promise<{ result: T; creditsConsumed: number; balanceAfter: number; requestId: string }> {
  // Step 1: Check credits
  const check = await checkCredits(businessId, featureKey, opts?.overrideCost);
  if (!check.allowed) {
    throw new InsufficientCreditsError(check.creditsRequired, check.creditsAvailable);
  }

  // Step 2: Reserve credits
  const reservation = await reserveCredits(businessId, featureKey, {
    userId: opts?.userId,
    operation: opts?.operationName,
    overrideCost: opts?.overrideCost,
    metadata: opts?.metadata,
  });

  try {
    // Step 3: Execute the AI operation
    const result = await operation();

    // Step 4a: Commit — credits are deducted
    const commitResult = await commitReservation(reservation.requestId, {
      metadata: opts?.metadata,
    });

    return {
      result,
      creditsConsumed: commitResult.creditsConsumed,
      balanceAfter: commitResult.balanceAfter,
      requestId: reservation.requestId,
    };
  } catch (error) {
    // Step 4b: Release — credits are returned, NO deduction
    await releaseReservation(reservation.requestId, `AI operation failed: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

/**
 * Custom error for insufficient credits
 */
export class InsufficientCreditsError extends Error {
  constructor(
    public creditsRequired: number,
    public creditsAvailable: number
  ) {
    super(`Insufficient AI credits. Need ${creditsRequired}, have ${creditsAvailable}.`);
    this.name = 'InsufficientCreditsError';
  }
}
