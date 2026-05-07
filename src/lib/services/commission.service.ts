/**
 * Marketplace Commission Service
 * Handles seller commission calculations and WHT processing
 */

import { prisma } from '@/lib/prisma';
import { calculateMarketplaceCommission, formatRWF } from '@/lib/pricing/fee-calculator';
import { formatDateTimeRW } from '@/utils/datetimeRW';
import { CommissionTier } from '@/lib/pricing/fee-config';

export interface CommissionInvoice {
  id: string;
  sellerId: string;
  orderId: string;
  grossAmount: number;
  commissionPercent: number;
  commissionAmount: number;
  commissionVAT: number;
  totalCommission: number;
  whtAmount: number;
  whtApplied: boolean;
  netToSeller: number;
  tier: CommissionTier;
  status: 'pending' | 'paid' | 'disputed';
  createdAt: Date;
  paidAt?: Date;
}

/**
 * Determine commission tier for a seller
 * Priority: Discovery subscription tier > GMV-based tier
 */
export async function getSellerCommissionTier(sellerId: string): Promise<CommissionTier> {
  // PHASE 2: First check Discovery subscription tier
  try {
    const { checkDiscoveryAccess } = await import('./discovery-subscription.service');
    const discoveryAccess = await checkDiscoveryAccess(sellerId);
    
    // Map Discovery tier to commission tier
    // PREMIUM = 5%, FEATURED = 7%, FREE = 10%
    if (discoveryAccess.tier === 'PREMIUM') {
      return 'high_volume'; // 5%
    }
    if (discoveryAccess.tier === 'FEATURED') {
      return 'standard'; // 7%
    }
    // FREE tier users get launch rate (10%)
    if (discoveryAccess.tier === 'FREE') {
      return 'launch'; // 10%
    }
  } catch (error) {
    // If Discovery not set up, fall through to GMV-based logic
    console.warn('Discovery subscription check failed, using GMV-based tier', error);
  }

  // Fallback: GMV-based tier determination for non-Discovery businesses
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Query orders that contain products from this supplier
  const orders = await prisma.marketplaceOrder.findMany({
    where: {
      createdAt: { gte: thirtyDaysAgo },
      status: { in: ['completed', 'delivered'] },
      items: {
        some: {
          product: {
            supplierId: sellerId,
          },
        },
      },
    },
    select: {
      totalAmountCents: true,
    },
  });

  const monthlyGMV = orders.reduce((sum, order) => sum + order.totalAmountCents, 0);

  // Check if seller is new (less than 10 orders with their products)
  const totalOrders = await prisma.marketplaceOrder.count({
    where: {
      items: {
        some: {
          product: {
            supplierId: sellerId,
          },
        },
      },
    },
  });

  if (totalOrders < 10) {
    return 'launch'; // 10% for new sellers
  }

  if (monthlyGMV >= 5_000_000) {
    return 'high_volume'; // 5% for high-volume sellers
  }

  return 'standard'; // 7% default
}

/**
 * Calculate and create commission invoice for an order
 */
export async function createCommissionInvoice(
  orderId: string,
  sellerId: string,
  grossAmount: number,
  applyWHT: boolean = false
): Promise<CommissionInvoice> {
  // Determine tier
  const tier = await getSellerCommissionTier(sellerId);

  // Calculate commission
  const commission = calculateMarketplaceCommission(grossAmount, tier, applyWHT);

  // Create invoice record in database
  const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const invoice = await prisma.commissionInvoice.create({
    data: {
      invoiceNumber,
      sellerId,
      orderId,
      grossAmount: commission.grossAmount,
      commissionPercent: commission.commissionPercent,
      commissionAmount: commission.commissionAmount,
      commissionVAT: commission.commissionVAT,
      totalCommission: commission.totalCommission,
      whtAmount: commission.whtAmount,
      whtApplied: applyWHT,
      netToSeller: commission.netToSeller,
      tier,
      status: 'pending',
    },
  });

  return {
    id: invoice.id,
    sellerId: invoice.sellerId,
    orderId: invoice.orderId,
    grossAmount: invoice.grossAmount,
    commissionPercent: invoice.commissionPercent,
    commissionAmount: invoice.commissionAmount,
    commissionVAT: invoice.commissionVAT,
    totalCommission: invoice.totalCommission,
    whtAmount: invoice.whtAmount,
    whtApplied: invoice.whtApplied,
    netToSeller: invoice.netToSeller,
    tier: invoice.tier as CommissionTier,
    status: invoice.status as 'pending' | 'paid' | 'disputed',
    createdAt: invoice.createdAt,
    paidAt: invoice.paidAt || undefined,
  };
}

/**
 * Generate commission invoice text
 */
export function generateCommissionInvoiceText(
  invoice: CommissionInvoice,
  sellerName: string,
  language: 'en' | 'rw' = 'en'
): string {
  const lines: string[] = [];

  lines.push('========================================');
  lines.push(language === 'en' ? 'IMBONI SERVE - COMMISSION INVOICE' : 'IMBONI SERVE - INYEMEZABUGUZI YA KOMISIYO');
  lines.push('========================================');
  lines.push(`Invoice ID: ${invoice.id}`);
  lines.push(`Date: ${formatDateTimeRW(invoice.createdAt, language)}`);
  lines.push(`Seller: ${sellerName}`);
  lines.push('');

  lines.push(language === 'en' ? 'COMMISSION BREAKDOWN:' : 'IBISOBANURO BYA KOMISIYO:');
  lines.push('----------------------------------------');
  lines.push(`${language === 'en' ? 'Gross Order Amount' : 'Ikiguzi Rusange'}: ${formatRWF(invoice.grossAmount)}`);
  lines.push(`${language === 'en' ? 'Commission Rate' : 'Igipimo cya Komisiyo'}: ${invoice.commissionPercent}% (${invoice.tier})`);
  lines.push(`${language === 'en' ? 'Commission Amount' : 'Amafaranga ya Komisiyo'}: ${formatRWF(invoice.commissionAmount)}`);
  lines.push(`${language === 'en' ? 'VAT on Commission' : 'TVA kuri Komisiyo'} (18%): ${formatRWF(invoice.commissionVAT)}`);
  lines.push(`${language === 'en' ? 'Total Commission' : 'Komisiyo Yose'}: ${formatRWF(invoice.totalCommission)}`);

  if (invoice.whtApplied && invoice.whtAmount > 0) {
    lines.push(`${language === 'en' ? 'WHT Withheld' : 'Imisoro Yakuwemo'} (15%): ${formatRWF(invoice.whtAmount)}`);
  }

  lines.push('========================================');
  lines.push(`${language === 'en' ? 'NET TO SELLER' : 'AMAFARANGA UZAKIRA'}: ${formatRWF(invoice.netToSeller)}`);
  lines.push('========================================');
  lines.push('');

  if (language === 'en') {
    lines.push('Payment Terms: Net 7 days');
    lines.push('Bank details will be provided separately.');
  } else {
    lines.push('Igihe cyo Kwishyura: Iminsi 7');
    lines.push('Amakuru ya banki azatangwa ukundi.');
  }

  lines.push('');
  lines.push(language === 'en' ? 'Thank you for partnering with Imboni Serve!' : 'Murakoze kuba umufatanyabikorwa wa Imboni Serve!');

  return lines.join('\n');
}

/**
 * Get seller commission summary
 */
export async function getSellerCommissionSummary(
  sellerId: string,
  startDate?: Date,
  endDate?: Date
) {
  const dateFilter = {
    ...(startDate && { gte: startDate }),
    ...(endDate && { lte: endDate }),
  };

  // Query orders that contain products from this supplier
  const orders = await prisma.marketplaceOrder.findMany({
    where: {
      createdAt: dateFilter,
      status: { in: ['completed', 'delivered'] },
      items: {
        some: {
          product: {
            supplierId: sellerId,
          },
        },
      },
    },
    select: {
      id: true,
      totalAmountCents: true,
      createdAt: true,
    },
  });

  let totalGross = 0;
  let totalCommission = 0;
  let totalVAT = 0;
  let totalWHT = 0;
  let totalNet = 0;

  for (const order of orders) {
    const tier = await getSellerCommissionTier(sellerId);
    const commission = calculateMarketplaceCommission(order.totalAmountCents, tier, false);

    totalGross += commission.grossAmount;
    totalCommission += commission.commissionAmount;
    totalVAT += commission.commissionVAT;
    totalWHT += commission.whtAmount;
    totalNet += commission.netToSeller;
  }

  return {
    orderCount: orders.length,
    totalGross,
    totalCommission,
    totalVAT,
    totalWHT,
    totalNet,
    averageOrderValue: orders.length > 0 ? totalGross / orders.length : 0,
  };
}
