/**
 * InTouch Mobile Money Payment Service
 * Integrates with InTouch API for MTN Mobile Money and Airtel Money payments
 * Documentation: https://www.intouchpay.co.rw/api
 * 
 * ⚠️ DEPRECATED: This service is legacy and should NOT be used in new code.
 * Use PaymentProviderFactory.getProvider(PaymentProviderType.INTOUCH) instead.
 * This file remains for backward compatibility during migration only.
 * 
 * Migration path:
 * - Replace InTouchService.requestPayment() with provider.createPayment()
 * - Replace InTouchService.checkStatus() with provider.verifyPayment()
 * - All new payment flows MUST use PaymentProviderFactory
 */

import crypto from 'crypto'
import { normalizePhoneForProvider } from '@/lib/utils/phone'

interface RequestPaymentParams {
  amount: number
  mobilePhoneNo: string
  requestTransactionId: string
  callbackUrl?: string
}

interface RequestDepositParams {
  amount: number
  mobilePhoneNo: string
  requestTransactionId: string
  callbackUrl?: string
}

interface InTouchResponse {
  responsecode: string
  responsemsg: string
  transactionid?: string
  requesttransactionid?: string
}

interface BalanceResponse {
  responsecode: string
  responsemsg: string
  balance?: number
}

export class InTouchService {
  private static readonly API_URL = process.env.INTOUCH_API_URL || 'https://www.intouchpay.co.rw/api'
  private static readonly USERNAME = process.env.INTOUCH_USERNAME || ''
  private static readonly ACCOUNT_NO = process.env.INTOUCH_ACCOUNT_NO || ''
  private static readonly PASSWORD = process.env.INTOUCH_PASSWORD || process.env.INTOUCH_PARTNER_PASSWORD || ''

  /**
   * Generate SHA256 password hash
   * Format: SHA256(username + accountno + partnerpassword + timestamp)
   */
  private static generatePassword(timestamp: string): string {
    const raw = this.USERNAME + this.ACCOUNT_NO + this.PASSWORD + timestamp
    return crypto.createHash('sha256').update(raw).digest('hex')
  }

  /**
   * Generate timestamp in UTC format: yyyymmddhhmmss
   */
  private static generateTimestamp(): string {
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
   * Request payment from customer (debit)
   * Customer will receive USSD prompt to approve via *182#
   */
  static async requestPayment(params: RequestPaymentParams): Promise<InTouchResponse> {
    if (!this.USERNAME || !this.ACCOUNT_NO || !this.PASSWORD) {
      throw new Error('InTouch credentials not configured')
    }

    const timestamp = this.generateTimestamp()
    const password = this.generatePassword(timestamp)
    const mobilePhoneNo = normalizePhoneForProvider(params.mobilePhoneNo)

    const payload = {
      username: this.USERNAME,
      timestamp,
      amount: params.amount.toString(),
      mobilephoneno: mobilePhoneNo,
      requesttransactionid: params.requestTransactionId,
      accountno: this.ACCOUNT_NO,
      password,
      ...(params.callbackUrl && { callbackurl: params.callbackUrl }),
    }

    console.log('[InTouch] Request Payment:', {
      requestTransactionId: params.requestTransactionId,
      amount: params.amount,
      phone: mobilePhoneNo,
    })

    try {
      // PAY-002 (http_intouchpay_api_v1.2.pdf, Section 1.2): "Parameters are
      // submitted to the intouchpay url as http-form post." The RequestPayment
      // example (2.3) confirms this via requests.post(url, data=data). JSON
      // encoding does not conform to the documented protocol.
      const response = await fetch(`${this.API_URL}/requestpayment/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(payload as Record<string, string>).toString(),
      })

      const data: InTouchResponse = await response.json()

      console.log('[InTouch] Response:', {
        code: data.responsecode,
        message: data.responsemsg,
        transactionId: data.transactionid,
      })

      return data
    } catch (error) {
      console.error('[InTouch] Request Payment failed:', error)
      throw new Error('Failed to initiate payment request')
    }
  }

  /**
   * Request deposit to customer (credit)
   * Used for refunds or payouts
   */
  static async requestDeposit(params: RequestDepositParams): Promise<InTouchResponse> {
    if (!this.USERNAME || !this.ACCOUNT_NO || !this.PASSWORD) {
      throw new Error('InTouch credentials not configured')
    }

    const timestamp = this.generateTimestamp()
    const password = this.generatePassword(timestamp)
    const mobilePhoneNo = normalizePhoneForProvider(params.mobilePhoneNo)

    const payload = {
      username: this.USERNAME,
      timestamp,
      amount: params.amount.toString(),
      mobilephoneno: mobilePhoneNo,
      requesttransactionid: params.requestTransactionId,
      accountno: this.ACCOUNT_NO,
      password,
      ...(params.callbackUrl && { callbackurl: params.callbackUrl }),
    }

    console.log('[InTouch] Request Deposit:', {
      requestTransactionId: params.requestTransactionId,
      amount: params.amount,
      phone: mobilePhoneNo,
    })

    try {
      // PAY-002 (http_intouchpay_api_v1.2.pdf, Section 1.2 + 3.3 example):
      // RequestDeposit is documented and exemplified as an http-form POST,
      // same as RequestPayment.
      const response = await fetch(`${this.API_URL}/requestdeposit/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(payload as Record<string, string>).toString(),
      })

      const data: InTouchResponse = await response.json()

      console.log('[InTouch] Deposit Response:', {
        code: data.responsecode,
        message: data.responsemsg,
        transactionId: data.transactionid,
      })

      return data
    } catch (error) {
      console.error('[InTouch] Request Deposit failed:', error)
      throw new Error('Failed to initiate deposit request')
    }
  }

  /**
   * Get InTouch account balance
   */
  static async getBalance(): Promise<BalanceResponse> {
    if (!this.USERNAME || !this.ACCOUNT_NO || !this.PASSWORD) {
      throw new Error('InTouch credentials not configured')
    }

    const timestamp = this.generateTimestamp()
    const password = this.generatePassword(timestamp)

    const payload = {
      username: this.USERNAME,
      timestamp,
      accountno: this.ACCOUNT_NO,
      password,
    }

    try {
      // PAY-002 (http_intouchpay_api_v1.2.pdf, Section 5.3 example): GetBalance
      // is exemplified as requests.post(url, data=data) — http-form POST.
      const response = await fetch(`${this.API_URL}/getbalance/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(payload as Record<string, string>).toString(),
      })

      const data: BalanceResponse = await response.json()

      console.log('[InTouch] Balance:', {
        code: data.responsecode,
        balance: data.balance,
      })

      return data
    } catch (error) {
      console.error('[InTouch] Get Balance failed:', error)
      throw new Error('Failed to retrieve balance')
    }
  }

  /**
   * Get transaction status (GetTransactionStatus)
   *
   * PAY-002 (http_intouchpay_api_v1.2.pdf, Section 4): the documented endpoint
   * is `/api/gettransactionstatus/`, not `/api/paymentstatus/` (the latter does
   * not appear anywhere in the supplied provider document). Both
   * `requesttransactionid` and `transactionid` are Mandatory per the Section 4.5
   * parameter table — `transactionid` is the provider's own numeric transaction
   * id, normally captured from the initial RequestPayment response
   * (`rawCallback.transactionid`). If it is not yet known (e.g. RequestPayment
   * never completed), the call still proceeds with `requesttransactionid` only;
   * InTouch's exact behavior for a missing `transactionid` is
   * PROVIDER-CONFIRMATION-REQUIRED (see PAY-002-TransactionStatus-Audit.md).
   *
   * Encoding: the Section 4.3 example uses `requests.post(url, json=data)`
   * (JSON), which contradicts the general "http-form post" statement in
   * Section 1.2. Because this is the API-specific example, JSON encoding is
   * used here — this ambiguity is documented, not silently assumed.
   */
  static async getPaymentStatus(requestTransactionId: string, transactionId?: string): Promise<InTouchResponse> {
    if (!this.USERNAME || !this.ACCOUNT_NO || !this.PASSWORD) {
      throw new Error('InTouch credentials not configured')
    }

    const timestamp = this.generateTimestamp()
    const password = this.generatePassword(timestamp)

    const payload = {
      username: this.USERNAME,
      timestamp,
      requesttransactionid: requestTransactionId,
      ...(transactionId ? { transactionid: transactionId } : {}),
      accountno: this.ACCOUNT_NO,
      password,
    }

    try {
      const response = await fetch(`${this.API_URL}/gettransactionstatus/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data: InTouchResponse = await response.json()

      console.log('[InTouch] Transaction Status:', {
        requestTransactionId,
        transactionId,
        code: data.responsecode,
        message: data.responsemsg,
      })

      return data
    } catch (error) {
      console.error('[InTouch] Get Payment Status failed:', error)
      throw new Error('Failed to retrieve payment status')
    }
  }

  /**
   * Generate unique request transaction ID
   * Format: IMBONI_timestamp_random
   */
  static generateRequestTransactionId(): string {
    const timestamp = Date.now()
    const random = crypto.randomBytes(4).toString('hex')
    return `IMBONI_${timestamp}_${random}`
  }

  /**
   * Map InTouch response codes to user-friendly messages
   */
  static getErrorMessage(responseCode?: string): string {
    if (!responseCode) {
      return 'Unexpected response from InTouch (no response code returned). Please verify your InTouch credentials and test account.'
    }

    const errorMessages: Record<string, string> = {
      // Success codes
      '01': 'Payment successful',
      '1000': 'Transaction pending approval',
      // PAY-002 (doc Section 3.7): 1110 is "Duplicate Remit ID" — a
      // RequestDeposit FAILURE code, not a success code. Corrected from a
      // prior incorrect "Request successful" label.
      '1110': 'Duplicate deposit request ID (RequestDeposit only)',
      // PAY-002 (doc Section 4.7): 2001 is "Transaction Successful for Deposit
      // Transaction" — deposit success, distinct from payment success ('01').
      '2001': 'Deposit successful',
      
      // Error codes
      '0002': 'Missing username information',
      '0003': 'Missing password information',
      '0004': 'Missing date information',
      '0005': 'Invalid password',
      '0006': 'User does not have an InTouch account',
      '0007': 'No such user',
      '0008': 'Failed to authenticate',
      '1002': 'Phone number not registered for Mobile Money',
      '1005': 'Insufficient funds. Please top up and try again.',
      '1008': 'General failure',
      '1100': 'Error in request',
      '1102': 'Invalid phone number format',
      '1103': 'Amount exceeds maximum limit',
      '1104': 'Amount below minimum limit',
      '1105': 'Network not supported (use MTN or Airtel)',
      '1108': 'Insufficient account balance',
      '2100': 'Amount must be greater than 0',
      '2400': 'Duplicate transaction ID',
      '2600': 'Network timeout. Please try again.',
    }

    return errorMessages[responseCode] || `Unknown error from InTouch (code: ${responseCode})`
  }

  /**
   * Check if response code indicates a successful CUSTOMER PAYMENT.
   *
   * PAY-002 (http_intouchpay_api_v1.2.pdf, Section 4.7): the provider document
   * explicitly distinguishes `01` ("Transaction Successful for Payment
   * Transaction") from `2001` ("Transaction Successful for Deposit
   * Transaction"). This method is used exclusively in customer-payment
   * contexts (RequestPayment initiation, GetTransactionStatus polling for
   * Tap & Leave) and must never report a deposit-success code as a payment
   * success. `1110` was previously (incorrectly) included here; per Section
   * 3.7 it is "Duplicate Remit ID", a RequestDeposit FAILURE code that does
   * not appear in the RequestPayment (2.9) or GetTransactionStatus (4.7)
   * tables at all.
   */
  static isSuccess(responseCode?: string): boolean {
    return responseCode === '01'
  }

  /**
   * Check if response code indicates pending
   */
  static isPending(responseCode?: string): boolean {
    return responseCode === '1000'
  }
}
