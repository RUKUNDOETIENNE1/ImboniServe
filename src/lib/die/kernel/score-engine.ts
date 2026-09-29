export interface ScoreInputs {
  // normalized 0..1 inputs unless otherwise noted
  calibratedConfidence?: number
  stability?: number
  baselineSignificance?: number
  crossSupport?: number
  contradiction?: number
  bias?: number
  overconfidence?: number
  layerSupports?: Partial<Record<'finance'|'evaluation'|'temporal'|'ceo'|'reasoning', number>>
  auditPenalty?: number
  accuracy?: number
  ceoAlignOk?: boolean
  arbPlausible?: boolean
  causalMatch?: number
  externalGrounding?: number
}

function clamp01(n: number){ return Math.max(0, Math.min(1, n)) }

export function computeTrustScore(i: Required<Pick<ScoreInputs,'calibratedConfidence'|'stability'|'baselineSignificance'|'crossSupport'>>): number {
  const w = { conf: 0.4, stab: 0.3, base: 0.2, cross: 0.1 }
  const s = i.calibratedConfidence*w.conf + i.stability*w.stab + i.baselineSignificance*w.base + i.crossSupport*w.cross
  return Math.round(clamp01(s)*100)
}

export function computeTruthScore(i: Required<Pick<ScoreInputs,'accuracy'>> & Pick<ScoreInputs,'contradiction'|'bias'|'overconfidence'>): number {
  const contr = i.contradiction ?? 0
  const bias = i.bias ?? 0
  const over = i.overconfidence ?? 0
  const trusted = i.accuracy * (1 - 0.5*contr) * (1 - 0.3*bias) * (1 - 0.5*over)
  return Math.round(clamp01(trusted)*100)
}

export function computeConsensusScore(i: Required<Pick<ScoreInputs,'layerSupports'>> & Pick<ScoreInputs,'auditPenalty'>): { confidence: number } {
  const L = i.layerSupports || {}
  const w = { finance: 0.30, evaluation: 0.25, temporal: 0.20, ceo: 0.10, reasoning: 0.10, auditPenalty: -0.15 }
  const base = (w.finance*(L.finance||0)) + (w.evaluation*(L.evaluation||0)) + (w.temporal*(L.temporal||0)) + (w.ceo*(L.ceo||0)) + (w.reasoning*(L.reasoning||0)) + (w.auditPenalty*((i.auditPenalty)||0))
  return { confidence: clamp01(base) }
}

export function computeRealityScore(i: Required<Pick<ScoreInputs,'accuracy'>> & Pick<ScoreInputs,'ceoAlignOk'|'arbPlausible'>): number {
  const ceo = i.ceoAlignOk ? 0.25 : 0
  const arb = i.arbPlausible ? 0.25 : 0
  return Math.round(clamp01(i.accuracy*0.5 + ceo + arb)*100)
}

export function computeMetaScore(i: { arbitrationAccuracy: number; resolutionQuality: number; layerContribution: number; drift: number }): number {
  // same blend as meta layer
  const score = (i.arbitrationAccuracy*0.4 + i.resolutionQuality*0.3 + i.layerContribution*0.2 + (100 - i.drift)*0.1) / 100
  return Math.round(clamp01(score)*100)
}
