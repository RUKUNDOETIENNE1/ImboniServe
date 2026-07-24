# Hospitality Operational Memory Architecture

Version: ImboniServe v2.1.1  
Module: Hospitality MemoryTM (Hospitality Operational Memory Engine)  
Audit Date: 2026-07-23  
Status: Architecture audited for Hospitality KnowledgeTM readiness

---

## 1) Architectural Intent

Hospitality MemoryTM is intended to be the long-term organizational memory layer for hospitality operations.  
Its expected role is to convert operational signals into durable knowledge that future modules can retrieve and reason over.

Intended guiding question:

> What has this business learned, how certain are we, why do we believe it, and how should future intelligence use that knowledge?

---

## 2) Component Architecture (Current Implementation)

### Core Components

1. `RestaurantMemoryService`  
   - Orchestrates event retrieval, observation extraction, memory formation/evolution, relationships, timeline, and recall.
   - Extends `BaseIntelligenceService`.

2. `MemoryAggregator`  
   - Extracts observations from operational events.
   - Builds pairwise memory relationships.
   - Provides lexical search and morning recall helpers.

3. `MemoryFormationEngine`  
   - Applies formation rules.
   - Creates and evolves memory records.
   - Assigns confidence, impact, lifecycle state, and actions.

4. `MemoryDashboardBuilder`  
   - Builds memory dashboard sections from report payload.
   - Extends `BaseDashboardBuilder`.

5. API endpoint  
   - `POST /api/restaurant-memory/generate`
   - Uses platform endpoint factory.

---

## 3) Data Flow (Current)

```text
ReplayEvent table
  -> getOperationalEvents() [platform integration helper]
  -> RestaurantMemoryService.generateReport()
  -> MemoryAggregator.extractObservations()
  -> MemoryFormationEngine.formMemories()
  -> in-memory Map store (service instance scope)
  -> relationships + timeline + morning recall
  -> report + dashboard payload
```

Important implementation constraints in current flow:
- Memory persistence is in process memory (`Map`) and scoped to service instance lifetime.
- Service instances are created per API request by the endpoint factory.
- No dedicated persistent memory table exists for Hospitality MemoryTM.

---

## 4) Domain Objects (Current)

### `OperationalMemory`
Contains:
- identity (`id`, `title`, `description`)
- categorization (`category`, `status`, `tags`)
- confidence (`confidence`, `confidenceScore`)
- evidence (`evidence`, observation counters, timestamps)
- impact (`businessImpact`, `impactLevel`, action fields)
- context (`dayOfWeek`, `timeOfDay`, `season`, `weather`)
- relation references (`relatedMemories`)

### `MemoryRelationship`
- `fromMemoryId`, `toMemoryId`
- `relationshipType` (`causes`, `correlates`, `prevents`, `enables`, `similar`)
- `strength`, `description`

### `MemoryTimelineEntry`
- lifecycle event audit trail entry (`created`, `observed`, `confirmed`, `elevated`, `archived`, `resolved`)

---

## 5) Lifecycle Model (Current)

Declared lifecycle states:
- observed
- emerging
- confirmed
- business_rule
- seasonal
- archived
- resolved

Implemented transitions:
- observed -> emerging (>= 2 observations)
- emerging -> confirmed (>= 4 observations)
- confirmed -> business_rule (>= 10 observations)

Not implemented in transition logic:
- seasonal promotion rules
- archived rules
- resolved rules
- demotion/regression rules
- conflict arbitration between contradictory memories

---

## 6) Confidence Model (Current)

### Formation-time confidence
- Rule confidence function returns `min(1.0, observations * 0.25)`
- Memory creation requires confidence >= 0.5

### Evolution-time confidence
- `newConfidence = min(1.0, current + min(0.3, observationCount * 0.03))`

### Key architectural caveat
- `confidenceScore` is documented as 0-100 in type comments, but algorithm uses 0-1 scale.
- Current weighting only depends on observation count; it does not incorporate evidence quality, source reliability, recency decay, or contradictory evidence.

---

## 7) Retrieval Model (Current)

### Contextual retrieval
Current filters prioritize:
- matching day of week
- matching time of day
- business rules
- critical/high impact memories

### Morning recall
Outputs:
- whatToRemember
- lessonsFromSimilarDays
- mistakesToAvoid
- provenBestPractices
- opportunitiesBasedOnExperience

### Search
- lexical matching on title, description, category, tags
- weighted relevance ranking
- no semantic embedding / ontology / synonym handling

---

## 8) Relationship Model (Current)

Relationship inference currently uses simple heuristics:
- same category => `similar`
- shared context => `correlates`
- kitchen -> service or inventory -> product => `causes`

Limitations:
- no graph persistence
- no deduplication of repeated relationship edges
- no confidence calibration from evidence volume
- no chain-level reasoning artifacts (only pairwise links)

---

## 9) Integration Boundaries

### Implemented
- Platform extension points:
  - base service
  - base dashboard builder
  - API factory
  - runtime validator

### Not implemented yet
- Memory writeback from other certified modules
- Memory reads by other certified modules
- Dedicated memory search endpoint
- Dedicated timeline endpoint
- durable storage model and historical provenance store

---

## 10) Architectural Strengths

1. Clear typed memory domain with explicit lifecycle and impact dimensions.
2. Modular decomposition (formation, aggregation, orchestration, presentation).
3. Platform conformance at service/dashboard/API layer.
4. Context-aware recall primitives (day/time and impact aware).
5. Relationship schema already present and extensible.

---

## 11) Material Architectural Gaps

These are gaps that materially affect Hospitality KnowledgeTM readiness:

1. No durable persistence for operational memory entities.
2. Event filter behavior currently prevents event ingestion in normal flow.
3. Observation field mismatch with normalized event model (`eventType`/`metadata` vs `type`/`data`).
4. Formation rule ordering and thresholds can suppress intended category-specific memory formation.
5. Provenance is incomplete (no originating event IDs, no source evidence IDs, no consumer trace).
6. Lifecycle governance for archive/resolution/regression is not implemented.
7. Search/timeline are not exposed as dedicated consumer APIs.

---

## 12) Extensibility Assessment

### Extensible by design
- category enum can evolve
- relationship types can be expanded
- memory status model can evolve
- request/response schema supports filters and timeline toggles

### Not yet extensible in operations
- no storage migration model for memory versioning
- no backward-compatible provenance schema
- no graph persistence contract for relationships
- no cross-module ingestion contract

---

## 13) Architecture Verdict

Hospitality MemoryTM has a strong architectural skeleton and clear domain intent, but the operational memory layer is not yet complete enough to be the authoritative long-term knowledge substrate.

It is currently best described as:

> a promising memory architecture prototype with platform-conformant scaffolding, not yet a fully durable, governable organizational memory layer.

See `MEMORY_READINESS_AUDIT.md` for risk classification and readiness decision.



