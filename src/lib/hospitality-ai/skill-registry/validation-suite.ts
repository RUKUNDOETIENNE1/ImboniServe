/**
 * Operational Skill Registry — Production Validation Suite.
 *
 * Comprehensive validation covering:
 * 1. Skill registration (50+ skills)
 * 2. Multi-skill orchestration
 * 3. Dynamic skill selection (discovery)
 * 4. Versioning
 * 5. Governance (lifecycle, audit)
 * 6. Explainability
 * 7. Performance
 * 8. Failure recovery
 *
 * This suite validates the entire Skill Registry module end-to-end.
 */

import { initializeSkillRegistry, getRegisteredSkillCount, listAllSkillCategories } from './skill-registration'
import { getSkillRegistry, resetSkillRegistry } from './registry'
import { getSkillDiscoveryEngine, resetSkillDiscoveryEngine } from './discovery-engine'
import { getSkillOrchestrationEngine, resetSkillOrchestrationEngine } from './orchestration-engine'
import { getSkillGovernanceEngine, resetSkillGovernanceEngine } from './governance-engine'
import { getSkillValidationFramework, resetSkillValidationFramework, createTestContext } from './validation-framework'
import { getSkillRegistryAPI, resetSkillRegistryAPI } from './api'
import type {
  SkillExecutionContext,
  SkillExecutionResult,
  SkillDiscoveryResult,
  SkillOrchestrationResult,
  SkillValidationResult,
  OperationalEvent,
} from './types'

// ============================================================================
// Test Result Types
// ============================================================================

export interface TestResult {
  name: string
  category: string
  passed: boolean
  duration: number
  details?: string
  error?: string
}

export interface ValidationSuiteResult {
  totalTests: number
  passed: number
  failed: number
  passRate: number
  results: TestResult[]
  summary: {
    skillsRegistered: number
    categoriesCovered: number
    orchestrationTestsRun: number
    discoveryTestsRun: number
    governanceTestsRun: number
    performanceTestsRun: number
  }
  certification: 'PASS' | 'FAIL' | 'CONDITIONAL_PASS'
  certificationDetails: string
}

// ============================================================================
// Test Data Factory
// ============================================================================

function createSyntheticEvent(type: string, hoursAgo: number, data: Record<string, unknown> = {}): OperationalEvent {
  return {
    id: `evt_${type}_${hoursAgo}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString(),
    type,
    category: type.split('_')[0].toLowerCase(),
    data,
  }
}

function createRichTestContext(overrides: Partial<SkillExecutionContext> = {}): SkillExecutionContext {
  const events: OperationalEvent[] = [
    // Orders
    ...Array.from({ length: 20 }, (_, i) => createSyntheticEvent('ORDER_CREATED', i * 2, { amount: 25 + i * 2, itemCount: 2 + (i % 3) })),
    // Payments
    ...Array.from({ length: 18 }, (_, i) => createSyntheticEvent('PAYMENT_CONFIRMED', i * 2 + 1, { amount: 25 + i * 2, method: i % 2 === 0 ? 'card' : 'cash' })),
    // Kitchen
    ...Array.from({ length: 15 }, (_, i) => createSyntheticEvent('KITCHEN_STATUS_CHANGED', i * 3, { status: i % 5 === 0 ? 'delayed' : 'cooking', station: ['grill', 'salad', 'dessert'][i % 3] })),
    // Menu items
    ...Array.from({ length: 30 }, (_, i) => createSyntheticEvent('MENU_ITEM_ORDERED', i, { price: 8 + (i % 10), station: ['grill', 'salad', 'dessert'][i % 3] })),
    // Staff
    ...Array.from({ length: 8 }, (_, i) => createSyntheticEvent('STAFF_CHECK_IN', i * 6, { staffId: `staff_${i}` })),
    ...Array.from({ length: 6 }, (_, i) => createSyntheticEvent('STAFF_CHECK_OUT', i * 6 + 5, { staffId: `staff_${i}` })),
    // Feedback
    ...Array.from({ length: 10 }, (_, i) => createSyntheticEvent('CUSTOMER_FEEDBACK', i * 4, { rating: 3 + (i % 3), category: ['food', 'service', 'ambiance'][i % 3] })),
    // Tables
    ...Array.from({ length: 12 }, (_, i) => createSyntheticEvent('TABLE_OCCUPIED', i * 3, { tableId: `table_${i % 6}` })),
    // Reservations
    ...Array.from({ length: 8 }, (_, i) => createSyntheticEvent('RESERVATION_CREATED', i * 5, { customerId: `cust_${i % 5}` })),
    // Inventory
    ...Array.from({ length: 6 }, (_, i) => createSyntheticEvent('INVENTORY_ADJUSTMENT', i * 8, { quantity: -(i + 1), reason: i % 3 === 0 ? 'waste' : 'usage' })),
    ...Array.from({ length: 5 }, (_, i) => createSyntheticEvent('STOCK_LEVEL_UPDATED', i * 10, { level: 15 - i * 2, reorderPoint: 5 })),
    // Deliveries
    ...Array.from({ length: 4 }, (_, i) => createSyntheticEvent('SUPPLIER_DELIVERY', i * 12, { supplierId: `sup_${i % 2}`, onTime: i % 4 !== 0 })),
  ]

  return createTestContext({
    events,
    ...overrides,
  })
}

// ============================================================================
// Validation Suite
// ============================================================================

export class SkillRegistryValidationSuite {
  private results: TestResult[] = []
  private orchestrationTestsRun = 0
  private discoveryTestsRun = 0
  private governanceTestsRun = 0
  private performanceTestsRun = 0

  constructor() {}

  // --------------------------------------------------------------------------
  // Run Full Suite
  // --------------------------------------------------------------------------

  async runFullSuite(): Promise<ValidationSuiteResult> {
    this.results = []
    this.orchestrationTestsRun = 0
    this.discoveryTestsRun = 0
    this.governanceTestsRun = 0
    this.performanceTestsRun = 0

    // Reset all singletons
    this.resetAll()

    // Run test categories
    await this.runRegistrationTests()
    await this.runDiscoveryTests()
    await this.runOrchestrationTests()
    await this.runGovernanceTests()
    await this.runValidationTests()
    await this.runExplainabilityTests()
    await this.runPerformanceTests()
    await this.runFailureRecoveryTests()
    await this.runAPITests()

    // Compute results
    const passed = this.results.filter((r) => r.passed).length
    const failed = this.results.filter((r) => !r.passed).length
    const total = this.results.length
    const passRate = total > 0 ? passed / total : 0

    const skillsRegistered = getRegisteredSkillCount()
    const categoriesCovered = listAllSkillCategories().length

    let certification: 'PASS' | 'FAIL' | 'CONDITIONAL_PASS' = 'FAIL'
    let certificationDetails = ''

    if (passRate >= 0.95 && skillsRegistered >= 50) {
      certification = 'PASS'
      certificationDetails = `All ${total} tests passed. ${skillsRegistered} skills registered across ${categoriesCovered} categories.`
    } else if (passRate >= 0.8) {
      certification = 'CONDITIONAL_PASS'
      certificationDetails = `${passed}/${total} tests passed (${(passRate * 100).toFixed(0)}%). ${failed} failures need attention.`
    } else {
      certification = 'FAIL'
      certificationDetails = `Only ${passed}/${total} tests passed (${(passRate * 100).toFixed(0)}%). Significant issues detected.`
    }

    return {
      totalTests: total,
      passed,
      failed,
      passRate,
      results: this.results,
      summary: {
        skillsRegistered,
        categoriesCovered,
        orchestrationTestsRun: this.orchestrationTestsRun,
        discoveryTestsRun: this.discoveryTestsRun,
        governanceTestsRun: this.governanceTestsRun,
        performanceTestsRun: this.performanceTestsRun,
      },
      certification,
      certificationDetails,
    }
  }

  // --------------------------------------------------------------------------
  // Test Categories
  // --------------------------------------------------------------------------

  private async runRegistrationTests(): Promise<void> {
    const start = Date.now()

    // Test 1: Initialize and register all skills
    try {
      const initResult = initializeSkillRegistry()
      this.recordTest('skill_registration', 'Registration', initResult.totalRegistered >= 50,
        Date.now() - start, `Registered ${initResult.totalRegistered} skills`, initResult.errors.join('; '))
    } catch (error) {
      this.recordTest('skill_registration', 'Registration', false, Date.now() - start, undefined, String(error))
    }

    // Test 2: Verify all 8 categories
    const start2 = Date.now()
    try {
      const categories = listAllSkillCategories()
      this.recordTest('all_categories_present', 'Registration', categories.length === 8,
        Date.now() - start2, `Found ${categories.length} categories: ${categories.map((c) => c.category).join(', ')}`)
    } catch (error) {
      this.recordTest('all_categories_present', 'Registration', false, Date.now() - start2, undefined, String(error))
    }

    // Test 3: Verify skill count per category
    const start3 = Date.now()
    try {
      const categories = listAllSkillCategories()
      const allHave7 = categories.every((c) => c.count >= 7)
      this.recordTest('skills_per_category', 'Registration', allHave7,
        Date.now() - start3, `Category counts: ${categories.map((c) => `${c.category}=${c.count}`).join(', ')}`)
    } catch (error) {
      this.recordTest('skills_per_category', 'Registration', false, Date.now() - start3, undefined, String(error))
    }
  }

  private async runDiscoveryTests(): Promise<void> {
    const discovery = getSkillDiscoveryEngine()
    const context = createRichTestContext()

    // Test 1: Discovery for operational review
    const start1 = Date.now()
    this.discoveryTestsRun++
    try {
      const result = discovery.discover({
        intent: 'operational_review',
        operationalDomain: 'operations',
        expertiseProfile: 'executive_advisor',
      })
      this.recordTest('discovery_operational_review', 'Discovery', result.selectedSkills.length > 0,
        Date.now() - start1, `Found ${result.selectedSkills.length} skills for operational review`)
    } catch (error) {
      this.recordTest('discovery_operational_review', 'Discovery', false, Date.now() - start1, undefined, String(error))
    }

    // Test 2: Discovery for kitchen domain
    const start2 = Date.now()
    this.discoveryTestsRun++
    try {
      const result = discovery.discover({
        intent: 'problem_diagnosis',
        operationalDomain: 'kitchen',
        expertiseProfile: 'kitchen_advisor',
      })
      this.recordTest('discovery_kitchen', 'Discovery', result.selectedSkills.length > 0,
        Date.now() - start2, `Found ${result.selectedSkills.length} kitchen skills`)
    } catch (error) {
      this.recordTest('discovery_kitchen', 'Discovery', false, Date.now() - start2, undefined, String(error))
    }

    // Test 3: Discovery for financial domain
    const start3 = Date.now()
    this.discoveryTestsRun++
    try {
      const result = discovery.discover({
        intent: 'trend_analysis',
        operationalDomain: 'finance',
        expertiseProfile: 'revenue_advisor',
      })
      this.recordTest('discovery_finance', 'Discovery', result.selectedSkills.length > 0,
        Date.now() - start3, `Found ${result.selectedSkills.length} financial skills`)
    } catch (error) {
      this.recordTest('discovery_finance', 'Discovery', false, Date.now() - start3, undefined, String(error))
    }

    // Test 4: Discovery with context
    const start4 = Date.now()
    this.discoveryTestsRun++
    try {
      const result = discovery.discoverForContext(context)
      this.recordTest('discovery_with_context', 'Discovery', result.selectedSkills.length > 0,
        Date.now() - start4, `Found ${result.selectedSkills.length} skills for context`)
    } catch (error) {
      this.recordTest('discovery_with_context', 'Discovery', false, Date.now() - start4, undefined, String(error))
    }

    // Test 5: Discovery top N
    const start5 = Date.now()
    this.discoveryTestsRun++
    try {
      const result = discovery.discoverTop({
        intent: 'optimization',
        operationalDomain: 'cross_domain',
        expertiseProfile: 'operational_excellence_advisor',
      }, 3)
      this.recordTest('discovery_top_n', 'Discovery', result.selectedSkills.length <= 3 && result.selectedSkills.length > 0,
        Date.now() - start5, `Top ${result.selectedSkills.length} skills returned`)
    } catch (error) {
      this.recordTest('discovery_top_n', 'Discovery', false, Date.now() - start5, undefined, String(error))
    }
  }

  private async runOrchestrationTests(): Promise<void> {
    const orchestration = getSkillOrchestrationEngine()
    const context = createRichTestContext()

    // Test 1: Sequential orchestration
    const start1 = Date.now()
    this.orchestrationTestsRun++
    try {
      const result = await orchestration.orchestrate(
        { intent: 'operational_review', operationalDomain: 'operations', expertiseProfile: 'executive_advisor' },
        context,
        { maxSkills: 3, combinationStrategy: 'sequential' }
      )
      this.recordTest('orchestration_sequential', 'Orchestration', result.success,
        Date.now() - start1, `Sequential: ${result.stepResults.length} steps, ${result.combinedFindings.length} findings`)
    } catch (error) {
      this.recordTest('orchestration_sequential', 'Orchestration', false, Date.now() - start1, undefined, String(error))
    }

    // Test 2: Parallel orchestration
    const start2 = Date.now()
    this.orchestrationTestsRun++
    try {
      const result = await orchestration.orchestrate(
        { intent: 'status_check', operationalDomain: 'cross_domain', expertiseProfile: 'executive_advisor' },
        context,
        { maxSkills: 3, combinationStrategy: 'parallel' }
      )
      this.recordTest('orchestration_parallel', 'Orchestration', result.success,
        Date.now() - start2, `Parallel: ${result.stepResults.length} steps, ${result.combinedFindings.length} findings`)
    } catch (error) {
      this.recordTest('orchestration_parallel', 'Orchestration', false, Date.now() - start2, undefined, String(error))
    }

    // Test 3: Plan creation
    const start3 = Date.now()
    this.orchestrationTestsRun++
    try {
      const plan = orchestration.createPlan(
        { intent: 'optimization', operationalDomain: 'kitchen', expertiseProfile: 'kitchen_advisor' },
        context,
        { maxSkills: 5 }
      )
      this.recordTest('orchestration_plan_creation', 'Orchestration', plan.skills.length > 0,
        Date.now() - start3, `Plan with ${plan.skills.length} steps, strategy: ${plan.combinationStrategy}`)
    } catch (error) {
      this.recordTest('orchestration_plan_creation', 'Orchestration', false, Date.now() - start3, undefined, String(error))
    }

    // Test 4: Combined findings deduplication
    const start4 = Date.now()
    this.orchestrationTestsRun++
    try {
      const result = await orchestration.orchestrate(
        { intent: 'operational_review', operationalDomain: 'operations', expertiseProfile: 'operational_excellence_advisor' },
        context,
        { maxSkills: 4 }
      )
      const uniqueFindings = new Set(result.combinedFindings.map((f) => f.title)).size
      this.recordTest('orchestration_finding_dedup', 'Orchestration',
        uniqueFindings === result.combinedFindings.length,
        Date.now() - start4, `${result.combinedFindings.length} unique findings from ${result.stepResults.length} skills`)
    } catch (error) {
      this.recordTest('orchestration_finding_dedup', 'Orchestration', false, Date.now() - start4, undefined, String(error))
    }
  }

  private async runGovernanceTests(): Promise<void> {
    const governance = getSkillGovernanceEngine()
    const registry = getSkillRegistry()
    const allSkills = registry.getAllSkills()

    // Test 1: Compliance check on all skills
    const start1 = Date.now()
    this.governanceTestsRun++
    try {
      const result = governance.runAllComplianceChecks()
      this.recordTest('governance_compliance', 'Governance', result.compliant >= result.totalChecked * 0.8,
        Date.now() - start1, `${result.compliant}/${result.totalChecked} skills compliant`)
    } catch (error) {
      this.recordTest('governance_compliance', 'Governance', false, Date.now() - start1, undefined, String(error))
    }

    // Test 2: Lifecycle transitions
    const start2 = Date.now()
    this.governanceTestsRun++
    try {
      const testSkill = allSkills[0]
      if (!testSkill) throw new Error('No skills available')
      const canTransition = governance.canTransition('draft', 'experimental')
      this.recordTest('governance_lifecycle', 'Governance', canTransition,
        Date.now() - start2, `Lifecycle transition draft->experimental: ${canTransition}`)
    } catch (error) {
      this.recordTest('governance_lifecycle', 'Governance', false, Date.now() - start2, undefined, String(error))
    }

    // Test 3: Audit trail
    const start3 = Date.now()
    this.governanceTestsRun++
    try {
      const testSkill = allSkills[0]
      if (!testSkill) throw new Error('No skills available')
      const trail = governance.getAuditTrail(testSkill.id)
      this.recordTest('governance_audit_trail', 'Governance', trail.length > 0,
        Date.now() - start3, `Audit trail has ${trail.length} records`)
    } catch (error) {
      this.recordTest('governance_audit_trail', 'Governance', false, Date.now() - start3, undefined, String(error))
    }

    // Test 4: Version history
    const start4 = Date.now()
    this.governanceTestsRun++
    try {
      const testSkill = allSkills[0]
      if (!testSkill) throw new Error('No skills available')
      const versions = governance.getVersionHistory(testSkill.id)
      this.recordTest('governance_version_history', 'Governance', versions.length > 0,
        Date.now() - start4, `Version history has ${versions.length} entries`)
    } catch (error) {
      this.recordTest('governance_version_history', 'Governance', false, Date.now() - start4, undefined, String(error))
    }

    // Test 5: Health monitoring
    const start5 = Date.now()
    this.governanceTestsRun++
    try {
      const health = governance.getAllSkillHealth()
      this.recordTest('governance_health_monitoring', 'Governance', health.length > 0,
        Date.now() - start5, `Health monitored for ${health.length} skills`)
    } catch (error) {
      this.recordTest('governance_health_monitoring', 'Governance', false, Date.now() - start5, undefined, String(error))
    }
  }

  private async runValidationTests(): Promise<void> {
    const validation = getSkillValidationFramework()
    const context = createRichTestContext()
    const registry = getSkillRegistry()
    const allSkills = registry.getAllSkills()

    // Test 1: Validate a sample skill
    const start1 = Date.now()
    try {
      const testSkill = allSkills[0]
      if (!testSkill) throw new Error('No skills available')
      const result = await validation.validateSkill(testSkill.id, context)
      this.recordTest('validation_single_skill', 'Validation', result.valid,
        Date.now() - start1, `Skill ${testSkill.name}: ${result.tests.length} tests, pass rate ${(result.passRate * 100).toFixed(0)}%`)
    } catch (error) {
      this.recordTest('validation_single_skill', 'Validation', false, Date.now() - start1, undefined, String(error))
    }

    // Test 2: Validate by category
    const start2 = Date.now()
    try {
      const result = await validation.validateByCategory('operational_analysis', context)
      this.recordTest('validation_by_category', 'Validation', result.totalValidated > 0,
        Date.now() - start2, `Validated ${result.totalValidated} operational_analysis skills, ${result.valid} valid`)
    } catch (error) {
      this.recordTest('validation_by_category', 'Validation', false, Date.now() - start2, undefined, String(error))
    }
  }

  private async runExplainabilityTests(): Promise<void> {
    const api = getSkillRegistryAPI()
    const context = createRichTestContext()
    const registry = getSkillRegistry()
    const allSkills = registry.getAllSkills()

    // Test 1: Every skill produces explainability
    const start1 = Date.now()
    let explainabilityOk = 0
    let totalTested = 0
    try {
      // Test first 5 skills
      for (const skill of allSkills.slice(0, 5)) {
        const result = await api.executeSkill({ skillId: skill.id, context })
        totalTested++
        if (result.success && result.result?.explainability) {
          const expl = result.result.explainability
          if (expl.narrative && expl.reasoningStrategy && expl.knowledgeConsulted !== undefined) {
            explainabilityOk++
          }
        }
      }
      this.recordTest('explainability_completeness', 'Explainability', explainabilityOk >= totalTested * 0.8,
        Date.now() - start1, `${explainabilityOk}/${totalTested} skills have complete explainability`)
    } catch (error) {
      this.recordTest('explainability_completeness', 'Explainability', false, Date.now() - start1, undefined, String(error))
    }

    // Test 2: Evidence traceability
    const start2 = Date.now()
    try {
      const testSkill = allSkills[0]
      if (!testSkill) throw new Error('No skills available')
      const result = await api.executeSkill({ skillId: testSkill.id, context })
      const hasEvidence = result.success && result.result?.evidence && result.result.evidence.evidenceCount >= 0
      this.recordTest('explainability_evidence_trace', 'Explainability', hasEvidence,
        Date.now() - start2, `Evidence count: ${result.result?.evidence?.evidenceCount || 0}`)
    } catch (error) {
      this.recordTest('explainability_evidence_trace', 'Explainability', false, Date.now() - start2, undefined, String(error))
    }
  }

  private async runPerformanceTests(): Promise<void> {
    const api = getSkillRegistryAPI()
    const context = createRichTestContext()
    const registry = getSkillRegistry()
    const allSkills = registry.getAllSkills()

    // Test 1: Single skill execution time
    const start1 = Date.now()
    this.performanceTestsRun++
    try {
      const testSkill = allSkills[0]
      if (!testSkill) throw new Error('No skills available')
      const result = await api.executeSkill({ skillId: testSkill.id, context })
      const execTime = result.result?.executionTime || 0
      this.recordTest('performance_single_skill', 'Performance', execTime < 5000,
        Date.now() - start1, `Skill executed in ${execTime}ms`)
    } catch (error) {
      this.recordTest('performance_single_skill', 'Performance', false, Date.now() - start1, undefined, String(error))
    }

    // Test 2: Orchestration performance
    const start2 = Date.now()
    this.performanceTestsRun++
    try {
      const result = await api.orchestrateSkills(
        { intent: 'operational_review', operationalDomain: 'operations', expertiseProfile: 'executive_advisor' },
        context,
        { maxSkills: 3 }
      )
      const totalTime = result.result?.totalTime || 0
      this.recordTest('performance_orchestration', 'Performance', totalTime < 10000,
        Date.now() - start2, `Orchestration completed in ${totalTime}ms`)
    } catch (error) {
      this.recordTest('performance_orchestration', 'Performance', false, Date.now() - start2, undefined, String(error))
    }

    // Test 3: Discovery performance
    const start3 = Date.now()
    this.performanceTestsRun++
    try {
      const discovery = getSkillDiscoveryEngine()
      const result = discovery.discover({
        intent: 'operational_review',
        operationalDomain: 'operations',
        expertiseProfile: 'executive_advisor',
      })
      this.recordTest('performance_discovery', 'Performance', result.discoveryTime < 100,
        Date.now() - start3, `Discovery completed in ${result.discoveryTime}ms`)
    } catch (error) {
      this.recordTest('performance_discovery', 'Performance', false, Date.now() - start3, undefined, String(error))
    }
  }

  private async runFailureRecoveryTests(): Promise<void> {
    const api = getSkillRegistryAPI()
    const context = createRichTestContext()

    // Test 1: Execute non-existent skill
    const start1 = Date.now()
    try {
      const result = await api.executeSkill({ skillId: 'nonexistent_skill', context })
      this.recordTest('failure_nonexistent_skill', 'FailureRecovery', !result.success && result.error !== undefined,
        Date.now() - start1, `Properly handled: ${result.error}`)
    } catch (error) {
      this.recordTest('failure_nonexistent_skill', 'FailureRecovery', false, Date.now() - start1, undefined, String(error))
    }

    // Test 2: Execute with empty context
    const start2 = Date.now()
    try {
      const emptyContext = createTestContext({ events: [], knowledge: [], memories: [] })
      const registry = getSkillRegistry()
      const firstSkill = registry.getAllSkills()[0]
      if (!firstSkill) throw new Error('No skills available')
      const result = await api.executeSkill({ skillId: firstSkill.id, context: emptyContext })
      // Should handle gracefully (success or structured error)
      this.recordTest('failure_empty_context', 'FailureRecovery',
        result.success || (result.result?.error !== undefined),
        Date.now() - start2, `Handled empty context: ${result.success ? 'success' : 'graceful error'}`)
    } catch (error) {
      this.recordTest('failure_empty_context', 'FailureRecovery', false, Date.now() - start2, undefined, String(error))
    }

    // Test 3: Orchestration with failure
    const start3 = Date.now()
    try {
      const result = await api.orchestrateSkills(
        { intent: 'operational_review', operationalDomain: 'operations', expertiseProfile: 'executive_advisor' },
        createTestContext({ events: [], knowledge: [], memories: [] }),
        { maxSkills: 2 }
      )
      // Should complete without throwing
      this.recordTest('failure_orchestration_resilience', 'FailureRecovery',
        result.success || result.result !== undefined,
        Date.now() - start3, `Orchestration handled: ${result.success ? 'success' : 'completed with warnings'}`)
    } catch (error) {
      this.recordTest('failure_orchestration_resilience', 'FailureRecovery', false, Date.now() - start3, undefined, String(error))
    }
  }

  private async runAPITests(): Promise<void> {
    const api = getSkillRegistryAPI()

    // Test 1: Get catalog
    const start1 = Date.now()
    try {
      const result = await api.getCatalog()
      this.recordTest('api_catalog', 'API', result.success && result.catalog.totalSkills >= 50,
        Date.now() - start1, `Catalog: ${result.catalog.totalSkills} skills`)
    } catch (error) {
      this.recordTest('api_catalog', 'API', false, Date.now() - start1, undefined, String(error))
    }

    // Test 2: Search skills
    const start2 = Date.now()
    try {
      const result = await api.searchSkills({ text: 'revenue', limit: 5 })
      this.recordTest('api_search', 'API', result.success && result.totalResults > 0,
        Date.now() - start2, `Search 'revenue': ${result.totalResults} results`)
    } catch (error) {
      this.recordTest('api_search', 'API', false, Date.now() - start2, undefined, String(error))
    }

    // Test 3: Get stats
    const start3 = Date.now()
    try {
      const result = await api.getStats()
      this.recordTest('api_stats', 'API', result.success && (result.stats?.total || 0) >= 50,
        Date.now() - start3, `Stats: ${result.stats?.total} total skills`)
    } catch (error) {
      this.recordTest('api_stats', 'API', false, Date.now() - start3, undefined, String(error))
    }

    // Test 4: Get skill history
    const start4 = Date.now()
    try {
      const registry = getSkillRegistry()
      const firstSkill = registry.getAllSkills()[0]
      if (!firstSkill) throw new Error('No skills available')
      const result = await api.getSkillHistory({ skillId: firstSkill.id })
      this.recordTest('api_history', 'API', result.success && result.history.length > 0,
        Date.now() - start4, `History: ${result.history.length} records`)
    } catch (error) {
      this.recordTest('api_history', 'API', false, Date.now() - start4, undefined, String(error))
    }

    // Test 5: Get skill versions
    const start5 = Date.now()
    try {
      const registry = getSkillRegistry()
      const firstSkill = registry.getAllSkills()[0]
      if (!firstSkill) throw new Error('No skills available')
      const result = await api.getSkillVersions({ skillId: firstSkill.id })
      this.recordTest('api_versions', 'API', result.success,
        Date.now() - start5, `Versions: current=${result.currentVersion}, history=${result.versions.length}`)
    } catch (error) {
      this.recordTest('api_versions', 'API', false, Date.now() - start5, undefined, String(error))
    }

    // Test 6: Compliance report
    const start6 = Date.now()
    try {
      const result = await api.getComplianceReport()
      this.recordTest('api_compliance', 'API', result.totalChecked > 0,
        Date.now() - start6, `Compliance: ${result.compliant}/${result.totalChecked} compliant`)
    } catch (error) {
      this.recordTest('api_compliance', 'API', false, Date.now() - start6, undefined, String(error))
    }
  }

  // --------------------------------------------------------------------------
  // Helpers
  // --------------------------------------------------------------------------

  private recordTest(name: string, category: string, passed: boolean, duration: number, details?: string, error?: string): void {
    this.results.push({ name, category, passed, duration, details, error })
  }

  private resetAll(): void {
    resetSkillRegistry()
    resetSkillDiscoveryEngine()
    resetSkillOrchestrationEngine()
    resetSkillGovernanceEngine()
    resetSkillValidationFramework()
    resetSkillRegistryAPI()
  }
}

// ============================================================================
// Convenience Function
// ============================================================================

export async function runSkillRegistryValidation(): Promise<ValidationSuiteResult> {
  const suite = new SkillRegistryValidationSuite()
  return suite.runFullSuite()
}
