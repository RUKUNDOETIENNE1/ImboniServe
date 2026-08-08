/**
 * Multi-location Intelligence™ - Service Layer Tests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { PortfolioIntelligenceService } from '../service'
import type { PortfolioIntelligenceRequest } from '../types'

describe('PortfolioIntelligenceService', () => {
  let service: PortfolioIntelligenceService

  beforeEach(() => {
    service = new PortfolioIntelligenceService()
  })

  describe('generateReport', () => {
    it('should generate a report for this month', async () => {
      const request: PortfolioIntelligenceRequest = {
        organizationId: 'org_test',
        reportingPeriod: {
          type: 'this_month',
          label: 'This Month',
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
        },
        includeHistorical: true,
        includeComparisons: true,
      }

      const response = await service.generateReport(request)

      expect(response).toBeDefined()
      expect(response.diagnostics).toBeDefined()
      expect(response.diagnostics.totalTime).toBeGreaterThan(0)
    })

    it('should track diagnostics', async () => {
      const request: PortfolioIntelligenceRequest = {
        organizationId: 'org_test',
        reportingPeriod: {
          type: 'quarter',
          label: 'Quarter',
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
        },
      }

      const response = await service.generateReport(request)

      expect(response.diagnostics.reportRetrievalTime).toBeGreaterThanOrEqual(0)
      expect(response.diagnostics.totalTime).toBeGreaterThan(0)
    })
  })

  describe('queryHistoricalReports', () => {
    it('should query historical reports', async () => {
      const reports = await service.queryHistoricalReports('org_test', 10)

      expect(Array.isArray(reports)).toBe(true)
    })
  })
})
