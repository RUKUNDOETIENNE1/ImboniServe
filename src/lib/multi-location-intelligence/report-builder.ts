/**
 * Multi-location Intelligence™ - Report Builder
 * Transforms multiple Structured Intelligence Reports into Portfolio Intelligence Report
 */

import type { PortfolioIntelligenceReport, PortfolioIntelligenceRequest } from './types'

export class PortfolioReportBuilder {
  build(intelligenceReports: any[], historicalContext: any, request: PortfolioIntelligenceRequest): PortfolioIntelligenceReport {
    const reportId = `portfolio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date().toISOString()

    // Mock data for demonstration
    const restaurants = [
      { id: 'rest_kigali', name: 'Imboni Kigali', location: 'Kigali City Center', score: 88 },
      { id: 'rest_nyarutarama', name: 'Imboni Nyarutarama', location: 'Nyarutarama', score: 85 },
      { id: 'rest_kimihurura', name: 'Imboni Kimihurura', location: 'Kimihurura', score: 82 },
    ]

    return {
      id: reportId,
      organizationId: request.organizationId,
      generatedAt: now,
      reportingPeriod: request.reportingPeriod,
      overview: {
        restaurantCount: restaurants.length,
        overallScore: 85,
        averageOperationalScore: 84,
        averageKitchenScore: 86,
        averageMenuScore: 83,
        averageServiceScore: 87,
        trend: 'improving',
        confidence: 0.89,
        status: 'good',
      },
      performanceScore: {
        overall: 85,
        dimensions: { operational: 84, kitchen: 86, menu: 83, service: 87, consistency: 85 },
        trend: 'improving',
        historicalComparison: { previousScore: 82, change: 3.7, changeDirection: 'up' },
        confidence: 0.89,
      },
      restaurantRanking: {
        restaurants: restaurants.map((r, i) => ({
          restaurantId: r.id,
          restaurantName: r.name,
          location: r.location,
          rank: i + 1,
          overallScore: r.score,
          trend: 'improving' as const,
          operationalPerformance: r.score - 2,
          kitchenPerformance: r.score + 1,
          menuPerformance: r.score - 3,
          servicePerformance: r.score + 2,
          historicalChange: 3.5,
          confidence: 0.88,
          evidenceCount: 45,
          replayLink: this.generateReplayLink(r.id),
        })),
        rankingCriteria: 'overall',
        evidenceCount: 135,
      },
      performanceDistribution: {
        topPerformers: [{ restaurantId: restaurants[0].id, restaurantName: restaurants[0].name, location: restaurants[0].location, score: restaurants[0].score, trend: 'improving', category: 'top' }],
        middlePerformers: [{ restaurantId: restaurants[1].id, restaurantName: restaurants[1].name, location: restaurants[1].location, score: restaurants[1].score, trend: 'stable', category: 'middle' }],
        needsAttention: [{ restaurantId: restaurants[2].id, restaurantName: restaurants[2].name, location: restaurants[2].location, score: restaurants[2].score, trend: 'improving', category: 'attention' }],
        performanceSpread: { min: 82, max: 88, average: 85, median: 85, standardDeviation: 2.5 },
        trendDistribution: { improving: 2, stable: 1, declining: 0 },
        confidence: 0.87,
      },
      locationComparison: {
        comparisons: [{
          restaurants: [restaurants[0].name, restaurants[1].name],
          metrics: {
            operationalScore: [88, 85],
            preparation: [180, 195],
            completion: [92, 89],
            kitchen: [89, 86],
            menu: [85, 82],
            customerExperience: [90, 87],
          },
          historicalTrend: [
            { restaurant: restaurants[0].name, trend: 'improving', change: 4.2 },
            { restaurant: restaurants[1].name, trend: 'stable', change: 0.8 },
          ],
          replayLinks: [this.generateReplayLink(restaurants[0].id), this.generateReplayLink(restaurants[1].id)],
          confidence: 0.88,
        }],
        comparisonMetrics: ['operational', 'preparation', 'completion', 'kitchen', 'menu', 'customer_experience'],
        evidenceCount: 90,
      },
      operationalTrends: {
        portfolioWideTrends: [
          { description: 'Improving preparation times across all locations', direction: 'improving', affectedRestaurants: restaurants.map(r => r.name), confidence: 0.89, evidenceCount: 45 },
        ],
        recurringImprovements: [
          { description: 'Consistent service quality improvements', frequency: 3, affectedRestaurants: [restaurants[0].name, restaurants[1].name], pattern: 'Weekly', lastOccurrence: now, confidence: 0.87 },
        ],
        recurringIssues: [],
        operationalConsistency: { score: 87, description: 'High operational consistency across portfolio', affectedRestaurants: restaurants.map(r => r.name) },
        historicalChanges: [
          { metric: 'Average Preparation Time', previousValue: 210, currentValue: 185, change: -11.9, trend: 'improving', affectedRestaurants: restaurants.map(r => r.name) },
        ],
        evidenceCount: 120,
        replayLink: this.generateReplayLink('portfolio'),
      },
      serviceComparison: {
        averageServiceQuality: restaurants.map(r => ({ restaurantName: r.name, value: r.score + 2, trend: 'improving' as const, confidence: 0.88 })),
        preparation: restaurants.map(r => ({ restaurantName: r.name, value: 180 + (88 - r.score) * 5, trend: 'improving' as const, confidence: 0.87 })),
        completion: restaurants.map(r => ({ restaurantName: r.name, value: r.score + 4, trend: 'stable' as const, confidence: 0.89 })),
        recovery: restaurants.map(r => ({ restaurantName: r.name, value: r.score - 3, trend: 'improving' as const, confidence: 0.85 })),
        operationalEfficiency: restaurants.map(r => ({ restaurantName: r.name, value: r.score + 1, trend: 'improving' as const, confidence: 0.88 })),
        evidenceCount: 150,
        replayLink: this.generateReplayLink('service'),
      },
      kitchenComparison: {
        kitchenPerformance: restaurants.map(r => ({ restaurantName: r.name, value: r.score + 1, trend: 'improving' as const, confidence: 0.89 })),
        preparation: restaurants.map(r => ({ restaurantName: r.name, value: 180 + (88 - r.score) * 5, trend: 'improving' as const, confidence: 0.87 })),
        queueBehavior: restaurants.map(r => ({ restaurantName: r.name, value: r.score - 2, trend: 'stable' as const, confidence: 0.86 })),
        recovery: restaurants.map(r => ({ restaurantName: r.name, value: r.score - 1, trend: 'improving' as const, confidence: 0.85 })),
        operationalTrends: restaurants.map(r => ({ restaurant: r.name, trend: 'improving', description: 'Consistent kitchen performance' })),
        evidenceCount: 135,
        replayLink: this.generateReplayLink('kitchen'),
      },
      menuComparison: {
        popularDishes: restaurants.map(r => ({ restaurant: r.name, dishes: ['Grilled Ribeye', 'House Burger'], orderCount: 45 })),
        operationalEfficiency: restaurants.map(r => ({ restaurantName: r.name, value: r.score - 2, trend: 'improving' as const, confidence: 0.87 })),
        menuConsistency: restaurants.map(r => ({ restaurantName: r.name, value: r.score + 2, trend: 'stable' as const, confidence: 0.88 })),
        cancellationPatterns: restaurants.map(r => ({ restaurant: r.name, cancellationRate: 5, topCancelled: ['Lamb Chops'] })),
        evidenceCount: 120,
        replayLink: this.generateReplayLink('menu'),
      },
      growthTrends: {
        historicalImprovement: restaurants.map(r => ({ restaurant: r.name, improvement: 3.5, trend: 'moderate' as const })),
        performanceTrajectory: restaurants.map(r => ({ restaurant: r.name, trajectory: 'steady' as const, dataPoints: [80, 82, 84, r.score] })),
        longTermGrowth: restaurants.map(r => ({ restaurant: r.name, growthRate: 4.2, consistency: 0.87 })),
        confidence: 0.86,
        evidenceCount: 90,
      },
      highlights: [
        {
          id: 'highlight_1',
          title: 'Portfolio-wide Service Improvement',
          description: 'All locations showing improved service quality',
          category: 'improvement',
          restaurantsInvolved: restaurants.map(r => r.name),
          improvement: 3.7,
          confidence: 0.89,
          evidenceCount: 45,
          replayLink: this.generateReplayLink('improvement'),
          timestamp: now,
        },
      ],
      issues: [],
      bestPractices: [
        {
          id: 'practice_1',
          title: 'Consistent Kitchen Execution',
          description: 'Top performers maintain consistent preparation times',
          category: 'kitchen',
          observedAt: [restaurants[0].name, restaurants[1].name],
          associatedWithPerformance: 'strong',
          evidence: 'Observed across 45 service periods',
          confidence: 0.88,
          evidenceCount: 45,
          replayLink: this.generateReplayLink('practice'),
        },
      ],
      historicalTrends: {
        portfolioImprovement: [
          { metric: 'Overall Score', currentValue: 85, historicalAverage: 82, change: 3.7, trend: 'improving' },
        ],
        historicalComparisons: [
          { period: 'Last Month', score: 82, restaurants: 3 },
          { period: 'This Month', score: 85, restaurants: 3 },
        ],
        recurringIssues: [],
        recurringStrengths: [
          { description: 'Strong service consistency', frequency: 4, affectedRestaurants: restaurants.map(r => r.name), pattern: 'Weekly', lastOccurrence: now, confidence: 0.89 },
        ],
        longTermEvolution: [
          { description: 'Portfolio growth trajectory', dataPoints: [{ date: '2026-06-01', value: 80 }, { date: '2026-07-01', value: 85 }] },
        ],
        confidence: 0.87,
        evidenceCount: 180,
        replayLink: this.generateReplayLink('historical'),
      },
      restaurantCount: restaurants.length,
      confidence: 0.87,
      evidenceCount: 1200,
      replayAvailable: true,
    }
  }

  private generateReplayLink(context: string): string {
    return `/dashboard/service-replay?t=${new Date().toISOString()}&context=portfolio_${context}`
  }
}
