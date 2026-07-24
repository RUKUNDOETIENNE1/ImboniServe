/**
 * Operational Skills — Staff Intelligence category.
 */
import type { OperationalSkill, SkillExecutionContext, SkillExecutionResult, SkillFinding, SkillMetric } from '../types'
import {
  createSkillDefinition, type SkillDefinitionBuilder, createSkillResult, createSkillErrorResult,
  extractEvidence, buildExplainability, createFinding, createMetric, createSkillExecutor,
} from '../skill-executor-base'
import { average, clamp01 } from '../utils'

// ============================================================================
// Definitions
// ============================================================================

const baseConfig: Omit<SkillDefinitionBuilder, 'id' | 'name' | 'description' | 'tags' | 'inputs' | 'outputs'> = {
  category: 'staff_intelligence', version: '1.0.0', status: 'production', owner: 'platform',
  supportedDomains: ['staff', 'operations', 'management'],
  supportedExpertiseProfiles: ['staff_performance_advisor', 'executive_advisor', 'operational_excellence_advisor'],
  supportedIntents: ['status_check', 'trend_analysis', 'recommendation_request', 'problem_diagnosis', 'operational_review'],
  supportedReasoningStrategies: ['multi_factor_reasoning', 'comparative_reasoning', 'temporal_reasoning'],
  requiredKnowledgeCategories: ['staff', 'operational'],
  requiredMemoryTypes: ['staff'],
  requiredEventTypes: ['STAFF_CHECK_IN', 'STAFF_CHECK_OUT', 'ORDER_CREATED'],
}

const productivityDef = createSkillDefinition({
  id: 'skill_productivity_analysis', name: 'Productivity Analysis',
  description: 'Analyzes staff productivity metrics from events and knowledge.',
  ...baseConfig, tags: ['productivity', 'staff', 'performance'],
  inputs: [], outputs: [{ name: 'findings', type: 'finding', description: 'Productivity findings' }, { name: 'metrics', type: 'metric', description: 'Productivity metrics' }],
})

const workloadDef = createSkillDefinition({
  id: 'skill_workload_analysis', name: 'Workload Analysis',
  description: 'Analyzes staff workload distribution across team.',
  ...baseConfig, tags: ['workload', 'staff', 'distribution'],
  inputs: [], outputs: [{ name: 'findings', type: 'finding', description: 'Workload findings' }, { name: 'metrics', type: 'metric', description: 'Workload metrics' }],
})

const coachingDef = createSkillDefinition({
  id: 'skill_coaching_opportunities', name: 'Coaching Opportunity Detection',
  description: 'Identifies staff coaching opportunities from performance patterns.',
  ...baseConfig, tags: ['coaching', 'training', 'staff'],
  inputs: [], outputs: [{ name: 'findings', type: 'finding', description: 'Coaching findings' }, { name: 'metrics', type: 'metric', description: 'Coaching metrics' }],
})

const shiftPerformanceDef = createSkillDefinition({
  id: 'skill_shift_performance', name: 'Shift Performance Analysis',
  description: 'Analyzes performance by shift period.',
  ...baseConfig, tags: ['shift', 'performance', 'staff'],
  inputs: [], outputs: [{ name: 'findings', type: 'finding', description: 'Shift findings' }, { name: 'metrics', type: 'metric', description: 'Shift metrics' }],
})

const staffUtilizationDef = createSkillDefinition({
  id: 'skill_staff_utilization', name: 'Staff Utilization Analysis',
  description: 'Analyzes staff utilization rates.',
  ...baseConfig, tags: ['utilization', 'staff', 'efficiency'],
  inputs: [], outputs: [{ name: 'findings', type: 'finding', description: 'Utilization findings' }, { name: 'metrics', type: 'metric', description: 'Utilization metrics' }],
})

const performanceTrendsDef = createSkillDefinition({
  id: 'skill_performance_trends', name: 'Performance Trend Analysis',
  description: 'Analyzes staff performance trends over time.',
  ...baseConfig, tags: ['trends', 'performance', 'staff'],
  inputs: [], outputs: [{ name: 'findings', type: 'finding', description: 'Trend findings' }, { name: 'metrics', type: 'metric', description: 'Trend metrics' }],
})

const trainingNeedsDef = createSkillDefinition({
  id: 'skill_training_needs', name: 'Training Need Detection',
  description: 'Identifies training needs from performance gaps.',
  ...baseConfig, tags: ['training', 'needs', 'staff'],
  inputs: [], outputs: [{ name: 'findings', type: 'finding', description: 'Training findings' }, { name: 'metrics', type: 'metric', description: 'Training metrics' }],
})

// ============================================================================
// Executors
// ============================================================================

async function executeProductivity(context: SkillExecutionContext): Promise<SkillExecutionResult> {
  const start = Date.now()
  try {
    const evidence = extractEvidence(context)
    const findings: SkillFinding[] = []
    const metrics: SkillMetric[] = []
    const checkIns = context.events.filter((e) => e.type?.includes('STAFF_CHECK_IN'))
    const checkOuts = context.events.filter((e) => e.type?.includes('STAFF_CHECK_OUT'))
    const orders = context.events.filter((e) => e.type?.includes('ORDER'))

    const activeStaff = Math.max(0, checkIns.length - checkOuts.length)
    const ordersPerStaff = activeStaff > 0 ? orders.length / activeStaff : 0

    metrics.push(createMetric('orders_per_staff', ordersPerStaff, 'orders/staff', 'Orders handled per active staff member', 10,
      ordersPerStaff > 15 ? 'critical' : ordersPerStaff > 12 ? 'warning' : 'good'))
    metrics.push(createMetric('active_staff', activeStaff, 'staff', 'Active staff count'))
    metrics.push(createMetric('total_orders', orders.length, 'count', 'Total orders'))

    if (ordersPerStaff > 15) {
      findings.push(createFinding(context, 'risk', 'high', 'Staff overload detected',
        `${ordersPerStaff.toFixed(1)} orders per staff member exceeds recommended 10.`, 0.75, true,
        'Increase staffing or redistribute workload'))
    }

    const staffKnowledge = context.knowledge.filter((k) => k.category === 'staff')
    for (const k of staffKnowledge.slice(0, 2)) {
      findings.push(createFinding(context, 'observation', 'low', `Staff insight: ${k.title}`, k.statement, k.confidenceScore))
    }

    const confidence = clamp01(0.4 + evidence.evidenceQuality * 0.3 + (orders.length > 10 ? 0.15 : 0))
    const explainability = buildExplainability(context, 'multi_factor_reasoning',
      `Analyzed productivity: ${orders.length} orders, ${activeStaff} active staff. Ratio: ${ordersPerStaff.toFixed(1)}.`, [])

    return createSkillResult({ skillId: 'skill_productivity_analysis', skillName: 'Productivity Analysis', skillVersion: '1.0.0',
      findings, metrics, evidence, explainability, confidence, executionTime: Date.now() - start })
  } catch (error) {
    return createSkillErrorResult('skill_productivity_analysis', 'Productivity Analysis', '1.0.0', String(error), Date.now() - start)
  }
}

async function executeWorkload(context: SkillExecutionContext): Promise<SkillExecutionResult> {
  const start = Date.now()
  try {
    const evidence = extractEvidence(context)
    const findings: SkillFinding[] = []
    const metrics: SkillMetric[] = []
    const checkIns = context.events.filter((e) => e.type?.includes('STAFF_CHECK_IN'))
    const orders = context.events.filter((e) => e.type?.includes('ORDER'))

    // Group orders by staff
    const staffWorkload = new Map<string, number>()
    for (const o of orders) {
      const sid = (o.data?.staffId as string) || (o.data?.serverId as string) || 'unassigned'
      staffWorkload.set(sid, (staffWorkload.get(sid) || 0) + 1)
    }

    const workloads = Array.from(staffWorkload.values())
    const avgWorkload = workloads.length > 0 ? average(workloads) : 0
    const maxWorkload = workloads.length > 0 ? Math.max(...workloads) : 0
    const minWorkload = workloads.length > 0 ? Math.min(...workloads) : 0

    metrics.push(createMetric('avg_workload', avgWorkload, 'orders', 'Average orders per staff'))
    metrics.push(createMetric('max_workload', maxWorkload, 'orders', 'Maximum orders per staff'))
    metrics.push(createMetric('min_workload', minWorkload, 'orders', 'Minimum orders per staff'))
    metrics.push(createMetric('workload_imbalance', maxWorkload - minWorkload, 'orders', 'Workload imbalance range'))

    if (maxWorkload > avgWorkload * 2 && workloads.length > 1) {
      findings.push(createFinding(context, 'risk', 'medium', 'Workload imbalance detected',
        `Max workload ${maxWorkload} is more than 2x average ${avgWorkload.toFixed(1)}.`, 0.7, true,
        'Redistribute orders more evenly across staff'))
    }

    const confidence = clamp01(0.4 + evidence.evidenceQuality * 0.3)
    const explainability = buildExplainability(context, 'comparative_reasoning',
      `Analyzed workload across ${staffWorkload.size} staff. Avg: ${avgWorkload.toFixed(1)}, Max: ${maxWorkload}.`, [])

    return createSkillResult({ skillId: 'skill_workload_analysis', skillName: 'Workload Analysis', skillVersion: '1.0.0',
      findings, metrics, evidence, explainability, confidence, executionTime: Date.now() - start })
  } catch (error) {
    return createSkillErrorResult('skill_workload_analysis', 'Workload Analysis', '1.0.0', String(error), Date.now() - start)
  }
}

async function executeCoaching(context: SkillExecutionContext): Promise<SkillExecutionResult> {
  const start = Date.now()
  try {
    const evidence = extractEvidence(context)
    const findings: SkillFinding[] = []
    const metrics: SkillMetric[] = []
    const feedback = context.events.filter((e) => e.type?.includes('FEEDBACK'))
    const staffKnowledge = context.knowledge.filter((k) => k.category === 'staff')

    // Identify low-performance areas from feedback
    const lowRatings = feedback.filter((e) => {
      const r = (e.data?.rating as number) || 0
      return r > 0 && r < 3
    })

    metrics.push(createMetric('low_rating_count', lowRatings.length, 'count', 'Low ratings indicating coaching needs'))

    if (lowRatings.length > 3) {
      findings.push(createFinding(context, 'opportunity', 'medium', 'Coaching opportunity from low ratings',
        `${lowRatings.length} low ratings suggest staff coaching opportunities.`, 0.65, true,
        'Schedule targeted coaching sessions for affected staff'))
    }

    for (const k of staffKnowledge.slice(0, 3)) {
      if (k.title.toLowerCase().includes('coaching') || k.title.toLowerCase().includes('training') || k.title.toLowerCase().includes('improvement')) {
        findings.push(createFinding(context, 'recommendation', 'medium', `Coaching insight: ${k.title}`, k.statement, k.confidenceScore, true))
      }
    }

    const confidence = clamp01(0.4 + evidence.evidenceQuality * 0.3)
    const explainability = buildExplainability(context, 'multi_factor_reasoning',
      `Identified coaching opportunities from ${lowRatings.length} low ratings and ${staffKnowledge.length} staff knowledge items.`, [])

    return createSkillResult({ skillId: 'skill_coaching_opportunities', skillName: 'Coaching Opportunity Detection', skillVersion: '1.0.0',
      findings, metrics, evidence, explainability, confidence, executionTime: Date.now() - start })
  } catch (error) {
    return createSkillErrorResult('skill_coaching_opportunities', 'Coaching Opportunity Detection', '1.0.0', String(error), Date.now() - start)
  }
}

async function executeShiftPerformance(context: SkillExecutionContext): Promise<SkillExecutionResult> {
  const start = Date.now()
  try {
    const evidence = extractEvidence(context)
    const findings: SkillFinding[] = []
    const metrics: SkillMetric[] = []
    const checkIns = context.events.filter((e) => e.type?.includes('STAFF_CHECK_IN'))
    const orders = context.events.filter((e) => e.type?.includes('ORDER'))

    // Group by shift (morning: 6-12, afternoon: 12-18, evening: 18-24)
    const shifts = { morning: 0, afternoon: 0, evening: 0 }
    for (const o of orders) {
      const hour = new Date(o.timestamp).getHours()
      if (hour < 12) shifts.morning++
      else if (hour < 18) shifts.afternoon++
      else shifts.evening++
    }

    metrics.push(createMetric('morning_orders', shifts.morning, 'count', 'Morning shift orders'))
    metrics.push(createMetric('afternoon_orders', shifts.afternoon, 'count', 'Afternoon shift orders'))
    metrics.push(createMetric('evening_orders', shifts.evening, 'count', 'Evening shift orders'))

    const max = Math.max(shifts.morning, shifts.afternoon, shifts.evening)
    const min = Math.min(shifts.morning, shifts.afternoon, shifts.evening)
    if (max > min * 3 && min > 0) {
      findings.push(createFinding(context, 'trend', 'medium', 'Significant shift performance variance',
        `Orders range from ${min} to ${max} across shifts.`, 0.6, true,
        'Review staffing allocation across shifts'))
    }

    const confidence = clamp01(0.4 + evidence.evidenceQuality * 0.3 + (orders.length > 10 ? 0.15 : 0))
    const explainability = buildExplainability(context, 'temporal_reasoning',
      `Analyzed shift performance: morning ${shifts.morning}, afternoon ${shifts.afternoon}, evening ${shifts.evening}.`, [])

    return createSkillResult({ skillId: 'skill_shift_performance', skillName: 'Shift Performance Analysis', skillVersion: '1.0.0',
      findings, metrics, evidence, explainability, confidence, executionTime: Date.now() - start })
  } catch (error) {
    return createSkillErrorResult('skill_shift_performance', 'Shift Performance Analysis', '1.0.0', String(error), Date.now() - start)
  }
}

async function executeStaffUtilization(context: SkillExecutionContext): Promise<SkillExecutionResult> {
  const start = Date.now()
  try {
    const evidence = extractEvidence(context)
    const findings: SkillFinding[] = []
    const metrics: SkillMetric[] = []
    const checkIns = context.events.filter((e) => e.type?.includes('STAFF_CHECK_IN'))
    const checkOuts = context.events.filter((e) => e.type?.includes('STAFF_CHECK_OUT'))
    const orders = context.events.filter((e) => e.type?.includes('ORDER'))

    const activeStaff = Math.max(0, checkIns.length - checkOuts.length)
    const utilization = activeStaff > 0 ? clamp01(orders.length / (activeStaff * 10)) : 0

    metrics.push(createMetric('staff_utilization', utilization * 100, '%', 'Staff utilization rate', 70,
      utilization > 0.9 ? 'critical' : utilization < 0.3 ? 'warning' : 'good'))
    metrics.push(createMetric('active_staff', activeStaff, 'staff', 'Active staff'))
    metrics.push(createMetric('orders', orders.length, 'count', 'Total orders'))

    if (utilization > 0.9) {
      findings.push(createFinding(context, 'risk', 'high', 'Staff over-utilization',
        `Utilization at ${(utilization * 100).toFixed(0)}% indicates staff overload.`, 0.75, true,
        'Add staff or redistribute workload'))
    } else if (utilization < 0.3 && activeStaff > 0) {
      findings.push(createFinding(context, 'opportunity', 'medium', 'Staff under-utilization',
        `Utilization at only ${(utilization * 100).toFixed(0)}%.`, 0.6, true,
        'Consider reducing staff or increasing demand'))
    }

    const confidence = clamp01(0.4 + evidence.evidenceQuality * 0.3)
    const explainability = buildExplainability(context, 'multi_factor_reasoning',
      `Computed utilization from ${activeStaff} staff and ${orders.length} orders: ${(utilization * 100).toFixed(0)}%.`, [])

    return createSkillResult({ skillId: 'skill_staff_utilization', skillName: 'Staff Utilization Analysis', skillVersion: '1.0.0',
      findings, metrics, evidence, explainability, confidence, executionTime: Date.now() - start })
  } catch (error) {
    return createSkillErrorResult('skill_staff_utilization', 'Staff Utilization Analysis', '1.0.0', String(error), Date.now() - start)
  }
}

async function executePerformanceTrends(context: SkillExecutionContext): Promise<SkillExecutionResult> {
  const start = Date.now()
  try {
    const evidence = extractEvidence(context)
    const findings: SkillFinding[] = []
    const metrics: SkillMetric[] = []
    const feedback = context.events.filter((e) => e.type?.includes('FEEDBACK'))

    // Group feedback by day
    const dayMap = new Map<string, number[]>()
    for (const f of feedback) {
      const day = new Date(f.timestamp).toISOString().split('T')[0]
      const rating = (f.data?.rating as number) || 0
      if (rating > 0) {
        if (!dayMap.has(day)) dayMap.set(day, [])
        dayMap.get(day)!.push(rating)
      }
    }

    const days = Array.from(dayMap.entries()).sort((a, b) => a[0].localeCompare(b[0]))
    if (days.length >= 2) {
      const firstHalf = days.slice(0, Math.floor(days.length / 2))
      const secondHalf = days.slice(Math.floor(days.length / 2))
      const firstAvg = average(firstHalf.flatMap((d) => d[1]))
      const secondAvg = average(secondHalf.flatMap((d) => d[1]))
      const trend = secondAvg > firstAvg ? 'up' : secondAvg < firstAvg ? 'down' : 'stable'
      const change = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0

      metrics.push(createMetric('performance_trend', change, '%', 'Performance trend', 0, trend === 'down' ? 'critical' : 'good', trend))
      metrics.push(createMetric('avg_rating_first_half', firstAvg, 'rating', 'Average rating (first half)'))
      metrics.push(createMetric('avg_rating_second_half', secondAvg, 'rating', 'Average rating (second half)'))

      if (trend === 'down' && change < -10) {
        findings.push(createFinding(context, 'trend', 'high', 'Declining staff performance trend',
          `Performance declined by ${Math.abs(change).toFixed(1)}%.`, 0.7, true, 'Investigate causes and provide support'))
      }
    }

    const confidence = clamp01(0.4 + evidence.evidenceQuality * 0.3)
    const explainability = buildExplainability(context, 'temporal_reasoning',
      `Analyzed performance trends across ${days.length} days.`, [])

    return createSkillResult({ skillId: 'skill_performance_trends', skillName: 'Performance Trend Analysis', skillVersion: '1.0.0',
      findings, metrics, evidence, explainability, confidence, executionTime: Date.now() - start })
  } catch (error) {
    return createSkillErrorResult('skill_performance_trends', 'Performance Trend Analysis', '1.0.0', String(error), Date.now() - start)
  }
}

async function executeTrainingNeeds(context: SkillExecutionContext): Promise<SkillExecutionResult> {
  const start = Date.now()
  try {
    const evidence = extractEvidence(context)
    const findings: SkillFinding[] = []
    const metrics: SkillMetric[] = []
    const feedback = context.events.filter((e) => e.type?.includes('FEEDBACK'))
    const staffKnowledge = context.knowledge.filter((k) => k.category === 'staff')

    const lowRatings = feedback.filter((e) => {
      const r = (e.data?.rating as number) || 0
      return r > 0 && r < 3
    })

    metrics.push(createMetric('training_need_indicators', lowRatings.length, 'count', 'Indicators of training needs'))

    // Identify specific training areas from feedback categories
    const trainingAreas = new Map<string, number>()
    for (const f of lowRatings) {
      const cat = (f.data?.category as string) || 'general'
      trainingAreas.set(cat, (trainingAreas.get(cat) || 0) + 1)
    }
    for (const [area, count] of Array.from(trainingAreas.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3)) {
      if (count >= 2) {
        findings.push(createFinding(context, 'recommendation', 'medium', `Training need: ${area}`,
          `${count} low ratings in ${area} indicate training need.`, 0.65, true, `Schedule training for ${area}`))
      }
    }

    for (const k of staffKnowledge.slice(0, 2)) {
      if (k.title.toLowerCase().includes('training') || k.title.toLowerCase().includes('skill')) {
        findings.push(createFinding(context, 'recommendation', 'low', `Training reference: ${k.title}`, k.statement, k.confidenceScore))
      }
    }

    const confidence = clamp01(0.4 + evidence.evidenceQuality * 0.3)
    const explainability = buildExplainability(context, 'multi_factor_reasoning',
      `Identified training needs from ${lowRatings.length} low ratings across ${trainingAreas.size} areas.`, [])

    return createSkillResult({ skillId: 'skill_training_needs', skillName: 'Training Need Detection', skillVersion: '1.0.0',
      findings, metrics, evidence, explainability, confidence, executionTime: Date.now() - start })
  } catch (error) {
    return createSkillErrorResult('skill_training_needs', 'Training Need Detection', '1.0.0', String(error), Date.now() - start)
  }
}

// ============================================================================
// Export
// ============================================================================

export const staffIntelligenceSkills: Array<{ definition: OperationalSkill; executor: import('../types').SkillExecutor }> = [
  { definition: productivityDef, executor: createSkillExecutor('skill_productivity_analysis', executeProductivity) },
  { definition: workloadDef, executor: createSkillExecutor('skill_workload_analysis', executeWorkload) },
  { definition: coachingDef, executor: createSkillExecutor('skill_coaching_opportunities', executeCoaching) },
  { definition: shiftPerformanceDef, executor: createSkillExecutor('skill_shift_performance', executeShiftPerformance) },
  { definition: staffUtilizationDef, executor: createSkillExecutor('skill_staff_utilization', executeStaffUtilization) },
  { definition: performanceTrendsDef, executor: createSkillExecutor('skill_performance_trends', executePerformanceTrends) },
  { definition: trainingNeedsDef, executor: createSkillExecutor('skill_training_needs', executeTrainingNeeds) },
]
