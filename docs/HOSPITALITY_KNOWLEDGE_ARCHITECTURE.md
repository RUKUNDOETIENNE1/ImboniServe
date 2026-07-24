# Hospitality Knowledge™ — Architecture

**Module:** Hospitality Knowledge™ v1.0
**Platform:** Hospitality Intelligence Platform v2.2.0
**Date:** 2026-07-23

---

## Executive Summary

Hospitality Knowledge™ is the Understanding Layer of the Hospitality Intelligence Platform. It transforms validated Hospitality Memory™ into established business knowledge through an explicit, auditable 8-stage formation pipeline. Knowledge represents the platform's highest-trust cognitive artifact below AI Copilot reasoning — validated truths about how the business operates.

---

## Architectural Principles

### What Knowledge Is

Knowledge is:
- **Validated, synthesized understanding** derived from multiple memories
- **Evidence-backed conclusions** about how the business operates
- **Durable business truths** that survive staff turnover and time
- **Multi-memory patterns** that have been cross-validated across time and context
- **Explainable** — every knowledge traces back to specific events through memories

### What Knowledge Is Not

Knowledge is NOT:
- **Raw events** — that's Heart Pulse™ (event infrastructure)
- **Observations or patterns** — that's Hospitality Memory™ (operational memory)
- **Reasoning or decisions** — that's Hospitality AI Copilot™ (reasoning layer)
- **Inference without evidence** — knowledge requires traceable provenance
- **Single-source conclusions** — knowledge requires multi-memory evidence

---

## Strict Separation Contract

```
Heart Pulse Events     →   What happened (raw operational events)
        ↓
Hospitality Memory     →   What was observed (patterns, observations)
        ↓
Hospitality Knowledge  →   What is understood (validated business truths)
        ↓
Hospitality AI Copilot →   What to do (reasoning, decisions, actions)
```

Each layer consumes the output of the layer below:
- **Memory** consumes Events to form observations
- **Knowledge** consumes Memory to form understanding
- **AI Copilot** consumes Knowledge to form recommendations

No layer skips a level. No layer reaches down past its input.

---

## The Knowledge Formation Pipeline

The transition from memory to knowledge is explicit and auditable:

```
Heart Pulse Events
      ↓
Hospitality Memory
      ↓
Memory Clustering          ← group related memories by category + similarity
      ↓
Pattern Detection          ← extract patterns from clusters (6 pattern types)
      ↓
Evidence Evaluation        ← assess evidence quality (7 factors)
      ↓
Candidate Knowledge        ← form knowledge candidates from patterns
      ↓
Knowledge Validation       ← validate against multi-memory evidence requirements
      ↓
Established Knowledge      ← promote to established/canonical status
      ↓
Knowledge Graph            ← integrate into knowledge graph (13 relationship types)
```

Every stage is recorded in `provenance.formationPipeline` for full auditability.

---

## Module Architecture

### Source Files

Located in `src/lib/hospitality-knowledge/`:

| File | Lines | Responsibility |
|------|-------|----------------|
| `types.ts` | 654 | Knowledge domain model (entities, lifecycle, confidence, provenance) |
| `utils.ts` | 87 | Utility helpers (hashing, similarity, time, statistics) |
| `confidence-engine.ts` | 184 | Multi-factor confidence with 7 factors and hard ceilings |
| `lifecycle-engine.ts` | 261 | 8-state lifecycle with deterministic transitions |
| `discovery-engine.ts` | 770+ | Full discovery pipeline (stages 1-5) |
| `validation-engine.ts` | 666 | Validation, establishment, contradiction detection (stages 6-8) |
| `graph-engine.ts` | 423 | Knowledge graph with 13 relationship types |
| `governance-engine.ts` | 426 | Versioning, explainability, provenance, auditing |
| `consumer-interfaces.ts` | 368 | 6 consumer profiles with filtered retrieval |
| `repository.ts` | 269 | Durable persistence via KnowledgeEntry Prisma model |
| `aggregator.ts` | 297 | Full pipeline orchestration |
| `service.ts` | 520+ | Extends BaseIntelligenceService |
| `dashboard-builder.ts` | 120+ | Extends BaseDashboardBuilder |
| `index.ts` | 165 | Module exports |

### Architecture Pattern

The module follows the platform's established patterns:
- **Template Method**: `BaseIntelligenceService` orchestrates validate → timeRange → events → buildReport → response
- **Durable Persistence**: `KnowledgeEntry` Prisma model with 4 sub-categories
- **Builder Pattern**: `BaseDashboardBuilder` for dashboard construction
- **Repository Pattern**: `HospitalityKnowledgeRepository` for data access
- **Factory Pattern**: `createHospitalityKnowledgeService()` and `createHospitalityKnowledgeDashboardBuilder()`

---

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/hospitality-knowledge/generate` | POST | Generate knowledge report from memories |
| `/api/hospitality-knowledge/search` | POST | Search knowledge by query |
| `/api/hospitality-knowledge/graph` | POST | Retrieve knowledge graph |
| `/api/hospitality-knowledge/timeline` | POST | Retrieve knowledge timeline |
| `/api/hospitality-knowledge/consumer` | POST | Retrieve knowledge for specific consumer |

All endpoints require authentication via NextAuth session.

---

## Knowledge vs Memory Comparison

| Aspect | Hospitality Memory™ | Hospitality Knowledge™ |
|--------|---------------------|----------------------|
| **Input** | Raw events | Validated memories |
| **Output** | Observations, patterns | Established business truths |
| **Lifecycle** | 10 states | 8 states (stricter) |
| **Confidence** | 4 levels | 5 levels (adds 'certain') |
| **Evidence** | Single-memory | Multi-memory required |
| **Cross-validation** | Not required | Required for high confidence |
| **Hallucination prevention** | Event tracing | Memory + event tracing |
| **Graph** | 5 relationship types | 13 relationship types |
| **Consumers** | 6 (including knowledge) | 6 (including AI Copilot) |
| **Persistence** | KnowledgeEntry | KnowledgeEntry |

---

## Platform Integration

Hospitality Knowledge™ integrates with the platform as follows:

1. **Consumes**: Hospitality Memory™ (loads durable memory state via `HospitalityMemoryRepository`)
2. **Produces**: Knowledge entities, relationships, conflicts, timeline entries
3. **Persisted via**: `KnowledgeEntry` Prisma model (categories: `hospitality_knowledge/knowledge`, `/relationship`, `/timeline`, `/conflict`)
4. **Consumed by**: Hospitality AI Copilot™, Daily Briefings, Service/Kitchen/Menu Intelligence, Future Modules
5. **Extends**: `BaseIntelligenceService`, `BaseDashboardBuilder`
6. **API factory**: `createIntelligenceEndpoint` for the generate endpoint

---

## Durable Persistence

Knowledge state is persisted in 4 categories within the `KnowledgeEntry` model:

| Category | Content | Purpose |
|----------|---------|---------|
| `hospitality_knowledge/knowledge` | `KnowledgeEntity` | Knowledge aggregate root |
| `hospitality_knowledge/relationship` | `KnowledgeRelationship` | Graph edges |
| `hospitality_knowledge/timeline` | `KnowledgeTimelineEntry` | Lifecycle events |
| `hospitality_knowledge/conflict` | `KnowledgeConflict` | Contradiction records |

State is loaded on every service invocation (restart-safe, multi-instance safe).
Writes are batched in transactional groups of 25.
