"use strict";
// Webhook Alert Adapter — placeholder for v2.0
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookAlertAdapter = void 0;
class WebhookAlertAdapter {
    constructor(webhookUrl) {
        this.channel = 'webhook';
        this.enabled = false; // Disabled in v1.5
        this.webhookUrl = null;
        if (webhookUrl) {
            this.webhookUrl = webhookUrl;
        }
    }
    async deliver(alert) {
        if (!this.enabled) {
            return {
                channel: 'webhook',
                success: false,
                error: 'Webhook adapter disabled in v1.5',
            };
        }
        if (!this.webhookUrl) {
            return {
                channel: 'webhook',
                success: false,
                error: 'Webhook URL not configured',
            };
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
            };
        }
        catch (error) {
            return {
                channel: 'webhook',
                success: false,
                error: error?.message ?? 'Unknown error',
            };
        }
    }
}
exports.WebhookAlertAdapter = WebhookAlertAdapter;
