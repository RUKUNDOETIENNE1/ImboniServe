/**
 * Hospitality Intelligence Engine (HIE) - Highlights Module
 * 
 * Framework for detecting positive insights and achievements.
 */

import type {
  Highlight,
  HighlightCategory,
  OperationalEvent,
  EvidenceRef,
} from './types'
import { EvidenceBuilder } from './evidence'

// ─────────────────────────────────────────────────────────────────────────────
// Highlight Detector Interface
// ─────────────────────────────────────────────────────────────────────────────

export interface HighlightDetector {
  id: string
  name: string
  detect(events: OperationalEvent[], context: DetectionContext): Promise<Highlight[]>
}

export interface DetectionContext {
  businessId: string
  timeRange: { start: string; end: string }
  benchmarks?: Record<string, number>
}

// ─────────────────────────────────────────────────────────────────────────────
// Highlight Detection Engine
// ─────────────────────────────────────────────────────────────────────────────

export class HighlightDetectionEngine {
  private detectors: HighlightDetector[] = []

  registerDetector(detector: HighlightDetector): void {
    this.detectors.push(detector)
  }

  async detectHighlights(events: OperationalEvent[], context: DetectionContext): Promise<Highlight[]> {
    const allHighlights: Highlight[] = []
    for (const detector of this.detectors) {
      const highlights = await detector.detect(events, context)
      allHighlights.push(...highlights)
    }
    return allHighlights.sort((a, b) => b.confidence - a.confidence)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Built-in Detectors
// ─────────────────────────────────────────────────────────────────────────────

export class FastestOrderDetector implements HighlightDetector {
  id = 'fastest_order'
  name = 'Fastest Order Detector'

  constructor(private startState: string, private endState: string) {}

  async detect(events: OperationalEvent[], context: DetectionContext): Promise<Highlight[]> {
    const orderDurations: Array<{ orderId: string; orderNumber?: string; duration: number; timestamp: string }> = []
    const orderData: Map<string, { start?: string; end?: string; orderNumber?: string }> = new Map()

    for (const event of events) {
      if (!event.orderId) continue
      const record = orderData.get(event.orderId) || {}
      if (event.orderNumber) record.orderNumber = event.orderNumber
      if (event.newState === this.startState) record.start = event.timestamp
      if (event.newState === this.endState) record.end = event.timestamp
      orderData.set(event.orderId, record)
    }

    for (const [orderId, record] of orderData) {
      if (record.start && record.end) {
        const duration = (new Date(record.end).getTime() - new Date(record.start).getTime()) / 1000
        if (duration > 0) {
          orderDurations.push({ orderId, orderNumber: record.orderNumber, duration, timestamp: record.start })
        }
      }
    }

    if (orderDurations.length === 0) return []

    const fastest = orderDurations.reduce((min, curr) => curr.duration < min.duration ? curr : min)
    const avgDuration = orderDurations.reduce((sum, o) => sum + o.duration, 0) / orderDurations.length

    if (fastest.duration < avgDuration * 0.7) {
      return [{
        id: `fastest_order_${Date.now()}`,
        type: 'fastest_order',
        category: 'speed',
        title: 'Fastest Order Completion',
        description: `Order ${fastest.orderNumber || fastest.orderId} completed in record time`,
        value: Math.round(fastest.duration),
        unit: 'seconds',
        timestamp: fastest.timestamp,
        confidence: 0.9,
        icon: 'zap',
        evidence: [{ type: 'order', id: fastest.orderId, timestamp: fastest.timestamp }],
      }]
    }

    return []
  }
}

export class HighCompletionRateDetector implements HighlightDetector {
  id = 'high_completion_rate'
  name = 'High Completion Rate Detector'

  constructor(private completedType: string, private canceledType: string, private threshold: number = 98) {}

  async detect(events: OperationalEvent[], context: DetectionContext): Promise<Highlight[]> {
    const completed = events.filter(e => e.type === this.completedType).length
    const canceled = events.filter(e => e.type === this.canceledType).length
    const total = completed + canceled

    if (total === 0) return []

    const rate = (completed / total) * 100

    if (rate >= this.threshold) {
      return [{
        id: `high_completion_${Date.now()}`,
        type: 'high_completion_rate',
        category: 'quality',
        title: 'Excellent Completion Rate',
        description: `${rate.toFixed(1)}% of orders completed successfully`,
        value: rate,
        unit: 'percent',
        confidence: 0.95,
        icon: 'check-circle',
        evidence: [{ type: 'aggregate', id: 'completion_rate', description: `${completed}/${total} orders` }],
      }]
    }

    return []
  }
}

export class TopPerformerDetector implements HighlightDetector {
  id = 'top_performer'
  name = 'Top Performer Detector'

  async detect(events: OperationalEvent[], context: DetectionContext): Promise<Highlight[]> {
    const staffMetrics: Map<string, { name: string; count: number; events: OperationalEvent[] }> = new Map()

    for (const event of events) {
      if (!event.staffId || !event.staffName) continue
      const record = staffMetrics.get(event.staffId) || { name: event.staffName, count: 0, events: [] }
      record.count++
      record.events.push(event)
      staffMetrics.set(event.staffId, record)
    }

    if (staffMetrics.size === 0) return []

    const topStaff = Array.from(staffMetrics.entries())
      .sort((a, b) => b[1].count - a[1].count)[0]

    if (topStaff && topStaff[1].count > 10) {
      return [{
        id: `top_performer_${Date.now()}`,
        type: 'top_performer',
        category: 'staff',
        title: 'Top Performer',
        description: `${topStaff[1].name} handled ${topStaff[1].count} operations`,
        value: topStaff[1].count,
        unit: 'operations',
        confidence: 0.85,
        icon: 'star',
        evidence: [{ type: 'staff_action', id: topStaff[0], description: topStaff[1].name }],
      }]
    }

    return []
  }
}

export class CustomHighlightDetector implements HighlightDetector {
  constructor(
    public id: string,
    public name: string,
    private detectFn: (events: OperationalEvent[], context: DetectionContext) => Promise<Highlight[]>
  ) {}

  async detect(events: OperationalEvent[], context: DetectionContext): Promise<Highlight[]> {
    return this.detectFn(events, context)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────────

export function createHighlight(
  type: string,
  category: HighlightCategory,
  title: string,
  description: string,
  value: string | number,
  unit: string | undefined,
  confidence: number,
  evidence: EvidenceRef[],
  icon?: string,
  timestamp?: string
): Highlight {
  return {
    id: `${type}_${Date.now()}`,
    type,
    category,
    title,
    description,
    value,
    unit,
    timestamp,
    confidence,
    icon,
    evidence,
  }
}
