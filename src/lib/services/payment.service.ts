import crypto from 'crypto'

export interface PaymentRequest {
  amount: number
  currency: string
  orderId: string
  customerPhone: string
  customerEmail?: string
}

export interface PaymentResponse {
  success: boolean
  transactionId?: string
  reference?: string
  error?: string
  paymentUrl?: string
}

export class PaymentService {
  static async initiatePesapalPayment(request: PaymentRequest): Promise<PaymentResponse> {
    if (!process.env.PESAPAL_CONSUMER_KEY || !process.env.PESAPAL_CONSUMER_SECRET) {
      return {
        success: false,
        error: 'Pesapal not configured'
      }
    }

    try {
      const timestamp = new Date().toISOString()
      const reference = `ORD-${request.orderId}-${Date.now()}`

      const payload = {
        id: reference,
        currency: request.currency,
        amount: request.amount / 100,
        description: `Order ${request.orderId}`,
        callback_url: `${process.env.APP_URL}/api/payments/pesapal/callback`,
        notification_id: process.env.PESAPAL_IPN_ID,
        billing_address: {
          email_address: request.customerEmail,
          phone_number: request.customerPhone
        }
      }

      const response = await fetch(
        `${process.env.PESAPAL_API_URL || 'https://pay.pesapal.com/v3'}/api/Transactions/SubmitOrderRequest`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await this.getPesapalToken()}`
          },
          body: JSON.stringify(payload)
        }
      )

      if (response.ok) {
        const data = await response.json()
        return {
          success: true,
          transactionId: data.order_tracking_id,
          reference: reference,
          paymentUrl: data.redirect_url
        }
      } else {
        return {
          success: false,
          error: 'Payment initiation failed'
        }
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  static async initiateMTNMoMo(request: PaymentRequest): Promise<PaymentResponse> {
    if (!process.env.MTN_MOMO_API_KEY) {
      return {
        success: false,
        error: 'MTN MoMo not configured'
      }
    }

    try {
      const reference = `MTN-${request.orderId}-${Date.now()}`

      const payload = {
        amount: request.amount / 100,
        currency: request.currency,
        externalId: reference,
        payer: {
          partyIdType: 'MSISDN',
          partyId: request.customerPhone.replace(/^\+/, '')
        },
        payerMessage: `Payment for order ${request.orderId}`,
        payeeNote: 'Imboni Serve payment'
      }

      const response = await fetch(
        `${process.env.MTN_MOMO_API_URL || 'https://sandbox.momodeveloper.mtn.com'}/collection/v1_0/requesttopay`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.MTN_MOMO_API_KEY}`,
            'X-Reference-Id': reference,
            'X-Target-Environment': process.env.MTN_MOMO_ENVIRONMENT || 'sandbox',
            'Ocp-Apim-Subscription-Key': process.env.MTN_MOMO_SUBSCRIPTION_KEY || ''
          },
          body: JSON.stringify(payload)
        }
      )

      if (response.ok || response.status === 202) {
        return {
          success: true,
          transactionId: reference,
          reference: reference
        }
      } else {
        return {
          success: false,
          error: 'MTN MoMo payment failed'
        }
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  static async initiateAirtelMoney(request: PaymentRequest): Promise<PaymentResponse> {
    if (!process.env.AIRTEL_MONEY_API_KEY) {
      return {
        success: false,
        error: 'Airtel Money not configured'
      }
    }

    try {
      const reference = `AIRTEL-${request.orderId}-${Date.now()}`

      const payload = {
        reference: reference,
        subscriber: {
          country: 'RW',
          currency: request.currency,
          msisdn: request.customerPhone.replace(/^\+/, '')
        },
        transaction: {
          amount: request.amount / 100,
          country: 'RW',
          currency: request.currency,
          id: reference
        }
      }

      const response = await fetch(
        `${process.env.AIRTEL_MONEY_API_URL || 'https://openapiuat.airtel.africa'}/merchant/v1/payments/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.AIRTEL_MONEY_API_KEY}`,
            'X-Country': 'RW',
            'X-Currency': request.currency
          },
          body: JSON.stringify(payload)
        }
      )

      if (response.ok) {
        const data = await response.json()
        return {
          success: true,
          transactionId: data.data?.transaction?.id,
          reference: reference
        }
      } else {
        return {
          success: false,
          error: 'Airtel Money payment failed'
        }
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  static async verifyPayment(reference: string, provider: string): Promise<boolean> {
    try {
      if (provider === 'PESAPAL_CARD') {
        return await this.verifyPesapalPayment(reference)
      } else if (provider === 'MTN_MOBILE_MONEY') {
        return await this.verifyMTNPayment(reference)
      } else if (provider === 'AIRTEL_MONEY') {
        return await this.verifyAirtelPayment(reference)
      }
      return false
    } catch (error) {
      console.error('Payment verification error:', error)
      return false
    }
  }

  private static async getPesapalToken(): Promise<string> {
    const response = await fetch(
      `${process.env.PESAPAL_API_URL || 'https://pay.pesapal.com/v3'}/api/Auth/RequestToken`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          consumer_key: process.env.PESAPAL_CONSUMER_KEY,
          consumer_secret: process.env.PESAPAL_CONSUMER_SECRET
        })
      }
    )

    if (response.ok) {
      const data = await response.json()
      return data.token
    }
    throw new Error('Failed to get Pesapal token')
  }

  private static async verifyPesapalPayment(reference: string): Promise<boolean> {
    const response = await fetch(
      `${process.env.PESAPAL_API_URL || 'https://pay.pesapal.com/v3'}/api/Transactions/GetTransactionStatus?orderTrackingId=${reference}`,
      {
        headers: {
          'Authorization': `Bearer ${await this.getPesapalToken()}`
        }
      }
    )

    if (response.ok) {
      const data = await response.json()
      return data.payment_status_description === 'Completed'
    }
    return false
  }

  private static async verifyMTNPayment(reference: string): Promise<boolean> {
    const response = await fetch(
      `${process.env.MTN_MOMO_API_URL || 'https://sandbox.momodeveloper.mtn.com'}/collection/v1_0/requesttopay/${reference}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.MTN_MOMO_API_KEY}`,
          'X-Target-Environment': process.env.MTN_MOMO_ENVIRONMENT || 'sandbox',
          'Ocp-Apim-Subscription-Key': process.env.MTN_MOMO_SUBSCRIPTION_KEY || ''
        }
      }
    )

    if (response.ok) {
      const data = await response.json()
      return data.status === 'SUCCESSFUL'
    }
    return false
  }

  private static async verifyAirtelPayment(reference: string): Promise<boolean> {
    const response = await fetch(
      `${process.env.AIRTEL_MONEY_API_URL || 'https://openapiuat.airtel.africa'}/standard/v1/payments/${reference}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.AIRTEL_MONEY_API_KEY}`,
          'X-Country': 'RW',
          'X-Currency': 'RWF'
        }
      }
    )

    if (response.ok) {
      const data = await response.json()
      return data.data?.transaction?.status === 'TS'
    }
    return false
  }
}
