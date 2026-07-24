# EXPLAINABILITY ENGINE

**Platform:** Hospitality Intelligence Platform v2.3.0
**Module:** Hospitality AI Copilot™ v1.0 — Phase 10
**File:** `src/lib/hospitality-ai/copilot/explainability-engine.ts`
**Version:** 1.0.0

---

## 1. Overview

The Explainability Engine ensures that **every recommendation includes a complete reasoning trace**. Users must always be able to understand why a recommendation was made.

The engine builds an `ExplainabilityTrace` for each recommendation, covering the full pipeline from user question to final response.

---

## 2. Architecture Position

```text
Recommendation Engine
      ↓
Explainability Engine  ← THIS MODULE
      ↓
Governance Engine
```

---

## 3. Required Trace Structure

Every trace follows this canonical structure:

```text
User Question
      ↓
Intent Classification
      ↓
Operational Domain
      ↓
Expertise Profile
      ↓
Operational Skills Used
      ↓
Context
      ↓
Knowledge Objects
      ↓
Supporting Memories
      ↓
Supporting Events
      ↓
Evidence Evaluation
      ↓
Reasoning Strategy
      ↓
Alternative Options
      ↓
Recommendation
      ↓
Confidence Assessment
      ↓
Explanation
      ↓
Final Response
```

---

## 4. ExplainabilityTrace Type

```typescript
interface ExplainabilityTrace {
  userQuestion: string
  intentClassification: IntentClassification
  domainDetection: DomainDetection
  expertiseSelection: ExpertiseSelection
  skillsUsed: OperationalSkillId[]
  context: OperationalContext
  knowledgeObjects: KnowledgeReference[]
  supportingMemories: MemoryReference[]
  supportingEvents: EventReference[]
  evidenceEvaluation: EvidenceEvaluation
  reasoningStrategy: ReasoningStrategy
  reasoningSteps: ReasoningStep[]
  alternativeOptions: Array<{ title: string; description: string }>
  recommendation: CopilotRecommendation
  confidenceAssessment: ConfidenceFactors
  explanation: string                    // Human-readable narrative
  generatedAt: string
  traceVersion: string                   // "1.0.0"
  traceComplete: boolean
  traceWarnings: string[]
}
```

---

## 5. Three Explainability Levels

| Level | Description | Includes |
|-------|-------------|----------|
| `brief` | Concise summary | Question, intent, recommendation, confidence |
| `standard` | Default level | Adds context, evidence evaluation, reasoning strategy |
| `full` | Complete detail | Adds reasoning steps, risks, prerequisites, alternatives |

The level is set per-request via `CopilotRequest.explainabilityLevel`.

---

## 6. Narrative Generation

The narrative is generated dynamically based on the level, covering:

1. **Question** — What the user asked
2. **Intent** — How the question was classified
3. **Domain** — Which operational domain(s) were detected
4. **Expertise Profile** — Which reasoning persona was selected
5. **Context** — Operational context (standard and full)
6. **Evidence Evaluation** — Sufficiency, quality, conflicts (standard and full)
7. **Reasoning Strategy** — Which strategy was applied
8. **Skills Used** — Which operational skills contributed
9. **Recommendation** — The recommendation title and description
10. **Priority** — Why this priority was assigned
11. **Confidence** — Confidence score and factors
12. **Alternatives** — Alternative options (full)
13. **Human Decision Support Reminder** — Always included

---

## 7. Trace Completeness

Completeness is verified against:

| Check | Requirement |
|-------|-------------|
| Evidence references | `evidenceRefs.length > 0` |
| Knowledge objects | `knowledgeObjects.length > 0` |
| Evidence sufficiency | `sufficiency != 'absent'` |

If any check fails, `traceComplete = false` and a warning is added.

---

## 8. Provenance Extraction

The engine extracts provenance references from:
- **Knowledge objects** — IDs and titles from retrieved knowledge
- **Supporting memories** — IDs and summaries from Hospitality Memory™
- **Supporting events** — IDs and types from Heart Pulse™ events

This enables users to trace any recommendation back to the original events.

---

## 9. Trace Warnings

Warnings are added for:
- Insufficient evidence (`sufficiency = 'partial'` or `'absent'`)
- Evidence conflicts detected
- Incomplete provenance (missing knowledge/memory/events)

---

## 10. API

```typescript
const engine = getExplainabilityEngine()

// Build a trace for a single recommendation
const trace = engine.buildTrace(
  request: CopilotRequest,
  intent: IntentClassification,
  domain: DomainDetection,
  expertise: ExpertiseSelection,
  context: OperationalContext,
  retrieval: KnowledgeRetrievalResult,
  evaluation: EvidenceEvaluation,
  reasoning: ReasoningResult,
  recommendation: CopilotRecommendation,
  skillResult?: SkillOrchestrationResult,
  level?: ExplainabilityLevel
): ExplainabilityTrace

// Build traces for multiple recommendations
const traces = engine.buildTraces(...): ExplainabilityTrace[]

// Version
engine.getExplainabilityVersion(): string   // "1.0.0"
```

---

## 11. Validation Results

| Test | Result |
|------|--------|
| Every recommendation has an explainability trace | ✅ PASS |
| Explainability trace contains full pipeline | ✅ PASS |
| Trace includes knowledge and memory references | ✅ PASS |
| All 3 explainability levels supported | ✅ PASS |

---

## 12. Certification

The Explainability Engine is **certified for production**. It produces complete reasoning traces for every recommendation, enabling users to understand why each recommendation was made.
