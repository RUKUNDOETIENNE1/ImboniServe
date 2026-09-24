"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scoring = exports.getThresholds = exports.UIK_FLAGS = void 0;
exports.getInsightDefinition = getInsightDefinition;
exports.getSemanticDictionaries = getSemanticDictionaries;
exports.registerUIKResolvers = registerUIKResolvers;
exports.getEvidence = getEvidence;
const semantic_dictionary_1 = require("./semantic-dictionary");
const threshold_engine_1 = require("./threshold-engine");
Object.defineProperty(exports, "getThresholds", { enumerable: true, get: function () { return threshold_engine_1.getThresholds; } });
const score_engine_1 = require("./score-engine");
const context_cache_1 = require("../../die/assistant/context-cache");
const correlation_engine_service_1 = require("../../die/intelligence-core/correlation-engine.service");
const finance_intelligence_1 = require("../../die/finance/finance-intelligence");
const prediction_validator_1 = require("../../die/evaluation/prediction-validator");
exports.UIK_FLAGS = {
    enabled: () => process.env.DIE_INTELLIGENCE_KERNEL_ENABLED === 'true',
    shadow: () => process.env.DIE_INTELLIGENCE_KERNEL_SHADOW === 'true',
};
function getInsightDefinition(t) {
    return semantic_dictionary_1.InsightDictionary[t];
}
function getSemanticDictionaries() {
    return { InsightDictionary: semantic_dictionary_1.InsightDictionary, EventCodeDictionary: semantic_dictionary_1.EventCodeDictionary, FinanceMetricDictionary: semantic_dictionary_1.FinanceMetricDictionary, TemporalMetricDictionary: semantic_dictionary_1.TemporalMetricDictionary };
}
const resolvers = {};
function registerUIKResolvers(r) { Object.assign(resolvers, r); }
// ---------------
// Tiny in-memory cache with short TTL to dedupe shadow reads
// ---------------
const ttlMs = 2000;
let finCache = null;
let corrCache = null;
const feedCache = new Map();
async function getCachedFinance() {
    if (process.env.DIE_FINANCE_INTELLIGENCE_ENABLED !== 'true')
        return null;
    const now = Date.now();
    if (finCache && (now - finCache.at) < ttlMs && finCache.val !== undefined)
        return finCache.val;
    if (finCache?.p)
        return finCache.p;
    finCache = { at: now, val: null };
    finCache.p = (0, finance_intelligence_1.computeFinanceSnapshot)().then(v => { finCache = { at: Date.now(), val: v }; return v; }).catch(() => { finCache = { at: Date.now(), val: null }; return null; });
    return finCache.p;
}
async function getCachedCorrelation() {
    const now = Date.now();
    if (corrCache && (now - corrCache.at) < ttlMs && corrCache.val)
        return corrCache.val;
    if (corrCache?.p)
        return corrCache.p;
    corrCache = { at: now, val: { riskSignals: [] } };
    corrCache.p = correlation_engine_service_1.correlationEngine.generateReport().then(v => { corrCache = { at: Date.now(), val: v }; return v; }).catch(() => { corrCache = { at: Date.now(), val: { riskSignals: [] } }; return { riskSignals: [] }; });
    return corrCache.p;
}
function getCachedFeed(windowMs) {
    const now = Date.now();
    const ex = feedCache.get(windowMs);
    if (ex && (now - ex.at) < ttlMs)
        return ex.val;
    const feed = (0, context_cache_1.getFeedHistoryWithin)(windowMs);
    const byCode = {};
    for (const f of feed)
        if (semantic_dictionary_1.EventCodeDictionary[f.code])
            byCode[f.code] = (byCode[f.code] || 0) + 1;
    feedCache.set(windowMs, { at: now, val: byCode });
    return byCode;
}
function temporalSliceFor(type, t) {
    switch (type) {
        case 'KITCHEN_BOTTLENECK_IDENTIFIED':
        case 'OPERATIONAL_CONGESTION': return t.hour?.operationalPressure;
        case 'SUPPLY_CHAIN_DEGRADATION': return t.hour?.supplyRisk;
        case 'DEMAND_SURGE_DETECTED': return t.hour?.demand;
        case 'CUSTOMER_CHURN_RISK':
        case 'TABLE_TURNOVER_INEFFICIENCY': return t.hour?.customerActivity;
        default: return undefined;
    }
}
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
function temporalSupportFor(key, t) {
    switch (key) {
        case 'KITCHEN_BOTTLENECK_IDENTIFIED':
        case 'OPERATIONAL_CONGESTION': return t.hour?.operationalPressure?.direction === 'RISING' ? 1 : 0;
        case 'SUPPLY_CHAIN_DEGRADATION': return t.hour?.supplyRisk?.direction === 'RISING' ? 1 : 0;
        case 'DEMAND_SURGE_DETECTED': return t.hour?.demand?.direction === 'RISING' ? 1 : 0;
        case 'CUSTOMER_CHURN_RISK': return t.hour?.customerActivity?.direction === 'FALLING' ? 1 : 0;
        default: return 0;
    }
}
function evaluationSupportFor(key, evaluated) {
    const recs = evaluated.filter(r => String(r.insightType) === key);
    if (!recs.length)
        return 0;
    const correct = recs.filter(r => r.predictionCorrect).length;
    return correct / recs.length;
}
function correlationSupportFor(key, signals) {
    const has = (s) => signals.some(x => x.includes(s));
    if (key === 'KITCHEN_BOTTLENECK_IDENTIFIED')
        return has('kitchen') || has('backlog') ? 1 : 0;
    if (key === 'SUPPLY_CHAIN_DEGRADATION')
        return has('supplier') || has('delivery') ? 1 : 0;
    if (key === 'DEMAND_SURGE_DETECTED')
        return has('demand') || has('campaign') ? 1 : 0;
    return 0;
}
function feedEventSupportFor(key, byCode) {
    const codesFor = {
        DEMAND_SURGE_DETECTED: ['SESSION_STARTED', 'RESERVATION_CREATED'],
        KITCHEN_BOTTLENECK_IDENTIFIED: ['KDS_BACKLOG_ALERT'],
        OPERATIONAL_CONGESTION: ['KDS_BACKLOG_ALERT', 'WAITER_CALL_CREATED'],
        SUPPLY_CHAIN_DEGRADATION: ['DELIVERY_DELAYED', 'SUPPLIER_DELIVERY_DELAYED'],
        REVENUE_RISK_DETECTED: ['PAYMENT_EXCEPTION'],
        CAMPAIGN_EFFECTIVENESS_DROP: ['CAMPAIGN_DELIVERABILITY_WEAK'],
    };
    const list = codesFor[key] || [];
    const total = list.reduce((s, c) => s + (byCode[c] || 0), 0);
    return total > 0 ? 1 : 0; // presence proxy only (UIK shadow)
}
async function getEvidence(insightType, ctx = {}) {
    const windowMs = ctx.windowMs ?? 60 * 60 * 1000;
    const t = (0, context_cache_1.getTemporalComparisons)();
    const [fin, corr] = await Promise.all([getCachedFinance(), getCachedCorrelation()]);
    const byCode = getCachedFeed(windowMs);
    // evaluation metrics are optional (resolver-based) to avoid static import
    const evaluated = resolvers.getEvaluatedRecords ? resolvers.getEvaluatedRecords() : [];
    const all = resolvers.getRecords ? resolvers.getRecords() : [];
    const acc = (evaluated && all && all.length) ? (0, prediction_validator_1.computeAccuracyMetrics)(evaluated, all).overallAccuracy : 0;
    const tempSlice = temporalSliceFor(insightType, t);
    const signals = (corr?.riskSignals || []).map((r) => String(r.signal).toLowerCase());
    const supports = {
        finance: financeSupportFor(insightType, fin),
        temporal: temporalSupportFor(insightType, t),
        evaluation: evaluationSupportFor(insightType, evaluated || []),
        correlation: correlationSupportFor(insightType, signals),
        feedEvent: feedEventSupportFor(insightType, byCode),
    };
    return {
        temporal: tempSlice ? { direction: tempSlice.direction, value: tempSlice.current } : undefined,
        finance: fin,
        evaluation: { total: evaluated.length || 0, correct: (evaluated || []).filter(r => r.predictionCorrect).length, accuracy: acc },
        correlation: { signals: (corr?.riskSignals || []).map((r) => String(r.signal)) },
        feed: { counts: byCode },
        supports,
    };
}
// Unified scoring wrappers
exports.scoring = {
    computeTrustScore: score_engine_1.computeTrustScore,
    computeTruthScore: score_engine_1.computeTruthScore,
    computeConsensusScore: score_engine_1.computeConsensusScore,
    computeRealityScore: score_engine_1.computeRealityScore,
    computeMetaScore: score_engine_1.computeMetaScore,
};
