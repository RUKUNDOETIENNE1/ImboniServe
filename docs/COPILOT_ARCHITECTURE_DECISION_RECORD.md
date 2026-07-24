# COPILOT ARCHITECTURE DECISION RECORD

**Platform:** Hospitality Intelligence Platform v2.3.0
**Module:** Hospitality AI Copilot™ v1.0
**Date:** 2026-07-23

---

## ADR-001: Evidence-Driven Operational Expertise Engine (Not an LLM Wrapper)

**Status:** ACCEPTED
**Date:** 2026-07-23

### Context
The Hospitality Intelligence Platform needed a reasoning layer to help hospitality businesses make better operational decisions. The key question was whether to build an LLM-based chatbot that generates responses from prompts, or a deterministic reasoning engine that operates over validated organizational knowledge.

### Decision
We decided to build Hospitality AI Copilot™ as an **evidence-driven Operational Expertise Engine** — NOT an LLM wrapper, chatbot, knowledge base, or rule engine. The Copilot reasons over validated Hospitality Knowledge™ using deterministic, explainable algorithms.

### Rationale
- **Trustworthiness:** Hospitality operators need to trust recommendations. Deterministic reasoning over validated evidence is more trustworthy than LLM-generated text.
- **Explainability:** Every recommendation must be traceable to evidence. Deterministic algorithms produce complete reasoning traces.
- **Auditability:** Regulatory and operational requirements demand full audit trails. Deterministic pipelines are fully auditable.
- **No Hallucination:** LLMs can hallucinate facts. The Copilot never invents facts — it only reasons over retrieved evidence.
- **Cost:** LLM inference is expensive and slow. The Copilot's full pipeline runs in <10ms with injected evidence.

### Consequences
- The Copilot cannot generate natural-language responses as fluently as an LLM.
- The Copilot's recommendations are only as good as the underlying knowledge/memory/events.
- The Copilot requires the certified architecture (Heart Pulse, Memory, Knowledge) to be populated.
- An LLM could be added later as a presentation layer on top of the Copilot's structured output.

---

## ADR-002: Rule-Based Intent Classification (Not ML-Based)

**Status:** ACCEPTED
**Date:** 2026-07-23

### Context
The Intent Classification Engine needed to classify user questions into 16 intent types before reasoning begins. Options included: (a) rule-based keyword/phrase matching, (b) ML-based classification, (c) LLM-based classification.

### Decision
We chose **rule-based keyword/phrase matching** with a weighted signal matrix.

### Rationale
- **Determinism:** Rule-based classification is reproducible — the same question always produces the same intent.
- **Explainability:** Matched signals are explicitly recorded, enabling users to understand why an intent was classified.
- **No Training Data:** ML approaches require labeled training data, which we don't have for hospitality operations.
- **Performance:** Rule-based classification runs in <1ms.
- **Auditability:** The signal matrix is inspectable and versioned (`classifierVersion`).

### Consequences
- The classifier may miss nuanced or ambiguous intents that an ML model could handle.
- The signal matrix requires manual maintenance as new question patterns emerge.
- The `unknown_intent` fallback handles questions that don't match any signal.

---

## ADR-003: Expertise Profiles as Reasoning Personas (Not Separate AI Models)

**Status:** ACCEPTED
**Date:** 2026-07-23

### Context
The Copilot needed to provide domain-specific expertise. Options included: (a) separate AI models per domain, (b) a single model with domain prompts, (c) reasoning personas that consume the same architecture.

### Decision
We chose **reasoning personas** — 8 expertise profiles that are configuration, not separate models. All profiles consume the same certified platform architecture.

### Rationale
- **Architectural Integrity:** All profiles use the same Knowledge/Memory/Events — no data silos.
- **Maintainability:** Adding a new profile is a configuration change, not a model training exercise.
- **Consistency:** Recommendations are comparable across profiles because they use the same evidence.
- **Cost:** No need to train, host, or monitor 8 separate models.

### Consequences
- Profiles cannot have truly different "intelligence" — they differ in perspective, bias, and focus.
- The `reasoningBias` field documents each profile's emphasis but does not change the underlying algorithms.

---

## ADR-004: Skill Registry Integration (Not Embedded Operational Logic)

**Status:** ACCEPTED
**Date:** 2026-07-23

### Context
The Copilot needed operational analysis capabilities. Options included: (a) embedding operational logic directly in expertise profiles, (b) using the certified Operational Skill Registry, (c) building a new analysis framework.

### Decision
We chose to **integrate the certified Operational Skill Registry** (57 skills across 8 categories). No expertise profile contains hard-coded operational logic.

### Rationale
- **Reusability:** Skills are reusable across profiles — no duplication.
- **Governance:** Skills are versioned, validated, and governance-compliant.
- **Extensibility:** New skills can be registered without modifying the Copilot.
- **Architectural Compliance:** The Skill Registry is a certified platform component.

### Consequences
- The Copilot depends on the Skill Registry being initialized.
- Skill discovery adds ~100ms to the pipeline.
- If no skills match a request, the Copilot falls back to knowledge-based reasoning.

---

## ADR-005: Deterministic Context Construction with Proof

**Status:** ACCEPTED
**Date:** 2026-07-23

### Context
The Context Engine needed to build operational context before reasoning. Context must be deterministic and explainable.

### Decision
We chose **deterministic context construction** with a `determinismProof` (SHA-256 hash of all inputs) attached to every context.

### Rationale
- **Reproducibility:** The same inputs always produce the same context.
- **Auditability:** The proof hash enables verification that context was constructed correctly.
- **Explainability:** Users can inspect exactly which inputs produced their context.

### Consequences
- Context cannot incorporate real-time randomness or external state not captured in the inputs.
- The proof must be regenerated if any input changes.

---

## ADR-006: Provenance Graph for Complete Traceability

**Status:** ACCEPTED
**Date:** 2026-07-23

### Context
Every recommendation must trace back to Heart Pulse™ events. Options included: (a) simple evidence references, (b) a full provenance graph, (c) no provenance tracking.

### Decision
We chose a **full provenance graph** with `ProvenanceNode` entries linking Knowledge → Memory → Events.

### Rationale
- **Complete Traceability:** Users can trace any recommendation back to the original events.
- **Governance:** The Governance Engine can verify that provenance is intact.
- **Trust:** Complete provenance increases user trust in recommendations.

### Consequences
- The provenance graph adds memory and computation overhead.
- If knowledge/memory/events are missing, provenance may be incomplete (flagged as `traceComplete: false`).

---

## ADR-007: Human Decision Support (Never Autonomous)

**Status:** ACCEPTED
**Date:** 2026-07-23

### Context
The Copilot needed to decide whether to make autonomous decisions or support human decision-making.

### Decision
We chose **human decision support** — all recommendations have `requiresHumanApproval = true` and `reversible = true`. The Copilot never makes autonomous decisions.

### Rationale
- **Safety:** Hospitality operations have real-world consequences. Human oversight is essential.
- **Trust:** Operators trust a system that recommends, not one that decides.
- **Liability:** Autonomous decisions create liability questions. Human-in-the-loop mitigates this.
- **Architectural Principle:** "Human Decision Support (never autonomous decision making)" is a core principle.

### Consequences
- The Copilot cannot automatically implement changes (e.g., adjust schedules, reorder inventory).
- A future workflow engine could consume Copilot recommendations and execute approved actions.

---

## ADR-008: Governance Engine as Final Pipeline Stage

**Status:** ACCEPTED
**Date:** 2026-07-23

### Context
The Copilot needed to enforce safety and governance principles. Options included: (a) trust the pipeline to be compliant, (b) add a governance check at the end, (c) add governance checks at every stage.

### Decision
We chose a **Governance Engine as the final pipeline stage** that evaluates the complete response against 8 principles and 11 compliance checks.

### Rationale
- **Comprehensive:** A final check evaluates the entire response, not individual stages.
- **Non-Invasive:** Stages don't need to know about governance — the Governance Engine handles it.
- **Auditable:** Every response carries a `CopilotGovernanceRecord` with compliance score and violations.

### Consequences
- The Governance Engine adds ~3ms to the pipeline.
- If governance fails, the response is still returned but with `compliant: false` and violations listed.
- Critical violations trigger warnings in the response.

---

## ADR-009: Injected Evidence for Test/Sandbox Mode

**Status:** ACCEPTED
**Date:** 2026-07-23

### Context
The Copilot needed to be testable without a live database. The Knowledge Retrieval Engine calls live consumer interfaces that require database connectivity.

### Decision
We added **`retrieveFromSupplied`** method and `injectedEvidence` configuration to allow tests to inject pre-fetched knowledge/memory/events.

### Rationale
- **Testability:** The validation suite can run without a database.
- **Sandbox:** Developers can experiment with the Copilot using fixture data.
- **Production Parity:** The same pipeline runs — only the data source differs.

### Consequences
- Production wiring must connect the Knowledge Retrieval Engine to the live knowledge store.
- The `loadKnowledgeForCopilot` method must be overridden in production.

---

## ADR-010: Three Explainability Levels

**Status:** ACCEPTED
**Date:** 2026-07-23

### Context
Different users need different levels of explanation detail. Options included: (a) one level for all, (b) configurable levels, (c) no explanation.

### Decision
We chose **three explainability levels**: `brief`, `standard` (default), and `full`.

### Rationale
- **User Needs:** Executives want brief summaries; analysts want full traces.
- **Performance:** Brief level is faster to generate and render.
- **Flexibility:** The level is per-request, not per-user.

### Consequences
- The Explainability Engine generates different narratives based on level.
- The `brief` level may omit context and evidence details that some users need.

---

## Summary

These 10 Architecture Decision Records document the key design decisions behind Hospitality AI Copilot™ v1.0. All decisions prioritize **trustworthiness, explainability, and architectural compliance** over convenience or fluency. The result is a production-ready Operational Expertise Engine that preserves the certified Hospitality Intelligence Platform architecture while delivering evidence-backed, explainable recommendations.
