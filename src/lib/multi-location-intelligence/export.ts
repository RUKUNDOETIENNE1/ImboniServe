/**
 * Multi-location Intelligence™ - Export Service
 */

import type { PortfolioIntelligenceReport, PortfolioDashboard, PortfolioExportOptions, PortfolioExportResult } from './types'

export class PortfolioExporter {
  async export(dashboard: PortfolioDashboard, report: PortfolioIntelligenceReport, options: PortfolioExportOptions): Promise<PortfolioExportResult> {
    try {
      switch (options.format) {
        case 'json':
          return this.exportJSON(dashboard, report, options)
        case 'markdown':
          return this.exportMarkdown(dashboard, report, options)
        case 'csv':
          return this.exportCSV(dashboard, report, options)
        case 'pdf':
          return this.exportPDF(dashboard, report, options)
        default:
          return { success: false, error: `Unsupported format: ${options.format}` }
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Export failed' }
    }
  }

  private exportJSON(dashboard: PortfolioDashboard, report: PortfolioIntelligenceReport, options: PortfolioExportOptions): PortfolioExportResult {
    const data = { report, dashboard, exportedAt: new Date().toISOString(), options }
    return {
      success: true,
      data: JSON.stringify(data, null, 2),
      filename: `portfolio-intelligence-${options.reportId}.json`,
    }
  }

  private exportMarkdown(dashboard: PortfolioDashboard, report: PortfolioIntelligenceReport, options: PortfolioExportOptions): PortfolioExportResult {
    const sections: string[] = []
    sections.push(`# Multi-location Intelligence™ Report\n`)
    sections.push(`**Generated:** ${new Date(report.generatedAt).toLocaleString()}`)
    sections.push(`**Period:** ${report.reportingPeriod.label}`)
    sections.push(`**Restaurants:** ${report.restaurantCount}\n`)
    sections.push(`## Portfolio Overview`)
    sections.push(`- **Overall Score:** ${report.overview.overallScore}/100`)
    sections.push(`- **Status:** ${report.overview.status}`)
    sections.push(`- **Trend:** ${report.overview.trend}\n`)
    sections.push(`## Restaurant Ranking`)
    report.restaurantRanking.restaurants.forEach((r, i) => {
      sections.push(`${i + 1}. **${r.restaurantName}** (${r.location}) - Score: ${r.overallScore}`)
    })
    sections.push('')
    if (report.highlights.length > 0) {
      sections.push(`## Highlights`)
      report.highlights.forEach((h, i) => sections.push(`${i + 1}. **${h.title}** - ${h.description}`))
      sections.push('')
    }
    if (report.issues.length > 0) {
      sections.push(`## Issues`)
      report.issues.forEach((issue, i) => sections.push(`${i + 1}. **[${issue.severity.toUpperCase()}] ${issue.title}** - ${issue.description}`))
      sections.push('')
    }
    return {
      success: true,
      data: sections.join('\n'),
      filename: `portfolio-intelligence-${options.reportId}.md`,
    }
  }

  private exportCSV(dashboard: PortfolioDashboard, report: PortfolioIntelligenceReport, options: PortfolioExportOptions): PortfolioExportResult {
    const rows: string[] = ['Restaurant,Location,Rank,Overall Score,Operational,Kitchen,Menu,Service,Trend']
    report.restaurantRanking.restaurants.forEach(r => {
      rows.push(`${r.restaurantName},${r.location},${r.rank},${r.overallScore},${r.operationalPerformance},${r.kitchenPerformance},${r.menuPerformance},${r.servicePerformance},${r.trend}`)
    })
    return {
      success: true,
      data: rows.join('\n'),
      filename: `portfolio-intelligence-${options.reportId}.csv`,
    }
  }

  private exportPDF(dashboard: PortfolioDashboard, report: PortfolioIntelligenceReport, options: PortfolioExportOptions): PortfolioExportResult {
    return { success: false, error: 'PDF export not yet implemented. Please use Markdown format.' }
  }
}

export function createExporter(): PortfolioExporter {
  return new PortfolioExporter()
}
