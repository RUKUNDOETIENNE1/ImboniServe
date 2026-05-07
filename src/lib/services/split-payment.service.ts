/**
 * Split Payment Service
 * Handles split bill payments with optional convenience fee
 */

import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export interface SplitPaymentItem {
  saleItemId: string;
  quantity: number;
  payerName?: string;
  payerPhone?: string;
  payerEmail?: string;
}

export interface SplitPaymentPricing {
  itemSubtotalCents: number;
  convenienceFeeCents: number;
  vatCents: number;
  totalCents: number;
  convenienceFeePercent: number;
  convenienceFeeEnabled: boolean;
  taxMode: 'INCLUSIVE' | 'EXCLUSIVE';
  taxRate: number;
}

/**
 * Calculate split payment pricing with optional convenience fee
 */
export async function calculateSplitPaymentPricing(
  businessId: string,
  items: SplitPaymentItem[]
): Promise<SplitPaymentPricing> {
  // Fetch business configuration
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      splitPaymentConvenienceFeeEnabled: true,
      splitPaymentConvenienceFeePercent: true,
      taxMode: true,
      taxRate: true
    }
  });

  if (!business) {
    throw new Error('Business not found');
  }

  // Calculate item subtotal
  const saleItemIds = items.map(item => item.saleItemId);
  const saleItems = await prisma.saleItem.findMany({
    where: {
      id: { in: saleItemIds }
    },
    select: {
      id: true,
      unitPriceCents: true,
      quantity: true
    }
  });

  let itemSubtotalCents = 0;
  for (const item of items) {
    const saleItem = saleItems.find(si => si.id === item.saleItemId);
    if (!saleItem) {
      throw new Error(`Sale item ${item.saleItemId} not found`);
    }
    
    // Calculate proportional price based on quantity
    const pricePerUnit = Math.round(saleItem.unitPriceCents);
    itemSubtotalCents += pricePerUnit * item.quantity;
  }

  // Calculate convenience fee (only if enabled)
  const convenienceFeeCents = business.splitPaymentConvenienceFeeEnabled
    ? Math.round(itemSubtotalCents * (business.splitPaymentConvenienceFeePercent / 100))
    : 0;

  // Calculate VAT based on tax mode
  let vatCents: number;
  let totalCents: number;
  
  if (business.taxMode === 'INCLUSIVE') {
    // Menu prices already include VAT
    // Extract VAT from item subtotal
    const itemsWithConvenienceCents = itemSubtotalCents + convenienceFeeCents;
    vatCents = Math.round(itemsWithConvenienceCents * (business.taxRate / (100 + business.taxRate)));
    totalCents = itemsWithConvenienceCents;
  } else {
    // EXCLUSIVE: Add VAT on top
    vatCents = Math.round(itemSubtotalCents * (business.taxRate / 100));
    totalCents = itemSubtotalCents + convenienceFeeCents + vatCents;
  }

  return {
    itemSubtotalCents,
    convenienceFeeCents,
    vatCents,
    totalCents,
    convenienceFeePercent: business.splitPaymentConvenienceFeePercent,
    convenienceFeeEnabled: business.splitPaymentConvenienceFeeEnabled,
    taxMode: business.taxMode,
    taxRate: business.taxRate
  };
}

/**
 * Create split payment record
 */
export async function createSplitPayment(
  saleId: string,
  items: SplitPaymentItem[],
  pricing: SplitPaymentPricing,
  db: Prisma.TransactionClient | typeof prisma = prisma
) {
  // Extract payer info from first item (all should have same payer)
  const payerInfo = items[0];

  const salePayment = await db.salePayment.create({
    data: {
      saleId,
      payerName: payerInfo.payerName,
      payerPhone: payerInfo.payerPhone,
      payerEmail: payerInfo.payerEmail,
      amountCents: pricing.totalCents,
      itemIds: items.map(item => item.saleItemId),
      status: 'PENDING'
    }
  });

  return salePayment;
}

/**
 * Get split payment summary for a sale with progress indicator
 */
export async function getSplitPaymentSummary(saleId: string) {
  const salePayments = await prisma.salePayment.findMany({
    where: { saleId },
    include: {
      paymentTransaction: true
    }
  });

  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    select: {
      totalAmountCents: true,
      businessId: true,
      table: {
        select: {
          id: true,
          number: true
        }
      }
    }
  });

  if (!sale) {
    throw new Error('Sale not found');
  }

  const totalPaidCents = salePayments
    .filter(sp => sp.status === 'PAID')
    .reduce((sum, sp) => sum + sp.amountCents, 0);

  const totalPendingCents = salePayments
    .filter(sp => sp.status === 'PENDING')
    .reduce((sum, sp) => sum + sp.amountCents, 0);

  const remainingCents = sale.totalAmountCents - totalPaidCents;

  // Progress indicator data
  const paidPayerCount = salePayments.filter(sp => sp.status === 'PAID').length;
  const totalPayerCount = salePayments.length;
  const progressPercent = totalPayerCount > 0 
    ? Math.round((paidPayerCount / totalPayerCount) * 100)
    : 0;

  return {
    salePayments,
    summary: {
      totalAmountCents: sale.totalAmountCents,
      totalPaidCents,
      totalPendingCents,
      remainingCents,
      paymentCount: salePayments.length,
      fullyPaid: remainingCents <= 0,
      // Progress indicator
      paidPayerCount,
      totalPayerCount,
      progressPercent
    },
    tableInfo: sale.table
  };
}
