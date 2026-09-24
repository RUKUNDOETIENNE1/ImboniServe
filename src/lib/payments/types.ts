/**
 * Payment Provider Abstraction Layer
 * Unified types for all payment providers (InTouch, IremboPay, future providers)
 */

export enum SubscriptionState {
  TRIAL = 'TRIAL',
  ACTIVE = 'ACTIVE',
  GRACE_PERIOD = 'GRACE_PERIOD',
  EXPIRED = 'EXPIRED',
  SUSPENDED = 'SUSPENDED',
  CANCELLED = 'CANCELLED',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentProviderType {
  INTOUCH = 'INTOUCH',
  IREMBO_PAY = 'IREMBO_PAY',
  MTN_DIRECT = 'MTN_DIRECT',
  AIRTEL_DIRECT = 'AIRTEL_DIRECT',
  PESAPAL = 'PESAPAL',
  STRIPE = 'STRIPE',
  FLUTTERWAVE = 'FLUTTERWAVE',
}

export enum PaymentMethodType {
  MOBILE_MONEY_MTN = 'MOBILE_MONEY_MTN',
  MOBILE_MONEY_AIRTEL = 'MOBILE_MONEY_AIRTEL',
  CARD_VISA = 'CARD_VISA',
  CARD_MASTERCARD = 'CARD_MASTERCARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
}

/**
 * Unified payment request across all providers
 */
export interface PaymentInitiationRequest {
  amount: number // in cents
  currency: string
  customerPhone: string
  customerEmail?: string
  customerName?: string
  orderId: string
  description?: string
  metadata?: Record<string, any>
  callbackUrl?: string
  returnUrl?: string
}

/**
 * Unified payment response from all providers
 */
export interface PaymentInitiationResponse {
  success: boolean
  transactionId?: string
  providerReference?: string
  paymentUrl?: string
  error?: string
  errorCode?: string
  metadata?: Record<string, any>
}

/**
 * Unified payment verification request
 */
export interface PaymentVerificationRequest {
  transactionId: string
  providerReference?: string
}

/**
 * Unified payment verification response
 */
export interface PaymentVerificationResponse {
  success: boolean
  status: TransactionStatus
  transactionId: string
  providerReference?: string
  amount?: number
  currency?: string
  paidAt?: Date
  error?: string
  metadata?: Record<string, any>
}

/**
 * Webhook payload (provider-agnostic)
 */
export interface WebhookPayload {
  provider: PaymentProviderType
  transactionId: string
  providerReference?: string
  status: TransactionStatus
  amount?: number
  currency?: string
  timestamp: Date
  signature?: string
  rawPayload: any
}

/**
 * Webhook validation result
 */
export interface WebhookValidationResult {
  valid: boolean
  error?: string
}

/**
 * Base interface that all payment providers must implement
 */
export interface IPaymentProvider {
  readonly name: PaymentProviderType

  /**
   * Initiate a payment
   */
  createPayment(request: PaymentInitiationRequest): Promise<PaymentInitiationResponse>

  /**
   * Verify payment status
   */
  verifyPayment(request: PaymentVerificationRequest): Promise<PaymentVerificationResponse>

  /**
   * Handle incoming webhook
   */
  handleWebhook(payload: any, signature?: string): Promise<WebhookPayload>

  /**
   * Validate webhook signature
   */
  validateWebhook(payload: any, signature?: string): Promise<WebhookValidationResult>

  /**
   * Get transaction status
   */
  getTransactionStatus(transactionId: string): Promise<PaymentVerificationResponse>

  /**
   * Refund a payment (future)
   */
  refundPayment?(transactionId: string, amount?: number): Promise<PaymentInitiationResponse>
}

/**
 * Subscription plan billing cycle
 */
export enum BillingCycle {
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  SEMI_ANNUAL = 'SEMI_ANNUAL',
  ANNUAL = 'ANNUAL',
  CUSTOM = 'CUSTOM',
}

/**
 * Subscription activation request
 */
export interface SubscriptionActivationRequest {
  businessId: string
  planId: string
  paymentTransactionId: string
  startDate?: Date
  billingCycle: BillingCycle
}

/**
 * Subscription renewal request
 */
export interface SubscriptionRenewalRequest {
  subscriptionId: string
  paymentTransactionId: string
  billingCycle?: BillingCycle
}

/**
 * Audit event types
 */
export enum AuditEventType {
  SUBSCRIPTION_CREATED = 'SUBSCRIPTION_CREATED',
  SUBSCRIPTION_RENEWED = 'SUBSCRIPTION_RENEWED',
  SUBSCRIPTION_CANCELLED = 'SUBSCRIPTION_CANCELLED',
  SUBSCRIPTION_SUSPENDED = 'SUBSCRIPTION_SUSPENDED',
  SUBSCRIPTION_EXPIRED = 'SUBSCRIPTION_EXPIRED',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  REFUND_ISSUED = 'REFUND_ISSUED',
  ACCOUNT_SUSPENDED = 'ACCOUNT_SUSPENDED',
}

/**
 * Audit log entry
 */
export interface AuditLogEntry {
  eventType: AuditEventType
  businessId: string
  subscriptionId?: string
  transactionId?: string
  userId?: string
  metadata?: Record<string, any>
  timestamp: Date
}
