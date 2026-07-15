"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordInsightsSnapshot = recordInsightsSnapshot;
exports.getInsightsHistory = getInsightsHistory;
exports.setCorrelationSnapshot = setCorrelationSnapshot;
exports.getCorrelationSnapshot = getCorrelationSnapshot;
exports.setFeedSnapshot = setFeedSnapshot;
exports.recordTemporalSample = recordTemporalSample;
exports.getFeedSnapshot = getFeedSnapshot;
exports.getFeedHistoryWithin = getFeedHistoryWithin;
exports.getInsightsWindowCounts = getInsightsWindowCounts;
exports.getLastTwoSnapshots = getLastTwoSnapshots;
exports.getWindowSummary = getWindowSummary;
exports.get1HourSummary = get1HourSummary;
exports.get24HourSummary = get24HourSummary;
exports.get7DaySummary = get7DaySummary;
exports.getTemporalComparisons = getTemporalComparisons;
const trend_utils_1 = require("../../die/intelligence-core/trend-utils");
const HISTORY_LIMIT = 10;
const TTL_MS = 90000; // 60–120s per Phase 5 requirement
let insightsHistory = [];
let lastCorrelation = null;
let lastFeed = null;
// Extended: maintain lightweight feed history for time-aware CEO comparisons (no persistence)
const FEED_HISTORY_LIMIT = 300;
let feedHistory = [];
const TEMPORAL_LIMIT = 1000;
let temporalSamples = [];
const RISK_INSIGHT_TYPES = [
    'REVENUE_RISK_DETECTED',
    'KITCHEN_BOTTLENECK_IDENTIFIED',
    'SUPPLY_CHAIN_DEGRADATION',
    'CUSTOMER_CHURN_RISK',
    'OPERATIONAL_CONGESTION',
    'TABLE_TURNOVER_INEFFICIENCY',
];
function recordInsightsSnapshot(insights) {
    const snap = { at: Date.now(), insights };
    insightsHistory.unshift(snap);
    if (insightsHistory.length > HISTORY_LIMIT)
        insightsHistory = insightsHistory.slice(0, HISTORY_LIMIT);
}
function getInsightsHistory() {
    const now = Date.now();
    return insightsHistory.filter((s) => now - s.at < TTL_MS);
}
function setCorrelationSnapshot(report) {
    lastCorrelation = { at: Date.now(), report };
}
function getCorrelationSnapshot() {
    const now = Date.now();
    if (!lastCorrelation)
        return null;
    if (now - lastCorrelation.at > TTL_MS)
        return null;
    return lastCorrelation;
}
function setFeedSnapshot(feed) {
    lastFeed = { at: Date.now(), feed };
    // also extend feed history buffer
    feedHistory.unshift(lastFeed);
    if (feedHistory.length > FEED_HISTORY_LIMIT)
        feedHistory = feedHistory.slice(0, FEED_HISTORY_LIMIT);
}
function recordTemporalSample(insights, report, feed) {
    const at = Date.now();
    const insightCounts = {};
    let riskCount = 0;
    for (const i of insights) {
        insightCounts[i.type] = (insightCounts[i.type] || 0) + 1;
        if (RISK_INSIGHT_TYPES.includes(i.type))
            riskCount += 1;
    }
    const feedSeverities = { INFO: 0, WARN: 0, CRITICAL: 0 };
    const feedCodes = {};
    const domainActivity = {};
    for (const f of feed) {
        feedSeverities[f.severity] += 1;
        feedCodes[f.code] = (feedCodes[f.code] || 0) + 1;
        const tag = f.data?.sourceTag;
        if (tag)
            domainActivity[tag] = (domainActivity[tag] || 0) + 1;
    }
    const anomalyCount = feedSeverities.WARN + feedSeverities.CRITICAL;
    const demand = feedCodes['SESSION_STARTED'] || 0;
    const operationalPressure = (feedCodes['KDS_BACKLOG_ALERT'] || 0) + (insightCounts['OPERATIONAL_CONGESTION'] || 0) + (insightCounts['KITCHEN_BOTTLENECK_IDENTIFIED'] || 0);
    const supplyRisk = (feedCodes['DELIVERY_DELAYED'] || 0) + (feedCodes['DELIVERY_FAILED'] || 0) + (insightCounts['SUPPLY_CHAIN_DEGRADATION'] || 0);
    const customerActivity = (feedCodes['SLIP_CREATED'] || 0) + (feedCodes['SLIP_PAID'] || 0) + (feedCodes['CAMPAIGN_COMPLETED'] || 0);
    const revenueIndicator = 0;
    const sample = { at, insightCounts, riskCount, anomalyCount, demand, operationalPressure, supplyRisk, customerActivity, revenueIndicator, feedSeverities, feedCodes, domainActivity };
    temporalSamples.unshift(sample);
    if (temporalSamples.length > TEMPORAL_LIMIT)
        temporalSamples = temporalSamples.slice(0, TEMPORAL_LIMIT);
}
function getFeedSnapshot() {
    const now = Date.now();
    if (!lastFeed)
        return null;
    if (now - lastFeed.at > TTL_MS)
        return null;
    return lastFeed;
}
function getFeedHistoryWithin(windowMs) {
    const cutoff = Date.now() - windowMs;
    const slices = feedHistory.filter((h) => h.at >= cutoff);
    // flatten limited samples to keep small
    const out = [];
    for (const s of slices)
        out.push(...s.feed.slice(0, 50));
    return out;
}
// Aggregate insights within a time window using cached history
function getInsightsWindowCounts(windowMs) {
    const cutoff = Date.now() - windowMs;
    const relevant = insightsHistory.filter((s) => s.at >= cutoff);
    const counts = {};
    for (const snap of relevant) {
        for (const ins of snap.insights)
            counts[ins.type] = (counts[ins.type] || 0) + 1;
    }
    return counts;
}
function getLastTwoSnapshots() {
    return insightsHistory.slice(0, 2);
}
function filterSamplesBetween(start, end) {
    return temporalSamples.filter((s) => s.at >= start && s.at < end);
}
function summarize(samples) {
    const insightCounts = {};
    let riskCount = 0;
    let anomalyCount = 0;
    let demand = 0;
    let operationalPressure = 0;
    let supplyRisk = 0;
    let customerActivity = 0;
    let revenueIndicator = 0;
    for (const s of samples) {
        for (const k of Object.keys(s.insightCounts))
            insightCounts[k] = (insightCounts[k] || 0) + s.insightCounts[k];
        riskCount += s.riskCount;
        anomalyCount += s.anomalyCount;
        demand += s.demand;
        operationalPressure += s.operationalPressure;
        supplyRisk += s.supplyRisk;
        customerActivity += s.customerActivity;
        revenueIndicator += s.revenueIndicator;
    }
    return { samples: samples.length, insightCounts, riskCount, anomalyCount, demand, operationalPressure, supplyRisk, customerActivity, revenueIndicator };
}
function getWindowSummary(windowMs) {
    const end = Date.now();
    const start = end - windowMs;
    const samples = filterSamplesBetween(start, end);
    const base = summarize(samples);
    return { since: new Date(start).toISOString(), ...base };
}
function get1HourSummary() { return getWindowSummary(60 * 60 * 1000); }
function get24HourSummary() { return getWindowSummary(24 * 60 * 60 * 1000); }
function get7DaySummary() { return getWindowSummary(7 * 24 * 60 * 60 * 1000); }
function sumMetric(samples, pick) {
    let total = 0;
    for (const s of samples)
        total += pick(s);
    return total;
}
function compareWindows(curStart, curEnd, prevStart, prevEnd, pick) {
    const cur = sumMetric(filterSamplesBetween(curStart, curEnd), pick);
    const prev = sumMetric(filterSamplesBetween(prevStart, prevEnd), pick);
    const prev2Start = prevStart - (curEnd - curStart);
    const prev2End = prevStart;
    const prev2 = sumMetric(filterSamplesBetween(prev2Start, prev2End), pick);
    const series = [prev2, prev, cur];
    const a = (0, trend_utils_1.analyzeSeries)(series);
    return { current: cur, previous: prev, direction: a.direction, momentum: a.momentum, acceleration: a.acceleration };
}
function getTemporalComparisons() {
    const now = Date.now();
    const h = 60 * 60 * 1000;
    const d = 24 * 60 * 60 * 1000;
    const w = 7 * d;
    const hour = {
        demand: compareWindows(now - h, now, now - 2 * h, now - h, (s) => s.demand),
        operationalPressure: compareWindows(now - h, now, now - 2 * h, now - h, (s) => s.operationalPressure),
        supplyRisk: compareWindows(now - h, now, now - 2 * h, now - h, (s) => s.supplyRisk),
        customerActivity: compareWindows(now - h, now, now - 2 * h, now - h, (s) => s.customerActivity),
        risk: compareWindows(now - h, now, now - 2 * h, now - h, (s) => s.riskCount),
        anomaly: compareWindows(now - h, now, now - 2 * h, now - h, (s) => s.anomalyCount),
    };
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const yesterdayStart = new Date(todayStart.getTime() - d);
    const day = {
        demand: compareWindows(todayStart.getTime(), now, yesterdayStart.getTime(), todayStart.getTime(), (s) => s.demand),
        operationalPressure: compareWindows(todayStart.getTime(), now, yesterdayStart.getTime(), todayStart.getTime(), (s) => s.operationalPressure),
        supplyRisk: compareWindows(todayStart.getTime(), now, yesterdayStart.getTime(), todayStart.getTime(), (s) => s.supplyRisk),
        customerActivity: compareWindows(todayStart.getTime(), now, yesterdayStart.getTime(), todayStart.getTime(), (s) => s.customerActivity),
        risk: compareWindows(todayStart.getTime(), now, yesterdayStart.getTime(), todayStart.getTime(), (s) => s.riskCount),
        anomaly: compareWindows(todayStart.getTime(), now, yesterdayStart.getTime(), todayStart.getTime(), (s) => s.anomalyCount),
    };
    const week = {
        demand: compareWindows(now - w, now, now - 2 * w, now - w, (s) => s.demand),
        operationalPressure: compareWindows(now - w, now, now - 2 * w, now - w, (s) => s.operationalPressure),
        supplyRisk: compareWindows(now - w, now, now - 2 * w, now - w, (s) => s.supplyRisk),
        customerActivity: compareWindows(now - w, now, now - 2 * w, now - w, (s) => s.customerActivity),
        risk: compareWindows(now - w, now, now - 2 * w, now - w, (s) => s.riskCount),
        anomaly: compareWindows(now - w, now, now - 2 * w, now - w, (s) => s.anomalyCount),
    };
    return { hour, day, week };
}
