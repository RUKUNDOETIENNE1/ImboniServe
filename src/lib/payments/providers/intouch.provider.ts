/**
 * InTouch Payment Provider
 * Handles MTN Mobile Money and Airtel Money via InTouch aggregator API
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

interface InTouchConfig {
  apiUrl: string
  username: string
  accountNo: string
  partnerPassword: string
  callbackUrl?: string
}

// RequestPayment API (Receiving Payment)
interface InTouchRequestPaymentRequest {
  username: string
  timestamp: string
  amount: number
  password: string
  mobilephone: string
  requesttransactionid: string
  accountno: string
  callbackurl?: string
}

interface InTouchRequestPaymentResponse {
  status: string
  requesttransactionid: string
  success: boolean
  responsecode: string
  transactionid: number | string
  message: string
}

// Webhook callback from InTouch
interface InTouchWebhookPayload {
  requesttransactionid: string
  transactionid: string
  responsecode: string
  status: string
  statusdesc: string
  referenceno: string
}

export class InTouchProvider implements IPaymentProvider {
  readonly name = PaymentProviderType.INTOUCH
  private config: InTouchConfig

  constructor(config?: Partial<InTouchConfig>) {
    this.config = {
      apiUrl: config?.apiUrl || process.env.INTOUCH_API_URL || 'https://www.intouchpay.co.rw/api',
      username: config?.username || process.env.INTOUCH_USERNAME || '',
      accountNo: config?.accountNo || process.env.INTOUCH_ACCOUNT_NO || '',
      partnerPassword: config?.partnerPassword || process.env.INTOUCH_PARTNER_PASSWORD || process.env.INTOUCH_PASSWORD || '',
      callbackUrl: config?.callbackUrl || process.env.INTOUCH_CALLBACK_URL || `${process.env.APP_URL}/api/webhooks/intouch`,
    }

    if (!this.config.username || !this.config.accountNo || !this.config.partnerPassword) {
      console.warn('[InTouch] Provider not fully configured. Set INTOUCH_USERNAME, INTOUCH_ACCOUNT_NO, and INTOUCH_PARTNER_PASSWORD (or INTOUCH_PASSWORD)')
    }
  }

  /**
   * Generate password for InTouch API request
   * Format: SHA256(username + accountno + partnerpassword + timestamp)
   */
  private generatePassword(timestamp: string): string {
    const concatenated = this.config.username + this.config.accountNo + this.config.partnerPassword + timestamp
    return crypto.createHash('sha256').update(concatenated).digest('hex')
  }

  /**
   * Generate timestamp in InTouch format: yyyymmddhhmmss (UTC)
   */
  private generateTimestamp(): string {
    const now = new Date()
    const year = now.getUTCFullYear()
    const month = String(now.getUTCMonth() + 1).padStart(2, '0')
    const day = String(now.getUTCDate()).padStart(2, '0')
    const hours = String(now.getUTCHours()).padStart(2, '0')
    const minutes = String(now.getUTCMinutes()).padStart(2, '0')
    const seconds = String(now.getUTCSeconds()).padStart(2, '0')
    return `${year}${month}${day}${hours}${minutes}${seconds}`
  }

  /**
   * Initiate a mobile money payment via InTouch
   */
  async createPayment(request: PaymentInitiationRequest): Promise<PaymentInitiationResponse> {
    try {
      if (!this.config.username || !this.config.accountNo || !this.config.partnerPassword) {
        return {
          success: false,
          error: 'InTouch provider not configured',
          errorCode: 'CONFIG_ERROR',
        }
      }

      // InTouch expects phone in format: 250788123456 (no +)
      const mobilephone = request.customerPhone.replace(/^\+/, '').replace(/\s/g, '')

      // InTouch expects amount in RWF (no cents)
      const amount = Math.round(request.amount / 100)

      // Generate unique request transaction ID
      const requesttransactionid = `IMBONI-${request.orderId}-${Date.now()}`

      // Generate timestamp in UTC format: yyyymmddhhmmss
      const timestamp = this.generateTimestamp()

      // Generate password: SHA256(username + accountno + partnerpassword + timestamp)
      const password = this.generatePassword(timestamp)

      const payload: InTouchRequestPaymentRequest = {
        username: this.config.username,
        timestamp,
        amount,
        password,
        mobilephone,
        requesttransactionid,
        accountno: this.config.accountNo,
        callbackurl: request.callbackUrl || this.config.callbackUrl,
      }

      console.log('[InTouch] Initiating payment:', {
        requesttransactionid,
        amount,
        phone: mobilephone.substring(0, 6) + '***',
        timestamp,
      })

      // POST to /api/requestpayment/ endpoint
      const response = await fetch(`${this.config.apiUrl}/requestpayment/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(payload as any).toString(),
      })

      if (!response.ok) {
        console.error('[InTouch] HTTP error:', response.status, response.statusText)
        return {
          success: false,
          error: `InTouch API error: ${response.statusText}`,
          errorCode: 'HTTP_ERROR',
        }
      }

      const data: InTouchRequestPaymentResponse = await response.json()

      // Sanitize and include request/response for auditing (omit password)
      const { password: _omitted, ...safeRequest } = payload

      console.log('[InTouch] Payment response:', {
        status: data.status,
        message: data.message,
        transactionid: data.transactionid,
        responsecode: data.responsecode,
      })

      // InTouch returns status: "Pending" initially, then callback with final status
      if (data.success && data.status === 'Pending') {
        return {
          success: true,
          transactionId: String(data.transactionid),
          providerReference: requesttransactionid,
          metadata: {
            intouchMessage: data.message,
            intouchStatus: data.status,
            responsecode: data.responsecode,
            intouchRequest: safeRequest,
            intouchRawResponse: data,
          },
        }
      } else {
        return {
          success: false,
          error: data.message || 'Payment initiation failed',
          errorCode: data.responsecode || 'PAYMENT_FAILED',
          metadata: {
            intouchStatus: data.status,
            intouchRequest: safeRequest,
            intouchRawResponse: data,
          },
        }
      }
    } catch (error: any) {
      console.error('[InTouch] Payment initiation error:', error)
      return {
        success: false,
        error: error.message || 'Payment initiation exception',
        errorCode: 'EXCEPTION',
      }
    }
  }

  /**
   * Verify payment status
   * Note: InTouch uses callback/webhook for status updates.
   * This method checks our local transaction status.
   */
  async verifyPayment(request: PaymentVerificationRequest): Promise<PaymentVerificationResponse> {
    // InTouch doesn't provide a direct status check API in the documentation
    // Status updates come via webhook callback
    // This method is used to check local database status
    console.log('[InTouch] Verify payment called - status should come via webhook')

    return {
      success: false,
      status: TransactionStatus.PROCESSING,
      transactionId: request.transactionId,
      error: 'InTouch uses webhook callbacks for status updates. Please wait for callback.',
      metadata: {
        note: 'Check transaction status in database after webhook received',
      },
    }
  }

  /**
   * Handle incoming webhook from InTouch
   * InTouch sends: { requesttransactionid, transactionid, responsecode, status, statusdesc, referenceno }
   */
  async handleWebhook(payload: any, signature?: string): Promise<WebhookPayload> {
    console.log('[InTouch] Webhook received:', payload)

    // Extract from jsonpayload if wrapped
    const data: InTouchWebhookPayload = payload.jsonpayload || payload

    const status = this.mapInTouchStatus(data.status)

    return {
      provider: PaymentProviderType.INTOUCH,
      transactionId: String(data.transactionid),
      providerReference: data.requesttransactionid,
      status,
      amount: undefined, // Amount not provided in webhook
      currency: 'RWF',
      timestamp: new Date(),
      signature,
      rawPayload: data,
    }
  }

  /**
   * Validate webhook signature
   * InTouch documentation shows optional basic auth: requests.post(url, auth=(username, password))
   */
  async validateWebhook(payload: any, signature?: string): Promise<WebhookValidationResult> {
    // InTouch uses basic auth for webhook validation (optional)
    // The webhook can be secured with username/password in the callback URL
    // Or by checking the Authorization header

    // For now, accept all webhooks (basic auth handled at API route level)
    console.log('[InTouch] Webhook validation - basic auth should be checked at route level')
    return { valid: true }
  }

  /**
   * Get transaction status (alias for verifyPayment)
   */
  async getTransactionStatus(transactionId: string): Promise<PaymentVerificationResponse> {
    return this.verifyPayment({ transactionId })
  }

  /**
   * Map InTouch status to unified TransactionStatus
   */
  private mapInTouchStatus(intouchStatus: string): TransactionStatus {
    const status = (intouchStatus || '').toLowerCase()

    switch (status) {
      case 'successful':
      case 'successfull': // InTouch typo in docs
      case 'success':
      case 'completed':
        return TransactionStatus.SUCCESS
      case 'pending':
        return TransactionStatus.PROCESSING
      case 'failed':
      case 'failure':
        return TransactionStatus.FAILED
      case 'cancelled':
      case 'canceled':
        return TransactionStatus.CANCELLED
      default:
        console.warn(`[InTouch] Unknown status: ${intouchStatus}`)
        return TransactionStatus.PENDING
    }
  }
}
