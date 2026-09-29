"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calibrateConfidence = calibrateConfidence;
const context_cache_1 = require("../../die/assistant/context-cache");
const unified_intelligence_kernel_1 = require("../../die/kernel/unified-intelligence-kernel");
const unified_intelligence_kernel_2 = require("../../die/kernel/unified-intelligence-kernel");
const convergence_engine_1 = require("../../die/convergence/convergence-engine");
function countFeed(code, windowMs) {
    const feed = (0, context_cache_1.getFeedHistoryWithin)(windowMs);
    return feed.filter((f) => f.code === code).length;
}
function mapInsightToCodes(i) {
    switch (i.type) {
        case 'DEMAND_SURGE_DETECTED': return ['SESSION_STARTED', 'RESERVATION_CREATED'];
        case 'KITCHEN_BOTTLENECK_IDENTIFIED': return ['KDS_BACKLOG_ALERT'];
        case 'OPERATIONAL_CONGESTION': return ['KDS_BACKLOG_ALERT', 'WAITER_CALL_CREATED'];
        case 'SUPPLY_CHAIN_DEGRADATION': return ['DELIVERY_DELAYED', 'SUPPLIER_DELIVERY_DELAYED'];
        case 'REVENUE_RISK_DETECTED': return ['PAYMENT_EXCEPTION'];
        case 'CAMPAIGN_EFFECTIVENESS_DROP': return ['CAMPAIGN_DELIVERABILITY_WEAK'];
        default: return [];
    }
}
function baselineForCodeHour(profile, code, hour) {
    const m = profile.metrics[code];
    const stat = m?.byHour?.[String(hour)];
    return stat?.mean ?? 0;
}
function calibrateConfidence(i, profile, report) {
    const hour = new Date().getHours();
    const codes = mapInsightToCodes(i);
    const windowMs = 60 * 60 * 1000;
    let currentValue = 0;
    let baseMean = 0;
    for (const c of codes) {
        currentValue += countFeed(c, windowMs);
        baseMean += baselineForCodeHour(profile, c, hour);
    }
    const denom = Math.max(1, baseMean);
    const deviationPct = ((currentValue - baseMean) / denom) * 100;
    const baselineSignificance = Math.max(0, Math.min(1, Math.abs(deviationPct) / 100));
    // cross-domain support via correlation signals mentioning relevant domains
    const signals = report.riskSignals.map((r) => r.signal.toLowerCase());
    let cross = 0;
    if (i.type === 'KITCHEN_BOTTLENECK_IDENTIFIED' && signals.some((s) => s.includes('kitchen')))
        cross = 1;
    if (i.type === 'SUPPLY_CHAIN_DEGRADATION' && signals.some((s) => s.includes('supplier')))
        cross = 1;
    if (i.type === 'DEMAND_SURGE_DETECTED' && signals.some((s) => s.includes('demand')))
        cross = 1;
    // calibrated confidence combines raw confidence with baseline and cross confirmation
    const raw = i.confidence;
    const calibrated = Math.max(0, Math.min(1, raw * 0.6 + baselineSignificance * 0.3 + cross * 0.1));
    if (process.env.DIE_INTELLIGENCE_KERNEL_SHADOW === 'true') {
        try {
            void (0, unified_intelligence_kernel_1.getEvidence)(i.type);
        }
        catch { }
    }
    if (process.env.DIE_INTELLIGENCE_DUAL_READ_ENABLED === 'true') {
        try {
            const uikTrust = unified_intelligence_kernel_2.scoring.computeTrustScore({ calibratedConfidence: calibrated, stability: 0, baselineSignificance, crossSupport: cross });
            (0, convergence_engine_1.measureCalibrationConvergence)({ legacyTrustScore: Math.round(calibrated * 100), uikTrustScore: uikTrust });
        }
        catch { }
    }
    return { calibrated, baselineDeviationPct: deviationPct, crossDomainSupport: cross };
}
