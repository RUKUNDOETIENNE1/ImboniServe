export type TrendDirection = 'RISING' | 'FALLING' | 'STABLE' | 'VOLATILE'

export interface TrendAnalysis {
  direction: TrendDirection
  momentum: number // latest delta
  acceleration: number // change in delta (delta of deltas)
}

function threshold(base: number) {
  const abs = Math.max(1, Math.floor(base * 0.05))
  return abs
}

export function analyzeSeries(series: number[]): TrendAnalysis {
  // Expect [prev2, prev1, current]; fallback safe
  const p2 = series[0] ?? 0
  const p1 = series[1] ?? p2
  const c = series[2] ?? p1
  const d1 = p1 - p2
  const d2 = c - p1
  const t = threshold(Math.max(1, p1))
  let direction: TrendDirection = 'STABLE'
  if (Math.abs(d2) <= t) direction = 'STABLE'
  else direction = d2 > 0 ? 'RISING' : 'FALLING'
  const accel = d2 - d1
  // Volatility: sign flip with both moves meaningful
  if (Math.abs(d1) > t && Math.abs(d2) > t && (d1 > 0) !== (d2 > 0)) direction = 'VOLATILE'
  return { direction, momentum: d2, acceleration: accel }
}
