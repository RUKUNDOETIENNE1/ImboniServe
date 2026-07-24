/**
 * Daily Briefings™ - Dashboard Builder
 * 
 * Transforms Daily Briefings into UI-friendly dashboard view models
 */

import type {
  DailyBriefing,
  DailyBriefingDashboard,
  BriefingHeaderDisplay,
  SnapshotDisplay,
  ComparisonDisplay,
  HighlightCard,
  AttentionCard,
  HistoricalCard,
  TrendCard,
  StaffSummaryDisplay,
  KitchenSummaryDisplay,
  MenuSummaryDisplay,
  MomentCard,
} from './types'

export class DashboardBuilder {
  /**
   * Build a UI-friendly dashboard from a Daily Briefing
   */
  build(briefing: DailyBriefing): DailyBriefingDashboard {
    return {
      briefing,
      
      headerDisplay: this.buildHeaderDisplay(briefing),
      snapshotDisplay: this.buildSnapshotDisplay(briefing),
      comparisonDisplay: briefing.comparison ? this.buildComparisonDisplay(briefing) : undefined,
      highlightsDisplay: this.buildHighlightCards(briefing),
      attentionDisplay: this.buildAttentionCards(briefing),
      historicalDisplay: this.buildHistoricalCards(briefing),
      trendsDisplay: this.buildTrendCards(briefing),
      staffDisplay: this.buildStaffDisplay(briefing),
      kitchenDisplay: this.buildKitchenDisplay(briefing),
      menuDisplay: this.buildMenuDisplay(briefing),
      momentsDisplay: this.buildMomentCards(briefing),
      
      metadata: {
        id: briefing.id,
        generatedAt: briefing.generatedAt,
        reportingPeriod: briefing.reportingPeriod.label,
        confidence: briefing.confidence,
      },
    }
  }

  private buildHeaderDisplay(briefing: DailyBriefing): BriefingHeaderDisplay {
    const hour = new Date().getHours()
    const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening'
    
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

    const header = briefing.header
    const overallStatus = header?.overallStatus ?? 'fair'

    return {
      greeting,
      date: header?.date ? new Date(header.date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }) : new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      businessName: header?.businessName ?? 'Restaurant',
      restaurantName: header?.restaurantName ?? 'Restaurant',
      generatedTime: header?.generatedTime ? new Date(header.generatedTime).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }) : new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      reportingPeriod: header?.reportingPeriod ?? briefing.reportingPeriod?.label ?? 'Today',
      overallStatus,
      statusMessage: header?.statusMessage ?? 'No data available',
      statusColor: statusColors[overallStatus],
      statusIcon: statusIcons[overallStatus],
    }
  }

  private buildSnapshotDisplay(briefing: DailyBriefing): SnapshotDisplay {
    const snapshot = briefing.snapshot

    return {
      orders: snapshot?.orders ? [
        { label: 'Total Orders', value: (snapshot.orders.total ?? 0).toString() },
        { label: 'Completed', value: (snapshot.orders.completed ?? 0).toString() },
        { label: 'Cancelled', value: (snapshot.orders.cancelled ?? 0).toString() },
        { label: 'Completion Rate', value: `${(snapshot.orders.completionRate ?? 0).toFixed(1)}%` },
      ] : [],
      revenue: snapshot?.revenue ? [
        { label: 'Total Revenue', value: `${snapshot.revenue.currency ?? 'RWF'} ${(snapshot.revenue.total ?? 0).toLocaleString()}` },
        { label: 'Avg Order Value', value: `${snapshot.revenue.currency ?? 'RWF'} ${(snapshot.revenue.averageOrderValue ?? 0).toFixed(2)}` },
      ] : undefined,
      timing: snapshot?.timing ? [
        { label: 'Avg Preparation', value: this.formatDuration(snapshot.timing.avgPreparationTime ?? 0) },
        { label: 'Avg Service', value: this.formatDuration(snapshot.timing.avgServiceTime ?? 0) },
        { label: 'Avg Payment', value: this.formatDuration(snapshot.timing.avgPaymentTime ?? 0) },
      ] : [],
      customerFlow: snapshot?.customerFlow ? [
        { label: 'Peak Hour', value: snapshot.customerFlow.peakHour ?? 'N/A' },
        { label: 'Total Customers', value: (snapshot.customerFlow.totalCustomers ?? 0).toString() },
        { label: 'Avg Wait Time', value: this.formatDuration(snapshot.customerFlow.avgWaitTime ?? 0) },
      ] : [],
      score: snapshot?.operationalScore ? {
        value: snapshot.operationalScore.overall ?? 0,
        grade: this.calculateGrade(snapshot.operationalScore.overall ?? 0),
        trend: snapshot.operationalScore.trend ?? 'stable',
        confidence: snapshot.operationalScore.confidence ?? 0,
      } : {
        value: 0,
        grade: 'F',
        trend: 'stable',
        confidence: 0,
      },
    }
  }

  private buildComparisonDisplay(briefing: DailyBriefing): ComparisonDisplay {
    if (!briefing.comparison) {
      return { metrics: [] }
    }

    const comparison = briefing.comparison

    return {
      metrics: [
        {
          label: 'Orders',
          current: comparison.orders.current.toString(),
          previous: comparison.orders.previous.toString(),
          change: `${comparison.orders.change > 0 ? '+' : ''}${comparison.orders.change.toFixed(1)}%`,
          changeDirection: comparison.orders.changeDirection,
          isImprovement: comparison.orders.isImprovement,
          icon: comparison.orders.isImprovement ? 'TrendingUp' : 'TrendingDown',
        },
        {
          label: 'Preparation Time',
          current: this.formatDuration(comparison.preparationTime.current),
          previous: this.formatDuration(comparison.preparationTime.previous),
          change: `${comparison.preparationTime.change > 0 ? '+' : ''}${comparison.preparationTime.change.toFixed(1)}%`,
          changeDirection: comparison.preparationTime.changeDirection,
          isImprovement: comparison.preparationTime.isImprovement,
          icon: comparison.preparationTime.isImprovement ? 'TrendingUp' : 'TrendingDown',
        },
        {
          label: 'Completion Rate',
          current: `${comparison.completionRate.current.toFixed(1)}%`,
          previous: `${comparison.completionRate.previous.toFixed(1)}%`,
          change: `${comparison.completionRate.change > 0 ? '+' : ''}${comparison.completionRate.change.toFixed(1)}%`,
          changeDirection: comparison.completionRate.changeDirection,
          isImprovement: comparison.completionRate.isImprovement,
          icon: comparison.completionRate.isImprovement ? 'TrendingUp' : 'TrendingDown',
        },
        {
          label: 'Operational Score',
          current: comparison.operationalScore.current.toString(),
          previous: comparison.operationalScore.previous.toString(),
          change: `${comparison.operationalScore.change > 0 ? '+' : ''}${comparison.operationalScore.change.toFixed(1)}%`,
          changeDirection: comparison.operationalScore.changeDirection,
          isImprovement: comparison.operationalScore.isImprovement,
          icon: comparison.operationalScore.isImprovement ? 'TrendingUp' : 'TrendingDown',
        },
      ],
    }
  }

  private buildHighlightCards(briefing: DailyBriefing): HighlightCard[] {
    return (briefing.highlights ?? []).map(highlight => ({
      id: highlight.id,
      title: highlight.title,
      description: highlight.description,
      category: highlight.category,
      value: highlight.value,
      improvement: `+${(highlight.improvement ?? 0).toFixed(1)}%`,
      confidence: highlight.confidence ?? 0,
      evidenceCount: highlight.evidenceCount ?? 0,
      replayLink: highlight.replayLink,
      icon: this.getCategoryIcon(highlight.category),
      color: 'text-green-600',
    }))
  }

  private buildAttentionCards(briefing: DailyBriefing): AttentionCard[] {
    return (briefing.attention ?? []).map(item => ({
      id: item.id,
      title: item.title,
      description: item.description,
      category: item.category,
      severity: item.severity,
      impact: item.impact,
      historicalComparison: item.historicalComparison,
      evidenceCount: item.evidenceCount ?? 0,
      replayLink: item.replayLink,
      icon: this.getCategoryIcon(item.category),
      color: this.getSeverityColor(item.severity),
    }))
  }

  private buildHistoricalCards(briefing: DailyBriefing): HistoricalCard[] {
    return (briefing.historicalChanges ?? []).map(change => ({
      id: change.id,
      title: change.title,
      description: change.description,
      hasHappenedBefore: change.hasHappenedBefore,
      frequency: this.formatFrequency(change.frequency),
      trend: change.trend,
      historicalConfidence: change.historicalConfidence,
      previousOccurrences: change.previousOccurrences,
      lastOccurrence: change.lastOccurrence,
      icon: change.hasHappenedBefore ? 'History' : 'Sparkles',
    }))
  }

  private buildTrendCards(briefing: DailyBriefing): TrendCard[] {
    return (briefing.performanceTrends ?? []).map(trend => ({
      metric: trend.metric,
      currentValue: `${trend.currentValue ?? 0} ${trend.unit ?? ''}`,
      trend: trend.trend,
      changePercent: trend.changePercent ?? 0,
      sparkline: trend.sparkline ?? [],
      historicalAverage: trend.historicalAverage ? `${trend.historicalAverage} ${trend.unit ?? ''}` : undefined,
      icon: this.getTrendIcon(trend.trend),
      color: this.getTrendColor(trend.trend),
    }))
  }

  private buildStaffDisplay(briefing: DailyBriefing): StaffSummaryDisplay {
    const staff = briefing.staffSummary

    if (!staff) {
      return {
        improvements: [],
        workload: { balanced: true, message: 'No data available', chart: [] },
        overload: [],
        trends: [],
        evidenceCount: 0,
      }
    }

    return {
      improvements: (staff.topImprovements ?? []).map(imp => ({
        name: imp.staffName,
        improvement: imp.improvement,
        confidence: imp.confidence ?? 0,
      })),
      workload: staff.workloadBalance ? {
        balanced: staff.workloadBalance.balanced ?? true,
        message: staff.workloadBalance.message ?? 'No data',
        chart: staff.workloadBalance.distribution ?? [],
      } : { balanced: true, message: 'No data available', chart: [] },
      overload: (staff.potentialOverload ?? []).map(ol => ({
        name: ol.staffName,
        orderCount: ol.orderCount ?? 0,
        overloadPercent: ol.overloadPercent ?? 0,
      })),
      trends: (staff.responseTrends ?? []).map(trend => ({
        name: trend.staffName,
        metric: trend.metric,
        trend: trend.trend,
        value: (trend.value ?? 0).toString(),
      })),
      evidenceCount: staff.evidenceCount ?? 0,
      replayLink: staff.replayLink,
    }
  }

  private buildKitchenDisplay(briefing: DailyBriefing): KitchenSummaryDisplay {
    const kitchen = briefing.kitchenSummary

    if (!kitchen) {
      return {
        stations: [],
        queues: [],
        preparation: [],
        recovery: { hasRecovered: false, message: 'No data available' },
        evidenceCount: 0,
      }
    }

    return {
      stations: (kitchen.stationPerformance ?? []).map(station => ({
        name: station.stationName,
        performance: station.performance,
        avgPrepTime: this.formatDuration(station.avgPrepTime ?? 0),
        trend: station.trend,
      })),
      queues: (kitchen.queueChanges ?? []).map(queue => ({
        name: queue.stationName,
        change: queue.change,
        changePercent: queue.changePercent ?? 0,
      })),
      preparation: (kitchen.preparationTrends ?? []).map(prep => ({
        category: prep.category,
        trend: prep.trend,
        changePercent: prep.changePercent ?? 0,
      })),
      recovery: kitchen.recovery ? {
        hasRecovered: kitchen.recovery.hasRecovered ?? false,
        message: kitchen.recovery.message ?? 'No data',
      } : { hasRecovered: false, message: 'No data available' },
      historicalComparison: kitchen.historicalComparison,
      evidenceCount: kitchen.evidenceCount ?? 0,
      replayLink: kitchen.replayLink,
    }
  }

  private buildMenuDisplay(briefing: DailyBriefing): MenuSummaryDisplay {
    const menu = briefing.menuSummary

    if (!menu) {
      return {
        popular: [],
        preparation: [],
        cancellations: [],
        modified: [],
      }
    }

    return {
      popular: (menu.popularDishes ?? []).map(dish => ({
        name: dish.dishName,
        orderCount: dish.orderCount ?? 0,
        trend: dish.trend,
      })),
      preparation: (menu.preparationChanges ?? []).map(change => ({
        name: change.dishName,
        change: change.change,
        changePercent: change.changePercent ?? 0,
      })),
      cancellations: (menu.cancellationTrends ?? []).map(trend => ({
        name: trend.dishName,
        rate: trend.cancellationRate ?? 0,
        trend: trend.trend,
      })),
      modified: (menu.frequentlyModified ?? []).map(dish => ({
        name: dish.dishName,
        modificationCount: dish.modificationCount ?? 0,
        rate: dish.modificationRate ?? 0,
      })),
      historicalComparison: menu.historicalComparison,
      replayLink: menu.replayLink,
    }
  }

  private buildMomentCards(briefing: DailyBriefing): MomentCard[] {
    return (briefing.replayMoments ?? []).map(moment => ({
      id: moment.id,
      title: moment.title,
      timestamp: moment.timestamp,
      timeDisplay: new Date(moment.timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      reason: moment.reason,
      category: moment.category,
      replayLink: moment.replayLink,
      evidenceCount: moment.evidenceCount,
      icon: this.getMomentIcon(moment.category),
      color: this.getMomentColor(moment.category),
    }))
  }

  // Helper methods
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

  private getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      preparation: 'ChefHat',
      completion: 'CheckCircle',
      waiting: 'Clock',
      payment: 'CreditCard',
      kitchen: 'Utensils',
      staff: 'Users',
      cancellation: 'XCircle',
      bottleneck: 'AlertTriangle',
      menu: 'BookOpen',
    }
    return icons[category] || 'Circle'
  }

  private getSeverityColor(severity: string): string {
    const colors: Record<string, string> = {
      low: 'text-blue-600',
      medium: 'text-yellow-600',
      high: 'text-orange-600',
      critical: 'text-red-600',
    }
    return colors[severity] || 'text-gray-600'
  }

  private getTrendIcon(trend: string): string {
    const icons: Record<string, string> = {
      improving: 'TrendingUp',
      stable: 'Minus',
      declining: 'TrendingDown',
    }
    return icons[trend] || 'Minus'
  }

  private getTrendColor(trend: string): string {
    const colors: Record<string, string> = {
      improving: 'text-green-600',
      stable: 'text-gray-600',
      declining: 'text-red-600',
    }
    return colors[trend] || 'text-gray-600'
  }

  private getMomentIcon(category: string): string {
    const icons: Record<string, string> = {
      rush: 'Zap',
      large_order: 'ShoppingCart',
      bottleneck: 'AlertTriangle',
      fast_service: 'Rocket',
      payment_peak: 'CreditCard',
      other: 'Star',
    }
    return icons[category] || 'Star'
  }

  private getMomentColor(category: string): string {
    const colors: Record<string, string> = {
      rush: 'text-orange-600',
      large_order: 'text-blue-600',
      bottleneck: 'text-red-600',
      fast_service: 'text-green-600',
      payment_peak: 'text-purple-600',
      other: 'text-gray-600',
    }
    return colors[category] || 'text-gray-600'
  }

  private formatFrequency(frequency: string): string {
    const labels: Record<string, string> = {
      first_time: 'First Time',
      rare: 'Rare',
      occasional: 'Occasional',
      frequent: 'Frequent',
      always: 'Always',
    }
    return labels[frequency] || frequency
  }
}

/**
 * Factory function to create a dashboard builder
 */
export function createDashboardBuilder(): DashboardBuilder {
  return new DashboardBuilder()
}
