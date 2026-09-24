/**
 * Service Replay™ - Comprehensive Test Suite
 * 
 * Tests for:
 * - Event transformation
 * - Statistics calculation
 * - Time utilities
 * - API endpoints
 * - Playback controls
 * - Filtering and search
 */

import {
  transformTicketEvent,
  transformTicketEvents,
  buildEventDescription,
} from '@/lib/service-replay/transformer'

import {
  calculateStatistics,
  createEmptyStatistics,
  StatisticsTracker,
} from '@/lib/service-replay/statistics'

import {
  getTimeRangeForPreset,
  formatReplayTime,
  formatDuration,
  calculateProgress,
  calculateTimeAtProgress,
  findEventIndexAtTime,
  calculateNextEventDelay,
} from '@/lib/service-replay/time-utils'

import {
  getEventCategory,
  getEventLabel,
  getEventColors,
  EVENT_TYPE_METADATA,
  EVENT_CATEGORY_COLORS,
} from '@/lib/service-replay/types'

import type { ReplayEvent, ReplayEventType } from '@/lib/service-replay/types'

// ─────────────────────────────────────────────────────────────────────────────
// Test Data Fixtures
// ─────────────────────────────────────────────────────────────────────────────

const mockTicketEvent = {
  id: 'event-1',
  saleId: 'sale-1',
  saleItemId: 'item-1',
  stationId: 'station-1',
  eventType: 'ORDER_CREATED',
  actorId: 'user-1',
  actorName: 'John Waiter',
  previousState: null,
  newState: 'pending',
  metadata: { correlationId: 'corr-123' },
  idempotencyKey: 'idem-1',
  sequenceNumber: 1,
  createdAt: new Date('2026-07-14T12:00:00Z'),
  sale: {
    id: 'sale-1',
    orderNumber: 'ORD-001',
    tableId: 'table-1',
    customerId: 'cust-1',
    customerName: 'Jane Customer',
    table: {
      id: 'table-1',
      number: '5',
      assignedWaiterId: 'user-1',
      assignedWaiter: {
        id: 'user-1',
        name: 'John Waiter',
      },
    },
    customer: {
      id: 'cust-1',
      name: 'Jane Customer',
    },
  },
  saleItem: {
    id: 'item-1',
    menuItem: {
      name: 'Grilled Chicken',
    },
  },
  station: {
    id: 'station-1',
    name: 'Kitchen',
    code: 'KITCHEN',
  },
  actor: {
    id: 'user-1',
    name: 'John Waiter',
  },
}

const mockReplayEvents: ReplayEvent[] = [
  {
    id: 'event-1',
    timestamp: '2026-07-14T12:00:00Z',
    eventType: 'ORDER_CREATED',
    category: 'order',
    description: 'Order Created: Order #ORD-001 • Table 5',
    orderId: 'sale-1',
    orderNumber: 'ORD-001',
    tableId: 'table-1',
    tableNumber: '5',
  },
  {
    id: 'event-2',
    timestamp: '2026-07-14T12:01:00Z',
    eventType: 'ITEM_ROUTED',
    category: 'kitchen',
    description: 'Item Routed: Order #ORD-001 • at Kitchen',
    orderId: 'sale-1',
    orderNumber: 'ORD-001',
    stationId: 'station-1',
    stationName: 'Kitchen',
    metadata: { saleItemId: 'item-1' },
  },
  {
    id: 'event-3',
    timestamp: '2026-07-14T12:05:00Z',
    eventType: 'ITEM_PREPARING',
    category: 'kitchen',
    description: 'Item Preparing: Order #ORD-001',
    orderId: 'sale-1',
    orderNumber: 'ORD-001',
    metadata: { saleItemId: 'item-1' },
  },
  {
    id: 'event-4',
    timestamp: '2026-07-14T12:15:00Z',
    eventType: 'ITEM_READY',
    category: 'completed',
    description: 'Item Ready: Order #ORD-001',
    orderId: 'sale-1',
    orderNumber: 'ORD-001',
    metadata: { saleItemId: 'item-1' },
  },
  {
    id: 'event-5',
    timestamp: '2026-07-14T12:20:00Z',
    eventType: 'PAYMENT_COMPLETED',
    category: 'completed',
    description: 'Payment Completed: Order #ORD-001',
    orderId: 'sale-1',
    orderNumber: 'ORD-001',
  },
  {
    id: 'event-6',
    timestamp: '2026-07-14T12:25:00Z',
    eventType: 'ORDER_COMPLETED',
    category: 'completed',
    description: 'Order Completed: Order #ORD-001',
    orderId: 'sale-1',
    orderNumber: 'ORD-001',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Event Transformation Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('Event Transformation', () => {
  describe('transformTicketEvent', () => {
    it('should transform a ticket event to replay event format', () => {
      const result = transformTicketEvent(mockTicketEvent as any)
      
      expect(result.id).toBe('event-1')
      expect(result.eventType).toBe('ORDER_CREATED')
      expect(result.category).toBe('order')
      expect(result.orderId).toBe('sale-1')
      expect(result.orderNumber).toBe('ORD-001')
      expect(result.tableId).toBe('table-1')
      expect(result.tableNumber).toBe('5')
      expect(result.stationId).toBe('station-1')
      expect(result.stationName).toBe('Kitchen')
      expect(result.actorName).toBe('John Waiter')
    })
    
    it('should include correlation ID from metadata', () => {
      const result = transformTicketEvent(mockTicketEvent as any)
      expect(result.correlationId).toBe('corr-123')
    })
    
    it('should handle missing relations gracefully', () => {
      const minimalEvent = {
        id: 'event-2',
        saleId: 'sale-2',
        eventType: 'ORDER_UPDATED',
        createdAt: new Date(),
        sale: null,
        saleItem: null,
        station: null,
        actor: null,
      }
      
      const result = transformTicketEvent(minimalEvent as any)
      
      expect(result.id).toBe('event-2')
      expect(result.eventType).toBe('ORDER_UPDATED')
      expect(result.orderNumber).toBeUndefined()
      expect(result.tableNumber).toBeUndefined()
    })
  })
  
  describe('transformTicketEvents', () => {
    it('should transform multiple events', () => {
      const events = [mockTicketEvent, { ...mockTicketEvent, id: 'event-2' }]
      const results = transformTicketEvents(events as any)
      
      expect(results).toHaveLength(2)
      expect(results[0].id).toBe('event-1')
      expect(results[1].id).toBe('event-2')
    })
  })
  
  describe('buildEventDescription', () => {
    it('should build description with order number', () => {
      const description = buildEventDescription(mockTicketEvent as any, 'ORDER_CREATED')
      expect(description).toContain('ORD-001')
    })
    
    it('should include table number', () => {
      const description = buildEventDescription(mockTicketEvent as any, 'ORDER_CREATED')
      expect(description).toContain('Table 5')
    })
    
    it('should include station name', () => {
      const description = buildEventDescription(mockTicketEvent as any, 'ITEM_ROUTED')
      expect(description).toContain('Kitchen')
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Statistics Calculation Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('Statistics Calculation', () => {
  describe('createEmptyStatistics', () => {
    it('should create statistics with all zeros', () => {
      const stats = createEmptyStatistics()
      
      expect(stats.ordersActive).toBe(0)
      expect(stats.ordersCompleted).toBe(0)
      expect(stats.ordersCanceled).toBe(0)
      expect(stats.tablesOccupied).toBe(0)
      expect(stats.kitchenQueue).toBe(0)
      expect(stats.paymentsCompleted).toBe(0)
    })
    
    it('should accept custom replay time', () => {
      const customTime = '2026-07-14T12:00:00Z'
      const stats = createEmptyStatistics(customTime)
      
      expect(stats.replayTime).toBe(customTime)
    })
  })
  
  describe('calculateStatistics', () => {
    it('should count active orders after ORDER_CREATED', () => {
      const events = mockReplayEvents.slice(0, 1)
      const stats = calculateStatistics(events, 0)
      
      expect(stats.ordersActive).toBe(1)
      expect(stats.ordersCompleted).toBe(0)
    })
    
    it('should track kitchen queue after ITEM_ROUTED', () => {
      const events = mockReplayEvents.slice(0, 2)
      const stats = calculateStatistics(events, 1)
      
      expect(stats.kitchenQueue).toBe(1)
    })
    
    it('should track items preparing', () => {
      const events = mockReplayEvents.slice(0, 3)
      const stats = calculateStatistics(events, 2)
      
      expect(stats.itemsPreparing).toBe(1)
      expect(stats.kitchenQueue).toBe(0)
    })
    
    it('should track items ready', () => {
      const events = mockReplayEvents.slice(0, 4)
      const stats = calculateStatistics(events, 3)
      
      expect(stats.itemsReady).toBe(1)
      expect(stats.itemsPreparing).toBe(0)
    })
    
    it('should count completed orders', () => {
      const stats = calculateStatistics(mockReplayEvents, 5)
      
      expect(stats.ordersCompleted).toBe(1)
      expect(stats.ordersActive).toBe(0)
    })
    
    it('should count completed payments', () => {
      const stats = calculateStatistics(mockReplayEvents, 4)
      
      expect(stats.paymentsCompleted).toBe(1)
    })
  })
  
  describe('StatisticsTracker', () => {
    it('should track statistics incrementally', () => {
      const tracker = new StatisticsTracker()
      
      // Apply first event
      let stats = tracker.applyEvent(mockReplayEvents[0])
      expect(stats.ordersActive).toBe(1)
      
      // Apply second event
      stats = tracker.applyEvent(mockReplayEvents[1])
      expect(stats.kitchenQueue).toBe(1)
    })
    
    it('should reset correctly', () => {
      const tracker = new StatisticsTracker()
      
      tracker.applyEvent(mockReplayEvents[0])
      tracker.reset()
      
      const stats = tracker.getStatistics()
      expect(stats.ordersActive).toBe(0)
    })
    
    it('should initialize from batch of events', () => {
      const tracker = new StatisticsTracker()
      const stats = tracker.initializeFromEvents(mockReplayEvents.slice(0, 3))
      
      expect(stats.ordersActive).toBe(1)
      expect(stats.itemsPreparing).toBe(1)
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Time Utilities Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('Time Utilities', () => {
  describe('getTimeRangeForPreset', () => {
    it('should return valid time range for today_lunch', () => {
      const range = getTimeRangeForPreset('today_lunch', 'Africa/Kigali')
      
      expect(range.start).toBeDefined()
      expect(range.end).toBeDefined()
      expect(new Date(range.start).getTime()).toBeLessThan(new Date(range.end).getTime())
    })
    
    it('should return valid time range for yesterday', () => {
      const range = getTimeRangeForPreset('yesterday', 'Africa/Kigali')
      
      const start = new Date(range.start)
      const end = new Date(range.end)
      const now = new Date()
      
      expect(start.getTime()).toBeLessThan(now.getTime())
      expect(end.getTime()).toBeLessThan(now.getTime())
    })
  })
  
  describe('formatReplayTime', () => {
    it('should format time correctly', () => {
      const result = formatReplayTime('2026-07-14T12:30:00Z', 'Africa/Kigali')
      
      expect(result).toMatch(/\d{2}:\d{2}/)
    })
    
    it('should include seconds when requested', () => {
      const result = formatReplayTime('2026-07-14T12:30:45Z', 'Africa/Kigali', { includeSeconds: true })
      
      expect(result).toMatch(/\d{2}:\d{2}:\d{2}/)
    })
    
    it('should include date when requested', () => {
      const result = formatReplayTime('2026-07-14T12:30:00Z', 'Africa/Kigali', { includeDate: true })
      
      expect(result).toContain('Jul')
      expect(result).toContain('14')
    })
  })
  
  describe('formatDuration', () => {
    it('should format seconds correctly', () => {
      const result = formatDuration(
        '2026-07-14T12:00:00Z',
        '2026-07-14T12:00:30Z'
      )
      
      expect(result).toBe('30s')
    })
    
    it('should format minutes correctly', () => {
      const result = formatDuration(
        '2026-07-14T12:00:00Z',
        '2026-07-14T12:05:30Z'
      )
      
      expect(result).toBe('5m 30s')
    })
    
    it('should format hours correctly', () => {
      const result = formatDuration(
        '2026-07-14T12:00:00Z',
        '2026-07-14T14:30:00Z'
      )
      
      expect(result).toBe('2h 30m')
    })
  })
  
  describe('calculateProgress', () => {
    it('should return 0 at start', () => {
      const progress = calculateProgress(
        '2026-07-14T12:00:00Z',
        '2026-07-14T12:00:00Z',
        '2026-07-14T13:00:00Z'
      )
      
      expect(progress).toBe(0)
    })
    
    it('should return 100 at end', () => {
      const progress = calculateProgress(
        '2026-07-14T13:00:00Z',
        '2026-07-14T12:00:00Z',
        '2026-07-14T13:00:00Z'
      )
      
      expect(progress).toBe(100)
    })
    
    it('should return 50 at midpoint', () => {
      const progress = calculateProgress(
        '2026-07-14T12:30:00Z',
        '2026-07-14T12:00:00Z',
        '2026-07-14T13:00:00Z'
      )
      
      expect(progress).toBe(50)
    })
  })
  
  describe('calculateTimeAtProgress', () => {
    it('should return start time at 0%', () => {
      const time = calculateTimeAtProgress(
        0,
        '2026-07-14T12:00:00Z',
        '2026-07-14T13:00:00Z'
      )
      
      expect(new Date(time).getTime()).toBe(new Date('2026-07-14T12:00:00Z').getTime())
    })
    
    it('should return end time at 100%', () => {
      const time = calculateTimeAtProgress(
        100,
        '2026-07-14T12:00:00Z',
        '2026-07-14T13:00:00Z'
      )
      
      expect(new Date(time).getTime()).toBe(new Date('2026-07-14T13:00:00Z').getTime())
    })
    
    it('should return midpoint at 50%', () => {
      const time = calculateTimeAtProgress(
        50,
        '2026-07-14T12:00:00Z',
        '2026-07-14T13:00:00Z'
      )
      
      expect(new Date(time).getTime()).toBe(new Date('2026-07-14T12:30:00Z').getTime())
    })
  })
  
  describe('findEventIndexAtTime', () => {
    it('should find closest event', () => {
      const events = [
        { timestamp: '2026-07-14T12:00:00Z' },
        { timestamp: '2026-07-14T12:10:00Z' },
        { timestamp: '2026-07-14T12:20:00Z' },
      ]
      
      const index = findEventIndexAtTime(events, '2026-07-14T12:08:00Z')
      
      expect(index).toBe(1) // Closest to 12:10
    })
    
    it('should return -1 for empty array', () => {
      const index = findEventIndexAtTime([], '2026-07-14T12:00:00Z')
      
      expect(index).toBe(-1)
    })
  })
  
  describe('calculateNextEventDelay', () => {
    it('should calculate delay at 1x speed', () => {
      const delay = calculateNextEventDelay(
        '2026-07-14T12:00:00Z',
        '2026-07-14T12:00:05Z',
        1
      )
      
      expect(delay).toBe(5000) // 5 seconds
    })
    
    it('should halve delay at 2x speed', () => {
      const delay = calculateNextEventDelay(
        '2026-07-14T12:00:00Z',
        '2026-07-14T12:00:10Z',
        2
      )
      
      expect(delay).toBe(5000) // 10 seconds / 2
    })
    
    it('should clamp minimum delay', () => {
      const delay = calculateNextEventDelay(
        '2026-07-14T12:00:00.000Z',
        '2026-07-14T12:00:00.010Z',
        8
      )
      
      expect(delay).toBeGreaterThanOrEqual(50)
    })
    
    it('should clamp maximum delay', () => {
      const delay = calculateNextEventDelay(
        '2026-07-14T12:00:00Z',
        '2026-07-14T13:00:00Z',
        1
      )
      
      expect(delay).toBeLessThanOrEqual(5000)
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Type Helpers Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('Type Helpers', () => {
  describe('getEventCategory', () => {
    it('should return correct category for order events', () => {
      expect(getEventCategory('ORDER_CREATED')).toBe('order')
      expect(getEventCategory('ORDER_UPDATED')).toBe('order')
    })
    
    it('should return correct category for kitchen events', () => {
      expect(getEventCategory('ITEM_ROUTED')).toBe('kitchen')
      expect(getEventCategory('ITEM_PREPARING')).toBe('kitchen')
    })
    
    it('should return correct category for completed events', () => {
      expect(getEventCategory('ORDER_COMPLETED')).toBe('completed')
      expect(getEventCategory('ITEM_READY')).toBe('completed')
    })
    
    it('should return correct category for failure events', () => {
      expect(getEventCategory('ORDER_CANCELED')).toBe('failure')
      expect(getEventCategory('PAYMENT_FAILED')).toBe('failure')
    })
  })
  
  describe('getEventLabel', () => {
    it('should return human-readable labels', () => {
      expect(getEventLabel('ORDER_CREATED')).toBe('Order Created')
      expect(getEventLabel('ITEM_PREPARING')).toBe('Item Preparing')
      expect(getEventLabel('PAYMENT_COMPLETED')).toBe('Payment Completed')
    })
  })
  
  describe('getEventColors', () => {
    it('should return color classes for each category', () => {
      const orderColors = getEventColors('order')
      expect(orderColors.bg).toContain('blue')
      expect(orderColors.text).toContain('blue')
      
      const kitchenColors = getEventColors('kitchen')
      expect(kitchenColors.bg).toContain('orange')
      
      const completedColors = getEventColors('completed')
      expect(completedColors.bg).toContain('emerald')
    })
  })
  
  describe('EVENT_TYPE_METADATA', () => {
    it('should have metadata for all event types', () => {
      const eventTypes: ReplayEventType[] = [
        'ORDER_CREATED', 'ORDER_UPDATED', 'ORDER_COMPLETED', 'ORDER_CANCELED',
        'ITEM_ROUTED', 'ITEM_ACCEPTED', 'ITEM_PREPARING', 'ITEM_READY', 'ITEM_DELIVERED', 'ITEM_CANCELED',
        'PAYMENT_STARTED', 'PAYMENT_COMPLETED', 'PAYMENT_FAILED',
        'SLA_WARNING', 'SLA_BREACH',
      ]
      
      eventTypes.forEach(type => {
        expect(EVENT_TYPE_METADATA[type]).toBeDefined()
        expect(EVENT_TYPE_METADATA[type].label).toBeDefined()
        expect(EVENT_TYPE_METADATA[type].category).toBeDefined()
      })
    })
  })
  
  describe('EVENT_CATEGORY_COLORS', () => {
    it('should have colors for all categories', () => {
      const categories = ['order', 'kitchen', 'waiter', 'payment', 'reservation', 'table', 'inventory', 'system', 'failure', 'completed']
      
      categories.forEach(category => {
        const colors = EVENT_CATEGORY_COLORS[category as keyof typeof EVENT_CATEGORY_COLORS]
        expect(colors).toBeDefined()
        expect(colors.bg).toBeDefined()
        expect(colors.text).toBeDefined()
        expect(colors.border).toBeDefined()
      })
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Edge Cases Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('Edge Cases', () => {
  describe('Empty data handling', () => {
    it('should handle empty events array', () => {
      const stats = calculateStatistics([], -1)
      expect(stats.ordersActive).toBe(0)
    })
    
    it('should handle single event', () => {
      const stats = calculateStatistics([mockReplayEvents[0]], 0)
      expect(stats.ordersActive).toBe(1)
    })
  })
  
  describe('Canceled order handling', () => {
    it('should track canceled orders', () => {
      const events: ReplayEvent[] = [
        {
          id: 'event-1',
          timestamp: '2026-07-14T12:00:00Z',
          eventType: 'ORDER_CREATED',
          category: 'order',
          description: 'Order Created',
          orderId: 'sale-1',
        },
        {
          id: 'event-2',
          timestamp: '2026-07-14T12:05:00Z',
          eventType: 'ORDER_CANCELED',
          category: 'failure',
          description: 'Order Canceled',
          orderId: 'sale-1',
        },
      ]
      
      const stats = calculateStatistics(events, 1)
      expect(stats.ordersCanceled).toBe(1)
      expect(stats.ordersActive).toBe(0)
    })
  })
  
  describe('Multiple orders handling', () => {
    it('should track multiple concurrent orders', () => {
      const events: ReplayEvent[] = [
        {
          id: 'event-1',
          timestamp: '2026-07-14T12:00:00Z',
          eventType: 'ORDER_CREATED',
          category: 'order',
          description: 'Order 1 Created',
          orderId: 'sale-1',
        },
        {
          id: 'event-2',
          timestamp: '2026-07-14T12:01:00Z',
          eventType: 'ORDER_CREATED',
          category: 'order',
          description: 'Order 2 Created',
          orderId: 'sale-2',
        },
        {
          id: 'event-3',
          timestamp: '2026-07-14T12:10:00Z',
          eventType: 'ORDER_COMPLETED',
          category: 'completed',
          description: 'Order 1 Completed',
          orderId: 'sale-1',
        },
      ]
      
      // After 2 orders created
      let stats = calculateStatistics(events, 1)
      expect(stats.ordersActive).toBe(2)
      
      // After 1 order completed
      stats = calculateStatistics(events, 2)
      expect(stats.ordersActive).toBe(1)
      expect(stats.ordersCompleted).toBe(1)
    })
  })
  
  describe('Table occupancy tracking', () => {
    it('should track table occupancy from orders', () => {
      const events: ReplayEvent[] = [
        {
          id: 'event-1',
          timestamp: '2026-07-14T12:00:00Z',
          eventType: 'ORDER_CREATED',
          category: 'order',
          description: 'Order Created',
          orderId: 'sale-1',
          tableId: 'table-1',
          tableNumber: '5',
        },
      ]
      
      const stats = calculateStatistics(events, 0)
      expect(stats.tablesOccupied).toBe(1)
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Performance Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('Performance', () => {
  it('should handle large event arrays efficiently', () => {
    // Generate 1000 events
    const largeEventArray: ReplayEvent[] = Array.from({ length: 1000 }, (_, i) => ({
      id: `event-${i}`,
      timestamp: new Date(Date.now() + i * 1000).toISOString(),
      eventType: 'ORDER_UPDATED' as ReplayEventType,
      category: 'order' as const,
      description: `Event ${i}`,
      orderId: `sale-${i % 100}`,
    }))
    
    const startTime = performance.now()
    const stats = calculateStatistics(largeEventArray, 999)
    const endTime = performance.now()
    
    // Should complete in under 100ms
    expect(endTime - startTime).toBeLessThan(100)
    expect(stats).toBeDefined()
  })
  
  it('should efficiently find events at time', () => {
    const largeEventArray = Array.from({ length: 10000 }, (_, i) => ({
      timestamp: new Date(Date.now() + i * 1000).toISOString(),
    }))
    
    const startTime = performance.now()
    const index = findEventIndexAtTime(
      largeEventArray,
      new Date(Date.now() + 5000 * 1000).toISOString()
    )
    const endTime = performance.now()
    
    // Should complete in under 10ms
    expect(endTime - startTime).toBeLessThan(10)
    expect(index).toBeGreaterThanOrEqual(0)
  })
})
