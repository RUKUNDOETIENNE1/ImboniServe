/**
 * Operational Skills — Executive Intelligence category.
 */
import type { OperationalSkill, SkillExecutionContext, SkillExecutionResult, SkillFinding, SkillMetric } from '../types'
import {
  createSkillDefinition, type SkillDefinitionBuilder, createSkillResult, createSkillErrorResult,
  extractEvidence, buildExplainability, createFinding, createMetric, createSkillExecutor,
} from '../skill-executor-base'
import { average, clamp01 } from '../utils'

const baseConfig: Omit<SkillDefinitionBuilder, 'id' | 'name' | 'description' | 'tags' | 'inputs' | 'outputs'> = {
  category: 'executive_intelligence', version: '1.0.0', status: 'production', owner: 'platform',
  supportedDomains: ['management', 'cross_domain', 'operations', 'finance', 'staff', 'customers'],
  supportedExpertiseProfiles: ['executive_advisor', 'operational_excellence_advisor'],
  supportedIntents: ['operational_review', 'status_check', 'decision_support', 'planning', 'risk_assessment', 'trend_analysis'],
  supportedReasoningStrategies: ['summary_synthesis', 'multi_factor_reasoning', 'risk_evaluation', 'scenario_reasoning'],
  requiredKnowledgeCategories: ['business', 'operational', 'financial', 'staff', 'customer'],
  requiredMemoryTypes: ['operational', 'financial'],
  requiredEventTypes: ['ORDER_CREATED', 'PAYMENT_CONFIRMED', 'KITCHEN_STATUS_CHANGED', 'STAFF_CHECK_IN', 'CUSTOMER_FEEDBACK'],
}

const execSummaryDef = createSkillDefinition({
  id: 'skill_executive_summary', name: 'Executive Summary',
  description: 'Generates executive-level summary of business performance.',
  ...baseConfig, tags: ['executive', 'summary', 'overview'],
  inputs: [], outputs: [{ name: 'findings', type: 'finding', description: 'Summary findings' }, { name: 'metrics', type: 'metric', description: 'Summary metrics' }],
})

const operationalHealthDef = createSkillDefinition({
  id: 'skill_operational_health', name: 'Operational Health Assessment',
  description: 'Assesses overall operational health.',
  ...baseConfig, tags: ['health', 'operational', 'assessment'],
  inputs: [], outputs: [{ name: 'findings', type: 'finding', description: 'Health findings' }, { name: 'metrics', type: 'metric', description: 'Health metrics' }],
})

const riskDashboardDef = createSkillDefinition({
  id: 'skill_risk_dashboard', name: 'Risk Dashboard',
  description: 'Compiles risk assessment across all domains.',
  ...baseConfig, tags: ['risk', 'dashboard', 'cross_domain'],
  inputs: [], outputs: [{ name: 'findings', type: 'finding', description: 'Risk findings' }, { name: 'metrics', type: 'metric', description: 'Risk metrics' }],
})

const weeklyReviewDef = createSkillDefinition({
  id: 'skill_weekly_review', name: 'Weekly Review',
  description: 'Generates weekly performance review.',
  ...baseConfig, tags: ['weekly', 'review', 'performance'],
  inputs: [], outputs: [{ name: 'findings', type: 'finding', description: 'Review findings' }, { name: 'metrics', type: 'metric', description: 'Review metrics' }],
})

const strategicOppDef = createSkillDefinition({
  id: 'skill_strategic_opportunities', name: 'Strategic Opportunity Detection',
  description: 'Identifies strategic opportunities.',
  ...baseConfig, tags: ['strategic', 'opportunity', 'growth'],
  inputs: [], outputs: [{ name: 'findings', type: 'finding', description: 'Opportunity findings' }, { name: 'metrics', type: 'metric', description: 'Opportunity metrics' }],
})

const crossDeptDef = createSkillDefinition({
  id: 'skill_cross_department', name: 'Cross-Department Analysis',
  description: 'Analyzes cross-department performance.',
  ...baseConfig, tags: ['cross_department', 'analysis', 'performance'],
  inputs: [], outputs: [{ name: 'findings', type: 'finding', description: 'Cross-dept findings' }, { name: 'metrics', type: 'metric', description: 'Cross-dept metrics' }],
})

const scorecardDef = createSkillDefinition({
  id: 'skill_performance_scorecard', name: 'Business Performance Scorecard',
  description: 'Creates comprehensive performance scorecard.',
  ...baseConfig, tags: ['scorecard', 'performance', 'comprehensive'],
  inputs: [], outputs: [{ name: 'findings', type: 'finding', description: 'Scorecard findings' }, { name: 'metrics', type: 'metric', description: 'Scorecard metrics' }],
})

// ============================================================================
// Executors
// ============================================================================

async function executeExecSummary(context: SkillExecutionContext): Promise<SkillExecutionResult> {
  const start = Date.now()
  try {
    const evidence = extractEvidence(context)
    const findings: SkillFinding[] = []
    const metrics: SkillMetric[] = []
    const allEvents = context.events
    const orders = allEvents.filter((e) => e.type?.includes('ORDER'))
    const payments = allEvents.filter((e) => e.type?.includes('PAYMENT'))
    const feedback = allEvents.filter((e) => e.type?.includes('FEEDBACK'))
    const staff = allEvents.filter((e) => e.type?.includes('STAFF'))

    const revenue = payments.reduce((sum, e) => sum + ((e.data?.amount as number) || 0), 0)
    const completionRate = orders.length > 0 ? payments.length / orders.length : 0

    metrics.push(createMetric('total_revenue', revenue, 'currency', 'Total revenue'))
    metrics.push(createMetric('total_orders', orders.length, 'count', 'Total orders'))
    metrics.push(createMetric('completion_rate', completionRate * 100, '%', 'Order completion rate', 90))
    metrics.push(createMetric('feedback_count', feedback.length, 'count', 'Customer feedback count'))
    metrics.push(createMetric('staff_events', staff.length, 'count', 'Staff activity events'))

    findings.push(createFinding(context, 'observation', 'info', 'Executive summary generated',
      `Business processed ${orders.length} orders generating ${revenue.toFixed(2)} revenue with ${(completionRate * 100).toFixed(0)}% completion rate.`, 0.7))

    if (completionRate < 0.7) {
      findings.push(createFinding(context, 'risk', 'high', 'Low completion rate',
        `Only ${(completionRate * 100).toFixed(0)}% of orders complete.`, 0.8, true, 'Investigate order flow issues'))
    }

    const confidence = clamp01(0.4 + evidence.evidenceQuality * 0.3 + (allEvents.length > 20 ? 0.15 : 0))
    const explainability = buildExplainability(context, 'summary_synthesis',
      `Executive summary: ${orders.length} orders, ${revenue.toFixed(2)} revenue, ${(completionRate * 100).toFixed(0)}% completion.`, [])

    return createSkillResult({ skillId: 'skill_executive_summary', skillName: 'Executive Summary', skillVersion: '1.0.0',
      findings, metrics, evidence, explainability, confidence, executionTime: Date.now() - start })
  } catch (error) {
    return createSkillErrorResult('skill_executive_summary', 'Executive Summary', '1.0.0', String(error), Date.now() - start)
  }
}

async function executeOperationalHealth(context: SkillExecutionContext): Promise<SkillExecutionResult> {
  const start = Date.now()
  try {
    const evidence = extractEvidence(context)
    const findings: SkillFinding[] = []
    const metrics: SkillMetric[] = []
    const allEvents = context.events
    const orders = allEvents.filter((e) => e.type?.includes('ORDER'))
    const payments = allEvents.filter((e) => e.type?.includes('PAYMENT'))
    const kitchen = allEvents.filter((e) => e.type?.includes('KITCHEN'))
    const feedback = allEvents.filter((e) => e.type?.includes('FEEDBACK'))

    const completionRate = orders.length > 0 ? payments.length / orders.length : 0
    const kitchenActivity = orders.length > 0 ? kitchen.length / orders.length : 0
    const feedbackRate = orders.length > 0 ? feedback.length / orders.length : 0

    const healthScore = clamp01(completionRate * 0.4 + kitchenActivity * 0.3 + feedbackRate * 0.3)

    metrics.push(createMetric('operational_health_score', healthScore * 100, '%', 'Overall operational health score', 75,
      healthScore < 0.5 ? 'critical' : healthScore < 0.7 ? 'warning' : 'good'))
    metrics.push(createMetric('completion_rate', completionRate * 100, '%', 'Order completion rate'))
    metrics.push(createMetric('kitchen_activity', kitchenActivity, 'ratio', 'Kitchen activity ratio'))
    metrics.push(createMetric('feedback_rate', feedbackRate, 'ratio', 'Customer feedback rate'))

    if (healthScore < 0.5) {
      findings.push(createFinding(context, 'risk', 'high', 'Poor operational health',
        `Health score of ${(healthScore * 100).toFixed(0)}% indicates significant issues.`, 0.8, true,
        'Conduct comprehensive operational review'))
    } else if (healthScore > 0.8) {
      findings.push(createFinding(context, 'observation', 'info', 'Excellent operational health',
        `Health score of ${(healthScore * 100).toFixed(0)}% indicates strong performance.`, 0.7))
    }

    const confidence = clamp01(0.4 + evidence.evidenceQuality * 0.3 + (allEvents.length > 20 ? 0.15 : 0))
    const explainability = buildExplainability(context, 'multi_factor_reasoning',
      `Computed health score from ${orders.length} orders, ${payments.length} payments, ${kitchen.length} kitchen events. Score: ${(healthScore * 100).toFixed(0)}%.`, [])

    return createSkillResult({ skillId: 'skill_operational_health', skillName: 'Operational Health Assessment', skillVersion: '1.0.0',
      findings, metrics, evidence, explainability, confidence, executionTime: Date.now() - start })
  } catch (error) {
    return createSkillErrorResult('skill_operational_health', 'Operational Health Assessment', '1.0.0', String(error), Date.now() - start)
  }
}

async function executeRiskDashboard(context: SkillExecutionContext): Promise<SkillExecutionResult> {
  const start = Date.now()
  try {
    const evidence = extractEvidence(context)
    const findings: SkillFinding[] = []
    const metrics: SkillMetric[] = []
    const allEvents = context.events
    const orders = allEvents.filter((e) => e.type?.includes('ORDER'))
    const payments = allEvents.filter((e) => e.type?.includes('PAYMENT'))
    const feedback = allEvents.filter((e) => e.type?.includes('FEEDBACK'))
    const inventory = allEvents.filter((e) => e.type?.includes('INVENTORY'))

    // Risk indicators
    const completionRisk = orders.length > 0 ? 1 - (payments.length / orders.length) : 0
    const satisfactionRisk = feedback.length > 0
      ? feedback.filter((f) => ((f.data?.rating as number) || 0) < 3).length / feedback.length
      : 0
    const inventoryRisk = inventory.length > 0
      ? inventory.filter((e) => ((e.data?.level as number) || 0) < 10).length / inventory.length
      : 0

    const overallRisk = clamp01((completionRisk + satisfactionRisk + inventoryRisk) / 3)

    metrics.push(createMetric('overall_risk_score', overallRisk * 100, '%', 'Overall risk score', 20,
      overallRisk > 0.5 ? 'critical' : overallRisk > 0.3 ? 'warning' : 'good'))
    metrics.push(createMetric('completion_risk', completionRisk * 100, '%', 'Order completion risk'))
    metrics.push(createMetric('satisfaction_risk', satisfactionRisk * 100, '%', 'Customer satisfaction risk'))
    metrics.push(createMetric('inventory_risk', inventoryRisk * 100, '%', 'Inventory risk'))

    if (completionRisk > 0.3) {
      findings.push(createFinding(context, 'risk', 'high', 'High completion risk',
        `${(completionRisk * 100).toFixed(0)}% of orders may not complete.`, 0.8, true, 'Investigate order flow'))
    }
    if (satisfactionRisk > 0.3) {
      findings.push(createFinding(context, 'risk', 'high', 'High satisfaction risk',
        `${(satisfactionRisk * 100).toFixed(0)}% of feedback is negative.`, 0.75, true, 'Address customer concerns'))
    }
    if (inventoryRisk > 0.3) {
      findings.push(createFinding(context, 'risk', 'medium', 'Inventory risk detected',
        `${(inventoryRisk * 100).toFixed(0)}% of items at low stock.`, 0.7, true, 'Reorder critical items'))
    }

    const confidence = clamp01(0.4 + evidence.evidenceQuality * 0.3)
    const explainability = buildExplainability(context, 'risk_evaluation',
      `Risk dashboard: completion ${(completionRisk * 100).toFixed(0)}%, satisfaction ${(satisfactionRisk * 100).toFixed(0)}%, inventory ${(inventoryRisk * 100).toFixed(0)}%.`, [])

    return createSkillResult({ skillId: 'skill_risk_dashboard', skillName: 'Risk Dashboard', skillVersion: '1.0.0',
      findings, metrics, evidence, explainability, confidence, executionTime: Date.now() - start })
  } catch (error) {
    return createSkillErrorResult('skill_risk_dashboard', 'Risk Dashboard', '1.0.0', String(error), Date.now() - start)
  }
}

async function executeWeeklyReview(context: SkillExecutionContext): Promise<SkillExecutionResult> {
  const start = Date.now()
  try {
    const evidence = extractEvidence(context)
    const findings: SkillFinding[] = []
    const metrics: SkillMetric[] = []
    const allEvents = context.events
    const orders = allEvents.filter((e) => e.type?.includes('ORDER'))
    const payments = allEvents.filter((e) => e.type?.includes('PAYMENT'))

    // Group by day
    const dayMap = new Map<string, { orders: number; revenue: number }>()
    for (const o of orders) {
      const day = new Date(o.timestamp).toISOString().split('T')[0]
      if (!dayMap.has(day)) dayMap.set(day, { orders: 0, revenue: 0 })
      dayMap.get(day)!.orders++
    }
    for (const p of payments) {
      const day = new Date(p.timestamp).toISOString().split('T')[0]
      if (!dayMap.has(day)) dayMap.set(day, { orders: 0, revenue: 0 })
      dayMap.get(day)!.revenue += (p.data?.amount as number) || 0
    }

    const days = Array.from(dayMap.entries()).sort((a, b) => a[0].localeCompare(b[0]))
    const totalRevenue = days.reduce((sum, d) => sum + d[1].revenue, 0)
    const totalOrders = days.reduce((sum, d) => sum + d[1].orders, 0)
    const avgDailyRevenue = days.length > 0 ? totalRevenue / days.length : 0

    metrics.push(createMetric('total_revenue', totalRevenue, 'currency', 'Total revenue for period'))
    metrics.push(createMetric('total_orders', totalOrders, 'count', 'Total orders for period'))
    metrics.push(createMetric('avg_daily_revenue', avgDailyRevenue, 'currency', 'Average daily revenue'))
    metrics.push(createMetric('days_reviewed', days.length, 'count', 'Number of days reviewed'))

    findings.push(createFinding(context, 'observation', 'info', 'Weekly review generated',
      `Over ${days.length} days: ${totalOrders} orders, ${totalRevenue.toFixed(2)} revenue, ${avgDailyRevenue.toFixed(2)} avg/day.`, 0.7))

    if (days.length >= 2) {
      const firstHalf = days.slice(0, Math.floor(days.length / 2))
      const secondHalf = days.slice(Math.floor(days.length / 2))
      const firstRev = firstHalf.reduce((s, d) => s + d[1].revenue, 0)
      const secondRev = secondHalf.reduce((s, d) => s + d[1].revenue, 0)
      if (firstRev > 0) {
        const change = ((secondRev - firstRev) / firstRev) * 100
        metrics.push(createMetric('period_over_period_change', change, '%', 'Period-over-period revenue change'))
        if (change < -10) {
          findings.push(createFinding(context, 'trend', 'high', 'Revenue declining',
            `Revenue declined ${Math.abs(change).toFixed(1)}% in second half.`, 0.75, true, 'Investigate causes'))
        }
      }
    }

    const confidence = clamp01(0.4 + evidence.evidenceQuality * 0.3 + (days.length > 3 ? 0.15 : 0))
    const explainability = buildExplainability(context, 'summary_synthesis',
      `Weekly review: ${days.length} days, ${totalOrders} orders, ${totalRevenue.toFixed(2)} revenue.`, [])

    return createSkillResult({ skillId: 'skill_weekly_review', skillName: 'Weekly Review', skillVersion: '1.0.0',
      findings, metrics, evidence, explainability, confidence, executionTime: Date.now() - start })
  } catch (error) {
    return createSkillErrorResult('skill_weekly_review', 'Weekly Review', '1.0.0', String(error), Date.now() - start)
  }
}

async function executeStrategicOpp(context: SkillExecutionContext): Promise<SkillExecutionResult> {
  const start = Date.now()
  try {
    const evidence = extractEvidence(context)
    const findings: SkillFinding[] = []
    const metrics: SkillMetric[] = []
    const allEvents = context.events
    const orders = allEvents.filter((e) => e.type?.includes('ORDER'))
    const payments = allEvents.filter((e) => e.type?.includes('PAYMENT'))

    const revenue = payments.reduce((sum, e) => sum + ((e.data?.amount as number) || 0), 0)
    const avgOrder = orders.length > 0 ? revenue / orders.length : 0

    metrics.push(createMetric('avg_order_value', avgOrder, 'currency', 'Average order value'))
    metrics.push(createMetric('revenue', revenue, 'currency', 'Total revenue'))
    metrics.push(createMetric('order_count', orders.length, 'count', 'Total orders'))

    // Identify strategic opportunities from knowledge
    const strategicKnowledge = context.knowledge.filter(
      (k) => k.title.toLowerCase().includes('opportunity') || k.title.toLowerCase().includes('growth') || k.title.toLowerCase().includes('strategic')
    )
    for (const k of strategicKnowledge.slice(0, 3)) {
      findings.push(createFinding(context, 'opportunity', 'medium', `Strategic opportunity: ${k.title}`,
        k.statement, k.confidenceScore, true))
    }

    if (avgOrder > 0 && orders.length > 5) {
      findings.push(createFinding(context, 'opportunity', 'low', 'Increase average order value',
        `Current AOV of ${avgOrder.toFixed(2)} could be improved.`, 0.5, true, 'Implement upselling and menu engineering'))
    }

    const confidence = clamp01(0.4 + evidence.evidenceQuality * 0.3)
    const explainability = buildExplainability(context, 'scenario_reasoning',
      `Identified strategic opportunities from ${orders.length} orders and ${strategicKnowledge.length} knowledge items.`,
      [{ option: 'Focus on AOV growth', rationale: 'Direct revenue impact', confidence: 0.6 },
       { option: 'Focus on order volume', rationale: 'Market penetration', confidence: 0.5 }])

    return createSkillResult({ skillId: 'skill_strategic_opportunities', skillName: 'Strategic Opportunity Detection', skillVersion: '1.0.0',
      findings, metrics, evidence, explainability, confidence, executionTime: Date.now() - start })
  } catch (error) {
    return createSkillErrorResult('skill_strategic_opportunities', 'Strategic Opportunity Detection', '1.0.0', String(error), Date.now() - start)
  }
}

async function executeCrossDept(context: SkillExecutionContext): Promise<SkillExecutionResult> {
  const start = Date.now()
  try {
    const evidence = extractEvidence(context)
    const findings: SkillFinding[] = []
    const metrics: SkillMetric[] = []
    const allEvents = context.events

    // Count events by department
    const departments = {
      kitchen: allEvents.filter((e) => e.type?.includes('KITCHEN') || e.type?.includes('MENU_ITEM')).length,
      service: allEvents.filter((e) => e.type?.includes('ORDER') || e.type?.includes('TABLE')).length,
      staff: allEvents.filter((e) => e.type?.includes('STAFF')).length,
      finance: allEvents.filter((e) => e.type?.includes('PAYMENT')).length,
      customer: allEvents.filter((e) => e.type?.includes('FEEDBACK') || e.type?.includes('RESERVATION')).length,
      inventory: allEvents.filter((e) => e.type?.includes('INVENTORY') || e.type?.includes('STOCK')).length,
    }

    metrics.push(createMetric('kitchen_events', departments.kitchen, 'count', 'Kitchen department events'))
    metrics.push(createMetric('service_events', departments.service, 'count', 'Service department events'))
    metrics.push(createMetric('staff_events', departments.staff, 'count', 'Staff department events'))
    metrics.push(createMetric('finance_events', departments.finance, 'count', 'Finance department events'))
    metrics.push(createMetric('customer_events', departments.customer, 'count', 'Customer department events'))
    metrics.push(createMetric('inventory_events', departments.inventory, 'count', 'Inventory department events'))

    const values = Object.values(departments)
    const avg = values.length > 0 ? average(values) : 0
    const max = Math.max(...values)
    const min = Math.min(...values)

    if (max > avg * 3 && avg > 0) {
      const dominantDept = Object.entries(departments).find(([, v]) => v === max)?.[0]
      findings.push(createFinding(context, 'observation', 'medium', `Activity concentrated in ${dominantDept}`,
        `${dominantDept} department has ${max} events vs avg ${avg.toFixed(0)}.`, 0.6, true,
        'Ensure balanced attention across departments'))
    }

    const confidence = clamp01(0.4 + evidence.evidenceQuality * 0.3)
    const explainability = buildExplainability(context, 'multi_factor_reasoning',
      `Analyzed cross-department activity: kitchen ${departments.kitchen}, service ${departments.service}, staff ${departments.staff}.`, [])

    return createSkillResult({ skillId: 'skill_cross_department', skillName: 'Cross-Department Analysis', skillVersion: '1.0.0',
      findings, metrics, evidence, explainability, confidence, executionTime: Date.now() - start })
  } catch (error) {
    return createSkillErrorResult('skill_cross_department', 'Cross-Department Analysis', '1.0.0', String(error), Date.now() - start)
  }
}

async function executeScorecard(context: SkillExecutionContext): Promise<SkillExecutionResult> {
  const start = Date.now()
  try {
    const evidence = extractEvidence(context)
    const findings: SkillFinding[] = []
    const metrics: SkillMetric[] = []
    const allEvents = context.events
    const orders = allEvents.filter((e) => e.type?.includes('ORDER'))
    const payments = allEvents.filter((e) => e.type?.includes('PAYMENT'))
    const feedback = allEvents.filter((e) => e.type?.includes('FEEDBACK'))
    const kitchen = allEvents.filter((e) => e.type?.includes('KITCHEN'))

    // Compute scorecard dimensions
    const revenue = payments.reduce((sum, e) => sum + ((e.data?.amount as number) || 0), 0)
    const completionRate = orders.length > 0 ? payments.length / orders.length : 0
    const ratings = feedback.map((e) => (e.data?.rating as number) || 0).filter((r) => r > 0)
    const satisfaction = ratings.length > 0 ? average(ratings) / 5 : 0
    const kitchenEfficiency = orders.length > 0 ? clamp01(kitchen.length / orders.length) : 0

    const overallScore = clamp01(completionRate * 0.3 + satisfaction * 0.3 + kitchenEfficiency * 0.2 + 0.2)

    metrics.push(createMetric('overall_score', overallScore * 100, '%', 'Overall performance score', 75,
      overallScore < 0.5 ? 'critical' : overallScore < 0.7 ? 'warning' : 'good'))
    metrics.push(createMetric('financial_score', completionRate * 100, '%', 'Financial performance score'))
    metrics.push(createMetric('customer_score', satisfaction * 100, '%', 'Customer satisfaction score'))
    metrics.push(createMetric('operational_score', kitchenEfficiency * 100, '%', 'Operational efficiency score'))
    metrics.push(createMetric('total_revenue', revenue, 'currency', 'Total revenue'))

    if (overallScore < 0.5) {
      findings.push(createFinding(context, 'risk', 'high', 'Low overall performance score',
        `Score of ${(overallScore * 100).toFixed(0)}% indicates comprehensive improvement needed.`, 0.8, true,
        'Develop improvement plan across all dimensions'))
    }

    const confidence = clamp01(0.4 + evidence.evidenceQuality * 0.3 + (allEvents.length > 20 ? 0.15 : 0))
    const explainability = buildExplainability(context, 'summary_synthesis',
      `Scorecard: financial ${(completionRate * 100).toFixed(0)}%, customer ${(satisfaction * 100).toFixed(0)}%, operational ${(kitchenEfficiency * 100).toFixed(0)}%. Overall: ${(overallScore * 100).toFixed(0)}%.`,
      [{ option: 'Focus on weakest dimension', rationale: 'Maximize improvement impact', confidence: 0.6 }])

    return createSkillResult({ skillId: 'skill_performance_scorecard', skillName: 'Business Performance Scorecard', skillVersion: '1.0.0',
      findings, metrics, evidence, explainability, confidence, executionTime: Date.now() - start })
  } catch (error) {
    return createSkillErrorResult('skill_performance_scorecard', 'Business Performance Scorecard', '1.0.0', String(error), Date.now() - start)
  }
}

// ============================================================================
// Export
// ============================================================================

export const executiveIntelligenceSkills: Array<{ definition: OperationalSkill; executor: import('../types').SkillExecutor }> = [
  { definition: execSummaryDef, executor: createSkillExecutor('skill_executive_summary', executeExecSummary) },
  { definition: operationalHealthDef, executor: createSkillExecutor('skill_operational_health', executeOperationalHealth) },
  { definition: riskDashboardDef, executor: createSkillExecutor('skill_risk_dashboard', executeRiskDashboard) },
  { definition: weeklyReviewDef, executor: createSkillExecutor('skill_weekly_review', executeWeeklyReview) },
  { definition: strategicOppDef, executor: createSkillExecutor('skill_strategic_opportunities', executeStrategicOpp) },
  { definition: crossDeptDef, executor: createSkillExecutor('skill_cross_department', executeCrossDept) },
  { definition: scorecardDef, executor: createSkillExecutor('skill_performance_scorecard', executeScorecard) },
]
