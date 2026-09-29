"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.routeDomainEvent = routeDomainEvent;
async function routeDomainEvent(adapter, bindings, ev) {
    try {
        const g = adapter.mapEventToGovernance(ev);
        if (g && bindings.governance)
            await bindings.governance.recordLifecycle({ ...g, pluginId: adapter.meta().pluginId, businessId: ev.businessId ?? null, timestamp: ev.timestamp });
    }
    catch { }
    try {
        const m = adapter.mapEventToMarketplace(ev);
        if (m && bindings.marketplace)
            await bindings.marketplace.recordUsage({ ...m, pluginId: adapter.meta().pluginId, businessId: ev.businessId ?? null, timestamp: ev.timestamp });
    }
    catch { }
    try {
        const i = adapter.mapEventToIntelligence(ev);
        if (i && bindings.intelligence)
            await bindings.intelligence.recordMetrics({ ...i, pluginId: adapter.meta().pluginId, businessId: ev.businessId ?? null, timestamp: ev.timestamp });
    }
    catch { }
    try {
        const f = adapter.mapEventToFeed(ev);
        if (f && bindings.observability)
            await bindings.observability.emitFeed({ ...f, pluginId: adapter.meta().pluginId, timestamp: ev.timestamp });
    }
    catch { }
}
