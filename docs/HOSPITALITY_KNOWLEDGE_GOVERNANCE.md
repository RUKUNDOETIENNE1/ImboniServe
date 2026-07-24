# Hospitality Knowledge™ — Governance

**Module:** Hospitality Knowledge™ v1.0
**Platform:** Hospitality Intelligence Platform v2.2.0
**Date:** 2026-07-23

---

## Overview

Governance ensures that knowledge is versioned, explainable, traceable, auditable, and historically preserved. The Governance Engine provides the infrastructure for complete knowledge lifecycle management — from formation through evolution to retirement.

---

## Versioning

### How Versioning Works

Every knowledge entity has a `version` field that starts at 1 and increments on every update. This provides:

- **Change tracking**: Know exactly how many times knowledge has been modified
- **Rollback capability**: Version snapshots preserve previous states
- **Audit trail**: When combined with lifecycle history, provides full change timeline

### Version Snapshots

```typescript
function createVersionSnapshot(knowledge: KnowledgeEntity): {
  version: number
  snapshot: KnowledgeEntity
  timestamp: string
}
```

Snapshots capture the complete state of knowledge at a point in time.

### Version Diffing

```typescript
function diffKnowledgeVersions(
  oldVersion: KnowledgeEntity,
  newVersion: KnowledgeEntity
): {
  changes: Array<{ field: string; oldValue: string; newValue: string }>
  isSignificant: boolean
}
```

Tracked fields:
- Status
- Confidence / Confidence Score
- Supporting Memories / Contradicting Memories
- Statement / Description
- Impact Level

A change is **significant** if it affects Status, Confidence, or Statement.

---

## Explainability

### Full Explanation Generation

```typescript
function explainKnowledge(knowledge: KnowledgeEntity): KnowledgeExplanation
```

The `KnowledgeExplanation` includes:

#### Provenance Chain
- **Events**: count, earliest, latest, source modules
- **Memories**: count, titles, average confidence
- **Patterns**: count, types
- **Pipeline**: all 8 stages with input/output counts

#### Evidence Summary
- Supporting memory count
- Contradicting memory count
- Evidence diversity
- Evidence consistency
- Cross-validation coverage

#### Lifecycle Summary
- Current status
- Number of transitions
- Establishment date
- Last validation date

#### Narrative
A human-readable explanation that weaves together all aspects:

> "Friday dinner staffing pattern" is a piece of operational knowledge currently in established status with high confidence (78%). It is supported by 5 memories and 47 underlying events from modules: heart-pulse. The knowledge was formed through a 8-stage pipeline and has undergone 2 lifecycle transitions. It was established on 2026-07-23. This knowledge has high business impact: Staffing and resource planning. Recommended actions: Operationalize the pattern: Friday dinner staffing pattern; Adjust staffing/resources for friday based on identified pattern.

### Explainability Score

The explainability score (0..1) is computed based on provenance completeness:

| Component | Points |
|-----------|--------|
| Has origin event IDs | 0.30 |
| Has ≥3 supporting memories | 0.25 |
| Has ≥6 pipeline stages | 0.20 |
| Has confidence history | 0.15 |
| Has lifecycle history | 0.10 |
| **Maximum** | **1.00** |

**Validation result:** 85% average explainability score across sampled knowledge.

---

## Provenance

### Provenance Structure

The `KnowledgeProvenance` interface is the complete audit trail:

```
provenance
├── originMemoryIds          → Memory entities that formed this knowledge
├── originEventIds           → Heart Pulse events behind those memories
├── originModules            → Source intelligence modules
├── formationPipeline        → 8-stage pipeline trace
│   ├── memory_ingestion
│   ├── memory_clustering
│   ├── pattern_detection
│   ├── evidence_evaluation
│   ├── candidate_formation
│   ├── knowledge_validation
│   ├── knowledge_establishment
│   └── graph_integration
├── memoryRefs               → Detailed memory references
│   └── { memoryId, contribution, weight, ... }
├── crossRefs                → Cross-references to other knowledge
│   └── { knowledgeId, relationship, description }
├── confidenceHistory        → All confidence snapshots
│   └── { score, level, factors, reason, timestamp }
├── lifecycleHistory         → All lifecycle transitions
│   └── { from, to, reason, evidenceSummary, triggeredBy }
├── consumerAccessHistory    → All consumer access logs
│   └── { consumer, purpose, result, timestamp }
├── formationRule            → Rule that formed this knowledge
├── formationRuleVersion     → Rule version
├── validationRule           → Rule that validated this knowledge
└── validationRuleVersion    → Rule version
```

### Provenance Integrity

Every knowledge entity must have:
- At least 1 origin memory ID
- At least 1 origin event ID
- At least 1 memory reference
- At least 6 formation pipeline stages
- At least 1 confidence snapshot
- At least 1 lifecycle transition
- At least 1 supporting memory

---

## Auditing

### Audit Record Generation

```typescript
function auditKnowledge(knowledge: KnowledgeEntity): KnowledgeAuditRecord[]
```

Audit records are generated from provenance:

| Action | Actor | Description |
|--------|-------|-------------|
| `knowledge_created` | discovery_engine | Knowledge formed with N supporting memories |
| `lifecycle_transition:{from}_to_{to}` | trigger source | Transition reason + evidence summary |
| `confidence_updated` | confidence_engine | New confidence level + reason |
| `consumer_access:{result}` | consumer name | Access purpose + result |

Each record includes:
- `knowledgeId`: Which knowledge was affected
- `timestamp`: When the action occurred
- `action`: What happened
- `actor`: Who/what triggered it
- `details`: Human-readable description
- `beforeState` / `afterState`: State changes (for transitions)

---

## Historical Evolution

### Evolution Reconstruction

```typescript
function reconstructEvolution(knowledge: KnowledgeEntity): {
  timeline: Array<{ timestamp: string; event: string; description: string }>
  currentVersion: number
  totalEvents: number
}
```

This reconstructs the complete chronological history of a knowledge entity:

1. **Creation** — when and how the knowledge was formed
2. **Lifecycle transitions** — all status changes with reasons
3. **Confidence evolution** — all confidence changes with reasons

The timeline is sorted chronologically, providing a complete view of how knowledge developed over time.

---

## Provenance Validation (Hallucination Prevention)

```typescript
function validateProvenance(knowledge: KnowledgeEntity): {
  valid: boolean
  issues: string[]
}
```

This function checks for complete provenance and is used for hallucination prevention:

| Check | Issue if Missing |
|-------|-----------------|
| Origin memory IDs | "No origin memory IDs" |
| Origin event IDs | "No origin event IDs" |
| Memory references | "No memory references" |
| Formation pipeline | "No formation pipeline trace" |
| Confidence history | "No confidence history" |
| Lifecycle history | "No lifecycle history" |
| Supporting memories | "Zero supporting memories" |

**Validation result:** 25/25 knowledge entities have valid provenance (100%).

---

## Consumer Access Logging

```typescript
function logConsumerAccess(
  knowledge: KnowledgeEntity,
  consumer: string,
  purpose: string,
  result: 'used' | 'referenced' | 'discarded'
): KnowledgeEntity
```

Every time a consumer accesses knowledge, the access is logged:

| Field | Description |
|-------|-------------|
| `consumer` | Which consumer accessed (e.g., 'hospitality-ai-copilot') |
| `timestamp` | When the access occurred |
| `purpose` | Why the knowledge was accessed |
| `result` | How the knowledge was used: used / referenced / discarded |

This provides:
- **Usage analytics**: Which knowledge is most/least used
- **Audit trail**: Who accessed what and when
- **Quality signals**: Knowledge that is consistently 'discarded' may need review

---

## Governance Principles

### Principle 1: No Knowledge Without Traceable Provenance
Every knowledge entity must trace back to specific events through specific memories. No knowledge exists from inference alone.

### Principle 2: Every Confidence Change is Recorded
Every time a knowledge entity's confidence changes, a snapshot is recorded with the score, level, all 7 factors, and a human-readable reason.

### Principle 3: Every Lifecycle Transition is Recorded
Every status change records the from-state, to-state, reason, evidence summary, and what triggered the transition.

### Principle 4: Consumer Access is Logged for Audit
Every consumer interaction with knowledge is logged with the consumer name, purpose, and result.

### Principle 5: Supersession is Explicit and Tracked
When knowledge supersedes another, both entities record the relationship via `supersededKnowledgeId` and `supersedingKnowledgeId`.

### Principle 6: Refutation Requires Stronger Evidence Than Establishment
Knowledge can only be refuted when contradictions exceed supporting evidence. The lifecycle enforces this through the `disputed` → `refuted` transition path.

---

## Governance Validation Results

| Check | Result |
|-------|--------|
| Audit records generated | ✅ PASSED |
| Evolution reconstruction | ✅ PASSED |
| Version tracking (all version ≥ 1) | ✅ PASSED |
| Timeline persistence | ✅ PASSED |
| **Total** | **4/4 PASSED** |
