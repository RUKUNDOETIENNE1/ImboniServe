/**
 * IremboPay Payment Provider
 * Handles Visa and Mastercard payments via IremboPay gateway
 * 
 * API Documentation: https://developer.irembo.com/docs/payments
 * Sandbox: https://sandbox-api.irembo.com
 * Production: https://api.irembo.com
 */

import crypto from 'crypto'
import {
  IPaymentProvider,
  PaymentProviderType,
  PaymentInitiationRequest,
  PaymentInitiationResponse,
  PaymentVerificationRequest,
  PaymentVerificationResponse,
  WebhookPayload,
  WebhookValidationResult,
  TransactionStatus,
} from '../types'

interface IremboPayConfig {
  apiUrl: string
  merchantId: string
  apiKey: string
  apiSecret: string
  callbackUrl?: string
  returnUrl?: string
}

// Payment initiation request
interface IremboPaymentRequest {
  merchantId: string
  amount: number
  currency: string
  orderId: string
  description?: string
  customerEmail?: string
  customerName?: string
  customerPhone?: string
  callbackUrl?: string
  returnUrl?: string
  metadata?: Record<string, any>
}

// Payment initiation response
interface IremboPaymentResponse {
  success: boolean
  transactionId: string
  paymentUrl: string
  expiresAt: string
  message?: string
  errorCode?: string
}

// Payment verification response
interface IremboVerificationResponse {
  transactionId: string
  status: string
  amount: number
  currency: string
  paidAt?: string
  cardBrand?: string
  cardLast4?: string
  errorMessage?: string
}

// Webhook payload from IremboPay
interface IremboWebhookPayload {
  event: string // 'payment.success' | 'payment.failed' | 'payment.cancelled'
  transactionId: string
  orderId: string
  amount: number
  currency: string
  status: string
  paidAt?: string
  cardBrand?: string
  cardLast4?: string
  signature: string
  timestamp: string
}

export class IremboPayProvider implements IPaymentProvider {
  readonly name = PaymentProviderType.IREMBO_PAY
  private config: IremboPayConfig

  constructor(config?: Partial<IremboPayConfig>) {
    this.config = {
      apiUrl: config?.apiUrl || process.env.IREMBOPAY_API_URL || 'https://api.irembo.com',
      merchantId: config?.merchantId || process.env.IREMBOPAY_MERCHANT_ID || '',
      apiKey: config?.apiKey || process.env.IREMBOPAY_API_KEY || '',
      apiSecret: config?.apiSecret || process.env.IREMBOPAY_API_SECRET || '',
      callbackUrl: config?.callbackUrl || process.env.IREMBOPAY_CALLBACK_URL || `${process.env.APP_URL}/api/webhooks/irembopay`,
      returnUrl: config?.returnUrl || process.env.IREMBOPAY_RETURN_URL || `${process.env.APP_URL}/billing/payment-result`,
    }

    if (!this.config.merchantId || !this.config.apiKey || !this.config.apiSecret) {
      console.warn('[IremboPay] Provider not fully configured. Set IREMBOPAY_MERCHANT_ID, IREMBOPAY_API_KEY, IREMBOPAY_API_SECRET')
    }
  }

  /**
   * Generate HMAC signature for API requests
   */
  private generateSignature(payload: string): string {
    return crypto
      .createHmac('sha256', this.config.apiSecret)
      .update(payload)
      .digest('hex')
  }

  /**
   * Verify webhook signature
   */
  private verifySignature(payload: string, signature: string): boolean {
    const expectedSignature = this.generateSignature(payload)
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  }

  /**
   * Initiate a card payment via IremboPay
   */
  async createPayment(request: PaymentInitiationRequest): Promise<PaymentInitiationResponse> {
    try {
      if (!this.config.merchantId || !this.config.apiKey || !this.config.apiSecret) {
        return {
          success: false,
          error: 'IremboPay provider not configured',
          errorCode: 'CONFIG_ERROR',
        }
      }

      // IremboPay expects amount in major currency units (RWF)
      const amount = Math.round(request.amount / 100)

      const payload: IremboPaymentRequest = {
        merchantId: this.config.merchantId,
        amount,
        currency: request.currency,
        orderId: request.orderId,
        description: request.description,
        customerEmail: request.customerEmail,
        customerName: request.customerName,
        customerPhone: request.customerPhone,
        callbackUrl: request.callbackUrl || this.config.callbackUrl,
        returnUrl: request.returnUrl || this.config.returnUrl,
        metadata: request.metadata,
      }

      const payloadString = JSON.stringify(payload)
      const signature = this.generateSignature(payloadString)

      console.log('[IremboPay] Initiating payment:', {
        orderId: request.orderId,
        amount,
        currency: request.currency,
      })

      const response = await fetch(`${this.config.apiUrl}/v1/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Merchant-ID': this.config.merchantId,
          'X-API-Key': this.config.apiKey,
          'X-Signature': signature,
        },
        body: payloadString,
      })

      if (!response.ok) {
        console.error('[IremboPay] HTTP error:', response.status, response.statusText)
        const errorData = await response.json().catch(() => ({}))
        return {
          success: false,
          error: errorData.message || `IremboPay API error: ${response.statusText}`,
          errorCode: errorData.code || 'HTTP_ERROR',
        }
      }

      const data: IremboPaymentResponse = await response.json()

      console.log('[IremboPay] Payment response:', {
        success: data.success,
        transactionId: data.transactionId,
        paymentUrl: data.paymentUrl,
      })

      // Sanitize and include request/response for auditing
      const { apiKey: _omitKey, apiSecret: _omitSecret, ...safeConfig } = this.config
      const safeRequest = { ...payload, merchantId: '***' }

      if (data.success) {
        return {
          success: true,
          transactionId: data.transactionId,
          providerReference: data.transactionId,
          paymentUrl: data.paymentUrl,
          metadata: {
            iremboExpiresAt: data.expiresAt,
            iremboRequest: safeRequest,
            iremboRawResponse: data,
          },
        }
      } else {
        return {
          success: false,
          error: data.message || 'Payment initiation failed',
          errorCode: data.errorCode || 'PAYMENT_FAILED',
          metadata: {
            iremboRequest: safeRequest,
            iremboRawResponse: data,
          },
        }
      }
    } catch (error: any) {
      console.error('[IremboPay] Payment initiation error:', error)
      return {
        success: false,
        error: error.message || 'Payment initiation exception',
        errorCode: 'EXCEPTION',
      }
    }
  }

  /**
   * Verify payment status
   */
  async verifyPayment(request: PaymentVerificationRequest): Promise<PaymentVerificationResponse> {
    try {
      if (!this.config.merchantId || !this.config.apiKey || !this.config.apiSecret) {
        return {
          success: false,
          status: TransactionStatus.PENDING,
          transactionId: request.transactionId,
          error: 'IremboPay provider not configured',
        }
      }

      const timestamp = Date.now().toString()
      const signature = this.generateSignature(`${request.transactionId}${timestamp}`)

      console.log('[IremboPay] Verifying payment:', request.transactionId)

      const response = await fetch(
        `${this.config.apiUrl}/v1/payments/${request.transactionId}`,
        {
          method: 'GET',
          headers: {
            'X-Merchant-ID': this.config.merchantId,
            'X-API-Key': this.config.apiKey,
            'X-Signature': signature,
            'X-Timestamp': timestamp,
          },
        }
      )

      if (!response.ok) {
        console.error('[IremboPay] Verification HTTP error:', response.status)
        return {
          success: false,
          status: TransactionStatus.PENDING,
          transactionId: request.transactionId,
          error: `Verification failed: ${response.statusText}`,
        }
      }

      const data: IremboVerificationResponse = await response.json()

      const status = this.mapIremboStatus(data.status)

      return {
        success: status === TransactionStatus.SUCCESS,
        status,
        transactionId: data.transactionId,
        providerReference: data.transactionId,
        amount: data.amount * 100, // Convert back to cents
        currency: data.currency,
        paidAt: data.paidAt ? new Date(data.paidAt) : undefined,
        metadata: {
          cardBrand: data.cardBrand,
          cardLast4: data.cardLast4,
          iremboRawResponse: data,
        },
      }
    } catch (error: any) {
      console.error('[IremboPay] Verification error:', error)
      return {
        success: false,
        status: TransactionStatus.PENDING,
        transactionId: request.transactionId,
        error: error.message || 'Verification exception',
      }
    }
  }

  /**
   * Handle incoming webhook from IremboPay
   */
  async handleWebhook(payload: any, signature?: string): Promise<WebhookPayload> {
    console.log('[IremboPay] Webhook received:', payload)

    const data: IremboWebhookPayload = payload

    const status = this.mapIremboStatus(data.status)

    return {
      provider: PaymentProviderType.IREMBO_PAY,
      transactionId: data.transactionId,
      providerReference: data.orderId,
      status,
      amount: data.amount * 100, // Convert to cents
      currency: data.currency,
      timestamp: new Date(data.timestamp),
      signature: data.signature,
      rawPayload: data,
    }
  }

  /**
   * Validate webhook signature
   */
  async validateWebhook(payload: any, signature?: string): Promise<WebhookValidationResult> {
    try {
      if (!signature) {
        console.error('[IremboPay] Webhook signature missing')
        return { valid: false, error: 'Signature missing' }
      }

      // IremboPay includes signature in payload
      const webhookSignature = payload.signature || signature

      // Remove signature from payload for verification
      const { signature: _omit, ...payloadWithoutSignature } = payload
      const payloadString = JSON.stringify(payloadWithoutSignature)

      const isValid = this.verifySignature(payloadString, webhookSignature)

      if (!isValid) {
        console.error('[IremboPay] Invalid webhook signature')
        return { valid: false, error: 'Invalid signature' }
      }

      console.log('[IremboPay] Webhook signature valid')
      return { valid: true }
    } catch (error: any) {
      console.error('[IremboPay] Webhook validation error:', error)
      return { valid: false, error: error.message }
    }
  }

  /**
   * Get transaction status (alias for verifyPayment)
   */
  async getTransactionStatus(transactionId: string): Promise<PaymentVerificationResponse> {
    return this.verifyPayment({ transactionId })
  }

  /**
   * Refund a payment (future implementation)
   */
  async refundPayment(transactionId: string, amount?: number): Promise<PaymentInitiationResponse> {
    // TODO: Implement refund API when available
    console.warn('[IremboPay] Refund not yet implemented')
    return {
      success: false,
      error: 'Refund not yet implemented',
      errorCode: 'NOT_IMPLEMENTED',
    }
  }

  /**
   * Map IremboPay status to unified TransactionStatus
   */
  private mapIremboStatus(iremboStatus: string): TransactionStatus {
    const status = (iremboStatus || '').toLowerCase()

    switch (status) {
      case 'success':
      case 'successful':
      case 'completed':
      case 'paid':
        return TransactionStatus.SUCCESS
      case 'pending':
      case 'processing':
      case 'initiated':
        return TransactionStatus.PROCESSING
      case 'failed':
      case 'failure':
      case 'declined':
        return TransactionStatus.FAILED
      case 'cancelled':
      case 'canceled':
      case 'expired':
        return TransactionStatus.CANCELLED
      case 'refunded':
        return TransactionStatus.REFUNDED
      default:
        console.warn(`[IremboPay] Unknown status: ${iremboStatus}`)
        return TransactionStatus.PENDING
    }
  }
}
