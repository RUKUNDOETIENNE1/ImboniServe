import type { BusinessInsight } from '@/lib/die/business-intelligence/reasoning-engine'
import type { SystemCorrelationReport } from '@/lib/die/intelligence-core/types'
import { shadowObservability } from '@/lib/die/business-as-plugin/shadow/shadow-observability'
import { analyzeSeries, type TrendDirection } from '@/lib/die/intelligence-core/trend-utils'

export type FeedItem = ReturnType<typeof shadowObservability.list>[number]

const HISTORY_LIMIT = 10
const TTL_MS = 90_000 // 60–120s per Phase 5 requirement

let insightsHistory: Array<{ at: number; insights: BusinessInsight[] }> = []
let lastCorrelation: { at: number; report: SystemCorrelationReport } | null = null
let lastFeed: { at: number; feed: FeedItem[] } | null = null

// Extended: maintain lightweight feed history for time-aware CEO comparisons (no persistence)
const FEED_HISTORY_LIMIT = 300
let feedHistory: Array<{ at: number; feed: FeedItem[] }> = []

type InsightType = BusinessInsight['type']
type Sev = BusinessInsight['severity']

interface TemporalSample {
  at: number
  insightCounts: Record<string, number>
  riskCount: number
  anomalyCount: number
  demand: number
  operationalPressure: number
  supplyRisk: number
  customerActivity: number
  revenueIndicator: number
  feedSeverities: { INFO: number; WARN: number; CRITICAL: number }
  feedCodes: Record<string, number>
  domainActivity: Record<string, number>
}

const TEMPORAL_LIMIT = 1000
let temporalSamples: TemporalSample[] = []

const RISK_INSIGHT_TYPES: InsightType[] = [
  'REVENUE_RISK_DETECTED',
  'KITCHEN_BOTTLENECK_IDENTIFIED',
  'SUPPLY_CHAIN_DEGRADATION',
  'CUSTOMER_CHURN_RISK',
  'OPERATIONAL_CONGESTION',
  'TABLE_TURNOVER_INEFFICIENCY',
]

export function recordInsightsSnapshot(insights: BusinessInsight[]) {
  const snap = { at: Date.now(), insights }
  insightsHistory.unshift(snap)
  if (insightsHistory.length > HISTORY_LIMIT) insightsHistory = insightsHistory.slice(0, HISTORY_LIMIT)
}

export function getInsightsHistory() {
  const now = Date.now()
  return insightsHistory.filter((s) => now - s.at < TTL_MS)
}

export function setCorrelationSnapshot(report: SystemCorrelationReport) {
  lastCorrelation = { at: Date.now(), report }
}

export function getCorrelationSnapshot(): { at: number; report: SystemCorrelationReport } | null {
  const now = Date.now()
  if (!lastCorrelation) return null
  if (now - lastCorrelation.at > TTL_MS) return null
  return lastCorrelation
}

export function setFeedSnapshot(feed: FeedItem[]) {
  lastFeed = { at: Date.now(), feed }
  // also extend feed history buffer
  feedHistory.unshift(lastFeed)
  if (feedHistory.length > FEED_HISTORY_LIMIT) feedHistory = feedHistory.slice(0, FEED_HISTORY_LIMIT)
}

export function recordTemporalSample(insights: BusinessInsight[], report: SystemCorrelationReport | null, feed: FeedItem[]) {
  const at = Date.now()
  const insightCounts: Record<string, number> = {}
  let riskCount = 0
  for (const i of insights) {
    insightCounts[i.type] = (insightCounts[i.type] || 0) + 1
    if (RISK_INSIGHT_TYPES.includes(i.type)) riskCount += 1
  }
  const feedSeverities = { INFO: 0, WARN: 0, CRITICAL: 0 } as { INFO: number; WARN: number; CRITICAL: number }
  const feedCodes: Record<string, number> = {}
  const domainActivity: Record<string, number> = {}
  for (const f of feed) {
    feedSeverities[f.severity] += 1
    feedCodes[f.code] = (feedCodes[f.code] || 0) + 1
    const tag = (f.data as any)?.sourceTag
    if (tag) domainActivity[tag] = (domainActivity[tag] || 0) + 1
  }
  const anomalyCount = feedSeverities.WARN + feedSeverities.CRITICAL
  const demand = feedCodes['SESSION_STARTED'] || 0
  const operationalPressure = (feedCodes['KDS_BACKLOG_ALERT'] || 0) + (insightCounts['OPERATIONAL_CONGESTION'] || 0) + (insightCounts['KITCHEN_BOTTLENECK_IDENTIFIED'] || 0)
  const supplyRisk = (feedCodes['DELIVERY_DELAYED'] || 0) + (feedCodes['DELIVERY_FAILED'] || 0) + (insightCounts['SUPPLY_CHAIN_DEGRADATION'] || 0)
  const customerActivity = (feedCodes['SLIP_CREATED'] || 0) + (feedCodes['SLIP_PAID'] || 0) + (feedCodes['CAMPAIGN_COMPLETED'] || 0)
  const revenueIndicator = 0
  const sample: TemporalSample = { at, insightCounts, riskCount, anomalyCount, demand, operationalPressure, supplyRisk, customerActivity, revenueIndicator, feedSeverities, feedCodes, domainActivity }
  temporalSamples.unshift(sample)
  if (temporalSamples.length > TEMPORAL_LIMIT) temporalSamples = temporalSamples.slice(0, TEMPORAL_LIMIT)
}

export function getFeedSnapshot(): { at: number; feed: FeedItem[] } | null {
  const now = Date.now()
  if (!lastFeed) return null
  if (now - lastFeed.at > TTL_MS) return null
  return lastFeed
}

export function getFeedHistoryWithin(windowMs: number): FeedItem[] {
  const cutoff = Date.now() - windowMs
  const slices = feedHistory.filter((h) => h.at >= cutoff)
  // flatten limited samples to keep small
  const out: FeedItem[] = []
  for (const s of slices) out.push(...s.feed.slice(0, 50))
  return out
}

// Aggregate insights within a time window using cached history
export function getInsightsWindowCounts(windowMs: number): Record<string, number> {
  const cutoff = Date.now() - windowMs
  const relevant = insightsHistory.filter((s) => s.at >= cutoff)
  const counts: Record<string, number> = {}
  for (const snap of relevant) {
    for (const ins of snap.insights) counts[ins.type] = (counts[ins.type] || 0) + 1
  }
  return counts
}

export function getLastTwoSnapshots(): Array<{ at: number; insights: BusinessInsight[] }> {
  return insightsHistory.slice(0, 2)
}

function filterSamplesBetween(start: number, end: number) {
  return temporalSamples.filter((s) => s.at >= start && s.at < end)
}

function summarize(samples: TemporalSample[]) {
  const insightCounts: Record<string, number> = {}
  let riskCount = 0
  let anomalyCount = 0
  let demand = 0
  let operationalPressure = 0
  let supplyRisk = 0
  let customerActivity = 0
  let revenueIndicator = 0
  for (const s of samples) {
    for (const k of Object.keys(s.insightCounts)) insightCounts[k] = (insightCounts[k] || 0) + s.insightCounts[k]
    riskCount += s.riskCount
    anomalyCount += s.anomalyCount
    demand += s.demand
    operationalPressure += s.operationalPressure
    supplyRisk += s.supplyRisk
    customerActivity += s.customerActivity
    revenueIndicator += s.revenueIndicator
  }
  return { samples: samples.length, insightCounts, riskCount, anomalyCount, demand, operationalPressure, supplyRisk, customerActivity, revenueIndicator }
}

export function getWindowSummary(windowMs: number) {
  const end = Date.now()
  const start = end - windowMs
  const samples = filterSamplesBetween(start, end)
  const base = summarize(samples)
  return { since: new Date(start).toISOString(), ...base }
}

export function get1HourSummary() { return getWindowSummary(60 * 60 * 1000) }
export function get24HourSummary() { return getWindowSummary(24 * 60 * 60 * 1000) }
export function get7DaySummary() { return getWindowSummary(7 * 24 * 60 * 60 * 1000) }

function sumMetric(samples: TemporalSample[], pick: (s: TemporalSample) => number) {
  let total = 0
  for (const s of samples) total += pick(s)
  return total
}

function compareWindows(curStart: number, curEnd: number, prevStart: number, prevEnd: number, pick: (s: TemporalSample) => number) {
  const cur = sumMetric(filterSamplesBetween(curStart, curEnd), pick)
  const prev = sumMetric(filterSamplesBetween(prevStart, prevEnd), pick)
  const prev2Start = prevStart - (curEnd - curStart)
  const prev2End = prevStart
  const prev2 = sumMetric(filterSamplesBetween(prev2Start, prev2End), pick)
  const series = [prev2, prev, cur]
  const a = analyzeSeries(series)
  return { current: cur, previous: prev, direction: a.direction, momentum: a.momentum, acceleration: a.acceleration }
}

export function getTemporalComparisons() {
  const now = Date.now()
  const h = 60 * 60 * 1000
  const d = 24 * 60 * 60 * 1000
  const w = 7 * d
  const hour = {
    demand: compareWindows(now - h, now, now - 2*h, now - h, (s) => s.demand),
    operationalPressure: compareWindows(now - h, now, now - 2*h, now - h, (s) => s.operationalPressure),
    supplyRisk: compareWindows(now - h, now, now - 2*h, now - h, (s) => s.supplyRisk),
    customerActivity: compareWindows(now - h, now, now - 2*h, now - h, (s) => s.customerActivity),
    risk: compareWindows(now - h, now, now - 2*h, now - h, (s) => s.riskCount),
    anomaly: compareWindows(now - h, now, now - 2*h, now - h, (s) => s.anomalyCount),
  }
  const todayStart = new Date(); todayStart.setHours(0,0,0,0)
  const yesterdayStart = new Date(todayStart.getTime() - d)
  const day = {
    demand: compareWindows(todayStart.getTime(), now, yesterdayStart.getTime(), todayStart.getTime(), (s) => s.demand),
    operationalPressure: compareWindows(todayStart.getTime(), now, yesterdayStart.getTime(), todayStart.getTime(), (s) => s.operationalPressure),
    supplyRisk: compareWindows(todayStart.getTime(), now, yesterdayStart.getTime(), todayStart.getTime(), (s) => s.supplyRisk),
    customerActivity: compareWindows(todayStart.getTime(), now, yesterdayStart.getTime(), todayStart.getTime(), (s) => s.customerActivity),
    risk: compareWindows(todayStart.getTime(), now, yesterdayStart.getTime(), todayStart.getTime(), (s) => s.riskCount),
    anomaly: compareWindows(todayStart.getTime(), now, yesterdayStart.getTime(), todayStart.getTime(), (s) => s.anomalyCount),
  }
  const week = {
    demand: compareWindows(now - w, now, now - 2*w, now - w, (s) => s.demand),
    operationalPressure: compareWindows(now - w, now, now - 2*w, now - w, (s) => s.operationalPressure),
    supplyRisk: compareWindows(now - w, now, now - 2*w, now - w, (s) => s.supplyRisk),
    customerActivity: compareWindows(now - w, now, now - 2*w, now - w, (s) => s.customerActivity),
    risk: compareWindows(now - w, now, now - 2*w, now - w, (s) => s.riskCount),
    anomaly: compareWindows(now - w, now, now - 2*w, now - w, (s) => s.anomalyCount),
  }
  return { hour, day, week }
}
