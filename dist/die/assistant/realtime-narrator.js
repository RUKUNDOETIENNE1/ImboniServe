"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.whatsHappeningNow = whatsHappeningNow;
const shadow_observability_1 = require("../../die/business-as-plugin/shadow/shadow-observability");
const context_cache_1 = require("../../die/assistant/context-cache");
function whatsHappeningNow(feed = shadow_observability_1.shadowObservability.list(100), insights = [], report) {
    const high = insights.filter((i) => i.severity !== 'INFO').sort((a, b) => (a.severity === 'CRITICAL' ? -1 : 0) - (b.severity === 'CRITICAL' ? -1 : 0) || b.confidence - a.confidence)[0];
    const kds = feed.filter((f) => f.code === 'KDS_BACKLOG_ALERT').length;
    const pay = feed.filter((f) => f.code === 'PAYMENT_EXCEPTION').length;
    const del = feed.filter((f) => f.code === 'DELIVERY_DELAYED' || f.code === 'DELIVERY_FAILED').length;
    const sess = feed.filter((f) => f.code === 'SESSION_STARTED').length;
    const parts = [];
    if (high)
        parts.push(`Primary concern: ${high.type.replaceAll('_', ' ').toLowerCase()} (${high.severity.toLowerCase()}).`);
    if (sess > 5)
        parts.push('Dining sessions are currently elevated.');
    if (kds > 0)
        parts.push('Kitchen backlog alerts are active.');
    if (del > 0)
        parts.push('Delivery delays/failures are occurring.');
    if (pay > 0)
        parts.push('Payment exceptions detected in the last interval.');
    if (report && report.riskSignals.length > 0) {
        const top = report.riskSignals.slice(0, 2).map((r) => r.signal).join('; ');
        parts.push(`Correlated risks: ${top}.`);
    }
    try {
        const t = (0, context_cache_1.getTemporalComparisons)();
        if (t.hour?.demand?.direction === 'RISING')
            parts.push('Hour-over-hour demand is rising.');
        if (t.hour?.operationalPressure?.direction === 'RISING')
            parts.push('Operational pressure is increasing vs the previous hour.');
        if (t.hour?.supplyRisk?.direction === 'RISING')
            parts.push('Supply risk is trending up in the last hour.');
    }
    catch { }
    return parts.length ? parts.join(' ') : 'Systems are stable at the moment; no notable spikes detected in the latest window.';
}
