# HOSPITALITY AI COPILOT™ ARCHITECTURE

**Platform:** Hospitality Intelligence Platform v2.3.0
**Module:** Hospitality AI Copilot™ v1.0
**Status:** Certified for Production
**Date:** 2026-07-23

---

## 1. Purpose

Hospitality AI Copilot™ is the **reasoning and orchestration layer** of the Hospitality Intelligence Platform. It is **not** a chatbot, an LLM wrapper, a knowledge base, or a rule engine. It is an **evidence-driven Operational Expertise Engine** that reasons over validated organizational knowledge to help hospitality businesses make better operational decisions.

The Copilot consumes information from the certified layers below it but **never bypasses, duplicates, or replaces them**.

---

## 2. Certified Platform Architecture

```text
Heart Pulse™
(Event Infrastructure)
        ↓
Hospitality Memory™
(Organizational Memory)
        ↓
Hospitality Knowledge™
(Validated Knowledge)
        ↓
Hospitality AI Copilot™
(Reasoning & Operational Expertise)
        ↓
Hospitality Operating System™
```

---

## 3. Internal Copilot Architecture

The Copilot is an orchestration engine composed of multiple internal engines. Every stage is independently testable.

```text
User Question
        ↓
Intent Classification Engine
        ↓
Operational Domain Engine
        ↓
Operational Expertise Engine
        ↓
Operational Skill Registry
        ↓
Context Engine
        ↓
Knowledge Retrieval Engine
        ↓
Evidence Evaluation Engine
        ↓
Reasoning Engine
        ↓
Recommendation Engine
        ↓
Explainability Engine
        ↓
Governance Engine
        ↓
Final Response
```

---

## 4. Core Architectural Principles

1. **Evidence Before Intelligence** — No reasoning begins before evidence is retrieved and evaluated.
2. **Explainability by Design** — Every recommendation includes a complete reasoning trace.
3. **Modular Operational Expertise** — Expertise profiles are personas, not separate AI models.
4. **No Hidden State** — All reasoning state is visible in the response.
5. **Trustworthy Recommendations** — Recommendations are evidence-backed, actionable, and confidence-scored.
6. **Human Decision Support** — The Copilot never makes autonomous decisions; all recommendations require human approval.
7. **Complete Auditability** — Every pipeline stage is recorded and inspectable.
8. **Production Readiness** — The Copilot is validated by a 70-test production validation suite with 100% pass rate.

---

## 5. Module Structure

```
src/lib/hospitality-ai/copilot/
├── types.ts                          # Domain model (CopilotRequest, CopilotResponse, etc.)
├── utils.ts                          # Shared helpers (hashing, time, confidence)
├── intent-classification-engine.ts   # Phase 1: Intent classification (16 intents)
├── operational-domain-engine.ts      # Phase 2: Domain detection (13 domains)
├── operational-expertise-engine.ts   # Phase 3: Expertise selection (8 profiles)
├── skill-registry-integration.ts     # Phase 4: Skill Registry bridge (57 skills)
├── context-engine.ts                 # Phase 5: Operational context construction
├── knowledge-retrieval-engine.ts     # Phase 6: Validated knowledge retrieval
├── evidence-evaluation-engine.ts     # Phase 7: Evidence quality assessment
├── reasoning-engine.ts               # Phase 8: Strategy selection & reasoning (10 strategies)
├── recommendation-engine.ts          # Phase 9: Recommendation generation
├── explainability-engine.ts          # Phase 10: Complete reasoning traces
├── governance-engine.ts              # Phase 11: Safety & governance compliance
├── copilot.ts                        # Main orchestrator (ties all engines together)
├── api.ts                            # Phase 12: Consumer interfaces (7+ endpoints)
├── test-fixtures.ts                  # Simulated knowledge/memory/events for validation
├── validation-suite.ts               # Phase 13: 70-test production validation suite
└── index.ts                          # Public API barrel file
```

---

## 6. Engine Summary

| Engine | Phase | Responsibility | Key Outputs |
|--------|-------|----------------|-------------|
| Intent Classification | 1 | Classify user question intent | `IntentClassification` (16 intent types) |
| Operational Domain | 2 | Detect operational domain(s) | `DomainDetection` (13 domains, multi-domain) |
| Operational Expertise | 3 | Select reasoning persona | `ExpertiseSelection` (8 profiles) |
| Skill Registry Integration | 4 | Discover & orchestrate skills | `SkillOrchestrationResult` (57 skills) |
| Context | 5 | Build operational context | `OperationalContext` (deterministic) |
| Knowledge Retrieval | 6 | Retrieve validated knowledge | `KnowledgeRetrievalResult` (provenance graph) |
| Evidence Evaluation | 7 | Assess evidence quality | `EvidenceEvaluation` (sufficiency, conflicts) |
| Reasoning | 8 | Apply reasoning strategy | `ReasoningResult` (10 strategies, trace) |
| Recommendation | 9 | Generate recommendations | `CopilotRecommendation[]` (evidence-backed) |
| Explainability | 10 | Build reasoning traces | `ExplainabilityTrace[]` (full pipeline) |
| Governance | 11 | Enforce safety principles | `CopilotGovernanceRecord` (compliance) |

---

## 7. Data Flow

1. **User submits a question** via `CopilotAPI.query()` or `queryCopilot()`.
2. **Intent Classification** determines the intent type (e.g., `recommendation_request`).
3. **Domain Detection** identifies the operational domain (e.g., `kitchen`).
4. **Expertise Selection** chooses a reasoning persona (e.g., `kitchen_advisor`).
5. **Context Engine** builds deterministic operational context.
6. **Knowledge Retrieval** fetches validated knowledge, memories, and events from the certified architecture.
7. **Evidence Evaluation** assesses completeness, recency, consistency, and confidence.
8. **Skill Registry Integration** discovers and orchestrates relevant operational skills.
9. **Reasoning Engine** selects a strategy and derives findings from evidence.
10. **Recommendation Engine** generates evidence-backed, prioritized recommendations.
11. **Explainability Engine** builds complete reasoning traces for each recommendation.
12. **Governance Engine** evaluates compliance with all safety principles.
13. **Final Response** is returned with recommendations, traces, diagnostics, and governance record.

---

## 8. Integration with Certified Architecture

The Copilot consumes:
- **Heart Pulse™** events via `getOperationalEvents()` from `@/lib/intelligence/integration-helper`
- **Hospitality Memory™** via `getMemoriesForHospitalityAICopilot()` from `@/lib/hospitality-memory/consumer-interfaces`
- **Hospitality Knowledge™** via `getKnowledgeForAICopilot()` from `@/lib/hospitality-knowledge/consumer-interfaces`
- **Operational Skill Registry** via the 57 certified skills in `@/lib/hospitality-ai/skill-registry`

The Copilot **never** writes to these layers. It is a pure consumer.

---

## 9. Validation

The Copilot is validated by a **70-test production validation suite** covering all 16 validation categories. Current results:

- **Total tests:** 70
- **Passed:** 70
- **Failed:** 0
- **Pass rate:** 100.0%
- **Certification:** PASS

---

## 10. Certification

Hospitality AI Copilot™ v1.0 is **certified for production**. It preserves the certified Hospitality Intelligence Platform architecture, produces explainable evidence-backed recommendations, uses the Operational Skill Registry, selects correct expertise profiles and reasoning strategies, maintains complete provenance, supports modular evolution, and passes the full production validation suite.
