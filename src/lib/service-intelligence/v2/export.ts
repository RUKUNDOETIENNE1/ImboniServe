/**
 * Service Intelligence™ V2 - Export
 * 
 * Export service intelligence reports in various formats.
 */

import type {
  ServiceIntelligenceDashboard,
  ExportRequest,
  ExportResult,
  ExportFormat,
  ExportSection,
} from './types'
import type { StructuredIntelligenceReport } from '@/lib/intelligence'

export class ServiceIntelligenceExporter {
  /**
   * Export dashboard in requested format.
   */
  async export(
    dashboard: ServiceIntelligenceDashboard,
    report: StructuredIntelligenceReport,
    request: ExportRequest
  ): Promise<ExportResult> {
    try {
      switch (request.format) {
        case 'json':
          return this.exportJSON(report, request)
        
        case 'markdown':
          return this.exportMarkdown(dashboard, request)
        
        case 'csv':
          return this.exportCSV(dashboard, request)
        
        case 'pdf':
          return this.exportPDF(dashboard, request)
        
        default:
          return {
            success: false,
            filename: '',
            error: `Unsupported format: ${request.format}`,
          }
      }
    } catch (error) {
      return {
        success: false,
        filename: '',
        error: error instanceof Error ? error.message : 'Export failed',
      }
    }
  }

  private exportJSON(
    report: StructuredIntelligenceReport,
    request: ExportRequest
  ): ExportResult {
    const data = JSON.stringify(report, null, 2)
    const filename = `service-intelligence-${report.metadata.id}.json`

    return {
      success: true,
      data,
      filename,
    }
  }

  private exportMarkdown(
    dashboard: ServiceIntelligenceDashboard,
    request: ExportRequest
  ): ExportResult {
    const sections = request.sections || this.getAllSections()
    const lines: string[] = []

    // Header
    lines.push(`# Service Intelligence Report`)
    lines.push(``)
    lines.push(`**Generated:** ${new Date(dashboard.metadata.generatedAt).toLocaleString()}`)
    lines.push(`**Period:** ${dashboard.metadata.timeRange.label}`)
    lines.push(`**Business ID:** ${dashboard.metadata.businessId}`)
    lines.push(``)

    // Executive Summary
    if (sections.includes('summary')) {
      lines.push(`## Executive Summary`)
      lines.push(``)
      lines.push(dashboard.executiveSummary.summary)
      lines.push(``)
      lines.push(`- **Total Orders:** ${dashboard.executiveSummary.totalOrders}`)
      lines.push(`- **Completion Rate:** ${dashboard.executiveSummary.completionRate.toFixed(1)}%`)
      lines.push(`- **Avg Service Time:** ${dashboard.executiveSummary.avgServiceTime}`)
      lines.push(`- **Issues:** ${dashboard.executiveSummary.issueCount}`)
      lines.push(`- **Highlights:** ${dashboard.executiveSummary.highlightCount}`)
      lines.push(``)
    }

    // Overall Score
    if (sections.includes('score')) {
      lines.push(`## Overall Score`)
      lines.push(``)
      lines.push(`**${dashboard.overallScore.overall}/100** (Grade ${dashboard.overallScore.grade})`)
      lines.push(``)
      lines.push(`Trend: ${dashboard.overallScore.trend}`)
      lines.push(`Confidence: ${(dashboard.overallScore.confidence * 100).toFixed(1)}%`)
      lines.push(``)
      lines.push(`### Dimension Scores`)
      lines.push(``)
      for (const dim of dashboard.overallScore.dimensions) {
        lines.push(`- **${dim.name}:** ${dim.value} ${dim.unit} (Score: ${dim.score}/100)`)
      }
      lines.push(``)
    }

    // Key Metrics
    if (sections.includes('metrics')) {
      lines.push(`## Key Metrics`)
      lines.push(``)
      lines.push(`### Orders`)
      lines.push(`- Total: ${dashboard.keyMetrics.orders.total}`)
      lines.push(`- Completed: ${dashboard.keyMetrics.orders.completed}`)
      lines.push(`- Cancelled: ${dashboard.keyMetrics.orders.cancelled}`)
      lines.push(``)
      lines.push(`### Timing`)
      lines.push(`- Avg Prep Time: ${dashboard.keyMetrics.timing.avgPrepTime}`)
      lines.push(`- Avg Service Time: ${dashboard.keyMetrics.timing.avgServiceTime}`)
      lines.push(`- Avg Payment Time: ${dashboard.keyMetrics.timing.avgPaymentTime}`)
      lines.push(``)
    }

    // Highlights
    if (sections.includes('highlights') && dashboard.highlights.length > 0) {
      lines.push(`## Highlights`)
      lines.push(``)
      for (const highlight of dashboard.highlights) {
        lines.push(`### ${highlight.title}`)
        lines.push(``)
        lines.push(highlight.description)
        if (highlight.value) {
          lines.push(``)
          lines.push(`**Value:** ${highlight.value}`)
        }
        lines.push(``)
        lines.push(`*Confidence: ${(highlight.confidence * 100).toFixed(1)}%*`)
        lines.push(``)
      }
    }

    // Issues
    if (sections.includes('issues') && dashboard.issues.length > 0) {
      lines.push(`## Operational Issues`)
      lines.push(``)
      for (const issue of dashboard.issues) {
        lines.push(`### ${issue.title} [${issue.severity.toUpperCase()}]`)
        lines.push(``)
        lines.push(issue.description)
        lines.push(``)
        lines.push(`**Impact:** ${issue.impact}`)
        if (issue.rootCause) {
          lines.push(``)
          lines.push(`**Root Cause:** ${issue.rootCause}`)
        }
        lines.push(``)
        lines.push(`*Confidence: ${(issue.confidence * 100).toFixed(1)}%*`)
        lines.push(``)
      }
    }

    // Recommendations
    if (sections.includes('recommendations') && dashboard.recommendations.length > 0) {
      lines.push(`## Recommendations`)
      lines.push(``)
      for (const rec of dashboard.recommendations) {
        lines.push(`### ${rec.action} [${rec.priority.toUpperCase()}]`)
        lines.push(``)
        lines.push(`**Category:** ${rec.category}`)
        lines.push(`**Expected Impact:** ${rec.expectedImpact}`)
        lines.push(`**Timeframe:** ${rec.timeframe}`)
        lines.push(`**Effort:** ${rec.effort}`)
        lines.push(``)
      }
    }

    // Patterns
    if (sections.includes('patterns') && dashboard.patterns.length > 0) {
      lines.push(`## Patterns`)
      lines.push(``)
      for (const pattern of dashboard.patterns) {
        lines.push(`### ${pattern.title}`)
        lines.push(``)
        lines.push(pattern.description)
        lines.push(``)
        lines.push(`- **Frequency:** ${pattern.frequency}`)
        lines.push(`- **Occurrences:** ${pattern.occurrences}`)
        lines.push(`- **Confidence:** ${(pattern.confidence * 100).toFixed(1)}%`)
        lines.push(``)
      }
    }

    const data = lines.join('\n')
    const filename = `service-intelligence-${dashboard.metadata.reportId}.md`

    return {
      success: true,
      data,
      filename,
    }
  }

  private exportCSV(
    dashboard: ServiceIntelligenceDashboard,
    request: ExportRequest
  ): ExportResult {
    const lines: string[] = []

    // Header
    lines.push('Section,Item,Value,Details')

    // Summary
    lines.push(`Summary,Total Orders,${dashboard.executiveSummary.totalOrders},`)
    lines.push(`Summary,Completion Rate,${dashboard.executiveSummary.completionRate},%`)
    lines.push(`Summary,Avg Service Time,${dashboard.executiveSummary.avgServiceTime},`)

    // Score
    lines.push(`Score,Overall,${dashboard.overallScore.overall},Grade ${dashboard.overallScore.grade}`)

    // Dimensions
    for (const dim of dashboard.overallScore.dimensions) {
      lines.push(`Dimension,${dim.name},${dim.value},${dim.unit}`)
    }

    // Highlights
    for (const highlight of dashboard.highlights) {
      lines.push(`Highlight,${highlight.title},${highlight.confidence},${highlight.description}`)
    }

    // Issues
    for (const issue of dashboard.issues) {
      lines.push(`Issue,${issue.title},${issue.severity},${issue.description}`)
    }

    // Recommendations
    for (const rec of dashboard.recommendations) {
      lines.push(`Recommendation,${rec.action},${rec.priority},${rec.expectedImpact}`)
    }

    const data = lines.join('\n')
    const filename = `service-intelligence-${dashboard.metadata.reportId}.csv`

    return {
      success: true,
      data,
      filename,
    }
  }

  private exportPDF(
    dashboard: ServiceIntelligenceDashboard,
    request: ExportRequest
  ): ExportResult {
    // PDF export would require a library like jsPDF or puppeteer
    // For now, return markdown as fallback
    return {
      success: false,
      filename: '',
      error: 'PDF export not yet implemented. Use Markdown instead.',
    }
  }

  private getAllSections(): ExportSection[] {
    return [
      'summary',
      'score',
      'metrics',
      'highlights',
      'issues',
      'recommendations',
      'timeline',
      'staff',
      'kitchen',
      'journey',
      'patterns',
      'comparisons',
    ]
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Factory
// ─────────────────────────────────────────────────────────────────────────────

export function createExporter(): ServiceIntelligenceExporter {
  return new ServiceIntelligenceExporter()
}
