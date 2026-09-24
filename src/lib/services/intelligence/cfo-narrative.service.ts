/**
 * CFO Narrative Service
 * 
 * Purpose: Generate plain-English CFO interpretation boxes for dashboard sections
 * 
 * This service converts technical metrics into boardroom-ready narratives
 * 
 * Design Philosophy:
 * - Maximum 2-3 lines per narrative
 * - Zero technical jargon
 * - Deterministic templates
 * - Executive-friendly language
 * - Actionable context
 */

import { FinancialHealthService } from './financial-health.service'
import { RevenueIntelligenceService } from './revenue-intelligence.service'
import { SubscriptionIntelligenceService } from './subscription-intelligence.service'
import { FinancialOperationsService } from './financial-operations.service'

export interface CfoNarrative {
  section: string
  narrative: string        // 2-3 lines max, plain English
  tone: 'CRITICAL' | 'WARNING' | 'NEUTRAL' | 'POSITIVE'
}

export class CfoNarrativeService {
  /**
   * Generate CFO narratives for all dashboard sections
   */
  static async generateNarratives(): Promise<{
    financialHealth: CfoNarrative
    revenueIntelligence: CfoNarrative
    subscriptionIntelligence: CfoNarrative
    operations: CfoNarrative
    priorities: CfoNarrative
  }> {
    const [financialHealth, revenueIntel, subscriptionIntel, operations] = await Promise.all([
      FinancialHealthService.getMetrics(),
      RevenueIntelligenceService.getIntelligence('last30d'),
      SubscriptionIntelligenceService.getIntelligence(),
      FinancialOperationsService.getIntelligence()
    ])

    return {
      financialHealth: this.generateFinancialHealthNarrative(financialHealth),
      revenueIntelligence: this.generateRevenueIntelligenceNarrative(revenueIntel),
      subscriptionIntelligence: this.generateSubscriptionIntelligenceNarrative(subscriptionIntel),
      operations: this.generateOperationsNarrative(operations),
      priorities: this.generatePrioritiesNarrative(financialHealth, revenueIntel)
    }
  }

  /**
   * Financial Health narrative
   */
  private static generateFinancialHealthNarrative(health: any): CfoNarrative {
    const mrrChange = health.mrr.changePercent
    const churnRate = health.revenueChurn.rate
    const nrr = health.netRevenueRetention.rate

    // CRITICAL: Multiple red flags
    if (mrrChange < -5 || churnRate > 10 || nrr < 90) {
      return {
        section: 'Financial Health',
        narrative: `Your recurring revenue engine is under significant stress. ${
          mrrChange < -5 ? `Monthly revenue is declining ${Math.abs(mrrChange).toFixed(1)}%.` : ''
        } ${
          churnRate > 10 ? `Customer churn is at critical levels (${churnRate.toFixed(1)}%).` : ''
        } ${
          nrr < 90 ? `Existing customers are spending less, not more.` : ''
        } This requires immediate executive attention.`,
        tone: 'CRITICAL'
      }
    }

    // WARNING: Some concerns
    if (mrrChange < 0 || churnRate > 5 || nrr < 100) {
      return {
        section: 'Financial Health',
        narrative: `Your recurring revenue shows warning signs. ${
          mrrChange < 0 ? `Monthly revenue growth has stalled.` : ''
        } ${
          churnRate > 5 ? `Customer retention needs improvement (${churnRate.toFixed(1)}% churn).` : ''
        } ${
          nrr < 100 ? `Existing customers are not expanding their spend enough to offset losses.` : ''
        } Focus on retention and expansion strategies.`,
        tone: 'WARNING'
      }
    }

    // POSITIVE: Strong performance
    if (mrrChange > 10 && nrr > 110) {
      return {
        section: 'Financial Health',
        narrative: `Your recurring revenue engine is firing on all cylinders. Monthly revenue is growing ${mrrChange.toFixed(1)}%, existing customers are expanding their spend (${nrr.toFixed(1)}% NRR), and retention is strong. This momentum should be documented and scaled.`,
        tone: 'POSITIVE'
      }
    }

    // NEUTRAL: Stable
    return {
      section: 'Financial Health',
      narrative: `Your recurring revenue is stable and healthy. Monthly revenue is growing ${mrrChange.toFixed(1)}%, customer retention is solid (${churnRate.toFixed(1)}% churn), and existing customers are maintaining their spend levels. Continue current strategies while looking for expansion opportunities.`,
      tone: 'NEUTRAL'
    }
  }

  /**
   * Revenue Intelligence narrative
   */
  private static generateRevenueIntelligenceNarrative(revenue: any): CfoNarrative {
    const concentration = revenue.concentration.rate
    const topCustomerRevenue = revenue.concentration.topCustomers

    // CRITICAL: High concentration
    if (concentration > 50) {
      return {
        section: 'Revenue Intelligence',
        narrative: `Your business has dangerous revenue concentration. ${concentration.toFixed(1)}% of revenue comes from just 10 customers. Losing even one top customer could be catastrophic. Customer diversification is not optional—it's an existential priority.`,
        tone: 'CRITICAL'
      }
    }

    // WARNING: Elevated concentration
    if (concentration > 40) {
      return {
        section: 'Revenue Intelligence',
        narrative: `Your revenue is becoming too concentrated. ${concentration.toFixed(1)}% comes from your top 10 customers, creating significant business risk. You need to diversify your customer base before this becomes a crisis. Start targeting new customer segments now.`,
        tone: 'WARNING'
      }
    }

    // POSITIVE: Well-diversified
    if (concentration < 30) {
      return {
        section: 'Revenue Intelligence',
        narrative: `Your customer portfolio is well-diversified. Only ${concentration.toFixed(1)}% of revenue comes from your top 10 customers, which means you're not overly dependent on any single customer. This is a healthy risk profile. Maintain this balance as you grow.`,
        tone: 'POSITIVE'
      }
    }

    // NEUTRAL: Moderate concentration
    return {
      section: 'Revenue Intelligence',
      narrative: `Your revenue concentration is moderate at ${concentration.toFixed(1)}% from top 10 customers. This is manageable but should be monitored. Continue balanced customer acquisition to prevent concentration from increasing as you grow.`,
      tone: 'NEUTRAL'
    }
  }

  /**
   * Subscription Intelligence narrative
   */
  private static generateSubscriptionIntelligenceNarrative(subs: any): CfoNarrative {
    const subChange = subs.activeSubscriptions.changePercent
    const netMRRChange = subs.dynamics.netChange

    // WARNING: Subscriptions declining
    if (subChange < -5) {
      return {
        section: 'Subscription Intelligence',
        narrative: `Your subscription base is shrinking. Active subscriptions are down ${Math.abs(subChange).toFixed(1)}% this month. Customers are canceling faster than you're acquiring new ones. You need to understand why customers are leaving and fix those issues immediately.`,
        tone: 'WARNING'
      }
    }

    // POSITIVE: Strong growth
    if (subChange > 15) {
      return {
        section: 'Subscription Intelligence',
        narrative: `Your subscription growth is accelerating. Active subscriptions are up ${subChange.toFixed(1)}% this month. This is strong momentum. Make sure your onboarding and customer success teams can handle this growth without quality degradation.`,
        tone: 'POSITIVE'
      }
    }

    // NEUTRAL: Stable growth
    if (subChange > 0) {
      return {
        section: 'Subscription Intelligence',
        narrative: `Your subscription base is growing steadily at ${subChange.toFixed(1)}% per month. This is healthy, sustainable growth. Focus on maintaining this trajectory while improving customer lifetime value through expansion and retention.`,
        tone: 'NEUTRAL'
      }
    }

    // NEUTRAL: Flat
    return {
      section: 'Subscription Intelligence',
      narrative: `Your subscription count is relatively flat this month. New subscriptions are roughly matching cancellations. This is stable but not growing. Consider whether this is intentional (customer quality focus) or a signal to strengthen acquisition efforts.`,
      tone: 'NEUTRAL'
    }
  }

  /**
   * Operations narrative
   */
  private static generateOperationsNarrative(ops: any): CfoNarrative {
    const paymentRate = ops.paymentHealth.successRate
    const reconStatus = ops.reconciliationHealth.status

    // CRITICAL: Major operational issues
    if (paymentRate < 90 || reconStatus === 'CRITICAL') {
      return {
        section: 'Financial Operations',
        narrative: `Your financial operations have critical issues. ${
          paymentRate < 90 ? `Only ${paymentRate.toFixed(1)}% of payments are succeeding—you're losing revenue to technical failures.` : ''
        } ${
          reconStatus === 'CRITICAL' ? `Reconciliation is broken, meaning you don't have accurate financial records.` : ''
        } This needs immediate technical intervention.`,
        tone: 'CRITICAL'
      }
    }

    // WARNING: Operational degradation
    if (paymentRate < 95 || reconStatus === 'WARNING') {
      return {
        section: 'Financial Operations',
        narrative: `Your financial operations are showing strain. ${
          paymentRate < 95 ? `Payment success rate is below target at ${paymentRate.toFixed(1)}%.` : ''
        } ${
          reconStatus === 'WARNING' ? `Reconciliation is falling behind.` : ''
        } These issues are costing you revenue and creating financial reporting risk. Address them before they become critical.`,
        tone: 'WARNING'
      }
    }

    // POSITIVE: Healthy operations
    return {
      section: 'Financial Operations',
      narrative: `Your financial operations are running smoothly. Payment processing is reliable (${paymentRate.toFixed(1)}% success rate), and reconciliation is current. This operational excellence is the foundation for accurate financial reporting and efficient revenue collection.`,
      tone: 'POSITIVE'
    }
  }

  /**
   * Priorities narrative
   */
  private static generatePrioritiesNarrative(health: any, revenue: any): CfoNarrative {
    const concentration = revenue.concentration.rate
    const churnRate = health.revenueChurn.rate
    const mrrChange = health.mrr.changePercent

    // CRITICAL: Multiple urgent priorities
    if (concentration > 50 || churnRate > 10 || mrrChange < -5) {
      return {
        section: 'Financial Priorities',
        narrative: `You have multiple critical financial priorities requiring immediate action. These are not "nice to have" improvements—they are existential business risks. The priorities below are ranked by urgency and potential impact. Start with the top item today.`,
        tone: 'CRITICAL'
      }
    }

    // WARNING: Important priorities
    if (concentration > 40 || churnRate > 5 || mrrChange < 0) {
      return {
        section: 'Financial Priorities',
        narrative: `Your financial priorities highlight areas that need attention before they become crises. These are early warning signals that should be addressed proactively. The priorities below are ranked by severity—tackle them in order.`,
        tone: 'WARNING'
      }
    }

    // POSITIVE: Optimization priorities
    return {
      section: 'Financial Priorities',
      narrative: `Your financial fundamentals are strong. The priorities below are optimization opportunities to make a good situation even better. Focus on the highest-impact items to accelerate growth and reduce risk.`,
      tone: 'POSITIVE'
    }
  }

  /**
   * Generate executive summary narrative (for CFO Power Strip)
   */
  static async generateExecutiveSummary(): Promise<string> {
    const [financialHealth, revenueIntel, operations] = await Promise.all([
      FinancialHealthService.getMetrics(),
      RevenueIntelligenceService.getIntelligence('last30d'),
      FinancialOperationsService.getIntelligence()
    ])

    const mrrChange = financialHealth.mrr.changePercent
    const churnRate = financialHealth.revenueChurn.rate
    const nrr = financialHealth.netRevenueRetention.rate
    const concentration = revenueIntel.concentration.rate
    const paymentRate = operations.paymentHealth.successRate

    // Build executive summary
    const parts: string[] = []

    // Revenue health
    if (mrrChange < -5) {
      parts.push(`Revenue declining ${Math.abs(mrrChange).toFixed(1)}%`)
    } else if (mrrChange > 10) {
      parts.push(`Revenue growing strongly (+${mrrChange.toFixed(1)}%)`)
    } else if (mrrChange > 0) {
      parts.push(`Revenue growing steadily (+${mrrChange.toFixed(1)}%)`)
    } else {
      parts.push(`Revenue flat`)
    }

    // Key risks
    const risks: string[] = []
    if (concentration > 50) risks.push('critical concentration risk')
    if (churnRate > 10) risks.push('severe churn')
    if (nrr < 90) risks.push('revenue leakage')
    if (paymentRate < 90) risks.push('payment system issues')

    if (risks.length > 0) {
      parts.push(`with ${risks.join(', ')}`)
    }

    // Opportunities
    if (nrr > 110 && mrrChange > 10) {
      parts.push('and strong expansion momentum')
    }

    return parts.join(' ') + '.'
  }
}
