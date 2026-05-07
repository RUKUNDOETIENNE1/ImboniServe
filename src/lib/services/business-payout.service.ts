/**
 * Business Payout Service
 * Handles commission calculation and payout logic for businesses
 */

import { prisma } from '@/lib/prisma';
import { getPlatformFee, FeeType } from './platform-fee.service';

const PLATFORM_COMMISSION_PERCENT = 5.0; // Fallback default

export interface PayoutCalculation {
  grossAmountCents: number;
  platformCommissionCents: number;
  netPayoutCents: number;
  commissionPercent: number;
}

/**
 * Calculate business payout with platform commission
 * Uses unified fee management system with fallback to 5% default
 */
export async function calculateBusinessPayout(
  grossAmountCents: number
): Promise<PayoutCalculation> {
  // Get commission rate from unified fee system
  const commissionPercent = await getPlatformFee(FeeType.BUSINESS_COMMISSION).catch(() => PLATFORM_COMMISSION_PERCENT);
  
  const platformCommissionCents = Math.round(grossAmountCents * (commissionPercent / 100));
  const netPayoutCents = grossAmountCents - platformCommissionCents;

  return {
    grossAmountCents,
    platformCommissionCents,
    netPayoutCents,
    commissionPercent
  };
}

/**
 * Get business payout summary for a date range
 */
export async function getBusinessPayoutSummary(
  businessId: string,
  startDate: Date,
  endDate: Date
) {
  const sales = await prisma.sale.findMany({
    where: {
      businessId,
      isPaid: true,
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    select: {
      id: true,
      orderNumber: true,
      totalAmountCents: true,
      createdAt: true,
      paymentMethod: true
    }
  });

  let totalGrossCents = 0;
  let totalCommissionCents = 0;
  let totalNetPayoutCents = 0;

  const salesWithPayout = await Promise.all(sales.map(async sale => {
    const payout = await calculateBusinessPayout(sale.totalAmountCents);
    totalGrossCents += payout.grossAmountCents;
    totalCommissionCents += payout.platformCommissionCents;
    totalNetPayoutCents += payout.netPayoutCents;

    return {
      ...sale,
      payout
    };
  }));

  const commissionPercent = salesWithPayout.length > 0 
    ? salesWithPayout[0].payout.commissionPercent 
    : await getPlatformFee(FeeType.BUSINESS_COMMISSION).catch(() => PLATFORM_COMMISSION_PERCENT);

  return {
    sales: salesWithPayout,
    summary: {
      totalGrossCents,
      totalCommissionCents,
      totalNetPayoutCents,
      commissionPercent,
      salesCount: sales.length
    }
  };
}

/**
 * Calculate net payout for a single sale
 */
export async function calculateSaleNetPayout(totalAmountCents: number): Promise<number> {
  const payout = await calculateBusinessPayout(totalAmountCents);
  return payout.netPayoutCents;
}
