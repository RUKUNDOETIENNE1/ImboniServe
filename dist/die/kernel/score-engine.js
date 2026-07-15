"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeTrustScore = computeTrustScore;
exports.computeTruthScore = computeTruthScore;
exports.computeConsensusScore = computeConsensusScore;
exports.computeRealityScore = computeRealityScore;
exports.computeMetaScore = computeMetaScore;
function clamp01(n) { return Math.max(0, Math.min(1, n)); }
function computeTrustScore(i) {
    const w = { conf: 0.4, stab: 0.3, base: 0.2, cross: 0.1 };
    const s = i.calibratedConfidence * w.conf + i.stability * w.stab + i.baselineSignificance * w.base + i.crossSupport * w.cross;
    return Math.round(clamp01(s) * 100);
}
function computeTruthScore(i) {
    const contr = i.contradiction ?? 0;
    const bias = i.bias ?? 0;
    const over = i.overconfidence ?? 0;
    const trusted = i.accuracy * (1 - 0.5 * contr) * (1 - 0.3 * bias) * (1 - 0.5 * over);
    return Math.round(clamp01(trusted) * 100);
}
function computeConsensusScore(i) {
    const L = i.layerSupports || {};
    const w = { finance: 0.30, evaluation: 0.25, temporal: 0.20, ceo: 0.10, reasoning: 0.10, auditPenalty: -0.15 };
    const base = (w.finance * (L.finance || 0)) + (w.evaluation * (L.evaluation || 0)) + (w.temporal * (L.temporal || 0)) + (w.ceo * (L.ceo || 0)) + (w.reasoning * (L.reasoning || 0)) + (w.auditPenalty * ((i.auditPenalty) || 0));
    return { confidence: clamp01(base) };
}
function computeRealityScore(i) {
    const ceo = i.ceoAlignOk ? 0.25 : 0;
    const arb = i.arbPlausible ? 0.25 : 0;
    return Math.round(clamp01(i.accuracy * 0.5 + ceo + arb) * 100);
}
function computeMetaScore(i) {
    // same blend as meta layer
    const score = (i.arbitrationAccuracy * 0.4 + i.resolutionQuality * 0.3 + i.layerContribution * 0.2 + (100 - i.drift) * 0.1) / 100;
    return Math.round(clamp01(score) * 100);
}
