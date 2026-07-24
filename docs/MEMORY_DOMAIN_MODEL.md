# Memory Domain Model

Module: Hospitality MemoryTM  
Purpose: Canonical domain model for hospitality operational memory

---

## 1) Domain Boundary

Hospitality MemoryTM owns **durable operational learning artifacts**, not raw event storage.

It sits between:
- event/intelligence producers (Heart Pulse + certified modules)
- reasoning/knowledge consumers (Hospitality KnowledgeTM, AI CopilotTM, future modules)

---

## 2) Core Entities

## `OperationalMemory` (Aggregate Root)

Represents a reusable learned operational fact or pattern.

Primary attributes:
- Identity: `id`, `title`
- Classification: `category`, `status`, `tags`
- Explanation: `description`, `businessImpact`, `recommendedAction`
- Reliability: `confidence`, `confidenceScore`
- Evidence: `evidence[]`, `observationCount`, `firstObserved`, `lastObserved`
- Context: temporal/environmental dimensions
- Linkage: `relatedMemories[]`
- Audit fields: `createdAt`, `updatedAt`

Ownership:
- Owned by Hospitality MemoryTM
- Should be queryable by all intelligence modules
- Should be immutable-by-default except lifecycle/evidence evolution

---

## `MemoryRelationship`

Directed link between two memories:
- `fromMemoryId`
- `toMemoryId`
- `relationshipType`
- `strength`
- `description`

Role:
- Enables chain reasoning and multi-memory context retrieval

Current relationship vocabulary:
- causes
- correlates
- prevents
- enables
- similar

---

## `MemoryTimelineEntry`

Chronological lifecycle evidence:
- `date`
- `memoryId`
- `event` (created/observed/confirmed/elevated/archived/resolved)
- `description`
- `metadata`

Role:
- Explainability and audit trail

---

## `Observation`

Transient pre-memory signal extracted from operations:
- pattern candidate
- impact signal
- contextual tags
- evidence fragment

Role:
- Input to memory formation rules

---

## 3) Category Taxonomy

Current implemented categories:
- operational
- product
- customer
- kitchen
- service
- inventory
- financial
- strategic

Hospitality adaptation:
- taxonomy is domain-agnostic enough for restaurant, cafÃ©, bar, hotel, bakery, resort, lounge, food court, hospitality groups
- extension mechanism is enum expansion + category-based actions

---

## 4) Lifecycle State Machine

Declared states:
- observed
- emerging
- confirmed
- business_rule
- seasonal
- archived
- resolved

Implemented promotion transitions:

```text
observed --(obs >= 2)--> emerging
emerging --(obs >= 4)--> confirmed
confirmed --(obs >= 10)--> business_rule
```

Deferred / not implemented transitions:
- seasonal classification trigger
- archive trigger (staleness or invalidation)
- resolved trigger (successful corrective action)
- demotion (confidence collapse or contradictory evidence)

---

## 5) Domain Hierarchy (Conceptual)

```text
HospitalityOperationalMemory
â””â”€â”€ OperationalMemory [aggregate]
    â”œâ”€â”€ Classification
    â”‚   â”œâ”€â”€ Category
    â”‚   â””â”€â”€ Status
    â”œâ”€â”€ Reliability
    â”‚   â”œâ”€â”€ Confidence level
    â”‚   â””â”€â”€ Confidence score
    â”œâ”€â”€ Evidence
    â”‚   â”œâ”€â”€ Evidence entries
    â”‚   â”œâ”€â”€ Observation count
    â”‚   â””â”€â”€ Temporal anchors
    â”œâ”€â”€ Context
    â”‚   â”œâ”€â”€ Day-of-week
    â”‚   â”œâ”€â”€ Time-of-day
    â”‚   â”œâ”€â”€ Season
    â”‚   â””â”€â”€ Weather
    â”œâ”€â”€ Actionability
    â”‚   â”œâ”€â”€ Business impact
    â”‚   â””â”€â”€ Recommended action
    â””â”€â”€ Relationships
        â””â”€â”€ MemoryRelationship edges
```

---

## 6) Ownership Model

### Creator ownership (current)
- Hospitality MemoryTM service builds memory records from events.

### Creator ownership (target)
- Hospitality MemoryTM + certified modules emit standardized observations to memory ingestion API.

### Consumer ownership (target)
- Read-only memory retrieval contract for:
  - Daily BriefingsTM
  - Service IntelligenceTM
  - Kitchen IntelligenceTM
  - Menu IntelligenceTM
  - Hospitality KnowledgeTM
  - AI CopilotTM

---

## 7) Extensibility Model

Supported extension vectors:
- New memory categories
- New relationship types
- New lifecycle states
- New contextual dimensions (e.g., outlet, weather severity, event class)

Required to preserve forward compatibility:
1. stable memory IDs
2. versioned schema for memory payloads
3. append-only evidence/provenance logs
4. migration-safe lifecycle mapping

---

## 8) Compatibility with Future Hospitality Verticals

No architecture rewrite is required to support:
- restaurants
- cafÃ©s
- bars
- bakeries
- hotels
- resorts
- lounges
- food courts
- hospitality groups

Reason:
- memory core uses operationally neutral entities (memory + relationship + evidence + context)
- category/action fields are extensible and domain-labeled, not hard-coded to a single venue type

Constraint:
- actual category coverage quality depends on upstream observation extraction quality and persistence, which is currently partial.

---

## 9) Domain Model Readiness Summary

Strength:
- Domain schema is sufficiently expressive for long-term organizational memory.

Gap:
- Runtime implementation (formation/persistence/provenance/governance) does not yet fully operationalize the model.

Result:
- **Model readiness: high**
- **Operational readiness: medium-low (pending critical implementation hardening)**



