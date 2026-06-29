import { getFeedHistoryWithin } from '@/lib/die/assistant/context-cache'
import type { BusinessInsight } from '@/lib/die/business-intelligence/reasoning-engine'
import type { BaselineProfile } from './baseline-engine'
import type { SystemCorrelationReport } from '@/lib/die/intelligence-core/types'
import { getEvidence } from '@/lib/die/kernel/unified-intelligence-kernel'
import { scoring } from '@/lib/die/kernel/unified-intelligence-kernel'
import { measureCalibrationConvergence } from '@/lib/die/convergence/convergence-engine'

export interface CalibratedConfidence {
  calibrated: number // 0..1
  baselineDeviationPct?: number
  crossDomainSupport?: number // 0..1
}

function countFeed(code: string, windowMs: number): number {
  const feed = getFeedHistoryWithin(windowMs)
  return feed.filter((f) => f.code === code).length
}

function mapInsightToCodes(i: BusinessInsight): string[] {
  switch (i.type) {
    case 'DEMAND_SURGE_DETECTED': return ['SESSION_STARTED', 'RESERVATION_CREATED']
    case 'KITCHEN_BOTTLENECK_IDENTIFIED': return ['KDS_BACKLOG_ALERT']
    case 'OPERATIONAL_CONGESTION': return ['KDS_BACKLOG_ALERT', 'WAITER_CALL_CREATED']
    case 'SUPPLY_CHAIN_DEGRADATION': return ['DELIVERY_DELAYED', 'SUPPLIER_DELIVERY_DELAYED']
    case 'REVENUE_RISK_DETECTED': return ['PAYMENT_EXCEPTION']
    case 'CAMPAIGN_EFFECTIVENESS_DROP': return ['CAMPAIGN_DELIVERABILITY_WEAK']
    default: return []
  }
}

function baselineForCodeHour(profile: BaselineProfile, code: string, hour: number): number {
  const m = profile.metrics[code as keyof typeof profile.metrics] as any
  const stat = m?.byHour?.[String(hour)] as { mean?: number } | undefined
  return stat?.mean ?? 0
}

export function calibrateConfidence(i: BusinessInsight, profile: BaselineProfile, report: SystemCorrelationReport): CalibratedConfidence {
  const hour = new Date().getHours()
  const codes = mapInsightToCodes(i)
  const windowMs = 60 * 60 * 1000
  let currentValue = 0
  let baseMean = 0
  for (const c of codes) {
    currentValue += countFeed(c, windowMs)
    baseMean += baselineForCodeHour(profile, c, hour)
  }
  const denom = Math.max(1, baseMean)
  const deviationPct = ((currentValue - baseMean) / denom) * 100
  const baselineSignificance = Math.max(0, Math.min(1, Math.abs(deviationPct) / 100))

  // cross-domain support via correlation signals mentioning relevant domains
  const signals = report.riskSignals.map((r) => r.signal.toLowerCase())
  let cross = 0
  if (i.type === 'KITCHEN_BOTTLENECK_IDENTIFIED' && signals.some((s) => s.includes('kitchen'))) cross = 1
  if (i.type === 'SUPPLY_CHAIN_DEGRADATION' && signals.some((s) => s.includes('supplier'))) cross = 1
  if (i.type === 'DEMAND_SURGE_DETECTED' && signals.some((s) => s.includes('demand'))) cross = 1

  // calibrated confidence combines raw confidence with baseline and cross confirmation
  const raw = i.confidence
  const calibrated = Math.max(0, Math.min(1, raw * 0.6 + baselineSignificance * 0.3 + cross * 0.1))
  if (process.env.DIE_INTELLIGENCE_KERNEL_SHADOW === 'true') {
    try { void getEvidence(i.type) } catch {}
  }
  if (process.env.DIE_INTELLIGENCE_DUAL_READ_ENABLED === 'true') {
    try {
      const uikTrust = scoring.computeTrustScore({ calibratedConfidence: calibrated, stability: 0, baselineSignificance, crossSupport: cross })
      measureCalibrationConvergence({ legacyTrustScore: Math.round(calibrated * 100), uikTrustScore: uikTrust })
    } catch {}
  }
  return { calibrated, baselineDeviationPct: deviationPct, crossDomainSupport: cross }
}
