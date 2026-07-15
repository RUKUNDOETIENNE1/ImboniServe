"use strict";
// Email Alert Adapter — placeholder for v2.0
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailAlertAdapter = void 0;
class EmailAlertAdapter {
    constructor(recipientEmail) {
        this.channel = 'email';
        this.enabled = false; // Disabled in v1.5
        this.recipientEmail = null;
        if (recipientEmail) {
            this.recipientEmail = recipientEmail;
        }
    }
    async deliver(alert) {
        if (!this.enabled) {
            return {
                channel: 'email',
                success: false,
                error: 'Email adapter disabled in v1.5',
            };
        }
        if (!this.recipientEmail) {
            return {
                channel: 'email',
                success: false,
                error: 'Recipient email not configured',
            };
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
            };
        }
        catch (error) {
            return {
                channel: 'email',
                success: false,
                error: error?.message ?? 'Unknown error',
            };
        }
    }
    formatAlertEmail(alert) {
        // Placeholder for email template
        return `
      <h2>${alert.title}</h2>
      <p><strong>Type:</strong> ${alert.type}</p>
      <p><strong>Severity:</strong> ${alert.severity}</p>
      <p><strong>Message:</strong> ${alert.message}</p>
      <p><strong>Timestamp:</strong> ${alert.timestamp}</p>
    `;
    }
}
exports.EmailAlertAdapter = EmailAlertAdapter;
