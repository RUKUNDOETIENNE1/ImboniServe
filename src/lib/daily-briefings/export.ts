/**
 * Daily Briefings™ - Export Service
 * 
 * Handles exporting briefings in multiple formats
 */

import type {
  DailyBriefing,
  DailyBriefingDashboard,
  BriefingExportOptions,
  BriefingExportResult,
} from './types'

export class BriefingExporter {
  /**
   * Export a briefing in the specified format
   */
  async export(
    dashboard: DailyBriefingDashboard,
    briefing: DailyBriefing,
    options: BriefingExportOptions
  ): Promise<BriefingExportResult> {
    try {
      switch (options.format) {
        case 'json':
          return this.exportJSON(dashboard, briefing, options)
        case 'markdown':
          return this.exportMarkdown(dashboard, briefing, options)
        case 'csv':
          return this.exportCSV(dashboard, briefing, options)
        case 'pdf':
          return this.exportPDF(dashboard, briefing, options)
        default:
          return {
            success: false,
            error: `Unsupported format: ${options.format}`,
          }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Export failed',
      }
    }
  }

  private exportJSON(
    dashboard: DailyBriefingDashboard,
    briefing: DailyBriefing,
    options: BriefingExportOptions
  ): BriefingExportResult {
    const data = {
      briefing,
      dashboard,
      exportedAt: new Date().toISOString(),
      options,
    }

    return {
      success: true,
      data: JSON.stringify(data, null, 2),
      filename: `daily-briefing-${options.briefingId}.json`,
    }
  }

  private exportMarkdown(
    dashboard: DailyBriefingDashboard,
    briefing: DailyBriefing,
    options: BriefingExportOptions
  ): BriefingExportResult {
    const sections: string[] = []

    // Header
    sections.push(`# Daily Briefing - ${dashboard.headerDisplay.date}`)
    sections.push('')
    sections.push(`**${dashboard.headerDisplay.restaurantName}**`)
    sections.push(`Generated: ${dashboard.headerDisplay.generatedTime}`)
    sections.push(`Period: ${dashboard.headerDisplay.reportingPeriod}`)
    sections.push(`Status: ${dashboard.headerDisplay.statusMessage}`)
    sections.push('')

    // Snapshot
    if (!options.sections || options.sections.includes('snapshot')) {
      sections.push('## Today\'s Snapshot')
      sections.push('')
      dashboard.snapshotDisplay.orders.forEach(item => {
        sections.push(`- **${item.label}:** ${item.value}`)
      })
      sections.push('')
      sections.push(`**Operational Score:** ${dashboard.snapshotDisplay.score.value}/100 (${dashboard.snapshotDisplay.score.grade})`)
      sections.push('')
    }

    // Comparison
    if (dashboard.comparisonDisplay && (!options.sections || options.sections.includes('comparison'))) {
      sections.push('## Yesterday Compared')
      sections.push('')
      dashboard.comparisonDisplay.metrics.forEach(metric => {
        const arrow = metric.isImprovement ? '↑' : '↓'
        sections.push(`- **${metric.label}:** ${metric.current} (${arrow} ${metric.change} vs ${metric.previous})`)
      })
      sections.push('')
    }

    // Highlights
    if (!options.sections || options.sections.includes('highlights')) {
      sections.push('## Operational Highlights')
      sections.push('')
      if (dashboard.highlightsDisplay.length === 0) {
        sections.push('No highlights for this period.')
      } else {
        dashboard.highlightsDisplay.forEach((highlight, i) => {
          sections.push(`### ${i + 1}. ${highlight.title}`)
          sections.push(highlight.description)
          if (highlight.value) sections.push(`**Value:** ${highlight.value}`)
          sections.push(`**Improvement:** ${highlight.improvement}`)
          sections.push(`**Confidence:** ${(highlight.confidence * 100).toFixed(0)}%`)
          if (options.includeReplayLinks && highlight.replayLink) {
            sections.push(`**Replay:** ${highlight.replayLink}`)
          }
          sections.push('')
        })
      }
    }

    // Attention Items
    if (!options.sections || options.sections.includes('attention')) {
      sections.push('## Things That Need Attention')
      sections.push('')
      if (dashboard.attentionDisplay.length === 0) {
        sections.push('No issues detected.')
      } else {
        dashboard.attentionDisplay.forEach((item, i) => {
          sections.push(`### ${i + 1}. [${item.severity.toUpperCase()}] ${item.title}`)
          sections.push(item.description)
          sections.push(`**Impact:** ${item.impact}`)
          if (item.historicalComparison) {
            sections.push(`**Historical:** ${item.historicalComparison}`)
          }
          if (options.includeReplayLinks && item.replayLink) {
            sections.push(`**Replay:** ${item.replayLink}`)
          }
          sections.push('')
        })
      }
    }

    // Trends
    if (!options.sections || options.sections.includes('trends')) {
      sections.push('## Performance Trends')
      sections.push('')
      dashboard.trendsDisplay.forEach(trend => {
        const arrow = trend.trend === 'improving' ? '↑' : trend.trend === 'declining' ? '↓' : '→'
        sections.push(`- **${trend.metric}:** ${trend.currentValue} ${arrow} ${trend.changePercent > 0 ? '+' : ''}${trend.changePercent.toFixed(1)}%`)
      })
      sections.push('')
    }

    // Replay Moments
    if (!options.sections || options.sections.includes('moments')) {
      sections.push('## Today\'s Moments Worth Watching')
      sections.push('')
      if (dashboard.momentsDisplay.length === 0) {
        sections.push('No notable moments.')
      } else {
        dashboard.momentsDisplay.forEach(moment => {
          sections.push(`- **${moment.timeDisplay}** - ${moment.title}: ${moment.reason}`)
          if (options.includeReplayLinks) {
            sections.push(`  Replay: ${moment.replayLink}`)
          }
        })
      }
      sections.push('')
    }

    // Footer
    sections.push('---')
    sections.push(`*Generated: ${new Date().toISOString()}*`)

    return {
      success: true,
      data: sections.join('\n'),
      filename: `daily-briefing-${options.briefingId}.md`,
    }
  }

  private exportCSV(
    dashboard: DailyBriefingDashboard,
    briefing: DailyBriefing,
    options: BriefingExportOptions
  ): BriefingExportResult {
    const rows: string[] = []

    // Header
    rows.push('Section,Item,Value,Details')

    // Snapshot
    rows.push(`Snapshot,Total Orders,${briefing.snapshot.orders.total},`)
    rows.push(`Snapshot,Completed,${briefing.snapshot.orders.completed},`)
    rows.push(`Snapshot,Cancelled,${briefing.snapshot.orders.cancelled},`)
    rows.push(`Snapshot,Completion Rate,${briefing.snapshot.orders.completionRate}%,`)
    rows.push(`Snapshot,Operational Score,${briefing.snapshot.operationalScore.overall},${briefing.snapshot.operationalScore.trend}`)

    // Highlights
    briefing.highlights.forEach(highlight => {
      rows.push(`Highlight,"${highlight.title}","${highlight.value || ''}","${highlight.description}"`)
    })

    // Attention
    briefing.attention.forEach(item => {
      rows.push(`Attention,"${item.title}",${item.severity},"${item.description}"`)
    })

    // Trends
    briefing.performanceTrends.forEach(trend => {
      rows.push(`Trend,${trend.metric},${trend.currentValue} ${trend.unit},${trend.trend}`)
    })

    return {
      success: true,
      data: rows.join('\n'),
      filename: `daily-briefing-${options.briefingId}.csv`,
    }
  }

  private exportPDF(
    dashboard: DailyBriefingDashboard,
    briefing: DailyBriefing,
    options: BriefingExportOptions
  ): BriefingExportResult {
    // PDF export would require a library like pdfkit or puppeteer
    // For now, fall back to Markdown
    return {
      success: false,
      error: 'PDF export not yet implemented. Please use Markdown format.',
    }
  }
}

/**
 * Factory function to create an exporter
 */
export function createExporter(): BriefingExporter {
  return new BriefingExporter()
}
