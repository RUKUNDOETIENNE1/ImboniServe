"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ingestProcurementShadowEvent = ingestProcurementShadowEvent;
const procurement_adapter_1 = require("./procurement.adapter");
const event_router_1 = require("../../../die/business-as-plugin/conversion/event-router");
const shadow_bindings_1 = require("../../../die/business-as-plugin/shadow/shadow-bindings");
async function ingestProcurementShadowEvent(input) {
    try {
        if (process.env.DIE_SHADOW_PROCUREMENT_ENABLED !== 'true')
            return;
        const adapter = new procurement_adapter_1.ProcurementPluginAdapter();
        const mapped = input.type;
        const severity = input.type === 'PROCUREMENT_EXCEPTION' ? 'CRITICAL' : input.type === 'PROCUREMENT_DELAY' ? 'WARN' : 'INFO';
        const ev = {
            domain: 'procurement',
            type: mapped,
            timestamp: new Date().toISOString(),
            businessId: input.businessId,
            severity,
            data: {
                poId: input.poId,
                supplierId: input.supplierId,
                orderNumber: input.orderNumber,
                expectedAt: input.expectedAt,
                deliveredAt: input.deliveredAt,
                delayMs: input.delayMs,
                reason: input.reason,
            },
        };
        await (0, event_router_1.routeDomainEvent)(adapter, shadow_bindings_1.shadowBindings, ev);
    }
    catch (e) {
        console.debug('[Shadow][Procurement] ingest error (ignored):', e?.message);
    }
}
