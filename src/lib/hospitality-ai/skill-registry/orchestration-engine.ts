/**
 * Operational Skill Registry — Orchestration Engine.
 *
 * Plans and executes multi-skill workflows:
 * - Sequential: skills run one after another, passing outputs
 * - Parallel: skills run concurrently
 * - Pipeline: skills run in stages with dependencies
 * - Fan-out/Fan-in: distribute work and aggregate results
 *
 * The Orchestration Engine never bypasses the certified architecture.
 * It combines skill outputs — it does not generate facts or perform reasoning.
 */

import type {
  OperationalSkill,
  SkillExecutionContext,
  SkillExecutionResult,
  SkillOrchestrationPlan,
  SkillOrchestrationResult,
  SkillFinding,
  SkillMetric,
  SkillEvidence,
  SkillDiscoveryRequest,
} from './types'
import { hashId, nowIso, clamp01, average } from './utils'
import { OperationalSkillRegistry } from './registry'
import { SkillDiscoveryEngine } from './discovery-engine'

// ============================================================================
// Orchestration Engine
// ============================================================================

export class SkillOrchestrationEngine {
  constructor(
    private registry: OperationalSkillRegistry,
    private discoveryEngine: SkillDiscoveryEngine
  ) {}

  // --------------------------------------------------------------------------
  // Plan Creation
  // --------------------------------------------------------------------------

  createPlan(
    request: SkillDiscoveryRequest,
    context: SkillExecutionContext,
    options: { maxSkills?: number; combinationStrategy?: SkillOrchestrationPlan['combinationStrategy'] } = {}
  ): SkillOrchestrationPlan {
    const maxSkills = options.maxSkills || 5
    const strategy = options.combinationStrategy || 'sequential'

    // Discover relevant skills
    const discovery = this.discoveryEngine.discover(request)
    const selectedSkills = discovery.selectedSkills.slice(0, maxSkills)

    // Build plan steps
    const steps: SkillOrchestrationPlan['skills'] = []
    const skillMap = new Map<string, OperationalSkill>()

    for (let i = 0; i < selectedSkills.length; i++) {
      const { skill } = selectedSkills[i]
      skillMap.set(skill.id, skill)

      const dependsOn: string[] = []
      const inputFromPreviousSteps: Array<{ fromSkillId: string; fromOutput: string; toInput: string }> = []

      if (strategy === 'sequential' || strategy === 'pipeline') {
        // Each skill depends on the previous one
        if (i > 0) {
          const prevSkill = selectedSkills[i - 1].skill
          dependsOn.push(prevSkill.id)
          // Pass findings from previous skill as input
          inputFromPreviousSteps.push({
            fromSkillId: prevSkill.id,
            fromOutput: 'findings',
            toInput: 'previousFindings',
          })
        }
      } else if (strategy === 'fan_out_fan_in') {
        // All skills depend on the first one (fan-in target)
        if (i === selectedSkills.length - 1 && selectedSkills.length > 1) {
          for (let j = 0; j < selectedSkills.length - 1; j++) {
            dependsOn.push(selectedSkills[j].skill.id)
            inputFromPreviousSteps.push({
              fromSkillId: selectedSkills[j].skill.id,
              fromOutput: 'findings',
              toInput: `findings_from_${selectedSkills[j].skill.id}`,
            })
          }
        }
      }

      steps.push({
        skillId: skill.id,
        skillName: skill.name,
        executionOrder: i + 1,
        dependsOn,
        inputs: { ...context.inputs },
        inputFromPreviousSteps: inputFromPreviousSteps.length > 0 ? inputFromPreviousSteps : undefined,
      })
    }

    const estimatedTotalTime = steps.reduce(
      (sum, s) => sum + (skillMap.get(s.skillId)?.estimatedCost.estimatedExecutionTimeMs || 100),
      0
    )

    return {
      id: hashId('orchestration', `${context.requestId}|${nowIso()}`),
      requestId: context.requestId,
      skills: steps,
      combinationStrategy: strategy,
      estimatedTotalTime,
      createdAt: nowIso(),
    }
  }

  // --------------------------------------------------------------------------
  // Plan Execution
  // --------------------------------------------------------------------------

  async executePlan(
    plan: SkillOrchestrationPlan,
    baseContext: SkillExecutionContext
  ): Promise<SkillOrchestrationResult> {
    const start = Date.now()
    const stepResults: SkillExecutionResult[] = []
    const stepOutputs = new Map<string, SkillExecutionResult>()
    const warnings: string[] = []

    if (plan.combinationStrategy === 'parallel') {
      // Execute all skills in parallel
      const promises = plan.skills.map(async (step) => {
        const context = this.buildStepContext(step, baseContext, stepOutputs)
        return this.executeStep(step.skillId, context)
      })
      const results = await Promise.all(promises)
      stepResults.push(...results)
      for (let i = 0; i < plan.skills.length; i++) {
        stepOutputs.set(plan.skills[i].skillId, results[i])
      }
    } else {
      // Execute sequentially (sequential, pipeline, fan_out_fan_in)
      for (const step of plan.skills) {
        // Wait for dependencies (in sequential mode they're already done)
        const context = this.buildStepContext(step, baseContext, stepOutputs)
        const result = await this.executeStep(step.skillId, context)
        stepResults.push(result)
        stepOutputs.set(step.skillId, result)

        if (!result.success) {
          warnings.push(`Skill ${step.skillName} failed: ${result.error || 'unknown error'}`)
          if (plan.combinationStrategy === 'pipeline') {
            // Stop pipeline on failure
            break
          }
        }
      }
    }

    // Combine results
    const combinedFindings = this.combineFindings(stepResults)
    const combinedMetrics = this.combineMetrics(stepResults)
    const combinedEvidence = this.combineEvidence(stepResults)
    const overallConfidence = this.computeOverallConfidence(stepResults)
    const narrative = this.buildNarrative(plan, stepResults)
    const success = stepResults.every((r) => r.success)

    return {
      plan,
      stepResults,
      combinedFindings,
      combinedMetrics,
      combinedEvidence,
      overallConfidence,
      narrative,
      totalTime: Date.now() - start,
      success,
      warnings,
    }
  }

  // --------------------------------------------------------------------------
  // Convenience: Discover + Plan + Execute
  // --------------------------------------------------------------------------

  async orchestrate(
    request: SkillDiscoveryRequest,
    context: SkillExecutionContext,
    options: { maxSkills?: number; combinationStrategy?: SkillOrchestrationPlan['combinationStrategy'] } = {}
  ): Promise<SkillOrchestrationResult> {
    const plan = this.createPlan(request, context, options)
    return this.executePlan(plan, context)
  }

  // --------------------------------------------------------------------------
  // Step Execution Helpers
  // --------------------------------------------------------------------------

  private buildStepContext(
    step: SkillOrchestrationPlan['skills'][0],
    baseContext: SkillExecutionContext,
    previousOutputs: Map<string, SkillExecutionResult>
  ): SkillExecutionContext {
    const inputs = { ...step.inputs }

    // Inject outputs from previous steps
    if (step.inputFromPreviousSteps) {
      for (const link of step.inputFromPreviousSteps) {
        const prevResult = previousOutputs.get(link.fromSkillId)
        if (prevResult) {
          if (link.fromOutput === 'findings') {
            inputs[link.toInput] = prevResult.findings
          } else if (link.fromOutput === 'metrics') {
            inputs[link.toInput] = prevResult.metrics
          } else {
            inputs[link.toInput] = prevResult.outputs[link.fromOutput]
          }
        }
      }
    }

    return {
      ...baseContext,
      inputs,
    }
  }

  private async executeStep(skillId: string, context: SkillExecutionContext): Promise<SkillExecutionResult> {
    const executor = this.registry.getExecutor(skillId)
    if (!executor) {
      return {
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
          evidenceCount: 0, evidenceQuality: 0, evidenceSummary: 'No executor found',
        },
        explainability: {
          reasoningStrategy: 'evidence_based_recommendation',
          knowledgeConsulted: [], memoriesConsulted: [], eventsConsulted: 0,
          narrative: `No executor registered for skill ${skillId}`,
          alternativeOptions: [],
        },
        executionTime: 0,
        warnings: [`No executor for skill ${skillId}`],
        error: `No executor registered for skill ${skillId}`,
      }
    }

    const start = Date.now()
    try {
      const result = await executor.execute(context)
      // Record performance metrics
      this.registry.recordExecution(
        skillId,
        result.success,
        result.executionTime,
        result.confidence,
        context.expertiseProfile,
        context.operationalDomain
      )
      return result
    } catch (error) {
      const execTime = Date.now() - start
      this.registry.recordExecution(skillId, false, execTime, 0, context.expertiseProfile, context.operationalDomain)
      return {
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
        executionTime: execTime,
        warnings: [String(error)],
        error: String(error),
      }
    }
  }

  // --------------------------------------------------------------------------
  // Result Combination
  // --------------------------------------------------------------------------

  private combineFindings(results: SkillExecutionResult[]): SkillFinding[] {
    const allFindings: SkillFinding[] = []
    const seenTitles = new Set<string>()
    for (const result of results) {
      for (const finding of result.findings) {
        if (!seenTitles.has(finding.title)) {
          seenTitles.add(finding.title)
          allFindings.push(finding)
        }
      }
    }
    // Sort by severity (critical first) then confidence
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 }
    return allFindings.sort((a, b) => {
      const sevDiff = severityOrder[a.severity] - severityOrder[b.severity]
      if (sevDiff !== 0) return sevDiff
      return b.confidence - a.confidence
    })
  }

  private combineMetrics(results: SkillExecutionResult[]): SkillMetric[] {
    const metricMap = new Map<string, SkillMetric>()
    for (const result of results) {
      for (const metric of result.metrics) {
        const key = `${metric.name}`
        if (!metricMap.has(key)) {
          metricMap.set(key, metric)
        }
      }
    }
    return Array.from(metricMap.values())
  }

  private combineEvidence(results: SkillExecutionResult[]): SkillEvidence {
    const knowledgeIds = new Set<string>()
    const memoryIds = new Set<string>()
    const eventIds = new Set<string>()
    let totalQuality = 0
    let qualityCount = 0

    for (const result of results) {
      result.evidence.knowledgeIds.forEach((id) => knowledgeIds.add(id))
      result.evidence.memoryIds.forEach((id) => memoryIds.add(id))
      result.evidence.eventIds.forEach((id) => eventIds.add(id))
      totalQuality += result.evidence.evidenceQuality
      qualityCount++
    }

    return {
      knowledgeIds: Array.from(knowledgeIds),
      memoryIds: Array.from(memoryIds),
      eventIds: Array.from(eventIds),
      evidenceCount: knowledgeIds.size + memoryIds.size + eventIds.size,
      evidenceQuality: qualityCount > 0 ? totalQuality / qualityCount : 0,
      evidenceSummary: `Combined evidence from ${results.length} skill executions: ${knowledgeIds.size} knowledge, ${memoryIds.size} memories, ${eventIds.size} events`,
    }
  }

  private computeOverallConfidence(results: SkillExecutionResult[]): number {
    if (results.length === 0) return 0
    const successful = results.filter((r) => r.success)
    if (successful.length === 0) return 0
    const avgConfidence = average(successful.map((r) => r.confidence))
    const successRate = successful.length / results.length
    return clamp01(avgConfidence * successRate)
  }

  private buildNarrative(plan: SkillOrchestrationPlan, results: SkillExecutionResult[]): string {
    const successful = results.filter((r) => r.success)
    const failed = results.filter((r) => !r.success)
    const totalFindings = results.reduce((sum, r) => sum + r.findings.length, 0)
    const totalMetrics = results.reduce((sum, r) => sum + r.metrics.length, 0)

    const parts: string[] = [
      `Orchestration executed ${results.length} skill(s) using '${plan.combinationStrategy}' strategy.`,
      `${successful.length} succeeded, ${failed.length} failed.`,
      `Produced ${totalFindings} findings and ${totalMetrics} metrics.`,
    ]

    if (failed.length > 0) {
      parts.push(`Failed skills: ${failed.map((r) => r.skillName).join(', ')}`)
    }

    return parts.join(' ')
  }
}

// ============================================================================
// Singleton
// ============================================================================

let orchestrationEngineInstance: SkillOrchestrationEngine | null = null

export function getSkillOrchestrationEngine(
  registry?: OperationalSkillRegistry,
  discoveryEngine?: SkillDiscoveryEngine
): SkillOrchestrationEngine {
  if (!orchestrationEngineInstance) {
    const reg = registry || require('./registry').getSkillRegistry()
    const disc = discoveryEngine || require('./discovery-engine').getSkillDiscoveryEngine(reg)
    orchestrationEngineInstance = new SkillOrchestrationEngine(reg, disc)
  }
  return orchestrationEngineInstance
}

export function resetSkillOrchestrationEngine(): void {
  orchestrationEngineInstance = null
}
