"use strict";
// Console Alert Adapter — active in v1.5
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsoleAlertAdapter = void 0;
class ConsoleAlertAdapter {
    constructor() {
        this.channel = 'console';
        this.enabled = true;
    }
    async deliver(alert) {
        try {
            const severityColor = this.getSeverityColor(alert.severity);
            const timestamp = new Date(alert.timestamp).toISOString();
            console.log('\n' + '='.repeat(80));
            console.log(`[DIE ALERT] ${alert.type} - ${alert.severity.toUpperCase()}`);
            console.log('='.repeat(80));
            console.log(`Title:     ${alert.title}`);
            console.log(`Message:   ${alert.message}`);
            console.log(`Timestamp: ${timestamp}`);
            console.log(`ID:        ${alert.id}`);
            if (alert.metadata && Object.keys(alert.metadata).length > 0) {
                console.log('Metadata:');
                console.log(JSON.stringify(alert.metadata, null, 2));
            }
            console.log('='.repeat(80) + '\n');
            return {
                channel: 'console',
                success: true,
                deliveredAt: new Date().toISOString(),
            };
        }
        catch (error) {
            return {
                channel: 'console',
                success: false,
                error: error?.message ?? 'Unknown error',
            };
        }
    }
    getSeverityColor(severity) {
        switch (severity) {
            case 'critical': return '\x1b[31m'; // Red
            case 'high': return '\x1b[33m'; // Yellow
            case 'medium': return '\x1b[36m'; // Cyan
            case 'low': return '\x1b[37m'; // White
            default: return '\x1b[0m'; // Reset
        }
    }
}
exports.ConsoleAlertAdapter = ConsoleAlertAdapter;
