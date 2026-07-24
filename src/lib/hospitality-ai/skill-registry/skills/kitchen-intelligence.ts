/**
 * Operational Skills — Kitchen Intelligence category.
 */
import type { OperationalSkill, SkillExecutionContext, SkillExecutionResult, SkillFinding, SkillMetric } from '../types'
import {
  createSkillDefinition, type SkillDefinitionBuilder, createSkillResult, createSkillErrorResult,
  extractEvidence, buildExplainability, createFinding, createMetric, createSkillExecutor,
} from '../skill-executor-base'
import { average, clamp01 } from '../utils'

const baseConfig: Omit<SkillDefinitionBuilder, 'id' | 'name' | 'description' | 'tags' | 'inputs' | 'outputs'> = {
  category: 'kitchen_intelligence', version: '1.0.0', status: 'production', owner: 'platform',
  supportedDomains: ['kitchen', 'operations'],
  supportedExpertiseProfiles: ['kitchen_advisor', 'operational_excellence_advisor', 'executive_advisor'],
  supportedIntents: ['status_check', 'problem_diagnosis', 'optimization', 'root_cause_analysis', 'operational_review'],
  supportedReasoningStrategies: ['cause_and_effect', 'constraint_optimization', 'temporal_reasoning'],
  requiredKnowledgeCategories: ['kitchen', 'operational'],
  requiredMemoryTypes: ['kitchen'],
  requiredEventTypes: ['KITCHEN_STATUS_CHANGED', 'ORDER_CREATED', 'MENU_ITEM_ORDERED'],
}

const stationLoadDef = createSkillDefinition({
  id: 'skill_station_load', name: 'Station Load Analysis',
  description: 'Analyzes load distribution across kitchen stations.',
  ...baseConfig, tags: ['station', 'load', 'kitchen'],
  inputs: [], outputs: [{ name: 'findings', type: 'finding', description: 'Station load findings' }, { name: 'metrics', type: 'metric', description: 'Station metrics' }],
})

const kitchenBottleneckDef = createSkillDefinition({
  id: 'skill_kitchen_bottleneck', name: 'Kitchen Bottleneck Analysis',
  description: 'Identifies kitchen-specific bottlenecks.',
  ...baseConfig, tags: ['bottleneck', 'kitchen', 'delay'],
  inputs: [], outputs: [{ name: 'findings', type: 'finding', description: 'Bottleneck findings' }, { name: 'metrics', type: 'metric', description: 'Bottleneck metrics' }],
})

const ticketFlowDef = createSkillDefinition({
  id: 'skill_ticket_flow', name: 'Ticket Flow Analysis',
  description: 'Analyzes kitchen ticket flow and processing times.',
  ...baseConfig, tags: ['ticket', 'flow', 'kitchen'],
  inputs: [], outputs: [{ name: 'findings', type: 'finding', description: 'Ticket findings' }, { name: 'metrics', type: 'metric', description: 'Ticket metrics' }],
})

const prepEfficiencyDef = createSkillDefinition({
  id: 'skill_preparation_efficiency', name: 'Preparation Efficiency',
  description: 'Measures kitchen preparation efficiency.',
  ...baseConfig, tags: ['preparation', 'efficiency', 'kitchen'],
  inputs: [], outputs: [{ name: 'findings', type: 'finding', description: 'Efficiency findings' }, { name: 'metrics', type: 'metric', description: 'Efficiency metrics' }],
})

const kitchenCapacityDef = createSkillDefinition({
  id: 'skill_kitchen_capacity', name: 'Kitchen Capacity Analysis',
  description: 'Analyzes kitchen capacity utilization.',
  ...baseConfig, tags: ['capacity', 'kitchen', 'utilization'],
  inputs: [], outputs: [{ name: 'findings', type: 'finding', description: 'Capacity findings' }, { name: 'metrics', type: 'metric', description: 'Capacity metrics' }],
})

const foodQualityDef = createSkillDefinition({
  id: 'skill_food_quality_patterns', name: 'Food Quality Pattern Analysis',
  description: 'Identifies food quality patterns from feedback.',
  ...baseConfig, tags: ['food', 'quality', 'feedback'],
  inputs: [], outputs: [{ name: 'findings', type: 'finding', description: 'Quality findings' }, { name: 'metrics', type: 'metric', description: 'Quality metrics' }],
})

const kitchenStaffPerfDef = createSkillDefinition({
  id: 'skill_kitchen_staff_performance', name: 'Kitchen Staff Performance',
  description: 'Analyzes kitchen staff performance.',
  ...baseConfig, tags: ['staff', 'performance', 'kitchen'],
  inputs: [], outputs: [{ name: 'findings', type: 'finding', description: 'Performance findings' }, { name: 'metrics', type: 'metric', description: 'Performance metrics' }],
})

// ============================================================================
// Executors
// ============================================================================

async function executeStationLoad(context: SkillExecutionContext): Promise<SkillExecutionResult> {
  const start = Date.now()
  try {
    const evidence = extractEvidence(context)
    const findings: SkillFinding[] = []
    const metrics: SkillMetric[] = []
    const kitchenEvents = context.events.filter((e) => e.type?.includes('KITCHEN'))
    const menuItems = context.events.filter((e) => e.type?.includes('MENU_ITEM'))

    // Group by station
    const stationLoad = new Map<string, number>()
    for (const e of [...kitchenEvents, ...menuItems]) {
      const station = (e.data?.station as string) || (e.data?.stationId as string) || 'main'
      stationLoad.set(station, (stationLoad.get(station) || 0) + 1)
    }

    const loads = Array.from(stationLoad.values())
    const avgLoad = loads.length > 0 ? average(loads) : 0
    const maxLoad = loads.length > 0 ? Math.max(...loads) : 0

    metrics.push(createMetric('avg_station_load', avgLoad, 'events', 'Average station load'))
    metrics.push(createMetric('max_station_load', maxLoad, 'events', 'Maximum station load'))
    metrics.push(createMetric('station_count', stationLoad.size, 'count', 'Number of active stations'))

    for (const [station, load] of Array.from(stationLoad.entries()).sort((a, b) => b[1] - a[1])) {
      metrics.push(createMetric(`station_${station}_load`, load, 'events', `Load for ${station} station`))
      if (load > avgLoad * 2 && loads.length > 1) {
        findings.push(createFinding(context, 'risk', 'medium', `Overloaded station: ${station}`,
          `Station ${station} has ${load} events vs avg ${avgLoad.toFixed(1)}.`, 0.7, true,
          'Redistribute load or add capacity to this station'))
      }
    }

    const confidence = clamp01(0.4 + evidence.evidenceQuality * 0.3)
    const explainability = buildExplainability(context, 'constraint_optimization',
      `Analyzed load across ${stationLoad.size} stations. Avg: ${avgLoad.toFixed(1)}, Max: ${maxLoad}.`, [])

    return createSkillResult({ skillId: 'skill_station_load', skillName: 'Station Load Analysis', skillVersion: '1.0.0',
      findings, metrics, evidence, explainability, confidence, executionTime: Date.now() - start })
  } catch (error) {
    return createSkillErrorResult('skill_station_load', 'Station Load Analysis', '1.0.0', String(error), Date.now() - start)
  }
}

async function executeKitchenBottleneck(context: SkillExecutionContext): Promise<SkillExecutionResult> {
  const start = Date.now()
  try {
    const evidence = extractEvidence(context)
    const findings: SkillFinding[] = []
    const metrics: SkillMetric[] = []
    const kitchenEvents = context.events.filter((e) => e.type?.includes('KITCHEN'))
    const orders = context.events.filter((e) => e.type?.includes('ORDER'))

    // Identify delayed orders
    const delayedEvents = kitchenEvents.filter((e) => {
      const status = ((e.data?.status as string) || '').toLowerCase()
      return status.includes('delay') || status.includes('backed') || status.includes('overwhelmed')
    })

    metrics.push(createMetric('delayed_events', delayedEvents.length, 'count', 'Delayed kitchen events'))
    metrics.push(createMetric('delay_rate', kitchenEvents.length > 0 ? (delayedEvents.length / kitchenEvents.length) * 100 : 0, '%', 'Delay rate', 10))

    if (delayedEvents.length > 3) {
      findings.push(createFinding(context, 'risk', 'high', 'Kitchen bottleneck detected',
        `${delayedEvents.length} delayed kitchen events indicate a bottleneck.`, 0.8, true,
        'Review kitchen workflow and station capacity'))
    }

    const bottleneckKnowledge = context.knowledge.filter((k) => k.title.toLowerCase().includes('bottleneck') || k.statement.toLowerCase().includes('delay'))
    for (const k of bottleneckKnowledge.slice(0, 2)) {
      findings.push(createFinding(context, 'observation', 'medium', `Known bottleneck: ${k.title}`, k.statement, k.confidenceScore))
    }

    const confidence = clamp01(0.4 + evidence.evidenceQuality * 0.3)
    const explainability = buildExplainability(context, 'cause_and_effect',
      `Detected ${delayedEvents.length} delays from ${kitchenEvents.length} kitchen events.`, [])

    return createSkillResult({ skillId: 'skill_kitchen_bottleneck', skillName: 'Kitchen Bottleneck Analysis', skillVersion: '1.0.0',
      findings, metrics, evidence, explainability, confidence, executionTime: Date.now() - start })
  } catch (error) {
    return createSkillErrorResult('skill_kitchen_bottleneck', 'Kitchen Bottleneck Analysis', '1.0.0', String(error), Date.now() - start)
  }
}

async function executeTicketFlow(context: SkillExecutionContext): Promise<SkillExecutionResult> {
  const start = Date.now()
  try {
    const evidence = extractEvidence(context)
    const findings: SkillFinding[] = []
    const metrics: SkillMetric[] = []
    const kitchenEvents = context.events.filter((e) => e.type?.includes('KITCHEN'))
    const orders = context.events.filter((e) => e.type?.includes('ORDER'))

    // Estimate ticket processing times
    const processingTimes: number[] = []
    for (let i = 0; i < Math.min(orders.length, 20); i++) {
      const order = orders[i]
      const related = kitchenEvents.find((k) => Math.abs(new Date(k.timestamp).getTime() - new Date(order.timestamp).getTime()) < 60 * 60 * 1000)
      if (related) {
        const time = Math.abs(new Date(related.timestamp).getTime() - new Date(order.timestamp).getTime()) / 60000
        if (time > 0 && time < 120) processingTimes.push(time)
      }
    }

    const avgProcessing = processingTimes.length > 0 ? average(processingTimes) : 0
    metrics.push(createMetric('avg_ticket_time', avgProcessing, 'minutes', 'Average ticket processing time', 15,
      avgProcessing > 25 ? 'critical' : avgProcessing > 20 ? 'warning' : 'good'))
    metrics.push(createMetric('tickets_processed', processingTimes.length, 'count', 'Tickets analyzed'))

    if (avgProcessing > 25) {
      findings.push(createFinding(context, 'risk', 'high', 'Slow ticket processing',
        `Average ticket time of ${avgProcessing.toFixed(1)} minutes exceeds target.`, 0.75, true,
        'Review kitchen workflow and staffing'))
    }

    const confidence = clamp01(0.4 + evidence.evidenceQuality * 0.3 + (processingTimes.length > 5 ? 0.15 : 0))
    const explainability = buildExplainability(context, 'temporal_reasoning',
      `Analyzed ${processingTimes.length} tickets. Avg processing: ${avgProcessing.toFixed(1)} min.`, [])

    return createSkillResult({ skillId: 'skill_ticket_flow', skillName: 'Ticket Flow Analysis', skillVersion: '1.0.0',
      findings, metrics, evidence, explainability, confidence, executionTime: Date.now() - start })
  } catch (error) {
    return createSkillErrorResult('skill_ticket_flow', 'Ticket Flow Analysis', '1.0.0', String(error), Date.now() - start)
  }
}

async function executePrepEfficiency(context: SkillExecutionContext): Promise<SkillExecutionResult> {
  const start = Date.now()
  try {
    const evidence = extractEvidence(context)
    const findings: SkillFinding[] = []
    const metrics: SkillMetric[] = []
    const kitchenEvents = context.events.filter((e) => e.type?.includes('KITCHEN'))
    const menuItems = context.events.filter((e) => e.type?.includes('MENU_ITEM'))

    const efficiency = kitchenEvents.length > 0 && menuItems.length > 0
      ? clamp01(menuItems.length / kitchenEvents.length)
      : 0.5

    metrics.push(createMetric('prep_efficiency', efficiency * 100, '%', 'Preparation efficiency score', 70,
      efficiency < 0.5 ? 'critical' : 'good'))
    metrics.push(createMetric('kitchen_events', kitchenEvents.length, 'count', 'Kitchen events'))
    metrics.push(createMetric('menu_items', menuItems.length, 'count', 'Menu items prepared'))

    if (efficiency < 0.5) {
      findings.push(createFinding(context, 'risk', 'medium', 'Low preparation efficiency',
        `Efficiency score of ${(efficiency * 100).toFixed(0)}% indicates room for improvement.`, 0.7, true,
        'Review prep processes and station organization'))
    }

    const confidence = clamp01(0.4 + evidence.evidenceQuality * 0.3)
    const explainability = buildExplainability(context, 'constraint_optimization',
      `Computed efficiency from ${kitchenEvents.length} kitchen events and ${menuItems.length} menu items.`, [])

    return createSkillResult({ skillId: 'skill_preparation_efficiency', skillName: 'Preparation Efficiency', skillVersion: '1.0.0',
      findings, metrics, evidence, explainability, confidence, executionTime: Date.now() - start })
  } catch (error) {
    return createSkillErrorResult('skill_preparation_efficiency', 'Preparation Efficiency', '1.0.0', String(error), Date.now() - start)
  }
}

async function executeKitchenCapacity(context: SkillExecutionContext): Promise<SkillExecutionResult> {
  const start = Date.now()
  try {
    const evidence = extractEvidence(context)
    const findings: SkillFinding[] = []
    const metrics: SkillMetric[] = []
    const kitchenEvents = context.events.filter((e) => e.type?.includes('KITCHEN'))
    const orders = context.events.filter((e) => e.type?.includes('ORDER'))

    const capacityUtilization = orders.length > 0 ? clamp01(kitchenEvents.length / orders.length) : 0

    metrics.push(createMetric('kitchen_capacity_utilization', capacityUtilization * 100, '%', 'Kitchen capacity utilization', 80,
      capacityUtilization > 0.9 ? 'critical' : 'good'))
    metrics.push(createMetric('kitchen_events', kitchenEvents.length, 'count', 'Kitchen events'))
    metrics.push(createMetric('orders', orders.length, 'count', 'Orders to process'))

    if (capacityUtilization > 0.9) {
      findings.push(createFinding(context, 'risk', 'high', 'Kitchen near capacity',
        `Capacity utilization at ${(capacityUtilization * 100).toFixed(0)}%.`, 0.8, true,
        'Consider expanding kitchen capacity or managing order flow'))
    }

    const confidence = clamp01(0.4 + evidence.evidenceQuality * 0.3)
    const explainability = buildExplainability(context, 'constraint_optimization',
      `Analyzed capacity: ${kitchenEvents.length} events for ${orders.length} orders. Utilization: ${(capacityUtilization * 100).toFixed(0)}%.`, [])

    return createSkillResult({ skillId: 'skill_kitchen_capacity', skillName: 'Kitchen Capacity Analysis', skillVersion: '1.0.0',
      findings, metrics, evidence, explainability, confidence, executionTime: Date.now() - start })
  } catch (error) {
    return createSkillErrorResult('skill_kitchen_capacity', 'Kitchen Capacity Analysis', '1.0.0', String(error), Date.now() - start)
  }
}

async function executeFoodQuality(context: SkillExecutionContext): Promise<SkillExecutionResult> {
  const start = Date.now()
  try {
    const evidence = extractEvidence(context)
    const findings: SkillFinding[] = []
    const metrics: SkillMetric[] = []
    const feedback = context.events.filter((e) => e.type?.includes('FEEDBACK'))

    const foodFeedback = feedback.filter((e) => {
      const cat = ((e.data?.category as string) || '').toLowerCase()
      return cat.includes('food') || cat.includes('quality') || cat.includes('taste')
    })

    const ratings = foodFeedback.map((e) => (e.data?.rating as number) || 0).filter((r) => r > 0)
    const avgRating = ratings.length > 0 ? average(ratings) : 0

    metrics.push(createMetric('food_quality_rating', avgRating, 'rating', 'Average food quality rating', 4.0,
      avgRating < 3 ? 'critical' : avgRating < 4 ? 'warning' : 'good'))
    metrics.push(createMetric('food_feedback_count', foodFeedback.length, 'count', 'Food-related feedback count'))

    if (avgRating > 0 && avgRating < 3) {
      findings.push(createFinding(context, 'risk', 'high', 'Low food quality ratings',
        `Average food quality rating of ${avgRating.toFixed(1)}/5.`, 0.8, true,
        'Review recipes, ingredients, and preparation standards'))
    }

    const qualityKnowledge = context.knowledge.filter((k) => k.title.toLowerCase().includes('quality') || k.title.toLowerCase().includes('food'))
    for (const k of qualityKnowledge.slice(0, 2)) {
      findings.push(createFinding(context, 'observation', 'low', `Quality insight: ${k.title}`, k.statement, k.confidenceScore))
    }

    const confidence = clamp01(0.4 + evidence.evidenceQuality * 0.3)
    const explainability = buildExplainability(context, 'cause_and_effect',
      `Analyzed food quality from ${foodFeedback.length} feedback events. Avg: ${avgRating.toFixed(1)}.`, [])

    return createSkillResult({ skillId: 'skill_food_quality_patterns', skillName: 'Food Quality Pattern Analysis', skillVersion: '1.0.0',
      findings, metrics, evidence, explainability, confidence, executionTime: Date.now() - start })
  } catch (error) {
    return createSkillErrorResult('skill_food_quality_patterns', 'Food Quality Pattern Analysis', '1.0.0', String(error), Date.now() - start)
  }
}

async function executeKitchenStaffPerf(context: SkillExecutionContext): Promise<SkillExecutionResult> {
  const start = Date.now()
  try {
    const evidence = extractEvidence(context)
    const findings: SkillFinding[] = []
    const metrics: SkillMetric[] = []
    const kitchenEvents = context.events.filter((e) => e.type?.includes('KITCHEN'))
    const menuItems = context.events.filter((e) => e.type?.includes('MENU_ITEM'))

    // Group by kitchen staff
    const staffPerf = new Map<string, number>()
    for (const e of [...kitchenEvents, ...menuItems]) {
      const sid = (e.data?.chefId as string) || (e.data?.cookId as string) || (e.data?.staffId as string) || 'unknown'
      staffPerf.set(sid, (staffPerf.get(sid) || 0) + 1)
    }

    const performances = Array.from(staffPerf.values())
    const avgPerf = performances.length > 0 ? average(performances) : 0
    const maxPerf = performances.length > 0 ? Math.max(...performances) : 0

    metrics.push(createMetric('avg_kitchen_staff_output', avgPerf, 'events', 'Average output per kitchen staff'))
    metrics.push(createMetric('max_kitchen_staff_output', maxPerf, 'events', 'Maximum output by single staff'))
    metrics.push(createMetric('kitchen_staff_count', staffPerf.size, 'count', 'Active kitchen staff'))

    if (maxPerf > avgPerf * 2 && performances.length > 1) {
      findings.push(createFinding(context, 'observation', 'medium', 'Performance variance in kitchen staff',
        `Top performer has ${maxPerf} events vs avg ${avgPerf.toFixed(1)}.`, 0.6, true,
        'Share best practices from top performers'))
    }

    const confidence = clamp01(0.4 + evidence.evidenceQuality * 0.3)
    const explainability = buildExplainability(context, 'comparative_reasoning',
      `Analyzed ${staffPerf.size} kitchen staff. Avg output: ${avgPerf.toFixed(1)}.`, [])

    return createSkillResult({ skillId: 'skill_kitchen_staff_performance', skillName: 'Kitchen Staff Performance', skillVersion: '1.0.0',
      findings, metrics, evidence, explainability, confidence, executionTime: Date.now() - start })
  } catch (error) {
    return createSkillErrorResult('skill_kitchen_staff_performance', 'Kitchen Staff Performance', '1.0.0', String(error), Date.now() - start)
  }
}

// ============================================================================
// Export
// ============================================================================

export const kitchenIntelligenceSkills: Array<{ definition: OperationalSkill; executor: import('../types').SkillExecutor }> = [
  { definition: stationLoadDef, executor: createSkillExecutor('skill_station_load', executeStationLoad) },
  { definition: kitchenBottleneckDef, executor: createSkillExecutor('skill_kitchen_bottleneck', executeKitchenBottleneck) },
  { definition: ticketFlowDef, executor: createSkillExecutor('skill_ticket_flow', executeTicketFlow) },
  { definition: prepEfficiencyDef, executor: createSkillExecutor('skill_preparation_efficiency', executePrepEfficiency) },
  { definition: kitchenCapacityDef, executor: createSkillExecutor('skill_kitchen_capacity', executeKitchenCapacity) },
  { definition: foodQualityDef, executor: createSkillExecutor('skill_food_quality_patterns', executeFoodQuality) },
  { definition: kitchenStaffPerfDef, executor: createSkillExecutor('skill_kitchen_staff_performance', executeKitchenStaffPerf) },
]
