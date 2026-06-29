/**
 * CFO Signal Correlation Service
 * 
 * Purpose: Detect cross-domain patterns and correlations across financial systems
 * 
 * This service identifies relationships between:
 * - Revenue metrics
 * - Operational health
 * - Subscription dynamics
 * - Payment systems
 * 
 * Design Philosophy:
 * - ONLY rule-based correlations (no ML)
 * - Deterministic pattern detection
 * - Cross-watchdog intelligence
 * - Early warning system
 */

import { FinancialHealthService } from './financial-health.service'
import { RevenueIntelligenceService } from './revenue-intelligence.service'
import { SubscriptionIntelligenceService } from './subscription-intelligence.service'
import { FinancialOperationsService } from './financial-operations.service'
import { PaymentWatchdogService } from '../watchdog/payment-watchdog.service'
import { ReconciliationWatchdogService } from '../watchdog/reconciliation-watchdog.service'

export type CorrelationSeverity = 'CRITICAL' | 'WARNING' | 'INFO' | 'POSITIVE'
export type CorrelationPattern = 
  | 'REVENUE_RETENTION_CRISIS'
  | 'PAYMENT_SYSTEM_ISSUE'
  | 'CONCENTRATION_CHURN_RISK'
  | 'OPERATIONAL_BOTTLENECK'
  | 'GROWTH_ACCELERATION'
  | 'REVENUE_LEAKAGE'

export interface SignalCorrelation {
  pattern: CorrelationPattern
  severity: CorrelationSeverity
  title: string
  description: string
  signals: string[]         // Which signals are correlated
  hypothesis: string        // Why this correlation matters
  action: string           // What to do about it
  priority: number         // 1-100 for sorting
}

export class CfoSignalCorrelationService {
  /**
   * Detect cross-system correlations and patterns
   */
  static async detectCorrelations(): Promise<SignalCorrelation[]> {
    // Fetch all system health data in parallel
    const [
      financialHealth,
      revenueIntel,
      subscriptionIntel,
      operations,
      paymentHealth,
      reconHealth
    ] = await Promise.all([
      FinancialHealthService.getMetrics(),
      RevenueIntelligenceService.getIntelligence('last30d'),
      SubscriptionIntelligenceService.getIntelligence(),
      FinancialOperationsService.getIntelligence(),
      PaymentWatchdogService.getHealth(),
      ReconciliationWatchdogService.getHealth()
    ])

    const correlations: SignalCorrelation[] = []

    // === PATTERN 1: Revenue + Retention Crisis ===
    // MRR declining + High churn + NRR < 100%
    if (
      financialHealth.mrr.changePercent < -5 &&
      financialHealth.revenueChurn.rate > 7 &&
      financialHealth.netRevenueRetention.rate < 100
    ) {
      correlations.push({
        pattern: 'REVENUE_RETENTION_CRISIS',
        severity: 'CRITICAL',
        title: 'Revenue Retention Crisis Detected',
        description: 'Multiple revenue and retention metrics showing simultaneous deterioration',
        signals: [
          `MRR declining ${Math.abs(financialHealth.mrr.changePercent).toFixed(1)}%`,
          `Revenue churn at ${financialHealth.revenueChurn.rate.toFixed(1)}%`,
          `NRR below 100% at ${financialHealth.netRevenueRetention.rate.toFixed(1)}%`
        ],
        hypothesis: 'Systemic customer retention problem: Customers are leaving faster than new customers are acquired, AND existing customers are not expanding their spend. This indicates fundamental product-market fit or customer satisfaction issues.',
        action: 'Emergency executive review required: Conduct immediate customer interviews, analyze churn reasons, review product roadmap alignment with customer needs, and implement aggressive retention programs.',
        priority: 98
      })
    }

    // === PATTERN 2: Payment System Issue ===
    // Payment success rate low + Queue backlog high
    if (
      operations.paymentHealth.successRate < 90 ||
      paymentHealth.status === 'CRITICAL'
    ) {
      correlations.push({
        pattern: 'PAYMENT_SYSTEM_ISSUE',
        severity: 'CRITICAL',
        title: 'Systemic Payment Processing Problem',
        description: 'Payment failures at critical levels correlating with processing issues',
        signals: [
          `Payment success rate at ${operations.paymentHealth.successRate.toFixed(1)}%`,
          `Payment watchdog status: ${paymentHealth.status}`
        ],
        hypothesis: 'Payment provider reliability issues or payment processing infrastructure problems causing revenue collection failures. This is likely a technical issue, not a customer issue.',
        action: 'Immediate technical investigation: Review payment provider status, analyze failure error codes, check processing queue health, and consider failover to backup payment provider if available.',
        priority: 95
      })
    } else if (
      operations.paymentHealth.successRate < 95 &&
      paymentHealth.status === 'WARNING'
    ) {
      correlations.push({
        pattern: 'PAYMENT_SYSTEM_ISSUE',
        severity: 'WARNING',
        title: 'Payment Processing Degradation',
        description: 'Payment success rate below target with processing issues',
        signals: [
          `Payment success rate at ${operations.paymentHealth.successRate.toFixed(1)}%`,
          `Payment watchdog status: ${paymentHealth.status}`
        ],
        hypothesis: 'Payment processing showing early signs of degradation. May indicate provider issues or increased payment failures.',
        action: 'Monitor closely: Review payment failure patterns, check provider status, and prepare contingency plans.',
        priority: 75
      })
    }

    // === PATTERN 3: Concentration + Churn Risk ===
    // High concentration + Elevated churn
    if (
      revenueIntel.concentration.rate > 45 &&
      financialHealth.revenueChurn.rate > 5
    ) {
      correlations.push({
        pattern: 'CONCENTRATION_CHURN_RISK',
        severity: 'CRITICAL',
        title: 'Concentration Risk Amplified by Churn',
        description: 'Revenue concentration combined with elevated churn creates compounded risk',
        signals: [
          `Revenue concentration at ${revenueIntel.concentration.rate.toFixed(1)}%`,
          `Revenue churn at ${financialHealth.revenueChurn.rate.toFixed(1)}%`
        ],
        hypothesis: 'High revenue concentration means losing even one top customer could be catastrophic. Current churn rate suggests this risk is not theoretical - customers ARE leaving. If a top-10 customer churns, revenue impact will be severe.',
        action: 'Dual-track urgent action: (1) Immediately engage top 10 customers to ensure satisfaction and retention, (2) Accelerate customer diversification to reduce concentration risk before a major customer loss occurs.',
        priority: 96
      })
    }

    // === PATTERN 4: Operational Bottleneck ===
    // Reconciliation issues + Payment issues
    if (
      reconHealth.status === 'WARNING' &&
      operations.paymentHealth.successRate < 95
    ) {
      correlations.push({
        pattern: 'OPERATIONAL_BOTTLENECK',
        severity: 'WARNING',
        title: 'Financial Operations Bottleneck',
        description: 'Multiple operational systems showing degraded performance',
        signals: [
          `Reconciliation status: ${reconHealth.status}`,
          `Payment success rate: ${operations.paymentHealth.successRate.toFixed(1)}%`
        ],
        hypothesis: 'Operational capacity constraints or data quality issues affecting multiple financial systems. This suggests infrastructure or process problems rather than isolated issues.',
        action: 'Operational review: Assess reconciliation workflow capacity, review payment processing infrastructure, and allocate resources to clear backlogs and improve system reliability.',
        priority: 72
      })
    }

    // === PATTERN 5: Growth Acceleration ===
    // MRR growing + Subscriptions growing + NRR > 100%
    if (
      financialHealth.mrr.changePercent > 10 &&
      subscriptionIntel.activeSubscriptions.changePercent > 10 &&
      financialHealth.netRevenueRetention.rate > 100
    ) {
      correlations.push({
        pattern: 'GROWTH_ACCELERATION',
        severity: 'POSITIVE',
        title: 'Strong Growth Momentum Detected',
        description: 'Multiple growth indicators showing positive acceleration',
        signals: [
          `MRR growing ${financialHealth.mrr.changePercent.toFixed(1)}%`,
          `Active subscriptions up ${subscriptionIntel.activeSubscriptions.changePercent.toFixed(1)}%`,
          `NRR at ${financialHealth.netRevenueRetention.rate.toFixed(1)}%`
        ],
        hypothesis: 'Healthy growth flywheel: New customer acquisition is strong, existing customers are expanding their spend, and retention is solid. This indicates strong product-market fit and effective go-to-market strategy.',
        action: 'Capitalize on momentum: Document and scale successful acquisition channels, replicate expansion strategies across customer base, and ensure operational capacity to support continued growth.',
        priority: 45
      })
    }

    // === PATTERN 6: Revenue Leakage ===
    // Payment failures + Reconciliation issues
    if (
      operations.paymentHealth.successRate < 93 &&
      reconHealth.status !== 'HEALTHY'
    ) {
      correlations.push({
        pattern: 'REVENUE_LEAKAGE',
        severity: 'WARNING',
        title: 'Revenue Collection Efficiency Issues',
        description: 'Payment and reconciliation problems causing revenue leakage',
        signals: [
          `Payment success rate: ${operations.paymentHealth.successRate.toFixed(1)}%`,
          `Reconciliation status: ${reconHealth.status}`
        ],
        hypothesis: 'Revenue is being earned but not efficiently collected or reconciled. Payment failures mean customers want to pay but cannot, and reconciliation issues mean revenue may be unaccounted for.',
        action: 'Revenue operations review: Implement payment retry strategies, improve payment method management, and streamline reconciliation processes to capture all earned revenue.',
        priority: 78
      })
    }

    // === PATTERN 7: Subscription Decline + Revenue Stable ===
    // Subscriptions declining but MRR stable/growing
    if (
      subscriptionIntel.activeSubscriptions.changePercent < -3 &&
      financialHealth.mrr.changePercent > 0
    ) {
      correlations.push({
        pattern: 'GROWTH_ACCELERATION',
        severity: 'INFO',
        title: 'Revenue Quality Improving',
        description: 'Fewer subscriptions generating more revenue indicates customer value expansion',
        signals: [
          `Active subscriptions down ${Math.abs(subscriptionIntel.activeSubscriptions.changePercent).toFixed(1)}%`,
          `MRR growing ${financialHealth.mrr.changePercent.toFixed(1)}%`
        ],
        hypothesis: 'Customer base is becoming more valuable: Losing low-value customers while retaining and expanding high-value customers. This is healthy customer portfolio optimization.',
        action: 'Continue customer value optimization: Focus retention efforts on high-value segments and allow natural attrition of low-value customers. Monitor to ensure this trend is intentional, not accidental.',
        priority: 50
      })
    }

    // === PATTERN 8: Concentration Increasing ===
    // Concentration high + New customer growth low
    if (
      revenueIntel.concentration.rate > 40 &&
      subscriptionIntel.activeSubscriptions.changePercent < 5
    ) {
      correlations.push({
        pattern: 'CONCENTRATION_CHURN_RISK',
        severity: 'WARNING',
        title: 'Concentration Risk Increasing',
        description: 'Revenue concentration high while new customer acquisition slowing',
        signals: [
          `Revenue concentration at ${revenueIntel.concentration.rate.toFixed(1)}%`,
          `Subscription growth at ${subscriptionIntel.activeSubscriptions.changePercent.toFixed(1)}%`
        ],
        hypothesis: 'Customer base not diversifying fast enough. Slow new customer acquisition means concentration risk is not being diluted, leaving business vulnerable to top customer losses.',
        action: 'Accelerate customer acquisition: Launch targeted campaigns to acquire customers in new segments and reduce dependency on existing top customers.',
        priority: 74
      })
    }

    // Sort by priority (highest first)
    return correlations.sort((a, b) => b.priority - a.priority)
  }

  /**
   * Get top 3 cross-system risks
   */
  static async getTopRisks(): Promise<SignalCorrelation[]> {
    const correlations = await this.detectCorrelations()
    return correlations
      .filter(c => c.severity === 'CRITICAL' || c.severity === 'WARNING')
      .slice(0, 3)
  }

  /**
   * Get opportunities (positive correlations)
   */
  static async getOpportunities(): Promise<SignalCorrelation[]> {
    const correlations = await this.detectCorrelations()
    return correlations
      .filter(c => c.severity === 'INFO' && c.pattern === 'GROWTH_ACCELERATION')
      .slice(0, 2)
  }

  /**
   * Get most urgent action
   */
  static async getUrgentAction(): Promise<SignalCorrelation | null> {
    const correlations = await this.detectCorrelations()
    const critical = correlations.filter(c => c.severity === 'CRITICAL')
    return critical.length > 0 ? critical[0] : null
  }
}
