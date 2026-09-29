"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sampleAndRecordArbitration = sampleAndRecordArbitration;
exports.evaluateMetaDue = evaluateMetaDue;
exports.getRecentMetaRecords = getRecentMetaRecords;
exports.buildMetaValidationSnapshot = buildMetaValidationSnapshot;
const intelligence_arbitrator_1 = require("../../die/arbitration/intelligence-arbitrator");
const finance_intelligence_1 = require("../../die/finance/finance-intelligence");
const context_cache_1 = require("../../die/assistant/context-cache");
const evaluation_engine_1 = require("../../die/evaluation/evaluation-engine");
const prediction_validator_1 = require("../../die/evaluation/prediction-validator");
const truth_audit_engine_1 = require("../../die/audit/truth-audit-engine");
const unified_intelligence_kernel_1 = require("../../die/kernel/unified-intelligence-kernel");
const convergence_engine_1 = require("../../die/convergence/convergence-engine");
const LIMIT = 500;
let buffer = [];
function windowMs() {
    const env = Number(process.env.DIE_EVALUATION_WINDOW_MS);
    return Number.isFinite(env) && env > 0 ? env : 24 * 60 * 60 * 1000;
}
function clamp01(n) { return Math.max(0, Math.min(1, n)); }
function financeSupportFor(key, fin) {
    if (!fin)
        return 0;
    switch (key) {
        case 'REVENUE_DECLINE_DETECTED': return fin.trends.day.revenue.direction === 'FALLING' ? 1 : 0;
        case 'REVENUE_GROWTH_DETECTED': return fin.trends.day.revenue.direction === 'RISING' ? 1 : 0;
        case 'PAYMENT_PROVIDER_DEGRADATION': return fin.trends.day.topProvider?.direction === 'RISING' ? 1 : 0;
        case 'REFUND_SPIKE_DETECTED': return fin.trends.day.refunds.direction === 'RISING' ? 1 : 0;
        case 'COLLECTION_RISK_DETECTED': return fin.health.collectionEfficiencyScore < 70 ? 1 : 0;
        case 'FINANCIAL_HEALTH_WARNING': return fin.health.revenueHealthScore < 60 ? 1 : 0;
        default: return 0;
    }
}
function temporalSupportFor(key) {
    const t = (0, context_cache_1.getTemporalComparisons)();
    switch (key) {
        case 'KITCHEN_BOTTLENECK_IDENTIFIED':
        case 'OPERATIONAL_CONGESTION': return t.hour.operationalPressure.direction === 'RISING' ? 1 : 0;
        case 'SUPPLY_CHAIN_DEGRADATION': return t.hour.supplyRisk.direction === 'RISING' ? 1 : 0;
        case 'DEMAND_SURGE_DETECTED': return t.hour.demand.direction === 'RISING' ? 1 : 0;
        case 'CUSTOMER_CHURN_RISK': return t.hour.customerActivity.direction === 'FALLING' ? 1 : 0;
        default: return 0;
    }
}
function judgeFinalState(snapshot, evalAccuracy, fin, truthScore) {
    const state = snapshot.finalSystemState;
    if (state === 'HEALTHY') {
        const financeOk = !fin || (fin.trends.day.revenue.direction !== 'FALLING' && fin.health.revenueHealthScore >= 70 && fin.health.paymentFailureRate <= 15 && fin.health.refundRate <= 12);
        return evalAccuracy >= 0.8 && truthScore >= 80 && financeOk && snapshot.disagreementIndex < 40;
    }
    if (state === 'DEGRADED') {
        const financeRisk = !!fin && (fin.trends.day.revenue.direction === 'FALLING' || fin.health.revenueHealthScore < 70);
        return evalAccuracy >= 0.6 && truthScore >= 70 && snapshot.disagreementIndex < 60 && (financeRisk || snapshot.conflictReport.conflictScore >= 0.3);
    }
    if (state === 'UNSTABLE' || state === 'CONFLICTED') {
        return truthScore < 65 || snapshot.disagreementIndex >= 50 || snapshot.conflictReport.conflictScore >= 0.5;
    }
    return false;
}
function judgeHighConfidenceConsensusMatch(consensus, fin) {
    const high = consensus.filter((c) => c.confidence >= 0.75);
    if (high.length === 0)
        return true; // nothing to falsify
    let correct = 0;
    for (const c of high) {
        const f = financeSupportFor(c.key, fin);
        const t = temporalSupportFor(c.key);
        // If either finance or temporal support the claim, consider matched
        if (f >= 1 || t >= 1)
            correct += 1;
    }
    return correct / high.length >= 0.7;
}
async function sampleAndRecordArbitration() {
    if (process.env.DIE_INTELLIGENCE_META_VALIDATION_ENABLED !== 'true')
        return;
    if (process.env.DIE_INTELLIGENCE_ARBITRATION_ENABLED !== 'true')
        return;
    try {
        const snap = await (0, intelligence_arbitrator_1.buildArbitrationSnapshot)();
        const now = Date.now();
        buffer.unshift({ at: now, dueAt: now + windowMs(), snapshot: snap });
        if (buffer.length > LIMIT)
            buffer = buffer.slice(0, LIMIT);
    }
    catch {
        // ignore
    }
}
async function evaluateMetaDue() {
    if (process.env.DIE_INTELLIGENCE_META_VALIDATION_ENABLED !== 'true')
        return;
    try {
        await (0, evaluation_engine_1.evaluateDue)();
        const fin = process.env.DIE_FINANCE_INTELLIGENCE_ENABLED === 'true' ? await (0, finance_intelligence_1.computeFinanceSnapshot)() : null;
        const truth = await (0, truth_audit_engine_1.buildTruthAuditSnapshot)();
        const evaluated = (0, evaluation_engine_1.getEvaluatedRecords)();
        const all = (0, evaluation_engine_1.getRecords)();
        const evalAcc = (0, prediction_validator_1.computeAccuracyMetrics)(evaluated, all).overallAccuracy;
        const now = Date.now();
        for (const r of buffer) {
            if (r.verifiedAt || r.dueAt > now)
                continue;
            const okState = judgeFinalState(r.snapshot, evalAcc, fin, truth.truthStabilityIndex.truthStabilityScore);
            const okConsensus = judgeHighConfidenceConsensusMatch(r.snapshot.consensusInsights, fin);
            r.finalStateAccurate = okState;
            r.highConfidenceMatched = okConsensus;
            r.verifiedAt = now;
        }
        if (process.env.DIE_INTELLIGENCE_KERNEL_SHADOW === 'true') {
            try {
                const keys = new Set();
                for (const r of buffer) {
                    for (const c of r.snapshot.consensusInsights)
                        keys.add(c.key);
                }
                await Promise.all(Array.from(keys).map((k) => (0, unified_intelligence_kernel_1.getEvidence)(k)));
            }
            catch { }
        }
        if (process.env.DIE_INTELLIGENCE_DUAL_READ_ENABLED === 'true') {
            try {
                const keys = new Set();
                for (const r of buffer)
                    for (const c of r.snapshot.consensusInsights)
                        keys.add(c.key);
                const evs = await Promise.all(Array.from(keys).map((k) => (0, unified_intelligence_kernel_1.getEvidence)(k)));
                const vals = evs.map(e => e.supports?.evaluation || 0);
                const uikAcc = vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
                (0, convergence_engine_1.measureEvaluationConvergence)({ legacyAccuracy: evalAcc, uikAccuracy: uikAcc });
            }
            catch { }
        }
    }
    catch {
        // ignore
    }
}
function computeArbitrationAccuracy() {
    const done = buffer.filter((r) => r.verifiedAt);
    if (done.length === 0)
        return 0;
    const good = done.filter((r) => (r.finalStateAccurate && r.highConfidenceMatched)).length;
    return Math.round((good / done.length) * 100);
}
function analyzeWeights() {
    // Approximate by comparing layer support presence in accurate vs inaccurate cases
    const done = buffer.filter((r) => r.verifiedAt);
    if (done.length === 0)
        return { weightContributionScore: 0, underperformingLayers: [], overdominantLayers: [] };
    const layers = ['finance', 'evaluation', 'temporal', 'ceo', 'auditPenalty', 'reasoning'];
    const agg = {
        finance: { correct: [], wrong: [] },
        evaluation: { correct: [], wrong: [] },
        temporal: { correct: [], wrong: [] },
        ceo: { correct: [], wrong: [] },
        auditPenalty: { correct: [], wrong: [] },
        reasoning: { correct: [], wrong: [] },
    };
    for (const r of done) {
        const accurate = !!(r.finalStateAccurate && r.highConfidenceMatched);
        for (const c of r.snapshot.consensusInsights) {
            for (const L of layers) {
                const v = c.layers[L] || 0;
                if (accurate)
                    agg[L].correct.push(v);
                else
                    agg[L].wrong.push(v);
            }
        }
    }
    const under = [];
    const over = [];
    let scoreSum = 0;
    let scoreN = 0;
    for (const L of layers) {
        const mCorrect = agg[L].correct.length ? agg[L].correct.reduce((s, v) => s + v, 0) / agg[L].correct.length : 0;
        const mWrong = agg[L].wrong.length ? agg[L].wrong.reduce((s, v) => s + v, 0) / agg[L].wrong.length : 0;
        // contribution is better if correct > wrong
        const diff = mCorrect - mWrong;
        scoreSum += Math.max(0, diff);
        scoreN += 1;
        if (diff < -0.1)
            under.push(L);
        // over-dominance: average support very high regardless of correctness
        const avgAll = [...agg[L].correct, ...agg[L].wrong];
        const mAll = avgAll.length ? avgAll.reduce((s, v) => s + v, 0) / avgAll.length : 0;
        if (mAll > 0.8)
            over.push(L);
    }
    const weightContributionScore = Math.round(clamp01(scoreN ? scoreSum / scoreN : 0) * 100);
    return { weightContributionScore, underperformingLayers: under, overdominantLayers: over };
}
function conflictResolutionQuality() {
    const done = buffer.filter((r) => r.verifiedAt);
    if (done.length === 0)
        return 0;
    let predictive = 0;
    for (const r of done) {
        const highConflict = r.snapshot.conflictReport.conflictScore >= 0.5 || r.snapshot.disagreementIndex >= 50;
        const endedUnstable = r.finalStateAccurate && (r.snapshot.finalSystemState === 'UNSTABLE' || r.snapshot.finalSystemState === 'CONFLICTED');
        const endedHealthy = r.finalStateAccurate && r.snapshot.finalSystemState === 'HEALTHY';
        if (highConflict && endedUnstable)
            predictive += 1;
        if (!highConflict && endedHealthy)
            predictive += 1;
    }
    return Math.round((predictive / done.length) * 100);
}
function detectDrift() {
    const recs = buffer.slice().reverse(); // oldest to newest
    if (recs.length < 3)
        return { driftScore: 0, driftPatterns: [] };
    let stateFlips = 0;
    let similarInputsDifferentOutputs = 0;
    const patterns = [];
    for (let i = 1; i < recs.length; i++) {
        const a = recs[i - 1];
        const b = recs[i];
        if (a.snapshot.finalSystemState !== b.snapshot.finalSystemState)
            stateFlips += 1;
        const confClose = Math.abs(a.snapshot.consensusConfidence - b.snapshot.consensusConfidence) < 0.05;
        const topA = a.snapshot.consensusInsights[0]?.key;
        const topB = b.snapshot.consensusInsights[0]?.key;
        if (confClose && topA && topB && topA === topB && a.snapshot.finalSystemState !== b.snapshot.finalSystemState) {
            similarInputsDifferentOutputs += 1;
        }
    }
    const flipRate = stateFlips / (recs.length - 1);
    const sidRate = similarInputsDifferentOutputs / (recs.length - 1);
    const driftScore = Math.round(clamp01(0.6 * flipRate + 0.4 * sidRate) * 100);
    if (flipRate > 0.3)
        patterns.push('Frequent changes in finalSystemState');
    if (sidRate > 0.2)
        patterns.push('Similar inputs producing different outputs');
    return { driftScore, driftPatterns: patterns };
}
function getRecentMetaRecords() { return buffer.slice(0, 50); }
async function buildMetaValidationSnapshot() {
    if (process.env.DIE_INTELLIGENCE_META_VALIDATION_ENABLED !== 'true') {
        return {
            arbitrationAccuracyScore: 0,
            resolutionQualityScore: 0,
            driftScore: 0,
            layerEffectiveness: { weightContributionScore: 0, underperformingLayers: [], overdominantLayers: [] },
            metaSystemHealthScore: 0,
            recommendations: [],
            recent: [],
        };
    }
    // One sampling per request for passive accumulation (read-only)
    await sampleAndRecordArbitration();
    await evaluateMetaDue();
    const arbitrationAccuracyScore = computeArbitrationAccuracy();
    const layerEffectiveness = analyzeWeights();
    const resolutionQualityScore = conflictResolutionQuality();
    const { driftScore, driftPatterns } = detectDrift();
    // Meta health: balanced combination (drift inversely)
    const metaSystemHealthScore = Math.round((arbitrationAccuracyScore * 0.4 + resolutionQualityScore * 0.3 + layerEffectiveness.weightContributionScore * 0.2 + (100 - driftScore) * 0.1));
    const recent = getRecentMetaRecords().map((r) => ({
        at: new Date(r.at).toISOString(),
        finalSystemState: r.snapshot.finalSystemState,
        consensusConfidence: r.snapshot.consensusConfidence,
        disagreementIndex: r.snapshot.disagreementIndex,
        dominantConflicts: r.snapshot.conflictReport.conflicts.slice(0, 3).map((c) => c.type),
    }));
    const recommendations = [];
    if (layerEffectiveness.underperformingLayers.length)
        recommendations.push(`Underperforming layers: ${layerEffectiveness.underperformingLayers.join(', ')}`);
    if (layerEffectiveness.overdominantLayers.length)
        recommendations.push(`Over-dominant layers: ${layerEffectiveness.overdominantLayers.join(', ')}`);
    if (driftPatterns.length)
        recommendations.push(`Drift patterns: ${driftPatterns.join('; ')}`);
    if (arbitrationAccuracyScore < 70)
        recommendations.push('Arbitration accuracy is low; review layer contributions and truth audit contradictions.');
    return {
        arbitrationAccuracyScore,
        resolutionQualityScore,
        driftScore,
        layerEffectiveness,
        metaSystemHealthScore,
        recommendations,
        recent,
    };
}
