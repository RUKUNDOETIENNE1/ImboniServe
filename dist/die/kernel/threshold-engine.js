"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnifiedThresholds = void 0;
exports.getThresholds = getThresholds;
exports.getLegacyCompatibilityThresholds = getLegacyCompatibilityThresholds;
// Default thresholds unified from existing modules. Can be tuned centrally.
exports.UnifiedThresholds = {
    finance: {
        revenueHealthGood: 75,
        revenueHealthWarn: 60,
        paymentFailureHigh: 20,
        refundRateHigh: 15,
        collectionEfficiencyLow: 70,
    },
    operations: {
        operationalPressureHigh: 0.7,
    },
    temporal: {
        strongRise: 1, // directional support already discrete in current system
        strongFall: -1,
    },
    trust: {
        high: 0.85,
        medium: 0.6,
    },
    arbitration: {
        agree: 0.6,
        disagree: 0.3,
        finalHealthyConsensus: 0.75,
    },
    disagreement: {
        healthyMax: 30,
        degradedMax: 50,
    },
    reality: {
        ceoAlignWeight: 0.25,
        arbPlausibleWeight: 0.25,
    },
    truthAudit: {
        contradictionHigh: 0.4,
    },
    meta: {
        minAccuracy: 0.7,
    },
};
function getThresholds() {
    return exports.UnifiedThresholds;
}
// Compatibility snapshot exposes the legacy bands as used today across modules,
// allowing phased replacement without behavior change.
function getLegacyCompatibilityThresholds() {
    return {
        arbitration: {
            agree: 0.6,
            disagree: 0.3,
            weights: { finance: 0.30, evaluation: 0.25, temporal: 0.20, ceo: 0.10, reasoning: 0.10, auditPenalty: -0.15 },
            finalHealthy: { consensusMin: 0.75, disagreementMax: 30, truthScoreMin: 80 },
            degraded: { consensusMin: 0.6, disagreementMax: 50, truthScoreMin: 70 },
            unstable: { disagreementMin: 50, truthScoreMax: 60 },
        },
        meta: {
            arbitrationAccuracyMin: 70, // percent
        },
        reality: {
            weights: { accuracy: 0.5, ceo: 0.25, arb: 0.25 },
        },
        truthAudit: {
            penalties: { contradiction: 0.5, bias: 0.3, overconfidence: 0.5 },
        },
        finance: {
            // show legacy divergences explicitly for audit (not authoritative)
            arbitrationHealthy: { revenueHealthScore: 75, paymentFailureRateMax: 10, refundRateMax: 10 },
            metaRealityOk: { revenueHealthScore: 70, paymentFailureRateMax: 15, refundRateMax: 12 },
            warningCutoff: 60,
        },
        trust: {
            highLegacyTruthAudit: 0.90,
            highLegacyReality: 0.85,
        },
    };
}
