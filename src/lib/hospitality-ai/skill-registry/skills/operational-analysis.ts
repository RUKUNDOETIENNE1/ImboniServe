/**
 * Operational Skills — Operational Analysis category.
 *
 * Skills for analyzing operational performance:
 * - Bottleneck Detection
 * - Capacity Analysis
 * - Queue Analysis
 * - Throughput Analysis
 * - Wait Time Analysis
 * - Peak Hour Analysis
 * - Operational Efficiency Analysis
 * - Resource Utilization Analysis
 */

import type {
  OperationalSkill,
  SkillExecutionContext,
  SkillExecutionResult,
  SkillFinding,
  SkillMetric,
} from '../types'
import {
  createSkillDefinition,
  createSkillResult,
  createSkillErrorResult,
  extractEvidence,
  buildExplainability,
  createFinding,
  createMetric,
  createSkillExecutor,
} from '../skill-executor-base'
import { average, clamp01 } from '../utils'

// ============================================================================
// Skill Definitions
// ============================================================================

const bottleneckDetectionDef = createSkillDefinition({
  id: 'skill_bottleneck_detection',
  name: 'Bottleneck Detection',
  description: 'Identifies operational bottlenecks by analyzing event patterns, knowledge about delays, and memory of recurring issues.',
  category: 'operational_analysis',
  version: '1.0.0',
  status: 'production',
  owner: 'platform',
  tags: ['bottleneck', 'efficiency', 'operations', 'delays'],
  supportedDomains: ['operations', 'kitchen', 'service'],
  supportedExpertiseProfiles: ['operational_excellence_advisor', 'kitchen_advisor', 'service_advisor', 'executive_advisor'],
  supportedIntents: ['root_cause_analysis', 'problem_diagnosis', 'optimization', 'operational_review'],
  supportedReasoningStrategies: ['cause_and_effect', 'diagnostic_reasoning'],
  requiredKnowledgeCategories: ['operational', 'kitchen', 'service'],
  requiredMemoryTypes: ['operational', 'kitchen', 'service'],
  requiredEventTypes: ['KITCHEN_STATUS_CHANGED', 'ORDER_CREATED', 'TABLE_OCCUPIED'],
  inputs: [
    { name: 'threshold', type: 'number', required: false, description: 'Delay threshold in minutes', defaultValue: 15 },
  ],
  outputs: [
    { name: 'findings', type: 'finding', description: 'Detected bottlenecks' },
    { name: 'metrics', type: 'metric', description: 'Bottleneck severity metrics' },
  ],
})

const capacityAnalysisDef = createSkillDefinition({
  id: 'skill_capacity_analysis',
  name: 'Capacity Analysis',
  description: 'Analyzes operational capacity utilization and identifies over/under-capacity situations.',
  category: 'operational_analysis',
  version: '1.0.0',
  status: 'production',
  owner: 'platform',
  tags: ['capacity', 'utilization', 'resources'],
  supportedDomains: ['operations', 'kitchen', 'service', 'inventory'],
  supportedExpertiseProfiles: ['operational_excellence_advisor', 'kitchen_advisor', 'executive_advisor'],
  supportedIntents: ['status_check', 'optimization', 'operational_review', 'planning'],
  supportedReasoningStrategies: ['constraint_optimization', 'multi_factor_reasoning'],
  requiredKnowledgeCategories: ['operational', 'kitchen'],
  requiredMemoryTypes: ['operational'],
  requiredEventTypes: ['ORDER_CREATED', 'TABLE_OCCUPIED', 'KITCHEN_STATUS_CHANGED'],
  inputs: [
    { name: 'maxCapacity', type: 'number', required: false, description: 'Maximum operational capacity', defaultValue: 100 },
  ],
  outputs: [
    { name: 'findings', type: 'finding', description: 'Capacity findings' },
    { name: 'metrics', type: 'metric', description: 'Utilization metrics' },
  ],
})

const queueAnalysisDef = createSkillDefinition({
  id: 'skill_queue_analysis',
  name: 'Queue Analysis',
  description: 'Analyzes queue patterns, wait times, and customer flow to identify queue management opportunities.',
  category: 'operational_analysis',
  version: '1.0.0',
  status: 'production',
  owner: 'platform',
  tags: ['queue', 'wait', 'flow', 'customer'],
  supportedDomains: ['service', 'operations'],
  supportedExpertiseProfiles: ['service_advisor', 'operational_excellence_advisor', 'customer_experience_advisor'],
  supportedIntents: ['status_check', 'optimization', 'problem_diagnosis'],
  supportedReasoningStrategies: ['temporal_reasoning', 'cause_and_effect'],
  requiredKnowledgeCategories: ['service', 'operational'],
  requiredMemoryTypes: ['service', 'operational'],
  requiredEventTypes: ['TABLE_OCCUPIED', 'RESERVATION_CREATED', 'ORDER_CREATED'],
  inputs: [],
  outputs: [
    { name: 'findings', type: 'finding', description: 'Queue findings' },
    { name: 'metrics', type: 'metric', description: 'Queue metrics' },
  ],
})

const throughputAnalysisDef = createSkillDefinition({
  id: 'skill_throughput_analysis',
  name: 'Throughput Analysis',
  description: 'Measures operational throughput (orders/hour, covers/hour) and identifies throughput-limiting factors.',
  category: 'operational_analysis',
  version: '1.0.0',
  status: 'production',
  owner: 'platform',
  tags: ['throughput', 'volume', 'efficiency'],
  supportedDomains: ['operations', 'kitchen', 'service'],
  supportedExpertiseProfiles: ['operational_excellence_advisor', 'kitchen_advisor', 'executive_advisor'],
  supportedIntents: ['status_check', 'trend_analysis', 'optimization', 'operational_review'],
  supportedReasoningStrategies: ['temporal_reasoning', 'comparative_reasoning'],
  requiredKnowledgeCategories: ['operational', 'kitchen'],
  requiredMemoryTypes: ['operational'],
  requiredEventTypes: ['ORDER_CREATED', 'PAYMENT_CONFIRMED'],
  inputs: [],
  outputs: [
    { name: 'findings', type: 'finding', description: 'Throughput findings' },
    { name: 'metrics', type: 'metric', description: 'Throughput metrics' },
  ],
})

const waitTimeAnalysisDef = createSkillDefinition({
  id: 'skill_wait_time_analysis',
  name: 'Wait Time Analysis',
  description: 'Analyzes customer wait times across service stages and identifies improvement opportunities.',
  category: 'operational_analysis',
  version: '1.0.0',
  status: 'production',
  owner: 'platform',
  tags: ['wait_time', 'service', 'customer'],
  supportedDomains: ['service', 'operations'],
  supportedExpertiseProfiles: ['service_advisor', 'customer_experience_advisor', 'operational_excellence_advisor'],
  supportedIntents: ['status_check', 'problem_diagnosis', 'optimization', 'root_cause_analysis'],
  supportedReasoningStrategies: ['cause_and_effect', 'temporal_reasoning'],
  requiredKnowledgeCategories: ['service', 'operational'],
  requiredMemoryTypes: ['service'],
  requiredEventTypes: ['ORDER_CREATED', 'TABLE_OCCUPIED', 'KITCHEN_STATUS_CHANGED'],
  inputs: [
    { name: 'targetWaitMinutes', type: 'number', required: false, description: 'Target wait time', defaultValue: 10 },
  ],
  outputs: [
    { name: 'findings', type: 'finding', description: 'Wait time findings' },
    { name: 'metrics', type: 'metric', description: 'Wait time metrics' },
  ],
})

const peakHourAnalysisDef = createSkillDefinition({
  id: 'skill_peak_hour_analysis',
  name: 'Peak Hour Analysis',
  description: 'Identifies peak operational hours and analyzes performance during peak vs. off-peak periods.',
  category: 'operational_analysis',
  version: '1.0.0',
  status: 'production',
  owner: 'platform',
  tags: ['peak', 'hours', 'temporal', 'capacity'],
  supportedDomains: ['operations', 'service', 'kitchen'],
  supportedExpertiseProfiles: ['operational_excellence_advisor', 'kitchen_advisor', 'service_advisor', 'executive_advisor'],
  supportedIntents: ['trend_analysis', 'planning', 'optimization', 'operational_review'],
  supportedReasoningStrategies: ['temporal_reasoning', 'comparative_reasoning'],
  requiredKnowledgeCategories: ['operational', 'service'],
  requiredMemoryTypes: ['operational'],
  requiredEventTypes: ['ORDER_CREATED', 'TABLE_OCCUPIED'],
  inputs: [],
  outputs: [
    { name: 'findings', type: 'finding', description: 'Peak hour findings' },
    { name: 'metrics', type: 'metric', description: 'Peak hour metrics' },
  ],
})

const operationalEfficiencyDef = createSkillDefinition({
  id: 'skill_operational_efficiency',
  name: 'Operational Efficiency Analysis',
  description: 'Computes overall operational efficiency score based on throughput, wait times, and resource utilization.',
  category: 'operational_analysis',
  version: '1.0.0',
  status: 'production',
  owner: 'platform',
  tags: ['efficiency', 'score', 'operations'],
  supportedDomains: ['operations', 'cross_domain'],
  supportedExpertiseProfiles: ['operational_excellence_advisor', 'executive_advisor'],
  supportedIntents: ['status_check', 'operational_review', 'optimization', 'trend_analysis'],
  supportedReasoningStrategies: ['multi_factor_reasoning', 'summary_synthesis'],
  requiredKnowledgeCategories: ['operational', 'business'],
  requiredMemoryTypes: ['operational'],
  requiredEventTypes: ['ORDER_CREATED', 'PAYMENT_CONFIRMED', 'KITCHEN_STATUS_CHANGED'],
  inputs: [],
  outputs: [
    { name: 'findings', type: 'finding', description: 'Efficiency findings' },
    { name: 'metrics', type: 'metric', description: 'Efficiency metrics' },
  ],
})

const resourceUtilizationDef = createSkillDefinition({
  id: 'skill_resource_utilization',
  name: 'Resource Utilization Analysis',
  description: 'Analyzes how effectively operational resources (staff, stations, tables) are utilized.',
  category: 'operational_analysis',
  version: '1.0.0',
  status: 'production',
  owner: 'platform',
  tags: ['resources', 'utilization', 'staff', 'tables'],
  supportedDomains: ['operations', 'staff', 'service'],
  supportedExpertiseProfiles: ['operational_excellence_advisor', 'staff_performance_advisor', 'executive_advisor'],
  supportedIntents: ['status_check', 'optimization', 'operational_review'],
  supportedReasoningStrategies: ['constraint_optimization', 'multi_factor_reasoning'],
  requiredKnowledgeCategories: ['operational', 'staff'],
  requiredMemoryTypes: ['operational', 'staff'],
  requiredEventTypes: ['STAFF_CHECK_IN', 'STAFF_CHECK_OUT', 'TABLE_OCCUPIED'],
  inputs: [],
  outputs: [
    { name: 'findings', type: 'finding', description: 'Utilization findings' },
    { name: 'metrics', type: 'metric', description: 'Utilization metrics' },
  ],
})

// ============================================================================
// Skill Executors
// ============================================================================

async function executeBottleneckDetection(context: SkillExecutionContext): Promise<SkillExecutionResult> {
  const start = Date.now()
  try {
    const threshold = (context.inputs.threshold as number) || 15
    const evidence = extractEvidence(context)
    const findings: SkillFinding[] = []
    const metrics: SkillMetric[] = []

    // Analyze kitchen events for delays
    const kitchenEvents = context.events.filter((e) => e.type?.includes('KITCHEN'))
    const orderEvents = context.events.filter((e) => e.type?.includes('ORDER'))

    if (kitchenEvents.length > 0 && orderEvents.length > 0) {
      // Estimate average preparation time from event timestamps
      const prepTimes: number[] = []
      for (const order of orderEvents.slice(0, 20)) {
        const relatedKitchen = kitchenEvents.find(
          (k) => Math.abs(new Date(k.timestamp).getTime() - new Date(order.timestamp).getTime()) < 60 * 60 * 1000
        )
        if (relatedKitchen) {
          const prepTime = Math.abs(new Date(relatedKitchen.timestamp).getTime() - new Date(order.timestamp).getTime()) / 60000
          prepTimes.push(prepTime)
        }
      }

      if (prepTimes.length > 0) {
        const avgPrepTime = average(prepTimes)
        metrics.push(createMetric('avg_preparation_time', avgPrepTime, 'minutes', 'Average order preparation time', threshold, avgPrepTime > threshold ? 'critical' : 'good'))

        if (avgPrepTime > threshold) {
          findings.push(createFinding(
            context, 'anomaly', 'high', 'Kitchen preparation bottleneck detected',
            `Average preparation time of ${avgPrepTime.toFixed(1)} minutes exceeds threshold of ${threshold} minutes.`,
            clamp01(0.6 + (avgPrepTime - threshold) / 30),
            true, 'Review kitchen station load balancing and prep sequencing'
          ))
        }
      }
    }

    // Check knowledge for known bottleneck patterns
    const bottleneckKnowledge = context.knowledge.filter(
      (k) => k.title.toLowerCase().includes('bottleneck') || k.description.toLowerCase().includes('delay')
    )
    for (const k of bottleneckKnowledge.slice(0, 3)) {
      findings.push(createFinding(
        context, 'observation', 'medium', `Known bottleneck: ${k.title}`,
        k.statement, k.confidenceScore, true
      ))
    }

    const confidence = clamp01(0.4 + evidence.evidenceQuality * 0.3 + (findings.length > 0 ? 0.2 : 0))
    const explainability = buildExplainability(
      context, 'cause_and_effect',
      `Analyzed ${kitchenEvents.length} kitchen events and ${orderEvents.length} order events. Identified ${findings.length} bottleneck findings based on ${evidence.evidenceCount} evidence items.`,
      [{ option: 'No action — monitor trends', rationale: 'Bottleneck may be transient', confidence: 0.3 }]
    )

    return createSkillResult({
      skillId: 'skill_bottleneck_detection', skillName: 'Bottleneck Detection', skillVersion: '1.0.0',
      findings, metrics, evidence, explainability, confidence, executionTime: Date.now() - start,
    })
  } catch (error) {
    return createSkillErrorResult('skill_bottleneck_detection', 'Bottleneck Detection', '1.0.0', String(error), Date.now() - start)
  }
}

async function executeCapacityAnalysis(context: SkillExecutionContext): Promise<SkillExecutionResult> {
  const start = Date.now()
  try {
    const maxCapacity = (context.inputs.maxCapacity as number) || 100
    const evidence = extractEvidence(context)
    const findings: SkillFinding[] = []
    const metrics: SkillMetric[] = []

    const orderEvents = context.events.filter((e) => e.type?.includes('ORDER'))
    const tableEvents = context.events.filter((e) => e.type?.includes('TABLE'))

    // Estimate current utilization
    const utilization = orderEvents.length > 0 ? clamp01((tableEvents.length / Math.max(1, orderEvents.length)) * 0.5) : 0
    metrics.push(createMetric('capacity_utilization', utilization * 100, '%', 'Current capacity utilization', 80, utilization > 0.9 ? 'critical' : utilization > 0.7 ? 'warning' : 'good'))

    if (utilization > 0.85) {
      findings.push(createFinding(
        context, 'risk', 'high', 'Near-maximum capacity utilization',
        `Capacity utilization at ${(utilization * 100).toFixed(0)}% approaches maximum. Risk of service degradation.`,
        0.8, true, 'Consider adding resources or managing demand'
      ))
    } else if (utilization < 0.3 && orderEvents.length > 5) {
      findings.push(createFinding(
        context, 'opportunity', 'medium', 'Under-utilized capacity',
        `Capacity utilization at only ${(utilization * 100).toFixed(0)}%. Opportunity to increase throughput.`,
        0.6, true, 'Consider promotional activities to increase demand'
      ))
    }

    const confidence = clamp01(0.4 + evidence.evidenceQuality * 0.3)
    const explainability = buildExplainability(
      context, 'constraint_optimization',
      `Analyzed capacity using ${orderEvents.length} orders and ${tableEvents.length} table events. Utilization: ${(utilization * 100).toFixed(0)}%.`,
      []
    )

    return createSkillResult({
      skillId: 'skill_capacity_analysis', skillName: 'Capacity Analysis', skillVersion: '1.0.0',
      findings, metrics, evidence, explainability, confidence, executionTime: Date.now() - start,
    })
  } catch (error) {
    return createSkillErrorResult('skill_capacity_analysis', 'Capacity Analysis', '1.0.0', String(error), Date.now() - start)
  }
}

async function executeQueueAnalysis(context: SkillExecutionContext): Promise<SkillExecutionResult> {
  const start = Date.now()
  try {
    const evidence = extractEvidence(context)
    const findings: SkillFinding[] = []
    const metrics: SkillMetric[] = []

    const tableEvents = context.events.filter((e) => e.type?.includes('TABLE'))
    const reservationEvents = context.events.filter((e) => e.type?.includes('RESERVATION'))

    // Estimate queue length from reservation vs table events
    const queueRatio = tableEvents.length > 0 ? reservationEvents.length / tableEvents.length : 0
    metrics.push(createMetric('queue_ratio', queueRatio, 'ratio', 'Reservation-to-table ratio', 1.0, queueRatio > 1.5 ? 'warning' : 'good'))

    if (queueRatio > 1.5) {
      findings.push(createFinding(
        context, 'risk', 'medium', 'Queue buildup detected',
        `Reservation-to-table ratio of ${queueRatio.toFixed(2)} suggests queue buildup.`,
        0.7, true, 'Consider increasing table turnover or managing reservations'
      ))
    }

    const confidence = clamp01(0.4 + evidence.evidenceQuality * 0.3)
    const explainability = buildExplainability(
      context, 'temporal_reasoning',
      `Analyzed queue patterns using ${tableEvents.length} table events and ${reservationEvents.length} reservations.`,
      []
    )

    return createSkillResult({
      skillId: 'skill_queue_analysis', skillName: 'Queue Analysis', skillVersion: '1.0.0',
      findings, metrics, evidence, explainability, confidence, executionTime: Date.now() - start,
    })
  } catch (error) {
    return createSkillErrorResult('skill_queue_analysis', 'Queue Analysis', '1.0.0', String(error), Date.now() - start)
  }
}

async function executeThroughputAnalysis(context: SkillExecutionContext): Promise<SkillExecutionResult> {
  const start = Date.now()
  try {
    const evidence = extractEvidence(context)
    const findings: SkillFinding[] = []
    const metrics: SkillMetric[] = []

    const orderEvents = context.events.filter((e) => e.type?.includes('ORDER'))
    const paymentEvents = context.events.filter((e) => e.type?.includes('PAYMENT'))

    // Compute throughput (orders per hour)
    const timeRangeHours = context.timeRange
      ? (new Date(context.timeRange.end).getTime() - new Date(context.timeRange.start).getTime()) / (1000 * 60 * 60)
      : 1
    const throughput = timeRangeHours > 0 ? orderEvents.length / timeRangeHours : 0

    metrics.push(createMetric('order_throughput', throughput, 'orders/hour', 'Order throughput rate'))
    metrics.push(createMetric('payment_throughput', paymentEvents.length / Math.max(1, timeRangeHours), 'payments/hour', 'Payment throughput rate'))

    if (throughput > 0) {
      const completionRate = orderEvents.length > 0 ? paymentEvents.length / orderEvents.length : 0
      metrics.push(createMetric('order_completion_rate', completionRate * 100, '%', 'Order-to-payment completion rate', 90, completionRate < 0.7 ? 'critical' : 'good'))

      if (completionRate < 0.7) {
        findings.push(createFinding(
          context, 'anomaly', 'high', 'Low order completion rate',
          `Only ${(completionRate * 100).toFixed(0)}% of orders result in payments. Potential service gap.`,
          0.75, true, 'Investigate order flow from creation to payment'
        ))
      }
    }

    const confidence = clamp01(0.4 + evidence.evidenceQuality * 0.3 + (orderEvents.length > 10 ? 0.15 : 0))
    const explainability = buildExplainability(
      context, 'temporal_reasoning',
      `Computed throughput from ${orderEvents.length} orders over ${timeRangeHours.toFixed(1)} hours: ${throughput.toFixed(1)} orders/hour.`,
      []
    )

    return createSkillResult({
      skillId: 'skill_throughput_analysis', skillName: 'Throughput Analysis', skillVersion: '1.0.0',
      findings, metrics, evidence, explainability, confidence, executionTime: Date.now() - start,
    })
  } catch (error) {
    return createSkillErrorResult('skill_throughput_analysis', 'Throughput Analysis', '1.0.0', String(error), Date.now() - start)
  }
}

async function executeWaitTimeAnalysis(context: SkillExecutionContext): Promise<SkillExecutionResult> {
  const start = Date.now()
  try {
    const targetWait = (context.inputs.targetWaitMinutes as number) || 10
    const evidence = extractEvidence(context)
    const findings: SkillFinding[] = []
    const metrics: SkillMetric[] = []

    const orderEvents = context.events.filter((e) => e.type?.includes('ORDER'))
    const kitchenEvents = context.events.filter((e) => e.type?.includes('KITCHEN'))

    // Estimate wait times from event gaps
    const waitTimes: number[] = []
    for (let i = 0; i < Math.min(orderEvents.length, 30); i++) {
      const order = orderEvents[i]
      const nextKitchen = kitchenEvents.find(
        (k) => new Date(k.timestamp).getTime() > new Date(order.timestamp).getTime()
      )
      if (nextKitchen) {
        const wait = (new Date(nextKitchen.timestamp).getTime() - new Date(order.timestamp).getTime()) / 60000
        if (wait > 0 && wait < 120) waitTimes.push(wait)
      }
    }

    if (waitTimes.length > 0) {
      const avgWait = average(waitTimes)
      const maxWait = Math.max(...waitTimes)
      metrics.push(createMetric('avg_wait_time', avgWait, 'minutes', 'Average wait time', targetWait, avgWait > targetWait ? 'warning' : 'good'))
      metrics.push(createMetric('max_wait_time', maxWait, 'minutes', 'Maximum wait time', targetWait * 2, maxWait > targetWait * 2 ? 'critical' : 'warning'))

      if (avgWait > targetWait) {
        findings.push(createFinding(
          context, 'risk', 'high', 'Wait times exceeding target',
          `Average wait time of ${avgWait.toFixed(1)} minutes exceeds target of ${targetWait} minutes.`,
          0.8, true, 'Review staffing levels and kitchen throughput during peak periods'
        ))
      }
    }

    // Check knowledge for wait time patterns
    const waitKnowledge = context.knowledge.filter(
      (k) => k.title.toLowerCase().includes('wait') || k.statement.toLowerCase().includes('wait')
    )
    for (const k of waitKnowledge.slice(0, 2)) {
      findings.push(createFinding(
        context, 'observation', 'medium', `Known wait pattern: ${k.title}`,
        k.statement, k.confidenceScore
      ))
    }

    const confidence = clamp01(0.4 + evidence.evidenceQuality * 0.3 + (waitTimes.length > 5 ? 0.15 : 0))
    const explainability = buildExplainability(
      context, 'cause_and_effect',
      `Analyzed wait times from ${waitTimes.length} order-kitchen event pairs. Average: ${waitTimes.length > 0 ? average(waitTimes).toFixed(1) : 'N/A'} minutes.`,
      []
    )

    return createSkillResult({
      skillId: 'skill_wait_time_analysis', skillName: 'Wait Time Analysis', skillVersion: '1.0.0',
      findings, metrics, evidence, explainability, confidence, executionTime: Date.now() - start,
    })
  } catch (error) {
    return createSkillErrorResult('skill_wait_time_analysis', 'Wait Time Analysis', '1.0.0', String(error), Date.now() - start)
  }
}

async function executePeakHourAnalysis(context: SkillExecutionContext): Promise<SkillExecutionResult> {
  const start = Date.now()
  try {
    const evidence = extractEvidence(context)
    const findings: SkillFinding[] = []
    const metrics: SkillMetric[] = []

    const orderEvents = context.events.filter((e) => e.type?.includes('ORDER'))

    // Group events by hour
    const hourCounts = new Map<number, number>()
    for (const event of orderEvents) {
      const hour = new Date(event.timestamp).getHours()
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1)
    }

    if (hourCounts.size > 0) {
      const sortedHours = Array.from(hourCounts.entries()).sort((a, b) => b[1] - a[1])
      const peakHour = sortedHours[0]
      const totalOrders = orderEvents.length
      const peakConcentration = peakHour[1] / totalOrders

      metrics.push(createMetric('peak_hour', peakHour[0], 'hour', 'Peak operational hour'))
      metrics.push(createMetric('peak_concentration', peakConcentration * 100, '%', 'Peak hour order concentration'))

      if (peakConcentration > 0.3) {
        findings.push(createFinding(
          context, 'trend', 'medium', `Peak hour concentration at ${peakHour[0]}:00`,
          `${(peakConcentration * 100).toFixed(0)}% of orders occur during the ${peakHour[0]}:00 hour.`,
          0.7, true, `Pre-stage resources for ${peakHour[0]}:00 peak period`
        ))
      }

      // Off-peak opportunity
      if (sortedHours.length > 3) {
        const offPeak = sortedHours[sortedHours.length - 1]
        if (offPeak[1] < peakHour[1] * 0.2) {
          findings.push(createFinding(
            context, 'opportunity', 'low', `Off-peak opportunity at ${offPeak[0]}:00`,
            `${offPeak[0]}:00 has only ${offPeak[1]} orders vs ${peakHour[1]} at peak. Opportunity for promotions.`,
            0.5, true, `Consider promotional activities for ${offPeak[0]}:00`
          ))
        }
      }
    }

    const confidence = clamp01(0.4 + evidence.evidenceQuality * 0.3 + (orderEvents.length > 20 ? 0.15 : 0))
    const explainability = buildExplainability(
      context, 'temporal_reasoning',
      `Analyzed ${orderEvents.length} orders across ${hourCounts.size} hours. Peak: ${hourCounts.size > 0 ? Array.from(hourCounts.entries()).sort((a, b) => b[1] - a[1])[0][0] : 'N/A'}:00.`,
      []
    )

    return createSkillResult({
      skillId: 'skill_peak_hour_analysis', skillName: 'Peak Hour Analysis', skillVersion: '1.0.0',
      findings, metrics, evidence, explainability, confidence, executionTime: Date.now() - start,
    })
  } catch (error) {
    return createSkillErrorResult('skill_peak_hour_analysis', 'Peak Hour Analysis', '1.0.0', String(error), Date.now() - start)
  }
}

async function executeOperationalEfficiency(context: SkillExecutionContext): Promise<SkillExecutionResult> {
  const start = Date.now()
  try {
    const evidence = extractEvidence(context)
    const findings: SkillFinding[] = []
    const metrics: SkillMetric[] = []

    const orderEvents = context.events.filter((e) => e.type?.includes('ORDER'))
    const paymentEvents = context.events.filter((e) => e.type?.includes('PAYMENT'))
    const kitchenEvents = context.events.filter((e) => e.type?.includes('KITCHEN'))

    // Compute composite efficiency score
    const completionRate = orderEvents.length > 0 ? paymentEvents.length / orderEvents.length : 0
    const kitchenActivity = orderEvents.length > 0 ? kitchenEvents.length / orderEvents.length : 0
    const efficiency = clamp01((completionRate * 0.5 + kitchenActivity * 0.3 + 0.2))

    metrics.push(createMetric('operational_efficiency_score', efficiency * 100, '%', 'Overall operational efficiency score', 75, efficiency < 0.5 ? 'critical' : efficiency < 0.7 ? 'warning' : 'good'))
    metrics.push(createMetric('order_completion_rate', completionRate * 100, '%', 'Order completion rate', 90))
    metrics.push(createMetric('kitchen_activity_ratio', kitchenActivity, 'ratio', 'Kitchen events per order', 1.0))

    if (efficiency < 0.5) {
      findings.push(createFinding(
        context, 'risk', 'high', 'Low operational efficiency',
        `Operational efficiency score of ${(efficiency * 100).toFixed(0)}% indicates significant improvement opportunities.`,
        0.8, true, 'Review order flow, kitchen throughput, and payment processing'
      ))
    } else if (efficiency > 0.8) {
      findings.push(createFinding(
        context, 'observation', 'info', 'High operational efficiency',
        `Operational efficiency score of ${(efficiency * 100).toFixed(0)}% indicates strong performance.`,
        0.7
      ))
    }

    const confidence = clamp01(0.4 + evidence.evidenceQuality * 0.3 + (orderEvents.length > 10 ? 0.15 : 0))
    const explainability = buildExplainability(
      context, 'multi_factor_reasoning',
      `Computed efficiency from ${orderEvents.length} orders, ${paymentEvents.length} payments, ${kitchenEvents.length} kitchen events. Score: ${(efficiency * 100).toFixed(0)}%.`,
      [
        { option: 'Focus on completion rate', rationale: 'Lowest contributing factor', confidence: 0.6 },
        { option: 'Focus on kitchen activity', rationale: 'Secondary factor', confidence: 0.4 },
      ]
    )

    return createSkillResult({
      skillId: 'skill_operational_efficiency', skillName: 'Operational Efficiency Analysis', skillVersion: '1.0.0',
      findings, metrics, evidence, explainability, confidence, executionTime: Date.now() - start,
    })
  } catch (error) {
    return createSkillErrorResult('skill_operational_efficiency', 'Operational Efficiency Analysis', '1.0.0', String(error), Date.now() - start)
  }
}

async function executeResourceUtilization(context: SkillExecutionContext): Promise<SkillExecutionResult> {
  const start = Date.now()
  try {
    const evidence = extractEvidence(context)
    const findings: SkillFinding[] = []
    const metrics: SkillMetric[] = []

    const staffCheckIn = context.events.filter((e) => e.type?.includes('STAFF_CHECK_IN'))
    const staffCheckOut = context.events.filter((e) => e.type?.includes('STAFF_CHECK_OUT'))
    const tableEvents = context.events.filter((e) => e.type?.includes('TABLE'))

    const activeStaff = Math.max(0, staffCheckIn.length - staffCheckOut.length)
    const tableUtilization = tableEvents.length > 0 ? clamp01(tableEvents.length / Math.max(1, activeStaff * 5)) : 0

    metrics.push(createMetric('active_staff_count', activeStaff, 'staff', 'Currently active staff count'))
    metrics.push(createMetric('table_per_staff_ratio', activeStaff > 0 ? tableEvents.length / activeStaff : 0, 'tables/staff', 'Tables per active staff member', 5))
    metrics.push(createMetric('resource_utilization', tableUtilization * 100, '%', 'Resource utilization score', 70))

    if (activeStaff === 0 && tableEvents.length > 0) {
      findings.push(createFinding(
        context, 'risk', 'critical', 'No active staff detected',
        'Tables are occupied but no staff check-ins recorded. Possible data gap or staffing issue.',
        0.9, true, 'Verify staff check-in process and current staffing levels'
      ))
    } else if (activeStaff > 0 && tableEvents.length / activeStaff > 8) {
      findings.push(createFinding(
        context, 'risk', 'high', 'Staff overload detected',
        `Ratio of ${(tableEvents.length / activeStaff).toFixed(1)} tables per staff member exceeds recommended 5:1.`,
        0.75, true, 'Consider adding staff or redistributing tables'
      ))
    }

    const confidence = clamp01(0.4 + evidence.evidenceQuality * 0.3)
    const explainability = buildExplainability(
      context, 'constraint_optimization',
      `Analyzed ${staffCheckIn.length} check-ins, ${staffCheckOut.length} check-outs, ${tableEvents.length} table events. Active staff: ${activeStaff}.`,
      []
    )

    return createSkillResult({
      skillId: 'skill_resource_utilization', skillName: 'Resource Utilization Analysis', skillVersion: '1.0.0',
      findings, metrics, evidence, explainability, confidence, executionTime: Date.now() - start,
    })
  } catch (error) {
    return createSkillErrorResult('skill_resource_utilization', 'Resource Utilization Analysis', '1.0.0', String(error), Date.now() - start)
  }
}

// ============================================================================
// Exported Skill Registrations
// ============================================================================

export const operationalAnalysisSkills: Array<{ definition: OperationalSkill; executor: import('../types').SkillExecutor }> = [
  { definition: bottleneckDetectionDef, executor: createSkillExecutor('skill_bottleneck_detection', executeBottleneckDetection) },
  { definition: capacityAnalysisDef, executor: createSkillExecutor('skill_capacity_analysis', executeCapacityAnalysis) },
  { definition: queueAnalysisDef, executor: createSkillExecutor('skill_queue_analysis', executeQueueAnalysis) },
  { definition: throughputAnalysisDef, executor: createSkillExecutor('skill_throughput_analysis', executeThroughputAnalysis) },
  { definition: waitTimeAnalysisDef, executor: createSkillExecutor('skill_wait_time_analysis', executeWaitTimeAnalysis) },
  { definition: peakHourAnalysisDef, executor: createSkillExecutor('skill_peak_hour_analysis', executePeakHourAnalysis) },
  { definition: operationalEfficiencyDef, executor: createSkillExecutor('skill_operational_efficiency', executeOperationalEfficiency) },
  { definition: resourceUtilizationDef, executor: createSkillExecutor('skill_resource_utilization', executeResourceUtilization) },
]
