/**
 * Operational Skills — Customer Intelligence category.
 */
import type { OperationalSkill, SkillExecutionContext, SkillExecutionResult, SkillFinding, SkillMetric } from '../types'
import {
  createSkillDefinition, createSkillResult, createSkillErrorResult,
  extractEvidence, buildExplainability, createFinding, createMetric, createSkillExecutor,
} from '../skill-executor-base'
import { average, clamp01 } from '../utils'

// ============================================================================
// Definitions
// ============================================================================

const customerSatisfactionDef = createSkillDefinition({
  id: 'skill_customer_satisfaction', name: 'Customer Satisfaction Analysis',
  description: 'Analyzes customer satisfaction patterns from feedback events.',
  category: 'customer_intelligence', version: '1.0.0', status: 'production', owner: 'platform',
  tags: ['satisfaction', 'feedback', 'customer'],
  supportedDomains: ['customers', 'service', 'operations'],
  supportedExpertiseProfiles: ['customer_experience_advisor', 'service_advisor', 'executive_advisor'],
  supportedIntents: ['status_check', 'trend_analysis', 'problem_diagnosis', 'recommendation_request', 'operational_review'],
  supportedReasoningStrategies: ['cause_and_effect', 'temporal_reasoning', 'comparative_reasoning'],
  requiredKnowledgeCategories: ['customer', 'service', 'operational'],
  requiredMemoryTypes: ['customer'],
  requiredEventTypes: ['CUSTOMER_FEEDBACK', 'RESERVATION_CREATED', 'TABLE_OCCUPIED'],
  inputs: [], outputs: [{ name: 'findings', type: 'finding', description: 'Satisfaction findings' }, { name: 'metrics', type: 'metric', description: 'Satisfaction metrics' }],
})

const loyaltyAnalysisDef = createSkillDefinition({
  id: 'skill_loyalty_analysis', name: 'Loyalty Analysis',
  description: 'Analyzes customer loyalty and repeat visit patterns.',
  category: 'customer_intelligence', version: '1.0.0', status: 'production', owner: 'platform',
  tags: ['loyalty', 'repeat', 'customer'],
  supportedDomains: ['customers', 'service', 'operations'],
  supportedExpertiseProfiles: ['customer_experience_advisor', 'service_advisor', 'executive_advisor'],
  supportedIntents: ['status_check', 'trend_analysis', 'problem_diagnosis', 'recommendation_request', 'operational_review'],
  supportedReasoningStrategies: ['cause_and_effect', 'temporal_reasoning', 'comparative_reasoning'],
  requiredKnowledgeCategories: ['customer', 'service', 'operational'],
  requiredMemoryTypes: ['customer'],
  requiredEventTypes: ['CUSTOMER_FEEDBACK', 'RESERVATION_CREATED', 'TABLE_OCCUPIED'],
  inputs: [], outputs: [{ name: 'findings', type: 'finding', description: 'Loyalty findings' }, { name: 'metrics', type: 'metric', description: 'Loyalty metrics' }],
})

const complaintPatternsDef = createSkillDefinition({
  id: 'skill_complaint_patterns', name: 'Complaint Pattern Analysis',
  description: 'Identifies recurring complaint patterns from customer feedback.',
  category: 'customer_intelligence', version: '1.0.0', status: 'production', owner: 'platform',
  tags: ['complaint', 'pattern', 'feedback'],
  supportedDomains: ['customers', 'service', 'operations'],
  supportedExpertiseProfiles: ['customer_experience_advisor', 'service_advisor', 'executive_advisor'],
  supportedIntents: ['status_check', 'trend_analysis', 'problem_diagnosis', 'recommendation_request', 'operational_review'],
  supportedReasoningStrategies: ['cause_and_effect', 'temporal_reasoning', 'comparative_reasoning'],
  requiredKnowledgeCategories: ['customer', 'service', 'operational'],
  requiredMemoryTypes: ['customer'],
  requiredEventTypes: ['CUSTOMER_FEEDBACK', 'RESERVATION_CREATED', 'TABLE_OCCUPIED'],
  inputs: [], outputs: [{ name: 'findings', type: 'finding', description: 'Complaint findings' }, { name: 'metrics', type: 'metric', description: 'Complaint metrics' }],
})

const customerFlowDef = createSkillDefinition({
  id: 'skill_customer_flow', name: 'Customer Flow Analysis',
  description: 'Analyzes customer movement and flow through the restaurant.',
  category: 'customer_intelligence', version: '1.0.0', status: 'production', owner: 'platform',
  tags: ['flow', 'movement', 'customer'],
  supportedDomains: ['customers', 'service', 'operations'],
  supportedExpertiseProfiles: ['customer_experience_advisor', 'service_advisor', 'executive_advisor'],
  supportedIntents: ['status_check', 'trend_analysis', 'problem_diagnosis', 'recommendation_request', 'operational_review'],
  supportedReasoningStrategies: ['cause_and_effect', 'temporal_reasoning', 'comparative_reasoning'],
  requiredKnowledgeCategories: ['customer', 'service', 'operational'],
  requiredMemoryTypes: ['customer'],
  requiredEventTypes: ['CUSTOMER_FEEDBACK', 'RESERVATION_CREATED', 'TABLE_OCCUPIED'],
  inputs: [], outputs: [{ name: 'findings', type: 'finding', description: 'Flow findings' }, { name: 'metrics', type: 'metric', description: 'Flow metrics' }],
})

const customerSegmentationDef = createSkillDefinition({
  id: 'skill_customer_segmentation', name: 'Customer Segmentation Analysis',
  description: 'Segments customers by behavior patterns.',
  category: 'customer_intelligence', version: '1.0.0', status: 'production', owner: 'platform',
  tags: ['segmentation', 'behavior', 'customer'],
  supportedDomains: ['customers', 'service', 'operations'],
  supportedExpertiseProfiles: ['customer_experience_advisor', 'service_advisor', 'executive_advisor'],
  supportedIntents: ['status_check', 'trend_analysis', 'problem_diagnosis', 'recommendation_request', 'operational_review'],
  supportedReasoningStrategies: ['cause_and_effect', 'temporal_reasoning', 'comparative_reasoning'],
  requiredKnowledgeCategories: ['customer', 'service', 'operational'],
  requiredMemoryTypes: ['customer'],
  requiredEventTypes: ['CUSTOMER_FEEDBACK', 'RESERVATION_CREATED', 'TABLE_OCCUPIED'],
  inputs: [], outputs: [{ name: 'findings', type: 'finding', description: 'Segmentation findings' }, { name: 'metrics', type: 'metric', description: 'Segmentation metrics' }],
})

const repeatCustomersDef = createSkillDefinition({
  id: 'skill_repeat_customers', name: 'Repeat Customer Analysis',
  description: 'Analyzes repeat customer rates and trends.',
  category: 'customer_intelligence', version: '1.0.0', status: 'production', owner: 'platform',
  tags: ['repeat', 'retention', 'customer'],
  supportedDomains: ['customers', 'service', 'operations'],
  supportedExpertiseProfiles: ['customer_experience_advisor', 'service_advisor', 'executive_advisor'],
  supportedIntents: ['status_check', 'trend_analysis', 'problem_diagnosis', 'recommendation_request', 'operational_review'],
  supportedReasoningStrategies: ['cause_and_effect', 'temporal_reasoning', 'comparative_reasoning'],
  requiredKnowledgeCategories: ['customer', 'service', 'operational'],
  requiredMemoryTypes: ['customer'],
  requiredEventTypes: ['CUSTOMER_FEEDBACK', 'RESERVATION_CREATED', 'TABLE_OCCUPIED'],
  inputs: [], outputs: [{ name: 'findings', type: 'finding', description: 'Repeat customer findings' }, { name: 'metrics', type: 'metric', description: 'Repeat metrics' }],
})

const experienceQualityDef = createSkillDefinition({
  id: 'skill_experience_quality', name: 'Experience Quality Assessment',
  description: 'Assesses overall customer experience quality.',
  category: 'customer_intelligence', version: '1.0.0', status: 'production', owner: 'platform',
  tags: ['experience', 'quality', 'customer'],
  supportedDomains: ['customers', 'service', 'operations'],
  supportedExpertiseProfiles: ['customer_experience_advisor', 'service_advisor', 'executive_advisor'],
  supportedIntents: ['status_check', 'trend_analysis', 'problem_diagnosis', 'recommendation_request', 'operational_review'],
  supportedReasoningStrategies: ['cause_and_effect', 'temporal_reasoning', 'comparative_reasoning'],
  requiredKnowledgeCategories: ['customer', 'service', 'operational'],
  requiredMemoryTypes: ['customer'],
  requiredEventTypes: ['CUSTOMER_FEEDBACK', 'RESERVATION_CREATED', 'TABLE_OCCUPIED'],
  inputs: [], outputs: [{ name: 'findings', type: 'finding', description: 'Quality findings' }, { name: 'metrics', type: 'metric', description: 'Quality metrics' }],
})

// ============================================================================
// Executors
// ============================================================================

async function executeCustomerSatisfaction(context: SkillExecutionContext): Promise<SkillExecutionResult> {
  const start = Date.now()
  try {
    const evidence = extractEvidence(context)
    const findings: SkillFinding[] = []
    const metrics: SkillMetric[] = []
    const feedback = context.events.filter((e) => e.type?.includes('FEEDBACK') || e.type?.includes('CUSTOMER'))

    const ratings = feedback.map((e) => (e.data?.rating as number) || (e.data?.score as number) || 0).filter((r) => r > 0)
    const avgRating = ratings.length > 0 ? average(ratings) : 0
    const satisfactionScore = clamp01(avgRating / 5)

    metrics.push(createMetric('avg_customer_rating', avgRating, 'rating', 'Average customer rating (1-5)', 4.0, avgRating < 3 ? 'critical' : avgRating < 4 ? 'warning' : 'good'))
    metrics.push(createMetric('satisfaction_score', satisfactionScore * 100, '%', 'Customer satisfaction score', 80))
    metrics.push(createMetric('feedback_count', feedback.length, 'count', 'Total feedback events'))

    if (avgRating > 0 && avgRating < 3) {
      findings.push(createFinding(context, 'risk', 'high', 'Low customer satisfaction',
        `Average rating of ${avgRating.toFixed(1)}/5 indicates dissatisfied customers.`, 0.8, true,
        'Investigate service issues and gather detailed feedback'))
    } else if (avgRating >= 4.5) {
      findings.push(createFinding(context, 'observation', 'info', 'High customer satisfaction',
        `Average rating of ${avgRating.toFixed(1)}/5 indicates excellent satisfaction.`, 0.7))
    }

    const satKnowledge = context.knowledge.filter((k) => k.category === 'customer')
    for (const k of satKnowledge.slice(0, 2)) {
      findings.push(createFinding(context, 'observation', 'low', `Customer insight: ${k.title}`, k.statement, k.confidenceScore))
    }

    const confidence = clamp01(0.4 + evidence.evidenceQuality * 0.3 + (ratings.length > 5 ? 0.15 : 0))
    const explainability = buildExplainability(context, 'cause_and_effect',
      `Analyzed ${feedback.length} feedback events. Average rating: ${avgRating.toFixed(1)}/5.`, [])

    return createSkillResult({ skillId: 'skill_customer_satisfaction', skillName: 'Customer Satisfaction Analysis', skillVersion: '1.0.0',
      findings, metrics, evidence, explainability, confidence, executionTime: Date.now() - start })
  } catch (error) {
    return createSkillErrorResult('skill_customer_satisfaction', 'Customer Satisfaction Analysis', '1.0.0', String(error), Date.now() - start)
  }
}

async function executeLoyaltyAnalysis(context: SkillExecutionContext): Promise<SkillExecutionResult> {
  const start = Date.now()
  try {
    const evidence = extractEvidence(context)
    const findings: SkillFinding[] = []
    const metrics: SkillMetric[] = []
    const reservations = context.events.filter((e) => e.type?.includes('RESERVATION'))
    const tables = context.events.filter((e) => e.type?.includes('TABLE'))

    // Estimate loyalty from repeat customer IDs
    const customerIds = new Map<string, number>()
    for (const e of [...reservations, ...tables]) {
      const cid = (e.data?.customerId as string) || (e.data?.guestId as string) || e.id
      customerIds.set(cid, (customerIds.get(cid) || 0) + 1)
    }
    const repeatCustomers = Array.from(customerIds.values()).filter((c) => c > 1).length
    const totalCustomers = customerIds.size
    const loyaltyRate = totalCustomers > 0 ? repeatCustomers / totalCustomers : 0

    metrics.push(createMetric('loyalty_rate', loyaltyRate * 100, '%', 'Customer loyalty rate', 30, loyaltyRate < 0.15 ? 'critical' : 'good'))
    metrics.push(createMetric('repeat_customers', repeatCustomers, 'count', 'Number of repeat customers'))
    metrics.push(createMetric('total_unique_customers', totalCustomers, 'count', 'Total unique customers'))

    if (loyaltyRate < 0.15 && totalCustomers > 5) {
      findings.push(createFinding(context, 'risk', 'medium', 'Low customer loyalty rate',
        `Only ${(loyaltyRate * 100).toFixed(1)}% of customers are repeat visitors.`, 0.7, true,
        'Implement loyalty program and engagement strategies'))
    }

    const confidence = clamp01(0.4 + evidence.evidenceQuality * 0.3 + (totalCustomers > 10 ? 0.15 : 0))
    const explainability = buildExplainability(context, 'temporal_reasoning',
      `Analyzed loyalty from ${totalCustomers} unique customers. Repeat rate: ${(loyaltyRate * 100).toFixed(1)}%.`, [])

    return createSkillResult({ skillId: 'skill_loyalty_analysis', skillName: 'Loyalty Analysis', skillVersion: '1.0.0',
      findings, metrics, evidence, explainability, confidence, executionTime: Date.now() - start })
  } catch (error) {
    return createSkillErrorResult('skill_loyalty_analysis', 'Loyalty Analysis', '1.0.0', String(error), Date.now() - start)
  }
}

async function executeComplaintPatterns(context: SkillExecutionContext): Promise<SkillExecutionResult> {
  const start = Date.now()
  try {
    const evidence = extractEvidence(context)
    const findings: SkillFinding[] = []
    const metrics: SkillMetric[] = []
    const feedback = context.events.filter((e) => e.type?.includes('FEEDBACK'))
    const complaints = feedback.filter((e) => {
      const rating = (e.data?.rating as number) || 0
      const sentiment = (e.data?.sentiment as string) || ''
      return rating > 0 && rating < 3 || sentiment.toLowerCase().includes('negative')
    })

    metrics.push(createMetric('complaint_count', complaints.length, 'count', 'Total complaints'))
    metrics.push(createMetric('complaint_rate', feedback.length > 0 ? (complaints.length / feedback.length) * 100 : 0, '%', 'Complaint rate', 10))

    // Group complaints by category
    const categoryCounts = new Map<string, number>()
    for (const c of complaints) {
      const cat = (c.data?.category as string) || (c.data?.topic as string) || 'general'
      categoryCounts.set(cat, (categoryCounts.get(cat) || 0) + 1)
    }
    for (const [cat, count] of Array.from(categoryCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3)) {
      metrics.push(createMetric(`complaint_${cat}`, count, 'count', `Complaints in category: ${cat}`))
      if (count >= 2) {
        findings.push(createFinding(context, 'risk', 'medium', `Recurring complaint: ${cat}`,
          `${count} complaints in the ${cat} category.`, 0.7, true, `Address ${cat} issues proactively`))
      }
    }

    const complaintKnowledge = context.knowledge.filter((k) => k.title.toLowerCase().includes('complaint') || k.statement.toLowerCase().includes('complaint'))
    for (const k of complaintKnowledge.slice(0, 2)) {
      findings.push(createFinding(context, 'observation', 'medium', `Known complaint pattern: ${k.title}`, k.statement, k.confidenceScore))
    }

    const confidence = clamp01(0.4 + evidence.evidenceQuality * 0.3)
    const explainability = buildExplainability(context, 'cause_and_effect',
      `Analyzed ${complaints.length} complaints from ${feedback.length} feedback events.`, [])

    return createSkillResult({ skillId: 'skill_complaint_patterns', skillName: 'Complaint Pattern Analysis', skillVersion: '1.0.0',
      findings, metrics, evidence, explainability, confidence, executionTime: Date.now() - start })
  } catch (error) {
    return createSkillErrorResult('skill_complaint_patterns', 'Complaint Pattern Analysis', '1.0.0', String(error), Date.now() - start)
  }
}

async function executeCustomerFlow(context: SkillExecutionContext): Promise<SkillExecutionResult> {
  const start = Date.now()
  try {
    const evidence = extractEvidence(context)
    const findings: SkillFinding[] = []
    const metrics: SkillMetric[] = []
    const tables = context.events.filter((e) => e.type?.includes('TABLE'))
    const reservations = context.events.filter((e) => e.type?.includes('RESERVATION'))

    // Analyze flow by hour
    const hourCounts = new Map<number, number>()
    for (const e of [...tables, ...reservations]) {
      const hour = new Date(e.timestamp).getHours()
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1)
    }

    if (hourCounts.size > 0) {
      const sorted = Array.from(hourCounts.entries()).sort((a, b) => b[1] - a[1])
      const peak = sorted[0]
      metrics.push(createMetric('peak_flow_hour', peak[0], 'hour', 'Peak customer flow hour'))
      metrics.push(createMetric('peak_flow_count', peak[1], 'count', 'Customers during peak hour'))

      if (peak[1] > 20) {
        findings.push(createFinding(context, 'trend', 'medium', `High customer flow at ${peak[0]}:00`,
          `${peak[1]} customers during peak hour.`, 0.6, true, 'Ensure adequate staffing during peak flow'))
      }
    }

    metrics.push(createMetric('total_table_events', tables.length, 'count', 'Total table events'))
    metrics.push(createMetric('total_reservations', reservations.length, 'count', 'Total reservations'))

    const confidence = clamp01(0.4 + evidence.evidenceQuality * 0.3)
    const explainability = buildExplainability(context, 'temporal_reasoning',
      `Analyzed customer flow from ${tables.length} table events and ${reservations.length} reservations.`, [])

    return createSkillResult({ skillId: 'skill_customer_flow', skillName: 'Customer Flow Analysis', skillVersion: '1.0.0',
      findings, metrics, evidence, explainability, confidence, executionTime: Date.now() - start })
  } catch (error) {
    return createSkillErrorResult('skill_customer_flow', 'Customer Flow Analysis', '1.0.0', String(error), Date.now() - start)
  }
}

async function executeCustomerSegmentation(context: SkillExecutionContext): Promise<SkillExecutionResult> {
  const start = Date.now()
  try {
    const evidence = extractEvidence(context)
    const findings: SkillFinding[] = []
    const metrics: SkillMetric[] = []
    const feedback = context.events.filter((e) => e.type?.includes('FEEDBACK'))
    const reservations = context.events.filter((e) => e.type?.includes('RESERVATION'))

    // Segment by visit frequency
    const customerVisits = new Map<string, number>()
    for (const e of [...feedback, ...reservations]) {
      const cid = (e.data?.customerId as string) || e.id
      customerVisits.set(cid, (customerVisits.get(cid) || 0) + 1)
    }

    const segments = { new: 0, occasional: 0, regular: 0, vip: 0 }
    for (const [, count] of customerVisits) {
      if (count === 1) segments.new++
      else if (count <= 3) segments.occasional++
      else if (count <= 7) segments.regular++
      else segments.vip++
    }

    metrics.push(createMetric('new_customers', segments.new, 'count', 'New customers (1 visit)'))
    metrics.push(createMetric('occasional_customers', segments.occasional, 'count', 'Occasional customers (2-3 visits)'))
    metrics.push(createMetric('regular_customers', segments.regular, 'count', 'Regular customers (4-7 visits)'))
    metrics.push(createMetric('vip_customers', segments.vip, 'count', 'VIP customers (8+ visits)'))

    const total = segments.new + segments.occasional + segments.regular + segments.vip
    if (total > 0) {
      if (segments.vip / total < 0.05) {
        findings.push(createFinding(context, 'opportunity', 'medium', 'Low VIP customer segment',
          `Only ${segments.vip} VIP customers (${((segments.vip / total) * 100).toFixed(1)}%).`, 0.6, true,
          'Develop VIP program to convert regulars to VIPs'))
      }
      if (segments.new / total > 0.7) {
        findings.push(createFinding(context, 'observation', 'medium', 'High proportion of new customers',
          `${((segments.new / total) * 100).toFixed(0)}% of customers are new.`, 0.5, true,
          'Focus on converting new customers to repeat visitors'))
      }
    }

    const confidence = clamp01(0.4 + evidence.evidenceQuality * 0.3)
    const explainability = buildExplainability(context, 'comparative_reasoning',
      `Segmented ${total} customers into 4 segments: ${segments.new} new, ${segments.occasional} occasional, ${segments.regular} regular, ${segments.vip} VIP.`, [])

    return createSkillResult({ skillId: 'skill_customer_segmentation', skillName: 'Customer Segmentation Analysis', skillVersion: '1.0.0',
      findings, metrics, evidence, explainability, confidence, executionTime: Date.now() - start })
  } catch (error) {
    return createSkillErrorResult('skill_customer_segmentation', 'Customer Segmentation Analysis', '1.0.0', String(error), Date.now() - start)
  }
}

async function executeRepeatCustomers(context: SkillExecutionContext): Promise<SkillExecutionResult> {
  const start = Date.now()
  try {
    const evidence = extractEvidence(context)
    const findings: SkillFinding[] = []
    const metrics: SkillMetric[] = []
    const reservations = context.events.filter((e) => e.type?.includes('RESERVATION'))
    const tables = context.events.filter((e) => e.type?.includes('TABLE'))

    const customerVisits = new Map<string, number>()
    for (const e of [...reservations, ...tables]) {
      const cid = (e.data?.customerId as string) || e.id
      customerVisits.set(cid, (customerVisits.get(cid) || 0) + 1)
    }

    const total = customerVisits.size
    const repeat = Array.from(customerVisits.values()).filter((c) => c > 1).length
    const repeatRate = total > 0 ? repeat / total : 0

    metrics.push(createMetric('repeat_customer_rate', repeatRate * 100, '%', 'Repeat customer rate', 30, repeatRate < 0.2 ? 'critical' : 'good'))
    metrics.push(createMetric('repeat_customers', repeat, 'count', 'Number of repeat customers'))
    metrics.push(createMetric('total_customers', total, 'count', 'Total unique customers'))

    if (repeatRate < 0.2 && total > 5) {
      findings.push(createFinding(context, 'risk', 'high', 'Low repeat customer rate',
        `Only ${(repeatRate * 100).toFixed(1)}% of customers return.`, 0.75, true,
        'Implement retention strategies and loyalty programs'))
    }

    const confidence = clamp01(0.4 + evidence.evidenceQuality * 0.3 + (total > 10 ? 0.15 : 0))
    const explainability = buildExplainability(context, 'temporal_reasoning',
      `Analyzed repeat customers: ${repeat}/${total} (${(repeatRate * 100).toFixed(1)}%).`, [])

    return createSkillResult({ skillId: 'skill_repeat_customers', skillName: 'Repeat Customer Analysis', skillVersion: '1.0.0',
      findings, metrics, evidence, explainability, confidence, executionTime: Date.now() - start })
  } catch (error) {
    return createSkillErrorResult('skill_repeat_customers', 'Repeat Customer Analysis', '1.0.0', String(error), Date.now() - start)
  }
}

async function executeExperienceQuality(context: SkillExecutionContext): Promise<SkillExecutionResult> {
  const start = Date.now()
  try {
    const evidence = extractEvidence(context)
    const findings: SkillFinding[] = []
    const metrics: SkillMetric[] = []
    const feedback = context.events.filter((e) => e.type?.includes('FEEDBACK'))
    const orders = context.events.filter((e) => e.type?.includes('ORDER'))

    const ratings = feedback.map((e) => (e.data?.rating as number) || 0).filter((r) => r > 0)
    const avgRating = ratings.length > 0 ? average(ratings) : 0
    const orderCompletion = orders.length > 0 ? feedback.length / orders.length : 0

    // Composite experience quality score
    const qualityScore = clamp01((avgRating / 5) * 0.6 + orderCompletion * 0.4)

    metrics.push(createMetric('experience_quality_score', qualityScore * 100, '%', 'Overall experience quality score', 75,
      qualityScore < 0.5 ? 'critical' : qualityScore < 0.7 ? 'warning' : 'good'))
    metrics.push(createMetric('avg_rating', avgRating, 'rating', 'Average customer rating'))
    metrics.push(createMetric('feedback_to_order_ratio', orderCompletion, 'ratio', 'Feedback-to-order ratio'))

    if (qualityScore < 0.5) {
      findings.push(createFinding(context, 'risk', 'high', 'Low experience quality score',
        `Overall experience quality score of ${(qualityScore * 100).toFixed(0)}% indicates poor customer experience.`, 0.8, true,
        'Conduct comprehensive service review'))
    } else if (qualityScore > 0.8) {
      findings.push(createFinding(context, 'observation', 'info', 'Excellent experience quality',
        `Experience quality score of ${(qualityScore * 100).toFixed(0)}% indicates excellent performance.`, 0.7))
    }

    const confidence = clamp01(0.4 + evidence.evidenceQuality * 0.3 + (ratings.length > 5 ? 0.15 : 0))
    const explainability = buildExplainability(context, 'multi_factor_reasoning',
      `Computed experience quality from ${feedback.length} feedback and ${orders.length} orders. Score: ${(qualityScore * 100).toFixed(0)}%.`,
      [{ option: 'Focus on rating improvement', rationale: 'Primary quality driver', confidence: 0.6 }])

    return createSkillResult({ skillId: 'skill_experience_quality', skillName: 'Experience Quality Assessment', skillVersion: '1.0.0',
      findings, metrics, evidence, explainability, confidence, executionTime: Date.now() - start })
  } catch (error) {
    return createSkillErrorResult('skill_experience_quality', 'Experience Quality Assessment', '1.0.0', String(error), Date.now() - start)
  }
}

// ============================================================================
// Export
// ============================================================================

export const customerIntelligenceSkills: Array<{ definition: OperationalSkill; executor: import('../types').SkillExecutor }> = [
  { definition: customerSatisfactionDef, executor: createSkillExecutor('skill_customer_satisfaction', executeCustomerSatisfaction) },
  { definition: loyaltyAnalysisDef, executor: createSkillExecutor('skill_loyalty_analysis', executeLoyaltyAnalysis) },
  { definition: complaintPatternsDef, executor: createSkillExecutor('skill_complaint_patterns', executeComplaintPatterns) },
  { definition: customerFlowDef, executor: createSkillExecutor('skill_customer_flow', executeCustomerFlow) },
  { definition: customerSegmentationDef, executor: createSkillExecutor('skill_customer_segmentation', executeCustomerSegmentation) },
  { definition: repeatCustomersDef, executor: createSkillExecutor('skill_repeat_customers', executeRepeatCustomers) },
  { definition: experienceQualityDef, executor: createSkillExecutor('skill_experience_quality', executeExperienceQuality) },
]
