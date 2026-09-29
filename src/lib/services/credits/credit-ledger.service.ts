/**
 * AI Credit Ledger Service
 * Immutable transaction ledger — the single source of truth for all credit movements.
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { AICreditLedgerEntryType } from '@prisma/client';

const log = logger.child({ service: 'credit-ledger' });

export interface LedgerEntryInput {
  walletId: string;
  businessId: string;
  entryType: AICreditLedgerEntryType;
  feature?: string;
  operation?: string;
  credits: number; // Positive for credits in, negative for credits out
  balanceBefore: number;
  balanceAfter: number;
  requestId?: string;
  userId?: string;
  aiProvider?: string;
  tokensUsed?: number;
  costUSD?: number;
  metadata?: Record<string, any>;
  idempotencyKey?: string;
}

export interface LedgerEntry {
  id: string;
  walletId: string;
  businessId: string;
  entryType: AICreditLedgerEntryType;
  feature: string | null;
  operation: string | null;
  credits: number;
  balanceBefore: number;
  balanceAfter: number;
  requestId: string | null;
  userId: string | null;
  aiProvider: string | null;
  tokensUsed: number | null;
  costUSD: number | null;
  metadata: any;
  createdAt: Date;
}

/**
 * Append an entry to the immutable ledger.
 * Uses idempotencyKey to prevent duplicates.
 * Returns null if the entry was already written (idempotent).
 */
export async function appendLedgerEntry(input: LedgerEntryInput): Promise<LedgerEntry | null> {
  // If idempotencyKey is provided, check for existing entry
  if (input.idempotencyKey) {
    const existing = await prisma.aICreditLedgerEntry.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
    });

    if (existing) {
      log.info('Ledger entry already exists (idempotent)', { idempotencyKey: input.idempotencyKey });
      return null;
    }
  }

  const entry = await prisma.aICreditLedgerEntry.create({
    data: {
      walletId: input.walletId,
      businessId: input.businessId,
      entryType: input.entryType,
      feature: input.feature,
      operation: input.operation,
      credits: input.credits,
      balanceBefore: input.balanceBefore,
      balanceAfter: input.balanceAfter,
      requestId: input.requestId,
      userId: input.userId,
      aiProvider: input.aiProvider,
      tokensUsed: input.tokensUsed,
      costUSD: input.costUSD,
      metadata: input.metadata ? input.metadata as any : undefined,
      idempotencyKey: input.idempotencyKey,
    },
  });

  log.info('Ledger entry appended', {
    walletId: input.walletId,
    entryType: input.entryType,
    credits: input.credits,
    balanceAfter: input.balanceAfter,
    feature: input.feature,
  });

  return {
    id: entry.id,
    walletId: entry.walletId,
    businessId: entry.businessId,
    entryType: entry.entryType,
    feature: entry.feature,
    operation: entry.operation,
    credits: entry.credits,
    balanceBefore: entry.balanceBefore,
    balanceAfter: entry.balanceAfter,
    requestId: entry.requestId,
    userId: entry.userId,
    aiProvider: entry.aiProvider,
    tokensUsed: entry.tokensUsed,
    costUSD: entry.costUSD,
    metadata: entry.metadata,
    createdAt: entry.createdAt,
  };
}

/**
 * Get ledger entries for a business with pagination
 */
export async function getBusinessLedger(
  businessId: string,
  opts?: {
    page?: number;
    limit?: number;
    entryType?: AICreditLedgerEntryType;
    feature?: string;
    startDate?: Date;
    endDate?: Date;
  }
): Promise<{ entries: LedgerEntry[]; total: number; page: number; limit: number; pages: number }> {
  const page = opts?.page ?? 1;
  const limit = Math.min(opts?.limit ?? 50, 100);
  const skip = (page - 1) * limit;

  const where: any = { businessId };
  if (opts?.entryType) where.entryType = opts.entryType;
  if (opts?.feature) where.feature = opts.feature;
  if (opts?.startDate || opts?.endDate) {
    where.createdAt = {};
    if (opts?.startDate) where.createdAt.gte = opts.startDate;
    if (opts?.endDate) where.createdAt.lte = opts.endDate;
  }

  const [entries, total] = await Promise.all([
    prisma.aICreditLedgerEntry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.aICreditLedgerEntry.count({ where }),
  ]);

  return {
    entries: entries.map(toLedgerEntry),
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  };
}

/**
 * Get ledger entries for a specific reservation/request
 */
export async function getLedgerByRequestId(requestId: string): Promise<LedgerEntry[]> {
  const entries = await prisma.aICreditLedgerEntry.findMany({
    where: { requestId },
    orderBy: { createdAt: 'asc' },
  });
  return entries.map(toLedgerEntry);
}

/**
 * Search ledger entries across all businesses (admin only)
 */
export async function searchLedger(opts: {
  businessId?: string;
  entryType?: AICreditLedgerEntryType;
  feature?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}): Promise<{ entries: LedgerEntry[]; total: number; page: number; limit: number; pages: number }> {
  const page = opts.page ?? 1;
  const limit = Math.min(opts.limit ?? 50, 100);
  const skip = (page - 1) * limit;

  const where: any = {};
  if (opts.businessId) where.businessId = opts.businessId;
  if (opts.entryType) where.entryType = opts.entryType;
  if (opts.feature) where.feature = opts.feature;
  if (opts.startDate || opts.endDate) {
    where.createdAt = {};
    if (opts.startDate) where.createdAt.gte = opts.startDate;
    if (opts.endDate) where.createdAt.lte = opts.endDate;
  }

  const [entries, total] = await Promise.all([
    prisma.aICreditLedgerEntry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.aICreditLedgerEntry.count({ where }),
  ]);

  return {
    entries: entries.map(toLedgerEntry),
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  };
}

function toLedgerEntry(e: any): LedgerEntry {
  return {
    id: e.id,
    walletId: e.walletId,
    businessId: e.businessId,
    entryType: e.entryType,
    feature: e.feature,
    operation: e.operation,
    credits: e.credits,
    balanceBefore: e.balanceBefore,
    balanceAfter: e.balanceAfter,
    requestId: e.requestId,
    userId: e.userId,
    aiProvider: e.aiProvider,
    tokensUsed: e.tokensUsed,
    costUSD: e.costUSD,
    metadata: e.metadata,
    createdAt: e.createdAt,
  };
}
