import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

const log = logger.child({ service: 'whatsapp-cloud' })

function normalizePhone(phone: string): string {
  const p = phone.trim().replace(/\s/g, '')
  if (p.startsWith('+')) return p.slice(1)
  if (p.startsWith('07')) return `250${p.slice(1)}`
  if (p.startsWith('2507')) return p
  if (p.startsWith('0')) return `250${p.slice(1)}`
  return p
}

interface SendTextOptions {
  phone: string
  message: string
  businessId?: string
}

interface SendTemplateOptions {
  phone: string
  templateName: string
  languageCode?: string
  components?: unknown[]
  businessId?: string
}

export class WhatsAppCloudService {
  private static getCredentials() {
    const token = process.env.WHATSAPP_CLOUD_TOKEN
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
    const version = process.env.WHATSAPP_API_VERSION || 'v18.0'
    return { token, phoneNumberId, version }
  }

  static async sendText({ phone, message, businessId }: SendTextOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const { token, phoneNumberId, version } = this.getCredentials()

    if (!token || !phoneNumberId) {
      log.warn('WhatsApp Cloud API not configured, falling back to Twilio')
      const { NotificationService } = await import('./notification.service')
      const result = await NotificationService.sendWhatsApp(phone, message)
      return result
    }

    const to = normalizePhone(phone)
    try {
      const response = await fetch(
        `https://graph.facebook.com/${version}/${phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to,
            type: 'text',
            text: { preview_url: false, body: message },
          }),
        }
      )

      const data = await response.json()
      if (!response.ok) {
        log.error('WhatsApp Cloud send error', { error: data, phone: to })
        return { success: false, error: data?.error?.message || 'Send failed' }
      }

      const messageId = data?.messages?.[0]?.id
      if (businessId) {
        await this.logMessage({ businessId, to: `+${to}`, body: message, messageId, direction: 'OUTBOUND', status: 'SENT' })
      }
      return { success: true, messageId }
    } catch (err: any) {
      log.error('WhatsApp Cloud send exception', { error: err.message })
      return { success: false, error: err.message }
    }
  }

  static async sendTemplate({ phone, templateName, languageCode = 'en', components = [], businessId }: SendTemplateOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const { token, phoneNumberId, version } = this.getCredentials()
    if (!token || !phoneNumberId) return { success: false, error: 'WhatsApp Cloud API not configured' }

    const to = normalizePhone(phone)
    try {
      const response = await fetch(
        `https://graph.facebook.com/${version}/${phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to,
            type: 'template',
            template: { name: templateName, language: { code: languageCode }, components },
          }),
        }
      )
      const data = await response.json()
      if (!response.ok) return { success: false, error: data?.error?.message }
      const messageId = data?.messages?.[0]?.id
      if (businessId) {
        await this.logMessage({ businessId, to: `+${to}`, body: `[Template: ${templateName}]`, messageId, direction: 'OUTBOUND', status: 'SENT', templateName })
      }
      return { success: true, messageId }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }

  static async logMessage({ businessId, to, from, body, messageId, direction, status, templateName }: {
    businessId: string; to?: string; from?: string; body?: string; messageId?: string
    direction: string; status: string; templateName?: string
  }) {
    try {
      await prisma.whatsAppMessage.create({
        data: {
          businessId,
          fromNumber: from || process.env.WHATSAPP_PHONE_NUMBER_ID || '',
          toNumber: to || '',
          message: body || '',
          type: templateName ? 'TEMPLATE' : 'TEXT',
          status,
          direction,
          command: templateName,
        },
      })
    } catch (err) {
      log.error('Failed to log WhatsApp message', { error: String(err) })
    }
  }

  static verifyWebhookSignature(body: string, signature: string): boolean {
    const appSecret = process.env.WHATSAPP_APP_SECRET
    if (!appSecret) return false
    const crypto = require('crypto')
    const expected = crypto.createHmac('sha256', appSecret).update(body).digest('hex')
    return `sha256=${expected}` === signature
  }
}
