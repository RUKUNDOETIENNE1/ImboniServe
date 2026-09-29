/**
 * Service Intelligence™ V2 - Event Transformer
 * 
 * Transforms Heart Pulse events into Operational Events for HIE.
 */

import type { ReplayEvent } from '@/lib/service-replay/types'
import type { OperationalEvent } from '@/lib/intelligence'

/**
 * Transform Heart Pulse/Replay events into Operational Events.
 * 
 * This is the bridge between reality (Heart Pulse) and intelligence (HIE).
 */
export class ServiceEventTransformer {
  /**
   * Transform replay events to operational events.
   */
  transform(replayEvents: ReplayEvent[]): OperationalEvent[] {
    return replayEvents.map(event => this.transformSingle(event))
  }

  /**
   * Transform a single event.
   */
  private transformSingle(event: ReplayEvent): OperationalEvent {
    return {
      id: event.id,
      timestamp: event.timestamp,
      type: this.mapEventType(event.eventType),
      category: this.mapCategory(event.category),
      
      // Entity references
      orderId: event.orderId,
      orderNumber: event.orderNumber,
      staffId: event.waiterId,
      staffName: event.waiterName,
      stationId: event.stationId,
      stationName: event.stationName,
      tableId: event.tableId,
      
      // Event data
      data: {
        description: event.description,
        duration: event.duration,
        metadata: event.metadata,
        ...event.details,
      },
    }
  }

  /**
   * Map replay event type to operational event type.
   */
  private mapEventType(replayEventType: string): string {
    const mapping: Record<string, string> = {
      // Order events
      'order_created': 'order_created',
      'order_confirmed': 'order_confirmed',
      'order_completed': 'order_completed',
      'order_cancelled': 'order_cancelled',
      'order_paid': 'order_paid',
      
      // Kitchen events
      'prep_started': 'prep_started',
      'prep_completed': 'prep_completed',
      'cooking_started': 'cooking_started',
      'cooking_completed': 'cooking_completed',
      'plating_started': 'plating_started',
      'plating_completed': 'plating_completed',
      
      // Service events
      'item_served': 'item_served',
      'table_cleared': 'table_cleared',
      'check_requested': 'check_requested',
      'payment_processed': 'payment_processed',
      
      // Staff events
      'shift_started': 'shift_started',
      'shift_ended': 'shift_ended',
      'break_started': 'break_started',
      'break_ended': 'break_ended',
      
      // System events
      'delay_detected': 'delay_detected',
      'rush_detected': 'rush_detected',
      'bottleneck_detected': 'bottleneck_detected',
    }

    return mapping[replayEventType] || replayEventType
  }

  /**
   * Map replay category to operational category.
   */
  private mapCategory(replayCategory: string): string {
    const mapping: Record<string, string> = {
      'order': 'order',
      'kitchen': 'kitchen',
      'service': 'service',
      'payment': 'payment',
      'staff': 'staff',
      'system': 'system',
      'customer': 'customer',
    }

    return mapping[replayCategory] || 'system'
  }

  /**
   * Filter events by time range.
   */
  filterByTimeRange(
    events: OperationalEvent[],
    start: string,
    end: string
  ): OperationalEvent[] {
    const startTime = new Date(start).getTime()
    const endTime = new Date(end).getTime()

    return events.filter(event => {
      const eventTime = new Date(event.timestamp).getTime()
      return eventTime >= startTime && eventTime <= endTime
    })
  }

  /**
   * Sort events by timestamp.
   */
  sortByTimestamp(events: OperationalEvent[]): OperationalEvent[] {
    return [...events].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )
  }

  /**
   * Get event statistics.
   */
  getStatistics(events: OperationalEvent[]): EventStatistics {
    const categories = new Map<string, number>()
    const types = new Map<string, number>()
    const orders = new Set<string>()
    const staff = new Set<string>()
    const stations = new Set<string>()

    for (const event of events) {
      // Count by category
      const categoryCount = categories.get(event.category) || 0
      categories.set(event.category, categoryCount + 1)

      // Count by type
      const typeCount = types.get(event.type) || 0
      types.set(event.type, typeCount + 1)

      // Collect unique entities
      if (event.orderId) orders.add(event.orderId)
      if (event.staffId) staff.add(event.staffId)
      if (event.stationId) stations.add(event.stationId)
    }

    const timestamps = events.map(e => new Date(e.timestamp).getTime())
    const timeSpan = timestamps.length > 0
      ? (Math.max(...timestamps) - Math.min(...timestamps)) / 60000 // minutes
      : 0

    return {
      totalEvents: events.length,
      uniqueOrders: orders.size,
      uniqueStaff: staff.size,
      uniqueStations: stations.size,
      timeSpanMinutes: timeSpan,
      eventsByCategory: Object.fromEntries(categories),
      eventsByType: Object.fromEntries(types),
    }
  }
}

export interface EventStatistics {
  totalEvents: number
  uniqueOrders: number
  uniqueStaff: number
  uniqueStations: number
  timeSpanMinutes: number
  eventsByCategory: Record<string, number>
  eventsByType: Record<string, number>
}

// ─────────────────────────────────────────────────────────────────────────────
// Factory
// ─────────────────────────────────────────────────────────────────────────────

export function createEventTransformer(): ServiceEventTransformer {
  return new ServiceEventTransformer()
}
