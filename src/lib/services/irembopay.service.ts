import crypto from 'crypto'

export interface CreateInvoiceParams {
  businessId: string
  subscriptionId?: string
  amountCents: number
  description: string
  customer: {
    email?: string
    phoneNumber?: string
    name?: string
  }
  language?: string
}

export interface MomoPushParams {
  invoiceNumber: string
  accountIdentifier: string
  paymentProvider: 'MTN' | 'AIRTEL'
}

export interface InvoiceResponse {
  invoiceNumber: string
  transactionId: string
  paymentAccountIdentifier: string
  paymentItems: Array<{
    code: string
    quantity: number
    unitAmount: number
  }>
  paymentStatus: string
  amount: number
  currency: string
  type: string
  createdAt: string
  updatedAt?: string
  expiryAt?: string
  customer?: {
    email?: string
    phoneNumber?: string
    name?: string
  }
  description?: string
  paymentLinkUrl: string
}

export interface MomoPushResponse {
  accountIdentifier: string
  paymentProvider: string
  invoiceNumber: string
  amount: number
  referenceId: string
}

/**
 * Security: Fail-closed payment API base resolution.
 *
 * In production, IREMBOPAY_API_BASE MUST be explicitly set.  Silently
 * falling back to the sandbox URL would cause real customer payments to
 * be processed against the test environment, which could lose money and
 * corrupt financial state.
 *
 * In development / test, the sandbox URL is retained as a convenience
 * default so local workflows keep working.
 */
const isProductionEnv = process.env.NODE_ENV === 'production'
const IREMBOPAY_API_BASE_RESOLVED = (() => {
  const v = process.env.IREMBOPAY_API_BASE
  if (v) return v
  if (isProductionEnv) {
    throw new Error(
      'SECURITY FATAL: IREMBOPAY_API_BASE is not set in production. ' +
      'Refusing to default to the sandbox API. Set IREMBOPAY_API_BASE to the production IremboPay API URL.'
    )
  }
  return 'https://api.sandbox.irembopay.com'
})()

export class IremboPayService {
  private static readonly API_BASE = IREMBOPAY_API_BASE_RESOLVED
  private static readonly SECRET_KEY = process.env.IREMBOPAY_SECRET_KEY!
  private static readonly PUBLIC_KEY = process.env.IREMBOPAY_PUBLIC_KEY!
  private static readonly PAYMENT_ACCOUNT = process.env.IREMBOPAY_PAYMENT_ACCOUNT!
  private static readonly PAYMENT_ITEM_CODE = process.env.IREMBOPAY_PAYMENT_ITEM_CODE!
  private static readonly API_VERSION = process.env.IREMBOPAY_API_VERSION || '2'
  private static readonly WEBHOOK_TOLERANCE_SECONDS = parseInt(process.env.IREMBOPAY_WEBHOOK_TOLERANCE_SECONDS || '300')

  static async createInvoice(params: CreateInvoiceParams): Promise<InvoiceResponse> {
    const transactionId = `IMBONI-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const expiryAt = new Date(Date.now() + 20 * 60 * 1000).toISOString()

    const payload = {
      transactionId,
      paymentAccountIdentifier: this.PAYMENT_ACCOUNT,
      paymentItems: [{
        code: this.PAYMENT_ITEM_CODE,
        quantity: 1,
        unitAmount: params.amountCents / 100 // Convert cents to RWF
      }],
      expiryAt,
      description: params.description,
      customer: params.customer,
      language: params.language || 'EN'
    }

    const response = await fetch(`${this.API_BASE}/payments/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'irembopay-secretKey': this.SECRET_KEY,
        'X-API-Version': this.API_VERSION
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to create invoice' }))
      throw new Error(error.message || 'Failed to create invoice')
    }

    const result = await response.json()
    return result.data
  }

  static async getInvoiceStatus(invoiceNumber: string): Promise<InvoiceResponse> {
    const response = await fetch(`${this.API_BASE}/payments/invoices/${invoiceNumber}`, {
      headers: {
        'irembopay-secretKey': this.SECRET_KEY,
        'X-API-Version': this.API_VERSION
      }
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to fetch invoice status' }))
      throw new Error(error.message || 'Failed to fetch invoice status')
    }

    const result = await response.json()
    return result.data
  }

  static async initiateMomoPush(params: MomoPushParams): Promise<MomoPushResponse> {
    const response = await fetch(`${this.API_BASE}/payments/transactions/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'irembopay-secretKey': this.SECRET_KEY,
        'X-API-Version': this.API_VERSION
      },
      body: JSON.stringify({
        accountIdentifier: params.accountIdentifier,
        paymentProvider: params.paymentProvider,
        invoiceNumber: params.invoiceNumber
      })
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to initiate MoMo push' }))
      throw new Error(error.message || 'Failed to initiate MoMo push')
    }

    const result = await response.json()
    return result.data
  }

  static verifyWebhookSignature(signatureHeader: string, rawBody: string): boolean {
    try {
      if (!signatureHeader) {
        console.error('No signature header provided')
        return false
      }

      const parts = signatureHeader.split(',')
      const timestamp = parts.find(p => p.trim().startsWith('t='))?.split('=')[1]?.trim()
      const signature = parts.find(p => p.trim().startsWith('s='))?.split('=')[1]?.trim()

      if (!timestamp || !signature) {
        console.error('Invalid signature format')
        return false
      }

      // Check timestamp tolerance (default 5 minutes)
      const now = Date.now()
      const webhookTime = parseInt(timestamp)
      const tolerance = this.WEBHOOK_TOLERANCE_SECONDS * 1000
      
      if (Math.abs(now - webhookTime) > tolerance) {
        console.error('Webhook timestamp outside tolerance', {
          now,
          webhookTime,
          diff: Math.abs(now - webhookTime),
          tolerance
        })
        return false
      }

      // Compute expected signature: HMAC_SHA256(secret, timestamp#rawBody)
      const signedPayload = `${timestamp}#${rawBody}`
      const expectedSignature = crypto
        .createHmac('sha256', this.SECRET_KEY)
        .update(signedPayload)
        .digest('hex')

      // Constant-time comparison
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      )
    } catch (error) {
      console.error('Signature verification error:', error)
      return false
    }
  }

  static getPublicKey(): string {
    return this.PUBLIC_KEY
  }

  static calculateVATAmounts(grossAmountCents: number, taxRate: number = 0): {
    vatAmountCents: number
    exVatAmountCents: number
  } {
    // VAT = gross * taxRate / (100 + taxRate) (for tax-inclusive pricing)
    // taxRate defaults to 0 — no tax unless configured by the business
    const vatAmountCents = Math.round(grossAmountCents * taxRate / (100 + taxRate))
    const exVatAmountCents = grossAmountCents - vatAmountCents

    return {
      vatAmountCents,
      exVatAmountCents
    }
  }

  static calculateGatewayFee(grossAmountCents: number): number {
    // Gateway fee is 3.42% of gross amount
    return Math.round(grossAmountCents * 0.0342)
  }

  static calculateNetToBusinessCents(
    grossAmountCents: number,
    vatAmountCents: number,
    gatewayFeeCents: number
  ): number {
    // Net = gross - VAT - gateway fee
    return grossAmountCents - vatAmountCents - gatewayFeeCents
  }
}
