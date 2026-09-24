/**
 * Service Intelligence™ - Service Layer Tests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { ServiceIntelligenceService } from '../service'
import type { ReplayEvent } from '@/lib/service-replay/types'

describe('ServiceIntelligenceService', () => {
  let service: ServiceIntelligenceService
  let mockEvents: ReplayEvent[]

  beforeEach(() => {
    service = new ServiceIntelligenceService()
    mockEvents = createMockReplayEvents()
  })

  describe('generateIntelligence', () => {
    it('should generate intelligence from replay events', async () => {
      const request = {
        businessId: 'biz_test',
        selection: {
          period: 'today_lunch' as const,
          label: 'Today Lunch',
        },
        includeHistoricalContext: true,
        includeComparison: false,
      }

      const response = await service.generateIntelligence(request, mockEvents)

      expect(response.success).toBe(true)
      expect(response.report).toBeDefined()
      expect(response.diagnostics).toBeDefined()
      expect(response.diagnostics.eventCount).toBe(mockEvents.length)
    })

    it('should handle empty events', async () => {
      const request = {
        businessId: 'biz_test',
        selection: {
          period: 'today_lunch' as const,
          label: 'Today Lunch',
        },
      }

      const response = await service.generateIntelligence(request, [])

      expect(response.success).toBe(false)
      expect(response.error).toContain('No events')
    })

    it('should include historical context when requested', async () => {
      const request = {
        businessId: 'biz_test',
        selection: {
          period: 'today_lunch' as const,
          label: 'Today Lunch',
        },
        includeHistoricalContext: true,
      }

      const response = await service.generateIntelligence(request, mockEvents)

      expect(response.success).toBe(true)
      expect(response.historicalContext).toBeDefined()
    })

    it('should track diagnostics', async () => {
      const request = {
        businessId: 'biz_test',
        selection: {
          period: 'today_lunch' as const,
          label: 'Today Lunch',
        },
      }

      const response = await service.generateIntelligence(request, mockEvents)

      expect(response.diagnostics.transformTime).toBeGreaterThan(0)
      expect(response.diagnostics.intelligenceTime).toBeGreaterThan(0)
      expect(response.diagnostics.totalTime).toBeGreaterThan(0)
      expect(response.diagnostics.reportGenerated).toBe(true)
    })
  })

  describe('queryHistory', () => {
    it('should query historical knowledge', async () => {
      const result = await service.queryHistory('biz_test', {
        categories: ['observation'],
        limit: 10,
      })

      expect(result).toBeDefined()
      expect(result.records).toBeDefined()
    })
  })

  describe('getTimeline', () => {
    it('should retrieve knowledge timeline', async () => {
      const timeline = await service.getTimeline('biz_test', 50)

      expect(timeline).toBeDefined()
      expect(timeline.businessId).toBe('biz_test')
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Mock Data
// ─────────────────────────────────────────────────────────────────────────────

function createMockReplayEvents(): ReplayEvent[] {
  const baseTime = new Date('2026-07-14T12:00:00Z')

  return [
    {
      id: 'evt_1',
      timestamp: new Date(baseTime.getTime()).toISOString(),
      eventType: 'order_created',
      category: 'order',
      description: 'Order #101 created',
      orderId: 'ord_1',
      orderNumber: '101',
      waiterId: 'staff_1',
      waiterName: 'John Doe',
      metadata: {},
      details: {},
    },
    {
      id: 'evt_2',
      timestamp: new Date(baseTime.getTime() + 60000).toISOString(),
      eventType: 'prep_started',
      category: 'kitchen',
      description: 'Preparation started',
      orderId: 'ord_1',
      stationId: 'station_1',
      stationName: 'Grill',
      metadata: {},
      details: {},
    },
    {
      id: 'evt_3',
      timestamp: new Date(baseTime.getTime() + 720000).toISOString(),
      eventType: 'prep_completed',
      category: 'kitchen',
      description: 'Preparation completed',
      orderId: 'ord_1',
      stationId: 'station_1',
      duration: 660,
      metadata: {},
      details: {},
    },
    {
      id: 'evt_4',
      timestamp: new Date(baseTime.getTime() + 900000).toISOString(),
      eventType: 'item_served',
      category: 'service',
      description: 'Order served',
      orderId: 'ord_1',
      waiterId: 'staff_1',
      metadata: {},
      details: {},
    },
    {
      id: 'evt_5',
      timestamp: new Date(baseTime.getTime() + 1800000).toISOString(),
      eventType: 'payment_processed',
      category: 'payment',
      description: 'Payment completed',
      orderId: 'ord_1',
      duration: 120,
      metadata: {},
      details: {},
    },
  ]
}
