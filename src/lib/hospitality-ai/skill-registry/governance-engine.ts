/**
 * Operational Skill Registry — Governance Engine.
 *
 * Manages skill lifecycle, versioning, approvals, and audit trails.
 * Ensures that only validated, approved skills reach production.
 *
 * Governance never bypasses the certified architecture.
 * It enforces process integrity — it does not generate facts.
 */

import type {
  OperationalSkill,
  SkillLifecycleStatus,
  SkillChangeRecord,
  SkillPerformanceMetrics,
  SkillValidationResult,
} from './types'
import { nowIso, semanticVersionCompare } from './utils'
import { OperationalSkillRegistry } from './registry'

// ============================================================================
// Governance Engine
// ============================================================================

export class SkillGovernanceEngine {
  constructor(private registry: OperationalSkillRegistry) {}

  // --------------------------------------------------------------------------
  // Lifecycle Management
  // --------------------------------------------------------------------------

  private validTransitions: Record<SkillLifecycleStatus, SkillLifecycleStatus[]> = {
    draft: ['experimental', 'retired'],
    experimental: ['validated', 'deprecated', 'retired'],
    validated: ['production', 'deprecated', 'retired'],
    production: ['deprecated', 'retired'],
    deprecated: ['retired', 'production'],
    retired: [],
  }

  canTransition(from: SkillLifecycleStatus, to: SkillLifecycleStatus): boolean {
    return this.validTransitions[from]?.includes(to) || false
  }

  promoteToExperimental(skillId: string, changedBy: string, reason: string): boolean {
    const skill = this.registry.getSkill(skillId)
    if (!skill) return false
    if (skill.status !== 'draft') return false
    return this.registry.transitionStatus(skillId, 'experimental', changedBy, reason)
  }

  promoteToValidated(skillId: string, changedBy: string, validation: SkillValidationResult, reason: string): boolean {
    const skill = this.registry.getSkill(skillId)
    if (!skill) return false
    if (skill.status !== 'experimental') return false
    if (!validation.valid) return false
    if (validation.passRate < skill.validationRules.minimumTestPassRate) return false
    return this.registry.transitionStatus(skillId, 'validated', changedBy, reason)
  }

  promoteToProduction(skillId: string, approvedBy: string, reason: string): boolean {
    const skill = this.registry.getSkill(skillId)
    if (!skill) return false
    if (skill.status !== 'validated') return false
    return this.registry.transitionStatus(skillId, 'production', approvedBy, reason)
  }

  deprecate(skillId: string, changedBy: string, reason: string): boolean {
    return this.registry.transitionStatus(skillId, 'deprecated', changedBy, reason)
  }

  retire(skillId: string, changedBy: string, reason: string): boolean {
    return this.registry.transitionStatus(skillId, 'retired', changedBy, reason)
  }

  reactivate(skillId: string, changedBy: string, reason: string): boolean {
    const skill = this.registry.getSkill(skillId)
    if (!skill) return false
    if (skill.status !== 'deprecated') return false
    return this.registry.transitionStatus(skillId, 'production', changedBy, reason)
  }

  // --------------------------------------------------------------------------
  // Versioning
  // --------------------------------------------------------------------------

  createNewVersion(
    skillId: string,
    newVersion: string,
    changes: Partial<OperationalSkill>,
    changedBy: string,
    reason: string
  ): string | null {
    const skill = this.registry.getSkill(skillId)
    if (!skill) return null

    // Validate semantic version increment
    if (semanticVersionCompare(newVersion, skill.version) <= 0) {
      return null
    }

    const newSkill: OperationalSkill = {
      ...skill,
      ...changes,
      id: skill.id, // Keep same ID
      version: newVersion,
      status: 'experimental', // New versions start as experimental
      changeHistory: [
        ...skill.changeHistory,
        {
          timestamp: nowIso(),
          changeType: 'version_changed',
          description: reason,
          changedBy,
          previousVersion: skill.version,
          newVersion,
        },
      ],
      updatedAt: nowIso(),
    }

    // Re-register with new version
    return this.registry.register(newSkill)
  }

  getVersionHistory(skillId: string): Array<{
    version: string
    status: SkillLifecycleStatus
    createdAt: string
    changeDescription: string
  }> {
    const skill = this.registry.getSkill(skillId)
    if (!skill) return []

    const history: Array<{
      version: string
      status: SkillLifecycleStatus
      createdAt: string
      changeDescription: string
    }> = []

    // Reconstruct version history from change records
    const versionChanges = skill.changeHistory.filter((c) => c.changeType === 'version_changed' || c.changeType === 'created')
    for (const change of versionChanges) {
      history.push({
        version: change.newVersion || skill.version,
        status: change.newStatus || skill.status,
        createdAt: change.timestamp,
        changeDescription: change.description,
      })
    }

    // Add current version if not already present
    if (!history.some((h) => h.version === skill.version)) {
      history.push({
        version: skill.version,
        status: skill.status,
        createdAt: skill.updatedAt,
        changeDescription: 'Current version',
      })
    }

    return history
  }

  // --------------------------------------------------------------------------
  // Audit Trail
  // --------------------------------------------------------------------------

  getAuditTrail(skillId: string, limit: number = 100): SkillChangeRecord[] {
    return this.registry.getChangeHistory(skillId, limit)
  }

  getFullAuditTrail(limit: number = 500): Array<{ skillId: string; skillName: string } & SkillChangeRecord> {
    const allSkills = this.registry.getAllSkills()
    const trail: Array<{ skillId: string; skillName: string } & SkillChangeRecord> = []

    for (const skill of allSkills) {
      for (const change of skill.changeHistory) {
        trail.push({ skillId: skill.id, skillName: skill.name, ...change })
      }
    }

    return trail
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)
  }

  // --------------------------------------------------------------------------
  // Approval Workflow
  // --------------------------------------------------------------------------

  requestApproval(skillId: string, requestedBy: string, justification: string): {
    success: boolean
    message: string
  } {
    const skill = this.registry.getSkill(skillId)
    if (!skill) {
      return { success: false, message: 'Skill not found' }
    }

    if (skill.status !== 'validated') {
      return { success: false, message: `Skill must be in 'validated' status to request production approval. Current: ${skill.status}` }
    }

    // Record the approval request
    const changeRecord: SkillChangeRecord = {
      timestamp: nowIso(),
      changeType: 'approved',
      description: `Approval requested by ${requestedBy}: ${justification}`,
      changedBy: requestedBy,
    }

    // Update skill with approval request
    this.registry.register({
      ...skill,
      changeHistory: [...skill.changeHistory, changeRecord],
      updatedAt: nowIso(),
    })

    return { success: true, message: 'Approval request recorded' }
  }

  grantApproval(skillId: string, approvedBy: string, comments: string): {
    success: boolean
    message: string
  } {
    const skill = this.registry.getSkill(skillId)
    if (!skill) {
      return { success: false, message: 'Skill not found' }
    }

    if (skill.status !== 'validated') {
      return { success: false, message: `Skill must be in 'validated' status. Current: ${skill.status}` }
    }

    const success = this.promoteToProduction(skillId, approvedBy, `Approved by ${approvedBy}: ${comments}`)
    return {
      success,
      message: success ? 'Skill approved for production' : 'Approval failed',
    }
  }

  // --------------------------------------------------------------------------
  // Compliance Checks
  // --------------------------------------------------------------------------

  runComplianceCheck(skillId: string): {
    compliant: boolean
    issues: string[]
    warnings: string[]
  } {
    const skill = this.registry.getSkill(skillId)
    if (!skill) {
      return { compliant: false, issues: ['Skill not found'], warnings: [] }
    }

    const issues: string[] = []
    const warnings: string[] = []

    // Check required fields
    if (!skill.name) issues.push('Missing name')
    if (!skill.description) issues.push('Missing description')
    if (!skill.owner) issues.push('Missing owner')
    if (skill.supportedDomains.length === 0) issues.push('No supported domains')
    if (skill.supportedExpertiseProfiles.length === 0) issues.push('No supported expertise profiles')
    if (skill.supportedIntents.length === 0) issues.push('No supported intents')

    // Check production readiness
    if (skill.status === 'production') {
      if (!skill.approvedAt) issues.push('Production skill missing approval timestamp')
      if (!skill.approvedBy) issues.push('Production skill missing approver')
      if (skill.validationRules.minimumTestPassRate < 0.8) {
        warnings.push('Minimum test pass rate below recommended 80%')
      }
    }

    // Check version
    if (!skill.version.match(/^\d+\.\d+\.\d+$/)) {
      issues.push(`Invalid version format: ${skill.version}. Expected semantic version (e.g., 1.0.0)`)
    }

    // Check change history
    if (skill.changeHistory.length === 0) {
      warnings.push('No change history records')
    }

    return {
      compliant: issues.length === 0,
      issues,
      warnings,
    }
  }

  runAllComplianceChecks(): {
    totalChecked: number
    compliant: number
    nonCompliant: number
    results: Array<{ skillId: string; skillName: string; compliant: boolean; issues: string[]; warnings: string[] }>
  } {
    const allSkills = this.registry.getAllSkills()
    const results = allSkills.map((skill) => {
      const check = this.runComplianceCheck(skill.id)
      return {
        skillId: skill.id,
        skillName: skill.name,
        ...check,
      }
    })

    return {
      totalChecked: results.length,
      compliant: results.filter((r) => r.compliant).length,
      nonCompliant: results.filter((r) => !r.compliant).length,
      results,
    }
  }

  // --------------------------------------------------------------------------
  // Health Monitoring
  // --------------------------------------------------------------------------

  getSkillHealth(skillId: string): {
    status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown'
    metrics?: SkillPerformanceMetrics
    issues: string[]
  } {
    const metrics = this.registry.getPerformanceMetrics(skillId)
    if (!metrics || metrics.totalExecutions === 0) {
      return { status: 'unknown', issues: ['No execution data available'] }
    }

    const issues: string[] = []
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'

    if (metrics.failureRate > 0.3) {
      status = 'unhealthy'
      issues.push(`High failure rate: ${(metrics.failureRate * 100).toFixed(1)}%`)
    } else if (metrics.failureRate > 0.1) {
      status = 'degraded'
      issues.push(`Elevated failure rate: ${(metrics.failureRate * 100).toFixed(1)}%`)
    }

    if (metrics.averageExecutionTime > 5000) {
      if (status === 'healthy') status = 'degraded'
      issues.push(`Slow execution: ${metrics.averageExecutionTime.toFixed(0)}ms average`)
    }

    if (metrics.averageConfidence < 0.4) {
      if (status === 'healthy') status = 'degraded'
      issues.push(`Low average confidence: ${(metrics.averageConfidence * 100).toFixed(1)}%`)
    }

    return { status, metrics, issues }
  }

  getAllSkillHealth(): Array<{ skillId: string; skillName: string; status: string; issues: string[] }> {
    return this.registry.getAllSkills().map((skill) => {
      const health = this.getSkillHealth(skill.id)
      return {
        skillId: skill.id,
        skillName: skill.name,
        status: health.status,
        issues: health.issues,
      }
    })
  }
}

// ============================================================================
// Singleton
// ============================================================================

let governanceEngineInstance: SkillGovernanceEngine | null = null

export function getSkillGovernanceEngine(registry?: OperationalSkillRegistry): SkillGovernanceEngine {
  if (!governanceEngineInstance) {
    const reg = registry || require('./registry').getSkillRegistry()
    governanceEngineInstance = new SkillGovernanceEngine(reg)
  }
  return governanceEngineInstance
}

export function resetSkillGovernanceEngine(): void {
  governanceEngineInstance = null
}
