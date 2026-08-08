"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ingestLoyaltyShadowEvent = ingestLoyaltyShadowEvent;
const loyalty_adapter_1 = require("./loyalty.adapter");
const event_router_1 = require("../../../die/business-as-plugin/conversion/event-router");
const shadow_bindings_1 = require("../../../die/business-as-plugin/shadow/shadow-bindings");
async function ingestLoyaltyShadowEvent(input) {
    try {
        if (process.env.DIE_SHADOW_LOYALTY_ENABLED !== 'true')
            return;
        const adapter = new loyalty_adapter_1.LoyaltyPluginAdapter();
        const mapped = input.type;
        const severity = input.type === 'REDEMPTION_DENIED' ? 'WARN' : 'INFO';
        const ev = {
            domain: 'loyalty',
            type: mapped,
            timestamp: new Date().toISOString(),
            businessId: input.businessId,
            severity,
            data: {
                customerId: input.customerId,
                points: input.points,
                vipTier: input.vipTier,
                reason: input.reason,
            },
        };
        await (0, event_router_1.routeDomainEvent)(adapter, shadow_bindings_1.shadowBindings, ev);
    }
    catch (e) {
        console.debug('[Shadow][Loyalty] ingest error (ignored):', e?.message);
    }
}
