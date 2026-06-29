// DIE Alert Delivery Service — v1.5 Foundation

import { nanoid } from 'nanoid'
import type { Alert, AlertType, AlertSeverity, AlertAdapter, AlertDeliveryResult, AlertChannel } from './types'
import { ConsoleAlertAdapter } from './adapters/console-adapter'
import { WebhookAlertAdapter } from './adapters/webhook-adapter'
import { EmailAlertAdapter } from './adapters/email-adapter'
import { SlackAlertAdapter } from './adapters/slack-adapter'

export class AlertDeliveryService {
  private readonly adapters: Map<AlertChannel, AlertAdapter> = new Map()

  constructor() {
    // v1.5: Only console adapter enabled
    this.adapters.set('console', new ConsoleAlertAdapter())
    
    // v2.0: Placeholder adapters (disabled)
    this.adapters.set('webhook', new WebhookAlertAdapter())
    this.adapters.set('email', new EmailAlertAdapter())
    this.adapters.set('slack', new SlackAlertAdapter())
  }

  /**
   * Create and deliver an alert
   */
  async sendAlert(
    type: AlertType,
    severity: AlertSeverity,
    title: string,
    message: string,
    metadata?: Record<string, unknown>
  ): Promise<AlertDeliveryResult[]> {
    const alert: Alert = {
      id: nanoid(16),
      type,
      severity,
      title,
      message,
      metadata,
      timestamp: new Date().toISOString(),
    }

    return this.deliverAlert(alert)
  }

  /**
   * Deliver alert to all enabled adapters
   */
  private async deliverAlert(alert: Alert): Promise<AlertDeliveryResult[]> {
    const results: AlertDeliveryResult[] = []

    for (const [channel, adapter] of this.adapters.entries()) {
      if (!adapter.enabled) {
        continue
      }

      try {
        const result = await adapter.deliver(alert)
        results.push(result)
      } catch (error: any) {
        results.push({
          channel,
          success: false,
          error: error?.message ?? 'Unknown error',
        })
      }
    }

    return results
  }

  /**
   * Get list of enabled channels
   */
  getEnabledChannels(): AlertChannel[] {
    const enabled: AlertChannel[] = []
    for (const [channel, adapter] of this.adapters.entries()) {
      if (adapter.enabled) {
        enabled.push(channel)
      }
    }
    return enabled
  }

  /**
   * Check if a specific channel is enabled
   */
  isChannelEnabled(channel: AlertChannel): boolean {
    const adapter = this.adapters.get(channel)
    return adapter?.enabled ?? false
  }
}

// Singleton instance
export const alertDeliveryService = new AlertDeliveryService()
