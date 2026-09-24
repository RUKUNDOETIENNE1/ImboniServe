"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAssistantOverview = generateAssistantOverview;
exports.generateExecutiveOverview = generateExecutiveOverview;
const reasoning_engine_1 = require("../die/business-intelligence/reasoning-engine");
const correlation_engine_service_1 = require("../die/intelligence-core/correlation-engine.service");
const shadow_observability_1 = require("../die/business-as-plugin/shadow/shadow-observability");
const context_cache_1 = require("../die/assistant/context-cache");
const reasoning_to_language_1 = require("../die/assistant/reasoning-to-language");
const realtime_narrator_1 = require("../die/assistant/realtime-narrator");
const ceo_prioritization_1 = require("../die/assistant/ceo-prioritization");
const executive_evolution_1 = require("../die/assistant/executive-evolution");
async function generateAssistantOverview() {
    if (process.env.DIE_AI_ASSISTANT_ENABLED !== 'true') {
        return { summary: '', keyInsights: [], risks: [], opportunities: [], systemHealthNarrative: '', recommendedFocusAreas: [] };
    }
    const [insights, report] = await Promise.all([
        reasoning_engine_1.businessReasoning.generateInsights(),
        correlation_engine_service_1.correlationEngine.generateReport(),
    ]);
    const feed = shadow_observability_1.shadowObservability.list(200);
    // record to read-only in-memory cache
    (0, context_cache_1.recordInsightsSnapshot)(insights);
    (0, context_cache_1.setCorrelationSnapshot)(report);
    (0, context_cache_1.setFeedSnapshot)(feed);
    (0, context_cache_1.recordTemporalSample)(insights, report, feed);
    const keyInsights = insights
        .slice()
        .sort((a, b) => (a.severity === 'CRITICAL' ? 1 : 0) - (b.severity === 'CRITICAL' ? 1 : 0) || b.confidence - a.confidence)
        .slice(0, 7);
    const summary = (0, reasoning_to_language_1.buildDailySummary)(insights);
    const revenue = (0, reasoning_to_language_1.buildRevenuePressureExplanation)(insights);
    const operational = (0, reasoning_to_language_1.buildOperationalRiskExplanation)(insights);
    const supply = (0, reasoning_to_language_1.buildSupplyChainExplanation)(insights);
    const cx = (0, reasoning_to_language_1.buildCustomerExperienceExplanation)(insights);
    const nowNarrative = (0, realtime_narrator_1.whatsHappeningNow)(feed, insights, report);
    const risks = [revenue, operational, supply, cx].filter(Boolean);
    const opportunities = (0, reasoning_to_language_1.selectOpportunities)(insights);
    // include some system health flavor text from correlation hotspots/inefficiencies
    const healthParts = [];
    const hs = report.hotspots.length;
    const inef = report.inefficiencies.length;
    if (hs > 0)
        healthParts.push(`${hs} hotspots observed in plugin lifecycle and anomalies.`);
    if (inef > 0)
        healthParts.push(`${inef} inefficiency areas detected across marketplace or stability metrics.`);
    if (healthParts.length === 0)
        healthParts.push('Overall system health appears steady based on current signals.');
    healthParts.push(nowNarrative);
    // Temporal change narratives (read-only, from rolling windows)
    const temporal = (0, context_cache_1.getTemporalComparisons)();
    const temporalNarratives = (0, reasoning_to_language_1.buildTemporalChangeNarratives)(temporal);
    let systemHealthNarrative = [healthParts.join(' '), temporalNarratives.whatChanged, temporalNarratives.improving, temporalNarratives.worsening, temporalNarratives.stable]
        .filter(Boolean)
        .join(' ');
    // Append finance perspective if enabled
    if (process.env.DIE_FINANCE_INTELLIGENCE_ENABLED === 'true') {
        try {
            const { computeFinanceSnapshot } = await Promise.resolve().then(() => __importStar(require('../die/finance/finance-intelligence')));
            const fin = await computeFinanceSnapshot();
            const financeNarrative = (0, reasoning_to_language_1.buildFinanceNarrative)(fin);
            systemHealthNarrative = [systemHealthNarrative, financeNarrative].filter(Boolean).join(' ');
        }
        catch { }
    }
    const recommendedFocusAreas = (0, reasoning_to_language_1.recommendFocusAreas)(insights);
    return {
        summary,
        keyInsights,
        risks,
        opportunities,
        systemHealthNarrative,
        recommendedFocusAreas,
    };
}
async function generateExecutiveOverview() {
    if (process.env.DIE_AI_CEO_LAYER_ENABLED !== 'true') {
        return {
            currentSnapshot: { summary: '', keyInsights: [], risks: [], opportunities: [], systemHealthNarrative: '', recommendedFocusAreas: [] },
            previousSnapshot: undefined,
            delta: { addedInsights: [], resolvedInsights: [], confidenceShift: [] },
            ceoFocus: [],
            strategicShift: { narrative: '', changingDirection: [], emergingTrends: [], systemicRisks: [], compoundingOpportunities: [] },
        };
    }
    const current = await generateAssistantOverview();
    // Compare to previous in-memory snapshot (if any)
    const lastTwo = (0, context_cache_1.getLastTwoSnapshots)();
    const prev = lastTwo[1]?.insights || [];
    const now = current.keyInsights;
    const prevMap = new Map(prev.map((i) => [i.type, i]));
    const nowMap = new Map(now.map((i) => [i.type, i]));
    const added = [];
    const resolved = [];
    const confShift = [];
    for (const i of now)
        if (!prevMap.has(i.type))
            added.push(i.type);
    for (const i of prev)
        if (!nowMap.has(i.type))
            resolved.push(i.type);
    for (const i of now) {
        const p = prevMap.get(i.type);
        if (p)
            confShift.push({ type: i.type, delta: Number((i.confidence - p.confidence).toFixed(2)) });
    }
    const ceoFocus = (0, ceo_prioritization_1.prioritizeForCEO)(current.keyInsights);
    const strategicShift = (0, executive_evolution_1.buildStrategicShiftSummary)(current.keyInsights);
    return {
        currentSnapshot: current,
        previousSnapshot: prev.length ? {
            summary: '', keyInsights: prev, risks: [], opportunities: [], systemHealthNarrative: '', recommendedFocusAreas: []
        } : undefined,
        delta: { addedInsights: added, resolvedInsights: resolved, confidenceShift: confShift },
        ceoFocus,
        strategicShift,
    };
}
