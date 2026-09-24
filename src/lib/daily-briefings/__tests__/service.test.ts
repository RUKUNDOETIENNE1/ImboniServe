/**
 * Daily Briefings™ - Service Layer Tests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { DailyBriefingService } from '../service'
import type { DailyBriefingRequest } from '../types'

describe('DailyBriefingService', () => {
  let service: DailyBriefingService

  beforeEach(() => {
    service = new DailyBriefingService()
  })

  describe('generateBriefing', () => {
    it('should generate a briefing for today', async () => {
      const request: DailyBriefingRequest = {
        businessId: 'biz_test',
        selection: {
          period: 'today',
          label: 'Today',
        },
        includeComparison: true,
        includeHistorical: true,
      }

      const response = await service.generateBriefing(request)

      expect(response).toBeDefined()
      expect(response.diagnostics).toBeDefined()
      expect(response.diagnostics.totalTime).toBeGreaterThan(0)
    })

    it('should track diagnostics', async () => {
      const request: DailyBriefingRequest = {
        businessId: 'biz_test',
        selection: {
          period: 'yesterday',
          label: 'Yesterday',
        },
      }

      const response = await service.generateBriefing(request)

      expect(response.diagnostics.reportRetrievalTime).toBeGreaterThanOrEqual(0)
      expect(response.diagnostics.totalTime).toBeGreaterThan(0)
    })

    it('should handle last 7 days period', async () => {
      const request: DailyBriefingRequest = {
        businessId: 'biz_test',
        selection: {
          period: 'last_7_days',
          label: 'Last 7 Days',
        },
      }

      const response = await service.generateBriefing(request)

      expect(response).toBeDefined()
    })
  })

  describe('queryHistoricalBriefings', () => {
    it('should query historical briefings', async () => {
      const briefings = await service.queryHistoricalBriefings('biz_test', 10)

      expect(Array.isArray(briefings)).toBe(true)
    })
  })

  describe('getBriefingById', () => {
    it('should retrieve a specific briefing', async () => {
      const briefing = await service.getBriefingById('briefing_123')

      // In current implementation, returns null (no database)
      expect(briefing).toBeNull()
    })
  })
})
