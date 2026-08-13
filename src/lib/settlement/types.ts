/**
 * MPCA-001B — Settlement Intelligence Domain Types
 *
 * Provider-neutral money movement types for settlement, withdrawal,
 * funds availability, and reconciliation.
 *
 * CORE PRINCIPLE:
 *   PAYMENT TELLS US MONEY MOVED.
 *   SETTLEMENT TELLS US WHERE THE MONEY WENT.
 *   RECONCILIATION TELLS US THE STORY IS TRUE.
 */

import { PaymentGateway } from '@prisma/client'

// ─────────────────────────────────────────────────────────────────────────────
// Money Flow Classification
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The two fundamental money flows in ImboniServe.
 * - PLATFORM_MONEY: Business → ImboniServe (subscriptions, platform fees)
 * - MERCHANT_MONEY: Guest → Hospitality Business (sales, marketplace)
 *
 * These must NEVER be confused. Restaurant revenue is NOT ImboniServe revenue.
 */
export enum MoneyFlowType {
  PLATFORM_MONEY = 'PLATFORM_MONEY',
  MERCHANT_MONEY = 'MERCHANT_MONEY',
}

// ─────────────────────────────────────────────────────────────────────────────
// Provider Capability Identifiers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Canonical capability identifiers for the provider capability matrix.
 * Each provider declares which capabilities it supports and at what verification level.
 */
export const ProviderCapability = {
  // Payment collection
  PAYMENT_COLLECTION: 'PAYMENT_COLLECTION',

  // Merchant account
  MERCHANT_BALANCE: 'MERCHANT_BALANCE',
  MERCHANT_BALANCE_API: 'MERCHANT_BALANCE_API',

  // Funds availability
  IMMEDIATE_FUNDS_AVAILABILITY: 'IMMEDIATE_FUNDS_AVAILABILITY',
  SAME_DAY_AVAILABILITY: 'SAME_DAY_AVAILABILITY',
  FUNDS_AVAILABILITY_API: 'FUNDS_AVAILABILITY_API',
  FUNDS_AVAILABILITY_WEBHOOK: 'FUNDS_AVAILABILITY_WEBHOOK',

  // Settlement
  AUTOMATIC_SETTLEMENT: 'AUTOMATIC_SETTLEMENT',
  MERCHANT_INITIATED_SETTLEMENT: 'MERCHANT_INITIATED_SETTLEMENT',
  SETTLEMENT_API: 'SETTLEMENT_API',
  SETTLEMENT_WEBHOOK: 'SETTLEMENT_WEBHOOK',
  SETTLEMENT_HISTORY_API: 'SETTLEMENT_HISTORY_API',
  SETTLEMENT_REPORT: 'SETTLEMENT_REPORT',

  // Withdrawal
  WITHDRAWAL_API: 'WITHDRAWAL_API',
  WITHDRAWAL_WEBHOOK: 'WITHDRAWAL_WEBHOOK',
  BANK_WITHDRAWAL: 'BANK_WITHDRAWAL',
  MOBILE_MONEY_WITHDRAWAL: 'MOBILE_MONEY_WITHDRAWAL',
  DAILY_WITHDRAWAL: 'DAILY_WITHDRAWAL',

  // Fees
  FEE_VISIBILITY: 'FEE_VISIBILITY',
  PLATFORM_FEE_DEDUCTION: 'PLATFORM_FEE_DEDUCTION',
  SPLIT_SETTLEMENT: 'SPLIT_SETTLEMENT',

  // Refunds and reversals
  REFUND_EVENTS: 'REFUND_EVENTS',
  REVERSAL_EVENTS: 'REVERSAL_EVENTS',

  // Reconciliation
  RECONCILIATION_API: 'RECONCILIATION_API',
  TRANSACTION_REPORT: 'TRANSACTION_REPORT',
  WITHDRAWAL_REPORT: 'WITHDRAWAL_REPORT',
} as const

export type ProviderCapabilityKey = typeof ProviderCapability[keyof typeof ProviderCapability]

// ─────────────────────────────────────────────────────────────────────────────
// Provider Capability Declaration
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A single capability declaration for a provider.
 * The verification status tells us HOW we know (or don't know) this capability exists.
 */
export interface ProviderCapabilityDeclaration {
  capability: ProviderCapabilityKey
  verificationStatus: ProviderCapabilityVerificationStatus
  evidence?: string
  notes?: string
}

/**
 * Verification status vocabulary.
 * Never turn "Support told us" into "Production API verified."
 */
export enum ProviderCapabilityVerificationStatus {
  UNKNOWN = 'UNKNOWN',
  NOT_VERIFIED = 'NOT_VERIFIED',
  NOT_SUPPORTED = 'NOT_SUPPORTED',
  SUPPORTED = 'SUPPORTED',
  SUPPORTED_BUT_UNTESTED = 'SUPPORTED_BUT_UNTESTED',
  VERIFIED = 'VERIFIED',
  DOCUMENTED = 'DOCUMENTED',
  SUPPORT_CONFIRMED = 'SUPPORT_CONFIRMED',
}

/**
 * The complete capability profile for a provider.
 * Providers declare what they support; the core domain never assumes.
 */
export interface ProviderCapabilityProfile {
  provider: PaymentGateway
  capabilities: ProviderCapabilityDeclaration[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Settlement Provider Interface
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Settlement provider interface — OPTIONAL for payment providers.
 *
 * Providers that support settlement/withdrawal implement this interface.
 * Providers that don't (e.g., payment-only aggregators) only implement IPaymentProvider.
 *
 * The core domain calls these methods only if the provider declares the capability.
 */
export interface ISettlementProvider {
  readonly name: PaymentGateway

  /**
   * Get the provider's capability profile.
   * Returns what settlement/withdrawal capabilities this provider supports.
   */
  getCapabilityProfile(): ProviderCapabilityProfile

  /**
   * Get merchant balance (if supported).
   * Returns null if the provider does not support balance queries.
   */
  getMerchantBalance?(businessId: string): Promise<MerchantBalance | null>

  /**
   * Get settlement status for a specific settlement record.
   * Returns null if the provider does not expose settlement status.
   */
  getSettlementStatus?(providerSettlementId: string): Promise<SettlementStatusQueryResult | null>

  /**
   * Get settlement history for a business.
   * Returns empty array if the provider does not expose settlement history.
   */
  getSettlementHistory?(businessId: string, from: Date, to: Date): Promise<SettlementHistoryEntry[]>

  /**
   * Handle a settlement webhook from the provider.
   * Returns the parsed settlement event, or null if the provider doesn't send settlement webhooks.
   */
  handleSettlementWebhook?(payload: any, signature?: string): Promise<SettlementWebhookEvent | null>

  /**
   * Request a withdrawal on behalf of the merchant.
   * Returns NOT_SUPPORTED result if the provider does not support withdrawal API.
   */
  requestWithdrawal?(request: WithdrawalRequest): Promise<WithdrawalResult>

  /**
   * Get withdrawal status.
   * Returns null if the provider does not expose withdrawal status.
   */
  getWithdrawalStatus?(providerWithdrawalId: string): Promise<WithdrawalStatusQueryResult | null>

  /**
   * Handle a withdrawal webhook from the provider.
   * Returns null if the provider doesn't send withdrawal webhooks.
   */
  handleWithdrawalWebhook?(payload: any, signature?: string): Promise<WithdrawalWebhookEvent | null>

  /**
   * Validate a settlement webhook signature.
   */
  validateSettlementWebhook?(payload: any, signature?: string): Promise<boolean>

  /**
   * Validate a withdrawal webhook signature.
   */
  validateWithdrawalWebhook?(payload: any, signature?: string): Promise<boolean>
}

// ─────────────────────────────────────────────────────────────────────────────
// Settlement Domain Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Merchant balance as reported by the provider.
 * All amounts in cents.
 */
export interface MerchantBalance {
  availableCents: number
  pendingCents: number
  currency: string
  asOf: Date
  /** Raw provider response for audit */
  rawResponse?: any
}

/**
 * Result of querying settlement status from the provider.
 */
export interface SettlementStatusQueryResult {
  providerSettlementId: string
  status: SettlementLifecycleStatus
  grossAmountCents?: number
  providerFeeCents?: number
  netAmountCents?: number
  currency?: string
  completedAt?: Date
  rawResponse?: any
}

/**
 * A settlement history entry from the provider.
 */
export interface SettlementHistoryEntry {
  providerSettlementId: string
  status: SettlementLifecycleStatus
  grossAmountCents: number
  providerFeeCents?: number
  netAmountCents: number
  currency: string
  settledAt: Date
  transactionReferences?: string[]
  rawResponse?: any
}

/**
 * A settlement webhook event from the provider.
 */
export interface SettlementWebhookEvent {
  provider: PaymentGateway
  providerSettlementId: string
  status: SettlementLifecycleStatus
  grossAmountCents?: number
  providerFeeCents?: number
  netAmountCents?: number
  currency?: string
  transactionReferences?: string[]
  timestamp: Date
  signature?: string
  rawPayload: any
}

// ─────────────────────────────────────────────────────────────────────────────
// Withdrawal Domain Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Withdrawal request — merchant wants to move available funds to a destination.
 */
export interface WithdrawalRequest {
  businessId: string
  amountCents: number
  currency: string
  destinationType: WithdrawalDestinationType
  destinationReference: string
  idempotencyKey: string
}

/**
 * Withdrawal destination types.
 */
export enum WithdrawalDestinationType {
  BANK_ACCOUNT = 'BANK_ACCOUNT',
  MOBILE_MONEY = 'MOBILE_MONEY',
  OTHER = 'OTHER',
}

/**
 * Result of a withdrawal request.
 */
export interface WithdrawalResult {
  success: boolean
  providerWithdrawalId?: string
  feeCents?: number
  netAmountCents?: number
  status?: WithdrawalLifecycleStatus
  error?: string
  errorCode?: string
  rawResponse?: any
}

/**
 * Result of querying withdrawal status from the provider.
 */
export interface WithdrawalStatusQueryResult {
  providerWithdrawalId: string
  status: WithdrawalLifecycleStatus
  amountCents?: number
  feeCents?: number
  netAmountCents?: number
  currency?: string
  completedAt?: Date
  failedAt?: Date
  failureReason?: string
  rawResponse?: any
}

/**
 * A withdrawal webhook event from the provider.
 */
export interface WithdrawalWebhookEvent {
  provider: PaymentGateway
  providerWithdrawalId: string
  status: WithdrawalLifecycleStatus
  amountCents?: number
  feeCents?: number
  netAmountCents?: number
  currency?: string
  timestamp: Date
  signature?: string
  rawPayload: any
}

// ─────────────────────────────────────────────────────────────────────────────
// Lifecycle Status Enums (mirror Prisma enums for use in domain logic)
// ─────────────────────────────────────────────────────────────────────────────

export enum SettlementLifecycleStatus {
  PENDING = 'SETTLEMENT_PENDING',
  PROCESSING = 'SETTLEMENT_PROCESSING',
  COMPLETED = 'SETTLEMENT_COMPLETED',
  FAILED = 'SETTLEMENT_FAILED',
  NOT_REQUIRED = 'SETTLEMENT_NOT_REQUIRED',
  UNKNOWN = 'SETTLEMENT_UNKNOWN',
}

export enum WithdrawalLifecycleStatus {
  REQUESTED = 'WITHDRAWAL_REQUESTED',
  PROCESSING = 'WITHDRAWAL_PROCESSING',
  COMPLETED = 'WITHDRAWAL_COMPLETED',
  FAILED = 'WITHDRAWAL_FAILED',
  NOT_SUPPORTED = 'WITHDRAWAL_NOT_SUPPORTED',
  UNKNOWN = 'WITHDRAWAL_UNKNOWN',
}

export enum FundsAvailabilityLifecycleStatus {
  PENDING = 'FUNDS_PENDING',
  AVAILABLE = 'FUNDS_AVAILABLE',
  UNKNOWN = 'FUNDS_UNKNOWN',
}

export enum SettlementReconciliationLifecycleStatus {
  RECONCILED = 'RECONCILED',
  VARIANCE = 'RECONCILIATION_VARIANCE',
  PENDING = 'RECONCILIATION_PENDING',
  NOT_APPLICABLE = 'RECONCILIATION_NOT_APPLICABLE',
}

// ─────────────────────────────────────────────────────────────────────────────
// Fee Breakdown
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fee breakdown for a settlement or payment.
 * All amounts in cents.
 *
 * Gross Sale - Gateway Fee - Platform Fee - Other Deductions = Merchant Net
 */
export interface FeeBreakdown {
  grossAmountCents: number
  providerFeeCents: number
  platformFeeCents: number
  otherDeductionsCents: number
  netAmountCents: number
}

/**
 * Validate that fee breakdown arithmetic is correct.
 * grossAmountCents - providerFeeCents - platformFeeCents - otherDeductionsCents === netAmountCents
 */
export function validateFeeBreakdown(fees: FeeBreakdown): boolean {
  const expected =
    fees.grossAmountCents -
    fees.providerFeeCents -
    fees.platformFeeCents -
    fees.otherDeductionsCents
  return expected === fees.netAmountCents
}

// ─────────────────────────────────────────────────────────────────────────────
// Settlement Intelligence Summary (for dashboard/API)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Provider-neutral summary of where a business's money is.
 * Used to answer: "Where is my money?"
 *
 * Unknown values remain explicitly null — never invented.
 */
export interface SettlementIntelligenceSummary {
  businessId: string
  currency: string

  // Payment-level (from existing PaymentTransaction)
  totalCollectedCents: number
  totalPaidTransactions: number

  // Funds availability
  fundsAvailableCents: number | null  // null = UNKNOWN
  fundsPendingCents: number | null    // null = UNKNOWN

  // Settlement
  totalSettledCents: number | null    // null = UNKNOWN
  pendingSettlementCents: number | null // null = UNKNOWN
  settlementRecordsCount: number

  // Withdrawal
  totalWithdrawnCents: number | null  // null = UNKNOWN
  pendingWithdrawalCents: number | null // null = UNKNOWN
  withdrawalRecordsCount: number

  // Fees
  totalGatewayFeesCents: number | null  // null = UNKNOWN
  totalPlatformFeesCents: number | null // null = UNKNOWN

  // Reconciliation
  reconciledCount: number
  varianceCount: number
  pendingReconciliationCount: number
  notApplicableCount: number

  // Capability summary
  providerCapabilities: ProviderCapabilityProfile[]

  // Whether the provider exposes settlement information
  settlementDataAvailable: boolean
}
