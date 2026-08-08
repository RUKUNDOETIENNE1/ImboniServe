import { prisma } from '../prisma'
import { generateInsightFromKPIs, estimateCostCents } from '../ai/openai-insight.service'

export type PeriodType = 'WEEKLY' | 'MONTHLY'

type PeriodRange = { start: Date; end: Date }

function getKigaliNow() {
  const now = new Date()
  const utc = now.getTime() + now.getTimezoneOffset() * 60000
  return new Date(utc + 2 * 3600000)
}

function startOfDayKigali(d: Date) {
  const z = new Date(d)
  z.setHours(0, 0, 0, 0)
  return z
}

function addDays(d: Date, days: number) {
  const z = new Date(d)
  z.setDate(z.getDate() + days)
  return z
}

function getPeriodRange(period: PeriodType): PeriodRange {
  const now = getKigaliNow()
  const todayStart = startOfDayKigali(now)
  if (period === 'WEEKLY') {
    const dow = todayStart.getDay() === 0 ? 7 : todayStart.getDay()
    const monday = addDays(todayStart, -(dow - 1))
    const nextMonday = addDays(monday, 7)
    return { start: monday, end: nextMonday }
  } else {
    const first = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1)
    const nextFirst = new Date(todayStart.getFullYear(), todayStart.getMonth() + 1, 1)
    return { start: first, end: nextFirst }
  }
}

function toKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

export async function computeKPIs(businessId: string, period: PeriodType) {
  const { start, end } = getPeriodRange(period)

  const [sales, txs, customersInPeriod, customersBefore, subscription] = await Promise.all([
    prisma.sale.findMany({
      where: { businessId, isPaid: true, createdAt: { gte: start, lt: end } }, // Sale.isPaid boolean field
      select: { totalAmountCents: true, paymentMethod: true, createdAt: true }
    }),
    prisma.paymentTransaction.findMany({
      where: { businessId, createdAt: { gte: start, lt: end } },
      select: { status: true, paymentMethod: true }
    }),
    prisma.customer.count({ where: { businessId, createdAt: { gte: start, lt: end } } }),
    prisma.customer.count({ where: { businessId, createdAt: { lt: start } } }),
    prisma.subscription.findFirst({ where: { businessId }, select: { status: true, nextBillingDate: true } as any }) as any
  ])

  const revenueTotal = sales.reduce((s, x) => s + x.totalAmountCents, 0)
  const txCount = sales.length
  const aov = txCount ? Math.round(revenueTotal / txCount) : 0

  const methodCounts = sales.reduce<Record<string, number>>((acc, x) => {
    const key = x.paymentMethod
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})
  const methodBreakdown: Record<string, number> = {}
  Object.entries(methodCounts).forEach(([k, v]) => {
    methodBreakdown[k] = txCount ? +(v / txCount).toFixed(2) : 0
  })

  const byDay: Record<string, number> = {}
  const byHour: Record<number, number> = {}
  for (const s of sales) {
    const d = toKey(s.createdAt)
    byDay[d] = (byDay[d] || 0) + s.totalAmountCents
    const h = new Date(s.createdAt).getHours()
    byHour[h] = (byHour[h] || 0) + s.totalAmountCents
  }
  let bestDay: string | null = null
  let worstDay: string | null = null
  const dayEntries = Object.entries(byDay)
  if (dayEntries.length) {
    dayEntries.sort((a, b) => b[1] - a[1])
    bestDay = dayEntries[0][0]
    worstDay = dayEntries[dayEntries.length - 1][0]
  }
  let peakHour: string | null = null
  let lowHour: string | null = null
  const hourEntries = Object.entries(byHour)
  if (hourEntries.length) {
    hourEntries.sort((a, b) => b[1] - a[1])
    peakHour = `${hourEntries[0][0]}:00`
    lowHour = `${hourEntries[hourEntries.length - 1][0]}:00`
  }

  const priorStart = period === 'WEEKLY' ? addDays(start, -7) : new Date(start.getFullYear(), start.getMonth() - 1, 1)
  const priorEnd = start
  const priorSales = await prisma.sale.findMany({
    where: { businessId, isPaid: true, createdAt: { gte: priorStart, lt: priorEnd } },
    select: { totalAmountCents: true }
  })
  const priorTotal = priorSales.reduce((s, x) => s + x.totalAmountCents, 0)
  const growthPct = priorTotal > 0 ? +(((revenueTotal - priorTotal) / priorTotal) * 100).toFixed(1) : null

  const totalCustomersActive = customersInPeriod + customersBefore
  const newRate = totalCustomersActive ? +(customersInPeriod / totalCustomersActive).toFixed(2) : 0
  const repeatRate = +(1 - newRate).toFixed(2)

  const subscriptionStatus = (subscription as any)?.status || 'UNKNOWN'
  const renewalDue = (subscription as any)?.nextBillingDate || null

  const attempts = txs.length
  const paid = txs.filter(t => t.status === 'SUCCESS').length
  const paymentSuccessRate = attempts ? +(paid / attempts).toFixed(2) : 0

  let trend: 'upward' | 'downward' | 'flat' = 'flat'
  if (growthPct !== null) trend = growthPct > 2 ? 'upward' : growthPct < -2 ? 'downward' : 'flat'
  const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000))
  const avgDaily = Math.round(revenueTotal / days)
  const spikes: { date: string; liftPct: number }[] = []
  for (const [d, v] of dayEntries) {
    const lift = avgDaily ? +(((v - avgDaily) / avgDaily) * 100).toFixed(0) : 0
    if (lift >= 40) spikes.push({ date: d, liftPct: lift })
  }

  return {
    period: { type: period.toLowerCase(), start, end, tz: 'Africa/Kigali' },
    revenue: { total: revenueTotal, growthPct, avgDaily, bestDay, worstDay },
    transactions: { count: txCount, aov, byMethod: methodBreakdown },
    timePatterns: { peakHour, lowHour },
    customers: { repeatRate, newRate },
    subscription: { status: subscriptionStatus, renewalDue, paymentSuccessRate },
    signals: { trend, spikes }
  }
}

export async function getOrGenerateInsight(params: { businessId: string; period: PeriodType; language?: string; trigger?: 'AUTO' | 'MANUAL'; force?: boolean; quota?: number }) {
  const { businessId, period, language = 'en', trigger = 'MANUAL', force = false, quota = 4 } = params
  const { start, end } = getPeriodRange(period)

  const existing = await prisma.businessInsightReport.findUnique({
    where: { businessId_periodType_periodStart: { businessId, periodType: period, periodStart: start } }
  })
  if (existing && !force) return existing

  if (trigger === 'MANUAL') {
    const now = getKigaliNow()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const count = await prisma.businessInsightReport.count({
      where: { businessId, triggerSource: 'MANUAL', createdAt: { gte: monthStart } }
    })
    if (count >= quota) {
      throw new Error('Manual quota exceeded for this month')
    }
  }

  const kpis = await computeKPIs(businessId, period)
  const ai = await generateInsightFromKPIs(kpis, language)
  const estimatedCostCents = estimateCostCents(ai.inputTokens, ai.outputTokens)

  const saved = await prisma.businessInsightReport.create({
    data: {
      businessId,
      periodType: period,
      periodStart: start,
      periodEnd: end,
      language,
      kpiSnapshot: kpis as any,
      insightText: ai.text,
      model: ai.model,
      inputTokens: ai.inputTokens,
      outputTokens: ai.outputTokens,
      totalTokens: ai.totalTokens,
      estimatedCostCents,
      triggerSource: trigger
    }
  })

  return saved
}
