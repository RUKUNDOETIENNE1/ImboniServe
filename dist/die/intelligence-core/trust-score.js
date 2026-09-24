"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeTrustScore = computeTrustScore;
function computeTrustScore(params) {
    const { calibratedConfidence, stabilityScore, baselineSignificance, crossDomainSupport } = params;
    // Weighted aggregation with emphasis on trustworthiness over raw severity
    const w = { conf: 0.4, stab: 0.3, base: 0.2, cross: 0.1 };
    const s = calibratedConfidence * w.conf + stabilityScore * w.stab + baselineSignificance * w.base + crossDomainSupport * w.cross;
    return { score: Math.round(Math.max(0, Math.min(1, s)) * 100) };
}
