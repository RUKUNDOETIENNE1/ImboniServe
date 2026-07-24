# Hospitality Knowledge™ — Discovery Engine

**Module:** Hospitality Knowledge™ v1.0
**Platform:** Hospitality Intelligence Platform v2.2.0
**Date:** 2026-07-23

---

## Overview

The Discovery Engine implements the explicit Knowledge Formation Pipeline that transforms Hospitality Memory™ into Knowledge through 8 auditable stages. Every stage is recorded in the knowledge entity's provenance for full traceability.

---

## The Formation Pipeline

```
┌─────────────────────────────────────────────────────────┐
│                 KNOWLEDGE FORMATION PIPELINE             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Stage 1: Memory Ingestion                              │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Filter memories to eligible statuses             │   │
│  │ (excludes: archived, retired, conflict_review)   │   │
│  └──────────────────────┬───────────────────────────┘   │
│                         ↓                               │
│  Stage 2: Memory Clustering                             │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Group by category → cluster by thematic          │   │
│  │ similarity (Jaccard ≥ 0.25)                      │   │
│  │ Compute cluster coherence score                  │   │
│  └──────────────────────┬───────────────────────────┘   │
│                         ↓                               │
│  Stage 3: Pattern Detection                             │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Detect 6 pattern types:                          │   │
│  │ • Frequency  • Temporal  • Correlation           │   │
│  │ • Business Rule  • Trend  • Threshold            │   │
│  └──────────────────────┬───────────────────────────┘   │
│                         ↓                               │
│  Stage 4: Evidence Evaluation                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Assess 7 evidence factors:                       │   │
│  │ • Diversity  • Consistency  • Volume             │   │
│  │ • Memory Confidence  • Cross-Validation          │   │
│  │ • Recency  • Contradiction Penalty               │   │
│  └──────────────────────┬───────────────────────────┘   │
│                         ↓                               │
│  Stage 5: Candidate Formation                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Transform evaluated patterns into                │   │
│  │ KnowledgeCandidate objects                       │   │
│  └──────────────────────┬───────────────────────────┘   │
│                         ↓                               │
│  Stage 6: Knowledge Validation                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Validate against multi-memory evidence           │   │
│  │ Hallucination prevention: verify all memories    │   │
│  │ Detect contradictions with existing knowledge    │   │
│  └──────────────────────┬───────────────────────────┘   │
│                         ↓                               │
│  Stage 7: Knowledge Establishment                       │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Promote validated candidates to                  │   │
│  │ established/canonical status                     │   │
│  │ Apply lifecycle transitions                      │   │
│  └──────────────────────┬───────────────────────────┘   │
│                         ↓                               │
│  Stage 8: Graph Integration                             │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Integrate into knowledge graph                   │   │
│  │ Detect 13 relationship types                     │   │
│  │ Build hierarchies and dependencies               │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Stage Details

### Stage 1: Memory Ingestion

Filters memories to those eligible for knowledge formation.

**Eligible statuses:** All except `archived`, `retired`, `conflict_review`

**Rationale:** Archived and retired memories represent outdated patterns. Conflict-review memories are under investigation and shouldn't form knowledge until resolved.

**Output:** Filtered list of eligible memories.

### Stage 2: Memory Clustering

Groups related memories by category and thematic similarity.

**Algorithm:**
1. Group memories by category (first pass)
2. Within each category, cluster by title/description similarity (Jaccard ≥ 0.25)
3. Merge small clusters (< 2 memories) into a "misc" cluster per category

**Cluster coherence:** Average pairwise Jaccard similarity of all memory pairs in the cluster.

**Output:** List of `MemoryCluster` objects with theme, coherence score, and member memories.

### Stage 3: Pattern Detection

Extracts patterns from memory clusters using 6 detection algorithms.

#### Pattern Type 1: Frequency
- **Trigger:** Cluster size ≥ 3 OR total observations ≥ 5
- **Description:** Recurring pattern observed N times
- **Strength:** min(1, max(clusterSize, totalObs/3) / 8)

#### Pattern Type 2: Temporal
- **Trigger:** Day or time concentration ≥ 40% of total observations
- **Description:** Pattern concentrates on specific day/time
- **Strength:** max(dayConcentration, timeConcentration)

#### Pattern Type 3: Correlation
- **Trigger:** Shared context tags across ≥ 50% of cluster memories
- **Description:** Pattern correlates with specific contexts
- **Strength:** min(1, sharedContexts / 3)

#### Pattern Type 4: Business Rule
- **Trigger:** Memory with `business_rule` status in cluster
- **Description:** Business rule pattern
- **Strength:** 0.9, Confidence: 0.85

#### Pattern Type 5: Trend
- **Trigger:** Confidence delta between first and second half of memories > 0.1
- **Description:** Increasing/decreasing confidence trend
- **Strength:** min(1, |delta| * 2)

#### Pattern Type 6: Threshold
- **Trigger:** Numeric values in memory text with standard deviation / mean < 0.2
- **Description:** Operational threshold around value X
- **Strength:** min(1, 1 - stdDev/avg)

### Stage 4: Evidence Evaluation

Assesses the quality and diversity of evidence behind each pattern.

| Factor | Computation | Scale |
|--------|------------|-------|
| **Diversity** | Based on supporting memory count | 1 mem = 0.1, 2 = 0.3, 3 = 0.5, 5 = 0.7, 8+ = 0.9, 12+ = 1.0 |
| **Consistency** | supporting / (supporting + contradicting) | 95%+ = 1.0, 85%+ = 0.85, 70%+ = 0.6, 50%+ = 0.3 |
| **Volume** | Based on total observations | <5 = 0.2, <10 = 0.4, <20 = 0.6, <50 = 0.8, <100 = 0.9, 100+ = 1.0 |
| **Memory Confidence** | Average confidence of supporting memories | 0..1 |
| **Cross-Validation** | (distinctTimeWindows/4 + distinctContexts/3) / 2 | 0..1 |
| **Contradiction Penalty** | Based on contradicting/supporting ratio | 0% = 0, <10% = 0.1, <25% = 0.3, <50% = 0.6, 50%+ = 0.9 |
| **Recency** | 1 - daysSinceLastObserved / 60 | 0..1 |

### Stage 5: Candidate Formation

Transforms evaluated patterns into `KnowledgeCandidate` objects.

**Filter:** Evidence diversity ≥ 0.1 (or business_rule pattern type)

**Output:** Knowledge candidates with:
- Title, statement, summary, description
- Category (inherited from cluster)
- Supporting and contradicting memory IDs
- Evidence metrics
- Preliminary confidence
- Business impact and level
- Tags

### Stage 6: Knowledge Validation

Validates candidates against strict evidence requirements.

**Hallucination Prevention:**
1. Verify all supporting memories exist in the database
2. Reject candidates with zero verifiable evidence
3. Every knowledge must trace to specific memory IDs
4. Every memory must trace to specific event IDs

**Contradiction Detection:**
- Compare new knowledge with existing knowledge in same category
- Detect conflicting trends (opposing directions)
- Detect conflicting thresholds (different values)
- Record conflicts as `KnowledgeConflict` entities

**Output:** Validated `KnowledgeEntity` objects with full provenance.

### Stage 7: Knowledge Establishment

Promotes validated candidates through the lifecycle.

**Initial Status Assignment:**
- `established`: ≥3 supporting memories, high confidence
- `provisional`: ≥2 supporting memories, medium confidence
- `candidate`: otherwise

**Lifecycle Re-evaluation:**
- All existing knowledge is re-evaluated for lifecycle transitions
- Contradictions may trigger `disputed` status
- Evidence receding may trigger `deprecated` status

### Stage 8: Graph Integration

Integrates established knowledge into the knowledge graph.

**Relationship Detection:**
- `similar_to`: Textual similarity ≥ 30%
- `correlates_with`: Shared supporting memories
- `precedes`: Temporal precedence + shared context
- `contradicts`: Opposing trends or thresholds
- `extends`: One statement encompasses another
- `enables`: Cross-category high-impact relationships
- `hierarchy_child`: Specific knowledge specializes general knowledge

---

## Hallucination Prevention

The Discovery Engine implements strict hallucination prevention:

### Principle 1: Evidence-Backed Formation
No knowledge is formed from inference alone. Every knowledge candidate must be backed by specific, verifiable memories.

### Principle 2: Full Provenance Chain
Every knowledge entity records:
- Origin memory IDs
- Origin event IDs
- Memory references with contribution and weight
- Complete 8-stage formation pipeline trace

### Principle 3: Contradiction Surfacing
Contradictions are detected and recorded, not hidden. Conflicting knowledge is marked as `disputed` and conflicts are tracked for resolution.

### Principle 4: Verifiable Evidence
The validation engine verifies that all supporting memories actually exist in the database before forming knowledge. Candidates with unverifiable evidence are rejected.

---

## Pipeline Provenance

Every stage of the pipeline is recorded in `provenance.formationPipeline`:

```typescript
interface KnowledgeFormationStage {
  stage: 'memory_ingestion' | 'memory_clustering' | 'pattern_detection' |
         'evidence_evaluation' | 'candidate_formation' | 'knowledge_validation' |
         'knowledge_establishment' | 'graph_integration'
  timestamp: string
  inputCount: number
  outputCount: number
  description: string
  metadata?: Record<string, unknown>
}
```

This provides:
- **Auditability**: Every knowledge can be traced through all 8 stages
- **Debugging**: Pipeline issues can be isolated to specific stages
- **Transparency**: The formation process is fully visible
- **Compliance**: Evidence-based decision making is documented

---

## Configuration and Thresholds

| Parameter | Value | Location |
|-----------|-------|----------|
| Memory similarity threshold | 0.25 (Jaccard) | `clusterMemories()` |
| Minimum cluster size for patterns | 2 (or 3+ observations) | `detectPatterns()` |
| Day/time concentration threshold | 40% | `detectTemporalPattern()` |
| Trend delta threshold | 0.1 | `detectTrendPattern()` |
| Threshold stdDev/mean ratio | 0.2 | `detectThresholdPattern()` |
| Candidate evidence diversity minimum | 0.1 | `formCandidates()` |
| Confidence weight: diversity | 0.22 | `confidence-engine.ts` |
| Confidence weight: consistency | 0.22 | `confidence-engine.ts` |
| Confidence weight: cross-validation | 0.14 | `confidence-engine.ts` |
| Contradiction penalty multiplier | 1.5x | `confidence-engine.ts` |
| Certain status minimum diversity | 0.5 | `confidence-engine.ts` |
| Certain status minimum cross-validation | 0.3 | `confidence-engine.ts` |
