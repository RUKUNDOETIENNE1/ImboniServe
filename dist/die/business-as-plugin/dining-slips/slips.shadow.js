"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ingestDiningSlipShadowEvent = ingestDiningSlipShadowEvent;
const slips_adapter_1 = require("./slips.adapter");
const event_router_1 = require("../../../die/business-as-plugin/conversion/event-router");
const shadow_bindings_1 = require("../../../die/business-as-plugin/shadow/shadow-bindings");
async function ingestDiningSlipShadowEvent(input) {
    try {
        if (process.env.DIE_SHADOW_DINING_SLIPS_ENABLED !== 'true')
            return;
        const adapter = new slips_adapter_1.DiningSlipsPluginAdapter();
        const mapped = input.type;
        const severity = input.type === 'PAYMENT_EXCEPTION' ? 'WARN' : input.type === 'LONG_DURATION_SESSION' ? 'WARN' : 'INFO';
        const ev = {
            domain: 'dining-slips',
            type: mapped,
            timestamp: new Date().toISOString(),
            businessId: input.businessId,
            severity,
            data: {
                sessionId: input.sessionId,
                slipId: input.slipId,
                amountCents: input.amountCents,
                durationMin: input.durationMin,
                reason: input.reason,
            },
        };
        await (0, event_router_1.routeDomainEvent)(adapter, shadow_bindings_1.shadowBindings, ev);
    }
    catch (e) {
        console.debug('[Shadow][DiningSlips] ingest error (ignored):', e?.message);
    }
}
