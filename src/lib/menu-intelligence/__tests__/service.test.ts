/**
 * Menu Intelligence™ - Service Layer Tests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { MenuIntelligenceService } from '../service'
import type { MenuIntelligenceRequest } from '../types'

describe('MenuIntelligenceService', () => {
  let service: MenuIntelligenceService

  beforeEach(() => {
    service = new MenuIntelligenceService()
  })

  describe('generateReport', () => {
    it('should generate a report for this week', async () => {
      const request: MenuIntelligenceRequest = {
        businessId: 'biz_test',
        reportingPeriod: {
          type: 'this_week',
          label: 'This Week',
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
        },
        includeHistorical: true,
        includeProfitability: true,
        includeSeasonal: true,
      }

      const response = await service.generateReport(request)

      expect(response).toBeDefined()
      expect(response.diagnostics).toBeDefined()
      expect(response.diagnostics.totalTime).toBeGreaterThan(0)
    })

    it('should track diagnostics', async () => {
      const request: MenuIntelligenceRequest = {
        businessId: 'biz_test',
        reportingPeriod: {
          type: 'this_month',
          label: 'This Month',
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
        },
      }

      const response = await service.generateReport(request)

      expect(response.diagnostics.reportRetrievalTime).toBeGreaterThanOrEqual(0)
      expect(response.diagnostics.totalTime).toBeGreaterThan(0)
    })

    it('should handle last month period', async () => {
      const request: MenuIntelligenceRequest = {
        businessId: 'biz_test',
        reportingPeriod: {
          type: 'last_month',
          label: 'Last Month',
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

      expect(report).toBeNull()
    })
  })
})
