/**
 * Hospitality Intelligence Engine (HIE) - Pattern Detection Module
 * 
 * Detects recurring patterns in operational data.
 */

import type {
  Pattern,
  PatternCategory,
  PatternFrequency,
  PatternOccurrence,
  Trend,
  OperationalEvent,
  EvidenceRef,
} from './types'

// ─────────────────────────────────────────────────────────────────────────────
// Pattern Detector Interface
// ─────────────────────────────────────────────────────────────────────────────

export interface PatternDetector {
  id: string
  name: string
  detect(events: OperationalEvent[], context: PatternContext): Promise<Pattern[]>
}

export interface PatternContext {
  businessId: string
  timeRange: { start: string; end: string }
  minOccurrences?: number
  minConfidence?: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Pattern Detection Engine
// ─────────────────────────────────────────────────────────────────────────────

export class PatternDetectionEngine {
  private detectors: PatternDetector[] = []

  registerDetector(detector: PatternDetector): void {
    this.detectors.push(detector)
  }

  async detectPatterns(events: OperationalEvent[], context: PatternContext): Promise<Pattern[]> {
    const allPatterns: Pattern[] = []

    for (const detector of this.detectors) {
      const patterns = await detector.detect(events, context)
      allPatterns.push(...patterns)
    }

    return allPatterns.filter(p => 
      p.confidence >= (context.minConfidence || 0.5) &&
      p.occurrences.length >= (context.minOccurrences || 2)
    )
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Built-in Detectors
// ─────────────────────────────────────────────────────────────────────────────

export class TimeBasedPatternDetector implements PatternDetector {
  id = 'time_based'
  name = 'Time-Based Pattern Detector'

  constructor(private eventType: string, private windowMinutes: number = 60) {}

  async detect(events: OperationalEvent[], context: PatternContext): Promise<Pattern[]> {
    const targetEvents = events.filter(e => e.type === this.eventType)
    if (targetEvents.length < 2) return []

    const hourlyBuckets: Map<number, OperationalEvent[]> = new Map()

    for (const event of targetEvents) {
      const hour = new Date(event.timestamp).getHours()
      const bucket = hourlyBuckets.get(hour) || []
      bucket.push(event)
      hourlyBuckets.set(hour, bucket)
    }

    const patterns: Pattern[] = []

    for (const [hour, bucketEvents] of hourlyBuckets) {
      if (bucketEvents.length >= (context.minOccurrences || 2)) {
        const occurrences: PatternOccurrence[] = bucketEvents.map(e => ({
          timestamp: e.timestamp,
          eventIds: [e.id],
        }))

        patterns.push({
          id: `pattern_${Date.now()}_${hour}`,
          type: `recurring_${this.eventType}`,
          category: 'temporal',
          title: `Recurring pattern at ${hour}:00`,
          description: `${this.eventType} occurs regularly around ${hour}:00`,
          frequency: {
            type: 'daily',
            description: `Daily at hour ${hour}`,
          },
          confidence: Math.min(0.95, bucketEvents.length / targetEvents.length + 0.5),
          trend: 'stable',
          occurrences,
          evidence: bucketEvents.map(e => ({ type: 'event', id: e.id, timestamp: e.timestamp })),
        })
      }
    }

    return patterns
  }
}

export class RecurringIssueDetector implements PatternDetector {
  id = 'recurring_issue'
  name = 'Recurring Issue Detector'

  constructor(private issueType: string) {}

  async detect(events: OperationalEvent[], context: PatternContext): Promise<Pattern[]> {
    const issueEvents = events.filter(e => e.type === this.issueType)
    if (issueEvents.length < 2) return []

    const entityIssues: Map<string, OperationalEvent[]> = new Map()

    for (const event of issueEvents) {
      const entityId = event.stationId || event.staffId || event.tableId || 'unknown'
      const issues = entityIssues.get(entityId) || []
      issues.push(event)
      entityIssues.set(entityId, issues)
    }

    const patterns: Pattern[] = []

    for (const [entityId, entityEvents] of entityIssues) {
      if (entityEvents.length >= (context.minOccurrences || 2)) {
        const occurrences: PatternOccurrence[] = entityEvents.map(e => ({
          timestamp: e.timestamp,
          eventIds: [e.id],
        }))

        const trend: Trend = this.calculateTrend(entityEvents)

        patterns.push({
          id: `pattern_${Date.now()}_${entityId}`,
          type: `recurring_${this.issueType}`,
          category: 'operational',
          title: `Recurring issue at ${entityId}`,
          description: `${this.issueType} occurs repeatedly`,
          frequency: {
            type: 'irregular',
            description: `${entityEvents.length} occurrences`,
          },
          confidence: 0.8,
          trend,
          occurrences,
          recommendation: trend === 'increasing' ? 'Investigate and address root cause' : undefined,
          evidence: entityEvents.map(e => ({ type: 'event', id: e.id, timestamp: e.timestamp })),
        })
      }
    }

    return patterns
  }

  private calculateTrend(events: OperationalEvent[]): Trend {
    if (events.length < 3) return 'stable'
    
    const sorted = events.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )
    
    const firstHalf = sorted.slice(0, Math.floor(sorted.length / 2)).length
    const secondHalf = sorted.slice(Math.floor(sorted.length / 2)).length
    
    if (secondHalf > firstHalf * 1.2) return 'increasing'
    if (secondHalf < firstHalf * 0.8) return 'decreasing'
    return 'stable'
  }
}

export class DemandPatternDetector implements PatternDetector {
  id = 'demand_pattern'
  name = 'Demand Pattern Detector'

  async detect(events: OperationalEvent[], context: PatternContext): Promise<Pattern[]> {
    const orderEvents = events.filter(e => e.type.includes('order') && e.type.includes('created'))
    if (orderEvents.length < 5) return []

    const timeSlots: Map<string, number> = new Map()

    for (const event of orderEvents) {
      const date = new Date(event.timestamp)
      const hour = date.getHours()
      let slot: string

      if (hour >= 6 && hour < 11) slot = 'breakfast'
      else if (hour >= 11 && hour < 15) slot = 'lunch'
      else if (hour >= 17 && hour < 22) slot = 'dinner'
      else slot = 'other'

      timeSlots.set(slot, (timeSlots.get(slot) || 0) + 1)
    }

    const patterns: Pattern[] = []
    const total = orderEvents.length

    for (const [slot, count] of timeSlots) {
      if (count / total > 0.2) {
        patterns.push({
          id: `demand_${slot}_${Date.now()}`,
          type: 'demand_pattern',
          category: 'demand',
          title: `${slot.charAt(0).toUpperCase() + slot.slice(1)} demand pattern`,
          description: `${Math.round((count / total) * 100)}% of orders during ${slot}`,
          frequency: {
            type: 'daily',
            description: `Daily ${slot} period`,
          },
          confidence: 0.85,
          trend: 'stable',
          occurrences: orderEvents
            .filter(e => {
              const hour = new Date(e.timestamp).getHours()
              if (slot === 'breakfast') return hour >= 6 && hour < 11
              if (slot === 'lunch') return hour >= 11 && hour < 15
              if (slot === 'dinner') return hour >= 17 && hour < 22
              return false
            })
            .map(e => ({ timestamp: e.timestamp, value: 1, eventIds: [e.id] })),
          evidence: [{ type: 'aggregate', id: slot, description: `${count} orders` }],
        })
      }
    }

    return patterns
  }
}

export class CustomPatternDetector implements PatternDetector {
  constructor(
    public id: string,
    public name: string,
    private detectFn: (events: OperationalEvent[], context: PatternContext) => Promise<Pattern[]>
  ) {}

  async detect(events: OperationalEvent[], context: PatternContext): Promise<Pattern[]> {
    return this.detectFn(events, context)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────────

export function createPattern(
  type: string,
  category: PatternCategory,
  title: string,
  description: string,
  frequency: PatternFrequency,
  confidence: number,
  trend: Trend,
  occurrences: PatternOccurrence[],
  evidence: EvidenceRef[],
  recommendation?: string
): Pattern {
  return {
    id: `pattern_${Date.now()}`,
    type,
    category,
    title,
    description,
    frequency,
    confidence,
    trend,
    occurrences,
    recommendation,
    evidence,
  }
}
