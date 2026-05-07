/**
 * Digital Tipping Service - Phase 1
 * Customer-optional tipping with round-up suggestions
 */

import { prisma } from '@/lib/prisma';
import { getPlatformFee, FeeType } from './platform-fee.service';

export interface TipSuggestion {
  suggestedAmountCents: number;
  roundUpAmountCents: number;
  originalAmountCents: number;
  tipAmountCents: number;
  enabled: boolean;
}

/**
 * Calculate round-up tip suggestion based on bill amount
 * Logic:
 * - Bills < RWF 5,000 → round to nearest 500
 * - Bills ≥ RWF 5,000 → round to nearest 1,000
 */
export function calculateRoundUpTip(amountCents: number): TipSuggestion {
  const amountRwf = amountCents / 100;

  let roundUpTarget: number;
  
  if (amountRwf < 5000) {
    // Round to nearest 500
    roundUpTarget = Math.ceil(amountRwf / 500) * 500;
  } else {
    // Round to nearest 1,000
    roundUpTarget = Math.ceil(amountRwf / 1000) * 1000;
  }

  const roundUpAmountCents = roundUpTarget * 100;
  const tipAmountCents = roundUpAmountCents - amountCents;

  return {
    suggestedAmountCents: roundUpAmountCents,
    roundUpAmountCents,
    originalAmountCents: amountCents,
    tipAmountCents,
    enabled: tipAmountCents > 0
  };
}

/**
 * Check if business has digital tipping enabled
 */
export async function isDigitalTippingEnabled(businessId: string): Promise<boolean> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      enableDigitalTipping: true
    }
  });

  return business?.enableDigitalTipping || false;
}

/**
 * Create tip record for a sale
 */
export async function createTipForSale(
  saleId: string,
  staffId: string,
  tipAmountCents: number
): Promise<any> {
  // Get sale details
  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    select: {
      businessId: true,
      totalAmountCents: true
    }
  });

  if (!sale) {
    throw new Error('Sale not found');
  }

  // Platform fee: Calculate platform fee using unified fee system (default 2.5%)
  const platformFeePercent = await getPlatformFee(FeeType.DIGITAL_TIPPING_FEE).catch(() => 2.5);
  const platformFeeCents = Math.round(tipAmountCents * (platformFeePercent / 100));
  const netToStaffCents = tipAmountCents - platformFeeCents;

  // Create tip record
  const tip = await prisma.staffTip.create({
    data: {
      saleId,
      staffId,
      businessId: sale.businessId,
      amountCents: tipAmountCents,
      platformFeeCents,
      netToStaffCents,
      status: 'PENDING',
      tipType: 'ROUND_UP'
    }
  });

  return tip;
}

/**
 * Get tip suggestion for a sale
 * Only returns suggestion if business has tipping enabled
 */
export async function getTipSuggestionForSale(
  saleId: string
): Promise<TipSuggestion | null> {
  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    select: {
      totalAmountCents: true,
      businessId: true,
      business: {
        select: {
          enableDigitalTipping: true
        }
      }
    }
  });

  if (!sale) {
    throw new Error('Sale not found');
  }

  // Check if tipping is enabled for this business
  if (!sale.business.enableDigitalTipping) {
    return null;
  }

  // Calculate round-up suggestion
  return calculateRoundUpTip(sale.totalAmountCents);
}

/**
 * Get tip suggestion for split payment
 */
export async function getTipSuggestionForSplitPayment(
  businessId: string,
  amountCents: number
): Promise<TipSuggestion | null> {
  // Check if tipping is enabled
  const enabled = await isDigitalTippingEnabled(businessId);

  if (!enabled) {
    return null;
  }

  // Calculate round-up suggestion
  return calculateRoundUpTip(amountCents);
}

/**
 * Record customer's tip choice (accepted or skipped)
 */
export async function recordTipChoice(
  saleId: string,
  accepted: boolean,
  tipAmountCents?: number,
  staffId?: string
): Promise<void> {
  if (accepted && tipAmountCents && staffId) {
    // Customer accepted tip - create tip record
    await createTipForSale(saleId, staffId, tipAmountCents);
  }

  // Log the choice for analytics (optional)
  // This helps track tip acceptance rates
  await prisma.tipChoice.create({
    data: {
      saleId,
      accepted,
      suggestedAmountCents: tipAmountCents || 0,
      createdAt: new Date()
    }
  });
}
