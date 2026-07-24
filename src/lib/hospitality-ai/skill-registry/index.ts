/**
 * Operational Skill Registry — Public API.
 *
 * Single entry point for the Skill Registry module.
 *
 * Architecture:
 *   Heart Pulse™ → Hospitality Memory™ → Hospitality Knowledge™ →
 *   Hospitality AI Copilot™ → [Intent] → [Domain] → [Expertise] →
 *   [Skill Registry] → [Reasoning] → [Recommendation] → [Explainability]
 */

// Types
export * from './types'

// Utils
export * from './utils'

// Core Registry
export { OperationalSkillRegistry, getSkillRegistry, resetSkillRegistry } from './registry'

// Skill Executor Base
export * from './skill-executor-base'

// Discovery Engine
export { SkillDiscoveryEngine, getSkillDiscoveryEngine, resetSkillDiscoveryEngine } from './discovery-engine'

// Orchestration Engine
export { SkillOrchestrationEngine, getSkillOrchestrationEngine, resetSkillOrchestrationEngine } from './orchestration-engine'

// Governance Engine
export { SkillGovernanceEngine, getSkillGovernanceEngine, resetSkillGovernanceEngine } from './governance-engine'

// Validation Framework
export { SkillValidationFramework, getSkillValidationFramework, resetSkillValidationFramework, createTestContext } from './validation-framework'

// Skill Registration
export {
  initializeSkillRegistry,
  isSkillRegistryInitialized,
  getRegisteredSkillCount,
  getSkillsByCategoryName,
  listAllSkillCategories,
  allSkills,
} from './skill-registration'

// API
export {
  SkillRegistryAPI,
  getSkillRegistryAPI,
  resetSkillRegistryAPI,
  registerSkill,
  searchSkills,
  executeSkill,
  validateSkill,
  getSkillVersions,
  getSkillHistory,
  getCatalog,
  orchestrateSkills,
} from './api'

// Skill Categories
export { operationalAnalysisSkills } from './skills/operational-analysis'
export { financialAnalysisSkills } from './skills/financial-analysis'
export { customerIntelligenceSkills } from './skills/customer-intelligence'
export { staffIntelligenceSkills } from './skills/staff-intelligence'
export { inventoryIntelligenceSkills } from './skills/inventory-intelligence'
export { kitchenIntelligenceSkills } from './skills/kitchen-intelligence'
export { executiveIntelligenceSkills } from './skills/executive-intelligence'
export { continuousImprovementSkills } from './skills/continuous-improvement'
