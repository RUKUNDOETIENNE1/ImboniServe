/**
 * Kitchen Intelligence™ - Dashboard Builder
 * 
 * Transforms Kitchen Intelligence Reports into UI-friendly dashboard view models
 */

import type {
  KitchenIntelligenceReport,
  KitchenDashboard,
  OverviewDisplay,
  PerformanceDisplay,
  StationDisplay,
  QueueDisplay,
  PreparationDisplay,
  BottleneckCard,
  RecoveryDisplay,
  WorkloadDisplay,
  RecipeDisplay,
  IngredientDisplay,
  TrendsDisplay,
  PeakLoadDisplay,
  HighlightCard,
  IssueCard,
} from './types'

export class KitchenDashboardBuilder {
  build(report: KitchenIntelligenceReport): KitchenDashboard {
    return {
      report,
      
      overviewDisplay: this.buildOverviewDisplay(report),
      performanceDisplay: this.buildPerformanceDisplay(report),
      stationsDisplay: this.buildStationsDisplay(report),
      queueDisplay: this.buildQueueDisplay(report),
      preparationDisplay: this.buildPreparationDisplay(report),
      bottlenecksDisplay: this.buildBottlenecksDisplay(report),
      recoveryDisplay: this.buildRecoveryDisplay(report),
      workloadDisplay: this.buildWorkloadDisplay(report),
      recipeDisplay: this.buildRecipeDisplay(report),
      ingredientDisplay: this.buildIngredientDisplay(report),
      trendsDisplay: this.buildTrendsDisplay(report),
      peakLoadDisplay: this.buildPeakLoadDisplay(report),
      highlightsDisplay: this.buildHighlightsDisplay(report),
      issuesDisplay: this.buildIssuesDisplay(report),
      
      metadata: {
        id: report.id,
        generatedAt: report.generatedAt,
        reportingPeriod: report.reportingPeriod.label,
        confidence: report.confidence,
      },
    }
  }

  private buildOverviewDisplay(report: KitchenIntelligenceReport): OverviewDisplay {
    const overview = report.overview
    
    const statusColors = {
      excellent: 'text-green-600',
      good: 'text-blue-600',
      fair: 'text-yellow-600',
      needs_attention: 'text-orange-600',
      critical: 'text-red-600',
    }

    const statusIcons = {
      excellent: 'CheckCircle',
      good: 'ThumbsUp',
      fair: 'AlertCircle',
      needs_attention: 'AlertTriangle',
      critical: 'XCircle',
    }

    return {
      score: overview.operationalScore,
      grade: this.calculateGrade(overview.operationalScore),
      status: overview.status,
      statusColor: statusColors[overview.status],
      statusIcon: statusIcons[overview.status],
      metrics: [
        { label: 'Avg Preparation', value: this.formatDuration(overview.preparationAverage) },
        { label: 'Avg Completion', value: this.formatDuration(overview.completionAverage) },
        { label: 'Orders Processed', value: overview.ordersProcessed.toString() },
        { label: 'Orders Delayed', value: overview.ordersDelayed.toString(), color: overview.ordersDelayed > 0 ? 'text-orange-600' : 'text-green-600' },
        { label: 'Recovery Score', value: `${overview.recoveryScore}/100` },
        { label: 'Trend', value: overview.trend, trend: overview.trend },
      ],
    }
  }

  private buildPerformanceDisplay(report: KitchenIntelligenceReport): PerformanceDisplay {
    const perf = report.performanceScore
    
    const trendIcons = {
      improving: 'TrendingUp',
      stable: 'Minus',
      declining: 'TrendingDown',
    }

    const trendColors = {
      improving: 'text-green-600',
      stable: 'text-gray-600',
      declining: 'text-red-600',
    }

    return {
      overall: perf.overall,
      dimensions: [
        { name: 'Speed', score: perf.dimensions.speed, color: this.getScoreColor(perf.dimensions.speed) },
        { name: 'Consistency', score: perf.dimensions.consistency, color: this.getScoreColor(perf.dimensions.consistency) },
        { name: 'Quality', score: perf.dimensions.quality, color: this.getScoreColor(perf.dimensions.quality) },
        { name: 'Recovery', score: perf.dimensions.recovery, color: this.getScoreColor(perf.dimensions.recovery) },
        { name: 'Efficiency', score: perf.dimensions.efficiency, color: this.getScoreColor(perf.dimensions.efficiency) },
      ],
      trend: perf.trend,
      trendIcon: trendIcons[perf.trend],
      trendColor: trendColors[perf.trend],
      comparison: perf.historicalComparison ? {
        previous: perf.historicalComparison.previousScore,
        change: `${perf.historicalComparison.change > 0 ? '+' : ''}${perf.historicalComparison.change.toFixed(1)}%`,
        isImprovement: perf.historicalComparison.changeDirection === 'up',
      } : undefined,
    }
  }

  private buildStationsDisplay(report: KitchenIntelligenceReport): StationDisplay[] {
    return report.stationHealth.map(station => {
      const statusColors = {
        excellent: 'text-green-600',
        good: 'text-blue-600',
        fair: 'text-yellow-600',
        struggling: 'text-orange-600',
        critical: 'text-red-600',
      }

      const statusIcons = {
        excellent: 'CheckCircle',
        good: 'ThumbsUp',
        fair: 'AlertCircle',
        struggling: 'AlertTriangle',
        critical: 'XCircle',
      }

      return {
        name: station.stationName,
        status: station.status,
        statusColor: statusColors[station.status],
        statusIcon: statusIcons[station.status],
        metrics: [
          { label: 'Avg Prep', value: this.formatDuration(station.averagePreparation) },
          { label: 'Queue', value: station.currentQueue.toString() },
          { label: 'Utilization', value: `${station.utilization}%` },
          { label: 'Recovery', value: station.recovery },
        ],
        issues: station.issues,
        highlights: station.highlights,
        evidenceCount: station.evidenceCount,
        replayLink: station.replayLink,
      }
    })
  }

  private buildQueueDisplay(report: KitchenIntelligenceReport): QueueDisplay {
    const queue = report.queueAnalysis

    return {
      averageQueue: queue.averageQueue,
      peakQueue: queue.peakQueue,
      longestQueue: {
        station: queue.longestQueue.stationName,
        length: queue.longestQueue.length,
        time: this.formatDuration(queue.longestQueue.duration),
      },
      growth: queue.queueGrowth.map(g => ({
        station: g.stationName,
        metric: g.metric,
        value: g.value.toString(),
      })),
      reduction: queue.queueReduction.map(r => ({
        station: r.stationName,
        metric: r.metric,
        value: r.value.toString(),
      })),
      trend: queue.historicalComparison ? {
        direction: queue.historicalComparison.trend,
        change: `${queue.historicalComparison.change > 0 ? '+' : ''}${queue.historicalComparison.change.toFixed(1)}%`,
      } : undefined,
    }
  }

  private buildPreparationDisplay(report: KitchenIntelligenceReport): PreparationDisplay {
    const prep = report.preparationAnalysis
    
    const total = prep.preparationDistribution.under30s + 
                  prep.preparationDistribution.under60s + 
                  prep.preparationDistribution.under120s + 
                  prep.preparationDistribution.over120s

    return {
      average: this.formatDuration(prep.averagePreparation),
      fastest: {
        recipe: prep.fastestPreparation.recipeName,
        time: this.formatDuration(prep.fastestPreparation.time),
        station: prep.fastestPreparation.stationName,
      },
      slowest: {
        recipe: prep.slowestPreparation.recipeName,
        time: this.formatDuration(prep.slowestPreparation.time),
        station: prep.slowestPreparation.stationName,
        reason: prep.slowestPreparation.reason,
      },
      trend: prep.preparationTrend,
      trendIcon: prep.preparationTrend === 'improving' ? 'TrendingUp' : prep.preparationTrend === 'declining' ? 'TrendingDown' : 'Minus',
      distribution: [
        { range: 'Under 30s', count: prep.preparationDistribution.under30s, percentage: (prep.preparationDistribution.under30s / total) * 100 },
        { range: 'Under 60s', count: prep.preparationDistribution.under60s, percentage: (prep.preparationDistribution.under60s / total) * 100 },
        { range: 'Under 2min', count: prep.preparationDistribution.under120s, percentage: (prep.preparationDistribution.under120s / total) * 100 },
        { range: 'Over 2min', count: prep.preparationDistribution.over120s, percentage: (prep.preparationDistribution.over120s / total) * 100 },
      ],
    }
  }

  private buildBottlenecksDisplay(report: KitchenIntelligenceReport): BottleneckCard[] {
    const severityColors = {
      low: 'text-blue-600',
      medium: 'text-yellow-600',
      high: 'text-orange-600',
      critical: 'text-red-600',
    }

    return report.bottlenecks.map(bottleneck => ({
      id: bottleneck.id,
      station: bottleneck.stationName,
      duration: this.formatDuration(bottleneck.duration),
      severity: bottleneck.severity,
      severityColor: severityColors[bottleneck.severity],
      impact: bottleneck.impact,
      frequency: bottleneck.historicalFrequency,
      confidence: bottleneck.confidence,
      evidenceCount: bottleneck.evidenceCount,
      replayLink: bottleneck.replayLink,
      timestamp: bottleneck.timestamp,
      affectedRecipes: bottleneck.affectedRecipes,
      rootCause: bottleneck.rootCause,
    }))
  }

  private buildRecoveryDisplay(report: KitchenIntelligenceReport): RecoveryDisplay {
    const recovery = report.recoveryAnalysis

    return {
      averageTime: this.formatDuration(recovery.averageRecoveryTime),
      score: recovery.recoveryScore,
      fastest: {
        event: recovery.fastestRecovery.event,
        time: this.formatDuration(recovery.fastestRecovery.time),
      },
      slowest: {
        event: recovery.slowestRecovery.event,
        time: this.formatDuration(recovery.slowestRecovery.time),
      },
      events: recovery.recoveryEvents.map(event => ({
        type: event.eventType,
        time: this.formatDuration(event.recoveryTime),
        stations: event.stationsInvolved,
        timestamp: event.timestamp,
      })),
    }
  }

  private buildWorkloadDisplay(report: KitchenIntelligenceReport): WorkloadDisplay {
    const workload = report.workload

    const statusColors = {
      idle: 'text-gray-400',
      balanced: 'text-green-600',
      busy: 'text-blue-600',
      overloaded: 'text-red-600',
    }

    return {
      balanced: workload.balanced,
      balanceMessage: workload.balanced ? 'Kitchen workload is well balanced' : 'Kitchen workload is unbalanced',
      stations: workload.stationWorkload.map(station => ({
        name: station.stationName,
        utilization: station.utilization,
        status: station.status,
        statusColor: statusColors[station.status],
        orders: station.ordersProcessed,
      })),
      overloaded: workload.overloadedStations,
      idle: workload.idleStations,
    }
  }

  private buildRecipeDisplay(report: KitchenIntelligenceReport): RecipeDisplay {
    const recipe = report.recipePerformance

    return {
      fastest: recipe.fastestRecipes.map(r => ({
        name: r.recipeName,
        time: this.formatDuration(r.averageTime),
        station: r.stationName,
        count: r.orderCount,
      })),
      slowest: recipe.slowestRecipes.map(r => ({
        name: r.recipeName,
        time: this.formatDuration(r.averageTime),
        station: r.stationName,
        count: r.orderCount,
      })),
      delaying: recipe.delayingRecipes.map(r => ({
        name: r.recipeName,
        time: this.formatDuration(r.averageTime),
        impact: `${r.orderCount} orders affected`,
      })),
      modified: recipe.frequentlyModified.map(m => ({
        name: m.recipeName,
        count: m.modificationCount,
        rate: `${m.modificationRate.toFixed(1)}%`,
      })),
    }
  }

  private buildIngredientDisplay(report: KitchenIntelligenceReport): IngredientDisplay {
    const ingredient = report.ingredientConsumption

    return {
      highest: ingredient.highestConsumption.map(i => ({
        name: i.ingredientName,
        quantity: `${i.quantity} ${i.unit}`,
        recipes: i.recipes,
      })),
      unexpected: ingredient.unexpectedConsumption.map(i => ({
        name: i.ingredientName,
        quantity: `${i.quantity} ${i.unit}`,
        reason: 'Unexpected consumption pattern',
      })),
      lowStock: ingredient.lowStockImpact.map(l => ({
        name: l.ingredient,
        impact: l.impact,
        recipes: l.affectedRecipes,
      })),
    }
  }

  private buildTrendsDisplay(report: KitchenIntelligenceReport): TrendsDisplay {
    const trends = report.historicalTrends

    return {
      improving: trends.improving.map(t => ({
        metric: t.metric,
        current: `${t.currentValue}`,
        change: `${t.change > 0 ? '+' : ''}${t.change.toFixed(1)}%`,
      })),
      declining: trends.declining.map(t => ({
        metric: t.metric,
        current: `${t.currentValue}`,
        change: `${t.change > 0 ? '+' : ''}${t.change.toFixed(1)}%`,
      })),
      recurring: {
        bottlenecks: trends.recurringBottlenecks.map(b => ({
          description: b.description,
          frequency: b.frequency,
          pattern: b.pattern,
        })),
        successes: trends.recurringSuccesses.map(s => ({
          description: s.description,
          frequency: s.frequency,
          pattern: s.pattern,
        })),
      },
    }
  }

  private buildPeakLoadDisplay(report: KitchenIntelligenceReport): PeakLoadDisplay {
    const peak = report.peakLoadAnalysis

    return {
      rushPeriods: peak.rushPeriods.map(r => ({
        time: new Date(r.startTime).toLocaleTimeString(),
        duration: this.formatDuration(r.duration),
        utilization: r.peakUtilization,
        orders: r.ordersProcessed,
      })),
      highPressure: peak.highPressureWindows.map(p => ({
        time: new Date(p.timestamp).toLocaleTimeString(),
        duration: this.formatDuration(p.duration),
        pressure: p.pressure,
        stations: p.stationsAffected,
      })),
      utilizationChart: peak.utilizationOverTime,
    }
  }

  private buildHighlightsDisplay(report: KitchenIntelligenceReport): HighlightCard[] {
    const categoryIcons = {
      recovery: 'Zap',
      preparation: 'ChefHat',
      efficiency: 'TrendingUp',
      performance: 'Award',
      improvement: 'Star',
    }

    const categoryColors = {
      recovery: 'text-green-600',
      preparation: 'text-blue-600',
      efficiency: 'text-purple-600',
      performance: 'text-orange-600',
      improvement: 'text-yellow-600',
    }

    return report.highlights.map(highlight => ({
      id: highlight.id,
      title: highlight.title,
      description: highlight.description,
      category: highlight.category,
      categoryIcon: categoryIcons[highlight.category],
      categoryColor: categoryColors[highlight.category],
      value: highlight.value,
      improvement: highlight.improvement ? `+${highlight.improvement}%` : undefined,
      stations: highlight.stationsInvolved,
      confidence: highlight.confidence,
      evidenceCount: highlight.evidenceCount,
      replayLink: highlight.replayLink,
      timestamp: highlight.timestamp,
    }))
  }

  private buildIssuesDisplay(report: KitchenIntelligenceReport): IssueCard[] {
    const categoryIcons = {
      preparation_delay: 'Clock',
      queue_congestion: 'AlertTriangle',
      station_overload: 'AlertCircle',
      recipe_delay: 'ChefHat',
      recovery_failure: 'XCircle',
    }

    const severityColors = {
      low: 'text-blue-600',
      medium: 'text-yellow-600',
      high: 'text-orange-600',
      critical: 'text-red-600',
    }

    return report.issues.map(issue => ({
      id: issue.id,
      title: issue.title,
      description: issue.description,
      category: issue.category,
      categoryIcon: categoryIcons[issue.category],
      severity: issue.severity,
      severityColor: severityColors[issue.severity],
      impact: issue.impact,
      frequency: issue.historicalFrequency,
      stations: issue.stationsAffected,
      recipes: issue.recipesAffected,
      confidence: issue.confidence,
      evidenceCount: issue.evidenceCount,
      replayLink: issue.replayLink,
      timestamp: issue.timestamp,
      recommendation: issue.recommendation,
    }))
  }

  private formatDuration(seconds: number): string {
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`
  }

  private calculateGrade(score: number): string {
    if (score >= 90) return 'A'
    if (score >= 80) return 'B'
    if (score >= 70) return 'C'
    if (score >= 60) return 'D'
    return 'F'
  }

  private getScoreColor(score: number): string {
    if (score >= 90) return 'text-green-600'
    if (score >= 80) return 'text-blue-600'
    if (score >= 70) return 'text-yellow-600'
    if (score >= 60) return 'text-orange-600'
    return 'text-red-600'
  }
}

export function createDashboardBuilder(): KitchenDashboardBuilder {
  return new KitchenDashboardBuilder()
}
