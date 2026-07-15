"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildTruthAuditSnapshot = buildTruthAuditSnapshot;
const reasoning_engine_1 = require("../../die/business-intelligence/reasoning-engine");
const ceo_prioritization_1 = require("../../die/assistant/ceo-prioritization");
const context_cache_1 = require("../../die/assistant/context-cache");
const correlation_engine_service_1 = require("../../die/intelligence-core/correlation-engine.service");
const finance_intelligence_1 = require("../../die/finance/finance-intelligence");
const evaluation_engine_1 = require("../../die/evaluation/evaluation-engine");
const prediction_validator_1 = require("../../die/evaluation/prediction-validator");
const unified_intelligence_kernel_1 = require("../../die/kernel/unified-intelligence-kernel");
const convergence_engine_1 = require("../../die/convergence/convergence-engine");
const unified_intelligence_kernel_2 = require("../../die/kernel/unified-intelligence-kernel");
function clamp01(n) { return Math.max(0, Math.min(1, n)); }
function gradeFromScore(score) {
    if (score >= 90)
        return 'A';
    if (score >= 80)
        return 'B';
    if (score >= 70)
        return 'C';
    if (score >= 60)
        return 'D';
    return 'F';
}
function mapInsightToTemporalKey(type) {
    switch (type) {
        case 'DEMAND_SURGE_DETECTED': return 'demand';
        case 'KITCHEN_BOTTLENECK_IDENTIFIED':
        case 'OPERATIONAL_CONGESTION': return 'operationalPressure';
        case 'SUPPLY_CHAIN_DEGRADATION': return 'supplyRisk';
        case 'CUSTOMER_CHURN_RISK':
        case 'TABLE_TURNOVER_INEFFICIENCY': return 'customerActivity';
        default: return null;
    }
}
function temporalContradictions(insights) {
    try {
        const t = (0, context_cache_1.getTemporalComparisons)();
        let mismatches = 0;
        let checked = 0;
        const notes = [];
        for (const i of insights) {
            const key = mapInsightToTemporalKey(i.type);
            if (!key)
                continue;
            // @ts-ignore
            const cur = t.hour[key];
            checked += 1;
            if (!cur)
                continue;
            const dir = cur.direction;
            if (i.type === 'DEMAND_SURGE_DETECTED' && (dir === 'STABLE' || dir === 'FALLING')) {
                mismatches += 1;
                notes.push('Demand surge vs non-rising temporal demand');
            }
            if ((i.type === 'KITCHEN_BOTTLENECK_IDENTIFIED' || i.type === 'OPERATIONAL_CONGESTION') && (dir === 'STABLE' || dir === 'FALLING')) {
                mismatches += 1;
                notes.push('KDS congestion vs non-rising operational pressure');
            }
            if (i.type === 'SUPPLY_CHAIN_DEGRADATION' && (dir === 'STABLE' || dir === 'FALLING')) {
                mismatches += 1;
                notes.push('Supply degradation vs non-rising supply risk');
            }
        }
        const score = checked ? clamp01(mismatches / checked) : 0;
        return { score, kinds: score > 0 ? ['temporal mismatch'] : [], notes };
    }
    catch {
        return { score: 0, kinds: [], notes: [] };
    }
}
async function financialContradictions(insights) {
    try {
        if (process.env.DIE_FINANCE_INTELLIGENCE_ENABLED !== 'true')
            return { score: 0, kinds: [], notes: [] };
        const fin = await (0, finance_intelligence_1.computeFinanceSnapshot)();
        let mismatches = 0;
        let checked = 0;
        const notes = [];
        for (const i of insights) {
            if (i.type === 'REVENUE_GROWTH_DETECTED') {
                checked += 1;
                const d = fin.trends.day.revenue.direction;
                if (d === 'FALLING') {
                    mismatches += 1;
                    notes.push('Revenue growth vs finance trend falling');
                }
            }
            if (i.type === 'REVENUE_DECLINE_DETECTED') {
                checked += 1;
                const d = fin.trends.day.revenue.direction;
                if (d === 'RISING') {
                    mismatches += 1;
                    notes.push('Revenue decline vs finance trend rising');
                }
            }
            if (i.type === 'FINANCIAL_HEALTH_WARNING') {
                checked += 1;
                if (fin.health.revenueHealthScore > 70) {
                    mismatches += 1;
                    notes.push('Financial health warning vs healthy score');
                }
            }
            if (i.type === 'PAYMENT_PROVIDER_DEGRADATION') {
                checked += 1;
                const top = fin.trends.day.topProvider;
                if (top && top.direction !== 'RISING') {
                    mismatches += 1;
                    notes.push('Provider degradation vs provider failure not rising');
                }
            }
        }
        const score = checked ? clamp01(mismatches / checked) : 0;
        return { score, kinds: score > 0 ? ['financial mismatch'] : [], notes };
    }
    catch {
        return { score: 0, kinds: [], notes: [] };
    }
}
async function crossDomainInconsistency(insights) {
    try {
        const report = await correlation_engine_service_1.correlationEngine.generateReport();
        const signals = report.riskSignals.map((r) => r.signal.toLowerCase());
        let mismatches = 0;
        let checked = 0;
        const notes = [];
        for (const i of insights) {
            if (i.type === 'KITCHEN_BOTTLENECK_IDENTIFIED') {
                checked += 1;
                if (!signals.some((s) => s.includes('kitchen') || s.includes('backlog'))) {
                    mismatches += 1;
                    notes.push('Kitchen bottleneck without correlation support');
                }
            }
            if (i.type === 'SUPPLY_CHAIN_DEGRADATION') {
                checked += 1;
                if (!signals.some((s) => s.includes('supplier') || s.includes('delivery'))) {
                    mismatches += 1;
                    notes.push('Supply degradation without correlation support');
                }
            }
            if (i.type === 'DEMAND_SURGE_DETECTED') {
                checked += 1;
                if (!signals.some((s) => s.includes('demand') || s.includes('campaign'))) {
                    mismatches += 1;
                    notes.push('Demand surge without correlation support');
                }
            }
        }
        const score = checked ? clamp01(mismatches / checked) : 0;
        return { score, kinds: score > 0 ? ['cross-domain inconsistency'] : [], notes };
    }
    catch {
        return { score: 0, kinds: [], notes: [] };
    }
}
function repeatedFalseConfidence() {
    try {
        const evaluated = (0, evaluation_engine_1.getEvaluatedRecords)();
        const highTrust = evaluated.filter((r) => (r.trustScore ?? 0) >= 80);
        const wrongHighTrust = highTrust.filter((r) => r.predictionCorrect === false);
        const score = highTrust.length ? clamp01(wrongHighTrust.length / highTrust.length) : 0;
        const notes = highTrust.length ? [`${wrongHighTrust.length}/${highTrust.length} high-trust predictions were incorrect`] : [];
        return { score, kinds: score > 0 ? ['repeated false confidence'] : [], notes };
    }
    catch {
        return { score: 0, kinds: [], notes: [] };
    }
}
function selfReinforcementBias(insights) {
    try {
        const ceo = (0, ceo_prioritization_1.prioritizeForCEO)(insights);
        const topDomains = ceo.slice(0, 5).map((i) => i.domain);
        const dominantDomain = topDomains.length ? topDomains.sort((a, b) => topDomains.filter(x => x === a).length - topDomains.filter(x => x === b).length).pop() : '';
        const sameDomainCount = topDomains.filter((d) => d === dominantDomain).length;
        const contributingCodes = new Set();
        for (const i of insights)
            for (const s of i.contributingSignals || [])
                contributingCodes.add(s.code);
        const patterns = [];
        if (sameDomainCount >= Math.ceil(topDomains.length * 0.8) && topDomains.length >= 3) {
            patterns.push('CEO priorities dominated by a single domain');
        }
        if (contributingCodes.size <= Math.ceil(insights.length / 3)) {
            patterns.push('Multiple insights share the same few signals (low evidence diversity)');
        }
        const biasScore = clamp01((patterns.length ? 0.4 : 0) + (sameDomainCount / Math.max(1, topDomains.length)) * 0.3 + ((insights.length - contributingCodes.size) / Math.max(1, insights.length)) * 0.3);
        return { biasScore, biasPatterns: patterns };
    }
    catch {
        return { biasScore: 0, biasPatterns: [] };
    }
}
function overconfidence() {
    try {
        const all = (0, evaluation_engine_1.getRecords)();
        const evaluated = (0, evaluation_engine_1.getEvaluatedRecords)();
        const highTrust = evaluated.filter((r) => (r.trustScore ?? 0) >= 90);
        const wrongHigh = highTrust.filter((r) => r.predictionCorrect === false);
        const riskFromTrust = highTrust.length ? wrongHigh.length / highTrust.length : 0;
        // Stable-but-wrong: repeated incorrect predictions of the same type
        const counts = new Map();
        for (const r of evaluated) {
            const k = r.insightType;
            const c = counts.get(k) || { total: 0, wrong: 0 };
            c.total += 1;
            if (r.predictionCorrect === false)
                c.wrong += 1;
            counts.set(k, c);
        }
        let stableWrong = 0;
        let groups = 0;
        for (const v of counts.values()) {
            if (v.total >= 3) {
                groups += 1;
                if (v.wrong / v.total >= 0.6)
                    stableWrong += 1;
            }
        }
        const riskFromStability = groups ? stableWrong / groups : 0;
        const overconfidenceRisk = clamp01(0.6 * riskFromTrust + 0.4 * riskFromStability);
        const notes = [];
        if (highTrust.length)
            notes.push(`${wrongHigh.length}/${highTrust.length} of 90+ trust predictions were incorrect`);
        if (groups)
            notes.push(`${stableWrong}/${groups} recurring insight groups were mostly incorrect`);
        return { overconfidenceRisk, notes };
    }
    catch {
        return { overconfidenceRisk: 0, notes: [] };
    }
}
function truthStability(accuracy, contradiction, bias, overconf) {
    // Penalize contradictions and overconfidence more than bias
    const trusted = accuracy * (1 - 0.5 * contradiction) * (1 - 0.3 * bias) * (1 - 0.5 * overconf);
    const score = Math.round(clamp01(trusted) * 100);
    return { truthStabilityScore: score, systemTruthGrade: gradeFromScore(score) };
}
async function buildTruthAuditSnapshot() {
    if (process.env.DIE_INTELLIGENCE_TRUTH_AUDIT_ENABLED !== 'true') {
        return {
            contradictionReport: { contradictionScore: 0, contradictionTypes: [], notes: [] },
            biasReport: { biasScore: 0, biasPatterns: [] },
            overconfidenceReport: { overconfidenceRisk: 0, notes: [] },
            truthStabilityIndex: { truthStabilityScore: 0, systemTruthGrade: 'F' },
            recommendations: [],
        };
    }
    // Ensure evaluated records are up-to-date (lazy, read-only)
    await (0, evaluation_engine_1.evaluateDue)();
    const [insights, acc] = await Promise.all([
        reasoning_engine_1.businessReasoning.generateInsights(),
        (async () => {
            const evaluated = (0, evaluation_engine_1.getEvaluatedRecords)();
            return (0, prediction_validator_1.computeAccuracyMetrics)(evaluated, (0, evaluation_engine_1.getRecords)()).overallAccuracy;
        })(),
    ]);
    const ceo = (0, ceo_prioritization_1.prioritizeForCEO)(insights); // used for bias pattern analysis only
    if (process.env.DIE_INTELLIGENCE_KERNEL_SHADOW === 'true') {
        try {
            await Promise.all(insights.map((i) => (0, unified_intelligence_kernel_2.getEvidence)(i.type)));
        }
        catch { }
    }
    const temporal = temporalContradictions(insights);
    const financial = await financialContradictions(insights);
    const cross = await crossDomainInconsistency(insights);
    const falseConf = repeatedFalseConfidence();
    const contradictionScore = clamp01((temporal.score * 0.3) + (financial.score * 0.4) + (cross.score * 0.2) + (falseConf.score * 0.1));
    const contradictionTypes = Array.from(new Set([...temporal.kinds, ...financial.kinds, ...cross.kinds, ...falseConf.kinds]));
    const contradictionNotes = [...temporal.notes, ...financial.notes, ...cross.notes, ...falseConf.notes];
    const bias = selfReinforcementBias(insights);
    const overconf = overconfidence();
    const index = truthStability(acc, contradictionScore, bias.biasScore, overconf.overconfidenceRisk);
    if (process.env.DIE_INTELLIGENCE_DUAL_READ_ENABLED === 'true') {
        try {
            const uikTruth = unified_intelligence_kernel_1.scoring.computeTruthScore({ accuracy: acc, contradiction: contradictionScore, bias: bias.biasScore, overconfidence: overconf.overconfidenceRisk });
            const overconfCategories = [];
            if (overconf.notes?.length) {
                if (overconf.notes.some((n) => n.toLowerCase().includes('90+ trust')))
                    overconfCategories.push('high_trust_wrong');
                if (overconf.notes.some((n) => n.toLowerCase().includes('recurring')))
                    overconfCategories.push('stable_but_wrong');
            }
            (0, convergence_engine_1.measureTruthAuditConvergence)({
                legacyTruthScore: index.truthStabilityScore,
                uikTruthScore: uikTruth,
                legacyContradiction: contradictionScore,
                uikContradiction: contradictionScore,
                legacyContradictionTypes: contradictionTypes,
                legacyBiasScore: bias.biasScore,
                legacyBiasPatterns: bias.biasPatterns,
                legacyOverconfidenceRisk: overconf.overconfidenceRisk,
                legacyOverconfidenceCategories: overconfCategories,
            });
        }
        catch { }
    }
    const recs = [];
    if (contradictionScore > 0.3)
        recs.push('Investigate sources of contradiction: verify temporal and finance trend alignment against reasoning outputs.');
    if (bias.biasScore > 0.3)
        recs.push('Reduce self-reinforcement: diversify evidence and require independent cross-domain support.');
    if (overconf.overconfidenceRisk > 0.3)
        recs.push('Lower trust on similar future signals or tighten calibration until evaluation confirms correctness.');
    if (index.truthStabilityScore < 70)
        recs.push('Overall truth stability is weak; prioritize calibration and evidence diversity.');
    return {
        contradictionReport: { contradictionScore, contradictionTypes, notes: contradictionNotes },
        biasReport: bias,
        overconfidenceReport: overconf,
        truthStabilityIndex: index,
        recommendations: recs,
    };
}
