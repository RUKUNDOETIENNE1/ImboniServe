/**
 * Financial Priorities Service
 * 
 * Purpose: Deterministic priority engine for CFO Dashboard
 * This is the HIGHEST-VALUE component of the CFO Dashboard
 * 
 * Answers the question: "What requires CFO intervention this week?"
 * 
 * Design Philosophy:
 * - Pure deterministic logic (no AI/ML)
 * - Threshold-based priority assignment
 * - Actionable recommendations
 * - Clear escalation paths
 * 
 * Priority Levels:
 * - CRITICAL: Immediate action required (revenue risk, compliance)
 * - HIGH: Action required this week (operational risk)
 * - MEDIUM: Monitor closely (emerging trends)
 * - LOW: Opportunity (growth signals)
 * - INFO: Monitoring (all metrics healthy)
 */

import { FinancialHealthService } from './financial-health.service'
import { RevenueIntelligenceService } from './revenue-intelligence.service'
import { PaymentWatchdogService } from '../watchdog/payment-watchdog.service'
import { ReconciliationWatchdogService } from '../watchdog/reconciliation-watchdog.service'
import { SubscriptionWatchdogService } from '../watchdog/subscription-watchdog.service'

export type PriorityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO'

export interface FinancialPriority {
  level: PriorityLevel
  category: 'REVENUE_RISK' | 'SUBSCRIPTION_RISK' | 'OPERATIONAL_RISK' | 'GROWTH_OPPORTUNITY' | 'MONITORING'
  title: string
  description: string
  metricValue: string
  threshold: string
  trend: string
  action: string
  severity: number // 1-100 for sorting
}

export class FinancialPrioritiesService {
  /**
   * Generate top 5 financial priorities for CFO
   * Returns priorities sorted by severity (highest first)
   */
  static async getTopPriorities(limit: number = 5): Promise<FinancialPriority[]> {
    // Fetch all required data in parallel
    const [
      financialHealth,
      revenueIntelligence,
      paymentHealth,
      reconciliationHealth,
      subscriptionHealth
    ] = await Promise.all([
      FinancialHealthService.getMetrics(),
      RevenueIntelligenceService.getIntelligence('last30d'),
      PaymentWatchdogService.getHealth(),
      ReconciliationWatchdogService.getHealth(),
      SubscriptionWatchdogService.getHealth()
    ])

    const priorities: FinancialPriority[] = []

    // === CRITICAL PRIORITIES (Revenue Risk) ===

    // Priority 1: Revenue Concentration Risk
    // Per KPI_CATALOG_V2.md line 286: CRITICAL > 50%, WARN > 40%
    if (revenueIntelligence.concentration.rate > 50) {
      priorities.push({
        level: 'CRITICAL',
        category: 'REVENUE_RISK',
        title: 'Revenue Concentration Exceeds Safe Threshold',
        description: 'Top 10 customers represent majority of revenue, creating significant business risk',
        metricValue: `${revenueIntelligence.concentration.rate.toFixed(1)}%`,
        threshold: '50%',
        trend: revenueIntelligence.concentration.rate > 55 ? '↑ Increasing' : '→ Stable',
        action: 'Diversify customer base immediately. Reduce dependency on top 3 customers. Implement customer acquisition strategy.',
        severity: 95
      })
    } else if (revenueIntelligence.concentration.rate > 40) {
      priorities.push({
        level: 'HIGH',
        category: 'REVENUE_RISK',
        title: 'Revenue Concentration Warning',
        description: 'Revenue concentration approaching critical threshold',
        metricValue: `${revenueIntelligence.concentration.rate.toFixed(1)}%`,
        threshold: '40%',
        trend: '⚠️ Warning',
        action: 'Monitor concentration closely. Begin customer diversification initiatives.',
        severity: 75
      })
    }

    // Priority 2: Revenue Churn Rate
    if (financialHealth.revenueChurn.status === 'CRITICAL') {
      priorities.push({
        level: 'CRITICAL',
        category: 'REVENUE_RISK',
        title: 'Revenue Churn Rate Critical',
        description: 'Monthly recurring revenue loss exceeds acceptable threshold',
        metricValue: `${financialHealth.revenueChurn.rate.toFixed(1)}%`,
        threshold: '10%',
        trend: '🔴 Critical',
        action: 'Immediate customer retention intervention required. Analyze churn reasons. Implement win-back campaigns.',
        severity: 90
      })
    } else if (financialHealth.revenueChurn.status === 'WARNING') {
      priorities.push({
        level: 'HIGH',
        category: 'REVENUE_RISK',
        title: 'Revenue Churn Rate Elevated',
        description: 'Revenue churn trending above target',
        metricValue: `${financialHealth.revenueChurn.rate.toFixed(1)}%`,
        threshold: '5%',
        trend: '⚠️ Warning',
        action: 'Review customer satisfaction metrics. Identify at-risk accounts. Strengthen retention programs.',
        severity: 70
      })
    }

    // Priority 3: MRR Decline
    if (financialHealth.mrr.status === 'DECLINE' && financialHealth.mrr.changePercent < -5) {
      priorities.push({
        level: 'CRITICAL',
        category: 'REVENUE_RISK',
        title: 'MRR Declining Significantly',
        description: 'Monthly recurring revenue showing sustained decline',
        metricValue: `${financialHealth.mrr.changePercent.toFixed(1)}%`,
        threshold: '-5%',
        trend: '📉 Declining',
        action: 'Emergency revenue review required. Analyze subscription cancellations. Implement retention strategy.',
        severity: 92
      })
    } else if (financialHealth.mrr.status === 'DECLINE') {
      priorities.push({
        level: 'HIGH',
        category: 'REVENUE_RISK',
        title: 'MRR Decline Detected',
        description: 'Monthly recurring revenue trending downward',
        metricValue: `${financialHealth.mrr.changePercent.toFixed(1)}%`,
        threshold: '-2%',
        trend: '↓ Declining',
        action: 'Investigate revenue decline causes. Review pricing strategy. Assess competitive threats.',
        severity: 72
      })
    }

    // Priority 4: Net Revenue Retention
    if (financialHealth.netRevenueRetention.status === 'CRITICAL') {
      priorities.push({
        level: 'CRITICAL',
        category: 'REVENUE_RISK',
        title: 'Net Revenue Retention Below 90%',
        description: 'Existing customer revenue shrinking faster than expanding',
        metricValue: `${financialHealth.netRevenueRetention.rate.toFixed(1)}%`,
        threshold: '90%',
        trend: '🔴 Critical',
        action: 'Urgent customer success intervention. Reduce contraction and churn. Increase expansion revenue.',
        severity: 88
      })
    } else if (financialHealth.netRevenueRetention.status === 'WARNING') {
      priorities.push({
        level: 'HIGH',
        category: 'REVENUE_RISK',
        title: 'Net Revenue Retention Below Target',
        description: 'NRR below 100% indicates net customer revenue loss',
        metricValue: `${financialHealth.netRevenueRetention.rate.toFixed(1)}%`,
        threshold: '100%',
        trend: '⚠️ Warning',
        action: 'Focus on customer expansion. Reduce downgrades. Improve product value delivery.',
        severity: 68
      })
    }

    // === HIGH PRIORITIES (Subscription Risk) ===

    // Priority 5: Subscription Health
    if (subscriptionHealth.status === 'CRITICAL') {
      priorities.push({
        level: 'HIGH',
        category: 'SUBSCRIPTION_RISK',
        title: 'Subscription Health Critical',
        description: 'Grace period subscriptions or failed renewals exceeding thresholds',
        metricValue: subscriptionHealth.status,
        threshold: 'HEALTHY',
        trend: '🔴 Critical',
        action: 'Review grace period accounts. Address payment failures. Implement proactive renewal outreach.',
        severity: 78
      })
    } else if (subscriptionHealth.status === 'WARNING') {
      priorities.push({
        level: 'MEDIUM',
        category: 'SUBSCRIPTION_RISK',
        title: 'Subscription Health Warning',
        description: 'Subscription metrics showing early warning signs',
        metricValue: subscriptionHealth.status,
        threshold: 'HEALTHY',
        trend: '⚠️ Warning',
        action: 'Monitor grace period aging. Improve renewal communication. Check payment method health.',
        severity: 55
      })
    }

    // === MEDIUM PRIORITIES (Operational Risk) ===

    // Priority 6: Reconciliation Health
    if (reconciliationHealth.status === 'CRITICAL') {
      priorities.push({
        level: 'MEDIUM',
        category: 'OPERATIONAL_RISK',
        title: 'Reconciliation Backlog Critical',
        description: 'Financial reconciliation exceptions require immediate attention',
        metricValue: reconciliationHealth.status,
        threshold: 'HEALTHY',
        trend: '🔴 Critical',
        action: 'Clear reconciliation backlog. Investigate reconciliation failures. Improve automation.',
        severity: 65
      })
    } else if (reconciliationHealth.status === 'WARNING') {
      priorities.push({
        level: 'MEDIUM',
        category: 'OPERATIONAL_RISK',
        title: 'Reconciliation Backlog Warning',
        description: 'Reconciliation backlog approaching SLA threshold',
        metricValue: reconciliationHealth.status,
        threshold: 'HEALTHY',
        trend: '⚠️ Warning',
        action: 'Allocate finance team resources. Review reconciliation process efficiency.',
        severity: 50
      })
    }

    // Priority 7: Payment Operations
    if (paymentHealth.status === 'CRITICAL') {
      priorities.push({
        level: 'MEDIUM',
        category: 'OPERATIONAL_RISK',
        title: 'Payment Operations Critical',
        description: 'Payment provider failures or high failure rates detected',
        metricValue: paymentHealth.status,
        threshold: 'HEALTHY',
        trend: '🔴 Critical',
        action: 'Contact payment providers. Review failure patterns. Implement fallback payment methods.',
        severity: 62
      })
    } else if (paymentHealth.status === 'WARNING') {
      priorities.push({
        level: 'MEDIUM',
        category: 'OPERATIONAL_RISK',
        title: 'Payment Operations Warning',
        description: 'Payment success rate below target',
        metricValue: paymentHealth.status,
        threshold: 'HEALTHY',
        trend: '⚠️ Warning',
        action: 'Monitor payment provider health. Review payment retry logic. Check customer payment methods.',
        severity: 48
      })
    }

    // === LOW PRIORITIES (Growth Opportunities) ===

    // Priority 8: Strong Revenue Growth
    if (financialHealth.revenueGrowth.status === 'STRONG') {
      priorities.push({
        level: 'LOW',
        category: 'GROWTH_OPPORTUNITY',
        title: 'Strong Revenue Growth Momentum',
        description: 'Revenue growing above 10% - opportunity to accelerate',
        metricValue: `${financialHealth.revenueGrowth.rate30d.toFixed(1)}%`,
        threshold: '10%',
        trend: '📈 Strong Growth',
        action: 'Capitalize on growth momentum. Increase marketing investment. Scale successful channels.',
        severity: 30
      })
    }

    // Priority 9: Expansion Revenue Opportunity
    if (financialHealth.netRevenueRetention.rate >= 110) {
      priorities.push({
        level: 'LOW',
        category: 'GROWTH_OPPORTUNITY',
        title: 'Excellent Expansion Revenue',
        description: 'Existing customers expanding spend - strong product-market fit signal',
        metricValue: `${financialHealth.netRevenueRetention.rate.toFixed(1)}%`,
        threshold: '110%',
        trend: '✅ Excellent',
        action: 'Document expansion playbook. Replicate success patterns. Invest in customer success.',
        severity: 25
      })
    }

    // Priority 10: New Customer Revenue Growth
    if (revenueIntelligence.drivers.newCustomerRevenue > 0) {
      const newCustomerPercent = (revenueIntelligence.drivers.newCustomerRevenue / revenueIntelligence.bySource.total) * 100
      if (newCustomerPercent > 20) {
        priorities.push({
          level: 'LOW',
          category: 'GROWTH_OPPORTUNITY',
          title: 'Strong New Customer Acquisition',
          description: 'New customer revenue represents significant growth driver',
          metricValue: `${newCustomerPercent.toFixed(1)}%`,
          threshold: '20%',
          trend: '📈 Growing',
          action: 'Scale customer acquisition channels. Optimize onboarding. Improve activation rates.',
          severity: 28
        })
      }
    }

    // === INFO PRIORITIES (Monitoring) ===

    // Priority 11: All Metrics Healthy
    if (priorities.length === 0) {
      priorities.push({
        level: 'INFO',
        category: 'MONITORING',
        title: 'Financial Metrics Within Targets',
        description: 'All key financial indicators performing within acceptable ranges',
        metricValue: 'All Healthy',
        threshold: 'N/A',
        trend: '✅ On Track',
        action: 'Continue monitoring. Maintain current strategies. Focus on optimization opportunities.',
        severity: 10
      })
    }

    // Sort by severity (highest first) and return top N
    return priorities
      .sort((a, b) => b.severity - a.severity)
      .slice(0, limit)
  }

  /**
   * Get priority count by level
   * Useful for dashboard summary
   */
  static async getPriorityCounts(): Promise<{
    critical: number
    high: number
    medium: number
    low: number
    info: number
  }> {
    const priorities = await this.getTopPriorities(20) // Get more for counting
    
    return {
      critical: priorities.filter(p => p.level === 'CRITICAL').length,
      high: priorities.filter(p => p.level === 'HIGH').length,
      medium: priorities.filter(p => p.level === 'MEDIUM').length,
      low: priorities.filter(p => p.level === 'LOW').length,
      info: priorities.filter(p => p.level === 'INFO').length
    }
  }

  /**
   * Get priorities by category
   * Useful for category-specific views
   */
  static async getPrioritiesByCategory(category: FinancialPriority['category']): Promise<FinancialPriority[]> {
    const allPriorities = await this.getTopPriorities(20)
    return allPriorities.filter(p => p.category === category)
  }
}
