// Webhook Alert Adapter — placeholder for v2.0

import type { Alert, AlertAdapter, AlertDeliveryResult } from '../types'

export class WebhookAlertAdapter implements AlertAdapter {
  readonly channel = 'webhook' as const
  readonly enabled = false // Disabled in v1.5

  private readonly webhookUrl: string | null = null

  constructor(webhookUrl?: string) {
    if (webhookUrl) {
      this.webhookUrl = webhookUrl
    }
  }

  async deliver(alert: Alert): Promise<AlertDeliveryResult> {
    if (!this.enabled) {
      return {
        channel: 'webhook',
        success: false,
        error: 'Webhook adapter disabled in v1.5',
      }
    }

    if (!this.webhookUrl) {
      return {
        channel: 'webhook',
        success: false,
        error: 'Webhook URL not configured',
      }
    }

    try {
      // Placeholder for future implementation
      // const response = await fetch(this.webhookUrl, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(alert),
      // })

      return {
        channel: 'webhook',
        success: false,
        error: 'Not implemented in v1.5',
      }
    } catch (error: any) {
      return {
        channel: 'webhook',
        success: false,
        error: error?.message ?? 'Unknown error',
      }
    }
  }
}
