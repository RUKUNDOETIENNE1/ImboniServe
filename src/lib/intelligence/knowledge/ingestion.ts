/**
 * Intelligence Knowledge Base (IKB) - Ingestion Pipeline
 * 
 * Accepts completed Structured Intelligence Reports and extracts reusable knowledge.
 */

import type {
  StructuredIntelligenceReport,
  StructuredExplanation,
  StructuredInsight,
  StructuredRecommendation,
} from '../pipeline/types'
import type {
  KnowledgeRecord,
  Observation,
  Trend,
  HistoricalPattern,
  ComparisonSnapshot,
  IngestionResult,
  IngestionError,
  IngestionWarning,
  IngestionDiagnostics,
  KnowledgeContent,
  PreservedEvidence,
  KnowledgeMetadata,
  ReportReference,
  KnowledgeContext,
} from './types'

export class KnowledgeIngestionPipeline {
  private currentVersion = '1.0.0'

  async ingest(report: StructuredIntelligenceReport): Promise<IngestionResult> {
    const startTime = Date.now()
    const errors: IngestionError[] = []
    const warnings: IngestionWarning[] = []
    const records: KnowledgeRecord[] = []

    try {
      // Step 1: Validate report
      const validationStart = Date.now()
      const validationResult = this.validateReport(report)
      const validationTime = Date.now() - validationStart

      if (!validationResult.valid) {
        errors.push({
          code: 'VALIDATION_FAILED',
          message: 'Report validation failed',
          context: { errors: validationResult.errors },
        })
        return this.createFailedResult(errors, warnings, startTime, report, validationTime)
      }

      warnings.push(...validationResult.warnings.map(w => ({
        code: 'VALIDATION_WARNING',
        message: w,
      })))

      // Step 2: Extract knowledge
      const extractionStart = Date.now()
      
      // Extract observations from problems
      if (report.problems) {
        for (const problem of report.problems) {
          const observation = this.extractProblemObservation(report, problem)
          records.push(observation)
        }
      }

      // Extract observations from highlights
      if (report.highlights) {
        for (const highlight of report.highlights) {
          const observation = this.extractHighlightObservation(report, highlight)
          records.push(observation)
        }
      }

      // Extract patterns
      if (report.patterns) {
        for (const pattern of report.patterns) {
          const historicalPattern = this.extractPattern(report, pattern)
          records.push(historicalPattern)
        }
      }

      // Extract trends from scoring
      if (report.overallScore && report.overallScore.trend !== 'stable') {
        const trend = this.extractScoreTrend(report)
        records.push(trend)
      }

      // Extract comparison snapshot
      if (report.comparisons) {
        const comparison = this.extractComparison(report)
        records.push(comparison)
      }

      // Extract insights
      if (report.staffInsights || report.kitchenInsights || report.customerJourney) {
        const insights = this.extractInsights(report)
        records.push(...insights)
      }

      const extractionTime = Date.now() - extractionStart

      // Step 3: Storage (handled by KnowledgeStore)
      const storageTime = 0 // Will be set by store

      const diagnostics: IngestionDiagnostics = {
        startTime,
        endTime: Date.now(),
        durationMs: Date.now() - startTime,
        reportId: report.metadata.id,
        reportVersion: report.metadata.version,
        validationTime,
        extractionTime,
        storageTime,
      }

      return {
        success: true,
        recordsCreated: records.length,
        recordsUpdated: 0,
        errors,
        warnings,
        diagnostics,
      }
    } catch (error) {
      errors.push({
        code: 'INGESTION_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
      })

      return this.createFailedResult(errors, warnings, startTime, report, 0)
    }
  }

  private validateReport(report: StructuredIntelligenceReport): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Required fields
    if (!report.metadata?.id) errors.push('Missing report ID')
    if (!report.metadata?.businessId) errors.push('Missing business ID')
    if (!report.metadata?.generatedAt) errors.push('Missing generation timestamp')
    if (!report.metadata?.timeRange) errors.push('Missing time range')

    // Data quality
    if (report.confidence?.overall < 0.3) {
      warnings.push('Low confidence report (< 0.3)')
    }

    // Evidence
    if (!report.evidence || report.evidence.totalEvidence === 0) {
      warnings.push('No evidence in report')
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    }
  }

  private extractProblemObservation(
    report: StructuredIntelligenceReport,
    problem: any
  ): Observation {
    return {
      id: `obs_${problem.id}`,
      version: this.currentVersion,
      businessId: report.metadata.businessId,
      timestamp: report.metadata.generatedAt,
      category: 'observation',
      type: problem.type,
      observationType: 'problem',
      
      sourceReport: this.createReportReference(report),
      context: this.createContext(report),
      
      content: {
        title: problem.title,
        description: problem.description,
        severity: problem.severity,
        impact: problem.impact?.description,
      },
      
      evidence: this.preserveEvidence(problem.evidence, report),
      confidence: problem.rootCause?.confidence ?? 0.7,
      metadata: this.createMetadata(report),
    }
  }

  private extractHighlightObservation(
    report: StructuredIntelligenceReport,
    highlight: any
  ): Observation {
    return {
      id: `obs_${highlight.id}`,
      version: this.currentVersion,
      businessId: report.metadata.businessId,
      timestamp: report.metadata.generatedAt,
      category: 'observation',
      type: highlight.type,
      observationType: 'highlight',
      
      sourceReport: this.createReportReference(report),
      context: this.createContext(report),
      
      content: {
        title: highlight.title,
        description: highlight.description,
        value: highlight.value,
        unit: highlight.unit,
      },
      
      evidence: this.preserveEvidence(highlight.evidence, report),
      confidence: highlight.confidence,
      metadata: this.createMetadata(report),
    }
  }

  private extractPattern(
    report: StructuredIntelligenceReport,
    pattern: any
  ): HistoricalPattern {
    return {
      id: `pattern_${pattern.id}`,
      version: this.currentVersion,
      businessId: report.metadata.businessId,
      timestamp: report.metadata.generatedAt,
      category: 'pattern',
      type: pattern.type,
      patternType: pattern.category,
      
      sourceReport: this.createReportReference(report),
      context: this.createContext(report),
      
      content: {
        title: pattern.title,
        description: pattern.description,
      },
      
      frequency: pattern.frequency,
      occurrences: pattern.occurrences?.map((occ: any) => ({
        timestamp: occ.timestamp,
        reportId: report.metadata.id,
        matchConfidence: pattern.confidence,
        evidence: occ.eventIds?.map((id: string) => ({ type: 'event' as const, id })) || [],
      })) || [],
      strength: pattern.confidence,
      predictability: pattern.trend === 'stable' ? 0.9 : 0.6,
      
      evidence: this.preserveEvidence(pattern.evidence, report),
      confidence: pattern.confidence,
      metadata: this.createMetadata(report),
    }
  }

  private extractScoreTrend(report: StructuredIntelligenceReport): Trend {
    return {
      id: `trend_score_${Date.now()}`,
      version: this.currentVersion,
      businessId: report.metadata.businessId,
      timestamp: report.metadata.generatedAt,
      category: 'trend',
      type: 'overall_score',
      direction: report.overallScore.trend,
      metric: 'overall_score',
      
      sourceReport: this.createReportReference(report),
      context: this.createContext(report),
      
      content: {
        title: `Overall Score Trend: ${report.overallScore.trend}`,
        description: `Score: ${report.overallScore.overall}/100`,
        value: report.overallScore.overall,
      },
      
      dataPoints: [{
        timestamp: report.metadata.generatedAt,
        value: report.overallScore.overall,
        confidence: report.confidence.overall,
        reportId: report.metadata.id,
      }],
      startValue: report.overallScore.overall,
      endValue: report.overallScore.overall,
      changePercent: 0,
      significance: 'medium',
      
      evidence: this.preserveEvidence([], report),
      confidence: report.confidence.overall,
      metadata: this.createMetadata(report),
    }
  }

  private extractComparison(report: StructuredIntelligenceReport): ComparisonSnapshot {
    const comparison = report.comparisons!
    
    return {
      id: `comp_${Date.now()}`,
      version: this.currentVersion,
      businessId: report.metadata.businessId,
      timestamp: report.metadata.generatedAt,
      category: 'comparison',
      type: 'period_comparison',
      
      sourceReport: this.createReportReference(report),
      context: this.createContext(report),
      
      content: {
        title: `Comparison: ${comparison.periodLabel}`,
        description: comparison.summary,
      },
      
      currentPeriod: report.metadata.timeRange,
      comparisonPeriod: comparison.comparedTimeRange,
      metrics: comparison.metrics.map(m => ({
        metric: m.name,
        current: m.current,
        previous: m.previous,
        change: m.change,
        changePercent: m.changePercent,
        trend: m.trend,
        significance: m.significance,
      })),
      improvements: comparison.improvements,
      regressions: comparison.regressions,
      summary: comparison.summary,
      
      evidence: this.preserveEvidence([], report),
      confidence: report.confidence.overall,
      metadata: this.createMetadata(report),
    }
  }

  private extractInsights(report: StructuredIntelligenceReport): KnowledgeRecord[] {
    const insights: KnowledgeRecord[] = []

    if (report.staffInsights) {
      insights.push({
        id: `insight_staff_${Date.now()}`,
        version: this.currentVersion,
        businessId: report.metadata.businessId,
        timestamp: report.metadata.generatedAt,
        category: 'insight',
        type: 'staff_performance',
        
        sourceReport: this.createReportReference(report),
        context: this.createContext(report),
        
        content: {
          title: 'Staff Performance',
          description: report.staffInsights.summary,
          value: report.staffInsights.totalStaff,
        },
        
        evidence: this.preserveEvidence([], report),
        confidence: 0.9,
        metadata: this.createMetadata(report),
      })
    }

    if (report.kitchenInsights) {
      insights.push({
        id: `insight_kitchen_${Date.now()}`,
        version: this.currentVersion,
        businessId: report.metadata.businessId,
        timestamp: report.metadata.generatedAt,
        category: 'insight',
        type: 'kitchen_performance',
        
        sourceReport: this.createReportReference(report),
        context: this.createContext(report),
        
        content: {
          title: 'Kitchen Performance',
          description: report.kitchenInsights.summary,
          value: report.kitchenInsights.overallUtilization,
          unit: 'percent',
        },
        
        evidence: this.preserveEvidence([], report),
        confidence: 0.9,
        metadata: this.createMetadata(report),
      })
    }

    return insights
  }

  private createReportReference(report: StructuredIntelligenceReport): ReportReference {
    return {
      reportId: report.metadata.id,
      reportVersion: report.metadata.version,
      generatedAt: report.metadata.generatedAt,
      timeRange: report.metadata.timeRange,
    }
  }

  private createContext(report: StructuredIntelligenceReport): KnowledgeContext {
    return {
      businessId: report.metadata.businessId,
      timeRange: report.metadata.timeRange,
      timezone: report.metadata.timezone,
      scope: Object.keys(report.metadata.scope).filter(k => (report.metadata.scope as any)[k] !== false),
    }
  }

  private preserveEvidence(evidenceRefs: any[], report: StructuredIntelligenceReport): PreservedEvidence {
    const replayLinks: string[] = []
    
    for (const ref of evidenceRefs) {
      if (ref.timestamp) {
        const link = report.replayLinks.fullPeriod
        if (link) replayLinks.push(link)
      }
    }

    return {
      evidenceRefs,
      replayLinks,
      eventCount: evidenceRefs.length,
    }
  }

  private createMetadata(report: StructuredIntelligenceReport): KnowledgeMetadata {
    return {
      createdAt: new Date().toISOString(),
      source: 'hie_pipeline',
      pipelineVersion: report.metadata.pipelineVersion,
      dataQuality: report.confidence.dataQuality,
      processingTime: report.statistics.performance.totalDurationMs,
    }
  }

  private createFailedResult(
    errors: IngestionError[],
    warnings: IngestionWarning[],
    startTime: number,
    report: StructuredIntelligenceReport,
    validationTime: number
  ): IngestionResult {
    return {
      success: false,
      recordsCreated: 0,
      recordsUpdated: 0,
      errors,
      warnings,
      diagnostics: {
        startTime,
        endTime: Date.now(),
        durationMs: Date.now() - startTime,
        reportId: report.metadata?.id || 'unknown',
        reportVersion: report.metadata?.version || 'unknown',
        validationTime,
        extractionTime: 0,
        storageTime: 0,
      },
    }
  }
}

interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}
