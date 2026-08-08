"use strict";
// Slack Alert Adapter — placeholder for v2.0
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlackAlertAdapter = void 0;
class SlackAlertAdapter {
    constructor(webhookUrl) {
        this.channel = 'slack';
        this.enabled = false; // Disabled in v1.5
        this.webhookUrl = null;
        if (webhookUrl) {
            this.webhookUrl = webhookUrl;
        }
    }
    async deliver(alert) {
        if (!this.enabled) {
            return {
                channel: 'slack',
                success: false,
                error: 'Slack adapter disabled in v1.5',
            };
        }
        if (!this.webhookUrl) {
            return {
                channel: 'slack',
                success: false,
                error: 'Slack webhook URL not configured',
            };
        }
        try {
            // Placeholder for future implementation
            // const payload = this.formatSlackMessage(alert)
            // const response = await fetch(this.webhookUrl, {
            //   method: 'POST',
            //   headers: { 'Content-Type': 'application/json' },
            //   body: JSON.stringify(payload),
            // })
            return {
                channel: 'slack',
                success: false,
                error: 'Not implemented in v1.5',
            };
        }
        catch (error) {
            return {
                channel: 'slack',
                success: false,
                error: error?.message ?? 'Unknown error',
            };
        }
    }
    formatSlackMessage(alert) {
        // Placeholder for Slack message formatting
        const severityEmoji = this.getSeverityEmoji(alert.severity);
        return {
            text: `${severityEmoji} *${alert.title}*`,
            blocks: [
                {
                    type: 'header',
                    text: {
                        type: 'plain_text',
                        text: `${severityEmoji} ${alert.title}`,
                    },
                },
                {
                    type: 'section',
                    fields: [
                        { type: 'mrkdwn', text: `*Type:*\n${alert.type}` },
                        { type: 'mrkdwn', text: `*Severity:*\n${alert.severity}` },
                    ],
                },
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: alert.message,
                    },
                },
            ],
        };
    }
    getSeverityEmoji(severity) {
        switch (severity) {
            case 'critical': return '🚨';
            case 'high': return '⚠️';
            case 'medium': return '⚡';
            case 'low': return 'ℹ️';
            default: return '📢';
        }
    }
}
exports.SlackAlertAdapter = SlackAlertAdapter;
