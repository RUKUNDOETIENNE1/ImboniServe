/**
 * Hospitality Intelligence Engine (HIE) - Evidence Module
 * 
 * Collects, organizes, and links evidence to insights.
 * Provides replay integration for drill-down capabilities.
 */

import type {
  Evidence,
  EvidenceRef,
  OperationalEvent,
  TimeRange,
} from './types'

// ─────────────────────────────────────────────────────────────────────────────
// Evidence Collector
// ─────────────────────────────────────────────────────────────────────────────

export class EvidenceCollector {
  private events: Map<string, OperationalEvent> = new Map()
  private orderEvents: Map<string, string[]> = new Map()
  private staffEvents: Map<string, string[]> = new Map()
  private stationEvents: Map<string, string[]> = new Map()
  private tableEvents: Map<string, string[]> = new Map()

  constructor(events: OperationalEvent[] = []) {
    this.indexEvents(events)
  }

  private indexEvents(events: OperationalEvent[]): void {
    for (const event of events) {
      this.events.set(event.id, event)
      if (event.orderId) {
        const ids = this.orderEvents.get(event.orderId) || []
        ids.push(event.id)
        this.orderEvents.set(event.orderId, ids)
      }
      if (event.staffId) {
        const ids = this.staffEvents.get(event.staffId) || []
        ids.push(event.id)
        this.staffEvents.set(event.staffId, ids)
      }
      if (event.stationId) {
        const ids = this.stationEvents.get(event.stationId) || []
        ids.push(event.id)
        this.stationEvents.set(event.stationId, ids)
      }
      if (event.tableId) {
        const ids = this.tableEvents.get(event.tableId) || []
        ids.push(event.id)
        this.tableEvents.set(event.tableId, ids)
      }
    }
  }

  addEvents(events: OperationalEvent[]): void {
    this.indexEvents(events)
  }

  getEvent(eventId: string): OperationalEvent | undefined {
    return this.events.get(eventId)
  }

  getOrderEvents(orderId: string): OperationalEvent[] {
    const eventIds = this.orderEvents.get(orderId) || []
    return eventIds.map(id => this.events.get(id)).filter(Boolean) as OperationalEvent[]
  }

  getStaffEvents(staffId: string): OperationalEvent[] {
    const eventIds = this.staffEvents.get(staffId) || []
    return eventIds.map(id => this.events.get(id)).filter(Boolean) as OperationalEvent[]
  }

  getStationEvents(stationId: string): OperationalEvent[] {
    const eventIds = this.stationEvents.get(stationId) || []
    return eventIds.map(id => this.events.get(id)).filter(Boolean) as OperationalEvent[]
  }

  getTableEvents(tableId: string): OperationalEvent[] {
    const eventIds = this.tableEvents.get(tableId) || []
    return eventIds.map(id => this.events.get(id)).filter(Boolean) as OperationalEvent[]
  }

  getEventsInRange(start: string, end: string): OperationalEvent[] {
    const startTime = new Date(start).getTime()
    const endTime = new Date(end).getTime()
    return Array.from(this.events.values()).filter(event => {
      const eventTime = new Date(event.timestamp).getTime()
      return eventTime >= startTime && eventTime <= endTime
    })
  }

  getEventsByType(type: string): OperationalEvent[] {
    return Array.from(this.events.values()).filter(event => event.type === type)
  }

  getEventsByCategory(category: string): OperationalEvent[] {
    return Array.from(this.events.values()).filter(event => event.category === category)
  }

  getOrderIds(): string[] {
    return Array.from(this.orderEvents.keys())
  }

  getStaffIds(): string[] {
    return Array.from(this.staffEvents.keys())
  }

  getStationIds(): string[] {
    return Array.from(this.stationEvents.keys())
  }

  get totalEvents(): number {
    return this.events.size
  }

  get totalOrders(): number {
    return this.orderEvents.size
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Evidence Builder
// ─────────────────────────────────────────────────────────────────────────────

export class EvidenceBuilder {
  private eventIds: Set<string> = new Set()
  private orderIds: Set<string> = new Set()
  private refs: EvidenceRef[] = []

  addEvent(event: OperationalEvent): this {
    this.eventIds.add(event.id)
    if (event.orderId) this.orderIds.add(event.orderId)
    this.refs.push({
      type: 'event',
      id: event.id,
      timestamp: event.timestamp,
      description: `${event.type}: ${event.category}`,
    })
    return this
  }

  addEvents(events: OperationalEvent[]): this {
    for (const event of events) this.addEvent(event)
    return this
  }

  addOrder(orderId: string, orderNumber?: string): this {
    this.orderIds.add(orderId)
    this.refs.push({
      type: 'order',
      id: orderId,
      description: orderNumber ? `Order #${orderNumber}` : undefined,
    })
    return this
  }

  addStaffAction(staffId: string, staffName: string, action: string, timestamp: string): this {
    this.refs.push({
      type: 'staff_action',
      id: staffId,
      timestamp,
      description: `${staffName}: ${action}`,
    })
    return this
  }

  addAggregate(id: string, description: string): this {
    this.refs.push({ type: 'aggregate', id, description })
    return this
  }

  build(summary: string, replayTimestamp?: string): Evidence {
    return {
      eventCount: this.eventIds.size,
      eventIds: Array.from(this.eventIds),
      orderIds: Array.from(this.orderIds),
      summary,
      replayTimestamp,
    }
  }

  buildRefs(): EvidenceRef[] {
    return [...this.refs]
  }

  getEarliestTimestamp(): string | undefined {
    const timestamps = this.refs.filter(r => r.timestamp).map(r => r.timestamp!).sort()
    return timestamps[0]
  }

  getLatestTimestamp(): string | undefined {
    const timestamps = this.refs.filter(r => r.timestamp).map(r => r.timestamp!).sort()
    return timestamps[timestamps.length - 1]
  }

  reset(): this {
    this.eventIds.clear()
    this.orderIds.clear()
    this.refs = []
    return this
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Replay Link Generator
// ─────────────────────────────────────────────────────────────────────────────

export class ReplayLinkGenerator {
  constructor(private baseUrl: string = '/dashboard/service-replay') {}

  generateTimestampLink(timestamp: string, businessId: string): string {
    return `${this.baseUrl}?t=${encodeURIComponent(timestamp)}&business=${businessId}`
  }

  generateOrderLink(orderId: string, businessId: string): string {
    return `${this.baseUrl}?order=${orderId}&business=${businessId}`
  }

  generateRangeLink(timeRange: TimeRange, businessId: string): string {
    return `${this.baseUrl}?start=${encodeURIComponent(timeRange.start)}&end=${encodeURIComponent(timeRange.end)}&business=${businessId}`
  }

  generateFilteredLink(businessId: string, filters: ReplayFilters): string {
    const params = new URLSearchParams({ business: businessId })
    if (filters.start) params.set('start', filters.start)
    if (filters.end) params.set('end', filters.end)
    if (filters.orderId) params.set('order', filters.orderId)
    if (filters.staffId) params.set('staff', filters.staffId)
    if (filters.stationId) params.set('station', filters.stationId)
    if (filters.tableId) params.set('table', filters.tableId)
    if (filters.eventTypes?.length) params.set('types', filters.eventTypes.join(','))
    return `${this.baseUrl}?${params.toString()}`
  }
}

export interface ReplayFilters {
  start?: string
  end?: string
  orderId?: string
  staffId?: string
  stationId?: string
  tableId?: string
  eventTypes?: string[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Evidence Utilities
// ─────────────────────────────────────────────────────────────────────────────

export function createEvidenceFromEvents(
  events: OperationalEvent[],
  summary: string
): Evidence {
  const builder = new EvidenceBuilder()
  builder.addEvents(events)
  return builder.build(summary, builder.getEarliestTimestamp())
}

export function createEvidenceRefs(events: OperationalEvent[]): EvidenceRef[] {
  return events.map(event => ({
    type: 'event' as const,
    id: event.id,
    timestamp: event.timestamp,
    description: `${event.type}`,
  }))
}

export function mergeEvidence(evidences: Evidence[]): Evidence {
  const eventIds = new Set<string>()
  const orderIds = new Set<string>()
  let totalCount = 0
  const summaries: string[] = []
  let earliestTimestamp: string | undefined

  for (const evidence of evidences) {
    totalCount += evidence.eventCount
    for (const id of evidence.eventIds) eventIds.add(id)
    for (const id of evidence.orderIds) orderIds.add(id)
    summaries.push(evidence.summary)
    if (evidence.replayTimestamp) {
      if (!earliestTimestamp || evidence.replayTimestamp < earliestTimestamp) {
        earliestTimestamp = evidence.replayTimestamp
      }
    }
  }

  return {
    eventCount: totalCount,
    eventIds: Array.from(eventIds),
    orderIds: Array.from(orderIds),
    summary: summaries.join('; '),
    replayTimestamp: earliestTimestamp,
  }
}
