# Operational Skill Registry -- Orchestration Engine

| Field | Value |
|---|---|
| **Platform** | Hospitality Intelligence Platform v2.3.0 |
| **Module** | Operational Skill Registry v1.0 |
| **Component** | SkillOrchestrationEngine |
| **Source File** | `src/lib/hospitality-ai/skill-registry/orchestration-engine.ts` |
| **Status** | Certified -- 4/4 orchestration tests passing |

---

## Table of Contents

1. [Overview](#1-overview)
2. [Orchestration Strategies](#2-orchestration-strategies)
3. [Plan Creation](#3-plan-creation)
4. [Plan Execution](#4-plan-execution)
5. [Step Context Building](#5-step-context-building)
6. [Result Combination](#6-result-combination)
7. [Finding Deduplication](#7-finding-deduplication)
8. [Confidence Aggregation](#8-confidence-aggregation)
9. [Narrative Generation](#9-narrative-generation)
10. [Performance Tracking](#10-performance-tracking)
11. [API Methods](#11-api-methods)
12. [Validation Results](#12-validation-results)

---

## 1. Overview

The Orchestration Engine is the workflow coordinator of the Operational Skill Registry. Its purpose is to plan and execute multi-skill workflows that combine the outputs of several certified operational skills into a single, coherent result set.

### Purpose

The engine addresses a core problem in hospitality intelligence: a single user intent (for example, "operational review") often requires analysis from multiple specialized skills -- kitchen intelligence, financial analysis, staff intelligence, and customer intelligence. Rather than asking the caller to invoke each skill manually and merge results, the Orchestration Engine:

- **Discovers** relevant skills via the Discovery Engine.
- **Plans** an execution graph with dependencies and data-flow links.
- **Executes** the plan using the chosen combination strategy.
- **Combines** findings, metrics, evidence, and confidence into a unified result.
- **Tracks** performance metrics for every skill invocation.

### Architectural Guarantee

The Orchestration Engine never bypasses the certified architecture. It combines skill outputs -- it does not generate facts, perform reasoning, or fabricate evidence. Every finding, metric, and evidence pointer in the combined result originates from a real skill execution that consulted real knowledge, memories, and events.

### High-Level Flow

```
 +------------------+     +------------------+     +------------------+
 |  DiscoveryEngine | --> |  Orchestration   | --> |  Combined Result |
 |  .discover()     |     |  Engine          |     |  (findings,      |
 |  selects skills  |     |  plans + executes|     |   metrics,       |
 +------------------+     +--------+---------+     |   evidence,      |
                                   |               |   confidence)    |
                                   v               +------------------+
                          +------------------+
                          |  SkillRegistry    |
                          |  .getExecutor()   |
                          |  per skill        |
                          +------------------+
```

### Class Definition

```typescript
export class SkillOrchestrationEngine {
  constructor(
    private registry: OperationalSkillRegistry,
    private discoveryEngine: SkillDiscoveryEngine
  ) {}
}
```

The engine holds references to two collaborators:

| Collaborator | Role |
|---|---|
| `OperationalSkillRegistry` | Provides executors for each skill and records performance metrics. |
| `SkillDiscoveryEngine` | Ranks and selects skills relevant to a given intent/domain/expertise request. |

---

## 2. Orchestration Strategies

The engine supports four combination strategies, declared on the plan via the `combinationStrategy` field:

```typescript
combinationStrategy: 'sequential' | 'parallel' | 'pipeline' | 'fan_out_fan_in'
```

### Strategy Comparison

| Strategy | Execution Model | Dependencies | Data Flow | Failure Behavior |
|---|---|---|---|---|
| `sequential` | One skill at a time, in order | Each step depends on the previous | Findings from step N feed into step N+1 as `previousFindings` | Failed steps emit warnings; execution continues |
| `parallel` | All skills run concurrently via `Promise.all` | No dependencies | No inter-step data flow; each skill gets base context only | All skills complete; overall success requires every skill to succeed |
| `pipeline` | One skill at a time, in stages | Each step depends on the previous | Findings from step N feed into step N+1 as `previousFindings` | Pipeline halts on first failure (`break`) |
| `fan_out_fan_in` | Sequential execution; last skill aggregates | Last skill depends on all prior skills | Each prior skill's findings feed into the final skill as `findings_from_<skillId>` | Failed steps emit warnings; execution continues |

### 2.1 Sequential

Skills run one after another. Each skill (except the first) depends on the previous skill and receives its findings as the `previousFindings` input.

```
 Skill A --> Skill B --> Skill C
  findings    findings    findings
    |            ^           ^
    +------------+-----------+
   previousFindings  previousFindings
```

**Dependency wiring (createPlan):**

```typescript
if (strategy === 'sequential' || strategy === 'pipeline') {
  if (i > 0) {
    const prevSkill = selectedSkills[i - 1].skill
    dependsOn.push(prevSkill.id)
    inputFromPreviousSteps.push({
      fromSkillId: prevSkill.id,
      fromOutput: 'findings',
      toInput: 'previousFindings',
    })
  }
}
```

**Execution:** Steps are iterated in order. Each step's context is built from the outputs map, which contains results from all previously completed steps. A failed step records a warning but does not stop the chain.

### 2.2 Parallel

All skills execute concurrently using `Promise.all`. No dependencies are wired between steps. Each skill receives only the base context inputs -- there is no inter-step data flow.

```
       +--> Skill A --+
       |              |
 Base  +--> Skill B --+--> Promise.all --> Combined
 Context              |
       +--> Skill C --+
```

**Execution:**

```typescript
if (plan.combinationStrategy === 'parallel') {
  const promises = plan.skills.map(async (step) => {
    const context = this.buildStepContext(step, baseContext, stepOutputs)
    return this.executeStep(step.skillId, context)
  })
  const results = await Promise.all(promises)
  stepResults.push(...results)
  for (let i = 0; i < plan.skills.length; i++) {
    stepOutputs.set(plan.skills[i].skillId, results[i])
  }
}
```

Because `stepOutputs` is empty when parallel steps are dispatched, `buildStepContext` injects only the base inputs. This is by design -- parallel skills are independent.

### 2.3 Pipeline

Identical dependency wiring to sequential (each step depends on the previous, findings flow forward as `previousFindings`). The difference is in failure handling: if any step fails, the pipeline breaks immediately and no further steps are executed.

```
 Skill A --> Skill B --> Skill C
  (if A fails, B and C are skipped)
```

**Failure handling:**

```typescript
if (!result.success) {
  warnings.push(`Skill ${step.skillName} failed: ${result.error || 'unknown error'}`)
  if (plan.combinationStrategy === 'pipeline') {
    break  // Stop pipeline on failure
  }
}
```

### 2.4 Fan-Out / Fan-In

All skills except the last run independently (no dependencies on each other). The final skill depends on every prior skill and receives each one's findings under a distinct input key: `findings_from_<skillId>`.

```
 Skill A --\
 Skill B --+--> Skill D (fan-in target)
 Skill C --/

  A.findings --> findings_from_skillA
  B.findings --> findings_from_skillB
  C.findings --> findings_from_skillC
```

**Dependency wiring (createPlan):**

```typescript
} else if (strategy === 'fan_out_fan_in') {
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
```

**Execution:** Although the fan-out skills are logically independent, the engine executes them sequentially (they fall into the `else` branch of the execution logic). The fan-in target (last skill) runs after all prior steps have completed, so its context will contain all prior findings. A failed step records a warning but does not halt the chain.

---

## 3. Plan Creation

The `createPlan` method transforms a discovery request and execution context into a structured `SkillOrchestrationPlan`. It delegates skill selection to the Discovery Engine, then wires dependencies and data-flow links according to the chosen strategy.

### Signature

```typescript
createPlan(
  request: SkillDiscoveryRequest,
  context: SkillExecutionContext,
  options: {
    maxSkills?: number
    combinationStrategy?: SkillOrchestrationPlan['combinationStrategy']
  } = {}
): SkillOrchestrationPlan
```

### Process

```
 1. Discover skills        discoveryEngine.discover(request)
 2. Cap to maxSkills       selectedSkills.slice(0, maxSkills)   [default: 5]
 3. For each skill:
    a. Record in skillMap
    b. Wire dependsOn[] and inputFromPreviousSteps[] per strategy
    c. Push step { skillId, skillName, executionOrder, dependsOn, inputs, inputFromPreviousSteps }
 4. Sum estimatedTotalTime from each skill's estimatedExecutionTimeMs (fallback 100ms)
 5. Return SkillOrchestrationPlan
```

### Plan Structure

```typescript
export interface SkillOrchestrationPlan {
  id: string                          // hashId('orchestration', requestId|timestamp)
  requestId: string                   // from context.requestId
  skills: Array<{
    skillId: string
    skillName: string
    executionOrder: number            // 1-based
    dependsOn: string[]               // skill IDs this step waits on
    inputs: Record<string, unknown>   // copy of context.inputs at plan time
    inputFromPreviousSteps?: Array<{
      fromSkillId: string
      fromOutput: string              // 'findings' | 'metrics' | custom output key
      toInput: string                 // key under which the value is injected
    }>
  }>
  combinationStrategy: 'sequential' | 'parallel' | 'pipeline' | 'fan_out_fan_in'
  estimatedTotalTime: number          // sum of per-skill estimatedExecutionTimeMs
  createdAt: string                   // ISO timestamp
}
```

### Plan ID Generation

The plan ID is a deterministic hash of the request ID and current timestamp:

```typescript
id: hashId('orchestration', `${context.requestId}|${nowIso()}`)
```

`hashId` produces a 16-character SHA-256 hex prefix:

```typescript
export function hashId(prefix: string, content: string): string {
  return `${prefix}_${createHash('sha256').update(content).digest('hex').slice(0, 16)}`
}
// Example: orchestration_a1b2c3d4e5f6a7b8
```

### Estimated Total Time

```typescript
const estimatedTotalTime = steps.reduce(
  (sum, s) => sum + (skillMap.get(s.skillId)?.estimatedCost.estimatedExecutionTimeMs || 100),
  0
)
```

Each skill's `estimatedCost.estimatedExecutionTimeMs` is summed. If a skill's cost metadata is missing, a fallback of 100 ms is used.

### Example: Creating a Plan

```typescript
const orchestration = getSkillOrchestrationEngine()

const plan = orchestration.createPlan(
  { intent: 'optimization', operationalDomain: 'kitchen', expertiseProfile: 'kitchen_advisor' },
  context,
  { maxSkills: 5 }
)

// plan.skills: array of steps with executionOrder 1..N
// plan.combinationStrategy: 'sequential' (default)
// plan.estimatedTotalTime: sum of per-skill estimates
```

---

## 4. Plan Execution

The `executePlan` method runs a previously created plan and returns a `SkillOrchestrationResult`.

### Signature

```typescript
async executePlan(
  plan: SkillOrchestrationPlan,
  baseContext: SkillExecutionContext
): Promise<SkillOrchestrationResult>
```

### Execution Flow

```
                    +-----------------------+
                    |  executePlan()        |
                    |  start = Date.now()   |
                    +-----------+-----------+
                                |
                    +-----------v-----------+
                    |  strategy == parallel? |
                    +---+---------------+---+
                       yes              no
                        |                |
              +---------v--------+  +----v-------------------+
              |  Promise.all()   |  |  for each step:         |
              |  all skills      |  |    buildStepContext()   |
              |  concurrently    |  |    executeStep()        |
              +--------+---------+  |    store in stepOutputs |
                       |            |    if fail & pipeline:  |
              +--------v---------+  |       break             |
              |  collect results |  +----+-------------------+
              +--------+---------+       |
                       |                 |
                       +--------+--------+
                                |
                    +-----------v-----------+
                    |  Combine results:      |
                    |  - combineFindings     |
                    |  - combineMetrics      |
                    |  - combineEvidence     |
                    |  - computeConfidence   |
                    |  - buildNarrative      |
                    +-----------+-----------+
                                |
                    +-----------v-----------+
                    |  Return result         |
                    |  totalTime = now-start |
                    +-----------------------+
```

### Step Execution

Each step is executed via `executeStep`, which:

1. Retrieves the executor from the registry: `this.registry.getExecutor(skillId)`.
2. If no executor is found, returns a failure result with a descriptive error.
3. Calls `executor.execute(context)` and records performance metrics.
4. If the executor throws, catches the error, records a failed execution, and returns a structured failure result.

```typescript
private async executeStep(skillId: string, context: SkillExecutionContext): Promise<SkillExecutionResult> {
  const executor = this.registry.getExecutor(skillId)
  if (!executor) {
    return { /* failure result with error: "No executor registered for skill ${skillId}" */ }
  }
  const start = Date.now()
  try {
    const result = await executor.execute(context)
    this.registry.recordExecution(
      skillId, result.success, result.executionTime,
      result.confidence, context.expertiseProfile, context.operationalDomain
    )
    return result
  } catch (error) {
    const execTime = Date.now() - start
    this.registry.recordExecution(skillId, false, execTime, 0, ...)
    return { /* structured failure result */ }
  }
}
```

### Result Structure

```typescript
export interface SkillOrchestrationResult {
  plan: SkillOrchestrationPlan
  stepResults: SkillExecutionResult[]
  combinedFindings: SkillFinding[]
  combinedMetrics: SkillMetric[]
  combinedEvidence: SkillEvidence
  overallConfidence: number
  narrative: string
  totalTime: number          // wall-clock ms from start to return
  success: boolean           // true only if every step succeeded
  warnings: string[]         // per-failure warning messages
}
```

### Success Semantics

The overall `success` flag is strict:

```typescript
const success = stepResults.every((r) => r.success)
```

A single failed step causes `success` to be `false`, even if the remaining steps completed. Warnings are collected for every failure:

```typescript
warnings.push(`Skill ${step.skillName} failed: ${result.error || 'unknown error'}`)
```

---

## 5. Step Context Building

Before each step executes, the engine builds a `SkillExecutionContext` that merges the base context with outputs from prior steps. This is how data flows through the orchestration graph.

### Method

```typescript
private buildStepContext(
  step: SkillOrchestrationPlan['skills'][0],
  baseContext: SkillExecutionContext,
  previousOutputs: Map<string, SkillExecutionResult>
): SkillExecutionContext
```

### Process

```
 1. Clone step.inputs (which is a copy of context.inputs captured at plan time)
 2. If step.inputFromPreviousSteps exists:
    for each link { fromSkillId, fromOutput, toInput }:
      a. Look up previousOutputs.get(fromSkillId)
      b. If found, inject the value:
         - fromOutput === 'findings'  --> inputs[toInput] = prevResult.findings
         - fromOutput === 'metrics'   --> inputs[toInput] = prevResult.metrics
         - otherwise                  --> inputs[toInput] = prevResult.outputs[fromOutput]
 3. Return { ...baseContext, inputs }
```

### Data-Flow Link Types

| `fromOutput` value | Source field on `SkillExecutionResult` | Injected as |
|---|---|---|
| `'findings'` | `result.findings` (array of `SkillFinding`) | `inputs[toInput]` |
| `'metrics'` | `result.metrics` (array of `SkillMetric`) | `inputs[toInput]` |
| any other string | `result.outputs[fromOutput]` (custom output) | `inputs[toInput]` |

### Example: Sequential Data Flow

For a sequential plan with skills A, B, C:

```
 Step 1 (Skill A): no inputFromPreviousSteps
   context.inputs = { ...baseInputs }

 Step 2 (Skill B): inputFromPreviousSteps = [{ fromSkillId: A, fromOutput: 'findings', toInput: 'previousFindings' }]
   context.inputs = { ...baseInputs, previousFindings: A.findings }

 Step 3 (Skill C): inputFromPreviousSteps = [{ fromSkillId: B, fromOutput: 'findings', toInput: 'previousFindings' }]
   context.inputs = { ...baseInputs, previousFindings: B.findings }
```

### Example: Fan-Out / Fan-In Data Flow

For a fan_out_fan_in plan with skills A, B, C, D (D is the fan-in target):

```
 Step 1 (Skill A): no links
 Step 2 (Skill B): no links
 Step 3 (Skill C): no links
 Step 4 (Skill D): inputFromPreviousSteps = [
   { fromSkillId: A, fromOutput: 'findings', toInput: 'findings_from_A' },
   { fromSkillId: B, fromOutput: 'findings', toInput: 'findings_from_B' },
   { fromSkillId: C, fromOutput: 'findings', toInput: 'findings_from_C' },
 ]
   context.inputs = { ...baseInputs, findings_from_A: A.findings, findings_from_B: B.findings, findings_from_C: C.findings }
```

### Parallel Context

In parallel mode, `stepOutputs` is empty when `buildStepContext` is called for all steps (they are dispatched simultaneously). Therefore `inputFromPreviousSteps` links, if any, resolve to nothing and only the base inputs are used. This is intentional -- parallel skills are independent by definition.

---

## 6. Result Combination

After all steps complete, the engine combines four categories of output into the final result.

### 6.1 Findings (`combineFindings`)

Collects all findings from all step results, deduplicates by title, and sorts by severity then confidence.

See [Section 7](#7-finding-deduplication) for full details.

### 6.2 Metrics (`combineMetrics`)

Collects all metrics from all step results, deduplicating by metric name (first occurrence wins).

```typescript
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
```

| Behavior | Detail |
|---|---|
| Dedup key | `metric.name` (string) |
| Conflict resolution | First occurrence wins; later metrics with the same name are dropped |
| Ordering | Insertion order (order of step results, then order within each result) |

### 6.3 Evidence (`combineEvidence`)

Merges evidence references (knowledge IDs, memory IDs, event IDs) across all step results using set union, and averages the evidence quality.

```typescript
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
    evidenceSummary: `Combined evidence from ${results.length} skill executions: ` +
      `${knowledgeIds.size} knowledge, ${memoryIds.size} memories, ${eventIds.size} events`,
  }
}
```

| Field | Combination Method |
|---|---|
| `knowledgeIds` | Set union across all steps |
| `memoryIds` | Set union across all steps |
| `eventIds` | Set union across all steps |
| `evidenceCount` | Sum of unique knowledge + memory + event IDs |
| `evidenceQuality` | Arithmetic mean of per-step `evidenceQuality` |
| `evidenceSummary` | Auto-generated string with counts |

### 6.4 Confidence (`computeOverallConfidence`)

See [Section 8](#8-confidence-aggregation).

---

## 7. Finding Deduplication

The `combineFindings` method ensures that duplicate findings across skills are collapsed into a single entry. Deduplication is based on the finding `title` field.

### Algorithm

```typescript
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
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 }
  return allFindings.sort((a, b) => {
    const sevDiff = severityOrder[a.severity] - severityOrder[b.severity]
    if (sevDiff !== 0) return sevDiff
    return b.confidence - a.confidence
  })
}
```

### Steps

1. **Collect**: Iterate every step result, then every finding within each result.
2. **Deduplicate**: Maintain a `Set<string>` of seen titles. If a finding's title has already been seen, skip it. First occurrence wins.
3. **Sort**: Order by severity (critical first), then by confidence (highest first) as a tiebreaker.

### Severity Order

| Severity | Sort Priority |
|---|---|
| `critical` | 0 (first) |
| `high` | 1 |
| `medium` | 2 |
| `low` | 3 |
| `info` | 4 (last) |

### Example

```
 Step A findings: ["Inventory shortage", "Staff gap"]
 Step B findings: ["Inventory shortage", "Revenue decline"]

 Combined (before sort): ["Inventory shortage", "Staff gap", "Revenue decline"]
   -- "Inventory shortage" from B is skipped (duplicate title)

 Combined (after sort by severity, then confidence):
   critical: "Inventory shortage" (conf 0.92)
   high:     "Revenue decline"    (conf 0.85)
   medium:   "Staff gap"          (conf 0.70)
```

### Validation

The validation suite explicitly tests deduplication by verifying that the number of unique titles equals the number of combined findings:

```typescript
const uniqueFindings = new Set(result.combinedFindings.map((f) => f.title)).size
// passes when: uniqueFindings === result.combinedFindings.length
```

---

## 8. Confidence Aggregation

The `computeOverallConfidence` method produces a single confidence score in the range [0, 1] from the per-step confidence values.

### Algorithm

```typescript
private computeOverallConfidence(results: SkillExecutionResult[]): number {
  if (results.length === 0) return 0
  const successful = results.filter((r) => r.success)
  if (successful.length === 0) return 0
  const avgConfidence = average(successful.map((r) => r.confidence))
  const successRate = successful.length / results.length
  return clamp01(avgConfidence * successRate)
}
```

### Formula

```
 overallConfidence = clamp01( average(confidence of successful steps) * (successful / total) )
```

### Edge Cases

| Condition | Result |
|---|---|
| No step results | `0` |
| All steps failed | `0` |
| All steps succeeded | `average(confidence)` (successRate = 1.0) |
| Some steps failed | `average(successful confidence) * successRate` (penalized) |

### Helper Functions

```typescript
export function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value))
}

export function average(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((s, v) => s + v, 0) / values.length
}
```

### Rationale

The formula penalizes orchestration results that include failed steps. If 3 of 4 steps succeed with an average confidence of 0.80, the overall confidence is:

```
 overallConfidence = 0.80 * (3/4) = 0.80 * 0.75 = 0.60
```

This ensures that partial failures are reflected as reduced confidence in the combined result, not just as a `success: false` flag.

### Example Scenarios

| Steps | Successful Confidences | Avg Confidence | Success Rate | Overall |
|---|---|---|---|---|
| 4 | [0.90, 0.85, 0.80, 0.75] | 0.825 | 1.00 | 0.825 |
| 4 | [0.90, 0.85, 0.80, fail] | 0.85 | 0.75 | 0.6375 |
| 3 | [fail, fail, fail] | N/A | 0.00 | 0.0 |
| 0 | [] | N/A | N/A | 0.0 |

---

## 9. Narrative Generation

The `buildNarrative` method produces a human-readable summary of the orchestration run.

### Algorithm

```typescript
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
```

### Narrative Components

| Part | Content |
|---|---|
| Opening | `Orchestration executed N skill(s) using '<strategy>' strategy.` |
| Status | `X succeeded, Y failed.` |
| Output | `Produced F findings and M metrics.` |
| Failures (if any) | `Failed skills: <name1>, <name2>` |

### Example Narratives

**All success:**

```
Orchestration executed 3 skill(s) using 'sequential' strategy. 3 succeeded, 0 failed. Produced 7 findings and 12 metrics.
```

**With failures:**

```
Orchestration executed 4 skill(s) using 'pipeline' strategy. 2 succeeded, 2 failed. Produced 3 findings and 5 metrics. Failed skills: KitchenIntelligence, InventoryIntelligence
```

Note: `totalFindings` and `totalMetrics` count all findings/metrics from all step results (before deduplication). The deduplicated counts are available via `combinedFindings.length` and `combinedMetrics.length` on the result object.

---

## 10. Performance Tracking

Every skill execution is recorded with the registry for performance monitoring and adaptive selection.

### Recording

```typescript
this.registry.recordExecution(
  skillId,
  result.success,        // boolean
  result.executionTime,  // milliseconds
  result.confidence,     // 0..1
  context.expertiseProfile,
  context.operationalDomain
)
```

### When Recording Happens

| Scenario | Recorded |
|---|---|
| Executor found, execution succeeds | Yes -- success=true, actual executionTime, actual confidence |
| Executor found, execution throws | Yes -- success=false, measured execTime, confidence=0 |
| No executor registered | No -- returns failure result without recording |

### Orchestration-Level Timing

The overall wall-clock time is measured at the `executePlan` level:

```typescript
const start = Date.now()
// ... execute all steps ...
return { ..., totalTime: Date.now() - start, ... }
```

This captures the full orchestration overhead including context building, step execution, and result combination.

### Performance Validation

The validation suite includes a performance test that verifies orchestration completes within 10 seconds:

```typescript
const result = await api.orchestrateSkills(...)
const totalTime = result.result?.totalTime || 0
// passes when: totalTime < 10000
```

---

## 11. API Methods

The `SkillOrchestrationEngine` class exposes three public methods.

### 11.1 `createPlan`

Creates an orchestration plan from a discovery request without executing it.

```typescript
createPlan(
  request: SkillDiscoveryRequest,
  context: SkillExecutionContext,
  options?: {
    maxSkills?: number                          // default: 5
    combinationStrategy?: 'sequential'          // default: 'sequential'
                      | 'parallel'
                      | 'pipeline'
                      | 'fan_out_fan_in'
  }
): SkillOrchestrationPlan
```

| Parameter | Type | Required | Description |
|---|---|---|---|
| `request` | `SkillDiscoveryRequest` | Yes | Intent, domain, and expertise profile for skill discovery |
| `context` | `SkillExecutionContext` | Yes | Execution context containing requestId, inputs, knowledge, memories, events |
| `options.maxSkills` | `number` | No | Maximum number of skills to include (default 5) |
| `options.combinationStrategy` | enum | No | How skills are combined (default `sequential`) |

**Returns:** `SkillOrchestrationPlan` -- a structured plan with steps, dependencies, and estimated time.

### 11.2 `executePlan`

Executes a previously created plan and returns combined results.

```typescript
async executePlan(
  plan: SkillOrchestrationPlan,
  baseContext: SkillExecutionContext
): Promise<SkillOrchestrationResult>
```

| Parameter | Type | Required | Description |
|---|---|---|---|
| `plan` | `SkillOrchestrationPlan` | Yes | The plan to execute (from `createPlan` or manually constructed) |
| `baseContext` | `SkillExecutionContext` | Yes | Base context; per-step inputs are merged on top of this |

**Returns:** `Promise<SkillOrchestrationResult>` -- combined findings, metrics, evidence, confidence, narrative, and timing.

### 11.3 `orchestrate`

Convenience method that combines `createPlan` and `executePlan` in a single call.

```typescript
async orchestrate(
  request: SkillDiscoveryRequest,
  context: SkillExecutionContext,
  options?: {
    maxSkills?: number
    combinationStrategy?: 'sequential' | 'parallel' | 'pipeline' | 'fan_out_fan_in'
  }
): Promise<SkillOrchestrationResult>
```

```typescript
async orchestrate(request, context, options): Promise<SkillOrchestrationResult> {
  const plan = this.createPlan(request, context, options)
  return this.executePlan(plan, context)
}
```

### Singleton Access

The engine is provided as a singleton via factory functions:

```typescript
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
```

| Function | Purpose |
|---|---|
| `getSkillOrchestrationEngine()` | Returns the singleton instance, creating it with default registry and discovery engine if not yet initialized |
| `resetSkillOrchestrationEngine()` | Clears the singleton (used in tests to ensure isolation) |

### Usage Example

```typescript
import { getSkillOrchestrationEngine } from './orchestration-engine'

const orchestration = getSkillOrchestrationEngine()

const result = await orchestration.orchestrate(
  { intent: 'operational_review', operationalDomain: 'operations', expertiseProfile: 'executive_advisor' },
  context,
  { maxSkills: 3, combinationStrategy: 'sequential' }
)

console.log(result.success)              // true if all steps succeeded
console.log(result.combinedFindings)     // deduplicated, sorted findings
console.log(result.overallConfidence)    // 0..1
console.log(result.narrative)            // human-readable summary
console.log(result.totalTime)            // wall-clock ms
```

---

## 12. Validation Results

The orchestration engine is validated by the `SkillRegistryValidationSuite` in `src/lib/hospitality-ai/skill-registry/validation-suite.ts`. The `runOrchestrationTests` method executes four tests that cover the core orchestration capabilities.

### Test Suite

| # | Test ID | Description | Strategy | Assertion |
|---|---|---|---|---|
| 1 | `orchestration_sequential` | Sequential multi-skill orchestration | `sequential` | `result.success` is true |
| 2 | `orchestration_parallel` | Parallel multi-skill orchestration | `parallel` | `result.success` is true |
| 3 | `orchestration_plan_creation` | Plan creation without execution | default (`sequential`) | `plan.skills.length > 0` |
| 4 | `orchestration_finding_dedup` | Finding deduplication across skills | default (`sequential`) | unique title count equals combined findings length |

### Test Details

**Test 1 -- Sequential Orchestration:**

```typescript
const result = await orchestration.orchestrate(
  { intent: 'operational_review', operationalDomain: 'operations', expertiseProfile: 'executive_advisor' },
  context,
  { maxSkills: 3, combinationStrategy: 'sequential' }
)
// Assert: result.success === true
// Detail: "Sequential: N steps, M findings"
```

**Test 2 -- Parallel Orchestration:**

```typescript
const result = await orchestration.orchestrate(
  { intent: 'status_check', operationalDomain: 'cross_domain', expertiseProfile: 'executive_advisor' },
  context,
  { maxSkills: 3, combinationStrategy: 'parallel' }
)
// Assert: result.success === true
// Detail: "Parallel: N steps, M findings"
```

**Test 3 -- Plan Creation:**

```typescript
const plan = orchestration.createPlan(
  { intent: 'optimization', operationalDomain: 'kitchen', expertiseProfile: 'kitchen_advisor' },
  context,
  { maxSkills: 5 }
)
// Assert: plan.skills.length > 0
// Detail: "Plan with N steps, strategy: sequential"
```

**Test 4 -- Finding Deduplication:**

```typescript
const result = await orchestration.orchestrate(
  { intent: 'operational_review', operationalDomain: 'operations', expertiseProfile: 'operational_excellence_advisor' },
  context,
  { maxSkills: 4 }
)
const uniqueFindings = new Set(result.combinedFindings.map((f) => f.title)).size
// Assert: uniqueFindings === result.combinedFindings.length
// Detail: "N unique findings from M skills"
```

### Summary

```
 +-----------------------------------------------------------+
 |           Orchestration Validation Results                |
 +-----------------------------------------------------------+
 | Test                        | Status   | Category         |
 +-----------------------------+----------+------------------+
 | orchestration_sequential    | PASS     | Orchestration    |
 | orchestration_parallel      | PASS     | Orchestration    |
 | orchestration_plan_creation | PASS     | Orchestration    |
 | orchestration_finding_dedup | PASS     | Orchestration    |
 +-----------------------------+----------+------------------+
 | Total: 4/4 PASS                                            |
 +-----------------------------------------------------------+
```

| Metric | Value |
|---|---|
| Orchestration tests run | 4 |
| Orchestration tests passed | 4 |
| Orchestration tests failed | 0 |
| Performance threshold | < 10,000 ms (validated separately) |

### Additional Validation Coverage

Beyond the four dedicated orchestration tests, the engine is also exercised in:

| Test ID | Suite | Coverage |
|---|---|---|
| `performance_orchestration` | Performance | Verifies `totalTime < 10000` ms |
| `failure_orchestration_resilience` | Failure Recovery | Verifies orchestration completes without throwing when given empty context |

---

*End of document -- Operational Skill Registry v1.0 -- Hospitality Intelligence Platform v2.3.0*
