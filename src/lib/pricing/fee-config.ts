/**
 * Imboni Serve V1 Pricing Policy Configuration
 * Rwanda Tax-Aware Fee System
 */

export const FEE_CONFIG = {
  // Digital payment convenience fee
  digitalPayment: {
    enabled: true,
    percent: 5.0, // VAT-inclusive presentation
    minFee: 100, // RWF
    maxFee: 3500, // RWF
    applyTo: ['WEB', 'MTN_MOBILE_MONEY', 'AIRTEL_MONEY'],
    excludeFrom: ['CASH', 'BANK_TRANSFER'],
    excludeTips: true,
  },

  // Marketplace commission (seller-side)
  marketplace: {
    enabled: true,
    defaultPercent: 7.0, // Plus VAT
    tiers: [
      { name: 'launch', percent: 10.0, condition: 'new_seller_or_marketing' },
      { name: 'standard', percent: 7.0, condition: 'default' },
      { name: 'high_volume', percent: 5.0, condition: 'gmv_over_5m_monthly' },
    ],
    applyVAT: true,
  },

  // Rwanda tax settings
  tax: {
    vatRate: 18.0, // Rwanda standard VAT
    vatIncludedInFee: true, // Fee shown to customer is VAT-inclusive
    enableWHT: true, // Withholding tax capture for B2B invoices
    whtRate: 15.0, // Default WHT rate (confirm with RRA)
    ebmCompliant: true, // Generate EBM-compatible line items
  },

  // Display settings
  display: {
    showFeeBreakdown: true,
    showVATSeparately: false, // Keep simple for customers
    cashDiscountMode: false, // Fallback if surcharging restricted
  },
} as const;

export type PaymentMethod =
  | 'CASH'
  | 'MTN_MOBILE_MONEY'
  | 'AIRTEL_MONEY'
  | 'WEB'
  | 'BANK_TRANSFER'
  | 'OTHER';
export type CommissionTier = 'launch' | 'standard' | 'high_volume';
