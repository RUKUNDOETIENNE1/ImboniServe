/**
 * Menu Intelligence™ - Export Service
 */

import type { MenuIntelligenceReport, MenuDashboard, MenuExportOptions, MenuExportResult } from './types'

export class MenuExporter {
  async export(dashboard: MenuDashboard, report: MenuIntelligenceReport, options: MenuExportOptions): Promise<MenuExportResult> {
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

  private exportJSON(dashboard: MenuDashboard, report: MenuIntelligenceReport, options: MenuExportOptions): MenuExportResult {
    const data = { report, dashboard, exportedAt: new Date().toISOString(), options }
    return {
      success: true,
      data: JSON.stringify(data, null, 2),
      filename: `menu-intelligence-${options.reportId}.json`,
    }
  }

  private exportMarkdown(dashboard: MenuDashboard, report: MenuIntelligenceReport, options: MenuExportOptions): MenuExportResult {
    const sections: string[] = []
    sections.push(`# Menu Intelligence™ Report\n`)
    sections.push(`**Generated:** ${new Date(report.generatedAt).toLocaleString()}`)
    sections.push(`**Period:** ${report.reportingPeriod.label}\n`)
    sections.push(`## Overview`)
    sections.push(`- **Score:** ${report.overview.overallScore}/100`)
    sections.push(`- **Status:** ${report.overview.status}`)
    sections.push(`- **Popular Items:** ${report.overview.popularItems.join(', ')}\n`)
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
      filename: `menu-intelligence-${options.reportId}.md`,
    }
  }

  private exportCSV(dashboard: MenuDashboard, report: MenuIntelligenceReport, options: MenuExportOptions): MenuExportResult {
    const rows: string[] = ['Section,Item,Value,Details']
    rows.push(`Overview,Score,${report.overview.overallScore},`)
    rows.push(`Overview,Popular Items,${report.overview.popularItems.length},${report.overview.popularItems.join('; ')}`)
    report.topPerforming.mostOrdered.forEach(d => rows.push(`Top Performing,${d.dishName},${d.value},${d.orderCount} orders`))
    return {
      success: true,
      data: rows.join('\n'),
      filename: `menu-intelligence-${options.reportId}.csv`,
    }
  }

  private exportPDF(dashboard: MenuDashboard, report: MenuIntelligenceReport, options: MenuExportOptions): MenuExportResult {
    return { success: false, error: 'PDF export not yet implemented. Please use Markdown format.' }
  }
}

export function createExporter(): MenuExporter {
  return new MenuExporter()
}
