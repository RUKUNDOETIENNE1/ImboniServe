// Email Alert Adapter — placeholder for v2.0

import type { Alert, AlertAdapter, AlertDeliveryResult } from '../types'

export class EmailAlertAdapter implements AlertAdapter {
  readonly channel = 'email' as const
  readonly enabled = false // Disabled in v1.5

  private readonly recipientEmail: string | null = null

  constructor(recipientEmail?: string) {
    if (recipientEmail) {
      this.recipientEmail = recipientEmail
    }
  }

  async deliver(alert: Alert): Promise<AlertDeliveryResult> {
    if (!this.enabled) {
      return {
        channel: 'email',
        success: false,
        error: 'Email adapter disabled in v1.5',
      }
    }

    if (!this.recipientEmail) {
      return {
        channel: 'email',
        success: false,
        error: 'Recipient email not configured',
      }
    }

    try {
      // Placeholder for future implementation
      // Will integrate with existing nodemailer setup
      // await sendEmail({
      //   to: this.recipientEmail,
      //   subject: `[DIE Alert] ${alert.type} - ${alert.severity}`,
      //   html: this.formatAlertEmail(alert),
      // })

      return {
        channel: 'email',
        success: false,
        error: 'Not implemented in v1.5',
      }
    } catch (error: any) {
      return {
        channel: 'email',
        success: false,
        error: error?.message ?? 'Unknown error',
      }
    }
  }

  private formatAlertEmail(alert: Alert): string {
    // Placeholder for email template
    return `
      <h2>${alert.title}</h2>
      <p><strong>Type:</strong> ${alert.type}</p>
      <p><strong>Severity:</strong> ${alert.severity}</p>
      <p><strong>Message:</strong> ${alert.message}</p>
      <p><strong>Timestamp:</strong> ${alert.timestamp}</p>
    `
  }
}
