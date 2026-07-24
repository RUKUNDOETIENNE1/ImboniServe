/**
 * Operational Skill Registry — core registry.
 *
 * Manages skill registration, lookup, catalog, and health tracking.
 * The registry is the central store for all operational skills.
 *
 * Architectural constraints:
 * - Only validated/production skills participate in recommendations
 * - Skills are versioned and auditable
 * - The registry never bypasses Knowledge/Memory/Events
 */

import type {
  OperationalSkill,
  SkillCatalog,
  SkillCatalogEntry,
  SkillCategory,
  SkillLifecycleStatus,
  SkillPerformanceMetrics,
  SkillChangeRecord,
  ExpertiseProfile,
  OperationalDomain,
  IntentType,
} from './types'
import { hashId, nowIso, isProductionEligible, uniqueStrings } from './utils'

// ============================================================================
// Skill Registry
// ============================================================================

export class OperationalSkillRegistry {
  private skills = new Map<string, OperationalSkill>()
  private executors = new Map<string, import('./types').SkillExecutor>()
  private performanceMetrics = new Map<string, SkillPerformanceMetrics>()
  private registrationTimes = new Map<string, string>()

  // --------------------------------------------------------------------------
  // Registration
  // --------------------------------------------------------------------------

  register(skill: OperationalSkill, executor?: import('./types').SkillExecutor): string {
    const id = skill.id || hashId('skill', `${skill.category}|${skill.name}|${skill.version}`)
    const existing = this.skills.get(id)

    if (existing && existing.version === skill.version) {
      // Update existing skill at same version
      this.skills.set(id, { ...skill, id, updatedAt: nowIso() })
    } else if (existing) {
      // New version of existing skill — record change
      const changeRecord: SkillChangeRecord = {
        timestamp: nowIso(),
        changeType: 'version_changed',
        description: `Version updated from ${existing.version} to ${skill.version}`,
        changedBy: 'system',
        previousVersion: existing.version,
        newVersion: skill.version,
      }
      this.skills.set(id, {
        ...skill,
        id,
        changeHistory: [...(existing.changeHistory || []), changeRecord],
        createdAt: existing.createdAt,
        updatedAt: nowIso(),
      })
    } else {
      // New skill registration
      const changeRecord: SkillChangeRecord = {
        timestamp: nowIso(),
        changeType: 'created',
        description: `Skill registered: ${skill.name} v${skill.version}`,
        changedBy: 'system',
      }
      this.skills.set(id, {
        ...skill,
        id,
        createdAt: nowIso(),
        updatedAt: nowIso(),
        changeHistory: [changeRecord],
      })
      this.registrationTimes.set(id, nowIso())
    }

    if (executor) {
      this.executors.set(id, executor)
    }

    if (!this.performanceMetrics.has(id)) {
      this.performanceMetrics.set(id, {
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        averageExecutionTime: 0,
        averageConfidence: 0,
        failureRate: 0,
        usageByProfile: {},
        usageByDomain: {},
      })
    }

    return id
  }

  unregister(skillId: string): boolean {
    const existed = this.skills.delete(skillId)
    this.executors.delete(skillId)
    this.performanceMetrics.delete(skillId)
    this.registrationTimes.delete(skillId)
    return existed
  }

  // --------------------------------------------------------------------------
  // Lookup
  // --------------------------------------------------------------------------

  getSkill(skillId: string): OperationalSkill | undefined {
    return this.skills.get(skillId)
  }

  getExecutor(skillId: string): import('./types').SkillExecutor | undefined {
    return this.executors.get(skillId)
  }

  getAllSkills(): OperationalSkill[] {
    return Array.from(this.skills.values())
  }

  getProductionSkills(): OperationalSkill[] {
    return this.getAllSkills().filter((s) => isProductionEligible(s.status))
  }

  getSkillsByCategory(category: SkillCategory): OperationalSkill[] {
    return this.getAllSkills().filter((s) => s.category === category)
  }

  getSkillsByStatus(status: SkillLifecycleStatus): OperationalSkill[] {
    return this.getAllSkills().filter((s) => s.status === status)
  }

  getSkillsByDomain(domain: OperationalDomain): OperationalSkill[] {
    return this.getAllSkills().filter((s) => s.supportedDomains.includes(domain))
  }

  getSkillsByProfile(profile: ExpertiseProfile): OperationalSkill[] {
    return this.getAllSkills().filter((s) => s.supportedExpertiseProfiles.includes(profile))
  }

  getSkillsByIntent(intent: IntentType): OperationalSkill[] {
    return this.getAllSkills().filter((s) => s.supportedIntents.includes(intent))
  }

  // --------------------------------------------------------------------------
  // Lifecycle Management
  // --------------------------------------------------------------------------

  transitionStatus(
    skillId: string,
    newStatus: SkillLifecycleStatus,
    changedBy: string,
    reason: string
  ): boolean {
    const skill = this.skills.get(skillId)
    if (!skill) return false

    const validTransitions: Record<SkillLifecycleStatus, SkillLifecycleStatus[]> = {
      draft: ['experimental', 'retired'],
      experimental: ['validated', 'deprecated', 'retired'],
      validated: ['production', 'deprecated', 'retired'],
      production: ['deprecated', 'retired'],
      deprecated: ['retired', 'production'],
      retired: [],
    }

    if (!validTransitions[skill.status]?.includes(newStatus)) {
      return false
    }

    const changeRecord: SkillChangeRecord = {
      timestamp: nowIso(),
      changeType: 'status_changed',
      description: reason,
      changedBy,
      previousStatus: skill.status,
      newStatus,
    }

    this.skills.set(skillId, {
      ...skill,
      status: newStatus,
      updatedAt: nowIso(),
      changeHistory: [...skill.changeHistory, changeRecord],
      approvedAt: newStatus === 'production' || newStatus === 'validated' ? nowIso() : skill.approvedAt,
      approvedBy: newStatus === 'production' || newStatus === 'validated' ? changedBy : skill.approvedBy,
    })

    return true
  }

  approve(skillId: string, approvedBy: string): boolean {
    const skill = this.skills.get(skillId)
    if (!skill) return false
    if (skill.status !== 'validated' && skill.status !== 'experimental') return false

    const newStatus: SkillLifecycleStatus = skill.status === 'experimental' ? 'validated' : 'production'
    return this.transitionStatus(skillId, newStatus, approvedBy, `Approved by ${approvedBy}`)
  }

  deprecate(skillId: string, changedBy: string, reason: string): boolean {
    return this.transitionStatus(skillId, 'deprecated', changedBy, reason)
  }

  retire(skillId: string, changedBy: string, reason: string): boolean {
    return this.transitionStatus(skillId, 'retired', changedBy, reason)
  }

  // --------------------------------------------------------------------------
  // Performance Tracking
  // --------------------------------------------------------------------------

  recordExecution(
    skillId: string,
    success: boolean,
    executionTime: number,
    confidence: number,
    profile?: ExpertiseProfile,
    domain?: OperationalDomain
  ): void {
    const metrics = this.performanceMetrics.get(skillId)
    if (!metrics) return

    metrics.totalExecutions++
    if (success) {
      metrics.successfulExecutions++
    } else {
      metrics.failedExecutions++
    }
    metrics.failureRate = metrics.failedExecutions / metrics.totalExecutions
    metrics.averageExecutionTime =
      (metrics.averageExecutionTime * (metrics.totalExecutions - 1) + executionTime) / metrics.totalExecutions
    metrics.averageConfidence =
      (metrics.averageConfidence * (metrics.totalExecutions - 1) + confidence) / metrics.totalExecutions
    metrics.lastExecutedAt = nowIso()

    if (profile) {
      metrics.usageByProfile[profile] = (metrics.usageByProfile[profile] || 0) + 1
    }
    if (domain) {
      metrics.usageByDomain[domain] = (metrics.usageByDomain[domain] || 0) + 1
    }
  }

  getPerformanceMetrics(skillId: string): SkillPerformanceMetrics | undefined {
    return this.performanceMetrics.get(skillId)
  }

  // --------------------------------------------------------------------------
  // Catalog
  // --------------------------------------------------------------------------

  getCatalog(): SkillCatalog {
    const allSkills = this.getAllSkills()
    const skillsByCategory: Record<string, number> = {}
    const skillsByStatus: Record<string, number> = {}
    const skillsByDomain: Record<string, number> = {}

    const entries: SkillCatalogEntry[] = []

    for (const skill of allSkills) {
      skillsByCategory[skill.category] = (skillsByCategory[skill.category] || 0) + 1
      skillsByStatus[skill.status] = (skillsByStatus[skill.status] || 0) + 1
      for (const domain of skill.supportedDomains) {
        skillsByDomain[domain] = (skillsByDomain[domain] || 0) + 1
      }

      const metrics = this.performanceMetrics.get(skill.id)
      const healthStatus = this.computeHealthStatus(metrics)

      entries.push({
        skill,
        registeredAt: this.registrationTimes.get(skill.id) || skill.createdAt,
        executionCount: metrics?.totalExecutions || 0,
        averageConfidence: metrics?.averageConfidence || 0,
        healthStatus,
      })
    }

    return {
      totalSkills: allSkills.length,
      skillsByCategory,
      skillsByStatus,
      skillsByDomain,
      entries,
    }
  }

  private computeHealthStatus(metrics?: SkillPerformanceMetrics): 'healthy' | 'degraded' | 'unhealthy' | 'unknown' {
    if (!metrics || metrics.totalExecutions === 0) return 'unknown'
    if (metrics.failureRate > 0.3) return 'unhealthy'
    if (metrics.failureRate > 0.1) return 'degraded'
    return 'healthy'
  }

  // --------------------------------------------------------------------------
  // Change History
  // --------------------------------------------------------------------------

  getChangeHistory(skillId: string, limit: number = 50): SkillChangeRecord[] {
    const skill = this.skills.get(skillId)
    if (!skill) return []
    return skill.changeHistory.slice(-limit).reverse()
  }

  // --------------------------------------------------------------------------
  // Search
  // --------------------------------------------------------------------------

  search(query: {
    text?: string
    category?: SkillCategory
    status?: SkillLifecycleStatus
    domain?: OperationalDomain
    expertiseProfile?: ExpertiseProfile
    intent?: IntentType
    limit?: number
  }): Array<{ skill: OperationalSkill; relevanceScore: number; matchedFields: string[] }> {
    let candidates = this.getAllSkills()

    if (query.category) {
      candidates = candidates.filter((s) => s.category === query.category)
    }
    if (query.status) {
      candidates = candidates.filter((s) => s.status === query.status)
    }
    if (query.domain) {
      candidates = candidates.filter((s) => s.supportedDomains.includes(query.domain!))
    }
    if (query.expertiseProfile) {
      candidates = candidates.filter((s) => s.supportedExpertiseProfiles.includes(query.expertiseProfile!))
    }
    if (query.intent) {
      candidates = candidates.filter((s) => s.supportedIntents.includes(query.intent!))
    }

    if (!query.text) {
      return candidates.map((skill) => ({ skill, relevanceScore: 1, matchedFields: [] }))
    }

    const queryLower = query.text.toLowerCase()
    const results: Array<{ skill: OperationalSkill; relevanceScore: number; matchedFields: string[] }> = []

    for (const skill of candidates) {
      const matchedFields: string[] = []
      let score = 0

      if (skill.name.toLowerCase().includes(queryLower)) {
        matchedFields.push('name')
        score += 0.4
      }
      if (skill.description.toLowerCase().includes(queryLower)) {
        matchedFields.push('description')
        score += 0.3
      }
      if (skill.tags.some((t) => t.toLowerCase().includes(queryLower))) {
        matchedFields.push('tags')
        score += 0.2
      }
      if (skill.category.toLowerCase().includes(queryLower)) {
        matchedFields.push('category')
        score += 0.1
      }

      if (score > 0) {
        results.push({ skill, relevanceScore: score, matchedFields })
      }
    }

    return results
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, query.limit || 25)
  }

  // --------------------------------------------------------------------------
  // Statistics
  // --------------------------------------------------------------------------

  getStats() {
    const all = this.getAllSkills()
    const production = all.filter((s) => isProductionEligible(s.status))
    return {
      total: all.length,
      production: production.length,
      byCategory: this.groupCount(all, (s) => s.category),
      byStatus: this.groupCount(all, (s) => s.status),
      byDomain: this.groupCount(all, (s) => s.supportedDomains),
      byProfile: this.groupCount(all, (s) => s.supportedExpertiseProfiles),
    }
  }

  private groupCount<T>(items: T[], selector: (item: T) => string | string[]): Record<string, number> {
    const counts: Record<string, number> = {}
    for (const item of items) {
      const value = selector(item)
      if (Array.isArray(value)) {
        for (const v of value) {
          counts[v] = (counts[v] || 0) + 1
        }
      } else {
        counts[value] = (counts[value] || 0) + 1
      }
    }
    return counts
  }
}

// ============================================================================
// Singleton Registry
// ============================================================================

let registryInstance: OperationalSkillRegistry | null = null

export function getSkillRegistry(): OperationalSkillRegistry {
  if (!registryInstance) {
    registryInstance = new OperationalSkillRegistry()
  }
  return registryInstance
}

export function resetSkillRegistry(): void {
  registryInstance = null
}
