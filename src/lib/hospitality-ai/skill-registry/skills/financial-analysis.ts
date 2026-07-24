/**
 * Operational Skills — Financial Analysis category.
 */
import type { OperationalSkill, SkillExecutionContext, SkillExecutionResult, SkillFinding, SkillMetric } from '../types'
import {
  createSkillDefinition, createSkillResult, createSkillErrorResult,
  extractEvidence, buildExplainability, createFinding, createMetric, createSkillExecutor,
} from '../skill-executor-base'
import { average, clamp01 } from '../utils'

// ============================================================================
// Skill Definitions
// ============================================================================

const revenueAnalysisDef = createSkillDefinition({
  id: 'skill_revenue_analysis', name: 'Revenue Analysis',
  description: 'Analyzes revenue patterns, trends, and identifies revenue opportunities.',
  category: 'financial_analysis', version: '1.0.0', status: 'production', owner: 'platform',
  tags: ['revenue', 'finance', 'trends'],
  supportedDomains: ['finance', 'revenue', 'operations'],
  supportedExpertiseProfiles: ['revenue_advisor', 'executive_advisor', 'operational_excellence_advisor'],
  supportedIntents: ['status_check', 'trend_analysis', 'optimization', 'recommendation_request', 'operational_review'],
  supportedReasoningStrategies: ['temporal_reasoning', 'multi_factor_reasoning', 'comparative_reasoning'],
  requiredKnowledgeCategories: ['financial', 'business', 'menu'],
  requiredMemoryTypes: ['financial'],
  requiredEventTypes: ['PAYMENT_CONFIRMED', 'ORDER_CREATED', 'MENU_ITEM_ORDERED'],
  inputs: [],
  outputs: [
    { name: 'findings', type: 'finding', description: 'Revenue findings' },
    { name: 'metrics', type: 'metric', description: 'Revenue metrics' },
  ],
})

const marginAnalysisDef = createSkillDefinition({
  id: 'skill_margin_analysis', name: 'Margin Analysis',
  description: 'Analyzes profit margins across menu items and time periods.',
  category: 'financial_analysis', version: '1.0.0', status: 'production', owner: 'platform',
  tags: ['margin', 'profit', 'menu'],
  supportedDomains: ['finance', 'revenue'],
  supportedExpertiseProfiles: ['revenue_advisor', 'executive_advisor'],
  supportedIntents: ['status_check', 'trend_analysis', 'optimization', 'operational_review'],
  supportedReasoningStrategies: ['comparative_reasoning', 'multi_factor_reasoning'],
  requiredKnowledgeCategories: ['financial', 'menu'],
  requiredMemoryTypes: ['financial'],
  requiredEventTypes: ['PAYMENT_CONFIRMED', 'MENU_ITEM_ORDERED'],
  inputs: [],
  outputs: [
    { name: 'findings', type: 'finding', description: 'Margin findings' },
    { name: 'metrics', type: 'metric', description: 'Margin metrics' },
  ],
})

const costAnalysisDef = createSkillDefinition({
  id: 'skill_cost_analysis', name: 'Cost Analysis',
  description: 'Analyzes operational costs and identifies cost reduction opportunities.',
  category: 'financial_analysis', version: '1.0.0', status: 'production', owner: 'platform',
  tags: ['cost', 'expenses', 'optimization'],
  supportedDomains: ['finance', 'operations', 'inventory'],
  supportedExpertiseProfiles: ['revenue_advisor', 'executive_advisor', 'operational_excellence_advisor'],
  supportedIntents: ['status_check', 'optimization', 'operational_review', 'recommendation_request'],
  supportedReasoningStrategies: ['multi_factor_reasoning', 'comparative_reasoning'],
  requiredKnowledgeCategories: ['financial', 'inventory'],
  requiredMemoryTypes: ['financial'],
  requiredEventTypes: ['PAYMENT_CONFIRMED', 'INVENTORY_ADJUSTMENT'],
  inputs: [],
  outputs: [
    { name: 'findings', type: 'finding', description: 'Cost findings' },
    { name: 'metrics', type: 'metric', description: 'Cost metrics' },
  ],
})

const profitOpportunityDef = createSkillDefinition({
  id: 'skill_profit_opportunity', name: 'Profit Opportunity Analysis',
  description: 'Identifies profit improvement opportunities from revenue and cost patterns.',
  category: 'financial_analysis', version: '1.0.0', status: 'production', owner: 'platform',
  tags: ['profit', 'opportunity', 'optimization'],
  supportedDomains: ['finance', 'revenue'],
  supportedExpertiseProfiles: ['revenue_advisor', 'executive_advisor'],
  supportedIntents: ['optimization', 'recommendation_request', 'operational_review'],
  supportedReasoningStrategies: ['multi_factor_reasoning', 'evidence_based_recommendation'],
  requiredKnowledgeCategories: ['financial', 'business'],
  requiredMemoryTypes: ['financial'],
  requiredEventTypes: ['PAYMENT_CONFIRMED', 'ORDER_CREATED'],
  inputs: [],
  outputs: [
    { name: 'findings', type: 'finding', description: 'Profit opportunity findings' },
    { name: 'metrics', type: 'metric', description: 'Profit metrics' },
  ],
})

const revenueTrendDef = createSkillDefinition({
  id: 'skill_revenue_trend', name: 'Revenue Trend Analysis',
  description: 'Analyzes revenue trends over time and identifies growth/decline patterns.',
  category: 'financial_analysis', version: '1.0.0', status: 'production', owner: 'platform',
  tags: ['revenue', 'trend', 'temporal'],
  supportedDomains: ['finance', 'revenue'],
  supportedExpertiseProfiles: ['revenue_advisor', 'executive_advisor'],
  supportedIntents: ['trend_analysis', 'status_check', 'operational_review', 'planning'],
  supportedReasoningStrategies: ['temporal_reasoning', 'comparative_reasoning'],
  requiredKnowledgeCategories: ['financial'],
  requiredMemoryTypes: ['financial'],
  requiredEventTypes: ['PAYMENT_CONFIRMED'],
  inputs: [],
  outputs: [
    { name: 'findings', type: 'finding', description: 'Revenue trend findings' },
    { name: 'metrics', type: 'metric', description: 'Trend metrics' },
  ],
})

const pricingInsightsDef = createSkillDefinition({
  id: 'skill_pricing_insights', name: 'Pricing Insights',
  description: 'Provides pricing optimization insights from sales patterns and customer behavior.',
  category: 'financial_analysis', version: '1.0.0', status: 'production', owner: 'platform',
  tags: ['pricing', 'optimization', 'menu'],
  supportedDomains: ['finance', 'revenue'],
  supportedExpertiseProfiles: ['revenue_advisor', 'executive_advisor'],
  supportedIntents: ['optimization', 'recommendation_request', 'decision_support'],
  supportedReasoningStrategies: ['multi_factor_reasoning', 'evidence_based_recommendation'],
  requiredKnowledgeCategories: ['financial', 'menu', 'customer'],
  requiredMemoryTypes: ['financial'],
  requiredEventTypes: ['PAYMENT_CONFIRMED', 'MENU_ITEM_ORDERED'],
  inputs: [],
  outputs: [
    { name: 'findings', type: 'finding', description: 'Pricing findings' },
    { name: 'metrics', type: 'metric', description: 'Pricing metrics' },
  ],
})

const paymentFlowDef = createSkillDefinition({
  id: 'skill_payment_flow', name: 'Payment Flow Analysis',
  description: 'Analyzes payment processing patterns and identifies anomalies.',
  category: 'financial_analysis', version: '1.0.0', status: 'production', owner: 'platform',
  tags: ['payment', 'flow', 'anomaly'],
  supportedDomains: ['finance', 'operations'],
  supportedExpertiseProfiles: ['revenue_advisor', 'executive_advisor', 'operational_excellence_advisor'],
  supportedIntents: ['status_check', 'problem_diagnosis', 'operational_review'],
  supportedReasoningStrategies: ['temporal_reasoning', 'cause_and_effect'],
  requiredKnowledgeCategories: ['financial', 'operational'],
  requiredMemoryTypes: ['financial'],
  requiredEventTypes: ['PAYMENT_CONFIRMED', 'ORDER_CREATED'],
  inputs: [],
  outputs: [
    { name: 'findings', type: 'finding', description: 'Payment flow findings' },
    { name: 'metrics', type: 'metric', description: 'Payment metrics' },
  ],
})

// ============================================================================
// Executors
// ============================================================================

async function executeRevenueAnalysis(context: SkillExecutionContext): Promise<SkillExecutionResult> {
  const start = Date.now()
  try {
    const evidence = extractEvidence(context)
    const findings: SkillFinding[] = []
    const metrics: SkillMetric[] = []
    const payments = context.events.filter((e) => e.type?.includes('PAYMENT'))
    const orders = context.events.filter((e) => e.type?.includes('ORDER'))

    const totalRevenue = payments.reduce((sum, e) => sum + ((e.data?.amount as number) || (e.data?.total as number) || 0), 0)
    const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0

    metrics.push(createMetric('total_revenue', totalRevenue, 'currency', 'Total revenue in period'))
    metrics.push(createMetric('avg_order_value', avgOrderValue, 'currency', 'Average order value'))
    metrics.push(createMetric('payment_count', payments.length, 'count', 'Number of payments'))
    metrics.push(createMetric('order_count', orders.length, 'count', 'Number of orders'))

    if (totalRevenue > 0 && avgOrderValue < totalRevenue * 0.01 && orders.length > 10) {
      findings.push(createFinding(context, 'observation', 'medium', 'Low average order value',
        `Average order value of ${avgOrderValue.toFixed(2)} is low relative to total revenue.`, 0.6, true,
        'Consider upselling strategies or menu engineering'))
    }

    const revKnowledge = context.knowledge.filter((k) => k.category === 'financial')
    for (const k of revKnowledge.slice(0, 2)) {
      findings.push(createFinding(context, 'observation', 'low', `Revenue insight: ${k.title}`, k.statement, k.confidenceScore))
    }

    const confidence = clamp01(0.4 + evidence.evidenceQuality * 0.3 + (payments.length > 10 ? 0.15 : 0))
    const explainability = buildExplainability(context, 'temporal_reasoning',
      `Analyzed ${payments.length} payments and ${orders.length} orders. Total revenue: ${totalRevenue.toFixed(2)}.`, [])

    return createSkillResult({ skillId: 'skill_revenue_analysis', skillName: 'Revenue Analysis', skillVersion: '1.0.0',
      findings, metrics, evidence, explainability, confidence, executionTime: Date.now() - start })
  } catch (error) {
    return createSkillErrorResult('skill_revenue_analysis', 'Revenue Analysis', '1.0.0', String(error), Date.now() - start)
  }
}

async function executeMarginAnalysis(context: SkillExecutionContext): Promise<SkillExecutionResult> {
  const start = Date.now()
  try {
    const evidence = extractEvidence(context)
    const findings: SkillFinding[] = []
    const metrics: SkillMetric[] = []
    const payments = context.events.filter((e) => e.type?.includes('PAYMENT'))
    const menuItems = context.events.filter((e) => e.type?.includes('MENU_ITEM'))

    const revenue = payments.reduce((sum, e) => sum + ((e.data?.amount as number) || 0), 0)
    const estimatedCost = menuItems.length * 5 // Simplified cost estimate
    const margin = revenue > 0 ? (revenue - estimatedCost) / revenue : 0

    metrics.push(createMetric('gross_margin', margin * 100, '%', 'Estimated gross margin', 65, margin < 0.5 ? 'critical' : margin < 0.65 ? 'warning' : 'good'))
    metrics.push(createMetric('estimated_revenue', revenue, 'currency', 'Total revenue'))
    metrics.push(createMetric('estimated_cost', estimatedCost, 'currency', 'Estimated cost'))

    if (margin < 0.5) {
      findings.push(createFinding(context, 'risk', 'high', 'Low gross margin detected',
        `Estimated gross margin of ${(margin * 100).toFixed(1)}% is below 50%.`, 0.7, true,
        'Review menu pricing and ingredient costs'))
    }

    const confidence = clamp01(0.4 + evidence.evidenceQuality * 0.3)
    const explainability = buildExplainability(context, 'comparative_reasoning',
      `Estimated margin from ${payments.length} payments and ${menuItems.length} menu items: ${(margin * 100).toFixed(1)}%.`, [])

    return createSkillResult({ skillId: 'skill_margin_analysis', skillName: 'Margin Analysis', skillVersion: '1.0.0',
      findings, metrics, evidence, explainability, confidence, executionTime: Date.now() - start })
  } catch (error) {
    return createSkillErrorResult('skill_margin_analysis', 'Margin Analysis', '1.0.0', String(error), Date.now() - start)
  }
}

async function executeCostAnalysis(context: SkillExecutionContext): Promise<SkillExecutionResult> {
  const start = Date.now()
  try {
    const evidence = extractEvidence(context)
    const findings: SkillFinding[] = []
    const metrics: SkillMetric[] = []
    const inventoryEvents = context.events.filter((e) => e.type?.includes('INVENTORY'))
    const payments = context.events.filter((e) => e.type?.includes('PAYMENT'))

    const inventoryCost = inventoryEvents.reduce((sum, e) => sum + ((e.data?.cost as number) || (e.data?.value as number) || 0), 0)
    const revenue = payments.reduce((sum, e) => sum + ((e.data?.amount as number) || 0), 0)
    const costRatio = revenue > 0 ? inventoryCost / revenue : 0

    metrics.push(createMetric('inventory_cost', inventoryCost, 'currency', 'Total inventory cost'))
    metrics.push(createMetric('cost_to_revenue_ratio', costRatio, 'ratio', 'Cost-to-revenue ratio', 0.35, costRatio > 0.5 ? 'critical' : 'good'))

    if (costRatio > 0.5) {
      findings.push(createFinding(context, 'risk', 'high', 'High cost-to-revenue ratio',
        `Cost ratio of ${costRatio.toFixed(2)} exceeds recommended 0.35.`, 0.75, true,
        'Review supplier contracts and inventory management'))
    }

    const confidence = clamp01(0.4 + evidence.evidenceQuality * 0.3)
    const explainability = buildExplainability(context, 'multi_factor_reasoning',
      `Analyzed costs from ${inventoryEvents.length} inventory events vs ${payments.length} payments. Ratio: ${costRatio.toFixed(2)}.`, [])

    return createSkillResult({ skillId: 'skill_cost_analysis', skillName: 'Cost Analysis', skillVersion: '1.0.0',
      findings, metrics, evidence, explainability, confidence, executionTime: Date.now() - start })
  } catch (error) {
    return createSkillErrorResult('skill_cost_analysis', 'Cost Analysis', '1.0.0', String(error), Date.now() - start)
  }
}

async function executeProfitOpportunity(context: SkillExecutionContext): Promise<SkillExecutionResult> {
  const start = Date.now()
  try {
    const evidence = extractEvidence(context)
    const findings: SkillFinding[] = []
    const metrics: SkillMetric[] = []
    const payments = context.events.filter((e) => e.type?.includes('PAYMENT'))
    const orders = context.events.filter((e) => e.type?.includes('ORDER'))

    const revenue = payments.reduce((sum, e) => sum + ((e.data?.amount as number) || 0), 0)
    const avgOrder = orders.length > 0 ? revenue / orders.length : 0

    metrics.push(createMetric('revenue', revenue, 'currency', 'Total revenue'))
    metrics.push(createMetric('avg_order_value', avgOrder, 'currency', 'Average order value'))

    // Identify opportunities from knowledge
    const opportunityKnowledge = context.knowledge.filter(
      (k) => k.title.toLowerCase().includes('opportunity') || k.title.toLowerCase().includes('improvement')
    )
    for (const k of opportunityKnowledge.slice(0, 3)) {
      findings.push(createFinding(context, 'opportunity', 'medium', `Profit opportunity: ${k.title}`,
        k.statement, k.confidenceScore, true))
    }

    if (avgOrder > 0 && orders.length > 5) {
      findings.push(createFinding(context, 'opportunity', 'low', 'Increase order frequency',
        `Current average order value is ${avgOrder.toFixed(2)}. Increasing frequency could boost revenue.`, 0.5, true,
        'Implement loyalty program or promotional campaigns'))
    }

    const confidence = clamp01(0.4 + evidence.evidenceQuality * 0.3)
    const explainability = buildExplainability(context, 'evidence_based_recommendation',
      `Identified profit opportunities from ${payments.length} payments and ${orders.length} orders.`, [
        { option: 'Focus on high-margin items', rationale: 'Maximize per-order profit', confidence: 0.6 },
        { option: 'Increase order frequency', rationale: 'Compound revenue growth', confidence: 0.5 },
      ])

    return createSkillResult({ skillId: 'skill_profit_opportunity', skillName: 'Profit Opportunity Analysis', skillVersion: '1.0.0',
      findings, metrics, evidence, explainability, confidence, executionTime: Date.now() - start })
  } catch (error) {
    return createSkillErrorResult('skill_profit_opportunity', 'Profit Opportunity Analysis', '1.0.0', String(error), Date.now() - start)
  }
}

async function executeRevenueTrend(context: SkillExecutionContext): Promise<SkillExecutionResult> {
  const start = Date.now()
  try {
    const evidence = extractEvidence(context)
    const findings: SkillFinding[] = []
    const metrics: SkillMetric[] = []
    const payments = context.events.filter((e) => e.type?.includes('PAYMENT'))

    // Group by day
    const dayMap = new Map<string, number>()
    for (const p of payments) {
      const day = new Date(p.timestamp).toISOString().split('T')[0]
      dayMap.set(day, (dayMap.get(day) || 0) + ((p.data?.amount as number) || 0))
    }

    const days = Array.from(dayMap.entries()).sort((a, b) => a[0].localeCompare(b[0]))
    if (days.length >= 2) {
      const firstHalf = days.slice(0, Math.floor(days.length / 2))
      const secondHalf = days.slice(Math.floor(days.length / 2))
      const firstAvg = average(firstHalf.map((d) => d[1]))
      const secondAvg = average(secondHalf.map((d) => d[1]))
      const trend = secondAvg > firstAvg ? 'up' : secondAvg < firstAvg ? 'down' : 'stable'
      const changePct = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0

      metrics.push(createMetric('revenue_trend', changePct, '%', 'Revenue trend (period over period)', 0, trend === 'down' ? 'critical' : 'good', trend))
      metrics.push(createMetric('daily_avg_revenue', average(days.map((d) => d[1])), 'currency', 'Average daily revenue'))

      if (trend === 'down' && changePct < -10) {
        findings.push(createFinding(context, 'trend', 'high', 'Declining revenue trend',
          `Revenue declined by ${Math.abs(changePct).toFixed(1)}% over the period.`, 0.75, true,
          'Investigate causes and implement recovery strategies'))
      } else if (trend === 'up' && changePct > 10) {
        findings.push(createFinding(context, 'trend', 'info', 'Growing revenue trend',
          `Revenue grew by ${changePct.toFixed(1)}% over the period.`, 0.7))
      }
    }

    const confidence = clamp01(0.4 + evidence.evidenceQuality * 0.3 + (days.length > 3 ? 0.15 : 0))
    const explainability = buildExplainability(context, 'temporal_reasoning',
      `Analyzed revenue trend across ${days.length} days from ${payments.length} payments.`, [])

    return createSkillResult({ skillId: 'skill_revenue_trend', skillName: 'Revenue Trend Analysis', skillVersion: '1.0.0',
      findings, metrics, evidence, explainability, confidence, executionTime: Date.now() - start })
  } catch (error) {
    return createSkillErrorResult('skill_revenue_trend', 'Revenue Trend Analysis', '1.0.0', String(error), Date.now() - start)
  }
}

async function executePricingInsights(context: SkillExecutionContext): Promise<SkillExecutionResult> {
  const start = Date.now()
  try {
    const evidence = extractEvidence(context)
    const findings: SkillFinding[] = []
    const metrics: SkillMetric[] = []
    const menuItems = context.events.filter((e) => e.type?.includes('MENU_ITEM'))
    const payments = context.events.filter((e) => e.type?.includes('PAYMENT'))

    const avgPrice = menuItems.length > 0
      ? average(menuItems.map((e) => (e.data?.price as number) || 0).filter((p) => p > 0))
      : 0

    metrics.push(createMetric('avg_item_price', avgPrice, 'currency', 'Average menu item price'))
    metrics.push(createMetric('items_ordered', menuItems.length, 'count', 'Total items ordered'))

    const pricingKnowledge = context.knowledge.filter(
      (k) => k.title.toLowerCase().includes('pric') || k.statement.toLowerCase().includes('pric')
    )
    for (const k of pricingKnowledge.slice(0, 2)) {
      findings.push(createFinding(context, 'recommendation', 'medium', `Pricing insight: ${k.title}`,
        k.statement, k.confidenceScore, true))
    }

    if (avgPrice > 0 && payments.length > 0) {
      const avgPayment = average(payments.map((e) => (e.data?.amount as number) || 0).filter((a) => a > 0))
      const itemsPerOrder = avgPrice > 0 ? avgPayment / avgPrice : 0
      metrics.push(createMetric('items_per_order', itemsPerOrder, 'ratio', 'Items per order', 2.5))
      if (itemsPerOrder < 2) {
        findings.push(createFinding(context, 'opportunity', 'medium', 'Low items per order',
          `Average of ${itemsPerOrder.toFixed(1)} items per order suggests upselling opportunity.`, 0.6, true,
          'Train staff on upselling techniques'))
      }
    }

    const confidence = clamp01(0.4 + evidence.evidenceQuality * 0.3)
    const explainability = buildExplainability(context, 'evidence_based_recommendation',
      `Analyzed pricing from ${menuItems.length} menu items and ${payments.length} payments.`, [])

    return createSkillResult({ skillId: 'skill_pricing_insights', skillName: 'Pricing Insights', skillVersion: '1.0.0',
      findings, metrics, evidence, explainability, confidence, executionTime: Date.now() - start })
  } catch (error) {
    return createSkillErrorResult('skill_pricing_insights', 'Pricing Insights', '1.0.0', String(error), Date.now() - start)
  }
}

async function executePaymentFlow(context: SkillExecutionContext): Promise<SkillExecutionResult> {
  const start = Date.now()
  try {
    const evidence = extractEvidence(context)
    const findings: SkillFinding[] = []
    const metrics: SkillMetric[] = []
    const payments = context.events.filter((e) => e.type?.includes('PAYMENT'))
    const orders = context.events.filter((e) => e.type?.includes('ORDER'))

    const completionRate = orders.length > 0 ? payments.length / orders.length : 0
    metrics.push(createMetric('payment_completion_rate', completionRate * 100, '%', 'Payment completion rate', 90,
      completionRate < 0.7 ? 'critical' : completionRate < 0.9 ? 'warning' : 'good'))
    metrics.push(createMetric('payment_count', payments.length, 'count', 'Total payments'))
    metrics.push(createMetric('order_count', orders.length, 'count', 'Total orders'))

    if (completionRate < 0.7 && orders.length > 5) {
      findings.push(createFinding(context, 'anomaly', 'high', 'Low payment completion rate',
        `Only ${(completionRate * 100).toFixed(0)}% of orders result in payment.`, 0.8, true,
        'Investigate payment processing issues'))
    }

    // Check for payment method distribution
    const methodCounts = new Map<string, number>()
    for (const p of payments) {
      const method = (p.data?.method as string) || 'unknown'
      methodCounts.set(method, (methodCounts.get(method) || 0) + 1)
    }
    if (methodCounts.size > 0) {
      const topMethod = Array.from(methodCounts.entries()).sort((a, b) => b[1] - a[1])[0]
      metrics.push(createMetric('top_payment_method_share', (topMethod[1] / payments.length) * 100, '%',
        `Top payment method: ${topMethod[0]}`))
    }

    const confidence = clamp01(0.4 + evidence.evidenceQuality * 0.3 + (payments.length > 10 ? 0.15 : 0))
    const explainability = buildExplainability(context, 'temporal_reasoning',
      `Analyzed payment flow: ${payments.length} payments, ${orders.length} orders. Completion: ${(completionRate * 100).toFixed(0)}%.`, [])

    return createSkillResult({ skillId: 'skill_payment_flow', skillName: 'Payment Flow Analysis', skillVersion: '1.0.0',
      findings, metrics, evidence, explainability, confidence, executionTime: Date.now() - start })
  } catch (error) {
    return createSkillErrorResult('skill_payment_flow', 'Payment Flow Analysis', '1.0.0', String(error), Date.now() - start)
  }
}

// ============================================================================
// Export
// ============================================================================

export const financialAnalysisSkills: Array<{ definition: OperationalSkill; executor: import('../types').SkillExecutor }> = [
  { definition: revenueAnalysisDef, executor: createSkillExecutor('skill_revenue_analysis', executeRevenueAnalysis) },
  { definition: marginAnalysisDef, executor: createSkillExecutor('skill_margin_analysis', executeMarginAnalysis) },
  { definition: costAnalysisDef, executor: createSkillExecutor('skill_cost_analysis', executeCostAnalysis) },
  { definition: profitOpportunityDef, executor: createSkillExecutor('skill_profit_opportunity', executeProfitOpportunity) },
  { definition: revenueTrendDef, executor: createSkillExecutor('skill_revenue_trend', executeRevenueTrend) },
  { definition: pricingInsightsDef, executor: createSkillExecutor('skill_pricing_insights', executePricingInsights) },
  { definition: paymentFlowDef, executor: createSkillExecutor('skill_payment_flow', executePaymentFlow) },
]
