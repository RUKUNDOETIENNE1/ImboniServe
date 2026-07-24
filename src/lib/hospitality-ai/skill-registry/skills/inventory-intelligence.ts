/**
 * Operational Skills — Inventory Intelligence category.
 */
import type { OperationalSkill, SkillExecutionContext, SkillExecutionResult, SkillFinding, SkillMetric } from '../types'
import {
  createSkillDefinition, type SkillDefinitionBuilder, createSkillResult, createSkillErrorResult,
  extractEvidence, buildExplainability, createFinding, createMetric, createSkillExecutor,
} from '../skill-executor-base'
import { average, clamp01 } from '../utils'

const baseConfig: Omit<SkillDefinitionBuilder, 'id' | 'name' | 'description' | 'tags' | 'inputs' | 'outputs'> = {
  category: 'inventory_intelligence', version: '1.0.0', status: 'production', owner: 'platform',
  supportedDomains: ['inventory', 'suppliers', 'operations'],
  supportedExpertiseProfiles: ['inventory_advisor', 'executive_advisor', 'operational_excellence_advisor'],
  supportedIntents: ['prediction_request', 'status_check', 'risk_assessment', 'optimization', 'planning'],
  supportedReasoningStrategies: ['temporal_reasoning', 'risk_evaluation', 'constraint_optimization'],
  requiredKnowledgeCategories: ['inventory', 'supplier', 'operational'],
  requiredMemoryTypes: ['inventory'],
  requiredEventTypes: ['INVENTORY_ADJUSTMENT', 'STOCK_LEVEL_UPDATED', 'SUPPLIER_DELIVERY'],
}

const forecastDef = createSkillDefinition({
  id: 'skill_inventory_forecast', name: 'Inventory Forecast',
  description: 'Forecasts inventory needs based on usage patterns.',
  ...baseConfig, tags: ['forecast', 'inventory', 'prediction'],
  inputs: [], outputs: [{ name: 'findings', type: 'finding', description: 'Forecast findings' }, { name: 'metrics', type: 'metric', description: 'Forecast metrics' }],
})

const wasteDef = createSkillDefinition({
  id: 'skill_waste_detection', name: 'Waste Detection',
  description: 'Detects inventory waste patterns.',
  ...baseConfig, tags: ['waste', 'inventory', 'loss'],
  inputs: [], outputs: [{ name: 'findings', type: 'finding', description: 'Waste findings' }, { name: 'metrics', type: 'metric', description: 'Waste metrics' }],
})

const reorderDef = createSkillDefinition({
  id: 'skill_reorder_optimization', name: 'Reorder Optimization',
  description: 'Optimizes reorder timing and quantities.',
  ...baseConfig, tags: ['reorder', 'optimization', 'inventory'],
  inputs: [], outputs: [{ name: 'findings', type: 'finding', description: 'Reorder findings' }, { name: 'metrics', type: 'metric', description: 'Reorder metrics' }],
})

const supplierDef = createSkillDefinition({
  id: 'skill_supplier_reliability', name: 'Supplier Reliability Analysis',
  description: 'Analyzes supplier delivery reliability.',
  ...baseConfig, tags: ['supplier', 'reliability', 'delivery'],
  inputs: [], outputs: [{ name: 'findings', type: 'finding', description: 'Supplier findings' }, { name: 'metrics', type: 'metric', description: 'Supplier metrics' }],
})

const stockLevelDef = createSkillDefinition({
  id: 'skill_stock_level_analysis', name: 'Stock Level Analysis',
  description: 'Analyzes current stock levels vs demand.',
  ...baseConfig, tags: ['stock', 'level', 'demand'],
  inputs: [], outputs: [{ name: 'findings', type: 'finding', description: 'Stock findings' }, { name: 'metrics', type: 'metric', description: 'Stock metrics' }],
})

const shortageRiskDef = createSkillDefinition({
  id: 'skill_shortage_risk', name: 'Shortage Risk Assessment',
  description: 'Assesses risk of stock shortages.',
  ...baseConfig, tags: ['shortage', 'risk', 'inventory'],
  inputs: [], outputs: [{ name: 'findings', type: 'finding', description: 'Risk findings' }, { name: 'metrics', type: 'metric', description: 'Risk metrics' }],
})

const turnoverDef = createSkillDefinition({
  id: 'skill_inventory_turnover', name: 'Inventory Turnover Analysis',
  description: 'Analyzes inventory turnover rates.',
  ...baseConfig, tags: ['turnover', 'inventory', 'efficiency'],
  inputs: [], outputs: [{ name: 'findings', type: 'finding', description: 'Turnover findings' }, { name: 'metrics', type: 'metric', description: 'Turnover metrics' }],
})

// ============================================================================
// Executors
// ============================================================================

async function executeForecast(context: SkillExecutionContext): Promise<SkillExecutionResult> {
  const start = Date.now()
  try {
    const evidence = extractEvidence(context)
    const findings: SkillFinding[] = []
    const metrics: SkillMetric[] = []
    const adjustments = context.events.filter((e) => e.type?.includes('INVENTORY'))
    const stockUpdates = context.events.filter((e) => e.type?.includes('STOCK'))

    // Compute daily usage rate
    const dayMap = new Map<string, number>()
    for (const e of adjustments) {
      const day = new Date(e.timestamp).toISOString().split('T')[0]
      const qty = Math.abs((e.data?.quantity as number) || 0)
      dayMap.set(day, (dayMap.get(day) || 0) + qty)
    }
    const dailyUsage = dayMap.size > 0 ? average(Array.from(dayMap.values())) : 0

    metrics.push(createMetric('avg_daily_usage', dailyUsage, 'units', 'Average daily inventory usage'))
    metrics.push(createMetric('inventory_events', adjustments.length, 'count', 'Total inventory events'))

    if (dailyUsage > 0) {
      const forecast7Day = dailyUsage * 7
      metrics.push(createMetric('forecast_7_day', forecast7Day, 'units', '7-day inventory forecast'))
      findings.push(createFinding(context, 'observation', 'info', 'Inventory forecast generated',
        `Based on current usage, expect to need ${forecast7Day.toFixed(0)} units in the next 7 days.`, 0.6, true,
        'Plan reorders accordingly'))
    }

    const invKnowledge = context.knowledge.filter((k) => k.category === 'inventory')
    for (const k of invKnowledge.slice(0, 2)) {
      findings.push(createFinding(context, 'observation', 'low', `Inventory insight: ${k.title}`, k.statement, k.confidenceScore))
    }

    const confidence = clamp01(0.4 + evidence.evidenceQuality * 0.3 + (adjustments.length > 10 ? 0.15 : 0))
    const explainability = buildExplainability(context, 'temporal_reasoning',
      `Forecasted inventory from ${adjustments.length} events. Daily usage: ${dailyUsage.toFixed(1)} units.`, [])

    return createSkillResult({ skillId: 'skill_inventory_forecast', skillName: 'Inventory Forecast', skillVersion: '1.0.0',
      findings, metrics, evidence, explainability, confidence, executionTime: Date.now() - start })
  } catch (error) {
    return createSkillErrorResult('skill_inventory_forecast', 'Inventory Forecast', '1.0.0', String(error), Date.now() - start)
  }
}

async function executeWaste(context: SkillExecutionContext): Promise<SkillExecutionResult> {
  const start = Date.now()
  try {
    const evidence = extractEvidence(context)
    const findings: SkillFinding[] = []
    const metrics: SkillMetric[] = []
    const adjustments = context.events.filter((e) => e.type?.includes('INVENTORY'))

    // Identify waste (negative adjustments marked as waste/spoilage)
    const wasteEvents = adjustments.filter((e) => {
      const reason = ((e.data?.reason as string) || '').toLowerCase()
      const type = ((e.data?.type as string) || '').toLowerCase()
      return reason.includes('waste') || reason.includes('spoil') || reason.includes('expired') || type.includes('waste')
    })

    const wasteQty = wasteEvents.reduce((sum, e) => sum + Math.abs((e.data?.quantity as number) || 0), 0)
    const wasteRate = adjustments.length > 0 ? wasteEvents.length / adjustments.length : 0

    metrics.push(createMetric('waste_events', wasteEvents.length, 'count', 'Waste events'))
    metrics.push(createMetric('waste_quantity', wasteQty, 'units', 'Total wasted quantity'))
    metrics.push(createMetric('waste_rate', wasteRate * 100, '%', 'Waste rate', 5, wasteRate > 0.15 ? 'critical' : 'warning'))

    if (wasteRate > 0.15) {
      findings.push(createFinding(context, 'risk', 'high', 'High inventory waste rate',
        `${(wasteRate * 100).toFixed(1)}% of inventory adjustments are waste.`, 0.75, true,
        'Review inventory management and storage practices'))
    }

    const confidence = clamp01(0.4 + evidence.evidenceQuality * 0.3)
    const explainability = buildExplainability(context, 'risk_evaluation',
      `Detected ${wasteEvents.length} waste events from ${adjustments.length} adjustments. Waste rate: ${(wasteRate * 100).toFixed(1)}%.`, [])

    return createSkillResult({ skillId: 'skill_waste_detection', skillName: 'Waste Detection', skillVersion: '1.0.0',
      findings, metrics, evidence, explainability, confidence, executionTime: Date.now() - start })
  } catch (error) {
    return createSkillErrorResult('skill_waste_detection', 'Waste Detection', '1.0.0', String(error), Date.now() - start)
  }
}

async function executeReorder(context: SkillExecutionContext): Promise<SkillExecutionResult> {
  const start = Date.now()
  try {
    const evidence = extractEvidence(context)
    const findings: SkillFinding[] = []
    const metrics: SkillMetric[] = []
    const stockUpdates = context.events.filter((e) => e.type?.includes('STOCK'))
    const deliveries = context.events.filter((e) => e.type?.includes('SUPPLIER') || e.type?.includes('DELIVERY'))

    // Compute reorder frequency
    const reorderEvents = stockUpdates.filter((e) => {
      const level = (e.data?.level as number) || 0
      const reorderPoint = (e.data?.reorderPoint as number) || 0
      return reorderPoint > 0 && level <= reorderPoint
    })

    metrics.push(createMetric('reorder_events', reorderEvents.length, 'count', 'Reorder-triggered events'))
    metrics.push(createMetric('deliveries_received', deliveries.length, 'count', 'Deliveries received'))

    if (reorderEvents.length > deliveries.length && reorderEvents.length > 3) {
      findings.push(createFinding(context, 'risk', 'medium', 'Reorder backlog detected',
        `${reorderEvents.length} reorder events but only ${deliveries.length} deliveries.`, 0.7, true,
        'Review supplier relationships and reorder processes'))
    }

    const confidence = clamp01(0.4 + evidence.evidenceQuality * 0.3)
    const explainability = buildExplainability(context, 'constraint_optimization',
      `Analyzed reorders: ${reorderEvents.length} triggers, ${deliveries.length} deliveries.`, [])

    return createSkillResult({ skillId: 'skill_reorder_optimization', skillName: 'Reorder Optimization', skillVersion: '1.0.0',
      findings, metrics, evidence, explainability, confidence, executionTime: Date.now() - start })
  } catch (error) {
    return createSkillErrorResult('skill_reorder_optimization', 'Reorder Optimization', '1.0.0', String(error), Date.now() - start)
  }
}

async function executeSupplier(context: SkillExecutionContext): Promise<SkillExecutionResult> {
  const start = Date.now()
  try {
    const evidence = extractEvidence(context)
    const findings: SkillFinding[] = []
    const metrics: SkillMetric[] = []
    const deliveries = context.events.filter((e) => e.type?.includes('SUPPLIER') || e.type?.includes('DELIVERY'))

    // Group by supplier
    const supplierMap = new Map<string, { total: number; onTime: number }>()
    for (const d of deliveries) {
      const sid = (d.data?.supplierId as string) || 'unknown'
      const onTime = (d.data?.onTime as boolean) ?? true
      if (!supplierMap.has(sid)) supplierMap.set(sid, { total: 0, onTime: 0 })
      const s = supplierMap.get(sid)!
      s.total++
      if (onTime) s.onTime++
    }

    for (const [sid, stats] of supplierMap) {
      const reliability = stats.total > 0 ? (stats.onTime / stats.total) * 100 : 0
      metrics.push(createMetric(`supplier_${sid}_reliability`, reliability, '%', `Supplier ${sid} reliability`, 90,
        reliability < 70 ? 'critical' : reliability < 90 ? 'warning' : 'good'))
      if (reliability < 70) {
        findings.push(createFinding(context, 'risk', 'high', `Unreliable supplier: ${sid}`,
          `Supplier ${sid} has only ${reliability.toFixed(0)}% on-time delivery.`, 0.75, true,
          'Consider alternative suppliers or renegotiate terms'))
      }
    }

    metrics.push(createMetric('total_suppliers', supplierMap.size, 'count', 'Total suppliers'))
    metrics.push(createMetric('total_deliveries', deliveries.length, 'count', 'Total deliveries'))

    const confidence = clamp01(0.4 + evidence.evidenceQuality * 0.3)
    const explainability = buildExplainability(context, 'comparative_reasoning',
      `Analyzed ${deliveries.length} deliveries from ${supplierMap.size} suppliers.`, [])

    return createSkillResult({ skillId: 'skill_supplier_reliability', skillName: 'Supplier Reliability Analysis', skillVersion: '1.0.0',
      findings, metrics, evidence, explainability, confidence, executionTime: Date.now() - start })
  } catch (error) {
    return createSkillErrorResult('skill_supplier_reliability', 'Supplier Reliability Analysis', '1.0.0', String(error), Date.now() - start)
  }
}

async function executeStockLevel(context: SkillExecutionContext): Promise<SkillExecutionResult> {
  const start = Date.now()
  try {
    const evidence = extractEvidence(context)
    const findings: SkillFinding[] = []
    const metrics: SkillMetric[] = []
    const stockUpdates = context.events.filter((e) => e.type?.includes('STOCK'))
    const orders = context.events.filter((e) => e.type?.includes('ORDER'))

    const currentLevels = stockUpdates.map((e) => (e.data?.level as number) || 0).filter((l) => l >= 0)
    const avgLevel = currentLevels.length > 0 ? average(currentLevels) : 0
    const lowStock = currentLevels.filter((l) => l < 10).length

    metrics.push(createMetric('avg_stock_level', avgLevel, 'units', 'Average stock level'))
    metrics.push(createMetric('low_stock_items', lowStock, 'count', 'Items with low stock'))
    metrics.push(createMetric('stock_updates', stockUpdates.length, 'count', 'Stock update events'))

    if (lowStock > 0) {
      findings.push(createFinding(context, 'risk', 'high', `${lowStock} items with low stock`,
        `${lowStock} items are below safe stock levels.`, 0.8, true, 'Reorder low-stock items immediately'))
    }

    const confidence = clamp01(0.4 + evidence.evidenceQuality * 0.3)
    const explainability = buildExplainability(context, 'risk_evaluation',
      `Analyzed ${stockUpdates.length} stock updates. Avg level: ${avgLevel.toFixed(1)}, Low stock: ${lowStock}.`, [])

    return createSkillResult({ skillId: 'skill_stock_level_analysis', skillName: 'Stock Level Analysis', skillVersion: '1.0.0',
      findings, metrics, evidence, explainability, confidence, executionTime: Date.now() - start })
  } catch (error) {
    return createSkillErrorResult('skill_stock_level_analysis', 'Stock Level Analysis', '1.0.0', String(error), Date.now() - start)
  }
}

async function executeShortageRisk(context: SkillExecutionContext): Promise<SkillExecutionResult> {
  const start = Date.now()
  try {
    const evidence = extractEvidence(context)
    const findings: SkillFinding[] = []
    const metrics: SkillMetric[] = []
    const stockUpdates = context.events.filter((e) => e.type?.includes('STOCK'))
    const orders = context.events.filter((e) => e.type?.includes('ORDER'))

    // Compute shortage risk score
    const lowStockItems = stockUpdates.filter((e) => {
      const level = (e.data?.level as number) || 0
      const reorderPoint = (e.data?.reorderPoint as number) || 0
      return reorderPoint > 0 && level <= reorderPoint
    }).length

    const riskScore = clamp01(stockUpdates.length > 0 ? lowStockItems / stockUpdates.length : 0)

    metrics.push(createMetric('shortage_risk_score', riskScore * 100, '%', 'Shortage risk score', 20,
      riskScore > 0.3 ? 'critical' : riskScore > 0.15 ? 'warning' : 'good'))
    metrics.push(createMetric('at_risk_items', lowStockItems, 'count', 'Items at risk of shortage'))

    if (riskScore > 0.3) {
      findings.push(createFinding(context, 'risk', 'critical', 'High shortage risk',
        `${(riskScore * 100).toFixed(0)}% of stock items are at risk of shortage.`, 0.85, true,
        'Initiate emergency reorders for critical items'))
    }

    const confidence = clamp01(0.4 + evidence.evidenceQuality * 0.3)
    const explainability = buildExplainability(context, 'risk_evaluation',
      `Computed shortage risk from ${stockUpdates.length} stock items. Risk: ${(riskScore * 100).toFixed(0)}%.`, [])

    return createSkillResult({ skillId: 'skill_shortage_risk', skillName: 'Shortage Risk Assessment', skillVersion: '1.0.0',
      findings, metrics, evidence, explainability, confidence, executionTime: Date.now() - start })
  } catch (error) {
    return createSkillErrorResult('skill_shortage_risk', 'Shortage Risk Assessment', '1.0.0', String(error), Date.now() - start)
  }
}

async function executeTurnover(context: SkillExecutionContext): Promise<SkillExecutionResult> {
  const start = Date.now()
  try {
    const evidence = extractEvidence(context)
    const findings: SkillFinding[] = []
    const metrics: SkillMetric[] = []
    const adjustments = context.events.filter((e) => e.type?.includes('INVENTORY'))
    const stockUpdates = context.events.filter((e) => e.type?.includes('STOCK'))

    const totalUsed = adjustments.reduce((sum, e) => sum + Math.abs((e.data?.quantity as number) || 0), 0)
    const avgStock = stockUpdates.length > 0 ? average(stockUpdates.map((e) => (e.data?.level as number) || 0)) : 0
    const turnover = avgStock > 0 ? totalUsed / avgStock : 0

    metrics.push(createMetric('inventory_turnover', turnover, 'ratio', 'Inventory turnover ratio', 4,
      turnover < 2 ? 'warning' : 'good'))
    metrics.push(createMetric('total_used', totalUsed, 'units', 'Total inventory used'))
    metrics.push(createMetric('avg_stock_level', avgStock, 'units', 'Average stock level'))

    if (turnover < 2 && avgStock > 0) {
      findings.push(createFinding(context, 'risk', 'medium', 'Low inventory turnover',
        `Turnover ratio of ${turnover.toFixed(2)} indicates slow-moving inventory.`, 0.7, true,
        'Review purchasing quantities and reduce overstocking'))
    }

    const confidence = clamp01(0.4 + evidence.evidenceQuality * 0.3)
    const explainability = buildExplainability(context, 'temporal_reasoning',
      `Computed turnover from ${totalUsed} units used vs ${avgStock.toFixed(1)} avg stock: ${turnover.toFixed(2)}.`, [])

    return createSkillResult({ skillId: 'skill_inventory_turnover', skillName: 'Inventory Turnover Analysis', skillVersion: '1.0.0',
      findings, metrics, evidence, explainability, confidence, executionTime: Date.now() - start })
  } catch (error) {
    return createSkillErrorResult('skill_inventory_turnover', 'Inventory Turnover Analysis', '1.0.0', String(error), Date.now() - start)
  }
}

// ============================================================================
// Export
// ============================================================================

export const inventoryIntelligenceSkills: Array<{ definition: OperationalSkill; executor: import('../types').SkillExecutor }> = [
  { definition: forecastDef, executor: createSkillExecutor('skill_inventory_forecast', executeForecast) },
  { definition: wasteDef, executor: createSkillExecutor('skill_waste_detection', executeWaste) },
  { definition: reorderDef, executor: createSkillExecutor('skill_reorder_optimization', executeReorder) },
  { definition: supplierDef, executor: createSkillExecutor('skill_supplier_reliability', executeSupplier) },
  { definition: stockLevelDef, executor: createSkillExecutor('skill_stock_level_analysis', executeStockLevel) },
  { definition: shortageRiskDef, executor: createSkillExecutor('skill_shortage_risk', executeShortageRisk) },
  { definition: turnoverDef, executor: createSkillExecutor('skill_inventory_turnover', executeTurnover) },
]
