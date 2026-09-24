import type { BusinessInsight } from '@/lib/die/business-intelligence/reasoning-engine'

export interface TrustScore {
  score: number // 0..100
}

export function computeTrustScore(params: {
  insight: BusinessInsight
  calibratedConfidence: number // 0..1
  stabilityScore: number // 0..1
  baselineSignificance: number // 0..1
  crossDomainSupport: number // 0..1
}): TrustScore {
  const { calibratedConfidence, stabilityScore, baselineSignificance, crossDomainSupport } = params
  // Weighted aggregation with emphasis on trustworthiness over raw severity
  const w = { conf: 0.4, stab: 0.3, base: 0.2, cross: 0.1 }
  const s = calibratedConfidence * w.conf + stabilityScore * w.stab + baselineSignificance * w.base + crossDomainSupport * w.cross
  return { score: Math.round(Math.max(0, Math.min(1, s)) * 100) }
}
