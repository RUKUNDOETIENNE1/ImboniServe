/**
 * Kitchen Intelligence™ - Export Service
 */

import type {
  KitchenIntelligenceReport,
  KitchenDashboard,
  KitchenExportOptions,
  KitchenExportResult,
} from './types'

export class KitchenExporter {
  async export(
    dashboard: KitchenDashboard,
    report: KitchenIntelligenceReport,
    options: KitchenExportOptions
  ): Promise<KitchenExportResult> {
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
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Export failed',
      }
    }
  }

  private exportJSON(
    dashboard: KitchenDashboard,
    report: KitchenIntelligenceReport,
    options: KitchenExportOptions
  ): KitchenExportResult {
    const data = { report, dashboard, exportedAt: new Date().toISOString(), options }
    return {
      success: true,
      data: JSON.stringify(data, null, 2),
      filename: `kitchen-intelligence-${options.reportId}.json`,
    }
  }

  private exportMarkdown(
    dashboard: KitchenDashboard,
    report: KitchenIntelligenceReport,
    options: KitchenExportOptions
  ): KitchenExportResult {
    const sections: string[] = []

    sections.push(`# Kitchen Intelligence™ Report`)
    sections.push(`\n**Generated:** ${new Date(report.generatedAt).toLocaleString()}`)
    sections.push(`**Period:** ${report.reportingPeriod.label}\n`)

    sections.push(`## Overview`)
    sections.push(`- **Score:** ${report.overview.operationalScore}/100`)
    sections.push(`- **Status:** ${report.overview.status}`)
    sections.push(`- **Orders Processed:** ${report.overview.ordersProcessed}`)
    sections.push(`- **Orders Delayed:** ${report.overview.ordersDelayed}\n`)

    sections.push(`## Station Health`)
    report.stationHealth.forEach(station => {
      sections.push(`### ${station.stationName}`)
      sections.push(`- **Status:** ${station.status}`)
      sections.push(`- **Avg Preparation:** ${station.averagePreparation}s`)
      sections.push(`- **Queue:** ${station.currentQueue}`)
      sections.push(`- **Utilization:** ${station.utilization}%\n`)
    })

    if (report.highlights.length > 0) {
      sections.push(`## Highlights`)
      report.highlights.forEach((h, i) => {
        sections.push(`${i + 1}. **${h.title}** - ${h.description}`)
      })
      sections.push('')
    }

    if (report.issues.length > 0) {
      sections.push(`## Issues`)
      report.issues.forEach((issue, i) => {
        sections.push(`${i + 1}. **[${issue.severity.toUpperCase()}] ${issue.title}** - ${issue.description}`)
      })
      sections.push('')
    }

    return {
      success: true,
      data: sections.join('\n'),
      filename: `kitchen-intelligence-${options.reportId}.md`,
    }
  }

  private exportCSV(
    dashboard: KitchenDashboard,
    report: KitchenIntelligenceReport,
    options: KitchenExportOptions
  ): KitchenExportResult {
    const rows: string[] = ['Section,Item,Value,Details']

    rows.push(`Overview,Score,${report.overview.operationalScore},`)
    rows.push(`Overview,Orders Processed,${report.overview.ordersProcessed},`)
    rows.push(`Overview,Orders Delayed,${report.overview.ordersDelayed},`)

    report.stationHealth.forEach(station => {
      rows.push(`Station,${station.stationName},${station.status},${station.averagePreparation}s avg prep`)
    })

    return {
      success: true,
      data: rows.join('\n'),
      filename: `kitchen-intelligence-${options.reportId}.csv`,
    }
  }

  private exportPDF(
    dashboard: KitchenDashboard,
    report: KitchenIntelligenceReport,
    options: KitchenExportOptions
  ): KitchenExportResult {
    return {
      success: false,
      error: 'PDF export not yet implemented. Please use Markdown format.',
    }
  }
}

export function createExporter(): KitchenExporter {
  return new KitchenExporter()
}
