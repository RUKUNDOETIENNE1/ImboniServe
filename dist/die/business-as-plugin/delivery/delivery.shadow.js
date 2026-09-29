"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ingestDeliveryShadowEvent = ingestDeliveryShadowEvent;
const delivery_adapter_1 = require("./delivery.adapter");
const event_router_1 = require("../../../die/business-as-plugin/conversion/event-router");
const shadow_bindings_1 = require("../../../die/business-as-plugin/shadow/shadow-bindings");
async function ingestDeliveryShadowEvent(input) {
    try {
        if (process.env.DIE_SHADOW_DELIVERY_ENABLED !== 'true')
            return;
        const adapter = new delivery_adapter_1.DeliveryPluginAdapter();
        const mapped = input.type;
        const severity = input.type === 'DELIVERY_FAILED' ? 'CRITICAL' : input.type === 'DELIVERY_DELAYED' || input.type === 'DELIVERY_DRIVER_ALERT' ? 'WARN' : 'INFO';
        const ev = {
            domain: 'delivery',
            type: mapped,
            timestamp: new Date().toISOString(),
            businessId: input.businessId,
            severity,
            data: {
                orderId: input.orderId,
                orderNumber: input.orderNumber,
                driverId: input.driverId,
                routeId: input.routeId,
                expectedAt: input.expectedAt,
                pickedUpAt: input.pickedUpAt,
                deliveredAt: input.deliveredAt,
                delayMs: input.delayMs,
                reason: input.reason,
            },
        };
        await (0, event_router_1.routeDomainEvent)(adapter, shadow_bindings_1.shadowBindings, ev);
    }
    catch (e) {
        console.debug('[Shadow][Delivery] ingest error (ignored):', e?.message);
    }
}
