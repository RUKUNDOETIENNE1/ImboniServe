/**
 * Hospitality Intelligence Engine (HIE) - Scoring Module
 * 
 * Pluggable scoring system for operational performance.
 */

import type {
  Score,
  ScoreDimension,
  ScoringConfig,
  ScoringDimensionConfig,
  Trend,
  OperationalEvent,
  EvidenceRef,
} from './types'

// ─────────────────────────────────────────────────────────────────────────────
// Scoring Engine
// ─────────────────────────────────────────────────────────────────────────────

export class ScoringEngine {
  private config: ScoringConfig
  private calculators: Map<string, DimensionCalculator> = new Map()

  constructor(config: ScoringConfig) {
    this.config = config
  }

  registerCalculator(dimensionId: string, calculator: DimensionCalculator): void {
    this.calculators.set(dimensionId, calculator)
  }

  async calculateScore(events: OperationalEvent[], previousScore?: number): Promise<Score> {
    const dimensions: ScoreDimension[] = []
    let weightedSum = 0
    let totalWeight = 0

    for (const dimConfig of this.config.dimensions) {
      const calculator = this.calculators.get(dimConfig.id)
      if (!calculator) continue

      const result = await calculator.calculate(events, dimConfig)
      const dimension: ScoreDimension = {
        id: dimConfig.id,
        name: dimConfig.name,
        score: result.score,
        weight: dimConfig.weight,
        value: result.value,
        benchmark: dimConfig.benchmark,
        unit: dimConfig.unit,
        description: dimConfig.description,
        evidence: result.evidence,
      }

      dimensions.push(dimension)
      weightedSum += dimension.score * dimension.weight
      totalWeight += dimension.weight
    }

    const overall = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0
    const trend = this.calculateTrend(overall, previousScore)

    return { overall, dimensions, trend, previousScore }
  }

  private calculateTrend(current: number, previous?: number): Trend {
    if (previous === undefined) return 'stable'
    const diff = current - previous
    if (diff > 2) return 'improving'
    if (diff < -2) return 'declining'
    return 'stable'
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Calculator Interface
// ─────────────────────────────────────────────────────────────────────────────

export interface DimensionCalculator {
  calculate(events: OperationalEvent[], config: ScoringDimensionConfig): Promise<DimensionResult>
}

export interface DimensionResult {
  score: number
  value: number
  evidence?: EvidenceRef[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Built-in Calculators
// ─────────────────────────────────────────────────────────────────────────────

export class AverageTimeCalculator implements DimensionCalculator {
  constructor(private startState: string, private endState: string) {}

  async calculate(events: OperationalEvent[], config: ScoringDimensionConfig): Promise<DimensionResult> {
    const durations: number[] = []
    const orderTimestamps: Map<string, { start?: string; end?: string }> = new Map()

    for (const event of events) {
      if (!event.orderId) continue
      const record = orderTimestamps.get(event.orderId) || {}
      if (event.newState === this.startState) record.start = event.timestamp
      if (event.newState === this.endState) record.end = event.timestamp
      orderTimestamps.set(event.orderId, record)
    }

    for (const record of orderTimestamps.values()) {
      if (record.start && record.end) {
        const duration = (new Date(record.end).getTime() - new Date(record.start).getTime()) / 1000
        if (duration > 0) durations.push(duration)
      }
    }

    const avgValue = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0
    const score = scoreValue(avgValue, config.benchmark, config.higherIsBetter)
    return { score, value: avgValue }
  }
}

export class RateCalculator implements DimensionCalculator {
  constructor(private successType: string, private totalType: string) {}

  async calculate(events: OperationalEvent[], config: ScoringDimensionConfig): Promise<DimensionResult> {
    const successCount = events.filter(e => e.type === this.successType).length
    const totalCount = events.filter(e => e.type === this.totalType).length
    const rate = totalCount > 0 ? (successCount / totalCount) * 100 : 100
    const score = scoreValue(rate, config.benchmark, config.higherIsBetter)
    return { score, value: rate }
  }
}

export class CountCalculator implements DimensionCalculator {
  constructor(private eventType: string) {}

  async calculate(events: OperationalEvent[], config: ScoringDimensionConfig): Promise<DimensionResult> {
    const count = events.filter(e => e.type === this.eventType).length
    const score = scoreValue(count, config.benchmark, config.higherIsBetter)
    return { score, value: count }
  }
}

export class CustomCalculator implements DimensionCalculator {
  constructor(private fn: (events: OperationalEvent[]) => { value: number; evidence?: EvidenceRef[] }) {}

  async calculate(events: OperationalEvent[], config: ScoringDimensionConfig): Promise<DimensionResult> {
    const result = this.fn(events)
    const score = scoreValue(result.value, config.benchmark, config.higherIsBetter)
    return { score, value: result.value, evidence: result.evidence }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────────

function scoreValue(value: number, benchmark: number, higherIsBetter: boolean): number {
  if (higherIsBetter) {
    return Math.min(100, Math.round((value / benchmark) * 100))
  } else {
    if (value <= benchmark) return 100
    return Math.max(0, Math.round((benchmark / value) * 100))
  }
}

export function createScoringConfig(dimensions: ScoringDimensionConfig[]): ScoringConfig {
  return { dimensions }
}
