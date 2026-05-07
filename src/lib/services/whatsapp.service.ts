import { logger } from '@/lib/logger'

/**
 * WhatsApp Notification Service
 * Sends notifications via WhatsApp Business API (Twilio or similar)
 */

interface WhatsAppMessage {
  to: string // Phone number with country code (e.g., +250788123456)
  body: string
  templateName?: string
  templateParams?: Record<string, string>
}

export class WhatsAppService {
  private static apiUrl = process.env.WHATSAPP_API_URL || ''
  private static apiKey = process.env.WHATSAPP_API_KEY || ''
  private static fromNumber = process.env.WHATSAPP_FROM_NUMBER || ''

  /**
   * Send WhatsApp message
   */
  static async sendMessage(params: WhatsAppMessage): Promise<{ success: boolean; error?: string }> {
    if (!this.apiUrl || !this.apiKey) {
      logger.warn('WhatsApp not configured - message not sent', { to: params.to })
      return { success: true } // Don't block operations
    }

    try {
      // Format phone number
      const phone = params.to.startsWith('+') ? params.to : `+${params.to}`

      const payload = {
        from: this.fromNumber,
        to: phone,
        body: params.body,
        ...(params.templateName && {
          template: {
            name: params.templateName,
            language: { code: 'en' },
            components: params.templateParams ? [
              {
                type: 'body',
                parameters: Object.entries(params.templateParams).map(([key, value]) => ({
                  type: 'text',
                  text: value
                }))
              }
            ] : []
          }
        })
      }

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        logger.info('WhatsApp message sent', { to: phone })
        return { success: true }
      } else {
        const error = await response.text()
        logger.error('WhatsApp send failed', { error, to: phone })
        return { success: false, error }
      }
    } catch (error: any) {
      logger.error('WhatsApp exception', { error: error.message, to: params.to })
      return { success: false, error: error.message }
    }
  }

  /**
   * Send payout status notification
   */
  static async sendPayoutStatus(params: {
    phone: string
    name: string
    status: 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'PAID' | 'FAILED'
    amountCents: number
    reason?: string
  }): Promise<{ success: boolean; error?: string }> {
    const amount = (params.amountCents / 100).toLocaleString()
    
    let message = ''
    switch (params.status) {
      case 'REQUESTED':
        message = `Hello ${params.name}, your payout request of ${amount} RWF has been received and is pending approval. We'll notify you once it's processed.`
        break
      case 'APPROVED':
        message = `Great news ${params.name}! Your payout of ${amount} RWF has been approved and will be processed shortly.`
        break
      case 'REJECTED':
        message = `Hello ${params.name}, your payout request of ${amount} RWF was declined. Reason: ${params.reason || 'See email for details'}. Funds have been returned to your wallet.`
        break
      case 'PAID':
        message = `Payment sent! ${params.name}, your payout of ${amount} RWF has been successfully transferred to your mobile money account.`
        break
      case 'FAILED':
        message = `Hello ${params.name}, your payout of ${amount} RWF failed to process. Reason: ${params.reason || 'Payment provider error'}. Funds returned to your wallet.`
        break
    }

    return this.sendMessage({
      to: params.phone,
      body: message
    })
  }

  /**
   * Send commission earned notification
   */
  static async sendCommissionEarned(params: {
    phone: string
    name: string
    amountCents: number
    type: string
    businessName: string
  }): Promise<{ success: boolean; error?: string }> {
    const amount = (params.amountCents / 100).toLocaleString()
    const typeLabel = params.type === 'SIGNUP_BONUS' ? 'signup bonus' : 'recurring commission'

    const message = `Congratulations ${params.name}! You've earned ${amount} RWF as a ${typeLabel} from ${params.businessName}. Check your dashboard for details.`

    return this.sendMessage({
      to: params.phone,
      body: message
    })
  }

  /**
   * Send weekly summary
   */
  static async sendWeeklySummary(params: {
    phone: string
    name: string
    commissionsEarned: number
    commissionsCount: number
    payoutsReceived: number
    newBusinesses: number
  }): Promise<{ success: boolean; error?: string }> {
    const earned = (params.commissionsEarned / 100).toLocaleString()
    const paid = (params.payoutsReceived / 100).toLocaleString()

    const message = `Weekly Summary for ${params.name}:\n\n` +
      `💰 Earned: ${earned} RWF (${params.commissionsCount} commissions)\n` +
      `💸 Paid Out: ${paid} RWF\n` +
      `🏢 New Businesses: ${params.newBusinesses}\n\n` +
      `Keep up the great work! 🚀`

    return this.sendMessage({
      to: params.phone,
      body: message
    })
  }

  /**
   * Send welcome message to new marketer
   */
  static async sendMarketerWelcome(params: {
    phone: string
    name: string
    referralCode: string
    referralLink: string
  }): Promise<{ success: boolean; error?: string }> {
    const message = `Welcome to Imboni Marketer Program, ${params.name}! 🎉\n\n` +
      `Your referral code: ${params.referralCode}\n` +
      `Share your link: ${params.referralLink}\n\n` +
      `Earn 50,000 RWF per signup + 15% recurring commissions!\n\n` +
      `Check your dashboard for more details.`

    return this.sendMessage({
      to: params.phone,
      body: message
    })
  }

  /**
   * Opt-in/opt-out management (placeholder)
   */
  static async updatePreferences(phone: string, optIn: boolean): Promise<{ success: boolean }> {
    // TODO: Store preferences in database
    logger.info('WhatsApp preferences updated', { phone, optIn })
    return { success: true }
  }

  /**
   * Check if user has opted in for WhatsApp notifications
   */
  static async hasOptedIn(phone: string): Promise<boolean> {
    // TODO: Check database for opt-in status
    // For now, assume all users are opted in
    return true
  }
}
