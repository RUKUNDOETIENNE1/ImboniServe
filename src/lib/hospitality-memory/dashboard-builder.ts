/**
 * Hospitality Memory™ dashboard builder.
 */

import { BaseDashboardBuilder } from '@/lib/intelligence/base-dashboard-builder'
import type { HospitalityMemoryReport } from './types'

export interface HospitalityMemoryDashboard {
  report: HospitalityMemoryReport
  executiveSummary: {
    totalMemories: number
    newMemories: number
    confirmedMemories: number
    businessRules: number
    openConflicts: number
  }
  lifecycle: Array<{ status: string; count: number; percentage: string }>
  categories: Array<{ category: string; count: number; percentage: string }>
  criticalMemories: Array<{ title: string; impact: string; action: string }>
  relationshipGraphSummary: Array<{ type: string; count: number }>
  morningRecall: HospitalityMemoryReport['morningRecall']
  retrievalHints: HospitalityMemoryReport['retrievalHints']
  timelinePreview: Array<{ when: string; event: string; description: string }>
  metadata: {
    generatedAt: string
    period: string
    confidence: string
    eventsAnalyzed: number
    memoriesFormed: number
  }
}

export class HospitalityMemoryDashboardBuilder extends BaseDashboardBuilder<
  HospitalityMemoryReport,
  HospitalityMemoryDashboard
> {
  build(report: HospitalityMemoryReport): HospitalityMemoryDashboard {
    const lifecycle = Object.entries(report.memoriesByStatus).map(([status, count]) => ({
      status,
      count,
      percentage: this.formatPercentage(report.totalMemories ? (count / report.totalMemories) * 100 : 0),
    }))

    const categories = Object.entries(report.memoriesByCategory).map(([category, count]) => ({
      category,
      count,
      percentage: this.formatPercentage(report.totalMemories ? (count / report.totalMemories) * 100 : 0),
    }))

    const relationshipTypeCount = new Map<string, number>()
    for (const rel of report.relationships) {
      relationshipTypeCount.set(rel.type, (relationshipTypeCount.get(rel.type) || 0) + 1)
    }

    return {
      report,
      executiveSummary: {
        totalMemories: report.totalMemories,
        newMemories: report.newMemories,
        confirmedMemories: report.confirmedMemories,
        businessRules: report.businessRules,
        openConflicts: report.conflictsOpen,
      },
      lifecycle,
      categories,
      criticalMemories: report.memories
        .filter((memory) => memory.impactLevel === 'critical' || memory.status === 'conflict_review')
        .slice(0, 10)
        .map((memory) => ({
          title: memory.title,
          impact: memory.businessImpact,
          action: memory.recommendedAction,
        })),
      relationshipGraphSummary: Array.from(relationshipTypeCount.entries()).map(([type, count]) => ({ type, count })),
      morningRecall: report.morningRecall,
      retrievalHints: report.retrievalHints,
      timelinePreview: report.timeline.slice(0, 20).map((entry) => ({
        when: new Date(entry.timestamp).toLocaleString(),
        event: entry.event,
        description: entry.description,
      })),
      metadata: {
        generatedAt: report.generatedAt.toISOString(),
        period: report.reportingPeriod.label,
        confidence: this.formatPercentage(report.confidence * 100),
        eventsAnalyzed: report.eventsAnalyzed,
        memoriesFormed: report.memoriesFormed,
      },
    }
  }
}

export function createHospitalityMemoryDashboardBuilder(): HospitalityMemoryDashboardBuilder {
  return new HospitalityMemoryDashboardBuilder()
}
