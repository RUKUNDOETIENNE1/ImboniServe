"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildStrategicShiftSummary = buildStrategicShiftSummary;
const context_cache_1 = require("../../die/assistant/context-cache");
function delta(a, b) { return a - b; }
function buildStrategicShiftSummary(_now) {
    const t = (0, context_cache_1.getTemporalComparisons)();
    function dirText(d) {
        if (d === 'RISING')
            return 'rising';
        if (d === 'FALLING')
            return 'falling';
        if (d === 'VOLATILE')
            return 'volatile';
        return 'stable';
    }
    const hourMsgs = [];
    hourMsgs.push(`Demand is ${dirText(t.hour.demand.direction)} hour-over-hour`);
    hourMsgs.push(`Operational pressure is ${dirText(t.hour.operationalPressure.direction)} hour-over-hour`);
    hourMsgs.push(`Supply risk is ${dirText(t.hour.supplyRisk.direction)} hour-over-hour`);
    const dayMsgs = [];
    dayMsgs.push(`Today vs yesterday: demand ${dirText(t.day.demand.direction)}, ops pressure ${dirText(t.day.operationalPressure.direction)}, supply risk ${dirText(t.day.supplyRisk.direction)}`);
    const weekMsgs = [];
    weekMsgs.push(`Last 7 days vs prior: demand ${dirText(t.week.demand.direction)}, ops pressure ${dirText(t.week.operationalPressure.direction)}, supply risk ${dirText(t.week.supplyRisk.direction)}`);
    const changingDirection = [];
    for (const [k, comp] of Object.entries(t.hour)) {
        // @ts-ignore
        if (comp.direction === 'RISING' || comp.direction === 'FALLING')
            changingDirection.push(`${k} ${dirText(comp.direction)} (Δ=${comp.momentum})`);
    }
    const emergingTrends = [];
    if (t.week.demand.direction === 'RISING')
        emergingTrends.push('Sustained demand growth');
    if (t.week.operationalPressure.direction === 'RISING')
        emergingTrends.push('Operational pressure building');
    if (t.week.supplyRisk.direction === 'RISING')
        emergingTrends.push('Supply risk mounting');
    const systemicRisks = [];
    if (t.week.anomaly.direction === 'RISING')
        systemicRisks.push('Incidents trending up week-over-week');
    if (t.day.risk.direction === 'RISING')
        systemicRisks.push('Risk insights up vs yesterday');
    const opportunities = [];
    if (t.hour.demand.direction === 'RISING' && t.hour.operationalPressure.direction !== 'RISING')
        opportunities.push('Leverage near-term demand without overloading ops');
    if (t.day.supplyRisk.direction === 'FALLING')
        opportunities.push('Stabilizing supply chain — resume normal promotions pacing');
    const narrative = [
        hourMsgs.join('. ') + '.',
        dayMsgs.join('. ') + '.',
        weekMsgs.join('. ') + '.',
    ].join(' ');
    return {
        narrative,
        changingDirection,
        emergingTrends,
        systemicRisks,
        compoundingOpportunities: opportunities,
    };
}
