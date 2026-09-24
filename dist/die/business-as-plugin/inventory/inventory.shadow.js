"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ingestInventoryShadowEvent = ingestInventoryShadowEvent;
const inventory_adapter_1 = require("./inventory.adapter");
const event_router_1 = require("../../../die/business-as-plugin/conversion/event-router");
const shadow_bindings_1 = require("../../../die/business-as-plugin/shadow/shadow-bindings");
async function ingestInventoryShadowEvent(input) {
    try {
        if (process.env.DIE_SHADOW_INVENTORY_ENABLED !== 'true')
            return;
        const adapter = new inventory_adapter_1.InventoryPluginAdapter();
        const mapped = mapType(input.type);
        const severity = input.type === 'STOCK_OUT' ? 'CRITICAL' : input.type === 'STOCK_LOW' || input.type === 'INVENTORY_THRESHOLD_BREACH' ? 'WARN' : 'INFO';
        const ev = {
            domain: 'inventory',
            type: mapped,
            timestamp: new Date().toISOString(),
            businessId: input.businessId,
            severity,
            data: {
                inventoryItemId: input.inventoryItemId,
                itemName: input.itemName,
                unit: input.unit,
                quantity: input.quantity,
                previousStock: input.previousStock,
                newStock: input.newStock,
                minStockLevel: input.minStockLevel,
                alertLevel: input.alertLevel,
                breachFromAbove: input.breachFromAbove,
            },
        };
        await (0, event_router_1.routeDomainEvent)(adapter, shadow_bindings_1.shadowBindings, ev);
    }
    catch (e) {
        console.debug('[Shadow][Inventory] ingest error (ignored):', e?.message);
    }
}
function mapType(t) {
    return t;
}
