"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ingestEventsShadowEvent = ingestEventsShadowEvent;
const events_adapter_1 = require("./events.adapter");
const event_router_1 = require("../../../die/business-as-plugin/conversion/event-router");
const shadow_bindings_1 = require("../../../die/business-as-plugin/shadow/shadow-bindings");
async function ingestEventsShadowEvent(input) {
    try {
        if (process.env.DIE_SHADOW_EVENTS_ENABLED !== 'true')
            return;
        const adapter = new events_adapter_1.EventManagementPluginAdapter();
        const mapped = input.type;
        const severity = input.severity || (input.type === 'CAPACITY_ALERT' || input.type === 'SPIKE_DETECTED' ? 'WARN' : 'INFO');
        const ev = {
            domain: 'events',
            type: mapped,
            timestamp: new Date().toISOString(),
            businessId: input.businessId,
            severity,
            data: {
                eventId: input.eventId,
                tickets: input.tickets,
                capacity: input.capacity,
                severity: severity,
            },
        };
        await (0, event_router_1.routeDomainEvent)(adapter, shadow_bindings_1.shadowBindings, ev);
    }
    catch (e) {
        console.debug('[Shadow][Events] ingest error (ignored):', e?.message);
    }
}
