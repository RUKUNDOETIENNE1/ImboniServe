/**
 * Imboni Serve Fee Calculator
 * VAT-aware calculations for digital payment fees and marketplace commissions
 */

import { FEE_CONFIG, PaymentMethod, CommissionTier } from './fee-config';

export interface FeeCalculationResult {
  subtotal: number;
  convenienceFee: number;
  convenienceFeeVAT: number;
  total: number;
  paymentMethod: PaymentMethod;
  feeApplied: boolean;
  breakdown: {
    subtotal: number;
    convenienceFee: number;
    vat: number;
    total: number;
  };
}

export interface CommissionCalculationResult {
  grossAmount: number;
  commissionPercent: number;
  commissionAmount: number;
  commissionVAT: number;
  totalCommission: number;
  whtAmount: number;
  netToSeller: number;
  tier: CommissionTier;
}

/**
 * Calculate digital payment convenience fee
 */
export function calculateConvenienceFee(
  subtotal: number,
  paymentMethod: PaymentMethod,
  excludeTips: boolean = true,
  tipsAmount: number = 0
): FeeCalculationResult {
  const config = FEE_CONFIG.digitalPayment;

  // Check if fee applies to this payment method
  const feeApplies = config.enabled && (config.applyTo as readonly string[]).includes(paymentMethod);

  if (!feeApplies) {
    return {
      subtotal,
      convenienceFee: 0,
      convenienceFeeVAT: 0,
      total: subtotal,
      paymentMethod,
      feeApplied: false,
      breakdown: {
        subtotal,
        convenienceFee: 0,
        vat: 0,
        total: subtotal,
      },
    };
  }

  // Calculate base amount (exclude tips if configured)
  const baseAmount = excludeTips && config.excludeTips ? subtotal - tipsAmount : subtotal;

  // Calculate raw fee
  let rawFee = (baseAmount * config.percent) / 100;

  // Apply min/max caps
  rawFee = Math.max(config.minFee, Math.min(rawFee, config.maxFee));

  // Round to nearest RWF
  const convenienceFee = Math.round(rawFee);

  // Calculate VAT component (embedded in fee)
  const vatRate = FEE_CONFIG.tax.vatRate;
  const convenienceFeeVAT = Math.round((convenienceFee * vatRate) / (100 + vatRate));

  const total = subtotal + convenienceFee;

  return {
    subtotal,
    convenienceFee,
    convenienceFeeVAT,
    total,
    paymentMethod,
    feeApplied: true,
    breakdown: {
      subtotal,
      convenienceFee,
      vat: convenienceFeeVAT,
      total,
    },
  };
}

/**
 * Calculate marketplace commission for sellers
 */
export function calculateMarketplaceCommission(
  grossAmount: number,
  tier: CommissionTier = 'standard',
  applyWHT: boolean = false
): CommissionCalculationResult {
  const config = FEE_CONFIG.marketplace;

  // Get commission rate for tier
  const tierConfig = config.tiers.find((t) => t.name === tier) || config.tiers[1];
  const commissionPercent = tierConfig.percent;

  // Calculate base commission
  const commissionAmount = Math.round((grossAmount * commissionPercent) / 100);

  // Calculate VAT on commission
  const vatRate = FEE_CONFIG.tax.vatRate;
  const commissionVAT = config.applyVAT ? Math.round((commissionAmount * vatRate) / 100) : 0;

  const totalCommission = commissionAmount + commissionVAT;

  // Calculate WHT if applicable
  const whtRate = FEE_CONFIG.tax.whtRate;
  const whtAmount = applyWHT && FEE_CONFIG.tax.enableWHT 
    ? Math.round((commissionAmount * whtRate) / 100) 
    : 0;

  // Net to seller
  const netToSeller = grossAmount - totalCommission - whtAmount;

  return {
    grossAmount,
    commissionPercent,
    commissionAmount,
    commissionVAT,
    totalCommission,
    whtAmount,
    netToSeller,
    tier,
  };
}

/**
 * Format currency for Rwanda (RWF)
 */
export function formatRWF(amount: number): string {
  return new Intl.NumberFormat('en-RW', {
    style: 'currency',
    currency: 'RWF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Get fee description for customer display
 */
export function getFeeDescription(language: 'en' | 'rw' = 'en'): string {
  const percent = FEE_CONFIG.digitalPayment.percent;
  
  if (language === 'rw') {
    return `Niwishyura ukoresheje ikarita cyangwa Mobile Money hiyongeraho amafaranga ya serivisi ${percent}% (harimo TVA). Niba wishyuye mu mafaranga (cash) nta kiguzi cyiyongera.`;
  }
  
  return `Paying by card or mobile money includes a ${percent}% digital payment convenience fee (VAT included). Pay with cash to avoid this fee.`;
}

/**
 * Get cash discount description (fallback mode)
 */
export function getCashDiscountDescription(language: 'en' | 'rw' = 'en'): string {
  const percent = FEE_CONFIG.digitalPayment.percent;
  
  if (language === 'rw') {
    return `Ibiciro birimo amafaranga ya serivisi ${percent}%. Niwishyuye mu mafaranga (cash) uzabona igabanuka rya ${percent}%.`;
  }
  
  return `Menu price includes a ${percent}% digital fee. Pay cash to get ${percent}% discount.`;
}
