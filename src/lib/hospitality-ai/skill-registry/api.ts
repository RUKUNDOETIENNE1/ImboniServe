/**
 * Operational Skill Registry — API Layer.
 *
 * Provides programmatic access to the Skill Registry with 8 endpoints:
 * 1. Register Skill
 * 2. Search Skills
 * 3. Execute Skill
 * 4. Validate Skill
 * 5. Version Management
 * 6. History & Audit
 * 7. Catalog
 * 8. Orchestrate (bonus)
 *
 * This module wraps the registry, discovery, orchestration, governance,
 * and validation engines into a unified API.
 */

import type {
  OperationalSkill,
  SkillExecutionContext,
  SkillExecutionResult,
  SkillValidationResult,
  SkillSearchRequest,
  SkillSearchResponse,
  SkillRegisterRequest,
  SkillRegisterResponse,
  SkillExecuteRequest,
  SkillExecuteResponse,
  SkillValidateRequest,
  SkillValidateResponse,
  SkillVersionRequest,
  SkillVersionResponse,
  SkillHistoryRequest,
  SkillHistoryResponse,
  SkillCatalogResponse,
  SkillDiscoveryRequest,
  SkillDiscoveryResult,
  SkillOrchestrationPlan,
  SkillOrchestrationResult,
  SkillExecutor,
} from './types'
import { getSkillRegistry } from './registry'
import { getSkillDiscoveryEngine } from './discovery-engine'
import { getSkillOrchestrationEngine } from './orchestration-engine'
import { getSkillGovernanceEngine } from './governance-engine'
import { getSkillValidationFramework } from './validation-framework'
import { initializeSkillRegistry, isSkillRegistryInitialized } from './skill-registration'

// ============================================================================
// Skill Registry API
// ============================================================================

export class SkillRegistryAPI {
  constructor(
    private registry = getSkillRegistry(),
    private discovery = getSkillDiscoveryEngine(),
    private orchestration = getSkillOrchestrationEngine(),
    private governance = getSkillGovernanceEngine(),
    private validation = getSkillValidationFramework()
  ) {}

  // --------------------------------------------------------------------------
  // Ensure Initialized
  // --------------------------------------------------------------------------

  private ensureInitialized(): void {
    if (!isSkillRegistryInitialized()) {
      initializeSkillRegistry()
    }
  }

  // --------------------------------------------------------------------------
  // 1. Register Skill
  // --------------------------------------------------------------------------

  async registerSkill(request: SkillRegisterRequest): Promise<SkillRegisterResponse> {
    try {
      this.ensureInitialized()
      const skillId = this.registry.register(request.skill)
      return { success: true, skillId }
    } catch (error) {
      return { success: false, skillId: '', error: String(error) }
    }
  }

  async registerSkillWithExecutor(
    skill: OperationalSkill,
    executor: SkillExecutor
  ): Promise<SkillRegisterResponse> {
    try {
      this.ensureInitialized()
      const skillId = this.registry.register(skill, executor)
      return { success: true, skillId }
    } catch (error) {
      return { success: false, skillId: '', error: String(error) }
    }
  }

  // --------------------------------------------------------------------------
  // 2. Search Skills
  // --------------------------------------------------------------------------

  async searchSkills(request: SkillSearchRequest): Promise<SkillSearchResponse> {
    try {
      this.ensureInitialized()
      const results = this.registry.search(request)
      return {
        success: true,
        totalResults: results.length,
        results,
      }
    } catch (error) {
      return { success: false, totalResults: 0, results: [], error: String(error) }
    }
  }

  // --------------------------------------------------------------------------
  // 3. Execute Skill
  // --------------------------------------------------------------------------

  async executeSkill(request: SkillExecuteRequest): Promise<SkillExecuteResponse> {
    try {
      this.ensureInitialized()
      const executor = this.registry.getExecutor(request.skillId)
      if (!executor) {
        return { success: false, error: `No executor found for skill ${request.skillId}` }
      }
      const result = await executor.execute(request.context)
      // Record performance metrics
      this.registry.recordExecution(
        request.skillId,
        result.success,
        result.executionTime,
        result.confidence,
        request.context.expertiseProfile,
        request.context.operationalDomain
      )
      return { success: true, result }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  // --------------------------------------------------------------------------
  // 4. Validate Skill
  // --------------------------------------------------------------------------

  async validateSkill(request: SkillValidateRequest): Promise<SkillValidateResponse> {
    try {
      this.ensureInitialized()
      const result = await this.validation.validateSkill(request.skillId, request.context)
      return { success: true, result }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  // --------------------------------------------------------------------------
  // 5. Version Management
  // --------------------------------------------------------------------------

  async getSkillVersions(request: SkillVersionRequest): Promise<SkillVersionResponse> {
    try {
      this.ensureInitialized()
      const skill = this.registry.getSkill(request.skillId)
      if (!skill) {
        return { success: false, skillId: request.skillId, currentVersion: '', versions: [], error: 'Skill not found' }
      }
      const versions = this.governance.getVersionHistory(request.skillId)
      return {
        success: true,
        skillId: request.skillId,
        currentVersion: skill.version,
        versions,
      }
    } catch (error) {
      return { success: false, skillId: request.skillId, currentVersion: '', versions: [], error: String(error) }
    }
  }

  // --------------------------------------------------------------------------
  // 6. History & Audit
  // --------------------------------------------------------------------------

  async getSkillHistory(request: SkillHistoryRequest): Promise<SkillHistoryResponse> {
    try {
      this.ensureInitialized()
      const history = this.registry.getChangeHistory(request.skillId, request.limit)
      const performanceMetrics = this.registry.getPerformanceMetrics(request.skillId)
      return {
        success: true,
        skillId: request.skillId,
        history,
        performanceMetrics,
      }
    } catch (error) {
      return { success: false, skillId: request.skillId, history: [], error: String(error) }
    }
  }

  // --------------------------------------------------------------------------
  // 7. Catalog
  // --------------------------------------------------------------------------

  async getCatalog(): Promise<SkillCatalogResponse> {
    try {
      this.ensureInitialized()
      const catalog = this.registry.getCatalog()
      return { success: true, catalog }
    } catch (error) {
      return { success: false, catalog: {} as SkillCatalogResponse['catalog'], error: String(error) }
    }
  }

  // --------------------------------------------------------------------------
  // 8. Orchestrate (Bonus)
  // --------------------------------------------------------------------------

  async orchestrateSkills(
    request: SkillDiscoveryRequest,
    context: SkillExecutionContext,
    options?: { maxSkills?: number; combinationStrategy?: SkillOrchestrationPlan['combinationStrategy'] }
  ): Promise<{ success: boolean; result?: SkillOrchestrationResult; error?: string }> {
    try {
      this.ensureInitialized()
      const result = await this.orchestration.orchestrate(request, context, options)
      return { success: true, result }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  // --------------------------------------------------------------------------
  // Discovery (Supporting)
  // --------------------------------------------------------------------------

  async discoverSkills(request: SkillDiscoveryRequest): Promise<{ success: boolean; result?: SkillDiscoveryResult; error?: string }> {
    try {
      this.ensureInitialized()
      const result = this.discovery.discover(request)
      return { success: true, result }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  // --------------------------------------------------------------------------
  // Governance (Supporting)
  // --------------------------------------------------------------------------

  async approveSkill(skillId: string, approvedBy: string, comments: string): Promise<{ success: boolean; message: string }> {
    try {
      this.ensureInitialized()
      return this.governance.grantApproval(skillId, approvedBy, comments)
    } catch (error) {
      return { success: false, message: String(error) }
    }
  }

  async deprecateSkill(skillId: string, changedBy: string, reason: string): Promise<{ success: boolean; message: string }> {
    try {
      this.ensureInitialized()
      const success = this.governance.deprecate(skillId, changedBy, reason)
      return { success, message: success ? 'Skill deprecated' : 'Deprecation failed' }
    } catch (error) {
      return { success: false, message: String(error) }
    }
  }

  async getComplianceReport(): Promise<{
    totalChecked: number
    compliant: number
    nonCompliant: number
    results: Array<{ skillId: string; skillName: string; compliant: boolean; issues: string[]; warnings: string[] }>
  }> {
    try {
      this.ensureInitialized()
      return this.governance.runAllComplianceChecks()
    } catch (error) {
      return { totalChecked: 0, compliant: 0, nonCompliant: 0, results: [] }
    }
  }

  // --------------------------------------------------------------------------
  // Statistics
  // --------------------------------------------------------------------------

  async getStats(): Promise<{
    success: boolean
    stats?: ReturnType<ReturnType<typeof getSkillRegistry>['getStats']>
    error?: string
  }> {
    try {
      this.ensureInitialized()
      const stats = this.registry.getStats()
      return { success: true, stats }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }
}

// ============================================================================
// Singleton
// ============================================================================

let apiInstance: SkillRegistryAPI | null = null

export function getSkillRegistryAPI(): SkillRegistryAPI {
  if (!apiInstance) {
    apiInstance = new SkillRegistryAPI()
  }
  return apiInstance
}

export function resetSkillRegistryAPI(): void {
  apiInstance = null
}

// ============================================================================
// Convenience Functions
// ============================================================================

export async function registerSkill(skill: OperationalSkill): Promise<SkillRegisterResponse> {
  return getSkillRegistryAPI().registerSkill({ skill })
}

export async function searchSkills(request: SkillSearchRequest): Promise<SkillSearchResponse> {
  return getSkillRegistryAPI().searchSkills(request)
}

export async function executeSkill(skillId: string, context: SkillExecutionContext): Promise<SkillExecuteResponse> {
  return getSkillRegistryAPI().executeSkill({ skillId, context })
}

export async function validateSkill(skillId: string, context: SkillExecutionContext): Promise<SkillValidateResponse> {
  return getSkillRegistryAPI().validateSkill({ skillId, context })
}

export async function getSkillVersions(skillId: string): Promise<SkillVersionResponse> {
  return getSkillRegistryAPI().getSkillVersions({ skillId })
}

export async function getSkillHistory(skillId: string, limit?: number): Promise<SkillHistoryResponse> {
  return getSkillRegistryAPI().getSkillHistory({ skillId, limit })
}

export async function getCatalog(): Promise<SkillCatalogResponse> {
  return getSkillRegistryAPI().getCatalog()
}

export async function orchestrateSkills(
  request: SkillDiscoveryRequest,
  context: SkillExecutionContext,
  options?: { maxSkills?: number; combinationStrategy?: SkillOrchestrationPlan['combinationStrategy'] }
) {
  return getSkillRegistryAPI().orchestrateSkills(request, context, options)
}
