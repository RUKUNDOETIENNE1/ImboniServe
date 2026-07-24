# Memory Governance

Module: Hospitality MemoryTM  
Purpose: Governance policy for formation, evolution, confidence, retention, provenance, and operational trust

---

## 1) Governance Objectives

Memory governance ensures Hospitality MemoryTM is:
- trustworthy
- explainable
- auditable
- conflict-aware
- safe for long-term reasoning consumers (Hospitality KnowledgeTM, AI CopilotTM)

---

## 2) Governance Scope

Applies to:
- memory formation
- memory updates/evolution
- confidence management
- duplicate/conflict handling
- retention/archival
- provenance
- consumer access patterns

---

## 3) Ownership Policy

### Current ownership
- Memory creation and evolution are owned by `RestaurantMemoryService`.
- No cross-module write contract exists yet.

### Governance requirement
- Maintain single-writer policy for canonical memory records (Hospitality Memory engine).
- Allow multi-producer observations via validated ingestion contract.
- Keep consumer access read-only (except explicit manager review workflows).

---

## 4) Formation Policy

A memory must satisfy all:
1. Observation eligibility: derived from operationally relevant evidence.
2. Confidence threshold: minimum score threshold.
3. Impact requirement: explicit business impact classification.
4. Explainability requirement: reason and evidence must be stored.

### Anti-noise safeguards (required)
- minimum distinct observation windows (not same instant duplicates)
- source quality weighting (event source/module trust)
- suppression of low-signal outliers
- dedupe by deterministic memory signature

Current state:
- Thresholding exists but deterministic dedupe and source weighting are not complete.

---

## 5) Lifecycle Governance

Canonical states:
- observed
- emerging
- confirmed
- business_rule
- seasonal
- archived
- resolved

Required lifecycle controls:
1. Promotion rules (already partially implemented)
2. Demotion/regression rules (missing)
3. Resolution rules (missing)
4. Archive rules by staleness + inactivity (missing)
5. Re-activation rules for archived memories (missing)

Rule transparency:
- every transition must emit timeline entry
- transition reason must be recorded in metadata

---

## 6) Confidence Governance

Confidence must be:
- bounded and normalized
- explainable
- monotonic only when evidence quality improves
- reducible on contradiction/staleness

Required confidence inputs:
1. observation frequency
2. recency decay
3. source reliability
4. evidence diversity
5. contradiction penalties

Current state:
- confidence primarily observation-count based.
- contradiction and decay handling are missing.
- documented scale consistency needs alignment.

---

## 7) Duplicate Prevention Policy

Required:
- stable memory fingerprint for dedupe candidate detection
- merge strategy for equivalent memories
- duplicate conflict queue for manual review where auto-merge confidence is low

Current state:
- duplicate prevention is not robust.
- memory matching logic is heuristic string inclusion.

---

## 8) Conflict Handling Policy

Conflict types:
1. contradictory memories (e.g., â€œFriday demand upâ€ vs â€œFriday demand downâ€)
2. action conflicts (opposite recommendations)
3. confidence conflicts (same claim, different confidence)

Required conflict process:
- mark both memories with conflict references
- lower trust pending resolution
- allow manager confirmation workflow
- preserve full history (no destructive overwrite)

Current state:
- no explicit conflict detection or conflict state model.

---

## 9) Retention & Archival Policy

Retention classes:
- active: observed/emerging/confirmed/business_rule
- dormant: no reinforcement for N periods
- archived: stale but retained for historical reasoning

Required:
- configurable retention windows by category
- non-destructive archival (queryable archive)
- restore flow for reactivated memories

Current state:
- archival status exists in type model but archival policy is not implemented.

---

## 10) Provenance Policy

Every memory must preserve:
1. originating event IDs
2. originating module(s)
3. evidence references
4. formation rule used
5. confidence history
6. lifecycle transition history
7. consumer access history (optional but recommended)

Current state:
- provenance fields are partial.
- evidence is string-based; event-level IDs are not persisted in memory entities.

---

## 11) Auditability Policy

Audit records required:
- memory created/updated transitions
- confidence changes with reason
- relationship changes
- manual interventions

Minimum guarantees:
- append-only timeline log
- immutable event linkage
- deterministic replay capability from provenance records

Current state:
- timeline exists in report payload but not as durable append-only store.

---

## 12) Access & Consumer Policy

Read consumers:
- Daily BriefingsTM, Service IntelligenceTM, Kitchen IntelligenceTM, Menu IntelligenceTM, Hospitality KnowledgeTM, AI CopilotTM, future modules

Required query patterns:
- by context (day/time/season)
- by category/status/confidence
- by relationship graph traversal
- by provenance filters

Current state:
- contextual and lexical retrieval helpers exist.
- dedicated consumer API surface is incomplete.

---

## 13) Governance Readiness

Assessment:
- Policy model is clear and achievable without platform redesign.
- Operational enforcement is incomplete in current implementation.

Readiness level:
- **Governance framework: partial**
- **Governance enforcement: not yet production-grade for long-term reasoning consumers**

---

## 14) Minimum Governance Hardening Before Hospitality KnowledgeTM

1. Durable memory persistence + lifecycle history store.
2. Deterministic dedupe/merge policy.
3. Provenance at event/reference level.
4. Confidence model alignment and contradiction handling.
5. Conflict handling workflow and status model.
6. Dedicated retrieval APIs for search/timeline/context filters.



