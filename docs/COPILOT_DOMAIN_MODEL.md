# COPILOT DOMAIN MODEL

**Platform:** Hospitality Intelligence Platform v2.3.0
**Module:** Hospitality AI Copilot™ v1.0
**File:** `src/lib/hospitality-ai/copilot/types.ts`

---

## 1. Overview

The Copilot domain model defines the types that flow through the reasoning pipeline. Every type is designed to preserve provenance, enforce explainability, and maintain auditability.

---

## 2. Core Types

### 2.1 CopilotRequest

The entry point for every Copilot interaction.

```typescript
interface CopilotRequest {
  requestId: string
  businessId: string
  businessName?: string
  question: string
  userId?: string
  userRole?: UserRole
  userDepartment?: string
  shift?: ShiftType
  outletId?: string
  location?: string
  timeRange?: { start: string; end: string; label?: string }
  asOf?: string
  businessObjectives?: string[]
  activeAlerts?: ActiveAlert[]
  activeWorkflows?: ActiveWorkflow[]
  includeAlternatives?: boolean
  maxRecommendations?: number
  explainabilityLevel?: 'brief' | 'standard' | 'full'
  conversationId?: string
  previousRequestId?: string
}
```

### 2.2 CopilotResponse

The complete response carrying every pipeline stage.

```typescript
interface CopilotResponse {
  requestId: string
  conversationId?: string
  success: boolean
  intentClassification: IntentClassification
  domainDetection: DomainDetection
  expertiseSelection: ExpertiseSelection
  context: OperationalContext
  knowledgeRetrieval: KnowledgeRetrievalResult
  evidenceEvaluation: EvidenceEvaluation
  reasoning: ReasoningResult
  recommendations: CopilotRecommendation[]
  explainabilityTraces: ExplainabilityTrace[]
  summary: string
  overallConfidence: number
  uncertaintyStatement?: string
  diagnostics: CopilotDiagnostics
  governance: CopilotGovernanceRecord
  error?: string
  warnings: string[]
}
```

---

## 3. Pipeline Stage Types

### 3.1 IntentClassification (Phase 1)
- `intent: IntentType` (16 types)
- `confidence: number` (0..1)
- `alternativeIntents`, `matchedSignals`, `rejectedIntents`
- `classifierVersion: string`

### 3.2 DomainDetection (Phase 2)
- `primaryDomain: OperationalDomain` (13 domains)
- `secondaryDomains: Array<{ domain, relevance }>`
- `isCrossDomain: boolean`
- `detectorVersion: string`

### 3.3 ExpertiseSelection (Phase 3)
- `profile: ExpertiseProfile` (8 profiles)
- `confidence: number`
- `alternativeProfiles`, `selectionReason`
- `selectorVersion: string`

### 3.4 OperationalContext (Phase 5)
- User context (role, department, shift, outlet)
- Time context (asOf, timeRange, dayOfWeek, timeOfDay, season)
- Business signals (objectives, alerts, workflows)
- Historical context summaries
- `determinismProof: string` (hash of inputs)

### 3.5 KnowledgeRetrievalResult (Phase 6)
- `knowledge: KnowledgeEntity[]`
- `relatedMemories: HospitalityMemoryEntity[]`
- `relatedEvents: OperationalEvent[]`
- `provenanceGraph: ProvenanceNode[]`
- Provenance chain: Knowledge → Memory → Events

### 3.6 EvidenceEvaluation (Phase 7)
- `overallSufficiency: 'sufficient' | 'marginal' | 'insufficient' | 'absent'`
- `overallConfidence: number` (0..1)
- `completeness`, `recency`, `consistency`, `confidence` (each 0..1)
- `conflictingEvidence: ConflictingEvidence[]`
- `missingEvidence: MissingEvidence[]`

### 3.7 ReasoningResult (Phase 8)
- `strategy: ReasoningStrategy` (10 strategies)
- `strategySelectionReason: string`
- `reasoningTrace: ReasoningStep[]`
- `derivedFindings: DerivedFinding[]`

### 3.8 CopilotRecommendation (Phase 9)
- `id`, `title`, `description`, `rationule`
- `priority: 'critical' | 'high' | 'medium' | 'low'`
- `confidence: number` (0..1)
- `confidenceFactors: RecommendationConfidenceFactors`
- `evidenceRefs: string[]` (knowledge/memory/event IDs)
- `skillIds: string[]` (skills that contributed)
- `reasoningStrategies: ReasoningStrategy[]`
- `recommendedActions: RecommendedAction[]`
- `alternativeOptions: AlternativeOption[]`
- `roleFit: UserRole[]`, `domainFit: OperationalDomain[]`
- `requiresHumanApproval: boolean` (always true)
- `reversible: boolean` (always true)

### 3.9 ExplainabilityTrace (Phase 10)
- Full pipeline trace from user question to final recommendation
- `knowledgeObjects`, `supportingMemories`, `supportingEvents`
- `reasoningSteps: ReasoningStep[]`
- `alternativeOptions`, `confidenceAssessment`
- `explanation: string` (human-readable narrative)
- `traceComplete: boolean`, `traceWarnings: string[]`

### 3.10 CopilotGovernanceRecord (Phase 11)
- 6 principle flags (evidenceFirst, explainabilityByDesign, etc.)
- 5 composite checks (allRequireHumanApproval, allHaveEvidence, etc.)
- `violations: GovernanceViolation[]`
- `compliant: boolean`, `complianceScore: number`

---

## 4. Enumerations

### 4.1 IntentType (16)
`information_request`, `explanation`, `root_cause_analysis`, `recommendation_request`, `prediction_request`, `risk_assessment`, `planning`, `optimization`, `comparison`, `status_check`, `trend_analysis`, `decision_support`, `problem_diagnosis`, `operational_review`, `learning_training`, `unknown_intent`

### 4.2 OperationalDomain (13)
`kitchen`, `service`, `reservations`, `inventory`, `finance`, `revenue`, `customers`, `staff`, `management`, `marketing`, `suppliers`, `operations`, `cross_domain`

### 4.3 ExpertiseProfile (8)
`executive_advisor`, `kitchen_advisor`, `service_advisor`, `inventory_advisor`, `revenue_advisor`, `staff_performance_advisor`, `customer_experience_advisor`, `operational_excellence_advisor`

### 4.4 ReasoningStrategy (10)
`cause_and_effect`, `constraint_optimization`, `temporal_reasoning`, `risk_evaluation`, `multi_factor_reasoning`, `comparative_reasoning`, `scenario_reasoning`, `evidence_based_recommendation`, `diagnostic_reasoning`, `summary_synthesis`

### 4.5 UserRole (14)
`owner`, `general_manager`, `kitchen_manager`, `service_manager`, `floor_manager`, `inventory_manager`, `shift_lead`, `server`, `cook`, `host`, `bartender`, `analyst`, `executive`, `unknown`

### 4.6 ShiftType (8)
`morning`, `lunch`, `afternoon`, `dinner`, `evening`, `night`, `closing`, `all_day`

---

## 5. Provenance Model

Every recommendation maintains complete provenance:

```text
CopilotRecommendation
    ↓ evidenceRefs
KnowledgeEntity
    ↓ provenance.memoryRefs
HospitalityMemoryEntity
    ↓ provenance.observationRefs
OperationalEvent (Heart Pulse™)
```

The `ProvenanceNode` type captures this graph:
```typescript
interface ProvenanceNode {
  id: string
  type: 'knowledge' | 'memory' | 'event'
  title: string
  confidence: number
  supports: string[]
  supportedBy: string[]
  traceComplete: boolean
}
```

---

## 6. API Request/Response Types

The Copilot exposes 7+ API endpoints with dedicated request/response types:
- `CopilotQueryRequest` / `CopilotQueryResponse`
- `CopilotExplainabilityRequest` / `CopilotExplainabilityResponse`
- `CopilotHistoryRequest` / `CopilotHistoryResponse`
- `CopilotConfidenceRequest` / `CopilotConfidenceResponse`
- `CopilotMultiStepRequest` / `CopilotMultiStepResponse`

---

## 7. Design Constraints

- **No invented facts:** Every recommendation must reference evidence IDs that exist in the retrieval.
- **No hidden state:** All pipeline stages are recorded in the response.
- **No bypassed architecture:** Recommendations require evidence from Knowledge/Memory/Events.
- **Human decision support:** `requiresHumanApproval` is always `true`.
- **Deterministic context:** `OperationalContext.determinismProof` hashes all inputs.
