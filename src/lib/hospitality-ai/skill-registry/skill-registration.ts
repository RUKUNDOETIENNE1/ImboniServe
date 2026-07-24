/**
 * Operational Skill Registry — Skill Registration.
 *
 * Registers all 50+ operational skills with the central registry.
 * This module is the single source of truth for skill registration.
 */

import { getSkillRegistry, OperationalSkillRegistry } from './registry'
import type { OperationalSkill, SkillExecutor } from './types'

// Import all skill categories
import { operationalAnalysisSkills } from './skills/operational-analysis'
import { financialAnalysisSkills } from './skills/financial-analysis'
import { customerIntelligenceSkills } from './skills/customer-intelligence'
import { staffIntelligenceSkills } from './skills/staff-intelligence'
import { inventoryIntelligenceSkills } from './skills/inventory-intelligence'
import { kitchenIntelligenceSkills } from './skills/kitchen-intelligence'
import { executiveIntelligenceSkills } from './skills/executive-intelligence'
import { continuousImprovementSkills } from './skills/continuous-improvement'

// ============================================================================
// All Skills
// ============================================================================

export const allSkills: Array<{ definition: OperationalSkill; executor: SkillExecutor }> = [
  ...operationalAnalysisSkills,
  ...financialAnalysisSkills,
  ...customerIntelligenceSkills,
  ...staffIntelligenceSkills,
  ...inventoryIntelligenceSkills,
  ...kitchenIntelligenceSkills,
  ...executiveIntelligenceSkills,
  ...continuousImprovementSkills,
]

// ============================================================================
// Registration
// ============================================================================

let isInitialized = false

export function initializeSkillRegistry(registry?: OperationalSkillRegistry): {
  totalRegistered: number
  byCategory: Record<string, number>
  errors: string[]
} {
  const reg = registry || getSkillRegistry()
  const errors: string[] = []
  let totalRegistered = 0

  for (const { definition, executor } of allSkills) {
    try {
      reg.register(definition, executor)
      totalRegistered++
    } catch (error) {
      errors.push(`Failed to register ${definition.name}: ${String(error)}`)
    }
  }

  // Compute category breakdown
  const byCategory: Record<string, number> = {}
  for (const { definition } of allSkills) {
    byCategory[definition.category] = (byCategory[definition.category] || 0) + 1
  }

  isInitialized = true

  return { totalRegistered, byCategory, errors }
}

export function isSkillRegistryInitialized(): boolean {
  return isInitialized
}

export function getRegisteredSkillCount(): number {
  return getSkillRegistry().getAllSkills().length
}

// ============================================================================
// Category Accessors
// ============================================================================

export function getSkillsByCategoryName(category: string): OperationalSkill[] {
  return getSkillRegistry().getSkillsByCategory(category as OperationalSkill['category'])
}

export function listAllSkillCategories(): Array<{ category: string; count: number; skills: string[] }> {
  const reg = getSkillRegistry()
  const categories: Array<{ category: string; count: number; skills: string[] }> = []
  const seenCategories = new Set<string>()

  for (const { definition } of allSkills) {
    if (!seenCategories.has(definition.category)) {
      seenCategories.add(definition.category)
      const skills = reg.getSkillsByCategory(definition.category)
      categories.push({
        category: definition.category,
        count: skills.length,
        skills: skills.map((s) => s.name),
      })
    }
  }

  return categories
}
