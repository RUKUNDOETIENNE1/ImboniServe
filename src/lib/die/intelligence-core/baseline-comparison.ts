import type { BaselineStat } from './baseline-engine'

export interface BaselineDeviation {
  metric: string
  baseline: number
  current: number
  deviationPct: number // -100..+∞
  severity: 'INFO' | 'WARN' | 'CRITICAL'
}

export function compareToBaseline(metric: string, baseline: BaselineStat | undefined, current: number): BaselineDeviation {
  const base = baseline?.mean ?? 0
  const denom = Math.max(1, base)
  const deviationPct = ((current - base) / denom) * 100
  let severity: BaselineDeviation['severity'] = 'INFO'
  const abs = Math.abs(deviationPct)
  if (abs > 200) severity = 'CRITICAL'
  else if (abs > 50) severity = 'WARN'
  return { metric, baseline: base, current, deviationPct, severity }
}
