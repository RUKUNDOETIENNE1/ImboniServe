/**
 * Hospitality Knowledge™ dashboard builder.
 */

import { BaseDashboardBuilder } from '@/lib/intelligence/base-dashboard-builder'
import type { KnowledgeReport, KnowledgeDashboard } from './types'

export class HospitalityKnowledgeDashboardBuilder extends BaseDashboardBuilder<
  KnowledgeReport,
  KnowledgeDashboard
> {
  build(report: KnowledgeReport): KnowledgeDashboard {
    const categoryDistribution = Object.entries(report.knowledgeByCategory).map(([category, count]) => ({
      category,
      count,
      percentage: report.totalKnowledge > 0 ? `${((count / report.totalKnowledge) * 100).toFixed(1)}%` : '0%',
    })).sort((a, b) => b.count - a.count)

    const statusDistribution = Object.entries(report.knowledgeByStatus).map(([status, count]) => ({
      status,
      count,
      percentage: report.totalKnowledge > 0 ? `${((count / report.totalKnowledge) * 100).toFixed(1)}%` : '0%',
    })).sort((a, b) => b.count - a.count)

    const confidenceDistribution = Object.entries(report.knowledgeByConfidence).map(([level, count]) => ({
      level,
      count,
      percentage: report.totalKnowledge > 0 ? `${((count / report.totalKnowledge) * 100).toFixed(1)}%` : '0%',
    })).sort((a, b) => b.count - a.count)

    const canonicalKnowledge = report.knowledge
      .filter((k) => k.status === 'canonical')
      .slice(0, 10)
      .map((k) => ({
        title: k.title,
        statement: k.statement,
        confidence: k.confidence,
      }))

    const recentDiscoveries = report.knowledge
      .filter((k) => k.status === 'candidate' || k.status === 'provisional')
      .slice(0, 10)
      .map((k) => ({
        title: k.title,
        category: k.category,
        status: k.status,
        formedAt: k.createdAt,
      }))

    const activeConflicts = report.conflicts
      .filter((c) => c.status === 'open')
      .slice(0, 10)
      .map((c) => {
        const ka = report.knowledge.find((k) => k.id === c.knowledgeAId)
        const kb = report.knowledge.find((k) => k.id === c.knowledgeBId)
        return {
          knowledgeA: ka?.title || c.knowledgeAId,
          knowledgeB: kb?.title || c.knowledgeBId,
          type: c.conflictType,
          status: c.status,
        }
      })

    const graphSummary: Array<{ type: string; count: number }> = []
    for (const rel of report.relationships) {
      const existing = graphSummary.find((g) => g.type === rel.type)
      if (existing) existing.count++
      else graphSummary.push({ type: rel.type, count: 1 })
    }
    graphSummary.sort((a, b) => b.count - a.count)

    const consumerReadiness = [
      { consumer: 'Hospitality AI Copilot', availableKnowledge: report.consumerViews.hospitalityAICopilot.length },
      { consumer: 'Daily Briefings', availableKnowledge: report.consumerViews.dailyBriefings.length },
      { consumer: 'Service Intelligence', availableKnowledge: report.consumerViews.serviceIntelligence.length },
      { consumer: 'Kitchen Intelligence', availableKnowledge: report.consumerViews.kitchenIntelligence.length },
      { consumer: 'Menu Intelligence', availableKnowledge: report.consumerViews.menuIntelligence.length },
    ]

    return {
      report,
      executiveSummary: {
        totalKnowledge: report.totalKnowledge,
        establishedKnowledge: report.establishedKnowledge,
        canonicalKnowledge: report.canonicalKnowledge,
        candidateKnowledge: report.candidateKnowledge,
        disputedKnowledge: report.disputedKnowledge,
        openConflicts: report.openConflicts,
      },
      formationPipeline: report.pipelineStats,
      categoryDistribution,
      statusDistribution,
      confidenceDistribution,
      canonicalKnowledge,
      recentDiscoveries,
      activeConflicts,
      graphSummary,
      consumerReadiness,
      timelinePreview: report.timeline.slice(0, 10).map((t) => ({
        when: t.timestamp,
        event: t.event,
        description: t.description,
      })),
      metadata: {
        generatedAt: report.generatedAt.toISOString(),
        period: report.reportingPeriod.label,
        confidence: report.confidence.toFixed(2),
        memoriesAnalyzed: report.memoriesAnalyzed,
        knowledgeFormed: report.knowledgeFormed,
      },
    }
  }
}

export function createHospitalityKnowledgeDashboardBuilder(): HospitalityKnowledgeDashboardBuilder {
  return new HospitalityKnowledgeDashboardBuilder()
}
