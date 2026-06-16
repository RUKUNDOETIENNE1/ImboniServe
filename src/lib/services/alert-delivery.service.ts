/**
 * Alert Delivery Service
 * Sends alerts via email and Slack webhooks
 */

import { createTransport } from 'nodemailer'

interface Alert {
  severity: 'info' | 'warn' | 'error'
  title: string
  details?: any
}

export class AlertDeliveryService {
  static async sendEmail(alert: Alert) {
    const emailTo = process.env.ALERT_EMAIL_TO
    if (!emailTo) return

    const transport = createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    })

    const severityColor = alert.severity === 'error' ? '#dc2626' : alert.severity === 'warn' ? '#f59e0b' : '#3b82f6'
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f9fafb;border-radius:8px;">
        <div style="background:${severityColor};color:#fff;padding:16px;border-radius:8px 8px 0 0;">
          <h2 style="margin:0;font-size:18px;">${alert.severity.toUpperCase()}: ${alert.title}</h2>
        </div>
        <div style="background:#fff;padding:20px;border-radius:0 0 8px 8px;">
          ${alert.details ? `<pre style="background:#f1f5f9;padding:12px;border-radius:4px;overflow-x:auto;font-size:12px;">${JSON.stringify(alert.details, null, 2)}</pre>` : ''}
          <p style="margin-top:16px;font-size:12px;color:#64748b;">Sent by Imboni Serve Payments Operations</p>
        </div>
      </div>
    `

    try {
      await transport.sendMail({
        from: process.env.SMTP_FROM || 'alerts@imboni.rw',
        to: emailTo,
        subject: `[${alert.severity.toUpperCase()}] ${alert.title}`,
        html,
      })
    } catch (err) {
      console.error('[AlertDelivery] Email send failed:', err)
    }
  }

  static async sendSlack(alert: Alert) {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL
    if (!webhookUrl) return

    const color = alert.severity === 'error' ? 'danger' : alert.severity === 'warn' ? 'warning' : 'good'

    const payload = {
      attachments: [
        {
          color,
          title: alert.title,
          text: alert.details ? `\`\`\`${JSON.stringify(alert.details, null, 2)}\`\`\`` : undefined,
          footer: 'Imboni Serve Payments',
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    }

    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } catch (err) {
      console.error('[AlertDelivery] Slack send failed:', err)
    }
  }

  static async deliver(alert: Alert) {
    await Promise.all([this.sendEmail(alert), this.sendSlack(alert)])
  }
}
