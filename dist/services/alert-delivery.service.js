"use strict";
/**
 * Alert Delivery Service
 * Sends alerts via email and Slack webhooks
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlertDeliveryService = void 0;
const nodemailer_1 = require("nodemailer");
class AlertDeliveryService {
    static async sendEmail(alert) {
        const emailTo = process.env.ALERT_EMAIL_TO;
        if (!emailTo)
            return;
        const transport = (0, nodemailer_1.createTransport)({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD,
            },
        });
        const severityColor = alert.severity === 'error' ? '#dc2626' : alert.severity === 'warn' ? '#f59e0b' : '#3b82f6';
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
    `;
        try {
            await transport.sendMail({
                from: process.env.SMTP_FROM || 'alerts@imboni.rw',
                to: emailTo,
                subject: `[${alert.severity.toUpperCase()}] ${alert.title}`,
                html,
            });
        }
        catch (err) {
            console.error('[AlertDelivery] Email send failed:', err);
        }
    }
    static async sendSlack(alert) {
        const webhookUrl = process.env.SLACK_WEBHOOK_URL;
        if (!webhookUrl)
            return;
        const color = alert.severity === 'error' ? 'danger' : alert.severity === 'warn' ? 'warning' : 'good';
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
        };
        try {
            await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
        }
        catch (err) {
            console.error('[AlertDelivery] Slack send failed:', err);
        }
    }
    static async deliver(alert) {
        await Promise.all([this.sendEmail(alert), this.sendSlack(alert)]);
    }
    /**
     * Deliver watchdog alert with standardized format
     */
    static async deliverWatchdogAlert(alert) {
        const severityMap = {
            INFO: 'info',
            WARN: 'warn',
            ERROR: 'error',
            CRITICAL: 'error', // Map CRITICAL to error for existing alert system
        };
        const legacyAlert = {
            severity: severityMap[alert.severity],
            title: `[${alert.watchdog}] ${alert.summary}`,
            details: {
                source: alert.source,
                environment: alert.environment,
                timestamp: alert.timestamp.toISOString(),
                threshold: alert.threshold,
                currentValue: alert.currentValue,
                recommendedAction: alert.recommendedAction,
                ...alert.details,
            },
        };
        await this.deliver(legacyAlert);
    }
    /**
     * Startup Channel Guard
     * Checks if alert delivery channels are configured at application boot
     */
    static checkChannelsAtStartup() {
        const hasEmail = !!process.env.ALERT_EMAIL_TO;
        const hasSlack = !!process.env.SLACK_WEBHOOK_URL;
        if (!hasEmail && !hasSlack) {
            console.warn('[AlertDeliveryService] ⚠️  WARN: AlertDeliveryService active but no delivery channels configured. '
                + 'Set ALERT_EMAIL_TO or SLACK_WEBHOOK_URL to receive alerts.');
        }
        else if (!hasEmail) {
            console.info('[AlertDeliveryService] ℹ️  INFO: Email alerts not configured (ALERT_EMAIL_TO missing). '
                + 'Alerts will be sent to Slack only.');
        }
        else if (!hasSlack) {
            console.info('[AlertDeliveryService] ℹ️  INFO: Slack alerts not configured (SLACK_WEBHOOK_URL missing). '
                + 'Alerts will be sent to Email only.');
        }
        else {
            console.info('[AlertDeliveryService] ✅ SUCCESS: Alert delivery channels configured (Email + Slack).');
        }
    }
}
exports.AlertDeliveryService = AlertDeliveryService;
