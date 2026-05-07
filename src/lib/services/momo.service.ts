import crypto from 'crypto'

export interface MoMoPaymentRequest {
  amountCents: number
  currency: string
  orderId: string
  orderNumber: string
  customerPhone: string
  customerName?: string
  provider: 'MTN' | 'AIRTEL'
}

export interface MoMoPaymentResponse {
  success: boolean
  transactionId?: string
  reference?: string
  error?: string
  errorCode?: string
  statusCheckUrl?: string
}

export interface MoMoStatusResponse {
  status: 'PENDING' | 'SUCCESSFUL' | 'FAILED' | 'TIMEOUT'
  transactionId: string
  reference: string
  amount?: number
  currency?: string
  reason?: string
  payer?: {
    partyIdType?: string
    partyId?: string
  }
}

/**
 * Enhanced Mobile Money Service
 * Supports MTN MoMo and Airtel Money with proper error handling
 */
export class MoMoService {
  
  /**
   * Initiate MTN MoMo payment (Request to Pay)
   */
  static async initiateMTNPayment(request: MoMoPaymentRequest): Promise<MoMoPaymentResponse> {
    if (!process.env.MTN_MOMO_API_KEY || !process.env.MTN_MOMO_SUBSCRIPTION_KEY) {
      return {
        success: false,
        error: 'MTN MoMo not configured. Please contact support.',
        errorCode: 'CONFIG_MISSING'
      }
    }

    try {
      const reference = `MTN-${request.orderNumber}-${Date.now()}`
      const xReferenceId = crypto.randomUUID()

      // Clean phone number: remove +250 and ensure it's 9 digits
      const cleanPhone = request.customerPhone.replace(/^\+?250/, '').replace(/\s/g, '')
      if (cleanPhone.length !== 9) {
        return {
          success: false,
          error: 'Invalid phone number. Must be 9 digits (e.g., 788123456)',
          errorCode: 'INVALID_PHONE'
        }
      }

      const payload = {
        amount: (request.amountCents / 100).toString(),
        currency: request.currency,
        externalId: reference,
        payer: {
          partyIdType: 'MSISDN',
          partyId: '250' + cleanPhone // MTN expects full number with country code
        },
        payerMessage: `Payment for order ${request.orderNumber}`,
        payeeNote: `ImboniServe - Order ${request.orderNumber}`
      }

      const apiUrl = process.env.MTN_MOMO_API_URL || 'https://sandbox.momodeveloper.mtn.com'
      const environment = process.env.MTN_MOMO_ENVIRONMENT || 'sandbox'

      console.log('[MTN MoMo] Initiating payment:', {
        reference,
        xReferenceId,
        amount: payload.amount,
        phone: payload.payer.partyId,
        environment
      })

      const response = await fetch(
        `${apiUrl}/collection/v1_0/requesttopay`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.MTN_MOMO_API_KEY}`,
            'X-Reference-Id': xReferenceId,
            'X-Target-Environment': environment,
            'Ocp-Apim-Subscription-Key': process.env.MTN_MOMO_SUBSCRIPTION_KEY
          },
          body: JSON.stringify(payload)
        }
      )

      if (response.status === 202 || response.ok) {
        return {
          success: true,
          transactionId: xReferenceId,
          reference: reference,
          statusCheckUrl: `/api/payments/momo/status/${xReferenceId}`
        }
      } else {
        const errorText = await response.text().catch(() => 'Unknown error')
        console.error('[MTN MoMo] Payment failed:', response.status, errorText)
        
        return {
          success: false,
          error: this.getMTNErrorMessage(response.status),
          errorCode: `HTTP_${response.status}`
        }
      }
    } catch (error: any) {
      console.error('[MTN MoMo] Exception:', error)
      return {
        success: false,
        error: 'Failed to initiate payment. Please try again.',
        errorCode: 'EXCEPTION'
      }
    }
  }

  /**
   * Initiate Airtel Money payment
   */
  static async initiateAirtelPayment(request: MoMoPaymentRequest): Promise<MoMoPaymentResponse> {
    if (!process.env.AIRTEL_MONEY_CLIENT_ID || !process.env.AIRTEL_MONEY_CLIENT_SECRET) {
      return {
        success: false,
        error: 'Airtel Money not configured. Please contact support.',
        errorCode: 'CONFIG_MISSING'
      }
    }

    try {
      // Get access token first
      const token = await this.getAirtelToken()
      if (!token) {
        return {
          success: false,
          error: 'Failed to authenticate with Airtel Money',
          errorCode: 'AUTH_FAILED'
        }
      }

      const reference = `AIRTEL-${request.orderNumber}-${Date.now()}`
      
      // Clean phone number
      const cleanPhone = request.customerPhone.replace(/^\+?250/, '').replace(/\s/g, '')
      if (cleanPhone.length !== 9) {
        return {
          success: false,
          error: 'Invalid phone number. Must be 9 digits (e.g., 788123456)',
          errorCode: 'INVALID_PHONE'
        }
      }

      const payload = {
        reference: reference,
        subscriber: {
          country: 'RW',
          currency: request.currency,
          msisdn: '250' + cleanPhone
        },
        transaction: {
          amount: request.amountCents / 100,
          country: 'RW',
          currency: request.currency,
          id: reference
        }
      }

      const apiUrl = process.env.AIRTEL_MONEY_API_URL || 'https://openapiuat.airtel.africa'

      console.log('[Airtel Money] Initiating payment:', {
        reference,
        amount: payload.transaction.amount,
        phone: payload.subscriber.msisdn
      })

      const response = await fetch(
        `${apiUrl}/merchant/v1/payments/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'X-Country': 'RW',
            'X-Currency': request.currency
          },
          body: JSON.stringify(payload)
        }
      )

      if (response.ok) {
        const data = await response.json()
        const transactionId = data.data?.transaction?.id || reference
        
        return {
          success: true,
          transactionId: transactionId,
          reference: reference,
          statusCheckUrl: `/api/payments/momo/status/${transactionId}`
        }
      } else {
        const errorText = await response.text().catch(() => 'Unknown error')
        console.error('[Airtel Money] Payment failed:', response.status, errorText)
        
        return {
          success: false,
          error: 'Failed to initiate Airtel Money payment. Please try again.',
          errorCode: `HTTP_${response.status}`
        }
      }
    } catch (error: any) {
      console.error('[Airtel Money] Exception:', error)
      return {
        success: false,
        error: 'Failed to initiate payment. Please try again.',
        errorCode: 'EXCEPTION'
      }
    }
  }

  /**
   * Check MTN MoMo payment status
   */
  static async checkMTNStatus(transactionId: string): Promise<MoMoStatusResponse> {
    try {
      const apiUrl = process.env.MTN_MOMO_API_URL || 'https://sandbox.momodeveloper.mtn.com'
      const environment = process.env.MTN_MOMO_ENVIRONMENT || 'sandbox'

      const response = await fetch(
        `${apiUrl}/collection/v1_0/requesttopay/${transactionId}`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.MTN_MOMO_API_KEY}`,
            'X-Target-Environment': environment,
            'Ocp-Apim-Subscription-Key': process.env.MTN_MOMO_SUBSCRIPTION_KEY || ''
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        
        return {
          status: data.status === 'SUCCESSFUL' ? 'SUCCESSFUL' : 
                  data.status === 'FAILED' ? 'FAILED' : 
                  data.status === 'PENDING' ? 'PENDING' : 'TIMEOUT',
          transactionId: transactionId,
          reference: data.externalId || transactionId,
          amount: data.amount ? parseFloat(data.amount) : undefined,
          currency: data.currency,
          reason: data.reason,
          payer: data.payer
        }
      } else {
        console.error('[MTN MoMo] Status check failed:', response.status)
        return {
          status: 'TIMEOUT',
          transactionId: transactionId,
          reference: transactionId,
          reason: 'Failed to check status'
        }
      }
    } catch (error: any) {
      console.error('[MTN MoMo] Status check exception:', error)
      return {
        status: 'TIMEOUT',
        transactionId: transactionId,
        reference: transactionId,
        reason: error.message
      }
    }
  }

  /**
   * Check Airtel Money payment status
   */
  static async checkAirtelStatus(transactionId: string): Promise<MoMoStatusResponse> {
    try {
      const token = await this.getAirtelToken()
      if (!token) {
        return {
          status: 'TIMEOUT',
          transactionId: transactionId,
          reference: transactionId,
          reason: 'Authentication failed'
        }
      }

      const apiUrl = process.env.AIRTEL_MONEY_API_URL || 'https://openapiuat.airtel.africa'

      const response = await fetch(
        `${apiUrl}/standard/v1/payments/${transactionId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Country': 'RW',
            'X-Currency': 'RWF'
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        const txStatus = data.data?.transaction?.status
        
        return {
          status: txStatus === 'TS' ? 'SUCCESSFUL' : 
                  txStatus === 'TF' ? 'FAILED' : 
                  txStatus === 'TA' ? 'PENDING' : 'TIMEOUT',
          transactionId: transactionId,
          reference: transactionId,
          amount: data.data?.transaction?.amount,
          currency: data.data?.transaction?.currency,
          reason: data.data?.transaction?.message
        }
      } else {
        console.error('[Airtel Money] Status check failed:', response.status)
        return {
          status: 'TIMEOUT',
          transactionId: transactionId,
          reference: transactionId,
          reason: 'Failed to check status'
        }
      }
    } catch (error: any) {
      console.error('[Airtel Money] Status check exception:', error)
      return {
        status: 'TIMEOUT',
        transactionId: transactionId,
        reference: transactionId,
        reason: error.message
      }
    }
  }

  /**
   * Get Airtel Money access token
   */
  private static async getAirtelToken(): Promise<string | null> {
    try {
      const apiUrl = process.env.AIRTEL_MONEY_API_URL || 'https://openapiuat.airtel.africa'
      const clientId = process.env.AIRTEL_MONEY_CLIENT_ID
      const clientSecret = process.env.AIRTEL_MONEY_CLIENT_SECRET

      const response = await fetch(
        `${apiUrl}/auth/oauth2/token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: 'client_credentials'
          })
        }
      )

      if (response.ok) {
        const data = await response.json()
        return data.access_token
      }
      
      return null
    } catch (error) {
      console.error('[Airtel Money] Token fetch failed:', error)
      return null
    }
  }

  /**
   * Get user-friendly error messages for MTN
   */
  private static getMTNErrorMessage(statusCode: number): string {
    switch (statusCode) {
      case 400:
        return 'Invalid payment request. Please check phone number and amount.'
      case 401:
        return 'Payment service authentication failed. Please contact support.'
      case 404:
        return 'Payment service not found. Please try again later.'
      case 409:
        return 'Duplicate transaction detected. Please wait or try again.'
      case 500:
        return 'MTN MoMo service error. Please try again later.'
      default:
        return 'Payment failed. Please try again or use another payment method.'
    }
  }
}
