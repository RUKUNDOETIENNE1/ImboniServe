# RECOMMENDATION ENGINE

**Platform:** Hospitality Intelligence Platform v2.3.0
**Module:** Hospitality AI Copilot™ v1.0 — Phase 9
**File:** `src/lib/hospitality-ai/copilot/recommendation-engine.ts`
**Version:** 1.0.0

---

## 1. Overview

The Recommendation Engine produces **evidence-backed, actionable, and prioritized recommendations** from reasoning results. Every recommendation includes evidence references, confidence factors, priority, expected impact, prerequisites, risks, and a human decision support reminder.

The engine **never invents facts** — recommendations are derived only from retrieved evidence and reasoning findings.

---

## 2. Architecture Position

```text
Reasoning Engine
      ↓
Recommendation Engine  ← THIS MODULE
      ↓
Explainability Engine
```

---

## 3. Recommendation Properties

Each `CopilotRecommendation` contains:

| Property | Description |
|----------|-------------|
| `id` | Unique recommendation identifier |
| `title` | Short, actionable title |
| `description` | Detailed description |
| `priority` | `critical` / `high` / `medium` / `low` |
| `confidence` | 0..1 confidence score |
| `confidenceFactors` | Breakdown of confidence components |
| `evidenceRefs` | References to knowledge/memory/event IDs |
| `reasoningRefs` | References to reasoning findings/conclusions |
| `expectedImpact` | Expected operational impact |
| `prerequisites` | Conditions that must be met |
| `risks` | Risks of acting on the recommendation |
| `alternatives` | Alternative recommendations |
| `requiresHumanApproval` | Always `true` |
| `reversible` | Always `true` |
| `actionable` | Whether the recommendation is actionable |

---

## 4. Priority Assignment

Priority is derived from:
- **Evidence sufficiency** — sufficient evidence supports higher priority
- **Confidence** — higher confidence supports higher priority
- **Urgency signals** — keywords like "urgent", "critical", "immediately" elevate priority
- **Impact** — higher expected impact supports higher priority

| Priority | Typical Conditions |
|----------|-------------------|
| `critical` | Urgent + sufficient evidence + high confidence |
| `high` | Sufficient evidence + high confidence |
| `medium` | Sufficient evidence + medium confidence |
| `low` | Partial evidence or low confidence |

---

## 5. Confidence Scoring

Confidence is a composite of:

| Factor | Weight | Description |
|--------|--------|-------------|
| `evidenceQuality` | 0.30 | Quality of retrieved evidence |
| `evidenceSufficiency` | 0.25 | Whether evidence is sufficient |
| `evidenceConsistency` | 0.20 | Consistency across evidence sources |
| `reasoningConfidence` | 0.15 | Confidence from reasoning |
| `contextCompleteness` | 0.10 | Completeness of operational context |

When evidence is `absent`, confidence is significantly reduced.

---

## 6. No Recommendations When Evidence Is Absent

If evidence sufficiency is `absent`, the engine produces **no recommendations** and instead returns a message explaining that evidence is insufficient. This enforces the "Evidence Before Intelligence" principle.

---

## 7. Output: CopilotRecommendation

```typescript
interface CopilotRecommendation {
  id: string
  title: string
  description: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  confidence: number             // 0..1
  confidenceFactors: ConfidenceFactors
  evidenceRefs: string[]
  reasoningRefs: string[]
  expectedImpact?: string
  prerequisites: string[]
  risks: string[]
  alternatives: Array<{ title: string; description: string }>
  requiresHumanApproval: true
  reversible: true
  actionable: boolean
}
```

---

## 8. API

```typescript
const engine = getRecommendationEngine()

// Generate recommendations
const recs = engine.generate(
  request: CopilotRequest,
  intent: IntentClassification,
  domain: DomainDetection,
  expertise: ExpertiseSelection,
  context: OperationalContext,
  retrieval: KnowledgeRetrievalResult,
  evaluation: EvidenceEvaluation,
  reasoning: ReasoningResult,
  skillResult?: SkillOrchestrationResult
): CopilotRecommendation[]
```

---

## 9. Validation Results

| Test | Result |
|------|--------|
| Recommendations generated for actionable requests | ✅ PASS |
| Recommendations have evidence references | ✅ PASS |
| Recommendations have priorities and confidence | ✅ PASS |
| Recommendations require human approval | ✅ PASS |
| Recommendations include alternatives when requested | ✅ PASS |
| No recommendations when evidence is absent | ✅ PASS |

---

## 10. Certification

The Recommendation Engine is **certified for production**. It produces evidence-backed, actionable, prioritized recommendations with complete confidence factors and human decision support.
