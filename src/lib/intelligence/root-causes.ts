/**
 * Hospitality Intelligence Engine (HIE) - Root Cause Analysis Module
 * 
 * Analyzes problems to identify root causes and contributing factors.
 */

import type {
  RootCause,
  CausalFactor,
  Problem,
  OperationalEvent,
  EvidenceRef,
} from './types'
import { EvidenceBuilder } from './evidence'

// ─────────────────────────────────────────────────────────────────────────────
// Root Cause Analyzer Interface
// ─────────────────────────────────────────────────────────────────────────────

export interface RootCauseAnalyzer {
  id: string
  name: string
  analyze(problem: Problem, events: OperationalEvent[]): Promise<RootCause | null>
}

// ─────────────────────────────────────────────────────────────────────────────
// Root Cause Analysis Engine
// ─────────────────────────────────────────────────────────────────────────────

export class RootCauseEngine {
  private analyzers: Map<string, RootCauseAnalyzer> = new Map()

  registerAnalyzer(problemType: string, analyzer: RootCauseAnalyzer): void {
    this.analyzers.set(problemType, analyzer)
  }

  async analyzeProblems(problems: Problem[], events: OperationalEvent[]): Promise<Problem[]> {
    const analyzed: Problem[] = []

    for (const problem of problems) {
      const analyzer = this.analyzers.get(problem.type)
      if (analyzer) {
        const rootCause = await analyzer.analyze(problem, events)
        analyzed.push({ ...problem, rootCause: rootCause || undefined })
      } else {
        analyzed.push(problem)
      }
    }

    return analyzed
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Built-in Analyzers
// ─────────────────────────────────────────────────────────────────────────────

export class DelayRootCauseAnalyzer implements RootCauseAnalyzer {
  id = 'delay_analyzer'
  name = 'Delay Root Cause Analyzer'

  async analyze(problem: Problem, events: OperationalEvent[]): Promise<RootCause | null> {
    const relevantEvents = events.filter(e => 
      problem.evidence.some(ev => ev.id === e.id)
    )

    const factors: CausalFactor[] = []
    const builder = new EvidenceBuilder()

    const kitchenDelays = relevantEvents.filter(e => e.category === 'kitchen' && e.type.includes('delay'))
    if (kitchenDelays.length > 0) {
      factors.push({
        factor: 'Kitchen preparation delays',
        contribution: kitchenDelays.length / relevantEvents.length,
        evidence: kitchenDelays.map(e => ({ type: 'event', id: e.id, timestamp: e.timestamp })),
      })
      builder.addEvents(kitchenDelays)
    }

    const staffIssues = relevantEvents.filter(e => e.category === 'waiter' && e.type.includes('delay'))
    if (staffIssues.length > 0) {
      factors.push({
        factor: 'Staff service delays',
        contribution: staffIssues.length / relevantEvents.length,
        evidence: staffIssues.map(e => ({ type: 'event', id: e.id, timestamp: e.timestamp })),
      })
      builder.addEvents(staffIssues)
    }

    const queueEvents = relevantEvents.filter(e => e.type.includes('queue'))
    if (queueEvents.length > 0) {
      factors.push({
        factor: 'Queue congestion',
        contribution: queueEvents.length / relevantEvents.length,
        evidence: queueEvents.map(e => ({ type: 'event', id: e.id, timestamp: e.timestamp })),
      })
      builder.addEvents(queueEvents)
    }

    if (factors.length === 0) return null

    const primaryFactor = factors.reduce((max, f) => f.contribution > max.contribution ? f : max)
    const confidence = primaryFactor.contribution

    return {
      id: `root_cause_${Date.now()}`,
      description: `Primary cause: ${primaryFactor.factor}`,
      factors,
      confidence,
      evidence: builder.buildRefs(),
    }
  }
}

export class BottleneckRootCauseAnalyzer implements RootCauseAnalyzer {
  id = 'bottleneck_analyzer'
  name = 'Bottleneck Root Cause Analyzer'

  async analyze(problem: Problem, events: OperationalEvent[]): Promise<RootCause | null> {
    const relevantEvents = events.filter(e => 
      problem.evidence.some(ev => ev.id === e.id)
    )

    const factors: CausalFactor[] = []
    const stationLoad: Map<string, number> = new Map()

    for (const event of relevantEvents) {
      if (event.stationId) {
        stationLoad.set(event.stationId, (stationLoad.get(event.stationId) || 0) + 1)
      }
    }

    if (stationLoad.size > 0) {
      const maxLoad = Math.max(...stationLoad.values())
      const overloadedStations = Array.from(stationLoad.entries())
        .filter(([_, load]) => load > maxLoad * 0.7)

      if (overloadedStations.length > 0) {
        factors.push({
          factor: `Station overload: ${overloadedStations.map(([id]) => id).join(', ')}`,
          contribution: 0.8,
        })
      }
    }

    const peakEvents = relevantEvents.filter(e => e.type.includes('peak') || e.type.includes('rush'))
    if (peakEvents.length > relevantEvents.length * 0.3) {
      factors.push({
        factor: 'Peak period congestion',
        contribution: peakEvents.length / relevantEvents.length,
      })
    }

    if (factors.length === 0) return null

    return {
      id: `root_cause_${Date.now()}`,
      description: factors[0].factor,
      factors,
      confidence: 0.75,
      evidence: relevantEvents.map(e => ({ type: 'event', id: e.id, timestamp: e.timestamp })),
    }
  }
}

export class CustomRootCauseAnalyzer implements RootCauseAnalyzer {
  constructor(
    public id: string,
    public name: string,
    private analyzeFn: (problem: Problem, events: OperationalEvent[]) => Promise<RootCause | null>
  ) {}

  async analyze(problem: Problem, events: OperationalEvent[]): Promise<RootCause | null> {
    return this.analyzeFn(problem, events)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────────

export function createRootCause(
  description: string,
  factors: CausalFactor[],
  confidence: number,
  evidence: EvidenceRef[]
): RootCause {
  return {
    id: `root_cause_${Date.now()}`,
    description,
    factors,
    confidence,
    evidence,
  }
}

export function createCausalFactor(
  factor: string,
  contribution: number,
  evidence?: EvidenceRef[]
): CausalFactor {
  return { factor, contribution, evidence }
}
