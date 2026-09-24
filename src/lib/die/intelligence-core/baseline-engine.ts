import { getFeedHistoryWithin } from '@/lib/die/assistant/context-cache'

export interface BaselineStat {
  mean: number
  median: number
  variance: number
  stddev: number
  rollingAvg: number
}

export interface BaselineProfile {
  byHour: Record<string, BaselineStat>
  byWeekday: Record<string, BaselineStat>
  metrics: Record<string, { byHour: Record<string, BaselineStat>; byWeekday: Record<string, BaselineStat> }>
  finance?: {
    revenueByHour?: BaselineStat
    revenueByDay?: BaselineStat
  }
}

function stats(values: number[]): BaselineStat {
  const arr = values.slice().sort((a, b) => a - b)
  const n = arr.length || 1
  const mean = arr.reduce((s, v) => s + v, 0) / n
  const mid = Math.floor(n / 2)
  const median = n % 2 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2
  const variance = arr.reduce((s, v) => s + (v - mean) * (v - mean), 0) / n
  const stddev = Math.sqrt(variance)
  // simple rolling avg: last 3 if available
  const last3 = arr.slice(-3)
  const rollingAvg = last3.length ? last3.reduce((s, v) => s + v, 0) / last3.length : mean
  return { mean, median, variance, stddev, rollingAvg }
}

function groupCountsBy(feedCodes: Array<{ ts: Date; code: string }>, grouper: (d: Date) => string) {
  const perCode: Record<string, Record<string, number[]>> = {}
  for (const f of feedCodes) {
    const g = grouper(f.ts)
    if (!perCode[f.code]) perCode[f.code] = {}
    if (!perCode[f.code][g]) perCode[f.code][g] = []
    // push 1 per event; later we'll aggregate counts per bucket
    perCode[f.code][g].push(1)
  }
  // Reduce to counts per bucket
  const result: Record<string, Record<string, BaselineStat>> = {}
  for (const code of Object.keys(perCode)) {
    result[code] = {}
    for (const bucket of Object.keys(perCode[code])) {
      const count = perCode[code][bucket].length
      // store as single-sample stats; upstream aggregates across days when present
      result[code][bucket] = stats([count])
    }
  }
  return result
}

export async function buildBaselineProfile(): Promise<BaselineProfile> {
  // last 7 days of feed history (bounded by in-memory history limits)
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000
  const feed = getFeedHistoryWithin(sevenDaysMs)
  const feedCodes = feed.map((f) => ({ ts: new Date(f.timestamp), code: f.code }))

  const byHourRaw = groupCountsBy(feedCodes, (d) => String(d.getHours()))
  const byWeekdayRaw = groupCountsBy(feedCodes, (d) => String(d.getDay()))

  // Metrics of interest composed from codes
  function aggregateMetric(codes: string[]): { byHour: Record<string, BaselineStat>; byWeekday: Record<string, BaselineStat> } {
    const byHour: Record<string, number[]> = {}
    const byWeekday: Record<string, number[]> = {}
    for (const c of codes) {
      const hMap = byHourRaw[c] || {}
      for (const h of Object.keys(hMap)) {
        if (!byHour[h]) byHour[h] = []
        byHour[h].push(hMap[h].mean)
      }
      const wMap = byWeekdayRaw[c] || {}
      for (const w of Object.keys(wMap)) {
        if (!byWeekday[w]) byWeekday[w] = []
        byWeekday[w].push(wMap[w].mean)
      }
    }
    const outH: Record<string, BaselineStat> = {}
    const outW: Record<string, BaselineStat> = {}
    for (const h of Object.keys(byHour)) outH[h] = stats(byHour[h])
    for (const w of Object.keys(byWeekday)) outW[w] = stats(byWeekday[w])
    return { byHour: outH, byWeekday: outW }
  }

  const metrics = {
    reservations: aggregateMetric(['RESERVATION_CREATED']),
    kdsBacklog: aggregateMetric(['KDS_BACKLOG_ALERT']),
    deliveryIssues: aggregateMetric(['DELIVERY_DELAYED', 'DELIVERY_FAILED']),
    campaignsDeliverabilityWeak: aggregateMetric(['CAMPAIGN_DELIVERABILITY_WEAK']),
    paymentExceptions: aggregateMetric(['PAYMENT_EXCEPTION']),
  }

  const profile: BaselineProfile = {
    byHour: {},
    byWeekday: {},
    metrics,
  }

  // Finance baselines (optional): in-memory read from FinancialLedgerEntry via finance snapshot
  try {
    if (process.env.DIE_FINANCE_INTELLIGENCE_ENABLED === 'true') {
      const { computeFinanceSnapshot } = await import('@/lib/die/finance/finance-intelligence')
      const fin = await computeFinanceSnapshot()
      profile.finance = {
        revenueByHour: stats([fin.windows.oneHour.revenueCents]),
        revenueByDay: stats([fin.windows.day.revenueCents]),
      }
    }
  } catch {}

  return profile
}
