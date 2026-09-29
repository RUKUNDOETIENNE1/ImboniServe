/**
 * Hospitality Intelligence Engine (HIE) - Problem Detection Module
 * 
 * Framework for detecting operational problems from event streams.
 */

import type {
  Problem,
  ProblemCategory,
  Severity,
  ImpactAssessment,
  OperationalEvent,
  EvidenceRef,
} from './types'
import { EvidenceBuilder } from './evidence'

// ─────────────────────────────────────────────────────────────────────────────
// Problem Detector Interface
// ─────────────────────────────────────────────────────────────────────────────

export interface ProblemDetector {
  id: string
  name: string
  detect(events: OperationalEvent[], context: DetectionContext): Promise<Problem[]>
}

export interface DetectionContext {
  businessId: string
  timeRange: { start: string; end: string }
  thresholds?: Record<string, number>
}

// ─────────────────────────────────────────────────────────────────────────────
// Problem Detection Engine
// ─────────────────────────────────────────────────────────────────────────────

export class ProblemDetectionEngine {
  private detectors: ProblemDetector[] = []

  registerDetector(detector: ProblemDetector): void {
    this.detectors.push(detector)
  }

  async detectProblems(events: OperationalEvent[], context: DetectionContext): Promise<Problem[]> {
    const allProblems: Problem[] = []
    for (const detector of this.detectors) {
      const problems = await detector.detect(events, context)
      allProblems.push(...problems)
    }
    return allProblems.sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3 }
      return order[a.severity] - order[b.severity]
    })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Built-in Detectors
// ─────────────────────────────────────────────────────────────────────────────

export class DelayDetector implements ProblemDetector {
  id = 'delay_detector'
  name = 'Delay Detector'

  constructor(
    private startState: string,
    private endState: string,
    private thresholdSeconds: number,
    private problemType: string,
    private category: ProblemCategory = 'delay'
  ) {}

  async detect(events: OperationalEvent[], context: DetectionContext): Promise<Problem[]> {
    const problems: Problem[] = []
    const orderData: Map<string, { start?: string; end?: string; events: OperationalEvent[] }> = new Map()

    for (const event of events) {
      if (!event.orderId) continue
      const record = orderData.get(event.orderId) || { events: [] }
      record.events.push(event)
      if (event.newState === this.startState) record.start = event.timestamp
      if (event.newState === this.endState) record.end = event.timestamp
      orderData.set(event.orderId, record)
    }

    const delayed: Array<{ orderId: string; duration: number; events: OperationalEvent[] }> = []

    for (const [orderId, record] of orderData) {
      if (record.start && record.end) {
        const duration = (new Date(record.end).getTime() - new Date(record.start).getTime()) / 1000
        if (duration > this.thresholdSeconds) {
          delayed.push({ orderId, duration, events: record.events })
        }
      }
    }

    if (delayed.length > 0) {
      const avgDelay = delayed.reduce((sum, o) => sum + o.duration, 0) / delayed.length
      const maxDelay = Math.max(...delayed.map(o => o.duration))
      const severity = this.calculateSeverity(delayed.length, maxDelay)
      const builder = new EvidenceBuilder()
      for (const order of delayed) builder.addEvents(order.events)

      problems.push({
        id: `${this.problemType}_${Date.now()}`,
        type: this.problemType,
        category: this.category,
        severity,
        title: `${delayed.length} orders experienced delays`,
        description: `Average delay: ${Math.round(avgDelay)}s, Max: ${Math.round(maxDelay)}s`,
        impact: { description: `${delayed.length} orders affected`, affectedOrders: delayed.length },
        startTime: context.timeRange.start,
        endTime: context.timeRange.end,
        durationSeconds: Math.round(avgDelay),
        evidence: builder.buildRefs(),
      })
    }

    return problems
  }

  private calculateSeverity(count: number, maxDelay: number): Severity {
    if (count > 10 || maxDelay > this.thresholdSeconds * 3) return 'critical'
    if (count > 5 || maxDelay > this.thresholdSeconds * 2) return 'high'
    if (count > 2) return 'medium'
    return 'low'
  }
}

export class FailureRateDetector implements ProblemDetector {
  id = 'failure_rate_detector'
  name = 'Failure Rate Detector'

  constructor(
    private failureType: string,
    private totalType: string,
    private thresholdPercent: number,
    private problemType: string
  ) {}

  async detect(events: OperationalEvent[], context: DetectionContext): Promise<Problem[]> {
    const failures = events.filter(e => e.type === this.failureType)
    const total = events.filter(e => e.type === this.totalType).length
    if (total === 0) return []

    const rate = (failures.length / total) * 100
    if (rate < this.thresholdPercent) return []

    const builder = new EvidenceBuilder().addEvents(failures)
    const severity: Severity = rate > 20 ? 'critical' : rate > 10 ? 'high' : rate > 5 ? 'medium' : 'low'

    return [{
      id: `${this.problemType}_${Date.now()}`,
      type: this.problemType,
      category: 'failure',
      severity,
      title: `High failure rate detected: ${rate.toFixed(1)}%`,
      description: `${failures.length} failures out of ${total} attempts`,
      impact: { description: `${failures.length} failures`, affectedOrders: failures.length },
      startTime: context.timeRange.start,
      endTime: context.timeRange.end,
      evidence: builder.buildRefs(),
    }]
  }
}

export class CustomProblemDetector implements ProblemDetector {
  constructor(
    public id: string,
    public name: string,
    private detectFn: (events: OperationalEvent[], context: DetectionContext) => Promise<Problem[]>
  ) {}

  async detect(events: OperationalEvent[], context: DetectionContext): Promise<Problem[]> {
    return this.detectFn(events, context)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────────

export function createProblem(
  type: string,
  category: ProblemCategory,
  severity: Severity,
  title: string,
  description: string,
  impact: ImpactAssessment,
  evidence: EvidenceRef[],
  timeRange: { start: string; end: string }
): Problem {
  return {
    id: `${type}_${Date.now()}`,
    type,
    category,
    severity,
    title,
    description,
    impact,
    startTime: timeRange.start,
    endTime: timeRange.end,
    evidence,
  }
}
