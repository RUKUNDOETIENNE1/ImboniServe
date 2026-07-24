# CONTEXT ENGINE

**Platform:** Hospitality Intelligence Platform v2.3.0
**Module:** Hospitality AI Copilot™ v1.0 — Phase 5
**File:** `src/lib/hospitality-ai/copilot/context-engine.ts`
**Version:** 1.0.0

---

## 1. Overview

The Context Engine constructs the operational context that the reasoning pipeline uses. Context is **deterministic** — the same inputs always produce the same context, with a SHA-256 `determinismProof` attached.

---

## 2. Architecture Position

```text
Expertise Selection
      ↓
Skill Registry Integration
      ↓
Context Engine  ← THIS MODULE
      ↓
Knowledge Retrieval Engine
```

---

## 3. Context Construction

The engine builds an `OperationalContext` from:

| Input | Source | Description |
|-------|--------|-------------|
| `businessId` | Request | The restaurant/business identifier |
| `userId` | Request | The requesting user |
| `userRole` | Request | The user's role |
| `shift` | Request | Current shift (morning/evening/night) |
| `outletId` | Request | Optional outlet identifier |
| `timeRange` | Request | Optional time range filter |
| `intent` | Intent Classification | Classified intent |
| `domain` | Domain Detection | Detected operational domain(s) |
| `expertiseProfile` | Expertise Selection | Selected expertise profile |
| `skillsAvailable` | Skill Registry | Skills available for this request |
| `conversationId` | Request | Optional conversation identifier |
| `activeAlerts` | Request hints | Active operational alerts |
| `activeWorkflows` | Request hints | Active operational workflows |
| `businessObjectives` | Request hints | Active business objectives |

---

## 4. Determinism Proof

```typescript
const determinismProof = sha256(
  businessId + userId + userRole + shift + outletId +
  timeRange.start + timeRange.end +
  intent + domains.join(',') + expertiseProfile +
  skillsAvailable.join(',') + conversationId
)
```

The proof enables verification that context was constructed correctly from the given inputs.

---

## 5. Output: OperationalContext

```typescript
interface OperationalContext {
  requestId: string
  businessId: string
  userId?: string
  userRole?: UserRole
  shift?: ShiftType
  outletId?: string
  timeRange?: { start: string; end: string }
  intent: IntentType
  domains: OperationalDomain[]
  expertiseProfile: ExpertiseProfile
  skillsAvailable: OperationalSkillId[]
  conversationId?: string
  activeAlerts?: AlertReference[]
  activeWorkflows?: WorkflowReference[]
  businessObjectives?: string[]
  determinismProof: string         // SHA-256 hash
  constructedAt: string
  contextVersion: string           // "1.0.0"
}
```

---

## 6. API

```typescript
const engine = getContextEngine()

// Build context
const context = engine.buildContext(
  request: CopilotRequest,
  intent: IntentClassification,
  domain: DomainDetection,
  expertise: ExpertiseSelection,
  skills: SkillDiscoveryResult
): OperationalContext

// Verify determinism
engine.verifyDeterminism(context: OperationalContext): boolean
```

---

## 7. Validation Results

| Test | Result |
|------|--------|
| Context is constructed with all fields | ✅ PASS |
| Determinism proof is stable | ✅ PASS |
| Context includes skills available | ✅ PASS |
| Context includes intent and domain | ✅ PASS |
| Context includes expertise profile | ✅ PASS |
| Deterministic across repeated calls | ✅ PASS |
| Determinism proof changes with inputs | ✅ PASS |
| Context includes active alerts | ✅ PASS |

---

## 8. Certification

The Context Engine is **certified for production**. It constructs deterministic, explainable operational context with a verifiable determinism proof.
