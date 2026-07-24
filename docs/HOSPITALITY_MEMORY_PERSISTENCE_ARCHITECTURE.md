# Hospitality MemoryTM Persistence Architecture

Version: v2.1.2  
Module: Hospitality Operational Memory Engine

---

## 1. Persistence Goals

Hospitality MemoryTM persistence is designed to guarantee:
- survival across requests/restarts/deployments
- stable identifiers and deterministic merges
- transactional write safety
- multi-instance consistency
- efficient retrieval for intelligence consumers

---

## 2. Storage Strategy

Hospitality MemoryTM uses canonical platform DB storage (`KnowledgeEntry`) with category partitioning:

- `hospitality_memory/memory`
- `hospitality_memory/relationship`
- `hospitality_memory/timeline`
- `hospitality_memory/conflict`

Repository:
- <ref_file file="C:\Dev\ImboniResto\src\lib\hospitality-memory\repository.ts" />

This design avoids platform refactoring while providing durable records and graph persistence.

---

## 3. Persistence Model

## Memory records
- persisted as canonical memory entities with provenance and lifecycle history
- upsert by stable deterministic memory ID

## Relationship records
- persisted as first-class graph edges
- upsert by stable deterministic relationship ID
- includes strength and observation counts

## Timeline records
- append-oriented lifecycle audit entries
- upsert-safe and idempotent via deterministic IDs

## Conflict records
- persisted contradiction/conflict artifacts
- explicit conflict status (`open`, `resolved`, `dismissed`)

---

## 4. Identifier Strategy

Stable deterministic IDs generated using SHA-256 hash prefixes:
- memory IDs: `hm_*`
- fingerprint IDs: `hm_fp_*`
- relationship IDs: `hm_rel_*`
- timeline IDs: `hm_tl_*`
- conflict IDs: `hm_conflict_*`

Utility:
- <ref_file file="C:\Dev\ImboniResto\src\lib\hospitality-memory\utils.ts" />

Determinism enables:
- deduplication
- idempotent writes
- safe multi-instance merges

---

## 5. Write Path

Write path in each report cycle:
1. load current state
2. form/update memories from candidates
3. compute/merge relationships
4. append timeline/conflict artifacts
5. persist in bounded transaction batches

Batched transactions:
- protects integrity while avoiding long-running interactive transaction failures

---

## 6. Read Path

Read path:
- load by business + category prefix
- materialize into memory state object:
  - memories
  - relationships
  - timeline
  - conflicts
- apply request-level filters in service layer

Service:
- <ref_file file="C:\Dev\ImboniResto\src\lib\hospitality-memory\service.ts" />

---

## 7. Multi-Instance Consistency

Consistency model:
- source of truth is database state
- every invocation reloads state from repository
- writes are upsert-based and deterministic

Result:
- horizontal scale safe for eventual consistency at request boundaries
- no dependence on process-local memory stores

---

## 8. Transaction Safety

Safety controls:
- DB-level atomicity per upsert
- bounded `$transaction([...])` batches
- idempotent IDs prevent duplicate object inflation

Failure behavior:
- failed batch leaves prior committed batches intact
- rerun converges to same state due deterministic identifiers

---

## 9. Performance Notes

Current optimizations:
- category-prefixed retrieval
- deterministic upserts
- bounded timeline/relationship persistence windows

Future optimization options (non-blocking):
- dedicated memory tables for large-scale workloads
- partial indexes for category/status
- async relationship recalculation jobs

---

## 10. Validation Evidence

Persistence behaviors validated in hardening suite:
- state survives service recreation
- timeline persists and reloads
- search/timeline retrieval remains consistent

Evidence:
- <ref_file file="C:\Dev\ImboniResto\test-hospitality-memory-hardening.ts" />
- <ref_file file="C:\Dev\ImboniResto\docs\HOSPITALITY_MEMORY_VALIDATION_RESULTS.md" />

