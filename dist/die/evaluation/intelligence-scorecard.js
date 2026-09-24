"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildScorecard = buildScorecard;
const prediction_validator_1 = require("./prediction-validator");
const trust_calibration_engine_1 = require("./trust-calibration-engine");
const narrative_validator_1 = require("./narrative-validator");
const ceo_priority_validator_1 = require("./ceo-priority-validator");
function buildScorecard(evaluated, allRecords) {
    const accuracy = (0, prediction_validator_1.computeAccuracyMetrics)(evaluated, allRecords);
    const domain = (0, prediction_validator_1.computeDomainAccuracy)(evaluated);
    const trust = (0, trust_calibration_engine_1.computeTrustCalibration)(evaluated);
    const narratives = (0, narrative_validator_1.computeNarrativeAccuracy)(evaluated);
    const ceo = (0, ceo_priority_validator_1.computeCeoPriorityAccuracy)([]); // filled by API from evaluated CEO batches
    const recs = [];
    const byDomain = new Map(domain.map((d) => [d.domain, d.accuracy]));
    const sorted = [...byDomain.entries()].sort((a, b) => b[1] - a[1]);
    if (sorted.length >= 2) {
        const best = sorted[0];
        const worst = sorted[sorted.length - 1];
        if (worst[1] < best[1] - 0.1) {
            recs.push(`${worst[0]} intelligence accuracy is materially lower than other domains. Additional signal quality or calibration may be required.`);
        }
    }
    // Executive scores (0..100)
    const intelligenceReliability = Math.round((accuracy.overallAccuracy) * 100);
    const predictionAccuracy = Math.round((accuracy.precision * 0.6 + accuracy.recall * 0.4) * 100);
    const ceoGuidanceAccuracy = Math.round(((ceo.top1Accuracy * 0.6 + ceo.top3Accuracy * 0.3 + ceo.top5Accuracy * 0.1)) * 100);
    const narrativeAccuracy = narratives.overallScore;
    const trustCalibrationScore = trust.calibrationScore;
    const overallIntelligenceConfidence = Math.round((intelligenceReliability * 0.4 + predictionAccuracy * 0.3 + ceoGuidanceAccuracy * 0.1 + narrativeAccuracy * 0.1 + trustCalibrationScore * 0.1) / 1);
    return {
        overallAccuracy: accuracy.overallAccuracy,
        falsePositiveRate: accuracy.falsePositiveRate,
        falseNegativeRate: accuracy.falseNegativeRate,
        precision: accuracy.precision,
        recall: accuracy.recall,
        trustCalibration: trust,
        domainAccuracy: domain,
        ceoPriorityAccuracy: ceo,
        narrativeAccuracy: narratives,
        recentEvaluations: evaluated.slice(0, 50),
        recommendations: recs,
        scores: {
            intelligenceReliability,
            predictionAccuracy,
            ceoGuidanceAccuracy,
            narrativeAccuracy,
            trustCalibrationScore,
            overallIntelligenceConfidence,
        },
    };
}
