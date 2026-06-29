import { shadowObservability } from '@/lib/die/business-as-plugin/shadow/shadow-observability'
import { correlationEngine } from '@/lib/die/intelligence-core/correlation-engine.service'
import { governanceEngine } from '@/lib/die/governance/governance-engine.service'

export type BusinessInsightType =
  | 'DEMAND_SURGE_DETECTED'
  | 'REVENUE_RISK_DETECTED'
  | 'KITCHEN_BOTTLENECK_IDENTIFIED'
  | 'SUPPLY_CHAIN_DEGRADATION'
  | 'CAMPAIGN_EFFECTIVENESS_DROP'
  | 'CUSTOMER_CHURN_RISK'
  | 'OPERATIONAL_CONGESTION'
  | 'TABLE_TURNOVER_INEFFICIENCY'
  | 'REVENUE_GROWTH_DETECTED'
  | 'REVENUE_DECLINE_DETECTED'
  | 'PAYMENT_PROVIDER_DEGRADATION'
  | 'REFUND_SPIKE_DETECTED'
  | 'COLLECTION_RISK_DETECTED'
  | 'FINANCIAL_HEALTH_WARNING'

export interface BusinessInsight {
  type: BusinessInsightType
  severity: 'INFO' | 'WARN' | 'CRITICAL'
  confidence: number // 0..1
  explanation: string
  contributingSignals: Array<{ code: string; count?: number; sampleTimestamp?: string }>
  affectedDomains: string[]
  generatedAt: string
  // Reliability extensions (additive, optional)
  calibratedConfidence?: number
  stabilityScore?: { level: 'LOW' | 'MEDIUM' | 'HIGH'; score: number }
  trustScore?: number
  baselineDeviation?: { metric: string; baseline: number; current: number; deviationPct: number; severity: 'INFO' | 'WARN' | 'CRITICAL' }
}

type FeedItem = ReturnType<typeof shadowObservability.list>[number]

const TTL_MS = 60_000
let cache: { at: number; insights: BusinessInsight[] } | null = null

function countByCode(feed: FeedItem[], code: string): number {
  return feed.filter((i) => i.code === code).length
}

function pickSamples(feed: FeedItem[], codes: string[], limit = 3): Array<{ code: string; count?: number; sampleTimestamp?: string }> {
  const out: Array<{ code: string; count?: number; sampleTimestamp?: string }> = []
  for (const c of codes) {
    const items = feed.filter((i) => i.code === c)
    if (items.length > 0) {
      out.push({ code: c, count: items.length, sampleTimestamp: items[0].timestamp })
    }
  }
  return out.slice(0, limit)
}

function clamp01(n: number): number { return Math.max(0, Math.min(1, n)) }

export class BusinessReasoningEngine {
  async generateInsights(): Promise<BusinessInsight[]> {
    try {
      if (process.env.DIE_BUSINESS_INTELLIGENCE_ENABLED !== 'true') return []
      const now = Date.now()
      if (cache && now - cache.at < TTL_MS) return cache.insights

      // Inputs
      const feed = shadowObservability.list(200)
      const report = await correlationEngine.generateReport()
      const governanceStates = governanceEngine.getAllStates()
      const recentAudit = governanceEngine.getRecentAuditEvents(100)

      const insights: BusinessInsight[] = []

      // DEMAND_SURGE_DETECTED
      {
        const demandCodes = ['RESERVATION_CREATED', 'SESSION_STARTED', 'DELIVERY_ACTIVATED', 'DELIVERY_CONFIRMED']
        const count = demandCodes.reduce((acc, c) => acc + countByCode(feed, c), 0)
        if (count > 10) {
          const severity = count > 30 ? 'CRITICAL' : count > 20 ? 'WARN' : 'INFO'
          const confidence = clamp01(count / 40)
          insights.push({
            type: 'DEMAND_SURGE_DETECTED',
            severity,
            confidence,
            explanation: `Observed ${count} demand signals across reservations, dining sessions, and delivery within the recent window`,
            contributingSignals: pickSamples(feed, demandCodes, 4),
            affectedDomains: ['reservations', 'dining-slips', 'delivery', 'kds', 'table-management'],
            generatedAt: new Date().toISOString(),
          })
        }
      }

      // ===============================
      // Finance Insights (read-only)
      // ===============================
      if (process.env.DIE_FINANCE_INTELLIGENCE_ENABLED === 'true') {
        try {
          const { computeFinanceSnapshot } = await import('@/lib/die/finance/finance-intelligence')
          const fin = await computeFinanceSnapshot()
          const h = fin.health

          // Revenue growth / decline (day window)
          if (fin.trends.day.revenue.direction === 'RISING' && h.revenueMomentum > 0) {
            insights.push({
              type: 'REVENUE_GROWTH_DETECTED',
              severity: h.revenueMomentum > 0 ? 'INFO' : 'INFO',
              confidence: Math.min(1, 0.6 + Math.abs(h.revenueMomentum) / Math.max(1, fin.windows.day.revenueCents)),
              explanation: `Revenue growing day-over-day. Momentum: ${(h.revenueMomentum/100).toFixed(2)} units`,
              contributingSignals: [
                { code: 'REVENUE', count: fin.windows.day.revenueCents },
              ],
              affectedDomains: ['finance'],
              generatedAt: new Date().toISOString(),
            })
          }
          if (fin.trends.day.revenue.direction === 'FALLING' && h.revenueMomentum < 0) {
            const sev = Math.abs(h.revenueMomentum) / Math.max(1, fin.windows.day.revenueCents) > 0.2 ? 'WARN' : 'INFO'
            insights.push({
              type: 'REVENUE_DECLINE_DETECTED',
              severity: sev,
              confidence: Math.min(1, 0.6 + Math.abs(h.revenueMomentum) / Math.max(1, fin.windows.day.revenueCents)),
              explanation: `Revenue declining day-over-day. Momentum: ${(h.revenueMomentum/100).toFixed(2)} units`,
              contributingSignals: [
                { code: 'REVENUE', count: fin.windows.day.revenueCents },
              ],
              affectedDomains: ['finance'],
              generatedAt: new Date().toISOString(),
            })
          }

          // Provider degradation
          if (fin.trends.day.topProvider && fin.trends.day.topProvider.direction === 'RISING') {
            insights.push({
              type: 'PAYMENT_PROVIDER_DEGRADATION',
              severity: 'WARN',
              confidence: 0.6,
              explanation: `Payment failures rising for ${String(fin.trends.day.topProvider.gateway)} vs yesterday`,
              contributingSignals: [ { code: 'PAYMENT_FAILED' } ],
              affectedDomains: ['payments'],
              generatedAt: new Date().toISOString(),
            })
          }

          // Refund spike
          if (fin.trends.day.refunds.direction === 'RISING' && fin.windows.day.refundsCents > 0) {
            const sev = fin.windows.day.refundsCents / Math.max(1, fin.windows.day.revenueCents) > 0.1 ? 'WARN' : 'INFO'
            insights.push({
              type: 'REFUND_SPIKE_DETECTED',
              severity: sev,
              confidence: 0.6,
              explanation: `Refunds increasing day-over-day. Refund rate ${(fin.health.refundRate).toFixed(0)}%`,
              contributingSignals: [ { code: 'PAYMENT_REFUNDED', count: fin.windows.day.refundsCents } ],
              affectedDomains: ['finance'],
              generatedAt: new Date().toISOString(),
            })
          }

          // Collection risk (low efficiency or high failure)
          if (fin.windows.day.collectionEfficiency < 0.6 || fin.windows.day.failureRate > 0.15) {
            const sev = fin.windows.day.failureRate > 0.25 ? 'CRITICAL' : 'WARN'
            insights.push({
              type: 'COLLECTION_RISK_DETECTED',
              severity: sev,
              confidence: 0.7,
              explanation: `Collection risk: failure ${(fin.health.paymentFailureRate).toFixed(0)}%, efficiency ${(fin.health.collectionEfficiencyScore).toFixed(0)}%`,
              contributingSignals: [ { code: 'PAYMENT_FAILED', count: fin.windows.day.failed } ],
              affectedDomains: ['payments'],
              generatedAt: new Date().toISOString(),
            })
          }

          // Overall financial health warning
          if (h.revenueHealthScore < 50) {
            insights.push({
              type: 'FINANCIAL_HEALTH_WARNING',
              severity: 'WARN',
              confidence: 0.7,
              explanation: `Financial health weak. Score ${h.revenueHealthScore}, volatility ~${h.revenueVolatility.toFixed(0)}%`,
              contributingSignals: [ { code: 'REVENUE_HEALTH', count: h.revenueHealthScore } ],
              affectedDomains: ['finance'],
              generatedAt: new Date().toISOString(),
            })
          }
        } catch {}
      }
      // REVENUE_RISK_DETECTED
      {
        const riskCodes = ['PAYMENT_EXCEPTION', 'DELIVERY_FAILED', 'SUPPLIER_DELIVERY_FAILED']
        const count = riskCodes.reduce((acc, c) => acc + countByCode(feed, c), 0)
        if (count > 0) {
          const severity = count > 7 ? 'CRITICAL' : count > 3 ? 'WARN' : 'INFO'
          const confidence = clamp01(0.2 + count / 15)
          insights.push({
            type: 'REVENUE_RISK_DETECTED',
            severity,
            confidence,
            explanation: `Detected ${count} revenue-impacting exceptions (payments, failed deliveries, supplier failures)`,
            contributingSignals: pickSamples(feed, riskCodes, 5),
            affectedDomains: ['payments', 'delivery', 'suppliers', 'procurement'],
            generatedAt: new Date().toISOString(),
          })
        }
      }

      // KITCHEN_BOTTLENECK_IDENTIFIED
      {
        const kitchenCodes = ['KDS_BACKLOG_ALERT', 'DELIVERY_DELAYED']
        const backlog = countByCode(feed, 'KDS_BACKLOG_ALERT')
        const delayed = countByCode(feed, 'DELIVERY_DELAYED')
        if (backlog > 0 && delayed > 0) {
          const severity = backlog + delayed > 6 ? 'WARN' : 'INFO'
          const confidence = clamp01(0.5 + (backlog + delayed) / 20)
          insights.push({
            type: 'KITCHEN_BOTTLENECK_IDENTIFIED',
            severity,
            confidence,
            explanation: 'Kitchen backlog co-occurs with delivery delays, indicating prep/expedite constraints',
            contributingSignals: pickSamples(feed, kitchenCodes, 4),
            affectedDomains: ['kds', 'delivery'],
            generatedAt: new Date().toISOString(),
          })
        }
      }

      // SUPPLY_CHAIN_DEGRADATION
      {
        const supplyCodes = ['PROCUREMENT_DELAY_DETECTED', 'SUPPLIER_DELIVERY_DELAYED', 'SUPPLIER_DELIVERY_FAILED']
        const count = supplyCodes.reduce((acc, c) => acc + countByCode(feed, c), 0)
        if (count > 0) {
          const severity = count > 5 ? 'WARN' : 'INFO'
          const confidence = clamp01(0.4 + count / 12)
          insights.push({
            type: 'SUPPLY_CHAIN_DEGRADATION',
            severity,
            confidence,
            explanation: 'Procurement and supplier delivery issues observed in unified feed',
            contributingSignals: pickSamples(feed, supplyCodes, 5),
            affectedDomains: ['procurement', 'suppliers', 'inventory'],
            generatedAt: new Date().toISOString(),
          })
        }
      }

      // CAMPAIGN_EFFECTIVENESS_DROP (deliverability proxy until true engagement available)
      {
        const lowConv = countByCode(feed, 'CAMPAIGN_DELIVERABILITY_WEAK')
        if (lowConv > 0) {
          const severity = lowConv > 3 ? 'WARN' : 'INFO'
          const confidence = clamp01(0.5 + lowConv / 10)
          insights.push({
            type: 'CAMPAIGN_EFFECTIVENESS_DROP',
            severity,
            confidence,
            explanation: 'Low conversion observed on recent campaign(s)',
            contributingSignals: pickSamples(feed, ['CAMPAIGN_DELIVERABILITY_WEAK', 'CAMPAIGN_COMPLETED'], 4),
            affectedDomains: ['campaigns'],
            generatedAt: new Date().toISOString(),
          })
        }
      }

      // CUSTOMER_CHURN_RISK (heuristic: low redemptions + low demand)
      {
        const redemptions = countByCode(feed, 'LOYALTY_REDEMPTION')
        const sessions = countByCode(feed, 'SESSION_STARTED')
        const reservations = countByCode(feed, 'RESERVATION_CREATED')
        if (redemptions === 0 && sessions + reservations < 5) {
          insights.push({
            type: 'CUSTOMER_CHURN_RISK',
            severity: 'INFO',
            confidence: 0.4,
            explanation: 'Low engagement observed: no loyalty redemptions and few sessions/reservations in recent window',
            contributingSignals: pickSamples(feed, ['LOYALTY_REDEMPTION', 'SESSION_STARTED', 'RESERVATION_CREATED'], 4),
            affectedDomains: ['loyalty', 'reservations', 'dining-slips'],
            generatedAt: new Date().toISOString(),
          })
        }
      }

      // OPERATIONAL_CONGESTION
      {
        const congestionCodes = ['WAITER_CALL_CREATED', 'KDS_BACKLOG_ALERT', 'LONG_DURATION_SESSION']
        const count = congestionCodes.reduce((acc, c) => acc + countByCode(feed, c), 0)
        if (count > 4) {
          const severity = count > 12 ? 'CRITICAL' : 'WARN'
          const confidence = clamp01(0.6 + count / 20)
          insights.push({
            type: 'OPERATIONAL_CONGESTION',
            severity,
            confidence,
            explanation: 'Service pressure inferred from waiter calls, kitchen backlog and long sessions',
            contributingSignals: pickSamples(feed, congestionCodes, 5),
            affectedDomains: ['waiter-calls', 'kds', 'dining-slips', 'table-management'],
            generatedAt: new Date().toISOString(),
          })
        }
      }

      // TABLE_TURNOVER_INEFFICIENCY
      {
        const long = countByCode(feed, 'LONG_DURATION_SESSION')
        const starts = countByCode(feed, 'SESSION_STARTED')
        if (long >= 2 && starts > 0 && long / Math.max(starts, 1) >= 0.3) {
          const ratio = long / Math.max(starts, 1)
          const severity = ratio > 0.5 ? 'WARN' : 'INFO'
          const confidence = clamp01(0.5 + ratio)
          insights.push({
            type: 'TABLE_TURNOVER_INEFFICIENCY',
            severity,
            confidence,
            explanation: `Long sessions ratio ~${(ratio * 100).toFixed(0)}% compared to starts`,
            contributingSignals: pickSamples(feed, ['LONG_DURATION_SESSION', 'SESSION_STARTED'], 4),
            affectedDomains: ['dining-slips', 'table-management'],
            generatedAt: new Date().toISOString(),
          })
        }
      }

      // Incorporate correlation report risk signals into related insights (boost confidence)
      try {
        const signals = report.riskSignals.map((r) => r.signal)
        for (const ins of insights) {
          if (ins.type === 'KITCHEN_BOTTLENECK_IDENTIFIED' && signals.some((s) => s.includes('Kitchen Backlog'))) {
            ins.confidence = clamp01(ins.confidence + 0.1)
          }
          if (ins.type === 'SUPPLY_CHAIN_DEGRADATION' && signals.some((s) => s.includes('Supplier Reliability'))) {
            ins.confidence = clamp01(ins.confidence + 0.1)
          }
          if (ins.type === 'DEMAND_SURGE_DETECTED' && signals.some((s) => s.includes('Campaign Likely Driving In-Store Demand Spike'))) {
            ins.confidence = clamp01(ins.confidence + 0.1)
          }
        }
      } catch {}

      // Reliability calibration (optional, feature-flagged)
      if (process.env.DIE_INTELLIGENCE_RELIABILITY_ENABLED === 'true') {
        try {
          const [{ buildBaselineProfile }, { compareToBaseline }, { calibrateConfidence }, { scoreStability }, { computeTrustScore }] = await Promise.all([
            import('@/lib/die/intelligence-core/baseline-engine'),
            import('@/lib/die/intelligence-core/baseline-comparison'),
            import('@/lib/die/intelligence-core/confidence-calibration'),
            import('@/lib/die/intelligence-core/stability-engine'),
            import('@/lib/die/intelligence-core/trust-score'),
          ])
          const baseline = await buildBaselineProfile()
          for (const ins of insights) {
            const calib = calibrateConfidence(ins, baseline, report)
            const stab = scoreStability(ins)
            // Select a representative metric for baseline deviation annotation
            const metricKey = ins.type === 'KITCHEN_BOTTLENECK_IDENTIFIED' ? 'kdsBacklog'
              : ins.type === 'DEMAND_SURGE_DETECTED' ? 'reservations'
              : ins.type === 'SUPPLY_CHAIN_DEGRADATION' ? 'deliveryIssues'
              : ins.type === 'CAMPAIGN_EFFECTIVENESS_DROP' ? 'campaignsDeliverabilityWeak'
              : ins.type === 'REVENUE_RISK_DETECTED' ? 'paymentExceptions' : undefined
            let baseDev: any = undefined
            if (metricKey && (baseline.metrics as any)[metricKey]) {
              const hour = String(new Date().getHours())
              const stat = (baseline.metrics as any)[metricKey].byHour[hour]
              // current proxy: sum of contributing signal counts
              const cur = ins.contributingSignals.reduce((s, c) => s + (c.count || 0), 0)
              baseDev = compareToBaseline(metricKey, stat, cur)
            }
            const trust = computeTrustScore({
              insight: ins,
              calibratedConfidence: calib.calibrated,
              stabilityScore: stab.score,
              baselineSignificance: Math.min(1, Math.abs((calib.baselineDeviationPct || 0)) / 100),
              crossDomainSupport: calib.crossDomainSupport || 0,
            })
            ins.calibratedConfidence = calib.calibrated
            ins.stabilityScore = stab
            ins.trustScore = trust.score
            if (baseDev) ins.baselineDeviation = baseDev
          }
        } catch {}
      }

      cache = { at: now, insights }

      // Evaluation capture (read-only, in-memory, feature-flagged)
      if (process.env.DIE_INTELLIGENCE_EVALUATION_ENABLED === 'true') {
        try {
          const { captureInsights } = await import('@/lib/die/evaluation/evaluation-engine')
          // fire-and-forget (no await): do not block request path
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          captureInsights(insights)
        } catch {}
      }
      return insights
    } catch (e) {
      console.debug('[BusinessReasoning] error (ignored):', (e as any)?.message)
      return []
    }
  }
}

export const businessReasoning = new BusinessReasoningEngine()
