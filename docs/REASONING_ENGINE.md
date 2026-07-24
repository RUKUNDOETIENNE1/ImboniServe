# REASONING ENGINE

**Platform:** Hospitality Intelligence Platform v2.3.0
**Module:** Hospitality AI Copilot™ v1.0 — Phase 8
**File:** `src/lib/hospitality-ai/copilot/reasoning-engine.ts`
**Version:** 1.0.0

---

## 1. Overview

The Reasoning Engine selects and applies the appropriate **reasoning strategy** based on intent, domain, expertise profile, and evidence. It produces structured `ReasoningResult` with findings, conclusions, and a complete reasoning trace.

The engine is **deterministic** — the same inputs always produce the same reasoning output.

---

## 2. Architecture Position

```text
Evidence Evaluation
      ↓
Reasoning Engine  ← THIS MODULE
      ↓
Recommendation Engine
```

---

## 3. The 10 Reasoning Strategies

| Strategy | Description | Triggered By |
|----------|-------------|--------------|
| `cause_and_effect` | Identifies causes and effects in operational data | root_cause_analysis, problem_diagnosis |
| `comparative_reasoning` | Compares two or more entities, periods, or options | comparison |
| `constraint_optimization` | Optimizes within operational constraints | optimization |
| `trend_analysis` | Analyzes temporal patterns and trends | trend_analysis |
| `risk_assessment` | Evaluates operational risks | risk_assessment |
| `scenario_planning` | Plans for multiple future scenarios | planning |
| `diagnostic_reasoning` | Diagnoses problems from symptoms | problem_diagnosis |
| `predictive_reasoning` | Predicts future outcomes | prediction_request |
| `decision_analysis` | Analyzes decision options | decision_support |
| `synthesis` | Synthesizes findings from multiple sources | information_request, explanation, status_check, recommendation_request, operational_review, learning_training |

---

## 4. Strategy Selection Algorithm

Selection considers three signals:

| Signal | Weight | Description |
|--------|--------|-------------|
| Intent affinity | +0.50 | Strongest signal — each intent has preferred strategies |
| Domain affinity | +0.25 | Each domain has preferred strategies |
| Expertise affinity | +0.20 | Each expertise profile has preferred strategies |

The highest-scoring strategy is selected. If evidence is insufficient, the engine may fall back to `synthesis` with reduced confidence.

---

## 5. Reasoning Execution

Each strategy produces:
- **Findings**: Specific observations derived from evidence
- **Conclusions**: Higher-level inferences from findings
- **Reasoning steps**: Ordered list of reasoning operations
- **Confidence factors**: Components contributing to confidence

---

## 6. Output: ReasoningResult

```typescript
interface ReasoningResult {
  requestId: string
  strategy: ReasoningStrategy
  findings: ReasoningFinding[]
  conclusions: ReasoningConclusion[]
  reasoningSteps: ReasoningStep[]
  confidenceFactors: ConfidenceFactors
  reasoningTime: number           // ms
  reasoningVersion: string        // "1.0.0"
}
```

---

## 7. API

```typescript
const engine = getReasoningEngine()

// Select and execute reasoning
const result = engine.reason(
  request: CopilotRequest,
  intent: IntentClassification,
  domain: DomainDetection,
  expertise: ExpertiseSelection,
  context: OperationalContext,
  evaluation: EvidenceEvaluation
): ReasoningResult

// Introspection
engine.listStrategies(): ReasoningStrategy[]                // Returns 10 strategies
engine.describeStrategy(strategy): { name, description } | null
```

---

## 8. Validation Results

| Test | Result |
|------|--------|
| Root cause analysis selects cause_and_effect or diagnostic | ✅ PASS |
| Optimization selects constraint_optimization | ✅ PASS |
| Comparison selects comparative_reasoning | ✅ PASS |
| All 10 strategies supported | ✅ PASS |
| Reasoning produces trace and findings | ✅ PASS |

---

## 9. Certification

The Reasoning Engine is **certified for production**. It selects from 10 reasoning strategies and produces structured, explainable reasoning output.
