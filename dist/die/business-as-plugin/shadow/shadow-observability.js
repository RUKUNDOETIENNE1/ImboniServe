"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shadowObservability = void 0;
const nanoid_1 = require("nanoid");
class ShadowObservabilityBuffer {
    constructor() {
        this.buffer = [];
        this.max = 500;
        this.lastEmitAt = new Map();
        // Basic per-code suppression windows (ms)
        this.suppressionMs = {
            CAMPAIGN_SCHEDULED: 60000,
            SESSION_UPDATED: 20000,
            KDS_BACKLOG_ALERT: 15000,
            WAITER_CALL_CREATED: 10000,
        };
    }
    makeKey(code, data) {
        const parts = [code];
        const d = data || {};
        const ids = [
            d?.pluginId,
            d?.sourceTag,
            d?.campaignId,
            d?.slipId,
            d?.sessionId,
            d?.orderId,
            d?.inventoryItemId,
            d?.supplierId,
        ].filter(Boolean);
        if (ids.length)
            parts.push(ids.join('|'));
        return parts.join('#');
    }
    emit(source, code, message, severity, data) {
        const key = this.makeKey(code, data);
        const now = Date.now();
        const suppressFor = this.suppressionMs[code] ?? 0;
        const last = this.lastEmitAt.get(key) || 0;
        if (suppressFor > 0 && now - last < suppressFor) {
            return; // suppress duplicate within window
        }
        const item = {
            id: (0, nanoid_1.nanoid)(12),
            timestamp: new Date().toISOString(),
            source,
            severity,
            code,
            message,
            data,
        };
        this.buffer.unshift(item);
        if (this.buffer.length > this.max)
            this.buffer.pop();
        this.lastEmitAt.set(key, now);
    }
    list(limit = 50) {
        return this.buffer.slice(0, limit);
    }
    clear() {
        this.buffer = [];
    }
}
exports.shadowObservability = new ShadowObservabilityBuffer();
