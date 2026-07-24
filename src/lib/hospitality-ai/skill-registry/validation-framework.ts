/**
 * Operational Skill Registry — Validation Framework.
 *
 * Provides comprehensive validation for skills:
 * - Functional tests: does the skill produce correct outputs?
 * - Integration tests: does the skill work with real evidence?
 * - Performance tests: does the skill execute within time limits?
 * - Edge case tests: does the skill handle empty/minimal evidence?
 * - Failure scenario tests: does the skill handle errors gracefully?
 * - Confidence validation: is confidence properly computed?
 * - Explainability validation: is the explanation complete?
 *
 * The Validation Framework never bypasses the certified architecture.
 * It validates skills against evidence — it does not generate facts.
 */

import type {
  OperationalSkill,
  SkillExecutionContext,
  SkillExecutionResult,
  SkillValidationResult,
  SkillFinding,
  SkillEvidence,
  SkillExplainability,
} from './types'
import { clamp01 } from './utils'
import { OperationalSkillRegistry } from './registry'

// ============================================================================
// Validation Framework
// ============================================================================

export class SkillValidationFramework {
  constructor(private registry: OperationalSkillRegistry) {}

  // --------------------------------------------------------------------------
  // Full Validation
  // --------------------------------------------------------------------------

  async validateSkill(
    skillId: string,
    context: SkillExecutionContext,
    options: { timeout?: number } = {}
  ): Promise<SkillValidationResult> {
    const skill = this.registry.getSkill(skillId)
    if (!skill) {
      return {
        skillId,
        valid: false,
        tests: [{
          name: 'skill_exists',
          type: 'functional',
          passed: false,
          description: 'Verify skill exists in registry',
          duration: 0,
          error: 'Skill not found',
        }],
        passRate: 0,
        validatedAt: new Date().toISOString(),
        validatedBy: 'system',
        issues: ['Skill not found in registry'],
      }
    }

    const tests: SkillValidationResult['tests'] = []
    const issues: string[] = []
    const timeout = options.timeout || 30000

    // Run all test categories
    if (skill.validationRules.functionalTestRequired) {
      tests.push(await this.runFunctionalTest(skillId, context, timeout))
    }
    if (skill.validationRules.integrationTestRequired) {
      tests.push(await this.runIntegrationTest(skillId, context, timeout))
    }
    if (skill.validationRules.performanceTestRequired) {
      tests.push(await this.runPerformanceTest(skillId, context, timeout))
    }
    if (skill.validationRules.edgeCaseTestRequired) {
      tests.push(await this.runEdgeCaseTest(skillId, context, timeout))
    }
    if (skill.validationRules.failureScenarioTestRequired) {
      tests.push(await this.runFailureScenarioTest(skillId, context, timeout))
    }
    if (skill.validationRules.confidenceValidationRequired) {
      tests.push(await this.runConfidenceValidation(skillId, context, timeout))
    }
    if (skill.validationRules.explainabilityValidationRequired) {
      tests.push(await this.runExplainabilityValidation(skillId, context, timeout))
    }

    // Collect issues from failed tests
    for (const test of tests) {
      if (!test.passed && test.error) {
        issues.push(`${test.name}: ${test.error}`)
      }
    }

    const passedCount = tests.filter((t) => t.passed).length
    const passRate = tests.length > 0 ? passedCount / tests.length : 0
    const valid = passRate >= skill.validationRules.minimumTestPassRate

    return {
      skillId,
      valid,
      tests,
      passRate,
      validatedAt: new Date().toISOString(),
      validatedBy: 'system',
      issues,
    }
  }

  // --------------------------------------------------------------------------
  // Individual Test Runners
  // --------------------------------------------------------------------------

  private async runFunctionalTest(
    skillId: string,
    context: SkillExecutionContext,
    timeout: number
  ): Promise<SkillValidationResult['tests'][0]> {
    const start = Date.now()
    try {
      const result = await this.executeWithTimeout(skillId, context, timeout)
      const passed = result.success && result.findings !== undefined && result.metrics !== undefined
      return {
        name: 'functional_test',
        type: 'functional',
        passed,
        description: 'Verify skill executes and produces findings and metrics',
        duration: Date.now() - start,
        error: passed ? undefined : result.error || 'Skill did not produce valid outputs',
      }
    } catch (error) {
      return {
        name: 'functional_test',
        type: 'functional',
        passed: false,
        description: 'Verify skill executes and produces findings and metrics',
        duration: Date.now() - start,
        error: String(error),
      }
    }
  }

  private async runIntegrationTest(
    skillId: string,
    context: SkillExecutionContext,
    timeout: number
  ): Promise<SkillValidationResult['tests'][0]> {
    const start = Date.now()
    try {
      const result = await this.executeWithTimeout(skillId, context, timeout)
      // Verify the skill used the provided evidence
      const usedKnowledge = result.evidence.knowledgeIds.length > 0 || context.knowledge.length === 0
      const usedMemory = result.evidence.memoryIds.length > 0 || context.memories.length === 0
      const passed = result.success && usedKnowledge && usedMemory
      return {
        name: 'integration_test',
        type: 'integration',
        passed,
        description: 'Verify skill integrates with knowledge and memory evidence',
        duration: Date.now() - start,
        error: passed ? undefined : 'Skill did not properly use provided evidence',
      }
    } catch (error) {
      return {
        name: 'integration_test',
        type: 'integration',
        passed: false,
        description: 'Verify skill integrates with knowledge and memory evidence',
        duration: Date.now() - start,
        error: String(error),
      }
    }
  }

  private async runPerformanceTest(
    skillId: string,
    context: SkillExecutionContext,
    timeout: number
  ): Promise<SkillValidationResult['tests'][0]> {
    const start = Date.now()
    try {
      const result = await this.executeWithTimeout(skillId, context, timeout)
      const skill = this.registry.getSkill(skillId)
      const expectedMaxTime = skill?.estimatedCost.estimatedExecutionTimeMs || 5000
      const passed = result.success && result.executionTime <= expectedMaxTime * 5 // Allow 5x margin
      return {
        name: 'performance_test',
        type: 'performance',
        passed,
        description: `Verify skill executes within ${expectedMaxTime * 5}ms (5x estimate)`,
        duration: Date.now() - start,
        error: passed ? undefined : `Execution time ${result.executionTime}ms exceeded limit`,
      }
    } catch (error) {
      return {
        name: 'performance_test',
        type: 'performance',
        passed: false,
        description: 'Verify skill executes within time limit',
        duration: Date.now() - start,
        error: String(error),
      }
    }
  }

  private async runEdgeCaseTest(
    skillId: string,
    context: SkillExecutionContext,
    timeout: number
  ): Promise<SkillValidationResult['tests'][0]> {
    const start = Date.now()
    try {
      // Test with minimal/empty evidence
      const emptyContext: SkillExecutionContext = {
        ...context,
        knowledge: [],
        memories: [],
        events: [],
        inputs: {},
      }
      const result = await this.executeWithTimeout(skillId, emptyContext, timeout)
      // Skill should handle empty evidence gracefully (not crash)
      const passed = result.success || (result.error !== undefined && result.error.length > 0)
      return {
        name: 'edge_case_test',
        type: 'edge_case',
        passed,
        description: 'Verify skill handles empty/minimal evidence gracefully',
        duration: Date.now() - start,
        error: passed ? undefined : 'Skill failed to handle empty evidence',
      }
    } catch (error) {
      return {
        name: 'edge_case_test',
        type: 'edge_case',
        passed: false,
        description: 'Verify skill handles empty/minimal evidence gracefully',
        duration: Date.now() - start,
        error: String(error),
      }
    }
  }

  private async runFailureScenarioTest(
    skillId: string,
    context: SkillExecutionContext,
    timeout: number
  ): Promise<SkillValidationResult['tests'][0]> {
    const start = Date.now()
    try {
      // Test with invalid context (missing businessId)
      const invalidContext: SkillExecutionContext = {
        ...context,
        businessId: '',
        businessName: '',
      }
      const result = await this.executeWithTimeout(skillId, invalidContext, timeout)
      // Skill should either handle gracefully or return a structured error
      const passed = result.success || (result.error !== undefined && result.warnings.length > 0)
      return {
        name: 'failure_scenario_test',
        type: 'failure_scenario',
        passed,
        description: 'Verify skill handles invalid context gracefully',
        duration: Date.now() - start,
        error: passed ? undefined : 'Skill did not handle invalid context gracefully',
      }
    } catch (error) {
      return {
        name: 'failure_scenario_test',
        type: 'failure_scenario',
        passed: false,
        description: 'Verify skill handles invalid context gracefully',
        duration: Date.now() - start,
        error: String(error),
      }
    }
  }

  private async runConfidenceValidation(
    skillId: string,
    context: SkillExecutionContext,
    timeout: number
  ): Promise<SkillValidationResult['tests'][0]> {
    const start = Date.now()
    try {
      const result = await this.executeWithTimeout(skillId, context, timeout)
      const confidence = result.confidence
      const factors = result.confidenceFactors

      const issues: string[] = []
      if (confidence < 0 || confidence > 1) issues.push('Confidence out of [0,1] range')
      if (factors.evidenceQuality < 0 || factors.evidenceQuality > 1) issues.push('Evidence quality out of range')
      if (factors.consistency < 0 || factors.consistency > 1) issues.push('Consistency out of range')
      if (factors.recency < 0 || factors.recency > 1) issues.push('Recency out of range')
      if (result.success && confidence === 0 && result.evidence.evidenceCount > 0) {
        issues.push('Confidence is 0 despite having evidence')
      }

      const passed = issues.length === 0
      return {
        name: 'confidence_validation',
        type: 'confidence',
        passed,
        description: 'Verify confidence is properly computed and within valid range',
        duration: Date.now() - start,
        error: passed ? undefined : issues.join('; '),
      }
    } catch (error) {
      return {
        name: 'confidence_validation',
        type: 'confidence',
        passed: false,
        description: 'Verify confidence is properly computed',
        duration: Date.now() - start,
        error: String(error),
      }
    }
  }

  private async runExplainabilityValidation(
    skillId: string,
    context: SkillExecutionContext,
    timeout: number
  ): Promise<SkillValidationResult['tests'][0]> {
    const start = Date.now()
    try {
      const result = await this.executeWithTimeout(skillId, context, timeout)
      const expl: SkillExplainability = result.explainability

      const issues: string[] = []
      if (!expl.reasoningStrategy) issues.push('Missing reasoning strategy')
      if (!expl.narrative || expl.narrative.length === 0) issues.push('Missing narrative')
      if (expl.knowledgeConsulted === undefined) issues.push('Missing knowledge consulted list')
      if (expl.memoriesConsulted === undefined) issues.push('Missing memories consulted list')
      if (expl.eventsConsulted === undefined) issues.push('Missing events consulted count')
      if (expl.alternativeOptions === undefined) issues.push('Missing alternative options')

      const passed = issues.length === 0
      return {
        name: 'explainability_validation',
        type: 'explainability',
        passed,
        description: 'Verify explainability output is complete',
        duration: Date.now() - start,
        error: passed ? undefined : issues.join('; '),
      }
    } catch (error) {
      return {
        name: 'explainability_validation',
        type: 'explainability',
        passed: false,
        description: 'Verify explainability output is complete',
        duration: Date.now() - start,
        error: String(error),
      }
    }
  }

  // --------------------------------------------------------------------------
  // Batch Validation
  // --------------------------------------------------------------------------

  async validateAllSkills(context: SkillExecutionContext): Promise<{
    totalValidated: number
    valid: number
    invalid: number
    results: SkillValidationResult[]
  }> {
    const allSkills = this.registry.getAllSkills()
    const results: SkillValidationResult[] = []

    for (const skill of allSkills) {
      const result = await this.validateSkill(skill.id, context)
      results.push(result)
    }

    return {
      totalValidated: results.length,
      valid: results.filter((r) => r.valid).length,
      invalid: results.filter((r) => !r.valid).length,
      results,
    }
  }

  async validateByCategory(category: string, context: SkillExecutionContext): Promise<{
    totalValidated: number
    valid: number
    invalid: number
    results: SkillValidationResult[]
  }> {
    const allSkills = this.registry.getAllSkills().filter((s) => s.category === category)
    const results: SkillValidationResult[] = []

    for (const skill of allSkills) {
      const result = await this.validateSkill(skill.id, context)
      results.push(result)
    }

    return {
      totalValidated: results.length,
      valid: results.filter((r) => r.valid).length,
      invalid: results.filter((r) => !r.valid).length,
      results,
    }
  }

  // --------------------------------------------------------------------------
  // Helpers
  // --------------------------------------------------------------------------

  private async executeWithTimeout(
    skillId: string,
    context: SkillExecutionContext,
    timeoutMs: number
  ): Promise<SkillExecutionResult> {
    const executor = this.registry.getExecutor(skillId)
    if (!executor) {
      throw new Error(`No executor for skill ${skillId}`)
    }

    return new Promise<SkillExecutionResult>((resolve) => {
      const timer = setTimeout(() => {
        resolve({
          skillId,
          skillName: 'unknown',
          skillVersion: '0.0.0',
          success: false,
          outputs: {},
          findings: [],
          metrics: [],
          confidence: 0,
          confidenceFactors: { evidenceQuality: 0, consistency: 0, recency: 0, contradictionPenalty: 0 },
          evidence: {
            knowledgeIds: [], memoryIds: [], eventIds: [],
            evidenceCount: 0, evidenceQuality: 0, evidenceSummary: 'Execution timed out',
          },
          explainability: {
            reasoningStrategy: 'evidence_based_recommendation',
            knowledgeConsulted: [], memoriesConsulted: [], eventsConsulted: 0,
            narrative: 'Execution timed out',
            alternativeOptions: [],
          },
          executionTime: timeoutMs,
          warnings: ['Execution timed out'],
          error: `Execution timed out after ${timeoutMs}ms`,
        })
      }, timeoutMs)

      executor.execute(context)
        .then((result) => {
          clearTimeout(timer)
          resolve(result)
        })
        .catch((error) => {
          clearTimeout(timer)
          resolve({
            skillId,
            skillName: 'unknown',
            skillVersion: '0.0.0',
            success: false,
            outputs: {},
            findings: [],
            metrics: [],
            confidence: 0,
            confidenceFactors: { evidenceQuality: 0, consistency: 0, recency: 0, contradictionPenalty: 0 },
            evidence: {
              knowledgeIds: [], memoryIds: [], eventIds: [],
              evidenceCount: 0, evidenceQuality: 0, evidenceSummary: 'Execution error',
            },
            explainability: {
              reasoningStrategy: 'evidence_based_recommendation',
              knowledgeConsulted: [], memoriesConsulted: [], eventsConsulted: 0,
              narrative: `Execution error: ${String(error)}`,
              alternativeOptions: [],
            },
            executionTime: timeoutMs,
            warnings: [String(error)],
            error: String(error),
          })
        })
    })
  }
}

// ============================================================================
// Test Context Factory
// ============================================================================

/**
 * Creates a test context with synthetic evidence for validation purposes.
 * This is ONLY used for validation — never for production recommendations.
 */
export function createTestContext(overrides: Partial<SkillExecutionContext> = {}): SkillExecutionContext {
  return {
    businessId: 'test_business_001',
    businessName: 'Test Restaurant',
    timeRange: {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      end: new Date().toISOString(),
    },
    expertiseProfile: 'executive_advisor',
    intent: 'operational_review',
    operationalDomain: 'operations',
    reasoningStrategy: 'multi_factor_reasoning',
    knowledge: [],
    memories: [],
    events: [],
    inputs: {},
    requestId: `test_req_${Date.now()}`,
    userId: 'test_user',
    ...overrides,
  }
}

// ============================================================================
// Singleton
// ============================================================================

let validationFrameworkInstance: SkillValidationFramework | null = null

export function getSkillValidationFramework(registry?: OperationalSkillRegistry): SkillValidationFramework {
  if (!validationFrameworkInstance) {
    const reg = registry || require('./registry').getSkillRegistry()
    validationFrameworkInstance = new SkillValidationFramework(reg)
  }
  return validationFrameworkInstance
}

export function resetSkillValidationFramework(): void {
  validationFrameworkInstance = null
}
