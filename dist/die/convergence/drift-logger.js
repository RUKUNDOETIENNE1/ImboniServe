"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logDrift = logDrift;
exports.getRecent = getRecent;
exports.getLatest = getLatest;
exports.getAggregate = getAggregate;
const LIMIT = 200;
let buffer = [];
function logDrift(entry) {
    try {
        buffer.unshift(entry);
        if (buffer.length > LIMIT)
            buffer = buffer.slice(0, LIMIT);
    }
    catch { /* ignore */ }
}
function getRecent(limit = 50) {
    return buffer.slice(0, Math.max(0, Math.min(limit, LIMIT)));
}
function getLatest() {
    return buffer[0] || null;
}
function avg(nums) { return nums.length ? nums.reduce((s, n) => s + n, 0) / nums.length : 0; }
function getAggregate() {
    // Per-module, per-metric accumulators: { [metricName]: { sum, count } }
    const modules = ['arbitration', 'meta', 'reality', 'truth-audit', 'calibration', 'evaluation'];
    const groupAcc = {
        arbitration: {}, meta: {}, reality: {}, 'truth-audit': {}, calibration: {}, evaluation: {},
    };
    const totalAcc = {};
    for (const e of buffer) {
        const m = e.module;
        const metrics = e.metrics;
        for (const [k, v] of Object.entries(metrics)) {
            if (typeof v !== 'number' || !Number.isFinite(v))
                continue;
            const gm = groupAcc[m];
            const gk = gm[k] || { sum: 0, count: 0 };
            gk.sum += v;
            gk.count += 1;
            gm[k] = gk;
            const tk = totalAcc[k] || { sum: 0, count: 0 };
            tk.sum += v;
            tk.count += 1;
            totalAcc[k] = tk;
        }
    }
    const byModule = {
        arbitration: {}, meta: {}, reality: {}, 'truth-audit': {}, calibration: {}, evaluation: {},
    };
    for (const mod of modules) {
        const acc = groupAcc[mod];
        const out = {};
        for (const [k, v] of Object.entries(acc)) {
            out[k] = v.count ? v.sum / v.count : 0;
        }
        byModule[mod] = out;
    }
    const average = {};
    for (const [k, v] of Object.entries(totalAcc)) {
        average[k] = v.count ? v.sum / v.count : 0;
    }
    return { average, byModule };
}
