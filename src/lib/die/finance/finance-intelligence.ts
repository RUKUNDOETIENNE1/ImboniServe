import { prisma } from '@/lib/prisma'
import { analyzeSeries, type TrendDirection } from '@/lib/die/intelligence-core/trend-utils'
import type { BillingEventType, PaymentGateway } from '@prisma/client'

export type MoneyCents = number

export interface ProviderReliability {
  gateway: PaymentGateway | null
  success: number
  failed: number
  reliability: number // 0..1
}

export interface FinanceWindowMetrics {
  windowMs: number
  start: string
  end: string
  revenueCents: MoneyCents
  refundsCents: MoneyCents
  netRevenueCents: MoneyCents
  initiated: number
  processing: number
  success: number
  failed: number
  failureRate: number // 0..1
  refundRate: number // refunds / revenue (0..1)
  collectionEfficiency: number // success / initiated (0..1)
  providers: ProviderReliability[]
}

export interface FinanceTrends {
  revenue: { direction: TrendDirection; momentum: number; acceleration: number }
  refunds: { direction: TrendDirection; momentum: number; acceleration: number }
  failures: { direction: TrendDirection; momentum: number; acceleration: number }
  topProvider?: { gateway: PaymentGateway | null; direction: TrendDirection; momentum: number; acceleration: number }
}

export interface FinanceHealthMetrics {
  revenueHealthScore: number // 0..100
  paymentFailureRate: number // 0..100
  refundRate: number // 0..100
  providerReliabilityScore: number // 0..100 (weighted average successes)
  revenueMomentum: number // cents delta cur-prev
  revenueVolatility: number // 0..100 (CV scaled)
  collectionEfficiencyScore: number // 0..100
}

export interface FinanceSnapshot {
  windows: {
    oneHour: FinanceWindowMetrics
    day: FinanceWindowMetrics
    week: FinanceWindowMetrics
  }
  trends: {
    hour: FinanceTrends
    day: FinanceTrends
    week: FinanceTrends
  }
  health: FinanceHealthMetrics
}

function pickAmount(entry: { netAmountCents: number | null; amountCents: number }): number {
  return (entry.netAmountCents ?? entry.amountCents) || 0
}

async function loadWindow(start: Date, end: Date): Promise<FinanceWindowMetrics> {
  const windowMs = end.getTime() - start.getTime()
  const entries = await prisma.financialLedgerEntry.findMany({
    where: { occurredAt: { gte: start, lt: end } },
    select: {
      eventType: true,
      amountCents: true,
      netAmountCents: true,
      gateway: true,
    },
  })
  let revenueCents = 0
  let refundsCents = 0
  let initiated = 0
  let processing = 0
  let success = 0
  let failed = 0
  const providerMap = new Map<string, { gateway: PaymentGateway | null; success: number; failed: number }>()
  for (const e of entries) {
    const amt = pickAmount(e)
    switch (e.eventType as BillingEventType) {
      case 'PAYMENT_SUCCESS':
        success += 1
        revenueCents += Math.max(0, amt)
        break
      case 'PAYMENT_FAILED':
        failed += 1
        break
      case 'PAYMENT_REFUNDED':
        refundsCents += Math.abs(amt)
        break
      case 'PAYMENT_INITIATED':
        initiated += 1
        break
      case 'PAYMENT_PROCESSING':
        processing += 1
        break
      default:
        break
    }
    const key = String(e.gateway)
    if (!providerMap.has(key)) providerMap.set(key, { gateway: e.gateway ?? null, success: 0, failed: 0 })
    const p = providerMap.get(key)!
    if (e.eventType === 'PAYMENT_SUCCESS') p.success += 1
    if (e.eventType === 'PAYMENT_FAILED') p.failed += 1
  }
  const providers: ProviderReliability[] = Array.from(providerMap.values()).map((p) => {
    const denom = Math.max(1, p.success + p.failed)
    return { gateway: p.gateway, success: p.success, failed: p.failed, reliability: p.success / denom }
  })
  const netRevenueCents = Math.max(0, revenueCents - refundsCents)
  const failureRate = failed / Math.max(1, success + failed)
  const refundRate = refundsCents / Math.max(1, revenueCents)
  const collectionEfficiency = success / Math.max(1, initiated)
  return {
    windowMs,
    start: start.toISOString(),
    end: end.toISOString(),
    revenueCents,
    refundsCents,
    netRevenueCents,
    initiated,
    processing,
    success,
    failed,
    failureRate,
    refundRate,
    collectionEfficiency,
    providers,
  }
}

function toTrend(a: number, b: number, c: number) {
  const t = analyzeSeries([a, b, c])
  return { direction: t.direction, momentum: t.momentum, acceleration: t.acceleration }
}

function volatilityFromBuckets(buckets: number[]): number {
  const n = buckets.length
  if (n <= 1) return 0
  const mean = buckets.reduce((s, v) => s + v, 0) / n
  if (mean === 0) return 0
  const variance = buckets.reduce((s, v) => s + (v - mean) * (v - mean), 0) / n
  const std = Math.sqrt(variance)
  const cv = std / mean // 0..∞
  return Math.max(0, Math.min(1, cv)) * 100
}

async function revenueBuckets(start: Date, end: Date, segments: number): Promise<number[]> {
  const totalMs = end.getTime() - start.getTime()
  const segMs = Math.floor(totalMs / segments)
  const out: number[] = []
  for (let i = 0; i < segments; i++) {
    const s = new Date(start.getTime() + i * segMs)
    const e = new Date(i === segments - 1 ? end.getTime() : s.getTime() + segMs)
    const win = await loadWindow(s, e)
    out.push(win.revenueCents)
  }
  return out
}

function weightedProviderReliability(providers: ProviderReliability[]): number {
  const total = providers.reduce((s, p) => s + p.success + p.failed, 0)
  if (total === 0) return 100
  const score = providers.reduce((s, p) => s + p.reliability * (p.success + p.failed), 0) / total
  return Math.round(score * 100)
}

function healthScore(win: FinanceWindowMetrics, prev: FinanceWindowMetrics): FinanceHealthMetrics {
  const growth = (win.revenueCents - prev.revenueCents) / Math.max(1, prev.revenueCents)
  const base = 70 + Math.max(-30, Math.min(30, Math.round(growth * 100) / 100 * 30))
  const failurePenalty = Math.min(40, win.failureRate * 100)
  const refundPenalty = Math.min(30, win.refundRate * 100)
  const revenueHealthScore = Math.round(Math.max(0, Math.min(100, base - failurePenalty * 0.5 - refundPenalty * 0.5)))
  return {
    revenueHealthScore,
    paymentFailureRate: Math.round(win.failureRate * 100),
    refundRate: Math.round(win.refundRate * 100),
    providerReliabilityScore: weightedProviderReliability(win.providers),
    revenueMomentum: win.revenueCents - prev.revenueCents,
    revenueVolatility: 0, // filled by caller (bucket analysis)
    collectionEfficiencyScore: Math.round(Math.min(100, Math.max(0, win.collectionEfficiency * 100))),
  }
}

export async function computeFinanceSnapshot(): Promise<FinanceSnapshot> {
  if (process.env.DIE_FINANCE_INTELLIGENCE_ENABLED !== 'true') {
    const zeroWindow: FinanceWindowMetrics = {
      windowMs: 0, start: new Date(0).toISOString(), end: new Date(0).toISOString(),
      revenueCents: 0, refundsCents: 0, netRevenueCents: 0,
      initiated: 0, processing: 0, success: 0, failed: 0,
      failureRate: 0, refundRate: 0, collectionEfficiency: 0, providers: [],
    }
    return {
      windows: { oneHour: zeroWindow, day: zeroWindow, week: zeroWindow },
      trends: {
        hour: { revenue: { direction: 'STABLE', momentum: 0, acceleration: 0 }, refunds: { direction: 'STABLE', momentum: 0, acceleration: 0 }, failures: { direction: 'STABLE', momentum: 0, acceleration: 0 } },
        day: { revenue: { direction: 'STABLE', momentum: 0, acceleration: 0 }, refunds: { direction: 'STABLE', momentum: 0, acceleration: 0 }, failures: { direction: 'STABLE', momentum: 0, acceleration: 0 } },
        week: { revenue: { direction: 'STABLE', momentum: 0, acceleration: 0 }, refunds: { direction: 'STABLE', momentum: 0, acceleration: 0 }, failures: { direction: 'STABLE', momentum: 0, acceleration: 0 } },
      },
      health: { revenueHealthScore: 0, paymentFailureRate: 0, refundRate: 0, providerReliabilityScore: 0, revenueMomentum: 0, revenueVolatility: 0, collectionEfficiencyScore: 0 },
    }
  }
  const now = new Date()
  const ms = { h: 60*60*1000, d: 24*60*60*1000, w: 7*24*60*60*1000 }

  const curH = await loadWindow(new Date(now.getTime()-ms.h), now)
  const prevH = await loadWindow(new Date(now.getTime()-2*ms.h), new Date(now.getTime()-ms.h))
  const prev2H = await loadWindow(new Date(now.getTime()-3*ms.h), new Date(now.getTime()-2*ms.h))

  const curD = await loadWindow(new Date(now.getTime()-ms.d), now)
  const prevD = await loadWindow(new Date(now.getTime()-2*ms.d), new Date(now.getTime()-ms.d))
  const prev2D = await loadWindow(new Date(now.getTime()-3*ms.d), new Date(now.getTime()-2*ms.d))

  const curW = await loadWindow(new Date(now.getTime()-ms.w), now)
  const prevW = await loadWindow(new Date(now.getTime()-2*ms.w), new Date(now.getTime()-ms.w))
  const prev2W = await loadWindow(new Date(now.getTime()-3*ms.w), new Date(now.getTime()-2*ms.w))

  const hourTrends: FinanceTrends = {
    revenue: toTrend(prev2H.revenueCents, prevH.revenueCents, curH.revenueCents),
    refunds: toTrend(prev2H.refundsCents, prevH.refundsCents, curH.refundsCents),
    failures: toTrend(prev2H.failed, prevH.failed, curH.failed),
  }
  const dayTrends: FinanceTrends = {
    revenue: toTrend(prev2D.revenueCents, prevD.revenueCents, curD.revenueCents),
    refunds: toTrend(prev2D.refundsCents, prevD.refundsCents, curD.refundsCents),
    failures: toTrend(prev2D.failed, prevD.failed, curD.failed),
  }
  const weekTrends: FinanceTrends = {
    revenue: toTrend(prev2W.revenueCents, prevW.revenueCents, curW.revenueCents),
    refunds: toTrend(prev2W.refundsCents, prevW.refundsCents, curW.refundsCents),
    failures: toTrend(prev2W.failed, prevW.failed, curW.failed),
  }

  // Top provider trend by transaction volume in current day
  const topProv = [...curD.providers].sort((a,b) => (b.success+b.failed)-(a.success+a.failed))[0]
  if (topProv) {
    const provKey = topProv.gateway
    function provFailed(win: FinanceWindowMetrics) {
      const p = win.providers.find((x) => x.gateway === provKey)
      return p ? p.failed : 0
    }
    const t = toTrend(provFailed(prev2D), provFailed(prevD), provFailed(curD))
    dayTrends.topProvider = { gateway: provKey, ...t }
  }

  // Health (based on day window vs prior day)
  const health = healthScore(curD, prevD)
  // Volatility via hourly buckets (24 segments over the last day)
  const buckets = await revenueBuckets(new Date(now.getTime()-ms.d), now, 24)
  health.revenueVolatility = Math.round(volatilityFromBuckets(buckets))

  return {
    windows: { oneHour: curH, day: curD, week: curW },
    trends: { hour: hourTrends, day: dayTrends, week: weekTrends },
    health,
  }
}
