/**
 * Multi-location Intelligence™ - Report Builder
 * Transforms multiple Structured Intelligence Reports into Portfolio Intelligence Report
 */

import type { PortfolioIntelligenceReport, PortfolioIntelligenceRequest } from './types'

export class PortfolioReportBuilder {
  build(intelligenceReports: any[], historicalContext: any, request: PortfolioIntelligenceRequest): PortfolioIntelligenceReport {
    const reportId = `portfolio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date().toISOString()

    // Extract business data from actual intelligence reports
    const businesses = intelligenceReports.map((r, i) => ({
      id: r.businessId || `biz_${i}`,
      name: r.businessName || `Business ${i + 1}`,
      location: r.businessLocation || '—',
      score: r.overallScore?.overall || 0,
      operationalScore: r.overallScore?.operational || 0,
      kitchenScore: r.overallScore?.kitchen || 0,
      menuScore: r.overallScore?.menu || 0,
      serviceScore: r.overallScore?.service || 0,
      evidenceCount: r.evidenceCount || 0,
      highlights: r.highlights || [],
      issues: r.issues || [],
    }))

    // Sort by overall score for ranking
    const ranked = [...businesses].sort((a, b) => b.score - a.score)

    // Calculate portfolio aggregates
    const count = businesses.length
    const avgScore = count > 0 ? businesses.reduce((s, b) => s + b.score, 0) / count : 0
    const avgOperational = count > 0 ? businesses.reduce((s, b) => s + b.operationalScore, 0) / count : 0
    const avgKitchen = count > 0 ? businesses.reduce((s, b) => s + b.kitchenScore, 0) / count : 0
    const avgMenu = count > 0 ? businesses.reduce((s, b) => s + b.menuScore, 0) / count : 0
    const avgService = count > 0 ? businesses.reduce((s, b) => s + b.serviceScore, 0) / count : 0
    const totalEvidence = businesses.reduce((s, b) => s + b.evidenceCount, 0)

    // Determine portfolio trend
    const improvingCount = ranked.filter(r => r.score > avgScore).length
    const portfolioTrend = improvingCount > count / 2 ? 'improving' : improvingCount === count / 2 ? 'stable' : 'declining'

    // Categorize performers
    const topPerformers = ranked.filter(r => r.score >= avgScore + 3)
    const middlePerformers = ranked.filter(r => r.score >= avgScore - 3 && r.score < avgScore + 3)
    const needsAttention = ranked.filter(r => r.score < avgScore - 3)

    // Collect all highlights and issues
    const allHighlights = businesses.flatMap(b => b.highlights.map((h: any) => ({ ...h, restaurantName: b.name })))
    const allIssues = businesses.flatMap(b => b.issues.map((i: any) => ({ ...i, restaurantName: b.name })))

    // Historical comparison
    const prevScore = historicalContext?.previousPortfolioScore || avgScore
    const scoreChange = avgScore - prevScore
    const changeDirection = scoreChange > 0.5 ? 'up' : scoreChange < -0.5 ? 'down' : 'stable'

    // Performance spread
    const scores = businesses.map(b => b.score).sort((a, b) => a - b)
    const minScore = scores[0] || 0
    const maxScore = scores[scores.length - 1] || 0
    const median = count > 0 ? scores[Math.floor(count / 2)] || 0 : 0
    const variance = count > 0 ? scores.reduce((s, v) => s + Math.pow(v - avgScore, 2), 0) / count : 0
    const stdDev = Math.sqrt(variance)

    return {
      id: reportId,
      organizationId: request.organizationId,
      generatedAt: now,
      reportingPeriod: request.reportingPeriod,
      overview: {
        restaurantCount: count,
        overallScore: Math.round(avgScore * 10) / 10,
        averageOperationalScore: Math.round(avgOperational * 10) / 10,
        averageKitchenScore: Math.round(avgKitchen * 10) / 10,
        averageMenuScore: Math.round(avgMenu * 10) / 10,
        averageServiceScore: Math.round(avgService * 10) / 10,
        trend: portfolioTrend,
        confidence: count > 0 ? Math.min(0.95, 0.5 + totalEvidence / 1000) : 0,
        status: avgScore >= 85 ? 'good' : avgScore >= 70 ? 'fair' : 'needs_attention',
      },
      performanceScore: {
        overall: Math.round(avgScore * 10) / 10,
        dimensions: {
          operational: Math.round(avgOperational * 10) / 10,
          kitchen: Math.round(avgKitchen * 10) / 10,
          menu: Math.round(avgMenu * 10) / 10,
          service: Math.round(avgService * 10) / 10,
          consistency: Math.round((100 - stdDev) * 10) / 10,
        },
        trend: portfolioTrend,
        historicalComparison: { previousScore: Math.round(prevScore * 10) / 10, change: Math.round(scoreChange * 10) / 10, changeDirection: changeDirection as 'up' | 'down' | 'stable' },
        confidence: count > 0 ? Math.min(0.95, 0.5 + totalEvidence / 1000) : 0,
      },
      restaurantRanking: {
        restaurants: ranked.map((r, i) => ({
          restaurantId: r.id,
          restaurantName: r.name,
          location: r.location,
          rank: i + 1,
          overallScore: r.score,
          trend: portfolioTrend as 'improving' | 'stable' | 'declining',
          operationalPerformance: r.operationalScore,
          kitchenPerformance: r.kitchenScore,
          menuPerformance: r.menuScore,
          servicePerformance: r.serviceScore,
          historicalChange: scoreChange,
          confidence: Math.min(0.95, 0.5 + r.evidenceCount / 100),
          evidenceCount: r.evidenceCount,
          replayLink: this.generateReplayLink(r.id),
        })),
        rankingCriteria: 'overall',
        evidenceCount: totalEvidence,
      },
      performanceDistribution: {
        topPerformers: topPerformers.map(r => ({ restaurantId: r.id, restaurantName: r.name, location: r.location, score: r.score, trend: 'improving', category: 'top' })),
        middlePerformers: middlePerformers.map(r => ({ restaurantId: r.id, restaurantName: r.name, location: r.location, score: r.score, trend: 'stable', category: 'middle' })),
        needsAttention: needsAttention.map(r => ({ restaurantId: r.id, restaurantName: r.name, location: r.location, score: r.score, trend: 'declining', category: 'attention' })),
        performanceSpread: { min: minScore, max: maxScore, average: Math.round(avgScore * 10) / 10, median, standardDeviation: Math.round(stdDev * 100) / 100 },
        trendDistribution: {
          improving: ranked.filter(r => r.score > prevScore).length,
          stable: ranked.filter(r => Math.abs(r.score - prevScore) <= 2).length,
          declining: ranked.filter(r => r.score < prevScore - 2).length,
        },
        confidence: count > 0 ? Math.min(0.95, 0.5 + totalEvidence / 1000) : 0,
      },
      locationComparison: {
        comparisons: count >= 2 ? [{
          restaurants: [ranked[0].name, ranked[1].name],
          metrics: {
            operationalScore: [ranked[0].operationalScore, ranked[1].operationalScore],
            preparation: [ranked[0].kitchenScore, ranked[1].kitchenScore],
            completion: [ranked[0].serviceScore, ranked[1].serviceScore],
            kitchen: [ranked[0].kitchenScore, ranked[1].kitchenScore],
            menu: [ranked[0].menuScore, ranked[1].menuScore],
            customerExperience: [ranked[0].serviceScore, ranked[1].serviceScore],
          },
          historicalTrend: [
            { restaurant: ranked[0].name, trend: ranked[0].score > prevScore ? 'improving' : 'stable', change: ranked[0].score - prevScore },
            { restaurant: ranked[1].name, trend: ranked[1].score > prevScore ? 'improving' : 'stable', change: ranked[1].score - prevScore },
          ],
          replayLinks: [this.generateReplayLink(ranked[0].id), this.generateReplayLink(ranked[1].id)],
          confidence: Math.min(0.95, 0.5 + (ranked[0].evidenceCount + ranked[1].evidenceCount) / 200),
        }] : [],
        comparisonMetrics: ['operational', 'preparation', 'completion', 'kitchen', 'menu', 'customer_experience'],
        evidenceCount: totalEvidence,
      },
      operationalTrends: {
        portfolioWideTrends: allHighlights.slice(0, 3).map(h => ({
          description: h.title || h.description || 'Operational improvement detected',
          direction: 'improving',
          affectedRestaurants: businesses.map(b => b.name),
          confidence: h.confidence || 0.8,
          evidenceCount: h.evidenceCount || 0,
        })),
        recurringImprovements: [],
        recurringIssues: allIssues.slice(0, 3).map(i => ({
          description: i.title || i.description || 'Issue detected',
          frequency: 1,
          affectedRestaurants: [i.restaurantName],
          pattern: 'Isolated',
          lastOccurrence: now,
          confidence: i.confidence || 0.7,
        })),
        operationalConsistency: { score: Math.round((100 - stdDev) * 10) / 10, description: stdDev < 5 ? 'High operational consistency across portfolio' : 'Moderate operational variance across portfolio', affectedRestaurants: businesses.map(b => b.name) },
        historicalChanges: [
          { metric: 'Overall Score', previousValue: Math.round(prevScore * 10) / 10, currentValue: Math.round(avgScore * 10) / 10, change: Math.round(scoreChange * 10) / 10, trend: (changeDirection === 'up' ? 'improving' : changeDirection === 'down' ? 'declining' : 'improving') as 'improving' | 'declining', affectedRestaurants: businesses.map(b => b.name) },
        ],
        evidenceCount: totalEvidence,
        replayLink: this.generateReplayLink('portfolio'),
      },
      serviceComparison: {
        averageServiceQuality: businesses.map(r => ({ restaurantName: r.name, value: r.serviceScore, trend: 'improving' as const, confidence: Math.min(0.95, 0.5 + r.evidenceCount / 100) })),
        preparation: businesses.map(r => ({ restaurantName: r.name, value: r.kitchenScore, trend: 'improving' as const, confidence: Math.min(0.95, 0.5 + r.evidenceCount / 100) })),
        completion: businesses.map(r => ({ restaurantName: r.name, value: r.serviceScore, trend: 'stable' as const, confidence: Math.min(0.95, 0.5 + r.evidenceCount / 100) })),
        recovery: businesses.map(r => ({ restaurantName: r.name, value: Math.max(0, r.score - 5), trend: 'improving' as const, confidence: Math.min(0.95, 0.5 + r.evidenceCount / 100) })),
        operationalEfficiency: businesses.map(r => ({ restaurantName: r.name, value: r.operationalScore, trend: 'improving' as const, confidence: Math.min(0.95, 0.5 + r.evidenceCount / 100) })),
        evidenceCount: totalEvidence,
        replayLink: this.generateReplayLink('service'),
      },
      kitchenComparison: {
        kitchenPerformance: businesses.map(r => ({ restaurantName: r.name, value: r.kitchenScore, trend: 'improving' as const, confidence: Math.min(0.95, 0.5 + r.evidenceCount / 100) })),
        preparation: businesses.map(r => ({ restaurantName: r.name, value: r.kitchenScore, trend: 'improving' as const, confidence: Math.min(0.95, 0.5 + r.evidenceCount / 100) })),
        queueBehavior: businesses.map(r => ({ restaurantName: r.name, value: Math.max(0, r.kitchenScore - 5), trend: 'stable' as const, confidence: Math.min(0.95, 0.5 + r.evidenceCount / 100) })),
        recovery: businesses.map(r => ({ restaurantName: r.name, value: Math.max(0, r.kitchenScore - 3), trend: 'improving' as const, confidence: Math.min(0.95, 0.5 + r.evidenceCount / 100) })),
        operationalTrends: businesses.map(r => ({ restaurant: r.name, trend: r.score > prevScore ? 'improving' : 'stable', description: 'Kitchen performance tracking' })),
        evidenceCount: totalEvidence,
        replayLink: this.generateReplayLink('kitchen'),
      },
      menuComparison: {
        popularDishes: businesses.map(r => ({ restaurant: r.name, dishes: [], orderCount: 0 })),
        operationalEfficiency: businesses.map(r => ({ restaurantName: r.name, value: r.menuScore, trend: 'improving' as const, confidence: Math.min(0.95, 0.5 + r.evidenceCount / 100) })),
        menuConsistency: businesses.map(r => ({ restaurantName: r.name, value: r.menuScore, trend: 'stable' as const, confidence: Math.min(0.95, 0.5 + r.evidenceCount / 100) })),
        cancellationPatterns: businesses.map(r => ({ restaurant: r.name, cancellationRate: 0, topCancelled: [] })),
        evidenceCount: totalEvidence,
        replayLink: this.generateReplayLink('menu'),
      },
      growthTrends: {
        historicalImprovement: businesses.map(r => ({ restaurant: r.name, improvement: Math.round((r.score - prevScore) * 10) / 10, trend: (r.score > prevScore ? 'moderate' : 'weak') as 'strong' | 'moderate' | 'weak' })),
        performanceTrajectory: businesses.map(r => ({ restaurant: r.name, trajectory: (r.score > prevScore ? 'accelerating' : 'steady') as 'accelerating' | 'steady' | 'slowing', dataPoints: [prevScore, r.score] })),
        longTermGrowth: businesses.map(r => ({ restaurant: r.name, growthRate: Math.round((r.score - prevScore) * 10) / 10, consistency: Math.min(0.95, 0.5 + r.evidenceCount / 100) })),
        confidence: count > 0 ? Math.min(0.9, 0.5 + totalEvidence / 2000) : 0,
        evidenceCount: totalEvidence,
      },
      highlights: allHighlights.slice(0, 5).map((h, i) => ({
        id: h.id || `highlight_${i}`,
        title: h.title || 'Improvement detected',
        description: h.description || '',
        category: h.category || 'improvement',
        restaurantsInvolved: [h.restaurantName],
        improvement: h.improvement || scoreChange,
        confidence: h.confidence || 0.8,
        evidenceCount: h.evidenceCount || 0,
        replayLink: this.generateReplayLink(`highlight_${i}`),
        timestamp: now,
      })),
      issues: allIssues.slice(0, 5).map((iss, i) => ({
        id: iss.id || `issue_${i}`,
        title: iss.title || 'Issue detected',
        description: iss.description || '',
        category: (iss.category || 'attention_required') as 'attention_required' | 'recurring_issue' | 'historical_concern' | 'operational_decline',
        severity: (iss.severity || 'medium') as 'low' | 'medium' | 'high' | 'critical',
        impact: iss.impact || iss.description || 'Operational impact',
        restaurantsAffected: [iss.restaurantName],
        historicalRecurrence: 'first_time' as 'first_time' | 'rare' | 'occasional' | 'frequent',
        confidence: iss.confidence || 0.7,
        evidenceCount: iss.evidenceCount || 0,
        replayLink: this.generateReplayLink(`issue_${i}`),
        timestamp: now,
      })),
      bestPractices: topPerformers.map((r, i) => ({
        id: `practice_${i}`,
        title: `Strong performance at ${r.name}`,
        description: `Score of ${r.score} indicates consistent operational execution`,
        category: 'operational',
        observedAt: [r.name],
        associatedWithPerformance: 'strong',
        evidence: `${r.evidenceCount} data points analyzed`,
        confidence: Math.min(0.95, 0.5 + r.evidenceCount / 100),
        evidenceCount: r.evidenceCount,
        replayLink: this.generateReplayLink(r.id),
      })),
      historicalTrends: {
        portfolioImprovement: [
          { metric: 'Overall Score', currentValue: Math.round(avgScore * 10) / 10, historicalAverage: Math.round(prevScore * 10) / 10, change: Math.round(scoreChange * 10) / 10, trend: (changeDirection === 'up' ? 'improving' : 'declining') as 'improving' | 'declining' },
        ],
        historicalComparisons: [
          { period: 'Previous', score: Math.round(prevScore * 10) / 10, restaurants: count },
          { period: 'Current', score: Math.round(avgScore * 10) / 10, restaurants: count },
        ],
        recurringIssues: [],
        recurringStrengths: allHighlights.slice(0, 3).map((h, i) => ({
          description: h.title || h.description || 'Consistent performance',
          frequency: 1,
          affectedRestaurants: [h.restaurantName],
          pattern: 'Periodic',
          lastOccurrence: now,
          confidence: h.confidence || 0.8,
        })),
        longTermEvolution: [
          { description: 'Portfolio score trajectory', dataPoints: [{ date: historicalContext?.previousPeriodDate || now, value: prevScore }, { date: now, value: avgScore }] },
        ],
        confidence: count > 0 ? Math.min(0.9, 0.5 + totalEvidence / 2000) : 0,
        evidenceCount: totalEvidence,
        replayLink: this.generateReplayLink('historical'),
      },
      restaurantCount: count,
      confidence: count > 0 ? Math.min(0.9, 0.5 + totalEvidence / 2000) : 0,
      evidenceCount: totalEvidence,
      replayAvailable: true,
    }
  }

  private generateReplayLink(context: string): string {
    return `/dashboard/service-replay?t=${new Date().toISOString()}&context=portfolio_${context}`
  }
}
