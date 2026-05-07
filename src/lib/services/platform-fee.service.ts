/**
 * Unified Platform Fee Management Service
 * Centralizes all platform fee configurations with database-driven management
 */

import { prisma } from '@/lib/prisma';

export enum FeeType {
  BUSINESS_COMMISSION = 'BUSINESS_COMMISSION',
  SUPPLIER_PLATFORM_FEE = 'SUPPLIER_PLATFORM_FEE',
  MARKETPLACE_COMMISSION = 'MARKETPLACE_COMMISSION',
  DIGITAL_PAYMENT_FEE = 'DIGITAL_PAYMENT_FEE',
  SPLIT_PAYMENT_FEE = 'SPLIT_PAYMENT_FEE',
  DIGITAL_TIPPING_FEE = 'DIGITAL_TIPPING_FEE'
}

export interface FeeConfig {
  feeType: FeeType;
  feePercent: number;
  minAmountCents?: number;
  maxAmountCents?: number;
  description?: string;
  effectiveFrom: Date;
  effectiveUntil?: Date;
}

// Default fee values (fallback if database not configured)
const DEFAULT_FEES: Record<FeeType, number> = {
  [FeeType.BUSINESS_COMMISSION]: 5.0,
  [FeeType.SUPPLIER_PLATFORM_FEE]: 7.5,
  [FeeType.MARKETPLACE_COMMISSION]: 7.0,
  [FeeType.DIGITAL_PAYMENT_FEE]: 5.0,
  [FeeType.SPLIT_PAYMENT_FEE]: 1.5,
  [FeeType.DIGITAL_TIPPING_FEE]: 2.5
};

// In-memory cache for fee configurations (1 minute TTL)
const feeCache = new Map<FeeType, { value: number; timestamp: number }>();
const CACHE_TTL = 60 * 1000; // 1 minute

/**
 * Get platform fee percentage for a specific fee type
 * Uses database configuration with fallback to defaults
 */
export async function getPlatformFee(feeType: FeeType): Promise<number> {
  // Check cache first
  const cached = feeCache.get(feeType);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.value;
  }

  try {
    // Query database for active fee configuration
    const config = await prisma.platformFeeConfig.findFirst({
      where: {
        feeType,
        isActive: true,
        effectiveFrom: { lte: new Date() },
        OR: [
          { effectiveUntil: null },
          { effectiveUntil: { gte: new Date() } }
        ]
      },
      select: {
        feePercent: true
      }
    });

    const feePercent = config?.feePercent ?? DEFAULT_FEES[feeType];

    // Update cache
    feeCache.set(feeType, { value: feePercent, timestamp: Date.now() });

    return feePercent;
  } catch (error) {
    console.error(`Error fetching platform fee for ${feeType}:`, error);
    // Fallback to default on error
    return DEFAULT_FEES[feeType];
  }
}

/**
 * Get all active fee configurations
 */
export async function getAllActiveFees(): Promise<FeeConfig[]> {
  const configs = await prisma.platformFeeConfig.findMany({
    where: {
      isActive: true,
      effectiveFrom: { lte: new Date() },
      OR: [
        { effectiveUntil: null },
        { effectiveUntil: { gte: new Date() } }
      ]
    },
    orderBy: {
      feeType: 'asc'
    }
  });

  return configs.map(config => ({
    feeType: config.feeType as FeeType,
    feePercent: config.feePercent,
    minAmountCents: config.minAmountCents ?? undefined,
    maxAmountCents: config.maxAmountCents ?? undefined,
    description: config.description ?? undefined,
    effectiveFrom: config.effectiveFrom,
    effectiveUntil: config.effectiveUntil ?? undefined
  }));
}

/**
 * Get fee configuration with full details
 */
export async function getFeeConfig(feeType: FeeType): Promise<FeeConfig | null> {
  const config = await prisma.platformFeeConfig.findFirst({
    where: {
      feeType,
      isActive: true,
      effectiveFrom: { lte: new Date() },
      OR: [
        { effectiveUntil: null },
        { effectiveUntil: { gte: new Date() } }
      ]
    }
  });

  if (!config) {
    return null;
  }

  return {
    feeType: config.feeType as FeeType,
    feePercent: config.feePercent,
    minAmountCents: config.minAmountCents ?? undefined,
    maxAmountCents: config.maxAmountCents ?? undefined,
    description: config.description ?? undefined,
    effectiveFrom: config.effectiveFrom,
    effectiveUntil: config.effectiveUntil ?? undefined
  };
}

/**
 * Update fee configuration (admin only)
 */
export async function updateFeeConfig(
  feeType: FeeType,
  feePercent: number,
  options?: {
    minAmountCents?: number;
    maxAmountCents?: number;
    description?: string;
    effectiveFrom?: Date;
    effectiveUntil?: Date;
  }
): Promise<void> {
  // Deactivate existing configuration
  await prisma.platformFeeConfig.updateMany({
    where: {
      feeType,
      isActive: true
    },
    data: {
      isActive: false,
      effectiveUntil: new Date()
    }
  });

  // Create new configuration
  await prisma.platformFeeConfig.create({
    data: {
      feeType,
      feePercent,
      minAmountCents: options?.minAmountCents,
      maxAmountCents: options?.maxAmountCents,
      description: options?.description,
      effectiveFrom: options?.effectiveFrom ?? new Date(),
      effectiveUntil: options?.effectiveUntil,
      isActive: true
    }
  });

  // Clear cache for this fee type
  feeCache.delete(feeType);
}

/**
 * Schedule future fee change
 */
export async function scheduleFeeChange(
  feeType: FeeType,
  feePercent: number,
  effectiveFrom: Date,
  options?: {
    minAmountCents?: number;
    maxAmountCents?: number;
    description?: string;
    effectiveUntil?: Date;
  }
): Promise<void> {
  await prisma.platformFeeConfig.create({
    data: {
      feeType,
      feePercent,
      minAmountCents: options?.minAmountCents,
      maxAmountCents: options?.maxAmountCents,
      description: options?.description,
      effectiveFrom,
      effectiveUntil: options?.effectiveUntil,
      isActive: true
    }
  });

  // Clear cache
  feeCache.delete(feeType);
}

/**
 * Get fee history for a specific fee type
 */
export async function getFeeHistory(feeType: FeeType) {
  return await prisma.platformFeeConfig.findMany({
    where: {
      feeType
    },
    orderBy: {
      effectiveFrom: 'desc'
    }
  });
}

/**
 * Initialize default fee configurations (run once on setup)
 */
export async function initializeDefaultFees(): Promise<void> {
  const feeDescriptions: Record<FeeType, string> = {
    [FeeType.BUSINESS_COMMISSION]: 'Platform commission on restaurant revenue (deducted at payout)',
    [FeeType.SUPPLIER_PLATFORM_FEE]: 'Platform fee on supplier payouts',
    [FeeType.MARKETPLACE_COMMISSION]: 'Default marketplace seller commission',
    [FeeType.DIGITAL_PAYMENT_FEE]: 'Customer digital payment convenience fee',
    [FeeType.SPLIT_PAYMENT_FEE]: 'Split bill convenience fee (configurable per business)',
    [FeeType.DIGITAL_TIPPING_FEE]: 'Platform fee on digital tips'
  };

  for (const [feeType, defaultPercent] of Object.entries(DEFAULT_FEES)) {
    // Check if fee already exists
    const existing = await prisma.platformFeeConfig.findFirst({
      where: {
        feeType,
        isActive: true
      }
    });

    if (!existing) {
      await prisma.platformFeeConfig.create({
        data: {
          feeType,
          feePercent: defaultPercent,
          description: feeDescriptions[feeType as FeeType],
          isActive: true
        }
      });
    }
  }

  console.log('Default fee configurations initialized');
}

/**
 * Clear fee cache (useful after updates)
 */
export function clearFeeCache(): void {
  feeCache.clear();
}

/**
 * Calculate fee amount in cents
 */
export function calculateFeeAmount(
  amountCents: number,
  feePercent: number,
  minCents?: number,
  maxCents?: number
): number {
  let feeAmount = Math.round((amountCents * feePercent) / 100);

  if (minCents !== undefined) {
    feeAmount = Math.max(feeAmount, minCents);
  }

  if (maxCents !== undefined) {
    feeAmount = Math.min(feeAmount, maxCents);
  }

  return feeAmount;
}
