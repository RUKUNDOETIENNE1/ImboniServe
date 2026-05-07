import crypto from 'crypto'
import { v4 as uuidv4 } from 'uuid'

export interface MoMoCollectionParams {
  amount: number
  currency: string
  externalId: string
  payer: {
    partyIdType: 'MSISDN'
    partyId: string
  }
  payerMessage: string
  payeeNote: string
}

export interface MoMoTransactionStatus {
  amount: string
  currency: string
  financialTransactionId: string
  externalId: string
  payer: {
    partyIdType: string
    partyId: string
  }
  status: 'SUCCESSFUL' | 'FAILED' | 'PENDING'
  reason?: string
}

export interface MoMoAccessTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

export class MTNMoMoService {
  private static readonly ENVIRONMENT = process.env.MTN_MOMO_ENVIRONMENT || 'sandbox'
  private static readonly SUBSCRIPTION_KEY = process.env.MTN_MOMO_SUBSCRIPTION_KEY!
  private static readonly API_USER = process.env.MTN_MOMO_API_USER!
  private static readonly API_KEY = process.env.MTN_MOMO_API_KEY!
  private static readonly CALLBACK_HOST = process.env.MTN_MOMO_CALLBACK_HOST || ''
  private static readonly CURRENCY = process.env.MTN_MOMO_CURRENCY || 'RWF'
  private static readonly TARGET_ENVIRONMENT = process.env.MTN_MOMO_TARGET_ENVIRONMENT || 'mtnrwanda'

  private static readonly BASE_URL = this.ENVIRONMENT === 'sandbox'
    ? 'https://sandbox.momodeveloper.mtn.com'
    : 'https://proxy.momoapi.mtn.com'

  private static accessToken: string | null = null
  private static tokenExpiry: number = 0

  static async getAccessToken(): Promise<string> {
    const now = Date.now()
    
    if (this.accessToken && this.tokenExpiry > now + 60000) {
      return this.accessToken
    }

    const authString = Buffer.from(`${this.API_USER}:${this.API_KEY}`).toString('base64')

    const response = await fetch(`${this.BASE_URL}/collection/token/`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Ocp-Apim-Subscription-Key': this.SUBSCRIPTION_KEY,
        'X-Target-Environment': this.TARGET_ENVIRONMENT
      }
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to get access token' }))
      throw new Error(error.message || 'Failed to get access token')
    }

    const result: MoMoAccessTokenResponse = await response.json()
    this.accessToken = result.access_token
    this.tokenExpiry = now + (result.expires_in * 1000)

    return this.accessToken
  }

  static async requestToPay(params: MoMoCollectionParams): Promise<string> {
    const token = await this.getAccessToken()
    const referenceId = uuidv4()

    const payload = {
      amount: params.amount.toString(),
      currency: params.currency || this.CURRENCY,
      externalId: params.externalId,
      payer: params.payer,
      payerMessage: params.payerMessage,
      payeeNote: params.payeeNote
    }

    const callbackUrl = this.CALLBACK_HOST 
      ? `${this.CALLBACK_HOST}/api/payments/mtn-momo/callback`
      : undefined

    const response = await fetch(`${this.BASE_URL}/collection/v1_0/requesttopay`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Reference-Id': referenceId,
        'X-Target-Environment': this.TARGET_ENVIRONMENT,
        'Ocp-Apim-Subscription-Key': this.SUBSCRIPTION_KEY,
        'Content-Type': 'application/json',
        ...(callbackUrl && { 'X-Callback-Url': callbackUrl })
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to initiate payment' }))
      throw new Error(error.message || 'Failed to initiate payment')
    }

    return referenceId
  }

  static async getTransactionStatus(referenceId: string): Promise<MoMoTransactionStatus> {
    const token = await this.getAccessToken()

    const response = await fetch(`${this.BASE_URL}/collection/v1_0/requesttopay/${referenceId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Target-Environment': this.TARGET_ENVIRONMENT,
        'Ocp-Apim-Subscription-Key': this.SUBSCRIPTION_KEY
      }
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to get transaction status' }))
      throw new Error(error.message || 'Failed to get transaction status')
    }

    return await response.json()
  }

  static async getAccountBalance(): Promise<{ availableBalance: string; currency: string }> {
    const token = await this.getAccessToken()

    const response = await fetch(`${this.BASE_URL}/collection/v1_0/account/balance`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Target-Environment': this.TARGET_ENVIRONMENT,
        'Ocp-Apim-Subscription-Key': this.SUBSCRIPTION_KEY
      }
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to get account balance' }))
      throw new Error(error.message || 'Failed to get account balance')
    }

    return await response.json()
  }

  static validatePhoneNumber(phoneNumber: string): boolean {
    const rwandaPattern = /^(\+?250|0)?7[238]\d{7}$/
    return rwandaPattern.test(phoneNumber)
  }

  static normalizePhoneNumber(phoneNumber: string): string {
    let normalized = phoneNumber.replace(/\s+/g, '')
    
    if (normalized.startsWith('+250')) {
      normalized = normalized.substring(4)
    } else if (normalized.startsWith('250')) {
      normalized = normalized.substring(3)
    } else if (normalized.startsWith('0')) {
      normalized = normalized.substring(1)
    }
    
    return `25${normalized}`
  }
}
