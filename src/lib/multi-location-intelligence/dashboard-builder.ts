/**
 * Multi-location Intelligence™ - Dashboard Builder
 * Transforms Portfolio Intelligence Reports into UI-friendly dashboard view models
 */

import type { PortfolioIntelligenceReport, PortfolioDashboard } from './types'

export class PortfolioDashboardBuilder {
  build(report: PortfolioIntelligenceReport): PortfolioDashboard {
    return {
      report,
      overviewDisplay: {
        restaurantCount: report.overview.restaurantCount,
        score: report.overview.overallScore,
        grade: this.calculateGrade(report.overview.overallScore),
        status: report.overview.status,
        statusColor: this.getStatusColor(report.overview.status),
        statusIcon: this.getStatusIcon(report.overview.status),
        metrics: [
          { label: 'Operational', value: report.overview.averageOperationalScore.toString() },
          { label: 'Kitchen', value: report.overview.averageKitchenScore.toString() },
          { label: 'Menu', value: report.overview.averageMenuScore.toString() },
          { label: 'Service', value: report.overview.averageServiceScore.toString() },
          { label: 'Trend', value: report.overview.trend, trend: report.overview.trend },
        ],
      },
      performanceDisplay: {
        overall: report.performanceScore.overall,
        dimensions: [
          { name: 'Operational', score: report.performanceScore.dimensions.operational, color: this.getScoreColor(report.performanceScore.dimensions.operational) },
          { name: 'Kitchen', score: report.performanceScore.dimensions.kitchen, color: this.getScoreColor(report.performanceScore.dimensions.kitchen) },
          { name: 'Menu', score: report.performanceScore.dimensions.menu, color: this.getScoreColor(report.performanceScore.dimensions.menu) },
          { name: 'Service', score: report.performanceScore.dimensions.service, color: this.getScoreColor(report.performanceScore.dimensions.service) },
          { name: 'Consistency', score: report.performanceScore.dimensions.consistency, color: this.getScoreColor(report.performanceScore.dimensions.consistency) },
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
      rankingDisplay: {
        restaurants: report.restaurantRanking.restaurants.map(r => ({
          rank: r.rank,
          name: r.restaurantName,
          location: r.location,
          score: r.overallScore,
          trend: r.trend,
          trendIcon: r.trend === 'improving' ? 'TrendingUp' : r.trend === 'declining' ? 'TrendingDown' : 'Minus',
          metrics: [
            { label: 'Operational', value: r.operationalPerformance, color: this.getScoreColor(r.operationalPerformance) },
            { label: 'Kitchen', value: r.kitchenPerformance, color: this.getScoreColor(r.kitchenPerformance) },
            { label: 'Menu', value: r.menuPerformance, color: this.getScoreColor(r.menuPerformance) },
            { label: 'Service', value: r.servicePerformance, color: this.getScoreColor(r.servicePerformance) },
          ],
          replayLink: r.replayLink,
        })),
      },
      distributionDisplay: {
        topPerformers: report.performanceDistribution.topPerformers.map(r => r.restaurantName),
        middlePerformers: report.performanceDistribution.middlePerformers.map(r => r.restaurantName),
        needsAttention: report.performanceDistribution.needsAttention.map(r => r.restaurantName),
        spread: {
          min: report.performanceDistribution.performanceSpread.min,
          max: report.performanceDistribution.performanceSpread.max,
          average: report.performanceDistribution.performanceSpread.average,
        },
        trendCounts: report.performanceDistribution.trendDistribution,
      },
      comparisonDisplay: {
        comparisons: report.locationComparison.comparisons.map(c => ({
          restaurants: c.restaurants,
          metrics: [
            { name: 'Operational', values: c.metrics.operationalScore },
            { name: 'Preparation', values: c.metrics.preparation },
            { name: 'Completion', values: c.metrics.completion },
            { name: 'Kitchen', values: c.metrics.kitchen },
            { name: 'Menu', values: c.metrics.menu },
            { name: 'Customer Experience', values: c.metrics.customerExperience },
          ],
        })),
      },
      operationalTrendsDisplay: {
        trends: report.operationalTrends.portfolioWideTrends.map(t => ({
          description: t.description,
          direction: t.direction,
          restaurants: t.affectedRestaurants,
        })),
        improvements: report.operationalTrends.recurringImprovements.map(i => ({
          description: i.description,
          frequency: i.frequency,
        })),
        issues: report.operationalTrends.recurringIssues.map(i => ({
          description: i.description,
          frequency: i.frequency,
        })),
      },
      serviceDisplay: {
        restaurants: report.serviceComparison.averageServiceQuality.map((r, i) => ({
          name: r.restaurantName,
          quality: r.value,
          preparation: report.serviceComparison.preparation[i]?.value || 0,
          completion: report.serviceComparison.completion[i]?.value || 0,
          recovery: report.serviceComparison.recovery[i]?.value || 0,
        })),
      },
      kitchenDisplay: {
        restaurants: report.kitchenComparison.kitchenPerformance.map((r, i) => ({
          name: r.restaurantName,
          performance: r.value,
          preparation: report.kitchenComparison.preparation[i]?.value || 0,
          queue: report.kitchenComparison.queueBehavior[i]?.value || 0,
          recovery: report.kitchenComparison.recovery[i]?.value || 0,
        })),
      },
      menuDisplay: {
        restaurants: report.menuComparison.popularDishes.map((r, i) => ({
          name: r.restaurant,
          popularDishes: r.dishes,
          efficiency: report.menuComparison.operationalEfficiency[i]?.value || 0,
          consistency: report.menuComparison.menuConsistency[i]?.value || 0,
        })),
      },
      growthDisplay: {
        restaurants: report.growthTrends.historicalImprovement.map((r, i) => ({
          name: r.restaurant,
          improvement: r.improvement,
          trajectory: report.growthTrends.performanceTrajectory[i]?.trajectory || 'steady',
          growth: report.growthTrends.longTermGrowth[i]?.growthRate || 0,
        })),
      },
      highlightsDisplay: report.highlights.map(h => ({
        id: h.id,
        title: h.title,
        description: h.description,
        category: h.category,
        categoryIcon: this.getCategoryIcon(h.category),
        categoryColor: this.getCategoryColor(h.category),
        restaurants: h.restaurantsInvolved,
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
        restaurants: i.restaurantsAffected,
        frequency: i.historicalRecurrence,
        confidence: i.confidence,
        evidenceCount: i.evidenceCount,
        replayLink: i.replayLink,
        recommendation: i.recommendation,
      })),
      bestPracticesDisplay: report.bestPractices.map(p => ({
        id: p.id,
        title: p.title,
        description: p.description,
        category: p.category,
        categoryIcon: this.getBestPracticeIcon(p.category),
        categoryColor: this.getCategoryColor(p.category),
        restaurants: p.observedAt,
        performance: p.associatedWithPerformance,
        evidence: p.evidence,
        confidence: p.confidence,
        evidenceCount: p.evidenceCount,
        replayLink: p.replayLink,
      })),
      historicalDisplay: {
        improvements: report.historicalTrends.portfolioImprovement.map(i => ({
          metric: i.metric,
          change: i.change,
        })),
        comparisons: report.historicalTrends.historicalComparisons.map(c => ({
          period: c.period,
          score: c.score,
        })),
      },
      metadata: {
        id: report.id,
        generatedAt: report.generatedAt,
        reportingPeriod: report.reportingPeriod.label,
        restaurantCount: report.restaurantCount,
        confidence: report.confidence,
      },
    }
  }

  private calculateGrade(score: number): string {
    if (score >= 90) return 'A'
    if (score >= 80) return 'B'
    if (score >= 70) return 'C'
    if (score >= 60) return 'D'
    return 'F'
  }

  private getStatusColor(status: string): string {
    const colors = { excellent: 'text-green-600', good: 'text-blue-600', fair: 'text-yellow-600', needs_attention: 'text-orange-600', critical: 'text-red-600' }
    return colors[status as keyof typeof colors] || 'text-gray-600'
  }

  private getStatusIcon(status: string): string {
    const icons = { excellent: 'CheckCircle', good: 'ThumbsUp', fair: 'AlertCircle', needs_attention: 'AlertTriangle', critical: 'XCircle' }
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
    const colors = { low: 'text-blue-600', medium: 'text-yellow-600', high: 'text-orange-600', critical: 'text-red-600' }
    return colors[severity as keyof typeof colors] || 'text-gray-600'
  }

  private getCategoryIcon(category: string): string {
    const icons = { improvement: 'TrendingUp', recovery: 'RefreshCw', kitchen: 'ChefHat', service: 'Users', menu: 'Utensils', achievement: 'Award' }
    return icons[category as keyof typeof icons] || 'Star'
  }

  private getCategoryColor(category: string): string {
    const colors = { improvement: 'text-green-600', recovery: 'text-blue-600', kitchen: 'text-purple-600', service: 'text-indigo-600', menu: 'text-orange-600', achievement: 'text-yellow-600', operational: 'text-gray-600' }
    return colors[category as keyof typeof colors] || 'text-gray-600'
  }

  private getIssueCategoryIcon(category: string): string {
    const icons = { attention_required: 'AlertTriangle', recurring_issue: 'RepeatIcon', historical_concern: 'Clock', operational_decline: 'TrendingDown' }
    return icons[category as keyof typeof icons] || 'AlertTriangle'
  }

  private getBestPracticeIcon(category: string): string {
    const icons = { kitchen: 'ChefHat', service: 'Users', menu: 'Utensils', operational: 'Settings' }
    return icons[category as keyof typeof icons] || 'Award'
  }
}

export function createDashboardBuilder(): PortfolioDashboardBuilder {
  return new PortfolioDashboardBuilder()
}
