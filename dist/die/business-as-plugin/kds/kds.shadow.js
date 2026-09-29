"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ingestKDSShadowEvent = ingestKDSShadowEvent;
const kds_adapter_1 = require("./kds.adapter");
const event_router_1 = require("../../../die/business-as-plugin/conversion/event-router");
const shadow_bindings_1 = require("../../../die/business-as-plugin/shadow/shadow-bindings");
async function ingestKDSShadowEvent(input) {
    try {
        if (process.env.DIE_SHADOW_KDS_ENABLED !== 'true')
            return;
        const adapter = new kds_adapter_1.KDSPluginAdapter();
        const mappedType = mapToKDSType(input);
        const ev = {
            domain: 'kds',
            type: mappedType,
            timestamp: new Date().toISOString(),
            businessId: input.businessId,
            severity: input.type === 'ORDER_DELAYED' ? 'WARN' : 'INFO',
            data: {
                saleId: input.saleId,
                orderNumber: input.orderNumber,
                stationId: input.stationId,
                itemId: input.itemId,
                delayMs: input.delayMs,
            },
        };
        await (0, event_router_1.routeDomainEvent)(adapter, shadow_bindings_1.shadowBindings, ev);
    }
    catch (e) {
        console.debug('[Shadow][KDS] ingest error (ignored):', e?.message);
    }
}
function mapToKDSType(input) {
    switch (input.type) {
        case 'ORDER_RECEIVED':
            return 'ORDER_CREATED';
        case 'ORDER_UPDATED':
            if (input.stage === 'PREPARING')
                return 'ITEM_PREPARING';
            if (input.stage === 'READY')
                return 'ITEM_READY';
            if (input.stage === 'DELIVERED')
                return 'ORDER_SERVED';
            return 'ITEM_PREPARING';
        case 'ORDER_COMPLETED':
            return 'ORDER_SERVED';
        case 'ORDER_DELAYED':
            return 'BACKLOG_ALERT';
        default:
            return 'ITEM_PREPARING';
    }
}
