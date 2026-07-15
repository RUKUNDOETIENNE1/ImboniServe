/**
 * Menu Intelligence™ - Dashboard Builder
 * Transforms Menu Intelligence Reports into UI-friendly dashboard view models
 */

import type { MenuIntelligenceReport, MenuDashboard } from './types'

export class MenuDashboardBuilder {
  build(report: MenuIntelligenceReport): MenuDashboard {
    return {
      report,
      overviewDisplay: {
        score: report.overview.overallScore,
        grade: this.calculateGrade(report.overview.overallScore),
        status: report.overview.status,
        statusColor: this.getStatusColor(report.overview.status),
        statusIcon: this.getStatusIcon(report.overview.status),
        metrics: [
          { label: 'Popular Items', value: report.overview.popularItems.length.toString() },
          { label: 'Slow Items', value: report.overview.slowItems.length.toString(), color: 'text-orange-600' },
          { label: 'Cancelled Items', value: report.overview.cancelledItems.length.toString(), color: 'text-red-600' },
          { label: 'Avg Prep Impact', value: this.formatDuration(report.overview.averagePreparationImpact) },
          { label: 'Trend', value: report.overview.operationalTrend, trend: report.overview.operationalTrend },
        ],
        popularItems: report.overview.popularItems,
        slowItems: report.overview.slowItems,
      },
      performanceDisplay: {
        overall: report.performanceScore.overall,
        dimensions: [
          { name: 'Popularity', score: report.performanceScore.dimensions.popularity, color: this.getScoreColor(report.performanceScore.dimensions.popularity) },
          { name: 'Efficiency', score: report.performanceScore.dimensions.efficiency, color: this.getScoreColor(report.performanceScore.dimensions.efficiency) },
          { name: 'Consistency', score: report.performanceScore.dimensions.consistency, color: this.getScoreColor(report.performanceScore.dimensions.consistency) },
          { name: 'Completion', score: report.performanceScore.dimensions.completion, color: this.getScoreColor(report.performanceScore.dimensions.completion) },
          { name: 'Operational', score: report.performanceScore.dimensions.operational, color: this.getScoreColor(report.performanceScore.dimensions.operational) },
        ],
        trend: report.performanceScore.trend,
        trendIcon: report.performanceScore.trend === 'improving' ? 'TrendingUp' : report.performanceScore.trend === 'declining' ? 'TrendingDown' : 'Minus',
        trendColor: report.performanceScore.trend === 'improving' ? 'text-green-600' : report.performanceScore.trend === 'declining' ? 'text-red-600' : 'text-gray-600',
        comparison: report.performanceScore.historicalComparison ? {
          previous: report.performanceScore.historicalComparison.previousScore,
          change: `${report.performanceScore.historicalComparison.change > 0 ? '+' : ''}${report.performanceScore.historicalComparison.change.toFixed(1)}%`,
          isImprovement: report.performanceScore.historicalComparison.changeDirection === 'up',
        } : undefined,
      },
      topPerformingDisplay: {
        mostOrdered: report.topPerforming.mostOrdered.map(d => ({
          dish: d.dishName,
          category: d.category,
          value: d.value.toString(),
          metric: d.metric,
          orders: d.orderCount,
          confidence: d.confidence,
          evidenceCount: d.evidenceCount,
          replayLink: d.replayLink,
        })),
        fastestPrep: report.topPerforming.fastestPreparation.map(d => ({
          dish: d.dishName,
          value: this.formatDuration(d.value),
          metric: 'preparation',
          orders: d.orderCount,
          confidence: d.confidence,
          evidenceCount: d.evidenceCount,
        })),
        highestCompletion: report.topPerforming.highestCompletion.map(d => ({
          dish: d.dishName,
          value: `${d.value}%`,
          metric: 'completion',
          orders: d.orderCount,
          confidence: d.confidence,
          evidenceCount: d.evidenceCount,
        })),
        mostEfficient: report.topPerforming.operationallyEfficient.map(d => ({
          dish: d.dishName,
          value: `${d.value}/100`,
          metric: 'efficiency',
          orders: d.orderCount,
          confidence: d.confidence,
          evidenceCount: d.evidenceCount,
        })),
      },
      lowestPerformingDisplay: {
        cancelled: report.lowestPerforming.frequentlyCancelled.map(d => ({
          dish: d.dishName,
          issue: d.issue,
          severity: d.severity,
          severityColor: this.getSeverityColor(d.severity),
          impact: d.impact,
          frequency: d.frequency,
          confidence: d.confidence,
          evidenceCount: d.evidenceCount,
          replayLink: d.replayLink,
        })),
        delays: report.lowestPerforming.preparationDelays.map(d => ({
          dish: d.dishName,
          issue: d.issue,
          severity: d.severity,
          severityColor: this.getSeverityColor(d.severity),
          impact: d.impact,
          frequency: d.frequency,
          confidence: d.confidence,
          evidenceCount: d.evidenceCount,
        })),
        modifications: report.lowestPerforming.highModification.map(d => ({
          dish: d.dishName,
          issue: d.issue,
          severity: d.severity,
          severityColor: this.getSeverityColor(d.severity),
          impact: d.impact,
          frequency: d.frequency,
          confidence: d.confidence,
          evidenceCount: d.evidenceCount,
        })),
      },
      preparationDisplay: {
        averageByDish: report.preparationImpact.averageByDish.map(d => ({
          dish: d.dishName,
          time: this.formatDuration(d.averageTime),
          consistency: d.maxTime - d.minTime < 60 ? 'High' : d.maxTime - d.minTime < 120 ? 'Medium' : 'Low',
        })),
        consistent: report.preparationImpact.consistency.consistent,
        inconsistent: report.preparationImpact.consistency.inconsistent,
      },
      popularityDisplay: {
        mostPopular: report.popularityTrends.mostPopular.map(d => ({
          dish: d.dishName,
          orders: d.orderCount,
          trend: d.trend === 'increasing' ? '↑' : d.trend === 'decreasing' ? '↓' : '→',
        })),
        growing: report.popularityTrends.fastestGrowing.map(d => ({
          dish: d.dishName,
          change: `+${d.changePercentage}%`,
        })),
        declining: report.popularityTrends.decliningPopularity.map(d => ({
          dish: d.dishName,
          change: `${d.changePercentage}%`,
        })),
      },
      cancellationDisplay: {
        topCancelled: report.cancellationAnalysis.cancelledDishes.map(d => ({
          dish: d.dishName,
          count: d.cancellationCount,
          rate: `${d.cancellationRate}%`,
        })),
        reasons: report.cancellationAnalysis.cancellationReasons.map(r => ({
          reason: r.reason,
          count: r.count,
        })),
      },
      modificationDisplay: {
        mostModified: report.modificationAnalysis.mostModified.map(d => ({
          dish: d.dishName,
          count: d.modificationCount,
          rate: `${d.modificationRate}%`,
        })),
        commonMods: report.modificationAnalysis.commonModifications.map(m => ({
          modification: m.modification,
          count: m.count,
        })),
      },
      consistencyDisplay: {
        scores: report.menuConsistency.preparationConsistency.map(d => ({
          dish: d.dishName,
          score: d.consistencyScore,
          variability: d.variability,
        })),
        trend: report.menuConsistency.historicalComparison ? {
          direction: report.menuConsistency.historicalComparison.trend,
          change: `${report.menuConsistency.historicalComparison.change > 0 ? '+' : ''}${report.menuConsistency.historicalComparison.change.toFixed(1)}%`,
        } : undefined,
      },
      crossSellingDisplay: {
        combinations: report.crossSellingOpportunities.frequentlyOrderedTogether.map(c => ({
          dishes: c.dishes,
          frequency: c.frequency,
        })),
        bundles: report.crossSellingOpportunities.commonMealBundles.map(b => ({
          name: b.bundleName,
          dishes: b.dishes,
          frequency: b.frequency,
        })),
      },
      highlightsDisplay: report.highlights.map(h => ({
        id: h.id,
        title: h.title,
        description: h.description,
        category: h.category,
        categoryIcon: this.getCategoryIcon(h.category),
        categoryColor: this.getCategoryColor(h.category),
        dishes: h.dishesInvolved,
        value: h.value,
        improvement: h.improvement ? `+${h.improvement}%` : undefined,
        confidence: h.confidence,
        evidenceCount: h.evidenceCount,
        replayLink: h.replayLink,
      })),
      issuesDisplay: report.issues.map(i => ({
        id: i.id,
        title: i.title,
        description: i.description,
        category: i.category,
        categoryIcon: this.getIssueCategoryIcon(i.category),
        severity: i.severity,
        severityColor: this.getSeverityColor(i.severity),
        impact: i.impact,
        dishes: i.dishesAffected,
        frequency: i.historicalRecurrence,
        confidence: i.confidence,
        evidenceCount: i.evidenceCount,
        replayLink: i.replayLink,
        recommendation: i.recommendation,
      })),
      trendsDisplay: {
        longTerm: report.historicalTrends.longTermPopularity.map(t => ({
          dish: t.dishName,
          trend: t.trend,
          confidence: t.confidence,
        })),
        recurring: {
          issues: report.historicalTrends.recurringIssues.map(i => ({
            description: i.description,
            dishes: i.dishesInvolved,
            frequency: i.frequency,
          })),
          successes: report.historicalTrends.recurringSuccesses.map(s => ({
            description: s.description,
            dishes: s.dishesInvolved,
            frequency: s.frequency,
          })),
        },
      },
      metadata: {
        id: report.id,
        generatedAt: report.generatedAt,
        reportingPeriod: report.reportingPeriod.label,
        confidence: report.confidence,
      },
    }
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

  private getStatusColor(status: string): string {
    const colors = {
      excellent: 'text-green-600',
      good: 'text-blue-600',
      fair: 'text-yellow-600',
      needs_attention: 'text-orange-600',
      critical: 'text-red-600',
    }
    return colors[status as keyof typeof colors] || 'text-gray-600'
  }

  private getStatusIcon(status: string): string {
    const icons = {
      excellent: 'CheckCircle',
      good: 'ThumbsUp',
      fair: 'AlertCircle',
      needs_attention: 'AlertTriangle',
      critical: 'XCircle',
    }
    return icons[status as keyof typeof icons] || 'AlertCircle'
  }

  private getScoreColor(score: number): string {
    if (score >= 90) return 'text-green-600'
    if (score >= 80) return 'text-blue-600'
    if (score >= 70) return 'text-yellow-600'
    if (score >= 60) return 'text-orange-600'
    return 'text-red-600'
  }

  private getSeverityColor(severity: string): string {
    const colors = {
      low: 'text-blue-600',
      medium: 'text-yellow-600',
      high: 'text-orange-600',
      critical: 'text-red-600',
    }
    return colors[severity as keyof typeof colors] || 'text-gray-600'
  }

  private getCategoryIcon(category: string): string {
    const icons = {
      popularity: 'TrendingUp',
      efficiency: 'Zap',
      preparation: 'ChefHat',
      completion: 'CheckCircle',
      improvement: 'Star',
    }
    return icons[category as keyof typeof icons] || 'Star'
  }

  private getCategoryColor(category: string): string {
    const colors = {
      popularity: 'text-blue-600',
      efficiency: 'text-green-600',
      preparation: 'text-purple-600',
      completion: 'text-green-600',
      improvement: 'text-yellow-600',
    }
    return colors[category as keyof typeof colors] || 'text-gray-600'
  }

  private getIssueCategoryIcon(category: string): string {
    const icons = {
      preparation_bottleneck: 'Clock',
      frequent_cancellation: 'XCircle',
      high_modification: 'Edit',
      operational_friction: 'AlertTriangle',
    }
    return icons[category as keyof typeof icons] || 'AlertTriangle'
  }
}

export function createDashboardBuilder(): MenuDashboardBuilder {
  return new MenuDashboardBuilder()
}
