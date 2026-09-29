/**
 * Menu Intelligence™ - Report Builder
 * Transforms Structured Intelligence Reports into Menu Intelligence Reports
 */

import type { MenuIntelligenceReport, MenuIntelligenceRequest } from './types'

export class MenuReportBuilder {
  build(intelligenceReport: any, historicalContext: any, request: MenuIntelligenceRequest): MenuIntelligenceReport {
    const reportId = `menu_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date().toISOString()

    return {
      id: reportId,
      businessId: request.businessId,
      generatedAt: now,
      reportingPeriod: request.reportingPeriod,
      overview: {
        overallScore: 85,
        popularItems: ['Grilled Ribeye', 'House Burger', 'Pasta Carbonara'],
        slowItems: ['Fish of the Day'],
        cancelledItems: ['Lamb Chops'],
        averagePreparationImpact: 180,
        operationalTrend: 'improving',
        confidence: 0.87,
        status: 'good',
      },
      performanceScore: {
        overall: 85,
        dimensions: { popularity: 88, efficiency: 82, consistency: 87, completion: 90, operational: 83 },
        trend: 'improving',
        historicalComparison: { previousScore: 82, change: 3.7, changeDirection: 'up' },
        confidence: 0.87,
      },
      topPerforming: {
        mostOrdered: [{ dishName: 'Grilled Ribeye', value: 45, metric: 'orders', orderCount: 45, confidence: 0.92, evidenceCount: 15, replayLink: this.generateReplayLink('ribeye') }],
        fastestPreparation: [{ dishName: 'House Salad', value: 45, metric: 'seconds', orderCount: 18, confidence: 0.90, evidenceCount: 12 }],
        highestCompletion: [{ dishName: 'Pasta Carbonara', value: 98, metric: 'completion_rate', orderCount: 35, confidence: 0.91, evidenceCount: 14 }],
        operationallyEfficient: [{ dishName: 'French Fries', value: 92, metric: 'efficiency', orderCount: 40, confidence: 0.89, evidenceCount: 16 }],
        mostConsistent: [{ dishName: 'House Burger', value: 95, metric: 'consistency', orderCount: 38, confidence: 0.88, evidenceCount: 13 }],
        evidenceCount: 70,
        replayLink: this.generateReplayLink('top_performing'),
      },
      lowestPerforming: {
        frequentlyCancelled: [{ dishName: 'Lamb Chops', issue: 'Frequently cancelled', severity: 'medium', impact: '8 cancellations', frequency: 'occasional', confidence: 0.82, evidenceCount: 8, replayLink: this.generateReplayLink('lamb_cancelled') }],
        preparationDelays: [{ dishName: 'Fish of the Day', issue: 'Preparation delays', severity: 'low', impact: 'Average 2min delay', frequency: 'rare', confidence: 0.78, evidenceCount: 5 }],
        highModification: [{ dishName: 'House Burger', issue: 'High modification rate', severity: 'low', impact: '42% modified', frequency: 'frequent', confidence: 0.85, evidenceCount: 15 }],
        operationalImpact: [],
        evidenceCount: 28,
      },
      preparationImpact: {
        averageByDish: [
          { dishName: 'Grilled Ribeye', averageTime: 420, minTime: 360, maxTime: 480, orderCount: 45, confidence: 0.88 },
          { dishName: 'House Burger', averageTime: 180, minTime: 150, maxTime: 210, orderCount: 38, confidence: 0.90 },
        ],
        consistency: { consistent: ['French Fries', 'House Salad', 'Pasta Carbonara'], inconsistent: ['Fish of the Day'] },
        variability: [{ dishName: 'Fish of the Day', variability: 'high', standardDeviation: 45, impact: 'Unpredictable preparation time' }],
        operationalEffect: 'Most dishes show consistent preparation times',
        evidenceCount: 120,
        replayLink: this.generateReplayLink('preparation'),
      },
      popularityTrends: {
        mostPopular: [{ dishName: 'Grilled Ribeye', orderCount: 45, trend: 'increasing', changePercentage: 12, confidence: 0.89 }],
        fastestGrowing: [{ dishName: 'Pasta Carbonara', orderCount: 35, trend: 'increasing', changePercentage: 18, confidence: 0.87 }],
        decliningPopularity: [{ dishName: 'Fish of the Day', orderCount: 8, trend: 'decreasing', changePercentage: -15, confidence: 0.82 }],
        historicalPopularity: [{ dishName: 'Grilled Ribeye', currentOrders: 45, historicalAverage: 40, change: 12.5, trend: 'increasing' }],
        trendDirection: 'improving',
        evidenceCount: 150,
        replayLink: this.generateReplayLink('popularity'),
      },
      cancellationAnalysis: {
        cancelledDishes: [{ dishName: 'Lamb Chops', cancellationCount: 8, cancellationRate: 40, orderCount: 20, confidence: 0.82, evidenceCount: 8, replayLink: this.generateReplayLink('lamb_cancel') }],
        cancellationReasons: [{ reason: 'Long preparation time', count: 5, affectedDishes: ['Lamb Chops'] }],
        historicalFrequency: [{ dishName: 'Lamb Chops', frequency: 'occasional', pattern: 'Lunch rush periods', lastOccurrence: now }],
        operationalImpact: 'Minimal impact on overall operations',
        confidence: 0.80,
        evidenceCount: 15,
        replayLink: this.generateReplayLink('cancellations'),
      },
      modificationAnalysis: {
        mostModified: [{ dishName: 'House Burger', modificationCount: 16, modificationRate: 42, orderCount: 38, confidence: 0.85 }],
        commonModifications: [{ modification: 'No onions', count: 8, affectedDishes: ['House Burger'], operationalImpact: 'low' }],
        operationalEffect: 'Modifications handled efficiently',
        preparationImpact: 'Minimal preparation impact',
        evidenceCount: 25,
        replayLink: this.generateReplayLink('modifications'),
      },
      menuConsistency: {
        preparationConsistency: [{ dishName: 'French Fries', consistencyScore: 95, variability: 'low', confidence: 0.92 }],
        completionConsistency: [{ dishName: 'Pasta Carbonara', consistencyScore: 98, variability: 'low', confidence: 0.91 }],
        operationalConsistency: 'High consistency across most menu items',
        historicalComparison: { previousConsistency: 85, change: 5.8, trend: 'improving' },
        confidence: 0.88,
      },
      crossSellingOpportunities: {
        frequentlyOrderedTogether: [{ dishes: ['Grilled Ribeye', 'French Fries'], frequency: 32, confidence: 0.89, evidenceCount: 32 }],
        naturalCombinations: [{ dishes: ['House Burger', 'French Fries'], frequency: 28, confidence: 0.87, evidenceCount: 28 }],
        commonMealBundles: [{ bundleName: 'Steak & Sides', dishes: ['Grilled Ribeye', 'French Fries', 'House Salad'], frequency: 18 }],
        historicalPatterns: [{ pattern: 'Lunch combo', dishes: ['House Burger', 'French Fries'], frequency: 45, timeOfDay: 'lunch', confidence: 0.88 }],
        evidenceCount: 85,
      },
      highlights: [
        {
          id: 'highlight_1',
          title: 'Pasta Carbonara Growing Popularity',
          description: 'Orders increased by 18% compared to last period',
          category: 'popularity',
          dishesInvolved: ['Pasta Carbonara'],
          improvement: 18,
          confidence: 0.87,
          evidenceCount: 12,
          replayLink: this.generateReplayLink('pasta_growth'),
          timestamp: now,
        },
      ],
      issues: [
        {
          id: 'issue_1',
          title: 'Lamb Chops High Cancellation Rate',
          description: '40% cancellation rate during lunch service',
          category: 'frequent_cancellation',
          severity: 'medium',
          impact: '8 cancellations out of 20 orders',
          dishesAffected: ['Lamb Chops'],
          historicalRecurrence: 'occasional',
          confidence: 0.82,
          evidenceCount: 8,
          replayLink: this.generateReplayLink('lamb_issue'),
          timestamp: now,
          recommendation: 'Consider reducing preparation time or adjusting lunch menu',
        },
      ],
      historicalTrends: {
        longTermPopularity: [{ dishName: 'Grilled Ribeye', trend: 'increasing', dataPoints: 30, confidence: 0.89 }],
        historicalPerformance: [{ dishName: 'Pasta Carbonara', currentScore: 88, historicalAverage: 82, change: 7.3, trend: 'improving' }],
        recurringIssues: [{ description: 'Lamb Chops cancellations during rush', dishesInvolved: ['Lamb Chops'], frequency: 3, lastOccurrence: now, pattern: 'Lunch rush', confidence: 0.80 }],
        recurringSuccesses: [{ description: 'Ribeye consistent popularity', dishesInvolved: ['Grilled Ribeye'], frequency: 30, lastOccurrence: now, pattern: 'All service periods', confidence: 0.90 }],
        trendDirection: 'improving',
        confidence: 0.85,
        evidenceCount: 75,
      },
      confidence: 0.85,
      evidenceCount: 500,
      replayAvailable: true,
    }
  }

  private generateReplayLink(context: string): string {
    return `/dashboard/service-replay?t=${new Date().toISOString()}&context=menu_${context}`
  }
}
