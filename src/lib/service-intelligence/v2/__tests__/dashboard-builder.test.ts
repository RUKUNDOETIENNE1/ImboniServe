/**
 * Service Intelligence™ - Dashboard Builder Tests
 */

import { describe, it, expect } from 'vitest'
import { DashboardBuilder } from '../dashboard-builder'
import type { StructuredIntelligenceReport } from '@/lib/intelligence'

describe('DashboardBuilder', () => {
  const builder = new DashboardBuilder()

  it('should build complete dashboard from report', () => {
    const report = createMockReport()
    const dashboard = builder.build(report)

    expect(dashboard).toBeDefined()
    expect(dashboard.metadata).toBeDefined()
    expect(dashboard.executiveSummary).toBeDefined()
    expect(dashboard.overallScore).toBeDefined()
    expect(dashboard.keyMetrics).toBeDefined()
    expect(dashboard.highlights).toBeDefined()
    expect(dashboard.issues).toBeDefined()
    expect(dashboard.recommendations).toBeDefined()
    expect(dashboard.timeline).toBeDefined()
    expect(dashboard.patterns).toBeDefined()
    expect(dashboard.diagnostics).toBeDefined()
  })

  it('should build executive summary correctly', () => {
    const report = createMockReport()
    const dashboard = builder.build(report)

    expect(dashboard.executiveSummary.totalOrders).toBe(report.serviceSummary.totalOrders)
    expect(dashboard.executiveSummary.completionRate).toBe(report.serviceSummary.completionRate)
    expect(dashboard.executiveSummary.issueCount).toBe(report.serviceSummary.issueCount)
    expect(dashboard.executiveSummary.highlightCount).toBe(report.serviceSummary.highlightCount)
    expect(dashboard.executiveSummary.summary).toBeDefined()
  })

  it('should calculate grade correctly', () => {
    const report = createMockReport()
    const dashboard = builder.build(report)

    expect(dashboard.overallScore.grade).toBeDefined()
    expect(['A', 'B', 'C', 'D', 'F']).toContain(dashboard.overallScore.grade)
  })

  it('should build highlight cards with evidence', () => {
    const report = createMockReport()
    const dashboard = builder.build(report)

    expect(dashboard.highlights.length).toBeGreaterThan(0)
    
    const firstHighlight = dashboard.highlights[0]
    expect(firstHighlight.id).toBeDefined()
    expect(firstHighlight.title).toBeDefined()
    expect(firstHighlight.description).toBeDefined()
    expect(firstHighlight.confidence).toBeGreaterThan(0)
    expect(firstHighlight.evidenceCount).toBeGreaterThan(0)
  })

  it('should build issue cards with severity', () => {
    const report = createMockReport()
    const dashboard = builder.build(report)

    expect(dashboard.issues.length).toBeGreaterThan(0)
    
    const firstIssue = dashboard.issues[0]
    expect(firstIssue.severity).toBeDefined()
    expect(['low', 'medium', 'high', 'critical']).toContain(firstIssue.severity)
  })

  it('should include replay links', () => {
    const report = createMockReport()
    const dashboard = builder.build(report)

    const highlightWithReplay = dashboard.highlights.find(h => h.replayLink)
    expect(highlightWithReplay).toBeDefined()
  })

  it('should format durations correctly', () => {
    const report = createMockReport()
    const dashboard = builder.build(report)

    expect(dashboard.executiveSummary.avgServiceTime).toMatch(/\d+m/)
  })
})

function createMockReport(): StructuredIntelligenceReport {
  return {
    metadata: {
      id: 'report_test',
      version: '1.0.0',
      businessId: 'biz_test',
      generatedAt: new Date().toISOString(),
      timeRange: {
        start: '2026-07-14T12:00:00Z',
        end: '2026-07-14T15:00:00Z',
        label: 'Test Period',
        durationMinutes: 180,
      },
      timezone: 'Africa/Kigali',
      locale: 'en-RW',
      scope: {
        scoring: true,
        problems: true,
        highlights: true,
        rootCauses: true,
        recommendations: true,
        patterns: true,
        staff: true,
        kitchen: true,
        customerJourney: true,
        comparisons: false,
      },
      pipelineVersion: '1.0.0',
    },
    serviceSummary: {
      totalOrders: 25,
      completedOrders: 23,
      cancelledOrders: 2,
      totalEvents: 125,
      averageServiceTimeSeconds: 1800,
      completionRate: 92,
      issueCount: 2,
      highlightCount: 3,
    },
    overallScore: {
      overall: 85,
      trend: 'improving',
      previousScore: 80,
      changePercent: 6.25,
    },
    dimensionScores: [
      {
        id: 'prep_time',
        name: 'Preparation Time',
        score: 88,
        value: 680,
        benchmark: 720,
        unit: 'seconds',
        deviation: -40,
      },
    ],
    highlights: [
      {
        id: 'highlight_1',
        type: 'efficiency',
        title: 'Excellent kitchen efficiency',
        description: 'Kitchen maintained 92% efficiency during peak hours',
        value: 92,
        unit: 'percent',
        confidence: 0.95,
        evidence: [
          { type: 'event', id: 'evt_1', timestamp: '2026-07-14T12:30:00Z' },
        ],
        timestamp: '2026-07-14T12:30:00Z',
      },
    ],
    problems: [
      {
        id: 'problem_1',
        type: 'prep_delay',
        category: 'kitchen',
        title: 'Preparation delays detected',
        description: '3 orders experienced delays over 15 minutes',
        severity: 'medium',
        impact: {
          description: 'Customer wait time increased',
          affectedOrders: 3,
          estimatedRevenueLoss: 0,
        },
        evidence: [
          { type: 'event', id: 'evt_2', timestamp: '2026-07-14T13:00:00Z' },
        ],
        rootCause: {
          description: 'Grill station overload',
          confidence: 0.85,
          contributingFactors: ['High order volume', 'Staff shortage'],
        },
        affectedCount: 3,
      },
    ],
    recommendations: [
      {
        id: 'rec_1',
        action: 'Add additional grill station staff during peak hours',
        category: 'staffing',
        priority: 'high',
        timeframe: 'immediate',
        effort: 'medium',
        expectedImpact: {
          description: 'Reduce prep delays by 50%',
          estimatedImprovement: 50,
        },
        evidence: [
          { type: 'aggregate', id: 'agg_1', description: 'Peak hour analysis' },
        ],
        replayLink: '/replay?t=2026-07-14T13:00:00Z',
      },
    ],
    timeline: [
      {
        id: 'moment_1',
        timestamp: '2026-07-14T12:30:00Z',
        category: 'peak',
        title: 'Peak rush started',
        description: '8 orders received in 10 minutes',
        confidence: 0.9,
      },
    ],
    patterns: [
      {
        id: 'pattern_1',
        type: 'rush_period',
        category: 'temporal',
        title: 'Lunch rush pattern',
        description: 'Consistent rush between 12:30-13:00',
        frequency: {
          type: 'daily',
          description: 'Daily occurrence',
        },
        occurrences: 5,
        confidence: 0.92,
        evidence: [],
        trend: 'stable',
      },
    ],
    evidence: {
      totalEvidence: 125,
      byType: {
        event: 100,
        order: 25,
        aggregate: 5,
      },
      byCategory: {
        order: 40,
        kitchen: 50,
        service: 20,
        payment: 15,
      },
    },
    replayLinks: {
      fullPeriod: '/replay?start=2026-07-14T12:00:00Z&end=2026-07-14T15:00:00Z',
      highlights: new Map([['highlight_1', '/replay?t=2026-07-14T12:30:00Z']]),
      problems: new Map([['problem_1', '/replay?t=2026-07-14T13:00:00Z']]),
      criticalMoments: new Map([['moment_1', '/replay?t=2026-07-14T12:30:00Z']]),
    },
    confidence: {
      overall: 0.88,
      dataQuality: 0.92,
      analysisDepth: 0.85,
      byDimension: {
        scoring: 0.9,
        problems: 0.85,
        highlights: 0.9,
        patterns: 0.8,
      },
    },
    statistics: {
      analysis: {
        problemsDetected: 2,
        highlightsIdentified: 3,
        patternsFound: 1,
        recommendationsGenerated: 1,
      },
      performance: {
        totalDurationMs: 500,
        stageTimings: {
          normalization: 50,
          analysis: 200,
          scoring: 50,
          explanation: 100,
          recommendation: 50,
          publishing: 50,
        },
      },
    },
  } as any
}
