# Hospitality Knowledge™ — Domain Model

**Module:** Hospitality Knowledge™ v1.0
**Platform:** Hospitality Intelligence Platform v2.2.0
**Date:** 2026-07-23

---

## Overview

Knowledge is validated, synthesized understanding derived from multiple memories. It represents durable business truths that survive staff turnover and time. Every knowledge entity has full provenance tracing back to specific events through specific memories.

---

## Knowledge Entity (Aggregate Root)

The `KnowledgeEntity` is the aggregate root of the knowledge domain model.

### Identity Fields
| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier (SHA-256 hash) |
| `businessId` | string | Business scope |
| `version` | number | Version number (increments on update) |
| `fingerprint` | string | Deterministic fingerprint for deduplication |

### Content Fields
| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Human-readable title |
| `summary` | string | One-line truth statement |
| `description` | string | Detailed explanation |
| `category` | KnowledgeCategory | Domain category (14 options) |
| `statement` | string | The actual knowledge truth statement |

### Lifecycle Fields
| Field | Type | Description |
|-------|------|-------------|
| `status` | KnowledgeStatus | Lifecycle state (8 options) |
| `confidence` | KnowledgeConfidenceLevel | Confidence level (5 options) |
| `confidenceScore` | number | Numeric confidence (0..1) |

### Evidence Fields
| Field | Type | Description |
|-------|------|-------------|
| `supportingMemoryCount` | number | Memories supporting this knowledge |
| `contradictingMemoryCount` | number | Memories contradicting this knowledge |
| `totalEvidenceCount` | number | Total evidence (supporting + contradicting) |

### Temporal Fields
| Field | Type | Description |
|-------|------|-------------|
| `firstObserved` | string | When underlying pattern was first seen |
| `lastValidated` | string | When knowledge was last re-validated |
| `establishedAt` | string | When knowledge reached 'established' status |
| `updatedAt` | string | Last update timestamp |

### Business Context Fields
| Field | Type | Description |
|-------|------|-------------|
| `businessImpact` | string | Description of business impact |
| `impactLevel` | enum | low / medium / high / critical |
| `applicability` | KnowledgeApplicability | Scope and conditions |
| `recommendedActions` | KnowledgeRecommendedAction[] | Actionable recommendations |
| `operationalRules` | string[] | Derived operational rules |

### Graph Fields
| Field | Type | Description |
|-------|------|-------------|
| `relatedKnowledgeIds` | string[] | IDs of related knowledge |
| `supersededKnowledgeId` | string? | Knowledge this supersedes |
| `supersedingKnowledgeId` | string? | Knowledge that supersedes this |

### Provenance Fields
| Field | Type | Description |
|-------|------|-------------|
| `provenance` | KnowledgeProvenance | Full provenance chain |
| `tags` | string[] | Retrieval tags |
| `createdAt` | string | Creation timestamp |

---

## Knowledge Categories (14)

| Category | Description |
|----------|-------------|
| `operational` | How the business runs day-to-day |
| `customer` | Who customers are and what they want |
| `staff` | Workforce patterns and performance truths |
| `menu` | Product/menu performance understanding |
| `financial` | Revenue, cost, and margin truths |
| `business` | Strategic business-level understanding |
| `kitchen` | Kitchen operational truths |
| `service` | Service quality truths |
| `inventory` | Supply chain and stock truths |
| `supplier` | Supplier relationship truths |
| `environmental` | External factor impacts (weather, events, season) |
| `marketing` | Campaign and promotion effectiveness truths |
| `competitive` | Market position understanding |
| `regulatory` | Compliance and regulatory truths |

---

## Knowledge Lifecycle (8 States)

```
candidate → provisional → established → canonical
                ↓             ↓              ↓
            disputed      deprecated    deprecated
                ↓             ↓              ↓
            refuted       retired        retired
```

### State Descriptions

| State | Description | Entry Criteria |
|-------|-------------|----------------|
| `candidate` | Proposed by discovery engine | Pattern detected with evidence |
| `provisional` | Passed initial validation | ≥2 supporting memories, medium+ confidence |
| `established` | Validated with multi-memory evidence | ≥3 supporting memories, high+ confidence |
| `canonical` | Elevated as core business truth | Very high confidence, high/critical impact, no contradictions |
| `deprecated` | Superseded by newer knowledge | Superseding knowledge exists or evidence receded |
| `retired` | No longer relevant | 90 days after deprecation |
| `disputed` | Contradictory evidence detected | Contradictions ≥ 50% of support |
| `refuted` | Invalidated by stronger evidence | Contradictions exceed support while disputed |

### Transition Rules

1. **Candidate → Provisional**: ≥2 supporting memories, medium+ confidence
2. **Provisional → Established**: ≥3 supporting memories, high+ confidence
3. **Established → Canonical**: Very high confidence, high/critical impact, no contradictions
4. **Any → Disputed**: Contradictions ≥ 50% of supporting evidence
5. **Disputed → Refuted**: Contradictions exceed supporting evidence
6. **Disputed → Established**: Contradictions recede below 30% of support
7. **Canonical → Deprecated**: Superseded by newer knowledge
8. **Deprecated → Retired**: 90-day grace period elapsed
9. **Established → Deprecated**: Supporting evidence recedes below 2 memories

---

## Confidence Model

### 5 Confidence Levels

| Level | Score Range | Requirements |
|-------|------------|--------------|
| `low` | 0.00 - 0.49 | Basic evidence |
| `medium` | 0.50 - 0.67 | Some multi-memory evidence |
| `high` | 0.68 - 0.81 | Strong multi-memory evidence |
| `very_high` | 0.82 - 0.94 | Cross-validated, no contradictions |
| `certain` | 0.95 - 1.00 | Maximum diversity, consistency, cross-validation, no contradictions |

### 7 Confidence Factors

| Factor | Weight | Description |
|--------|--------|-------------|
| `evidenceDiversity` | 0.22 | How many distinct memories support |
| `evidenceConsistency` | 0.22 | Agreement across sources |
| `evidenceRecency` | 0.12 | Freshness of supporting evidence |
| `evidenceVolume` | 0.10 | Total observations behind knowledge |
| `memoryConfidence` | 0.12 | Average confidence of supporting memories |
| `crossValidation` | 0.14 | Validated across time/context windows |
| `relationshipSupport` | 0.08 | Support from knowledge graph |

### Hard Ceilings (Hallucination Prevention)

- **Contradictions > 5%** → Score capped at 0.85 (cannot reach 'certain')
- **Diversity < 50%** → Score capped at 0.70 (cannot reach 'very_high')
- **Cross-validation < 30%** → Score capped at 0.75 (cannot reach 'very_high')

---

## Evidence Model

### KnowledgeMemoryRef
Reference to a memory that supports knowledge:
- `memoryId`, `memoryTitle`, `memoryCategory`, `memoryConfidence`, `memoryStatus`
- `contribution` — how this memory supports the knowledge
- `weight` — 0..1, how strongly it supports
- `firstContributed`, `lastContributed`

### KnowledgeCrossRef
Reference to another knowledge entity:
- `knowledgeId`, `knowledgeTitle`
- `relationship`: supports / contradicts / extends / depends_on / contextualizes
- `description`

---

## Provenance Model

Full provenance chain from events to knowledge:

```
originEventIds        → Heart Pulse events
originMemoryIds       → Hospitality Memory entities
originModules         → Source intelligence modules
formationPipeline     → 8-stage trace with input/output counts
memoryRefs            → Detailed memory references
crossRefs             → Cross-references to other knowledge
confidenceHistory     → All confidence snapshots over time
lifecycleHistory      → All lifecycle transitions
consumerAccessHistory → All consumer access logs
formationRule         → Rule that formed this knowledge
validationRule        → Rule that validated this knowledge
```

---

## Knowledge Relationship Types (13)

| Type | Description |
|------|-------------|
| `causes` | A causes B |
| `caused_by` | A is caused by B |
| `depends_on` | A requires B to be true |
| `enables` | A makes B possible |
| `prevents` | A stops B from happening |
| `correlates_with` | A and B occur together |
| `contradicts` | A and B cannot both be true |
| `extends` | A is a broader version of B |
| `specializes` | A is a specific case of B |
| `precedes` | A happens before B temporally |
| `hierarchy_parent` | A is parent of B in taxonomy |
| `hierarchy_child` | A is child of B in taxonomy |
| `similar_to` | A and B are conceptually similar |

---

## Knowledge Conflict Model

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier |
| `knowledgeAId` | string | First knowledge entity |
| `knowledgeBId` | string | Second knowledge entity |
| `conflictType` | enum | contradiction / temporal / scope / confidence |
| `description` | string | Conflict description |
| `status` | enum | open / resolved_a / resolved_b / resolved_merge / unresolvable |
| `resolution` | string? | How conflict was resolved |
| `resolvedAt` | string? | When conflict was resolved |

---

## Formation Pipeline Intermediate Types

### MemoryCluster
- `clusterKey`, `category`, `memoryIds`, `memories`
- `clusterTheme` — derived from common words
- `coherenceScore` — 0..1, how well memories align

### KnowledgePattern
- `patternType`: frequency / temporal / correlation / causal / trend / threshold / anomaly / business_rule
- `supportingMemoryIds`, `strength`, `confidence`
- `metadata` — pattern-specific data

### KnowledgeCandidate
- `fingerprint`, `title`, `statement`, `summary`, `description`
- `patternIds`, `supportingMemoryIds`, `contradictingMemoryIds`
- `evidenceDiversity`, `evidenceConsistency`, `evidenceVolume`
- `preliminaryConfidence`, `businessImpact`, `impactLevel`, `tags`
