"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ingestReservationShadowEvent = ingestReservationShadowEvent;
const reservations_adapter_1 = require("./reservations.adapter");
const event_router_1 = require("../../../die/business-as-plugin/conversion/event-router");
const shadow_bindings_1 = require("../../../die/business-as-plugin/shadow/shadow-bindings");
async function ingestReservationShadowEvent(input) {
    try {
        // Feature flag OFF by default
        if (process.env.DIE_SHADOW_RESERVATIONS_ENABLED !== 'true')
            return;
        const adapter = new reservations_adapter_1.ReservationsPluginAdapter();
        const ev = {
            domain: 'reservations',
            type: mapToReservationType(input.type),
            timestamp: new Date().toISOString(),
            businessId: input.businessId,
            severity: input.type === 'CAPACITY_ALERT' ? 'WARN' : 'INFO',
            data: {
                reservationId: input.reservationId,
                partySize: input.partySize,
                scheduledAt: input.scheduledAtIso,
                reason: input.reason,
            },
        };
        await (0, event_router_1.routeDomainEvent)(adapter, shadow_bindings_1.shadowBindings, ev);
    }
    catch (e) {
        // Never throw; shadow mode must not impact runtime
        console.debug('[Shadow][Reservations] ingest error (ignored):', e?.message);
    }
}
function mapToReservationType(t) {
    if (t === 'CONFIRMED')
        return 'BOOKING_UPDATED';
    if (t === 'NO_SHOW')
        return 'BOOKING_CANCELLED';
    return t;
}
