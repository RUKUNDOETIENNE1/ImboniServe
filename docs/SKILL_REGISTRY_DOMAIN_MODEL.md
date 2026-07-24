# Operational Skill Registry — Domain Model

**Platform:** Hospitality Intelligence Platform v2.3.0  
**Module:** Operational Skill Registry v1.0  

---

## 1. Overview

The domain model defines all TypeScript types used by the Operational Skill Registry. It is the single source of truth for the skill data structures, execution contexts, results, governance records, and API contracts.

---

## 2. Core Entities

| Entity | Purpose |
|--------|---------|
| `OperationalSkill` | The skill definition — identity, lifecycle, applicability, quality rules |
| `SkillExecutionContext` | Input to skill execution — evidence from Knowledge/Memory/Events |
| `SkillExecutionResult` | Output of skill execution — findings, metrics, confidence, explainability |
| `SkillFinding` | A single observation/risk/opportunity identified by a skill |
| `SkillMetric` | A quantitative measurement produced by a skill |
| `SkillEvidence` | References to Knowledge, Memory, and Event IDs used as evidence |
| `SkillExplainability` | Reasoning trace — strategy, knowledge consulted, narrative, alternatives |

---

## 3. Skill Identity Types

### SkillCategory (8 values)
```typescript
type SkillCategory =
  | 'operational_analysis' | 'financial_analysis'
  | 'customer_intelligence' | 'staff_intelligence'
  | 'inventory_intelligence' | 'kitchen_intelligence'
  | 'executive_intelligence' | 'continuous_improvement'
```

### SkillLifecycleStatus (6 values)
```typescript
type SkillLifecycleStatus =
  | 'draft' | 'experimental' | 'validated'
  | 'production' | 'deprecated' | 'retired'
```

### OperationalDomain (13 values)
```typescript
type OperationalDomain =
  | 'kitchen' | 'service' | 'reservations' | 'inventory'
  | 'finance' | 'revenue' | 'customers' | 'staff'
  | 'management' | 'marketing' | 'suppliers' | 'operations'
  | 'cross_domain'
```

### ExpertiseProfile (8 values)
```typescript
type ExpertiseProfile =
  | 'executive_advisor' | 'kitchen_advisor' | 'service_advisor'
  | 'inventory_advisor' | 'revenue_advisor' | 'staff_performance_advisor'
  | 'customer_experience_advisor' | 'operational_excellence_advisor'
```

### IntentType (16 values)
```typescript
type IntentType =
  | 'information_request' | 'explanation' | 'root_cause_analysis'
  | 'recommendation_request' | 'prediction_request' | 'risk_assessment'
  | 'planning' | 'optimization' | 'comparison' | 'status_check'
  | 'trend_analysis' | 'decision_support' | 'problem_diagnosis'
  | 'operational_review' | 'learning_training' | 'unknown_intent'
```

### ReasoningStrategy (10 values)
```typescript
type ReasoningStrategy =
  | 'cause_and_effect' | 'constraint_optimization' | 'temporal_reasoning'
  | 'risk_evaluation' | 'multi_factor_reasoning' | 'comparative_reasoning'
  | 'scenario_reasoning' | 'evidence_based_recommendation'
  | 'diagnostic_reasoning' | 'summary_synthesis'
```

---

## 4. Skill Definition Structure

```typescript
interface OperationalSkill {
  // Identity
  id: string
  name: string
  description: string
  category: SkillCategory
  version: string  // Semantic (e.g., "1.0.0")

  // Lifecycle
  status: SkillLifecycleStatus

  // Ownership
  owner: string
  tags: string[]

  // Applicability
  supportedDomains: OperationalDomain[]
  supportedExpertiseProfiles: ExpertiseProfile[]
  supportedIntents: IntentType[]
  supportedReasoningStrategies: ReasoningStrategy[]

  // Evidence Requirements
  requiredKnowledgeCategories: string[]
  requiredMemoryTypes: string[]
  requiredEventTypes: string[]
  requiredContext: SkillContextRequirement

  // Interface
  inputs: SkillInput[]
  outputs: SkillOutput[]

  // Quality
  confidenceRules: SkillConfidenceRules
  explainabilityRules: SkillExplainabilityRules
  validationRules: SkillValidationRules

  // Metadata
  estimatedCost: SkillCostEstimate
  dependencies: string[]

  // Audit
  createdAt: string
  updatedAt: string
  approvedAt?: string
  approvedBy?: string
  changeHistory: SkillChangeRecord[]
  performanceMetrics?: SkillPerformanceMetrics
}
```

---

## 5. Skill Execution Model

### SkillExecutionContext (Input)
```typescript
interface SkillExecutionContext {
  businessId: string
  businessName: string
  timeRange?: { start: string; end: string }
  outletId?: string
  expertiseProfile: ExpertiseProfile
  intent: IntentType
  operationalDomain: OperationalDomain
  reasoningStrategy: ReasoningStrategy
  knowledge: KnowledgeEntity[]      // From Hospitality Knowledge
  memories: HospitalityMemoryEntity[] // From Hospitality Memory
  events: OperationalEvent[]         // From Heart Pulse
  inputs: Record<string, unknown>
  requestId: string
  userId?: string
}
```

### SkillExecutionResult (Output)
```typescript
interface SkillExecutionResult {
  skillId: string
  skillName: string
  skillVersion: string
  success: boolean
  outputs: Record<string, unknown>
  findings: SkillFinding[]
  metrics: SkillMetric[]
  confidence: number  // 0..1
  confidenceFactors: {
    evidenceQuality: number
    consistency: number
    recency: number
    contradictionPenalty: number
  }
  evidence: SkillEvidence
  explainability: SkillExplainability
  executionTime: number
  warnings: string[]
  error?: string
}
```

---

## 6. Skill Quality Rules

### SkillConfidenceRules
| Field | Type | Description |
|-------|------|-------------|
| baseConfidence | number | Starting confidence (0..1) |
| evidenceWeight | number | How much evidence quality affects confidence |
| consistencyWeight | number | How much consistency affects confidence |
| recencyWeight | number | How much recency affects confidence |
| minimumEvidenceCount | number | Minimum evidence for non-zero confidence |
| contradictionPenalty | number | Penalty per contradiction (0..1) |

### SkillExplainabilityRules
| Field | Type | Description |
|-------|------|-------------|
| requireKnowledgeTrace | boolean | Must trace to knowledge objects |
| requireMemoryTrace | boolean | Must trace to memories |
| requireEventTrace | boolean | Must trace to events |
| requireReasoningStrategy | boolean | Must specify reasoning strategy |
| requireAlternativeOptions | boolean | Must provide alternatives |
| narrativeTemplate | string | Template for explanation |

### SkillValidationRules
| Field | Type | Description |
|-------|------|-------------|
| functionalTestRequired | boolean | Must pass functional test |
| integrationTestRequired | boolean | Must pass integration test |
| performanceTestRequired | boolean | Must pass performance test |
| edgeCaseTestRequired | boolean | Must pass edge case test |
| failureScenarioTestRequired | boolean | Must pass failure scenario test |
| confidenceValidationRequired | boolean | Must validate confidence |
| explainabilityValidationRequired | boolean | Must validate explainability |
| minimumTestPassRate | number | Minimum pass rate (0..1) |

---

## 7. Skill Governance Types

### SkillChangeRecord
```typescript
interface SkillChangeRecord {
  timestamp: string
  changeType: 'created' | 'updated' | 'status_changed' | 'version_changed' | 'approved' | 'deprecated' | 'retired'
  description: string
  changedBy: string
  previousVersion?: string
  newVersion?: string
  previousStatus?: SkillLifecycleStatus
  newStatus?: SkillLifecycleStatus
}
```

### SkillPerformanceMetrics
```typescript
interface SkillPerformanceMetrics {
  totalExecutions: number
  successfulExecutions: number
  failedExecutions: number
  averageExecutionTime: number
  averageConfidence: number
  lastExecutedAt?: string
  failureRate: number
  usageByProfile: Record<string, number>
  usageByDomain: Record<string, number>
}
```

---

## 8. Skill Discovery Types

```typescript
interface SkillDiscoveryRequest {
  intent: IntentType
  operationalDomain: OperationalDomain
  expertiseProfile: ExpertiseProfile
  reasoningStrategy?: ReasoningStrategy
  availableKnowledgeCategories?: string[]
  context?: Partial<SkillExecutionContext>
}

interface SkillDiscoveryResult {
  selectedSkills: Array<{
    skill: OperationalSkill
    relevanceScore: number
    selectionReason: string
  }>
  rejectedSkills: Array<{
    skill: OperationalSkill
    rejectionReason: string
  }>
  discoveryTime: number
}
```

---

## 9. Skill Orchestration Types

```typescript
interface SkillOrchestrationPlan {
  id: string
  requestId: string
  skills: Array<{
    skillId: string
    skillName: string
    executionOrder: number
    dependsOn: string[]
    inputs: Record<string, unknown>
    inputFromPreviousSteps?: Array<{
      fromSkillId: string
      fromOutput: string
      toInput: string
    }>
  }>
  combinationStrategy: 'sequential' | 'parallel' | 'pipeline' | 'fan_out_fan_in'
  estimatedTotalTime: number
  createdAt: string
}

interface SkillOrchestrationResult {
  plan: SkillOrchestrationPlan
  stepResults: SkillExecutionResult[]
  combinedFindings: SkillFinding[]
  combinedMetrics: SkillMetric[]
  combinedEvidence: SkillEvidence
  overallConfidence: number
  narrative: string
  totalTime: number
  success: boolean
  warnings: string[]
}
```

---

## 10. Skill API Types

| Type | Purpose |
|------|---------|
| SkillRegisterRequest/Response | Register a new skill |
| SkillSearchRequest/Response | Search skills by text/category/status/domain/profile/intent |
| SkillExecuteRequest/Response | Execute a single skill |
| SkillValidateRequest/Response | Validate a skill |
| SkillVersionRequest/Response | Get version history |
| SkillHistoryRequest/Response | Get change history and performance metrics |
| SkillCatalogResponse | Get full catalog with health status |

---

## 11. Type Relationships

```
OperationalSkill
  ├── SkillContextRequirement
  ├── SkillInput / SkillOutput
  ├── SkillConfidenceRules
  ├── SkillExplainabilityRules
  ├── SkillValidationRules
  ├── SkillCostEstimate
  ├── SkillChangeRecord[]
  └── SkillPerformanceMetrics

SkillExecutionContext
  ├── KnowledgeEntity[] (from Hospitality Knowledge)
  ├── HospitalityMemoryEntity[] (from Hospitality Memory)
  └── OperationalEvent[] (from Heart Pulse)

SkillExecutionResult
  ├── SkillFinding[]
  ├── SkillMetric[]
  ├── SkillEvidence
  └── SkillExplainability

SkillOrchestrationResult
  ├── SkillOrchestrationPlan
  ├── SkillExecutionResult[]
  ├── SkillFinding[]
  ├── SkillMetric[]
  └── SkillEvidence
```

---

## Certification

**Status:** CERTIFIED — PRODUCTION READY  
**Types Defined:** 25+ interfaces, 6 union types  
**Date:** 2026-07-23
