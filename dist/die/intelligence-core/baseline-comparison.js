"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareToBaseline = compareToBaseline;
function compareToBaseline(metric, baseline, current) {
    const base = baseline?.mean ?? 0;
    const denom = Math.max(1, base);
    const deviationPct = ((current - base) / denom) * 100;
    let severity = 'INFO';
    const abs = Math.abs(deviationPct);
    if (abs > 200)
        severity = 'CRITICAL';
    else if (abs > 50)
        severity = 'WARN';
    return { metric, baseline: base, current, deviationPct, severity };
}
