# Operational Skill Registry -- API Specification

**Platform:** Hospitality Intelligence Platform v2.3.0
**Module:** Operational Skill Registry v1.0
**Source:** `src/lib/hospitality-ai/skill-registry/api.ts`

---

## Table of Contents

1. [Overview](#1-overview)
2. [API Endpoints](#2-api-endpoints)
   - [2a. Register Skill](#2a-register-skill)
   - [2b. Search Skills](#2b-search-skills)
   - [2c. Execute Skill](#2c-execute-skill)
   - [2d. Validate Skill](#2d-validate-skill)
   - [2e. Version Management](#2e-version-management)
   - [2f. History and Audit](#2f-history-and-audit)
   - [2g. Catalog](#2g-catalog)
   - [2h. Orchestrate](#2h-orchestrate)
3. [Supporting Methods](#3-supporting-methods)
4. [Convenience Functions](#4-convenience-functions)
5. [Singleton Pattern](#5-singleton-pattern)
6. [Error Handling](#6-error-handling)
7. [Initialization](#7-initialization)
8. [Request/Response Type Reference](#8-requestresponse-type-reference)

---

## 1. Overview

The `SkillRegistryAPI` class is the unified programmatic entry point for the
Operational Skill Registry. It wraps five underlying engines into a single,
cohesive API surface:

| Engine | Source Module | Responsibility |
|---|---|---|
| Skill Registry | `registry.ts` | Skill storage, search, catalog, performance metrics |
| Discovery Engine | `discovery-engine.ts` | Skill selection based on intent, domain, and profile |
| Orchestration Engine | `orchestration-engine.ts` | Multi-skill execution planning and combination |
| Governance Engine | `governance-engine.ts` | Approvals, deprecation, version history, compliance |
| Validation Framework | `validation-framework.ts` | Functional, integration, performance, and edge-case testing |

The API exposes **8 primary endpoints** plus a set of supporting methods for
discovery, governance, compliance, and statistics. Every public method is
asynchronous and returns a structured response object with a `success` boolean.

### Class Signature

```typescript
export class SkillRegistryAPI {
  constructor(
    private registry = getSkillRegistry(),
    private discovery = getSkillDiscoveryEngine(),
    private orchestration = getSkillOrchestrationEngine(),
    private governance = getSkillGovernanceEngine(),
    private validation = getSkillValidationFramework()
  )
}
```

### Architectural Position

The Skill Registry sits in the capability layer of the Hospitality
Operational Expertise Engine:

```
Heart Pulse -> Hospitality Memory -> Hospitality Knowledge ->
Hospitality AI Copilot -> [Intent Classification] -> [Operational Domain] ->
[Operational Expertise] -> [Operational Skill Registry] -> [Reasoning] ->
[Recommendation] -> [Explainability] -> Final Response
```

Skills are reusable operational capabilities. They retrieve evidence from
Knowledge, Memory, and Events; apply domain-specific analysis; and produce
structured outputs for reasoning engines. Skills never generate business
facts -- they analyze evidence.

---

## 2. API Endpoints

The API provides 8 primary endpoints. Each is an async method on the
`SkillRegistryAPI` class.

### 2a. Register Skill

Registers a new operational skill (or a new version of an existing skill) in
the registry. Two variants are provided: one that accepts a request object
containing the skill definition, and one that accepts the skill definition
alongside a custom executor implementation.

#### Methods

```typescript
async registerSkill(request: SkillRegisterRequest): Promise<SkillRegisterResponse>

async registerSkillWithExecutor(
  skill: OperationalSkill,
  executor: SkillExecutor
): Promise<SkillRegisterResponse>
```

#### Request

**`registerSkill`** accepts `SkillRegisterRequest`:

| Field | Type | Required | Description |
|---|---|---|---|
| `skill` | `OperationalSkill` | Yes | The full skill definition to register |

**`registerSkillWithExecutor`** accepts positional arguments:

| Parameter | Type | Required | Description |
|---|---|---|---|
| `skill` | `OperationalSkill` | Yes | The full skill definition to register |
| `executor` | `SkillExecutor` | Yes | Custom executor implementing `execute()` and `validate()` |

#### Response -- `SkillRegisterResponse`

| Field | Type | Description |
|---|---|---|
| `success` | `boolean` | Whether registration succeeded |
| `skillId` | `string` | The registered skill ID (empty string on failure) |
| `error` | `string?` | Error message if registration failed |

#### Example

```typescript
import { getSkillRegistryAPI } from '@/lib/hospitality-ai/skill-registry/api'

const api = getSkillRegistryAPI()

// Register a skill definition only
const result = await api.registerSkill({
  skill: {
    id: 'food-cost-variance-analyzer',
    name: 'Food Cost Variance Analyzer',
    description: 'Analyzes food cost variance against budget',
    category: 'financial_analysis',
    version: '1.0.0',
    status: 'draft',
    owner: 'finance-team',
    tags: ['food-cost', 'variance', 'budget'],
    supportedDomains: ['finance', 'kitchen'],
    supportedExpertiseProfiles: ['executive_advisor', 'kitchen_advisor'],
    supportedIntents: ['root_cause_analysis', 'operational_review'],
    supportedReasoningStrategies: ['cause_and_effect', 'comparative_reasoning'],
    requiredKnowledgeCategories: ['financial'],
    requiredMemoryTypes: ['budget'],
    requiredEventTypes: ['purchase'],
    requiredContext: {
      businessIdRequired: true,
      timeRangeRequired: true,
      outletIdRequired: false,
      minimumKnowledgeCount: 1,
      minimumMemoryCount: 1,
      minimumEventCount: 1,
      minimumConfidence: 'medium',
    },
    inputs: [],
    outputs: [],
    confidenceRules: {
      baseConfidence: 0.7,
      evidenceWeight: 0.2,
      consistencyWeight: 0.1,
      recencyWeight: 0.1,
      minimumEvidenceCount: 1,
      contradictionPenalty: 0.1,
    },
    explainabilityRules: {
      requireKnowledgeTrace: true,
      requireMemoryTrace: false,
      requireEventTrace: false,
      requireReasoningStrategy: true,
      requireAlternativeOptions: false,
      narrativeTemplate: 'Variance analysis for {{period}}',
    },
    validationRules: {
      functionalTestRequired: true,
      integrationTestRequired: false,
      performanceTestRequired: false,
      edgeCaseTestRequired: true,
      failureScenarioTestRequired: false,
      confidenceValidationRequired: true,
      explainabilityValidationRequired: true,
      minimumTestPassRate: 0.8,
    },
    estimatedCost: {
      estimatedExecutionTimeMs: 500,
      estimatedMemoryMb: 10,
      estimatedApiCalls: 0,
      estimatedDbQueries: 3,
      complexity: 'low',
    },
    dependencies: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    changeHistory: [],
  },
})

// Register a skill with a custom executor
const resultWithExecutor = await api.registerSkillWithExecutor(skill, {
  skillId: 'food-cost-variance-analyzer',
  execute: async (context) => { /* ... */ },
  validate: async (context) => { /* ... */ },
})
```

---

### 2b. Search Skills

Searches the registry for skills matching the provided query parameters. All
parameters are optional and can be combined to narrow results.

#### Method

```typescript
async searchSkills(request: SkillSearchRequest): Promise<SkillSearchResponse>
```

#### Request -- `SkillSearchRequest`

| Field | Type | Required | Description |
|---|---|---|---|
| `query` | `string?` | No | Free-text search over name, description, and tags |
| `category` | `SkillCategory?` | No | Filter by skill category |
| `status` | `SkillLifecycleStatus?` | No | Filter by lifecycle status |
| `domain` | `OperationalDomain?` | No | Filter by supported operational domain |
| `expertiseProfile` | `ExpertiseProfile?` | No | Filter by supported expertise profile |
| `intent` | `IntentType?` | No | Filter by supported intent type |
| `limit` | `number?` | No | Maximum number of results to return |

#### Response -- `SkillSearchResponse`

| Field | Type | Description |
|---|---|---|
| `success` | `boolean` | Whether the search succeeded |
| `totalResults` | `number` | Number of matching skills returned |
| `results` | `Array<{ skill: OperationalSkill; relevanceScore: number; matchedFields: string[] }>` | Matching skills with relevance scoring |
| `error` | `string?` | Error message if search failed |

#### Example

```typescript
const response = await api.searchSkills({
  query: 'food cost',
  category: 'financial_analysis',
  status: 'production',
  domain: 'finance',
  limit: 10,
})

if (response.success) {
  for (const result of response.results) {
    console.log(`${result.skill.name} (relevance: ${result.relevanceScore})`)
    console.log(`  Matched fields: ${result.matchedFields.join(', ')}`)
  }
}
```

---

### 2c. Execute Skill

Executes a registered skill by its ID using the provided execution context.
The context must include all required evidence (knowledge, memories, events)
and user inputs. After execution, performance metrics are automatically
recorded against the skill.

#### Method

```typescript
async executeSkill(request: SkillExecuteRequest): Promise<SkillExecuteResponse>
```

#### Request -- `SkillExecuteRequest`

| Field | Type | Required | Description |
|---|---|---|---|
| `skillId` | `string` | Yes | The ID of the skill to execute |
| `context` | `SkillExecutionContext` | Yes | The execution context with evidence and inputs |

#### Context Requirements -- `SkillExecutionContext`

| Field | Type | Required | Description |
|---|---|---|---|
| `businessId` | `string` | Yes | The business identifier |
| `businessName` | `string` | Yes | The business name |
| `timeRange` | `{ start: string; end: string }?` | No | Time range for evidence retrieval |
| `outletId` | `string?` | No | Specific outlet identifier |
| `expertiseProfile` | `ExpertiseProfile` | Yes | The expertise profile requesting execution |
| `intent` | `IntentType` | Yes | The user intent triggering execution |
| `operationalDomain` | `OperationalDomain` | Yes | The operational domain |
| `reasoningStrategy` | `ReasoningStrategy` | Yes | The reasoning strategy to apply |
| `knowledge` | `KnowledgeEntity[]` | Yes | Evidence from Hospitality Knowledge |
| `memories` | `HospitalityMemoryEntity[]` | Yes | Evidence from Hospitality Memory |
| `events` | `OperationalEvent[]` | Yes | Evidence from operational events |
| `inputs` | `Record<string, unknown>` | Yes | User-provided input parameters |
| `requestId` | `string` | Yes | Unique request identifier |
| `userId` | `string?` | No | The requesting user identifier |

#### Response -- `SkillExecuteResponse`

| Field | Type | Description |
|---|---|---|
| `success` | `boolean` | Whether the API call succeeded |
| `result` | `SkillExecutionResult?` | The full execution result (present on success) |
| `error` | `string?` | Error message if execution failed |

#### Result Format -- `SkillExecutionResult`

| Field | Type | Description |
|---|---|---|
| `skillId` | `string` | The executed skill ID |
| `skillName` | `string` | The executed skill name |
| `skillVersion` | `string` | The executed skill version |
| `success` | `boolean` | Whether the skill execution itself succeeded |
| `outputs` | `Record<string, unknown>` | Structured output values |
| `findings` | `SkillFinding[]` | Observations, risks, opportunities, anomalies |
| `metrics` | `SkillMetric[]` | Quantitative metrics produced by the skill |
| `confidence` | `number` | Overall confidence score (0..1) |
| `confidenceFactors` | `object` | Breakdown: evidenceQuality, consistency, recency, contradictionPenalty |
| `evidence` | `SkillEvidence` | Evidence summary with knowledge/memory/event IDs |
| `explainability` | `SkillExplainability` | Reasoning trace and narrative |
| `executionTime` | `number` | Execution time in milliseconds |
| `warnings` | `string[]` | Non-fatal warnings |
| `error` | `string?` | Error detail if the skill itself failed |

#### Example

```typescript
const response = await api.executeSkill({
  skillId: 'food-cost-variance-analyzer',
  context: {
    businessId: 'biz-001',
    businessName: 'Imboni Restaurant',
    timeRange: { start: '2024-01-01', end: '2024-01-31' },
    expertiseProfile: 'executive_advisor',
    intent: 'root_cause_analysis',
    operationalDomain: 'finance',
    reasoningStrategy: 'cause_and_effect',
    knowledge: [],
    memories: [],
    events: [],
    inputs: { threshold: 0.05 },
    requestId: 'req-001',
  },
})

if (response.success && response.result) {
  console.log(`Confidence: ${response.result.confidence}`)
  for (const finding of response.result.findings) {
    console.log(`  [${finding.severity}] ${finding.title}: ${finding.description}`)
  }
}
```

---

### 2d. Validate Skill

Runs the validation framework against a registered skill. This executes
functional, integration, performance, edge-case, failure-scenario,
confidence, and explainability tests as configured by the skill's
`validationRules`.

#### Method

```typescript
async validateSkill(request: SkillValidateRequest): Promise<SkillValidateResponse>
```

#### Request -- `SkillValidateRequest`

| Field | Type | Required | Description |
|---|---|---|---|
| `skillId` | `string` | Yes | The ID of the skill to validate |
| `context` | `SkillExecutionContext` | Yes | The validation context (same structure as execution context) |

#### Response -- `SkillValidateResponse`

| Field | Type | Description |
|---|---|---|
| `success` | `boolean` | Whether the validation API call succeeded |
| `result` | `SkillValidationResult?` | The full validation result (present on success) |
| `error` | `string?` | Error message if validation failed |

#### Validation Result Format -- `SkillValidationResult`

| Field | Type | Description |
|---|---|---|
| `skillId` | `string` | The validated skill ID |
| `valid` | `boolean` | Whether the skill passed all required tests |
| `tests` | `Array<{ name, type, passed, description, duration, error? }>` | Individual test results |
| `passRate` | `number` | Fraction of tests passed (0..1) |
| `validatedAt` | `string` | ISO timestamp of validation |
| `validatedBy` | `string` | Validator identifier |
| `issues` | `string[]` | List of validation issues |

#### Example

```typescript
const response = await api.validateSkill({
  skillId: 'food-cost-variance-analyzer',
  context: {
    businessId: 'biz-001',
    businessName: 'Imboni Restaurant',
    expertiseProfile: 'executive_advisor',
    intent: 'root_cause_analysis',
    operationalDomain: 'finance',
    reasoningStrategy: 'cause_and_effect',
    knowledge: [],
    memories: [],
    events: [],
    inputs: {},
    requestId: 'req-002',
  },
})

if (response.success && response.result) {
  console.log(`Valid: ${response.result.valid}`)
  console.log(`Pass rate: ${response.result.passRate}`)
  for (const test of response.result.tests) {
    console.log(`  ${test.passed ? 'PASS' : 'FAIL'} ${test.name} (${test.duration}ms)`)
  }
}
```

---

### 2e. Version Management

Retrieves the version history for a specific skill, including the current
version and all previous versions with their lifecycle status and change
descriptions.

#### Method

```typescript
async getSkillVersions(request: SkillVersionRequest): Promise<SkillVersionResponse>
```

#### Request -- `SkillVersionRequest`

| Field | Type | Required | Description |
|---|---|---|---|
| `skillId` | `string` | Yes | The ID of the skill |
| `version` | `string?` | No | Optional specific version to query |

#### Response -- `SkillVersionResponse`

| Field | Type | Description |
|---|---|---|
| `success` | `boolean` | Whether the request succeeded |
| `skillId` | `string` | The queried skill ID |
| `currentVersion` | `string` | The current version string (empty on failure) |
| `versions` | `Array<{ version, status, createdAt, changeDescription }>` | Version history entries |
| `error` | `string?` | Error message if the request failed |

#### Version History Entry

| Field | Type | Description |
|---|---|---|
| `version` | `string` | Semantic version string |
| `status` | `SkillLifecycleStatus` | Lifecycle status at that version |
| `createdAt` | `string` | ISO timestamp of version creation |
| `changeDescription` | `string` | Description of changes in that version |

#### Example

```typescript
const response = await api.getSkillVersions({ skillId: 'food-cost-variance-analyzer' })

if (response.success) {
  console.log(`Current version: ${response.currentVersion}`)
  for (const v of response.versions) {
    console.log(`  ${v.version} [${v.status}] - ${v.changeDescription}`)
  }
}
```

---

### 2f. History and Audit

Retrieves the full change history and performance metrics for a specific
skill. This supports audit trails and operational monitoring.

#### Method

```typescript
async getSkillHistory(request: SkillHistoryRequest): Promise<SkillHistoryResponse>
```

#### Request -- `SkillHistoryRequest`

| Field | Type | Required | Description |
|---|---|---|---|
| `skillId` | `string` | Yes | The ID of the skill |
| `limit` | `number?` | No | Maximum number of history records to return |

#### Response -- `SkillHistoryResponse`

| Field | Type | Description |
|---|---|---|
| `success` | `boolean` | Whether the request succeeded |
| `skillId` | `string` | The queried skill ID |
| `history` | `SkillChangeRecord[]` | Change history records |
| `performanceMetrics` | `SkillPerformanceMetrics?` | Aggregated performance metrics |
| `error` | `string?` | Error message if the request failed |

#### Change Record -- `SkillChangeRecord`

| Field | Type | Description |
|---|---|---|
| `timestamp` | `string` | ISO timestamp of the change |
| `changeType` | `'created' \| 'updated' \| 'status_changed' \| 'version_changed' \| 'approved' \| 'deprecated' \| 'retired'` | Type of change |
| `description` | `string` | Human-readable change description |
| `changedBy` | `string` | Identifier of the user or system that made the change |
| `previousVersion` | `string?` | Previous version (if version changed) |
| `newVersion` | `string?` | New version (if version changed) |
| `previousStatus` | `SkillLifecycleStatus?` | Previous lifecycle status (if status changed) |
| `newStatus` | `SkillLifecycleStatus?` | New lifecycle status (if status changed) |

#### Performance Metrics -- `SkillPerformanceMetrics`

| Field | Type | Description |
|---|---|---|
| `totalExecutions` | `number` | Total number of executions |
| `successfulExecutions` | `number` | Number of successful executions |
| `failedExecutions` | `number` | Number of failed executions |
| `averageExecutionTime` | `number` | Average execution time in ms |
| `averageConfidence` | `number` | Average confidence score (0..1) |
| `lastExecutedAt` | `string?` | ISO timestamp of last execution |
| `failureRate` | `number` | Failure rate (0..1) |
| `usageByProfile` | `Record<string, number>` | Execution counts by expertise profile |
| `usageByDomain` | `Record<string, number>` | Execution counts by operational domain |

#### Example

```typescript
const response = await api.getSkillHistory({
  skillId: 'food-cost-variance-analyzer',
  limit: 50,
})

if (response.success) {
  for (const record of response.history) {
    console.log(`[${record.timestamp}] ${record.changeType}: ${record.description}`)
  }
  if (response.performanceMetrics) {
    console.log(`Total executions: ${response.performanceMetrics.totalExecutions}`)
    console.log(`Failure rate: ${response.performanceMetrics.failureRate}`)
  }
}
```

---

### 2g. Catalog

Returns the full skill catalog with aggregate statistics and per-skill health
status. This provides a complete view of all registered skills.

#### Method

```typescript
async getCatalog(): Promise<SkillCatalogResponse>
```

#### Request

This method takes no parameters.

#### Response -- `SkillCatalogResponse`

| Field | Type | Description |
|---|---|---|
| `success` | `boolean` | Whether the request succeeded |
| `catalog` | `SkillCatalog` | The full catalog object |
| `error` | `string?` | Error message if the request failed |

#### Catalog -- `SkillCatalog`

| Field | Type | Description |
|---|---|---|
| `totalSkills` | `number` | Total number of registered skills |
| `skillsByCategory` | `Record<string, number>` | Skill counts grouped by category |
| `skillsByStatus` | `Record<string, number>` | Skill counts grouped by lifecycle status |
| `skillsByDomain` | `Record<string, number>` | Skill counts grouped by operational domain |
| `entries` | `SkillCatalogEntry[]` | Per-skill catalog entries |

#### Catalog Entry -- `SkillCatalogEntry`

| Field | Type | Description |
|---|---|---|
| `skill` | `OperationalSkill` | The full skill definition |
| `registeredAt` | `string` | ISO timestamp of registration |
| `executionCount` | `number` | Total execution count |
| `averageConfidence` | `number` | Average confidence across all executions |
| `healthStatus` | `'healthy' \| 'degraded' \| 'unhealthy' \| 'unknown'` | Current health status |

#### Example

```typescript
const response = await api.getCatalog()

if (response.success) {
  console.log(`Total skills: ${response.catalog.totalSkills}`)
  console.log(`By status:`, response.catalog.skillsByStatus)
  for (const entry of response.catalog.entries) {
    console.log(`  ${entry.skill.name} [${entry.healthStatus}] - ${entry.executionCount} executions`)
  }
}
```

---

### 2h. Orchestrate

Executes multiple skills in a coordinated plan. The orchestration engine
builds an execution plan based on the discovery request, then executes the
selected skills according to the specified combination strategy.

#### Method

```typescript
async orchestrateSkills(
  request: SkillDiscoveryRequest,
  context: SkillExecutionContext,
  options?: {
    maxSkills?: number
    combinationStrategy?: SkillOrchestrationPlan['combinationStrategy']
  }
): Promise<{ success: boolean; result?: SkillOrchestrationResult; error?: string }>
```

#### Request -- `SkillDiscoveryRequest`

| Field | Type | Required | Description |
|---|---|---|---|
| `intent` | `IntentType` | Yes | The user intent to satisfy |
| `operationalDomain` | `OperationalDomain` | Yes | The operational domain |
| `expertiseProfile` | `ExpertiseProfile` | Yes | The requesting expertise profile |
| `reasoningStrategy` | `ReasoningStrategy?` | No | Preferred reasoning strategy |
| `availableKnowledgeCategories` | `string[]?` | No | Available knowledge categories for skill matching |
| `context` | `Partial<SkillExecutionContext>?` | No | Partial context for discovery matching |

#### Options

| Field | Type | Description |
|---|---|---|
| `maxSkills` | `number?` | Maximum number of skills to include in the plan |
| `combinationStrategy` | `'sequential' \| 'parallel' \| 'pipeline' \| 'fan_out_fan_in'?` | How to combine skill results |

#### Response

| Field | Type | Description |
|---|---|---|
| `success` | `boolean` | Whether orchestration succeeded |
| `result` | `SkillOrchestrationResult?` | The full orchestration result (present on success) |
| `error` | `string?` | Error message if orchestration failed |

#### Orchestration Result -- `SkillOrchestrationResult`

| Field | Type | Description |
|---|---|---|
| `plan` | `SkillOrchestrationPlan` | The execution plan that was followed |
| `stepResults` | `SkillExecutionResult[]` | Results from each skill step |
| `combinedFindings` | `SkillFinding[]` | Merged findings from all skills |
| `combinedMetrics` | `SkillMetric[]` | Merged metrics from all skills |
| `combinedEvidence` | `SkillEvidence` | Merged evidence from all skills |
| `overallConfidence` | `number` | Combined confidence score (0..1) |
| `narrative` | `string` | Combined explanatory narrative |
| `totalTime` | `number` | Total orchestration time in ms |
| `success` | `boolean` | Whether all steps succeeded |
| `warnings` | `string[]` | Non-fatal warnings from any step |

#### Example

```typescript
const response = await api.orchestrateSkills(
  {
    intent: 'root_cause_analysis',
    operationalDomain: 'finance',
    expertiseProfile: 'executive_advisor',
    reasoningStrategy: 'cause_and_effect',
  },
  {
    businessId: 'biz-001',
    businessName: 'Imboni Restaurant',
    expertiseProfile: 'executive_advisor',
    intent: 'root_cause_analysis',
    operationalDomain: 'finance',
    reasoningStrategy: 'cause_and_effect',
    knowledge: [],
    memories: [],
    events: [],
    inputs: {},
    requestId: 'req-003',
  },
  {
    maxSkills: 3,
    combinationStrategy: 'pipeline',
  }
)

if (response.success && response.result) {
  console.log(`Overall confidence: ${response.result.overallConfidence}`)
  console.log(`Total time: ${response.result.totalTime}ms`)
  for (const finding of response.result.combinedFindings) {
    console.log(`  [${finding.severity}] ${finding.title}`)
  }
}
```

---

## 3. Supporting Methods

In addition to the 8 primary endpoints, the API provides supporting methods
for discovery, governance, compliance, and statistics.

### discoverSkills

Runs the discovery engine to find skills relevant to a given request, without
executing them. Returns selected skills with relevance scores and rejected
skills with rejection reasons.

```typescript
async discoverSkills(
  request: SkillDiscoveryRequest
): Promise<{ success: boolean; result?: SkillDiscoveryResult; error?: string }>
```

**Response `SkillDiscoveryResult`:**

| Field | Type | Description |
|---|---|---|
| `selectedSkills` | `Array<{ skill: OperationalSkill; relevanceScore: number; selectionReason: string }>` | Skills selected for the request |
| `rejectedSkills` | `Array<{ skill: OperationalSkill; rejectionReason: string }>` | Skills considered but rejected |
| `discoveryTime` | `number` | Discovery processing time in ms |

---

### approveSkill

Grants governance approval for a skill, transitioning it toward production
status. Delegates to the governance engine's `grantApproval` method.

```typescript
async approveSkill(
  skillId: string,
  approvedBy: string,
  comments: string
): Promise<{ success: boolean; message: string }>
```

| Parameter | Type | Description |
|---|---|---|
| `skillId` | `string` | The ID of the skill to approve |
| `approvedBy` | `string` | Identifier of the approver |
| `comments` | `string` | Approval comments |

**Response:** `{ success: boolean; message: string }`

---

### deprecateSkill

Marks a skill as deprecated. Delegates to the governance engine's `deprecate`
method.

```typescript
async deprecateSkill(
  skillId: string,
  changedBy: string,
  reason: string
): Promise<{ success: boolean; message: string }>
```

| Parameter | Type | Description |
|---|---|---|
| `skillId` | `string` | The ID of the skill to deprecate |
| `changedBy` | `string` | Identifier of the user deprecating the skill |
| `reason` | `string` | Deprecation reason |

**Response:** `{ success: boolean; message: string }` -- message is
`'Skill deprecated'` on success or `'Deprecation failed'` on failure.

---

### getComplianceReport

Runs all compliance checks across registered skills and returns a summary
report with per-skill compliance status, issues, and warnings.

```typescript
async getComplianceReport(): Promise<{
  totalChecked: number
  compliant: number
  nonCompliant: number
  results: Array<{
    skillId: string
    skillName: string
    compliant: boolean
    issues: string[]
    warnings: string[]
  }>
}>
```

**Response:**

| Field | Type | Description |
|---|---|---|
| `totalChecked` | `number` | Total number of skills checked |
| `compliant` | `number` | Number of compliant skills |
| `nonCompliant` | `number` | Number of non-compliant skills |
| `results` | `Array<{ skillId, skillName, compliant, issues, warnings }>` | Per-skill compliance details |

On error, all counts are zero and `results` is an empty array.

---

### getStats

Returns aggregate statistics from the registry, including total skill counts
and breakdowns.

```typescript
async getStats(): Promise<{
  success: boolean
  stats?: ReturnType<SkillRegistry['getStats']>
  error?: string
}>
```

**Response:**

| Field | Type | Description |
|---|---|---|
| `success` | `boolean` | Whether the request succeeded |
| `stats` | `object?` | Registry statistics (present on success) |
| `error` | `string?` | Error message if the request failed |

---

## 4. Convenience Functions

The module exports standalone convenience functions that delegate to the
singleton API instance. These provide a simpler call surface for common
operations without requiring an explicit `getSkillRegistryAPI()` call.

```typescript
export async function registerSkill(skill: OperationalSkill): Promise<SkillRegisterResponse>
export async function searchSkills(request: SkillSearchRequest): Promise<SkillSearchResponse>
export async function executeSkill(skillId: string, context: SkillExecutionContext): Promise<SkillExecuteResponse>
export async function validateSkill(skillId: string, context: SkillExecutionContext): Promise<SkillValidateResponse>
export async function getSkillVersions(skillId: string): Promise<SkillVersionResponse>
export async function getSkillHistory(skillId: string, limit?: number): Promise<SkillHistoryResponse>
export async function getCatalog(): Promise<SkillCatalogResponse>
export async function orchestrateSkills(
  request: SkillDiscoveryRequest,
  context: SkillExecutionContext,
  options?: { maxSkills?: number; combinationStrategy?: SkillOrchestrationPlan['combinationStrategy'] }
)
```

### Convenience Function Signatures vs. Class Methods

| Convenience Function | Delegates To | Parameter Difference |
|---|---|---|
| `registerSkill(skill)` | `api.registerSkill({ skill })` | Accepts skill directly instead of request object |
| `searchSkills(request)` | `api.searchSkills(request)` | Same parameters |
| `executeSkill(skillId, context)` | `api.executeSkill({ skillId, context })` | Accepts positional arguments instead of request object |
| `validateSkill(skillId, context)` | `api.validateSkill({ skillId, context })` | Accepts positional arguments instead of request object |
| `getSkillVersions(skillId)` | `api.getSkillVersions({ skillId })` | Accepts skill ID directly instead of request object |
| `getSkillHistory(skillId, limit?)` | `api.getSkillHistory({ skillId, limit })` | Accepts positional arguments instead of request object |
| `getCatalog()` | `api.getCatalog()` | Same (no parameters) |
| `orchestrateSkills(request, context, options?)` | `api.orchestrateSkills(request, context, options)` | Same parameters |

### Example Usage

```typescript
import {
  registerSkill,
  searchSkills,
  executeSkill,
  getCatalog,
} from '@/lib/hospitality-ai/skill-registry/api'

// Register using convenience function
await registerSkill(mySkill)

// Search using convenience function
const results = await searchSkills({ query: 'cost', category: 'financial_analysis' })

// Execute using convenience function
const execResult = await executeSkill('food-cost-variance-analyzer', context)

// Get catalog using convenience function
const catalog = await getCatalog()
```

---

## 5. Singleton Pattern

The module implements a singleton pattern to ensure a single shared API
instance across the application. This avoids redundant engine initialization
and maintains consistent state.

### getSkillRegistryAPI

Returns the singleton `SkillRegistryAPI` instance. Creates a new instance on
first call; subsequent calls return the same instance.

```typescript
let apiInstance: SkillRegistryAPI | null = null

export function getSkillRegistryAPI(): SkillRegistryAPI {
  if (!apiInstance) {
    apiInstance = new SkillRegistryAPI()
  }
  return apiInstance
}
```

### resetSkillRegistryAPI

Clears the singleton instance, allowing a fresh instance to be created on the
next `getSkillRegistryAPI()` call. Useful for testing or forced re-initialization.

```typescript
export function resetSkillRegistryAPI(): void {
  apiInstance = null
}
```

### Example

```typescript
import { getSkillRegistryAPI, resetSkillRegistryAPI } from '@/lib/hospitality-ai/skill-registry/api'

const api = getSkillRegistryAPI()
const sameApi = getSkillRegistryAPI()
// api === sameApi (same instance)

resetSkillRegistryAPI()
const newApi = getSkillRegistryAPI()
// newApi !== api (fresh instance)
```

---

## 6. Error Handling

All API methods follow a consistent error handling pattern. No method throws
exceptions to the caller. Instead, every method wraps its body in a
try/catch block and returns a structured response with a `success` boolean.

### Error Response Format

Every response type includes:

| Field | Type | Description |
|---|---|---|
| `success` | `boolean` | `false` when an error occurred |
| `error` | `string` | String representation of the caught error |

### Per-Method Error Responses

| Method | Error Response Shape |
|---|---|
| `registerSkill` | `{ success: false, skillId: '', error: string }` |
| `registerSkillWithExecutor` | `{ success: false, skillId: '', error: string }` |
| `searchSkills` | `{ success: false, totalResults: 0, results: [], error: string }` |
| `executeSkill` | `{ success: false, error: string }` -- also returns this if no executor is found |
| `validateSkill` | `{ success: false, error: string }` |
| `getSkillVersions` | `{ success: false, skillId, currentVersion: '', versions: [], error: string }` |
| `getSkillHistory` | `{ success: false, skillId, history: [], error: string }` |
| `getCatalog` | `{ success: false, catalog: {}, error: string }` |
| `orchestrateSkills` | `{ success: false, error: string }` |
| `discoverSkills` | `{ success: false, error: string }` |
| `approveSkill` | `{ success: false, message: string }` |
| `deprecateSkill` | `{ success: false, message: string }` |
| `getComplianceReport` | `{ totalChecked: 0, compliant: 0, nonCompliant: 0, results: [] }` (no error field) |
| `getStats` | `{ success: false, error: string }` |

### Special Error Cases

- **`executeSkill`** -- If no executor is found for the given `skillId`, the
  method returns `{ success: false, error: 'No executor found for skill {skillId}' }`
  without throwing.
- **`getSkillVersions`** -- If the skill is not found, the method returns
  `{ success: false, skillId, currentVersion: '', versions: [], error: 'Skill not found' }`.
- **`getComplianceReport`** -- On error, returns a zeroed-out report without
  an `error` field, as the return type does not include one.

---

## 7. Initialization

The API uses lazy auto-initialization. Every public method calls
`ensureInitialized()` before performing its operation.

### ensureInitialized

```typescript
private ensureInitialized(): void {
  if (!isSkillRegistryInitialized()) {
    initializeSkillRegistry()
  }
}
```

This private method checks whether the Skill Registry has been initialized
via `isSkillRegistryInitialized()` (from `skill-registration.ts`). If not, it
calls `initializeSkillRegistry()` to perform initialization.

### Behavior

- **First call:** Any API method triggers initialization automatically.
- **Subsequent calls:** The initialization check is a fast no-op.
- **No manual init required:** Consumers never need to call initialization
  functions directly.
- **Thread safety:** The check is synchronous; in the Node.js single-threaded
  model, there is no race condition risk.

### After Reset

If `resetSkillRegistryAPI()` is called, the next API method call creates a
new `SkillRegistryAPI` instance, which again triggers `ensureInitialized()`
on its first operation.

---

## 8. Request/Response Type Reference

All types are defined in `src/lib/hospitality-ai/skill-registry/types.ts`.

### Skill Identity Types

#### SkillCategory

```typescript
type SkillCategory =
  | 'operational_analysis'
  | 'financial_analysis'
  | 'customer_intelligence'
  | 'staff_intelligence'
  | 'inventory_intelligence'
  | 'kitchen_intelligence'
  | 'executive_intelligence'
  | 'continuous_improvement'
```

#### SkillLifecycleStatus

```typescript
type SkillLifecycleStatus =
  | 'draft'
  | 'experimental'
  | 'validated'
  | 'production'
  | 'deprecated'
  | 'retired'
```

#### OperationalDomain

```typescript
type OperationalDomain =
  | 'kitchen'
  | 'service'
  | 'reservations'
  | 'inventory'
  | 'finance'
  | 'revenue'
  | 'customers'
  | 'staff'
  | 'management'
  | 'marketing'
  | 'suppliers'
  | 'operations'
  | 'cross_domain'
```

#### ExpertiseProfile

```typescript
type ExpertiseProfile =
  | 'executive_advisor'
  | 'kitchen_advisor'
  | 'service_advisor'
  | 'inventory_advisor'
  | 'revenue_advisor'
  | 'staff_performance_advisor'
  | 'customer_experience_advisor'
  | 'operational_excellence_advisor'
```

#### IntentType

```typescript
type IntentType =
  | 'information_request'
  | 'explanation'
  | 'root_cause_analysis'
  | 'recommendation_request'
  | 'prediction_request'
  | 'risk_assessment'
  | 'planning'
  | 'optimization'
  | 'comparison'
  | 'status_check'
  | 'trend_analysis'
  | 'decision_support'
  | 'problem_diagnosis'
  | 'operational_review'
  | 'learning_training'
  | 'unknown_intent'
```

#### ReasoningStrategy

```typescript
type ReasoningStrategy =
  | 'cause_and_effect'
  | 'constraint_optimization'
  | 'temporal_reasoning'
  | 'risk_evaluation'
  | 'multi_factor_reasoning'
  | 'comparative_reasoning'
  | 'scenario_reasoning'
  | 'evidence_based_recommendation'
  | 'diagnostic_reasoning'
  | 'summary_synthesis'
```

### Core Skill Definition

#### OperationalSkill

```typescript
interface OperationalSkill {
  id: string
  name: string
  description: string
  category: SkillCategory
  version: string
  status: SkillLifecycleStatus
  owner: string
  tags: string[]
  supportedDomains: OperationalDomain[]
  supportedExpertiseProfiles: ExpertiseProfile[]
  supportedIntents: IntentType[]
  supportedReasoningStrategies: ReasoningStrategy[]
  requiredKnowledgeCategories: string[]
  requiredMemoryTypes: string[]
  requiredEventTypes: string[]
  requiredContext: SkillContextRequirement
  inputs: SkillInput[]
  outputs: SkillOutput[]
  confidenceRules: SkillConfidenceRules
  explainabilityRules: SkillExplainabilityRules
  validationRules: SkillValidationRules
  estimatedCost: SkillCostEstimate
  dependencies: string[]
  createdAt: string
  updatedAt: string
  approvedAt?: string
  approvedBy?: string
  changeHistory: SkillChangeRecord[]
  performanceMetrics?: SkillPerformanceMetrics
}
```

#### SkillContextRequirement

```typescript
interface SkillContextRequirement {
  businessIdRequired: boolean
  timeRangeRequired: boolean
  outletIdRequired: boolean
  minimumKnowledgeCount: number
  minimumMemoryCount: number
  minimumEventCount: number
  minimumConfidence: 'low' | 'medium' | 'high' | 'very_high' | 'certain'
}
```

#### SkillInput

```typescript
interface SkillInput {
  name: string
  type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object'
       | 'knowledge_ref' | 'memory_ref' | 'event_ref'
  required: boolean
  description: string
  defaultValue?: unknown
  validationPattern?: string
}
```

#### SkillOutput

```typescript
interface SkillOutput {
  name: string
  type: 'string' | 'number' | 'boolean' | 'array' | 'object'
       | 'metric' | 'finding' | 'recommendation'
  description: string
  unit?: string
}
```

#### SkillConfidenceRules

```typescript
interface SkillConfidenceRules {
  baseConfidence: number
  evidenceWeight: number
  consistencyWeight: number
  recencyWeight: number
  minimumEvidenceCount: number
  contradictionPenalty: number
}
```

#### SkillExplainabilityRules

```typescript
interface SkillExplainabilityRules {
  requireKnowledgeTrace: boolean
  requireMemoryTrace: boolean
  requireEventTrace: boolean
  requireReasoningStrategy: boolean
  requireAlternativeOptions: boolean
  narrativeTemplate: string
}
```

#### SkillValidationRules

```typescript
interface SkillValidationRules {
  functionalTestRequired: boolean
  integrationTestRequired: boolean
  performanceTestRequired: boolean
  edgeCaseTestRequired: boolean
  failureScenarioTestRequired: boolean
  confidenceValidationRequired: boolean
  explainabilityValidationRequired: boolean
  minimumTestPassRate: number
}
```

#### SkillCostEstimate

```typescript
interface SkillCostEstimate {
  estimatedExecutionTimeMs: number
  estimatedMemoryMb: number
  estimatedApiCalls: number
  estimatedDbQueries: number
  complexity: 'low' | 'medium' | 'high'
}
```

### Execution Types

#### SkillExecutionContext

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
  knowledge: KnowledgeEntity[]
  memories: HospitalityMemoryEntity[]
  events: OperationalEvent[]
  inputs: Record<string, unknown>
  requestId: string
  userId?: string
}
```

#### SkillExecutionResult

```typescript
interface SkillExecutionResult {
  skillId: string
  skillName: string
  skillVersion: string
  success: boolean
  outputs: Record<string, unknown>
  findings: SkillFinding[]
  metrics: SkillMetric[]
  confidence: number
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

#### SkillFinding

```typescript
interface SkillFinding {
  id: string
  type: 'observation' | 'risk' | 'opportunity' | 'anomaly'
      | 'trend' | 'threshold' | 'recommendation'
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  evidenceRefs: string[]
  confidence: number
  actionable: boolean
  recommendedAction?: string
}
```

#### SkillMetric

```typescript
interface SkillMetric {
  name: string
  value: number
  unit: string
  target?: number
  status?: 'good' | 'warning' | 'critical'
  trend?: 'up' | 'down' | 'stable'
  description: string
}
```

#### SkillEvidence

```typescript
interface SkillEvidence {
  knowledgeIds: string[]
  memoryIds: string[]
  eventIds: string[]
  evidenceCount: number
  evidenceQuality: number
  evidenceSummary: string
}
```

#### SkillExplainability

```typescript
interface SkillExplainability {
  reasoningStrategy: ReasoningStrategy
  knowledgeConsulted: Array<{ id: string; title: string; category: string; confidence: string }>
  memoriesConsulted: Array<{ id: string; title: string; confidence: number }>
  eventsConsulted: number
  narrative: string
  alternativeOptions: Array<{ option: string; rationale: string; confidence: number }>
}
```

### Governance Types

#### SkillChangeRecord

```typescript
interface SkillChangeRecord {
  timestamp: string
  changeType: 'created' | 'updated' | 'status_changed' | 'version_changed'
            | 'approved' | 'deprecated' | 'retired'
  description: string
  changedBy: string
  previousVersion?: string
  newVersion?: string
  previousStatus?: SkillLifecycleStatus
  newStatus?: SkillLifecycleStatus
}
```

#### SkillPerformanceMetrics

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

### Discovery and Orchestration Types

#### SkillDiscoveryRequest

```typescript
interface SkillDiscoveryRequest {
  intent: IntentType
  operationalDomain: OperationalDomain
  expertiseProfile: ExpertiseProfile
  reasoningStrategy?: ReasoningStrategy
  availableKnowledgeCategories?: string[]
  context?: Partial<SkillExecutionContext>
}
```

#### SkillDiscoveryResult

```typescript
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

#### SkillOrchestrationPlan

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
```

#### SkillOrchestrationResult

```typescript
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

### Catalog Types

#### SkillCatalogEntry

```typescript
interface SkillCatalogEntry {
  skill: OperationalSkill
  registeredAt: string
  executionCount: number
  averageConfidence: number
  healthStatus: 'healthy' | 'degraded' | 'unhealthy' | 'unknown'
}
```

#### SkillCatalog

```typescript
interface SkillCatalog {
  totalSkills: number
  skillsByCategory: Record<string, number>
  skillsByStatus: Record<string, number>
  skillsByDomain: Record<string, number>
  entries: SkillCatalogEntry[]
}
```

### Validation Types

#### SkillValidationResult

```typescript
interface SkillValidationResult {
  skillId: string
  valid: boolean
  tests: Array<{
    name: string
    type: 'functional' | 'integration' | 'performance' | 'edge_case'
        | 'failure_scenario' | 'confidence' | 'explainability' | 'reasoning'
    passed: boolean
    description: string
    duration: number
    error?: string
  }>
  passRate: number
  validatedAt: string
  validatedBy: string
  issues: string[]
}
```

### Executor Interface

#### SkillExecutor

```typescript
interface SkillExecutor {
  skillId: string
  execute(context: SkillExecutionContext): Promise<SkillExecutionResult>
  validate(context: SkillExecutionContext): Promise<SkillValidationResult>
}
```

### API Request/Response Types

#### SkillRegisterRequest / SkillRegisterResponse

```typescript
interface SkillRegisterRequest {
  skill: OperationalSkill
}

interface SkillRegisterResponse {
  success: boolean
  skillId: string
  error?: string
}
```

#### SkillSearchRequest / SkillSearchResponse

```typescript
interface SkillSearchRequest {
  query?: string
  category?: SkillCategory
  status?: SkillLifecycleStatus
  domain?: OperationalDomain
  expertiseProfile?: ExpertiseProfile
  intent?: IntentType
  limit?: number
}

interface SkillSearchResponse {
  success: boolean
  totalResults: number
  results: Array<{
    skill: OperationalSkill
    relevanceScore: number
    matchedFields: string[]
  }>
  error?: string
}
```

#### SkillExecuteRequest / SkillExecuteResponse

```typescript
interface SkillExecuteRequest {
  skillId: string
  context: SkillExecutionContext
}

interface SkillExecuteResponse {
  success: boolean
  result?: SkillExecutionResult
  error?: string
}
```

#### SkillValidateRequest / SkillValidateResponse

```typescript
interface SkillValidateRequest {
  skillId: string
  context: SkillExecutionContext
}

interface SkillValidateResponse {
  success: boolean
  result?: SkillValidationResult
  error?: string
}
```

#### SkillVersionRequest / SkillVersionResponse

```typescript
interface SkillVersionRequest {
  skillId: string
  version?: string
}

interface SkillVersionResponse {
  success: boolean
  skillId: string
  currentVersion: string
  versions: Array<{
    version: string
    status: SkillLifecycleStatus
    createdAt: string
    changeDescription: string
  }>
  error?: string
}
```

#### SkillHistoryRequest / SkillHistoryResponse

```typescript
interface SkillHistoryRequest {
  skillId: string
  limit?: number
}

interface SkillHistoryResponse {
  success: boolean
  skillId: string
  history: SkillChangeRecord[]
  performanceMetrics?: SkillPerformanceMetrics
  error?: string
}
```

#### SkillCatalogResponse

```typescript
interface SkillCatalogResponse {
  success: boolean
  catalog: SkillCatalog
  error?: string
}
```

---

## Appendix -- Module Exports Summary

| Export | Type | Description |
|---|---|---|
| `SkillRegistryAPI` | Class | The main API class |
| `getSkillRegistryAPI()` | Function | Returns the singleton API instance |
| `resetSkillRegistryAPI()` | Function | Resets the singleton instance |
| `registerSkill(skill)` | Function | Convenience: register a skill |
| `searchSkills(request)` | Function | Convenience: search skills |
| `executeSkill(skillId, context)` | Function | Convenience: execute a skill |
| `validateSkill(skillId, context)` | Function | Convenience: validate a skill |
| `getSkillVersions(skillId)` | Function | Convenience: get version history |
| `getSkillHistory(skillId, limit?)` | Function | Convenience: get change history |
| `getCatalog()` | Function | Convenience: get full catalog |
| `orchestrateSkills(request, context, options?)` | Function | Convenience: orchestrate multiple skills |
