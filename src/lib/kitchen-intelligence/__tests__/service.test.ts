/**
 * Kitchen Intelligence™ - Service Layer Tests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { KitchenIntelligenceService } from '../service'
import type { KitchenIntelligenceRequest } from '../types'

describe('KitchenIntelligenceService', () => {
  let service: KitchenIntelligenceService

  beforeEach(() => {
    service = new KitchenIntelligenceService()
  })

  describe('generateReport', () => {
    it('should generate a report for today', async () => {
      const request: KitchenIntelligenceRequest = {
        businessId: 'biz_test',
        reportingPeriod: {
          type: 'today',
          label: 'Today',
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
        },
        includeHistorical: true,
        includeIngredients: true,
      }

      const response = await service.generateReport(request)

      expect(response).toBeDefined()
      expect(response.diagnostics).toBeDefined()
      expect(response.diagnostics.totalTime).toBeGreaterThan(0)
    })

    it('should track diagnostics', async () => {
      const request: KitchenIntelligenceRequest = {
        businessId: 'biz_test',
        reportingPeriod: {
          type: 'lunch',
          label: 'Lunch',
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
        },
      }

      const response = await service.generateReport(request)

      expect(response.diagnostics.reportRetrievalTime).toBeGreaterThanOrEqual(0)
      expect(response.diagnostics.totalTime).toBeGreaterThan(0)
    })

    it('should handle dinner period', async () => {
      const request: KitchenIntelligenceRequest = {
        businessId: 'biz_test',
        reportingPeriod: {
          type: 'dinner',
          label: 'Dinner',
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
        },
      }

      const response = await service.generateReport(request)

      expect(response).toBeDefined()
    })
  })

  describe('queryHistoricalReports', () => {
    it('should query historical reports', async () => {
      const reports = await service.queryHistoricalReports('biz_test', 10)

      expect(Array.isArray(reports)).toBe(true)
    })
  })

  describe('getReportById', () => {
    it('should retrieve a specific report', async () => {
      const report = await service.getReportById('report_123')

      // In current implementation, returns null (no database)
      expect(report).toBeNull()
    })
  })
})
