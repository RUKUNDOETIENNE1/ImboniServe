"use strict";
// DIE Alert Delivery Service — v1.5 Foundation
Object.defineProperty(exports, "__esModule", { value: true });
exports.alertDeliveryService = exports.AlertDeliveryService = void 0;
const nanoid_1 = require("nanoid");
const console_adapter_1 = require("./adapters/console-adapter");
const webhook_adapter_1 = require("./adapters/webhook-adapter");
const email_adapter_1 = require("./adapters/email-adapter");
const slack_adapter_1 = require("./adapters/slack-adapter");
class AlertDeliveryService {
    constructor() {
        this.adapters = new Map();
        // v1.5: Only console adapter enabled
        this.adapters.set('console', new console_adapter_1.ConsoleAlertAdapter());
        // v2.0: Placeholder adapters (disabled)
        this.adapters.set('webhook', new webhook_adapter_1.WebhookAlertAdapter());
        this.adapters.set('email', new email_adapter_1.EmailAlertAdapter());
        this.adapters.set('slack', new slack_adapter_1.SlackAlertAdapter());
    }
    /**
     * Create and deliver an alert
     */
    async sendAlert(type, severity, title, message, metadata) {
        const alert = {
            id: (0, nanoid_1.nanoid)(16),
            type,
            severity,
            title,
            message,
            metadata,
            timestamp: new Date().toISOString(),
        };
        return this.deliverAlert(alert);
    }
    /**
     * Deliver alert to all enabled adapters
     */
    async deliverAlert(alert) {
        const results = [];
        for (const [channel, adapter] of this.adapters.entries()) {
            if (!adapter.enabled) {
                continue;
            }
            try {
                const result = await adapter.deliver(alert);
                results.push(result);
            }
            catch (error) {
                results.push({
                    channel,
                    success: false,
                    error: error?.message ?? 'Unknown error',
                });
            }
        }
        return results;
    }
    /**
     * Get list of enabled channels
     */
    getEnabledChannels() {
        const enabled = [];
        for (const [channel, adapter] of this.adapters.entries()) {
            if (adapter.enabled) {
                enabled.push(channel);
            }
        }
        return enabled;
    }
    /**
     * Check if a specific channel is enabled
     */
    isChannelEnabled(channel) {
        const adapter = this.adapters.get(channel);
        return adapter?.enabled ?? false;
    }
}
exports.AlertDeliveryService = AlertDeliveryService;
// Singleton instance
exports.alertDeliveryService = new AlertDeliveryService();
