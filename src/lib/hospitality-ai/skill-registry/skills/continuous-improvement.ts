/**
 * Operational Skills — Continuous Improvement category.
 */
import type { OperationalSkill, SkillExecutionContext, SkillExecutionResult, SkillFinding, SkillMetric } from '../types'
import {
  createSkillDefinition, type SkillDefinitionBuilder, createSkillResult, createSkillErrorResult,
  extractEvidence, buildExplainability, createFinding, createMetric, createSkillExecutor,
} from '../skill-executor-base'
import { average, clamp01 } from '../utils'

const baseConfig: Omit<SkillDefinitionBuilder, 'id' | 'name' | 'description' | 'tags' | 'inputs' | 'outputs'> = {
  category: 'continuous_improvement', version: '1.0.0', status: 'production', owner: 'platform',
  supportedDomains: ['cross_domain', 'operations', 'management'],
  supportedExpertiseProfiles: ['operational_excellence_advisor', 'executive_advisor'],
  supportedIntents: ['optimization', 'operational_review', 'problem_diagnosis', 'comparison', 'trend_analysis', 'learning_training'],
  supportedReasoningStrategies: ['comparative_reasoning', 'multi_factor_reasoning', 'cause_and_effect', 'evidence_based_recommendation'],
  requiredKnowledgeCategories: ['operational', 'business', 'kitchen', 'service', 'staff'],
  requiredMemoryTypes: ['operational'],
  requiredEventTypes: ['ORDER_CREATED', 'PAYMENT_CONFIRMED', 'KITCHEN_STATUS_CHANGED', 'CUSTOMER_FEEDBACK'],
}

const processOptDef = createSkillDefinition({
  id: 'skill_process_optimization', name: 'Process Optimization',
  description: 'Identifies process optimization opportunities.',
  ...baseConfig, tags: ['process', 'optimization', 'improvement'],
  inputs: [], outputs: [{ name: 'findings', type: 'finding', description: 'Optimization findings' }, { name: 'metrics', type: 'metric', description: 'Optimization metrics' }],
})

const frictionDef = createSkillDefinition({
  id: 'skill_friction_detection', name: 'Operational Friction Detection',
  description: 'Detects operational friction points.',
  ...baseConfig, tags: ['friction', 'detection', 'operations'],
  inputs: [], outputs: [{ name: 'findings', type: 'finding', description: 'Friction findings' }, { name: 'metrics', type: 'metric', description: 'Friction metrics' }],
})

const businessRuleDef = createSkillDefinition({
  id: 'skill_business_rule_validation', name: 'Business Rule Validation',
  description: 'Validates business rules against actual operations.',
  ...baseConfig, tags: ['business_rules', 'validation', 'compliance'],
  inputs: [], outputs: [{ name: 'findings', type: 'finding', description: 'Validation findings' }, { name: 'metrics', type: 'metric', description: 'Validation metrics' }],
})

const improvementOppDef = createSkillDefinition({
  id: 'skill_improvement_opportunities', name: 'Improvement Opportunity Detection',
  description: 'Identifies improvement opportunities.',
  ...baseConfig, tags: ['improvement', 'opportunity', 'optimization'],
  inputs: [], outputs: [{ name: 'findings', type: 'finding', description: 'Improvement findings' }, { name: 'metrics', type: 'metric', description: 'Improvement metrics' }],
})

const perfGapDef = createSkillDefinition({
  id: 'skill_performance_gap', name: 'Performance Gap Analysis',
  description: 'Analyzes performance gaps vs targets.',
  ...baseConfig, tags: ['gap', 'performance', 'targets'],
  inputs: [], outputs: [{ name: 'findings', type: 'finding', description: 'Gap findings' }, { name: 'metrics', type: 'metric', description: 'Gap metrics' }],
})

const bestPracticesDef = createSkillDefinition({
  id: 'skill_best_practices', name: 'Best Practice Identification',
  description: 'Identifies best practices from high-performance periods.',
  ...baseConfig, tags: ['best_practices', 'performance', 'learning'],
  inputs: [], outputs: [{ name: 'findings', type: 'finding', description: 'Best practice findings' }, { name: 'metrics', type: 'metric', description: 'Best practice metrics' }],
})

const improvementTrackerDef = createSkillDefinition({
  id: 'skill_improvement_tracker', name: 'Continuous Improvement Tracker',
  description: 'Tracks improvement initiatives over time.',
  ...baseConfig, tags: ['tracker', 'improvement', 'monitoring'],
  inputs: [], outputs: [{ name: 'findings', type: 'finding', description: 'Tracker findings' }, { name: 'metrics', type: 'metric', description: 'Tracker metrics' }],
})

// ============================================================================
// Executors
// ============================================================================

async function executeProcessOpt(context: SkillExecutionContext): Promise<SkillExecutionResult> {
  const start = Date.now()
  try {
    const evidence = extractEvidence(context)
    const findings: SkillFinding[] = []
    const metrics: SkillMetric[] = []
    const allEvents = context.events
    const orders = allEvents.filter((e) => e.type?.includes('ORDER'))
    const payments = allEvents.filter((e) => e.type?.includes('PAYMENT'))
    const kitchen = allEvents.filter((e) => e.type?.includes('KITCHEN'))

    // Identify process inefficiencies
    const completionRate = orders.length > 0 ? payments.length / orders.length : 0
    const kitchenRatio = orders.length > 0 ? kitchen.length / orders.length : 0

    metrics.push(createMetric('process_completion_rate', completionRate * 100, '%', 'Process completion rate', 90))
    metrics.push(createMetric('kitchen_process_ratio', kitchenRatio, 'ratio', 'Kitchen process ratio'))

    if (completionRate < 0.8) {
      findings.push(createFinding(context, 'opportunity', 'high', 'Process optimization: order completion',
        `Completion rate of ${(completionRate * 100).toFixed(0)}% can be improved.`, 0.75, true,
        'Review order-to-payment process flow'))
    }

    const optKnowledge = context.knowledge.filter((k) => k.title.toLowerCase().includes('optim') || k.title.toLowerCase().includes('improvement'))
    for (const k of optKnowledge.slice(0, 3)) {
      findings.push(createFinding(context, 'opportunity', 'medium', `Optimization insight: ${k.title}`, k.statement, k.confidenceScore, true))
    }

    const confidence = clamp01(0.4 + evidence.evidenceQuality * 0.3)
    const explainability = buildExplainability(context, 'evidence_based_recommendation',
      `Identified process optimization opportunities from ${orders.length} orders.`, [])

    return createSkillResult({ skillId: 'skill_process_optimization', skillName: 'Process Optimization', skillVersion: '1.0.0',
      findings, metrics, evidence, explainability, confidence, executionTime: Date.now() - start })
  } catch (error) {
    return createSkillErrorResult('skill_process_optimization', 'Process Optimization', '1.0.0', String(error), Date.now() - start)
  }
}

async function executeFriction(context: SkillExecutionContext): Promise<SkillExecutionResult> {
  const start = Date.now()
  try {
    const evidence = extractEvidence(context)
    const findings: SkillFinding[] = []
    const metrics: SkillMetric[] = []
    const allEvents = context.events
    const kitchen = allEvents.filter((e) => e.type?.includes('KITCHEN'))
    const feedback = allEvents.filter((e) => e.type?.includes('FEEDBACK'))

    // Detect friction from delays and complaints
    const delays = kitchen.filter((e) => {
      const status = ((e.data?.status as string) || '').toLowerCase()
      return status.includes('delay') || status.includes('backed')
    })
    const complaints = feedback.filter((e) => {
      const r = (e.data?.rating as number) || 0
      return r > 0 && r < 3
    })

    metrics.push(createMetric('friction_points', delays.length + complaints.length, 'count', 'Total friction points'))
    metrics.push(createMetric('delay_friction', delays.length, 'count', 'Delay-related friction'))
    metrics.push(createMetric('complaint_friction', complaints.length, 'count', 'Complaint-related friction'))

    if (delays.length > 3) {
      findings.push(createFinding(context, 'risk', 'medium', 'Operational friction from delays',
        `${delays.length} delay events indicate process friction.`, 0.7, true, 'Streamline kitchen processes'))
    }
    if (complaints.length > 3) {
      findings.push(createFinding(context, 'risk', 'medium', 'Operational friction from complaints',
        `${complaints.length} complaints indicate service friction.`, 0.7, true, 'Address service issues'))
    }

    const confidence = clamp01(0.4 + evidence.evidenceQuality * 0.3)
    const explainability = buildExplainability(context, 'cause_and_effect',
      `Detected ${delays.length + complaints.length} friction points from delays and complaints.`, [])

    return createSkillResult({ skillId: 'skill_friction_detection', skillName: 'Operational Friction Detection', skillVersion: '1.0.0',
      findings, metrics, evidence, explainability, confidence, executionTime: Date.now() - start })
  } catch (error) {
    return createSkillErrorResult('skill_friction_detection', 'Operational Friction Detection', '1.0.0', String(error), Date.now() - start)
  }
}

async function executeBusinessRule(context: SkillExecutionContext): Promise<SkillExecutionResult> {
  const start = Date.now()
  try {
    const evidence = extractEvidence(context)
    const findings: SkillFinding[] = []
    const metrics: SkillMetric[] = []
    const allEvents = context.events
    const orders = allEvents.filter((e) => e.type?.includes('ORDER'))
    const payments = allEvents.filter((e) => e.type?.includes('PAYMENT'))

    // Validate business rules
    const rulesChecked = 3
    let rulesPassed = 0

    // Rule 1: Every order should have a payment
    if (orders.length > 0 && payments.length / orders.length > 0.7) rulesPassed++
    // Rule 2: Reasonable order volume
    if (orders.length > 0 && orders.length < 1000) rulesPassed++
    // Rule 3: Payments should not exceed orders
    if (payments.length <= orders.length || orders.length === 0) rulesPassed++

    const complianceRate = rulesPassed / rulesChecked

    metrics.push(createMetric('rules_checked', rulesChecked, 'count', 'Business rules checked'))
    metrics.push(createMetric('rules_passed', rulesPassed, 'count', 'Rules passed'))
    metrics.push(createMetric('compliance_rate', complianceRate * 100, '%', 'Business rule compliance rate', 100,
      complianceRate < 0.7 ? 'critical' : 'good'))

    if (complianceRate < 1) {
      findings.push(createFinding(context, 'observation', 'medium', 'Business rule violations detected',
        `${rulesChecked - rulesPassed} of ${rulesChecked} business rules violated.`, 0.65, true,
        'Review and enforce business rules'))
    }

    const confidence = clamp01(0.4 + evidence.evidenceQuality * 0.3)
    const explainability = buildExplainability(context, 'comparative_reasoning',
      `Validated ${rulesChecked} business rules. ${rulesPassed} passed, ${rulesChecked - rulesPassed} violated.`, [])

    return createSkillResult({ skillId: 'skill_business_rule_validation', skillName: 'Business Rule Validation', skillVersion: '1.0.0',
      findings, metrics, evidence, explainability, confidence, executionTime: Date.now() - start })
  } catch (error) {
    return createSkillErrorResult('skill_business_rule_validation', 'Business Rule Validation', '1.0.0', String(error), Date.now() - start)
  }
}

async function executeImprovementOpp(context: SkillExecutionContext): Promise<SkillExecutionResult> {
  const start = Date.now()
  try {
    const evidence = extractEvidence(context)
    const findings: SkillFinding[] = []
    const metrics: SkillMetric[] = []
    const allEvents = context.events
    const orders = allEvents.filter((e) => e.type?.includes('ORDER'))
    const payments = allEvents.filter((e) => e.type?.includes('PAYMENT'))
    const feedback = allEvents.filter((e) => e.type?.includes('FEEDBACK'))

    let opportunityCount = 0

    // Check for improvement opportunities
    const completionRate = orders.length > 0 ? payments.length / orders.length : 0
    if (completionRate < 0.9 && orders.length > 5) {
      opportunityCount++
      findings.push(createFinding(context, 'opportunity', 'medium', 'Improve order completion rate',
        `Current rate ${(completionRate * 100).toFixed(0)}% can be improved to 90%+.`, 0.7, true,
        'Streamline order-to-payment process'))
    }

    const ratings = feedback.map((e) => (e.data?.rating as number) || 0).filter((r) => r > 0)
    const avgRating = ratings.length > 0 ? average(ratings) : 0
    if (avgRating > 0 && avgRating < 4) {
      opportunityCount++
      findings.push(createFinding(context, 'opportunity', 'medium', 'Improve customer satisfaction',
        `Current rating ${avgRating.toFixed(1)}/5 can be improved.`, 0.65, true,
        'Focus on service quality and customer experience'))
    }

    metrics.push(createMetric('improvement_opportunities', opportunityCount, 'count', 'Identified improvement opportunities'))
    metrics.push(createMetric('completion_rate', completionRate * 100, '%', 'Current completion rate'))
    metrics.push(createMetric('avg_rating', avgRating, 'rating', 'Current average rating'))

    const impKnowledge = context.knowledge.filter((k) => k.title.toLowerCase().includes('improvement') || k.title.toLowerCase().includes('opportunity'))
    for (const k of impKnowledge.slice(0, 2)) {
      findings.push(createFinding(context, 'opportunity', 'low', `Improvement insight: ${k.title}`, k.statement, k.confidenceScore))
    }

    const confidence = clamp01(0.4 + evidence.evidenceQuality * 0.3)
    const explainability = buildExplainability(context, 'evidence_based_recommendation',
      `Identified ${opportunityCount} improvement opportunities from operational data.`, [])

    return createSkillResult({ skillId: 'skill_improvement_opportunities', skillName: 'Improvement Opportunity Detection', skillVersion: '1.0.0',
      findings, metrics, evidence, explainability, confidence, executionTime: Date.now() - start })
  } catch (error) {
    return createSkillErrorResult('skill_improvement_opportunities', 'Improvement Opportunity Detection', '1.0.0', String(error), Date.now() - start)
  }
}

async function executePerfGap(context: SkillExecutionContext): Promise<SkillExecutionResult> {
  const start = Date.now()
  try {
    const evidence = extractEvidence(context)
    const findings: SkillFinding[] = []
    const metrics: SkillMetric[] = []
    const allEvents = context.events
    const orders = allEvents.filter((e) => e.type?.includes('ORDER'))
    const payments = allEvents.filter((e) => e.type?.includes('PAYMENT'))
    const feedback = allEvents.filter((e) => e.type?.includes('FEEDBACK'))

    // Define targets
    const targets = { completionRate: 0.9, satisfaction: 4.0, throughput: 10 }
    const actual = {
      completionRate: orders.length > 0 ? payments.length / orders.length : 0,
      satisfaction: feedback.length > 0 ? average(feedback.map((f) => (f.data?.rating as number) || 0).filter((r) => r > 0)) : 0,
      throughput: orders.length,
    }

    const gaps = {
      completionRate: Math.max(0, targets.completionRate - actual.completionRate),
      satisfaction: Math.max(0, targets.satisfaction - actual.satisfaction),
      throughput: Math.max(0, targets.throughput - actual.throughput),
    }

    metrics.push(createMetric('completion_gap', gaps.completionRate * 100, '%', 'Completion rate gap'))
    metrics.push(createMetric('satisfaction_gap', gaps.satisfaction, 'rating', 'Satisfaction gap'))
    metrics.push(createMetric('throughput_gap', gaps.throughput, 'orders', 'Throughput gap'))
    metrics.push(createMetric('actual_completion', actual.completionRate * 100, '%', 'Actual completion rate'))
    metrics.push(createMetric('target_completion', targets.completionRate * 100, '%', 'Target completion rate'))

    if (gaps.completionRate > 0.1) {
      findings.push(createFinding(context, 'risk', 'high', 'Significant completion rate gap',
        `Gap of ${(gaps.completionRate * 100).toFixed(0)}% vs target.`, 0.75, true, 'Close the gap with process improvements'))
    }
    if (gaps.satisfaction > 0.5) {
      findings.push(createFinding(context, 'risk', 'medium', 'Satisfaction gap detected',
        `Rating gap of ${gaps.satisfaction.toFixed(1)} vs target ${targets.satisfaction}.`, 0.7, true,
        'Implement customer experience improvements'))
    }

    const confidence = clamp01(0.4 + evidence.evidenceQuality * 0.3)
    const explainability = buildExplainability(context, 'comparative_reasoning',
      `Analyzed performance gaps: completion ${(gaps.completionRate * 100).toFixed(0)}%, satisfaction ${gaps.satisfaction.toFixed(1)}.`, [])

    return createSkillResult({ skillId: 'skill_performance_gap', skillName: 'Performance Gap Analysis', skillVersion: '1.0.0',
      findings, metrics, evidence, explainability, confidence, executionTime: Date.now() - start })
  } catch (error) {
    return createSkillErrorResult('skill_performance_gap', 'Performance Gap Analysis', '1.0.0', String(error), Date.now() - start)
  }
}

async function executeBestPractices(context: SkillExecutionContext): Promise<SkillExecutionResult> {
  const start = Date.now()
  try {
    const evidence = extractEvidence(context)
    const findings: SkillFinding[] = []
    const metrics: SkillMetric[] = []
    const allEvents = context.events
    const orders = allEvents.filter((e) => e.type?.includes('ORDER'))
    const payments = allEvents.filter((e) => e.type?.includes('PAYMENT'))

    // Identify high-performance periods
    const dayMap = new Map<string, { orders: number; payments: number }>()
    for (const o of orders) {
      const day = new Date(o.timestamp).toISOString().split('T')[0]
      if (!dayMap.has(day)) dayMap.set(day, { orders: 0, payments: 0 })
      dayMap.get(day)!.orders++
    }
    for (const p of payments) {
      const day = new Date(p.timestamp).toISOString().split('T')[0]
      if (!dayMap.has(day)) dayMap.set(day, { orders: 0, payments: 0 })
      dayMap.get(day)!.payments++
    }

    const days = Array.from(dayMap.entries()).map(([day, data]) => ({
      day,
      ...data,
      completionRate: data.orders > 0 ? data.payments / data.orders : 0,
    })).sort((a, b) => b.completionRate - a.completionRate)

    if (days.length > 0) {
      const bestDay = days[0]
      metrics.push(createMetric('best_performance_day', days.length, 'date', `Best performing day: ${bestDay.day}`))
      metrics.push(createMetric('best_completion_rate', bestDay.completionRate * 100, '%', 'Best day completion rate'))

      if (bestDay.completionRate > 0.9) {
        findings.push(createFinding(context, 'observation', 'info', `Best practice: ${bestDay.day}`,
          `Day ${bestDay.day} achieved ${(bestDay.completionRate * 100).toFixed(0)}% completion rate.`, 0.6, true,
          'Analyze what made this day successful and replicate'))
      }
    }

    metrics.push(createMetric('days_analyzed', days.length, 'count', 'Days analyzed'))

    const bestKnowledge = context.knowledge.filter((k) => k.title.toLowerCase().includes('best') || k.title.toLowerCase().includes('practice'))
    for (const k of bestKnowledge.slice(0, 2)) {
      findings.push(createFinding(context, 'recommendation', 'low', `Best practice: ${k.title}`, k.statement, k.confidenceScore))
    }

    const confidence = clamp01(0.4 + evidence.evidenceQuality * 0.3)
    const explainability = buildExplainability(context, 'comparative_reasoning',
      `Identified best practices from ${days.length} days of data.`, [])

    return createSkillResult({ skillId: 'skill_best_practices', skillName: 'Best Practice Identification', skillVersion: '1.0.0',
      findings, metrics, evidence, explainability, confidence, executionTime: Date.now() - start })
  } catch (error) {
    return createSkillErrorResult('skill_best_practices', 'Best Practice Identification', '1.0.0', String(error), Date.now() - start)
  }
}

async function executeImprovementTracker(context: SkillExecutionContext): Promise<SkillExecutionResult> {
  const start = Date.now()
  try {
    const evidence = extractEvidence(context)
    const findings: SkillFinding[] = []
    const metrics: SkillMetric[] = []
    const allEvents = context.events
    const orders = allEvents.filter((e) => e.type?.includes('ORDER'))
    const payments = allEvents.filter((e) => e.type?.includes('PAYMENT'))

    // Track improvement over time
    const dayMap = new Map<string, { orders: number; payments: number }>()
    for (const o of orders) {
      const day = new Date(o.timestamp).toISOString().split('T')[0]
      if (!dayMap.has(day)) dayMap.set(day, { orders: 0, payments: 0 })
      dayMap.get(day)!.orders++
    }
    for (const p of payments) {
      const day = new Date(p.timestamp).toISOString().split('T')[0]
      if (!dayMap.has(day)) dayMap.set(day, { orders: 0, payments: 0 })
      dayMap.get(day)!.payments++
    }

    const days = Array.from(dayMap.entries()).sort((a, b) => a[0].localeCompare(b[0]))
    if (days.length >= 2) {
      const first = days[0]
      const last = days[days.length - 1]
      const firstRate = first[1].orders > 0 ? first[1].payments / first[1].orders : 0
      const lastRate = last[1].orders > 0 ? last[1].payments / last[1].orders : 0
      const improvement = lastRate - firstRate

      metrics.push(createMetric('improvement_delta', improvement * 100, '%', 'Improvement delta (first to last day)'))
      metrics.push(createMetric('first_day_rate', firstRate * 100, '%', 'First day completion rate'))
      metrics.push(createMetric('last_day_rate', lastRate * 100, '%', 'Last day completion rate'))

      if (improvement > 0.1) {
        findings.push(createFinding(context, 'trend', 'info', 'Positive improvement trend',
          `Completion rate improved by ${(improvement * 100).toFixed(0)}% over period.`, 0.7))
      } else if (improvement < -0.1) {
        findings.push(createFinding(context, 'trend', 'high', 'Negative improvement trend',
          `Completion rate declined by ${Math.abs(improvement * 100).toFixed(0)}% over period.`, 0.75, true,
          'Investigate causes of decline'))
      }
    }

    metrics.push(createMetric('tracking_period_days', days.length, 'count', 'Tracking period in days'))

    const confidence = clamp01(0.4 + evidence.evidenceQuality * 0.3)
    const explainability = buildExplainability(context, 'temporal_reasoning',
      `Tracked improvement over ${days.length} days.`, [])

    return createSkillResult({ skillId: 'skill_improvement_tracker', skillName: 'Continuous Improvement Tracker', skillVersion: '1.0.0',
      findings, metrics, evidence, explainability, confidence, executionTime: Date.now() - start })
  } catch (error) {
    return createSkillErrorResult('skill_improvement_tracker', 'Continuous Improvement Tracker', '1.0.0', String(error), Date.now() - start)
  }
}

// ============================================================================
// Export
// ============================================================================

export const continuousImprovementSkills: Array<{ definition: OperationalSkill; executor: import('../types').SkillExecutor }> = [
  { definition: processOptDef, executor: createSkillExecutor('skill_process_optimization', executeProcessOpt) },
  { definition: frictionDef, executor: createSkillExecutor('skill_friction_detection', executeFriction) },
  { definition: businessRuleDef, executor: createSkillExecutor('skill_business_rule_validation', executeBusinessRule) },
  { definition: improvementOppDef, executor: createSkillExecutor('skill_improvement_opportunities', executeImprovementOpp) },
  { definition: perfGapDef, executor: createSkillExecutor('skill_performance_gap', executePerfGap) },
  { definition: bestPracticesDef, executor: createSkillExecutor('skill_best_practices', executeBestPractices) },
  { definition: improvementTrackerDef, executor: createSkillExecutor('skill_improvement_tracker', executeImprovementTracker) },
]
