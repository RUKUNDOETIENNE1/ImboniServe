# Hospitality MemoryTM Provenance Model

Version: v2.1.2  
Purpose: Explainability and traceability contract for every memory record

---

## 1. Provenance Principle

Every memory must answer:

1. Why does this exist?
2. What evidence supports it?
3. Which events produced it?
4. How confident are we and how has confidence changed?
5. How did lifecycle state evolve?
6. Which consumers used this memory?

---

## 2. Provenance Structure

Provenance is embedded in each `HospitalityMemoryEntity`:

- `originEventIds[]`
- `originModules[]`
- `formationRule`
- `formationRuleVersion`
- `observationRefs[]`
- `confidenceHistory[]`
- `lifecycleHistory[]`
- `consumerAccessHistory[]`

Type definition:
- <ref_snippet file="C:\Dev\ImboniResto\src\lib\hospitality-memory\types.ts" lines="66-90" />

---

## 3. Observation Provenance

Each observation reference records:
- event ID
- event type
- timestamp
- source module
- evidence text
- polarity
- impact score
- context

This allows memory-level lineage back to Heart Pulse event identity.

---

## 4. Confidence Provenance

Each confidence update stores:
- score and confidence level
- weighted factors:
  - frequency
  - consistency
  - recency
  - impact
  - evidence
  - relationship
  - contradiction penalty
- reasoning text
- timestamp

Engine:
- <ref_file file="C:\Dev\ImboniResto\src\lib\hospitality-memory\confidence-engine.ts" />

---

## 5. Lifecycle Provenance

Every state change records:
- from status
- to status
- transition reason
- triggering observation IDs
- timestamp

Lifecycle engine:
- <ref_file file="C:\Dev\ImboniResto\src\lib\hospitality-memory\lifecycle-engine.ts" />

---

## 6. Relationship Provenance

Relationships persist as first-class records:
- from memory ID
- to memory ID
- type (`causes`, `correlates`, `enables`, `prevents`, `similar`)
- strength
- evidence
- first/last observed
- observation count

Persistence:
- <ref_file file="C:\Dev\ImboniResto\src\lib\hospitality-memory\repository.ts" />

---

## 7. Conflict Provenance

Contradictory evidence generates conflict records:
- memoryAId
- memoryBId (or virtual conflicting key)
- reason
- status lifecycle (`open`, `resolved`, `dismissed`)
- timestamps

Formation conflict detection:
- <ref_snippet file="C:\Dev\ImboniResto\src\lib\hospitality-memory\formation-engine.ts" lines="242-272" />

---

## 8. Provenance Flow

```text
Heart Pulse Event
 -> Observation Candidate
 -> Observation Ref
 -> Memory Formation / Merge
 -> Confidence Snapshot + Lifecycle Transition
 -> Persisted Memory + Relationship + Timeline + Conflict
 -> Consumer Retrieval
```

---

## 9. Provenance Guarantees

Guaranteed by implementation:
- deterministic memory identity
- event-level origin references
- confidence evolution history
- lifecycle transition history
- durable relationship evidence

Deferred minor enhancement:
- explicit write-time consumer access logging hooks for all module consumers (model exists, can be incrementally wired).

---

## 10. Example Explainability Trace

Example memory answer:

- Why exists: repeated `ORDER_CREATED` frequency + temporal peak candidate
- Evidence: 24 supporting event refs in observation history
- First observed: `firstObserved`
- Last observed: `lastObserved`
- Confidence evolution: snapshot list in `confidenceHistory`
- Lifecycle evolution: transitions in `lifecycleHistory`
- Related knowledge: relationship edges by memory ID

