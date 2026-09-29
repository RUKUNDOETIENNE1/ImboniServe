/**
 * MPCA-001B — Provider Capability Registry
 *
 * Central registry of provider capability profiles.
 * Each provider declares what settlement/withdrawal capabilities it supports,
 * with explicit verification status.
 *
 * NO CAPABILITY IS ASSUMED. Unknown remains unknown.
 */

import { PaymentGateway } from '@prisma/client'
import {
  ProviderCapability,
  ProviderCapabilityDeclaration,
  ProviderCapabilityProfile,
  ProviderCapabilityVerificationStatus,
} from './types'

// Use string literals for gateway values to avoid dependency on @prisma/client
// at module load time (tests may mock @prisma/client making the enum undefined)
const INTOUCH = 'INTOUCH'
const IREMBO_PAY = 'IREMBO_PAY'

// ─────────────────────────────────────────────────────────────────────────────
// InTouch Capability Profile
// ─────────────────────────────────────────────────────────────────────────────
//
// InTouch is a mobile money aggregator (MTN, Airtel) in Rwanda.
// We have verbal support info ("business can withdraw same day, every day")
// but NO production API contract for settlement/withdrawal.
// All settlement/withdrawal capabilities remain UNKNOWN.
// ─────────────────────────────────────────────────────────────────────────────

const intouchCapabilities: ProviderCapabilityDeclaration[] = [
  // Payment collection — SUPPORT_CONFIRMED (code implements webhook handler)
  {
    capability: ProviderCapability.PAYMENT_COLLECTION,
    verificationStatus: ProviderCapabilityVerificationStatus.SUPPORT_CONFIRMED,
    evidence: 'Webhook handler implemented at src/pages/api/webhooks/intouch.ts with basic auth + optional HMAC',
  },

  // Merchant balance — UNKNOWN
  {
    capability: ProviderCapability.MERCHANT_BALANCE,
    verificationStatus: ProviderCapabilityVerificationStatus.UNKNOWN,
  },
  {
    capability: ProviderCapability.MERCHANT_BALANCE_API,
    verificationStatus: ProviderCapabilityVerificationStatus.UNKNOWN,
  },

  // Funds availability — UNVERIFIED (verbal support info only)
  {
    capability: ProviderCapability.IMMEDIATE_FUNDS_AVAILABILITY,
    verificationStatus: ProviderCapabilityVerificationStatus.UNKNOWN,
  },
  {
    capability: ProviderCapability.SAME_DAY_AVAILABILITY,
    verificationStatus: ProviderCapabilityVerificationStatus.NOT_VERIFIED,
    notes: 'Verbal support info: "business can withdraw same day, every day" — NOT a production API contract',
  },
  {
    capability: ProviderCapability.FUNDS_AVAILABILITY_API,
    verificationStatus: ProviderCapabilityVerificationStatus.UNKNOWN,
  },
  {
    capability: ProviderCapability.FUNDS_AVAILABILITY_WEBHOOK,
    verificationStatus: ProviderCapabilityVerificationStatus.UNKNOWN,
  },

  // Settlement — all UNKNOWN
  {
    capability: ProviderCapability.AUTOMATIC_SETTLEMENT,
    verificationStatus: ProviderCapabilityVerificationStatus.UNKNOWN,
  },
  {
    capability: ProviderCapability.MERCHANT_INITIATED_SETTLEMENT,
    verificationStatus: ProviderCapabilityVerificationStatus.UNKNOWN,
  },
  {
    capability: ProviderCapability.SETTLEMENT_API,
    verificationStatus: ProviderCapabilityVerificationStatus.UNKNOWN,
  },
  {
    capability: ProviderCapability.SETTLEMENT_WEBHOOK,
    verificationStatus: ProviderCapabilityVerificationStatus.UNKNOWN,
  },
  {
    capability: ProviderCapability.SETTLEMENT_HISTORY_API,
    verificationStatus: ProviderCapabilityVerificationStatus.UNKNOWN,
  },
  {
    capability: ProviderCapability.SETTLEMENT_REPORT,
    verificationStatus: ProviderCapabilityVerificationStatus.UNKNOWN,
  },

  // Withdrawal — UNVERIFIED (verbal support info only for daily withdrawal)
  {
    capability: ProviderCapability.WITHDRAWAL_API,
    verificationStatus: ProviderCapabilityVerificationStatus.UNKNOWN,
  },
  {
    capability: ProviderCapability.WITHDRAWAL_WEBHOOK,
    verificationStatus: ProviderCapabilityVerificationStatus.UNKNOWN,
  },
  {
    capability: ProviderCapability.BANK_WITHDRAWAL,
    verificationStatus: ProviderCapabilityVerificationStatus.UNKNOWN,
  },
  {
    capability: ProviderCapability.MOBILE_MONEY_WITHDRAWAL,
    verificationStatus: ProviderCapabilityVerificationStatus.UNKNOWN,
  },
  {
    capability: ProviderCapability.DAILY_WITHDRAWAL,
    verificationStatus: ProviderCapabilityVerificationStatus.NOT_VERIFIED,
    notes: 'Verbal support info: "business can withdraw every day" — NOT a production API contract',
  },

  // Fees — UNKNOWN
  {
    capability: ProviderCapability.FEE_VISIBILITY,
    verificationStatus: ProviderCapabilityVerificationStatus.UNKNOWN,
  },
  {
    capability: ProviderCapability.PLATFORM_FEE_DEDUCTION,
    verificationStatus: ProviderCapabilityVerificationStatus.UNKNOWN,
  },
  {
    capability: ProviderCapability.SPLIT_SETTLEMENT,
    verificationStatus: ProviderCapabilityVerificationStatus.UNKNOWN,
  },

  // Refunds and reversals — UNKNOWN
  {
    capability: ProviderCapability.REFUND_EVENTS,
    verificationStatus: ProviderCapabilityVerificationStatus.UNKNOWN,
  },
  {
    capability: ProviderCapability.REVERSAL_EVENTS,
    verificationStatus: ProviderCapabilityVerificationStatus.UNKNOWN,
  },

  // Reconciliation — UNKNOWN
  {
    capability: ProviderCapability.RECONCILIATION_API,
    verificationStatus: ProviderCapabilityVerificationStatus.UNKNOWN,
  },
  {
    capability: ProviderCapability.TRANSACTION_REPORT,
    verificationStatus: ProviderCapabilityVerificationStatus.UNKNOWN,
  },
  {
    capability: ProviderCapability.WITHDRAWAL_REPORT,
    verificationStatus: ProviderCapabilityVerificationStatus.UNKNOWN,
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// IremboPay Capability Profile
// ─────────────────────────────────────────────────────────────────────────────
//
// IremboPay is a card payment gateway (Visa, Mastercard) in Rwanda.
// Payment webhooks are implemented. Settlement/withdrawal behavior is UNKNOWN.
// Refund API explicitly NOT available in v1.
// ─────────────────────────────────────────────────────────────────────────────

const irembopayCapabilities: ProviderCapabilityDeclaration[] = [
  // Payment collection — SUPPORT_CONFIRMED
  {
    capability: ProviderCapability.PAYMENT_COLLECTION,
    verificationStatus: ProviderCapabilityVerificationStatus.SUPPORT_CONFIRMED,
    evidence: 'Webhook handler implemented with HMAC-SHA256 signature verification',
  },

  // Merchant balance — UNKNOWN
  {
    capability: ProviderCapability.MERCHANT_BALANCE,
    verificationStatus: ProviderCapabilityVerificationStatus.UNKNOWN,
  },
  {
    capability: ProviderCapability.MERCHANT_BALANCE_API,
    verificationStatus: ProviderCapabilityVerificationStatus.UNKNOWN,
  },

  // Funds availability — UNKNOWN
  {
    capability: ProviderCapability.IMMEDIATE_FUNDS_AVAILABILITY,
    verificationStatus: ProviderCapabilityVerificationStatus.UNKNOWN,
  },
  {
    capability: ProviderCapability.SAME_DAY_AVAILABILITY,
    verificationStatus: ProviderCapabilityVerificationStatus.UNKNOWN,
  },
  {
    capability: ProviderCapability.FUNDS_AVAILABILITY_API,
    verificationStatus: ProviderCapabilityVerificationStatus.UNKNOWN,
  },
  {
    capability: ProviderCapability.FUNDS_AVAILABILITY_WEBHOOK,
    verificationStatus: ProviderCapabilityVerificationStatus.UNKNOWN,
  },

  // Settlement — all UNKNOWN
  {
    capability: ProviderCapability.AUTOMATIC_SETTLEMENT,
    verificationStatus: ProviderCapabilityVerificationStatus.UNKNOWN,
  },
  {
    capability: ProviderCapability.MERCHANT_INITIATED_SETTLEMENT,
    verificationStatus: ProviderCapabilityVerificationStatus.UNKNOWN,
  },
  {
    capability: ProviderCapability.SETTLEMENT_API,
    verificationStatus: ProviderCapabilityVerificationStatus.UNKNOWN,
  },
  {
    capability: ProviderCapability.SETTLEMENT_WEBHOOK,
    verificationStatus: ProviderCapabilityVerificationStatus.UNKNOWN,
  },
  {
    capability: ProviderCapability.SETTLEMENT_HISTORY_API,
    verificationStatus: ProviderCapabilityVerificationStatus.UNKNOWN,
  },
  {
    capability: ProviderCapability.SETTLEMENT_REPORT,
    verificationStatus: ProviderCapabilityVerificationStatus.UNKNOWN,
  },

  // Withdrawal — UNKNOWN
  {
    capability: ProviderCapability.WITHDRAWAL_API,
    verificationStatus: ProviderCapabilityVerificationStatus.UNKNOWN,
  },
  {
    capability: ProviderCapability.WITHDRAWAL_WEBHOOK,
    verificationStatus: ProviderCapabilityVerificationStatus.UNKNOWN,
  },
  {
    capability: ProviderCapability.BANK_WITHDRAWAL,
    verificationStatus: ProviderCapabilityVerificationStatus.UNKNOWN,
  },
  {
    capability: ProviderCapability.MOBILE_MONEY_WITHDRAWAL,
    verificationStatus: ProviderCapabilityVerificationStatus.UNKNOWN,
  },
  {
    capability: ProviderCapability.DAILY_WITHDRAWAL,
    verificationStatus: ProviderCapabilityVerificationStatus.UNKNOWN,
  },

  // Fees — UNKNOWN
  {
    capability: ProviderCapability.FEE_VISIBILITY,
    verificationStatus: ProviderCapabilityVerificationStatus.UNKNOWN,
  },
  {
    capability: ProviderCapability.PLATFORM_FEE_DEDUCTION,
    verificationStatus: ProviderCapabilityVerificationStatus.UNKNOWN,
  },
  {
    capability: ProviderCapability.SPLIT_SETTLEMENT,
    verificationStatus: ProviderCapabilityVerificationStatus.UNKNOWN,
  },

  // Refunds — NOT_SUPPORTED (explicitly in code)
  {
    capability: ProviderCapability.REFUND_EVENTS,
    verificationStatus: ProviderCapabilityVerificationStatus.NOT_SUPPORTED,
    evidence: 'IremboPay refund API not available in v1. Refunds processed manually via merchant portal.',
  },
  {
    capability: ProviderCapability.REVERSAL_EVENTS,
    verificationStatus: ProviderCapabilityVerificationStatus.UNKNOWN,
  },

  // Reconciliation — UNKNOWN
  {
    capability: ProviderCapability.RECONCILIATION_API,
    verificationStatus: ProviderCapabilityVerificationStatus.UNKNOWN,
  },
  {
    capability: ProviderCapability.TRANSACTION_REPORT,
    verificationStatus: ProviderCapabilityVerificationStatus.UNKNOWN,
  },
  {
    capability: ProviderCapability.WITHDRAWAL_REPORT,
    verificationStatus: ProviderCapabilityVerificationStatus.UNKNOWN,
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Capability Registry
// ─────────────────────────────────────────────────────────────────────────────

const capabilityProfiles: Map<string, ProviderCapabilityProfile> = new Map([
  [INTOUCH, {
    provider: INTOUCH as PaymentGateway,
    capabilities: intouchCapabilities,
  }],
  [IREMBO_PAY, {
    provider: IREMBO_PAY as PaymentGateway,
    capabilities: irembopayCapabilities,
  }],
  // Future providers: add here with all UNKNOWN capabilities
])

/**
 * Provider Capability Registry
 * Central read-only access to provider capability profiles.
 */
export class ProviderCapabilityRegistry {
  /**
   * Get the capability profile for a provider.
   */
  static getProfile(provider: PaymentGateway | string): ProviderCapabilityProfile | null {
    return capabilityProfiles.get(String(provider)) || null
  }

  /**
   * Get all capability profiles.
   */
  static getAllProfiles(): ProviderCapabilityProfile[] {
    return Array.from(capabilityProfiles.values())
  }

  /**
   * Check if a provider has a specific capability at a given verification level or better.
   */
  static hasCapability(
    provider: PaymentGateway | string,
    capability: string,
    minStatus?: ProviderCapabilityVerificationStatus
  ): boolean {
    const profile = capabilityProfiles.get(String(provider))
    if (!profile) return false

    const decl = profile.capabilities.find(c => c.capability === capability)
    if (!decl) return false

    if (!minStatus) {
      // Just check if the capability is declared as supported or better
      return isCapabilitySupported(decl.verificationStatus)
    }

    return meetsVerificationLevel(decl.verificationStatus, minStatus)
  }

  /**
   * Get a specific capability declaration for a provider.
   */
  static getCapability(
    provider: PaymentGateway | string,
    capability: string
  ): ProviderCapabilityDeclaration | null {
    const profile = capabilityProfiles.get(String(provider))
    if (!profile) return null
    return profile.capabilities.find(c => c.capability === capability) || null
  }

  /**
   * Check if settlement data is available for a provider.
   * Returns true only if the provider has VERIFIED or DOCUMENTED settlement API/webhook.
   */
  static isSettlementDataAvailable(provider: PaymentGateway | string): boolean {
    const hasSettlementApi = this.hasCapability(provider, ProviderCapability.SETTLEMENT_API)
    const hasSettlementWebhook = this.hasCapability(provider, ProviderCapability.SETTLEMENT_WEBHOOK)
    const hasSettlementReport = this.hasCapability(provider, ProviderCapability.SETTLEMENT_REPORT)
    const hasSettlementHistory = this.hasCapability(provider, ProviderCapability.SETTLEMENT_HISTORY_API)

    // Settlement data is available only if at least one settlement capability is SUPPORTED or better
    return hasSettlementApi || hasSettlementWebhook || hasSettlementReport || hasSettlementHistory
  }

  /**
   * Check if withdrawal is supported by a provider.
   */
  static isWithdrawalSupported(provider: PaymentGateway | string): boolean {
    return this.hasCapability(provider, ProviderCapability.WITHDRAWAL_API)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Verification Status Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check if a verification status means the capability is supported (vs unknown/not supported).
 */
function isCapabilitySupported(status: ProviderCapabilityVerificationStatus): boolean {
  return (
    status === ProviderCapabilityVerificationStatus.SUPPORTED ||
    status === ProviderCapabilityVerificationStatus.SUPPORTED_BUT_UNTESTED ||
    status === ProviderCapabilityVerificationStatus.VERIFIED ||
    status === ProviderCapabilityVerificationStatus.DOCUMENTED ||
    status === ProviderCapabilityVerificationStatus.SUPPORT_CONFIRMED
  )
}

/**
 * Verification level hierarchy (lowest to highest confidence):
 *   UNKNOWN < NOT_VERIFIED < NOT_SUPPORTED < SUPPORT_CONFIRMED < DOCUMENTED < SUPPORTED_BUT_UNTESTED < SUPPORTED < VERIFIED
 *
 * Note: NOT_SUPPORTED is "known to not work" — it's higher confidence than UNKNOWN
 * but means the capability is NOT available.
 */
const verificationLevelRank: Record<ProviderCapabilityVerificationStatus, number> = {
  [ProviderCapabilityVerificationStatus.UNKNOWN]: 0,
  [ProviderCapabilityVerificationStatus.NOT_VERIFIED]: 1,
  [ProviderCapabilityVerificationStatus.NOT_SUPPORTED]: 2,
  [ProviderCapabilityVerificationStatus.SUPPORT_CONFIRMED]: 3,
  [ProviderCapabilityVerificationStatus.DOCUMENTED]: 4,
  [ProviderCapabilityVerificationStatus.SUPPORTED_BUT_UNTESTED]: 5,
  [ProviderCapabilityVerificationStatus.SUPPORTED]: 6,
  [ProviderCapabilityVerificationStatus.VERIFIED]: 7,
}

/**
 * Check if a verification status meets or exceeds a minimum level.
 */
function meetsVerificationLevel(
  actual: ProviderCapabilityVerificationStatus,
  minimum: ProviderCapabilityVerificationStatus
): boolean {
  return verificationLevelRank[actual] >= verificationLevelRank[minimum]
}
