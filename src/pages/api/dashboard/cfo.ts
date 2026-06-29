/**
 * CFO Dashboard API
 * 
 * Phase: 1.2D (Power Layer)
 * Governance: KPI_CATALOG_V2.md, FINANCIAL_DATA_GOVERNANCE.md
 * Data Source: FinancialLedgerEntry (PRIMARY for all revenue metrics)
 * 
 * Performance Target: <1s response time (p95)
 * Cache Strategy: Redis caching with TTL-based invalidation
 * 
 * This endpoint aggregates data from Financial Intelligence Services:
 * - FinancialHealthService (MRR, ARR, GMV, NRR)
 * - RevenueIntelligenceService (composition, concentration, drivers)
 * - SubscriptionIntelligenceService (dynamics, risk)
 * - FinancialOperationsService (reconciliation, payments)
 * - FinancialPrioritiesService (deterministic priority engine)
 * - ExecutiveSummaryService (CFO Financial Insight Strip)
 * 
 * Phase 1.2D Power Layer (Intelligence Amplification):
 * - CfoInsightEngineService (metric → insight + cause + action)
 * - CfoSignalCorrelationService (cross-domain pattern detection)
 * - CfoNarrativeService (boardroom-ready explanations)
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'

// Financial Intelligence Services
import { FinancialHealthService } from '@/lib/services/intelligence/financial-health.service'
import { RevenueIntelligenceService } from '@/lib/services/intelligence/revenue-intelligence.service'
import { SubscriptionIntelligenceService } from '@/lib/services/intelligence/subscription-intelligence.service'
import { FinancialOperationsService } from '@/lib/services/intelligence/financial-operations.service'
import { FinancialPrioritiesService } from '@/lib/services/intelligence/financial-priorities.service'
import { ExecutiveSummaryService } from '@/lib/services/intelligence/executive-summary.service'

// Phase 1.2D Power Layer Services
import { CfoInsightEngineService } from '@/lib/services/intelligence/cfo-insight-engine.service'
import { CfoSignalCorrelationService } from '@/lib/services/intelligence/cfo-signal-correlation.service'
import { CfoNarrativeService } from '@/lib/services/intelligence/cfo-narrative.service'

// Cache Service
import { CacheService, CacheKeys, CacheTTL } from '@/lib/services/cache.service'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const startTime = Date.now()

  try {
    const session = await getServerSession(req, res, authOptions)
    
    if (!session?.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Check if user has CFO/executive access
    // @ts-ignore
    const userRole = session.user.role
    if (!['OWNER', 'ADMIN', 'CFO'].includes(userRole)) {
      return res.status(403).json({ error: 'Forbidden - CFO access required' })
    }

    // Fetch all dashboard data in parallel with caching
    const [
      financialHealth,
      revenueIntelligence,
      subscriptionIntelligence,
      operationsIntelligence,
      priorities,
      insightStrip,
      insights,
      correlations,
      narratives
    ] = await Promise.all([
      // Financial Health (5 min cache)
      CacheService.getOrCompute(
        CacheKeys.financialHealth(),
        () => FinancialHealthService.getMetrics(),
        CacheTTL.FINANCIAL_HEALTH
      ),
      
      // Revenue Intelligence (10 min cache)
      CacheService.getOrCompute(
        CacheKeys.revenueIntelligence('last30d'),
        () => RevenueIntelligenceService.getIntelligence('last30d'),
        CacheTTL.REVENUE_INTELLIGENCE
      ),
      
      // Subscription Intelligence (5 min cache)
      CacheService.getOrCompute(
        CacheKeys.subscriptionIntelligence(),
        () => SubscriptionIntelligenceService.getIntelligence(),
        CacheTTL.SUBSCRIPTION_INTELLIGENCE
      ),
      
      // Operations Intelligence (2 min cache)
      CacheService.getOrCompute(
        CacheKeys.operationsIntelligence(),
        () => FinancialOperationsService.getIntelligence(),
        CacheTTL.OPERATIONS_INTELLIGENCE
      ),
      
      // Financial Priorities (1 min cache)
      CacheService.getOrCompute(
        CacheKeys.financialPriorities(),
        () => FinancialPrioritiesService.getTopPriorities(5),
        CacheTTL.FINANCIAL_PRIORITIES
      ),
      
      // CFO Insight Strip (1 min cache)
      CacheService.getOrCompute(
        CacheKeys.insightStrip(),
        () => ExecutiveSummaryService.getFinancialSummary(),
        CacheTTL.INSIGHT_STRIP
      ),
      
      // Phase 1.2D Power Layer Intelligence (1 min cache)
      CacheService.getOrCompute(
        'cfo:insights',
        () => CfoInsightEngineService.generateInsights(),
        60 // 1 minute
      ),
      
      // Signal Correlations (1 min cache)
      CacheService.getOrCompute(
        'cfo:correlations',
        () => CfoSignalCorrelationService.detectCorrelations(),
        60 // 1 minute
      ),
      
      // CFO Narratives (1 min cache)
      CacheService.getOrCompute(
        'cfo:narratives',
        () => CfoNarrativeService.generateNarratives(),
        60 // 1 minute
      )
    ])

    const loadTime = Date.now() - startTime

    // Check if any data was served from cache
    const cacheHit = loadTime < 100 // If response is very fast, likely from cache

    return res.status(200).json({
      financialHealth,
      revenueIntelligence,
      subscriptionIntelligence,
      operationsIntelligence,
      priorities,
      insightStrip,
      // Phase 1.2D Power Layer
      insights,
      correlations,
      narratives,
      metadata: {
        loadTime,
        cacheHit,
        generatedAt: new Date(),
        powerLayerEnabled: true
      }
    })

  } catch (error) {
    console.error('CFO Dashboard API Error:', error)
    
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
