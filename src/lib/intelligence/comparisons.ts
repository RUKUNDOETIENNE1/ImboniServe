/**
 * Hospitality Intelligence Engine (HIE) - Comparisons Module
 * 
 * Compares current performance with historical periods.
 */

import type {
  ComparisonResult,
  ComparisonMetric,
  ComparisonPeriod,
  TimeRange,
  OperationalEvent,
} from './types'

// ─────────────────────────────────────────────────────────────────────────────
// Comparison Engine
// ─────────────────────────────────────────────────────────────────────────────

export class ComparisonEngine {
  private metrics: Map<string, MetricCalculator> = new Map()

  registerMetric(id: string, calculator: MetricCalculator): void {
    this.metrics.set(id, calculator)
  }

  async compare(
    currentEvents: OperationalEvent[],
    previousEvents: OperationalEvent[],
    period: ComparisonPeriod,
    currentRange: TimeRange,
    previousRange: TimeRange
  ): Promise<ComparisonResult> {
    const metrics: ComparisonMetric[] = []

    for (const [id, calculator] of this.metrics) {
      const current = await calculator.calculate(currentEvents)
      const previous = await calculator.calculate(previousEvents)
      
      const change = current - previous
      const changePercent = previous !== 0 ? (change / previous) * 100 : 0
      const trend = this.determineTrend(change, calculator.higherIsBetter)
      const significance = this.calculateSignificance(changePercent)

      metrics.push({
        id,
        name: calculator.name,
        current,
        previous,
        change,
        changePercent,
        trend,
        unit: calculator.unit,
        significance,
      })
    }

    const improvements = metrics.filter(m => m.trend === 'improved').map(m => 
      `${m.name}: ${m.changePercent > 0 ? '+' : ''}${m.changePercent.toFixed(1)}%`
    )

    const regressions = metrics.filter(m => m.trend === 'declined').map(m => 
      `${m.name}: ${m.changePercent.toFixed(1)}%`
    )

    const summary = this.generateSummary(metrics, improvements, regressions)

    return {
      period,
      periodLabel: this.getPeriodLabel(period, previousRange),
      comparedTimeRange: previousRange,
      metrics,
      improvements,
      regressions,
      summary,
    }
  }

  private determineTrend(change: number, higherIsBetter: boolean): 'improved' | 'same' | 'declined' {
    if (Math.abs(change) < 0.01) return 'same'
    
    if (higherIsBetter) {
      return change > 0 ? 'improved' : 'declined'
    } else {
      return change < 0 ? 'improved' : 'declined'
    }
  }

  private calculateSignificance(changePercent: number): 'low' | 'medium' | 'high' {
    const abs = Math.abs(changePercent)
    if (abs > 20) return 'high'
    if (abs > 10) return 'medium'
    return 'low'
  }

  private getPeriodLabel(period: ComparisonPeriod, range: TimeRange): string {
    switch (period) {
      case 'yesterday': return 'Yesterday'
      case 'last_week': return 'Last Week'
      case 'last_month': return 'Last Month'
      case 'previous_period': return 'Previous Period'
      case 'previous_shift': return 'Previous Shift'
      case 'custom': return range.label
    }
  }

  private generateSummary(
    metrics: ComparisonMetric[],
    improvements: string[],
    regressions: string[]
  ): string {
    if (improvements.length === 0 && regressions.length === 0) {
      return 'Performance is stable compared to the previous period'
    }

    const parts: string[] = []

    if (improvements.length > 0) {
      parts.push(`${improvements.length} metric${improvements.length > 1 ? 's' : ''} improved`)
    }

    if (regressions.length > 0) {
      parts.push(`${regressions.length} metric${regressions.length > 1 ? 's' : ''} declined`)
    }

    return parts.join(', ')
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Metric Calculator Interface
// ─────────────────────────────────────────────────────────────────────────────

export interface MetricCalculator {
  name: string
  unit: string
  higherIsBetter: boolean
  calculate(events: OperationalEvent[]): Promise<number>
}

// ─────────────────────────────────────────────────────────────────────────────
// Built-in Calculators
// ─────────────────────────────────────────────────────────────────────────────

export class CountMetricCalculator implements MetricCalculator {
  constructor(
    public name: string,
    public unit: string,
    public higherIsBetter: boolean,
    private eventType: string
  ) {}

  async calculate(events: OperationalEvent[]): Promise<number> {
    return events.filter(e => e.type === this.eventType).length
  }
}

export class AverageTimeMetricCalculator implements MetricCalculator {
  constructor(
    public name: string,
    public unit: string,
    public higherIsBetter: boolean,
    private startState: string,
    private endState: string
  ) {}

  async calculate(events: OperationalEvent[]): Promise<number> {
    const durations: number[] = []
    const orderData: Map<string, { start?: string; end?: string }> = new Map()

    for (const event of events) {
      if (!event.orderId) continue
      const record = orderData.get(event.orderId) || {}
      if (event.newState === this.startState) record.start = event.timestamp
      if (event.newState === this.endState) record.end = event.timestamp
      orderData.set(event.orderId, record)
    }

    for (const record of orderData.values()) {
      if (record.start && record.end) {
        const duration = (new Date(record.end).getTime() - new Date(record.start).getTime()) / 1000
        if (duration > 0) durations.push(duration)
      }
    }

    return durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0
  }
}

export class RateMetricCalculator implements MetricCalculator {
  constructor(
    public name: string,
    public unit: string,
    public higherIsBetter: boolean,
    private successType: string,
    private totalType: string
  ) {}

  async calculate(events: OperationalEvent[]): Promise<number> {
    const success = events.filter(e => e.type === this.successType).length
    const total = events.filter(e => e.type === this.totalType).length
    return total > 0 ? (success / total) * 100 : 0
  }
}

export class CustomMetricCalculator implements MetricCalculator {
  constructor(
    public name: string,
    public unit: string,
    public higherIsBetter: boolean,
    private calculateFn: (events: OperationalEvent[]) => Promise<number>
  ) {}

  async calculate(events: OperationalEvent[]): Promise<number> {
    return this.calculateFn(events)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────────

export function calculatePreviousTimeRange(
  current: TimeRange,
  period: ComparisonPeriod
): TimeRange {
  const currentStart = new Date(current.start)
  const currentEnd = new Date(current.end)
  const duration = currentEnd.getTime() - currentStart.getTime()

  let previousStart: Date
  let previousEnd: Date

  switch (period) {
    case 'previous_period':
      previousEnd = new Date(currentStart.getTime() - 1)
      previousStart = new Date(previousEnd.getTime() - duration)
      break

    case 'yesterday':
      previousStart = new Date(currentStart)
      previousStart.setDate(previousStart.getDate() - 1)
      previousEnd = new Date(currentEnd)
      previousEnd.setDate(previousEnd.getDate() - 1)
      break

    case 'last_week':
      previousStart = new Date(currentStart)
      previousStart.setDate(previousStart.getDate() - 7)
      previousEnd = new Date(currentEnd)
      previousEnd.setDate(previousEnd.getDate() - 7)
      break

    case 'last_month':
      previousStart = new Date(currentStart)
      previousStart.setMonth(previousStart.getMonth() - 1)
      previousEnd = new Date(currentEnd)
      previousEnd.setMonth(previousEnd.getMonth() - 1)
      break

    default:
      previousEnd = new Date(currentStart.getTime() - 1)
      previousStart = new Date(previousEnd.getTime() - duration)
  }

  return {
    start: previousStart.toISOString(),
    end: previousEnd.toISOString(),
    label: `Previous ${current.label}`,
    durationMinutes: Math.round(duration / 60000),
  }
}
