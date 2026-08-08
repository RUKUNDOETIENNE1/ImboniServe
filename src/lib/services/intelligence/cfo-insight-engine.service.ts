/**
 * CFO Insight Engine Service
 * 
 * Purpose: Convert raw financial metrics into actionable CFO insights
 * 
 * This is the CORE of Phase 1.2D "Power Layer"
 * 
 * Design Philosophy:
 * - Pure deterministic logic (no ML/AI)
 * - Rule-based insight generation
 * - Every metric gets: insight + cause + action
 * - Boardroom-ready explanations
 * 
 * Intelligence Layers:
 * 1. Metric → Insight (what changed?)
 * 2. Insight → Root Cause (why it changed?)
 * 3. Root Cause → Action (what to do?)
 */

import { FinancialHealthService } from './financial-health.service'
import { RevenueIntelligenceService } from './revenue-intelligence.service'
import { SubscriptionIntelligenceService } from './subscription-intelligence.service'
import { FinancialOperationsService } from './financial-operations.service'

export type InsightSeverity = 'CRITICAL' | 'WARNING' | 'INFO' | 'POSITIVE'
export type InsightCategory = 'REVENUE' | 'RETENTION' | 'OPERATIONS' | 'RISK' | 'OPPORTUNITY'

export interface CfoInsight {
  category: InsightCategory
  severity: InsightSeverity
  
  // The 3 core components
  insight: string          // What changed? (1 line, plain English)
  rootCause: string        // Why it changed? (deterministic hypothesis)
  action: string           // What to do? (specific, actionable)
  
  // Supporting data
  metricName: string
  currentValue: number | string
  previousValue?: number | string
  changePercent?: number
  threshold?: number
  
  // Priority for display
  priority: number         // 1-100 (higher = more urgent)
}

export interface CfoMetricInsight {
  metricName: string
  insight: string
  rootCause: string
  action: string
  severity: InsightSeverity
}

export class CfoInsightEngineService {
  /**
   * Generate comprehensive CFO insights from all financial data
   */
  static async generateInsights(): Promise<{
    topInsights: CfoInsight[]
    metricInsights: {
      mrr: CfoMetricInsight
      revenueChurn: CfoMetricInsight
      nrr: CfoMetricInsight
      concentration: CfoMetricInsight
      operations: CfoMetricInsight
    }
  }> {
    // Fetch all financial intelligence in parallel
    const [financialHealth, revenueIntel, subscriptionIntel, operations] = await Promise.all([
      FinancialHealthService.getMetrics(),
      RevenueIntelligenceService.getIntelligence('last30d'),
      SubscriptionIntelligenceService.getIntelligence(),
      FinancialOperationsService.getIntelligence()
    ])

    const insights: CfoInsight[] = []

    // === REVENUE INSIGHTS ===

    // MRR Insight
    const mrrInsight = this.generateMRRInsight(financialHealth.mrr)
    if (mrrInsight) insights.push(mrrInsight)

    // Revenue Churn Insight
    const churnInsight = this.generateRevenueChurnInsight(financialHealth.revenueChurn)
    if (churnInsight) insights.push(churnInsight)

    // NRR Insight
    const nrrInsight = this.generateNRRInsight(financialHealth.netRevenueRetention)
    if (nrrInsight) insights.push(nrrInsight)

    // Revenue Concentration Insight
    const concentrationInsight = this.generateConcentrationInsight(revenueIntel.concentration)
    if (concentrationInsight) insights.push(concentrationInsight)

    // === OPERATIONAL INSIGHTS ===

    // Payment Operations Insight
    const paymentInsight = this.generatePaymentInsight(operations.paymentHealth)
    if (paymentInsight) insights.push(paymentInsight)

    // Reconciliation Insight
    const reconInsight = this.generateReconciliationInsight(operations.reconciliationHealth)
    if (reconInsight) insights.push(reconInsight)

    // === SUBSCRIPTION INSIGHTS ===

    // Subscription Growth Insight
    const subGrowthInsight = this.generateSubscriptionGrowthInsight(subscriptionIntel.activeSubscriptions)
    if (subGrowthInsight) insights.push(subGrowthInsight)

    // Sort by priority (highest first)
    const topInsights = insights.sort((a, b) => b.priority - a.priority).slice(0, 5)

    // Generate metric-specific insights for dashboard sections
    const metricInsights = {
      mrr: this.generateMRRMetricInsight(financialHealth.mrr),
      revenueChurn: this.generateRevenueChurnMetricInsight(financialHealth.revenueChurn),
      nrr: this.generateNRRMetricInsight(financialHealth.netRevenueRetention),
      concentration: this.generateConcentrationMetricInsight(revenueIntel.concentration),
      operations: this.generateOperationsMetricInsight(operations)
    }

    return {
      topInsights,
      metricInsights
    }
  }

  /**
   * Generate MRR insight
   */
  private static generateMRRInsight(mrr: any): CfoInsight | null {
    const changePercent = mrr.changePercent

    // CRITICAL: MRR declining severely (>10%)
    if (changePercent < -10) {
      return {
        category: 'REVENUE',
        severity: 'CRITICAL',
        insight: `Monthly recurring revenue declining ${Math.abs(changePercent).toFixed(1)}% month-over-month`,
        rootCause: 'Significant customer churn or subscription downgrades exceeding new customer acquisition',
        action: 'Immediate action: Analyze top churned customers, review pricing strategy, and accelerate customer retention programs',
        metricName: 'MRR',
        currentValue: mrr.value,
        previousValue: mrr.previousValue,
        changePercent,
        threshold: -10,
        priority: 95
      }
    }

    // WARNING: MRR declining moderately (5-10%)
    if (changePercent < -5) {
      return {
        category: 'REVENUE',
        severity: 'WARNING',
        insight: `Monthly recurring revenue declining ${Math.abs(changePercent).toFixed(1)}% month-over-month`,
        rootCause: 'Churn rate exceeding new subscription growth',
        action: 'Review customer retention: Analyze churn patterns, strengthen customer success programs, and improve product value delivery',
        metricName: 'MRR',
        currentValue: mrr.value,
        previousValue: mrr.previousValue,
        changePercent,
        threshold: -5,
        priority: 75
      }
    }

    // WARNING: MRR growth slowing
    if (changePercent >= 0 && changePercent < 2) {
      return {
        category: 'REVENUE',
        severity: 'WARNING',
        insight: `Monthly recurring revenue growth stagnating at ${changePercent.toFixed(1)}%`,
        rootCause: 'New customer acquisition slowing or expansion revenue insufficient to offset natural churn',
        action: 'Review customer acquisition pipeline and identify expansion opportunities in existing customer base',
        metricName: 'MRR',
        currentValue: mrr.value,
        previousValue: mrr.previousValue,
        changePercent,
        threshold: 2,
        priority: 60
      }
    }

    // POSITIVE: Strong MRR growth
    if (changePercent > 10) {
      return {
        category: 'OPPORTUNITY',
        severity: 'POSITIVE',
        insight: `Monthly recurring revenue accelerating with ${changePercent.toFixed(1)}% growth`,
        rootCause: 'Strong new customer acquisition combined with healthy expansion revenue from existing customers',
        action: 'Capitalize on momentum: Scale successful acquisition channels and replicate expansion strategies',
        metricName: 'MRR',
        currentValue: mrr.value,
        previousValue: mrr.previousValue,
        changePercent,
        threshold: 10,
        priority: 40
      }
    }

    return null
  }

  /**
   * Generate Revenue Churn insight
   */
  private static generateRevenueChurnInsight(churn: any): CfoInsight | null {
    const rate = churn.rate

    // CRITICAL: High churn
    if (rate > 10) {
      return {
        category: 'RETENTION',
        severity: 'CRITICAL',
        insight: `Revenue churn rate at ${rate.toFixed(1)}% exceeds critical threshold`,
        rootCause: 'Significant customer dissatisfaction, competitive pressure, or product-market fit issues causing revenue loss',
        action: 'Emergency retention review: Interview churned customers, analyze product usage patterns, implement win-back campaigns',
        metricName: 'Revenue Churn Rate',
        currentValue: `${rate.toFixed(1)}%`,
        threshold: 10,
        priority: 92
      }
    }

    // WARNING: Elevated churn
    if (rate > 5) {
      return {
        category: 'RETENTION',
        severity: 'WARNING',
        insight: `Revenue churn rate elevated at ${rate.toFixed(1)}%`,
        rootCause: 'Customer retention challenges emerging, likely due to service quality issues or competitive alternatives',
        action: 'Strengthen customer success programs, identify at-risk accounts, and improve product value delivery',
        metricName: 'Revenue Churn Rate',
        currentValue: `${rate.toFixed(1)}%`,
        threshold: 5,
        priority: 75
      }
    }

    // POSITIVE: Low churn
    if (rate < 3) {
      return {
        category: 'RETENTION',
        severity: 'POSITIVE',
        insight: `Revenue churn rate healthy at ${rate.toFixed(1)}%`,
        rootCause: 'Strong customer satisfaction and product-market fit driving retention',
        action: 'Document retention best practices and scale successful customer success strategies',
        metricName: 'Revenue Churn Rate',
        currentValue: `${rate.toFixed(1)}%`,
        threshold: 3,
        priority: 30
      }
    }

    return null
  }

  /**
   * Generate NRR insight
   */
  private static generateNRRInsight(nrr: any): CfoInsight | null {
    const rate = nrr.rate

    // CRITICAL: NRR below 90%
    if (rate < 90) {
      return {
        category: 'RETENTION',
        severity: 'CRITICAL',
        insight: `Net revenue retention at ${rate.toFixed(1)}% indicates severe revenue leakage`,
        rootCause: 'Combination of high churn and insufficient expansion revenue from existing customers',
        action: 'Dual focus required: Reduce churn immediately AND increase expansion through upsells and cross-sells',
        metricName: 'Net Revenue Retention',
        currentValue: `${rate.toFixed(1)}%`,
        threshold: 90,
        priority: 90
      }
    }

    // WARNING: NRR below 100%
    if (rate < 100) {
      return {
        category: 'RETENTION',
        severity: 'WARNING',
        insight: `Net revenue retention at ${rate.toFixed(1)}% shows revenue contraction`,
        rootCause: 'Churn and downgrades exceeding expansion revenue from existing customer base',
        action: 'Focus on expansion strategies: Identify upsell opportunities and reduce contraction risk',
        metricName: 'Net Revenue Retention',
        currentValue: `${rate.toFixed(1)}%`,
        threshold: 100,
        priority: 70
      }
    }

    // POSITIVE: NRR above 110%
    if (rate > 110) {
      return {
        category: 'OPPORTUNITY',
        severity: 'POSITIVE',
        insight: `Net revenue retention at ${rate.toFixed(1)}% demonstrates strong expansion`,
        rootCause: 'Existing customers increasing spend faster than revenue lost to churn',
        action: 'Scale expansion playbook: Document successful upsell strategies and replicate across customer base',
        metricName: 'Net Revenue Retention',
        currentValue: `${rate.toFixed(1)}%`,
        threshold: 110,
        priority: 35
      }
    }

    return null
  }

  /**
   * Generate Revenue Concentration insight
   */
  private static generateConcentrationInsight(concentration: any): CfoInsight | null {
    const rate = concentration.rate

    // CRITICAL: Concentration above 50%
    if (rate > 50) {
      return {
        category: 'RISK',
        severity: 'CRITICAL',
        insight: `Revenue concentration at ${rate.toFixed(1)}% creates existential business risk`,
        rootCause: 'Over-dependence on small number of customers creates vulnerability to single customer loss',
        action: 'Urgent diversification required: Launch customer acquisition campaign targeting mid-market segment',
        metricName: 'Revenue Concentration',
        currentValue: `${rate.toFixed(1)}%`,
        threshold: 50,
        priority: 93
      }
    }

    // WARNING: Concentration above 40%
    if (rate > 40) {
      return {
        category: 'RISK',
        severity: 'WARNING',
        insight: `Revenue concentration at ${rate.toFixed(1)}% approaching critical threshold`,
        rootCause: 'Customer base insufficiently diversified, creating revenue volatility risk',
        action: 'Begin customer diversification initiatives: Expand into new segments and reduce top customer dependency',
        metricName: 'Revenue Concentration',
        currentValue: `${rate.toFixed(1)}%`,
        threshold: 40,
        priority: 78
      }
    }

    // POSITIVE: Well-diversified
    if (rate < 30) {
      return {
        category: 'RISK',
        severity: 'POSITIVE',
        insight: `Revenue concentration at ${rate.toFixed(1)}% indicates healthy diversification`,
        rootCause: 'Well-balanced customer portfolio reduces single-customer dependency risk',
        action: 'Maintain diversification: Continue balanced customer acquisition across segments',
        metricName: 'Revenue Concentration',
        currentValue: `${rate.toFixed(1)}%`,
        threshold: 30,
        priority: 25
      }
    }

    return null
  }

  /**
   * Generate Payment Operations insight
   */
  private static generatePaymentInsight(paymentHealth: any): CfoInsight | null {
    const successRate = paymentHealth.successRate

    // CRITICAL: Success rate below 90%
    if (successRate < 90) {
      return {
        category: 'OPERATIONS',
        severity: 'CRITICAL',
        insight: `Payment success rate at ${successRate.toFixed(1)}% indicates systemic payment issues`,
        rootCause: 'Payment provider reliability problems or customer payment method failures',
        action: 'Immediate investigation: Review provider health, analyze failure patterns, contact affected customers',
        metricName: 'Payment Success Rate',
        currentValue: `${successRate.toFixed(1)}%`,
        threshold: 90,
        priority: 88
      }
    }

    // WARNING: Success rate below 95%
    if (successRate < 95) {
      return {
        category: 'OPERATIONS',
        severity: 'WARNING',
        insight: `Payment success rate at ${successRate.toFixed(1)}% below target`,
        rootCause: 'Elevated payment failures impacting revenue collection efficiency',
        action: 'Monitor payment provider health and implement retry strategies for failed payments',
        metricName: 'Payment Success Rate',
        currentValue: `${successRate.toFixed(1)}%`,
        threshold: 95,
        priority: 65
      }
    }

    return null
  }

  /**
   * Generate Reconciliation insight
   */
  private static generateReconciliationInsight(reconHealth: any): CfoInsight | null {
    if (reconHealth.status === 'CRITICAL') {
      return {
        category: 'OPERATIONS',
        severity: 'CRITICAL',
        insight: 'Reconciliation exceptions exceeding acceptable thresholds',
        rootCause: 'Financial ledger discrepancies or reconciliation process bottlenecks',
        action: 'Immediate reconciliation review: Investigate exception root causes and clear backlog',
        metricName: 'Reconciliation Health',
        currentValue: 'CRITICAL',
        priority: 85
      }
    }

    if (reconHealth.status === 'WARNING') {
      return {
        category: 'OPERATIONS',
        severity: 'WARNING',
        insight: 'Reconciliation backlog approaching SLA limits',
        rootCause: 'Reconciliation processing capacity constraints or data quality issues',
        action: 'Review reconciliation workflow and allocate resources to clear backlog',
        metricName: 'Reconciliation Health',
        currentValue: 'WARNING',
        priority: 55
      }
    }

    return null
  }

  /**
   * Generate Subscription Growth insight
   */
  private static generateSubscriptionGrowthInsight(subs: any): CfoInsight | null {
    const changePercent = subs.changePercent

    // CRITICAL: Severe subscription decline (>10%)
    if (changePercent < -10) {
      return {
        category: 'REVENUE',
        severity: 'CRITICAL',
        insight: `Active subscriptions declining ${Math.abs(changePercent).toFixed(1)}% month-over-month`,
        rootCause: 'Severe subscription loss indicating systemic customer retention failure',
        action: 'Emergency review: Conduct immediate customer interviews, analyze product issues, and implement aggressive retention programs',
        metricName: 'Active Subscriptions',
        currentValue: subs.count,
        changePercent,
        threshold: -10,
        priority: 90
      }
    }

    // WARNING: Moderate subscription decline (5-10%)
    if (changePercent < -5) {
      return {
        category: 'REVENUE',
        severity: 'WARNING',
        insight: `Active subscriptions declining ${Math.abs(changePercent).toFixed(1)}% month-over-month`,
        rootCause: 'Subscription cancellations exceeding new subscription activations',
        action: 'Analyze cancellation reasons and strengthen subscription retention programs',
        metricName: 'Active Subscriptions',
        currentValue: subs.count,
        changePercent,
        threshold: -5,
        priority: 68
      }
    }

    // POSITIVE: Strong growth
    if (changePercent > 15) {
      return {
        category: 'OPPORTUNITY',
        severity: 'POSITIVE',
        insight: `Active subscriptions growing ${changePercent.toFixed(1)}% month-over-month`,
        rootCause: 'Strong new subscription acquisition momentum',
        action: 'Scale successful acquisition channels and ensure onboarding capacity',
        metricName: 'Active Subscriptions',
        currentValue: subs.count,
        changePercent,
        threshold: 15,
        priority: 38
      }
    }

    return null
  }

  /**
   * Generate metric-specific insights for dashboard sections
   */
  private static generateMRRMetricInsight(mrr: any): CfoMetricInsight {
    const changePercent = mrr.changePercent

    if (changePercent < -5) {
      return {
        metricName: 'MRR',
        insight: 'MRR declining significantly',
        rootCause: 'Churn exceeding new customer acquisition',
        action: 'Emergency retention review required',
        severity: 'CRITICAL'
      }
    }

    if (changePercent < 0) {
      return {
        metricName: 'MRR',
        insight: 'MRR showing negative trend',
        rootCause: 'Customer losses outpacing new subscriptions',
        action: 'Strengthen retention and acquisition programs',
        severity: 'WARNING'
      }
    }

    if (changePercent > 10) {
      return {
        metricName: 'MRR',
        insight: 'MRR growing strongly',
        rootCause: 'Healthy balance of new customers and expansion',
        action: 'Scale successful growth strategies',
        severity: 'POSITIVE'
      }
    }

    return {
      metricName: 'MRR',
      insight: 'MRR growing steadily',
      rootCause: 'Consistent new customer acquisition',
      action: 'Maintain current growth trajectory',
      severity: 'INFO'
    }
  }

  private static generateRevenueChurnMetricInsight(churn: any): CfoMetricInsight {
    const rate = churn.rate

    if (rate > 10) {
      return {
        metricName: 'Revenue Churn',
        insight: 'Churn rate at critical level',
        rootCause: 'Severe customer retention challenges',
        action: 'Immediate intervention required',
        severity: 'CRITICAL'
      }
    }

    if (rate > 5) {
      return {
        metricName: 'Revenue Churn',
        insight: 'Churn rate elevated',
        rootCause: 'Customer retention issues emerging',
        action: 'Strengthen customer success programs',
        severity: 'WARNING'
      }
    }

    return {
      metricName: 'Revenue Churn',
      insight: 'Churn rate healthy',
      rootCause: 'Strong customer retention',
      action: 'Maintain retention best practices',
      severity: 'INFO'
    }
  }

  private static generateNRRMetricInsight(nrr: any): CfoMetricInsight {
    const rate = nrr.rate

    if (rate < 90) {
      return {
        metricName: 'NRR',
        insight: 'Severe revenue leakage detected',
        rootCause: 'High churn with insufficient expansion',
        action: 'Dual focus: Reduce churn AND increase expansion',
        severity: 'CRITICAL'
      }
    }

    if (rate < 100) {
      return {
        metricName: 'NRR',
        insight: 'Revenue contracting from existing customers',
        rootCause: 'Churn exceeding expansion revenue',
        action: 'Focus on expansion and upsell strategies',
        severity: 'WARNING'
      }
    }

    if (rate > 110) {
      return {
        metricName: 'NRR',
        insight: 'Strong expansion revenue',
        rootCause: 'Customers increasing spend',
        action: 'Scale expansion playbook',
        severity: 'POSITIVE'
      }
    }

    return {
      metricName: 'NRR',
      insight: 'Revenue retention stable',
      rootCause: 'Balanced retention and expansion',
      action: 'Maintain current strategies',
      severity: 'INFO'
    }
  }

  private static generateConcentrationMetricInsight(concentration: any): CfoMetricInsight {
    const rate = concentration.rate

    if (rate > 50) {
      return {
        metricName: 'Revenue Concentration',
        insight: 'Existential concentration risk',
        rootCause: 'Over-dependence on few customers',
        action: 'Urgent diversification required',
        severity: 'CRITICAL'
      }
    }

    if (rate > 40) {
      return {
        metricName: 'Revenue Concentration',
        insight: 'Concentration risk elevated',
        rootCause: 'Insufficient customer diversification',
        action: 'Begin diversification initiatives',
        severity: 'WARNING'
      }
    }

    return {
      metricName: 'Revenue Concentration',
      insight: 'Customer portfolio well-diversified',
      rootCause: 'Balanced customer base',
      action: 'Maintain diversification',
      severity: 'INFO'
    }
  }

  private static generateOperationsMetricInsight(operations: any): CfoMetricInsight {
    const paymentRate = operations.paymentHealth.successRate
    const reconStatus = operations.reconciliationHealth.status

    if (paymentRate < 90 || reconStatus === 'CRITICAL') {
      return {
        metricName: 'Financial Operations',
        insight: 'Critical operational issues detected',
        rootCause: 'Payment or reconciliation system problems',
        action: 'Immediate operational review required',
        severity: 'CRITICAL'
      }
    }

    if (paymentRate < 95 || reconStatus === 'WARNING') {
      return {
        metricName: 'Financial Operations',
        insight: 'Operational efficiency below target',
        rootCause: 'Payment failures or reconciliation backlog',
        action: 'Monitor and address operational bottlenecks',
        severity: 'WARNING'
      }
    }

    return {
      metricName: 'Financial Operations',
      insight: 'Operations performing within targets',
      rootCause: 'Healthy payment and reconciliation systems',
      action: 'Maintain operational excellence',
      severity: 'INFO'
    }
  }
}
