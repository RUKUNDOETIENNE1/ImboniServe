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
exports.buildBaselineProfile = buildBaselineProfile;
const context_cache_1 = require("../../die/assistant/context-cache");
function stats(values) {
    const arr = values.slice().sort((a, b) => a - b);
    const n = arr.length || 1;
    const mean = arr.reduce((s, v) => s + v, 0) / n;
    const mid = Math.floor(n / 2);
    const median = n % 2 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2;
    const variance = arr.reduce((s, v) => s + (v - mean) * (v - mean), 0) / n;
    const stddev = Math.sqrt(variance);
    // simple rolling avg: last 3 if available
    const last3 = arr.slice(-3);
    const rollingAvg = last3.length ? last3.reduce((s, v) => s + v, 0) / last3.length : mean;
    return { mean, median, variance, stddev, rollingAvg };
}
function groupCountsBy(feedCodes, grouper) {
    const perCode = {};
    for (const f of feedCodes) {
        const g = grouper(f.ts);
        if (!perCode[f.code])
            perCode[f.code] = {};
        if (!perCode[f.code][g])
            perCode[f.code][g] = [];
        // push 1 per event; later we'll aggregate counts per bucket
        perCode[f.code][g].push(1);
    }
    // Reduce to counts per bucket
    const result = {};
    for (const code of Object.keys(perCode)) {
        result[code] = {};
        for (const bucket of Object.keys(perCode[code])) {
            const count = perCode[code][bucket].length;
            // store as single-sample stats; upstream aggregates across days when present
            result[code][bucket] = stats([count]);
        }
    }
    return result;
}
async function buildBaselineProfile() {
    // last 7 days of feed history (bounded by in-memory history limits)
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const feed = (0, context_cache_1.getFeedHistoryWithin)(sevenDaysMs);
    const feedCodes = feed.map((f) => ({ ts: new Date(f.timestamp), code: f.code }));
    const byHourRaw = groupCountsBy(feedCodes, (d) => String(d.getHours()));
    const byWeekdayRaw = groupCountsBy(feedCodes, (d) => String(d.getDay()));
    // Metrics of interest composed from codes
    function aggregateMetric(codes) {
        const byHour = {};
        const byWeekday = {};
        for (const c of codes) {
            const hMap = byHourRaw[c] || {};
            for (const h of Object.keys(hMap)) {
                if (!byHour[h])
                    byHour[h] = [];
                byHour[h].push(hMap[h].mean);
            }
            const wMap = byWeekdayRaw[c] || {};
            for (const w of Object.keys(wMap)) {
                if (!byWeekday[w])
                    byWeekday[w] = [];
                byWeekday[w].push(wMap[w].mean);
            }
        }
        const outH = {};
        const outW = {};
        for (const h of Object.keys(byHour))
            outH[h] = stats(byHour[h]);
        for (const w of Object.keys(byWeekday))
            outW[w] = stats(byWeekday[w]);
        return { byHour: outH, byWeekday: outW };
    }
    const metrics = {
        reservations: aggregateMetric(['RESERVATION_CREATED']),
        kdsBacklog: aggregateMetric(['KDS_BACKLOG_ALERT']),
        deliveryIssues: aggregateMetric(['DELIVERY_DELAYED', 'DELIVERY_FAILED']),
        campaignsDeliverabilityWeak: aggregateMetric(['CAMPAIGN_DELIVERABILITY_WEAK']),
        paymentExceptions: aggregateMetric(['PAYMENT_EXCEPTION']),
    };
    const profile = {
        byHour: {},
        byWeekday: {},
        metrics,
    };
    // Finance baselines (optional): in-memory read from FinancialLedgerEntry via finance snapshot
    try {
        if (process.env.DIE_FINANCE_INTELLIGENCE_ENABLED === 'true') {
            const { computeFinanceSnapshot } = await Promise.resolve().then(() => __importStar(require('../../die/finance/finance-intelligence')));
            const fin = await computeFinanceSnapshot();
            profile.finance = {
                revenueByHour: stats([fin.windows.oneHour.revenueCents]),
                revenueByDay: stats([fin.windows.day.revenueCents]),
            };
        }
    }
    catch { }
    return profile;
}
