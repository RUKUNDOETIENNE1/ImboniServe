"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ingestSuppliersShadowEvent = ingestSuppliersShadowEvent;
const suppliers_adapter_1 = require("./suppliers.adapter");
const event_router_1 = require("../../../die/business-as-plugin/conversion/event-router");
const shadow_bindings_1 = require("../../../die/business-as-plugin/shadow/shadow-bindings");
async function ingestSuppliersShadowEvent(input) {
    try {
        if (process.env.DIE_SHADOW_SUPPLIERS_ENABLED !== 'true')
            return;
        const adapter = new suppliers_adapter_1.SuppliersPluginAdapter();
        const mapped = input.type;
        const severity = input.type === 'SUPPLIER_DELIVERY_FAILED' ? 'CRITICAL' : input.type === 'SUPPLIER_DELIVERY_DELAYED' || input.type === 'SUPPLIER_PERFORMANCE_ALERT' ? 'WARN' : 'INFO';
        const ev = {
            domain: 'suppliers',
            type: mapped,
            timestamp: new Date().toISOString(),
            businessId: input.businessId,
            severity,
            data: {
                supplierId: input.supplierId,
                orderId: input.orderId,
                orderNumber: input.orderNumber,
                delayMs: input.delayMs,
                reason: input.reason,
                performanceScore: input.performanceScore,
            },
        };
        await (0, event_router_1.routeDomainEvent)(adapter, shadow_bindings_1.shadowBindings, ev);
    }
    catch (e) {
        console.debug('[Shadow][Suppliers] ingest error (ignored):', e?.message);
    }
}
