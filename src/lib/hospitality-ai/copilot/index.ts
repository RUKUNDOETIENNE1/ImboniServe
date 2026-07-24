/**
 * Hospitality AI Copilot™ — Public API.
 *
 * Single entry point for the Hospitality AI Copilot module.
 *
 * Architecture:
 *   Heart Pulse™ → Hospitality Memory™ → Hospitality Knowledge™ →
 *   Hospitality AI Copilot™ → Hospitality Operating System™
 *
 *   User Question → Intent Classification → Operational Domain →
 *   Operational Expertise → Skill Registry → Context → Knowledge Retrieval →
 *   Evidence Evaluation → Reasoning → Recommendation → Explainability →
 *   Governance → Final Response
 */

// Types
export * from './types'

// Utils
export * from './utils'

// Engines
export {
  IntentClassificationEngine,
  getIntentClassificationEngine,
  resetIntentClassificationEngine,
  generateRequestId,
} from './intent-classification-engine'

export {
  OperationalDomainEngine,
  getOperationalDomainEngine,
  resetOperationalDomainEngine,
} from './operational-domain-engine'

export {
  OperationalExpertiseEngine,
  getOperationalExpertiseEngine,
  resetOperationalExpertiseEngine,
} from './operational-expertise-engine'

export {
  SkillRegistryIntegration,
  getSkillRegistryIntegration,
  resetSkillRegistryIntegration,
} from './skill-registry-integration'

export {
  ContextEngine,
  getContextEngine,
  resetContextEngine,
} from './context-engine'

export {
  KnowledgeRetrievalEngine,
  getKnowledgeRetrievalEngine,
  resetKnowledgeRetrievalEngine,
} from './knowledge-retrieval-engine'

export {
  EvidenceEvaluationEngine,
  getEvidenceEvaluationEngine,
  resetEvidenceEvaluationEngine,
} from './evidence-evaluation-engine'

export {
  ReasoningEngine,
  getReasoningEngine,
  resetReasoningEngine,
} from './reasoning-engine'

export {
  RecommendationEngine,
  getRecommendationEngine,
  resetRecommendationEngine,
} from './recommendation-engine'

export {
  ExplainabilityEngine,
  getExplainabilityEngine,
  resetExplainabilityEngine,
} from './explainability-engine'

export {
  GovernanceEngine,
  getGovernanceEngine,
  resetGovernanceEngine,
} from './governance-engine'

// Main orchestrator
export {
  HospitalityAICopilot,
  getCopilot,
  resetCopilot,
  DEFAULT_COPILOT_CONFIG,
  type CopilotConfig,
} from './copilot'

// API
export {
  CopilotAPI,
  getCopilotAPI,
  resetCopilotAPI,
  queryCopilot,
  assistCopilot,
  multiStepCopilot,
  getExplainability,
  getHistory,
  getReasoningTrace,
  getConfidence,
} from './api'
