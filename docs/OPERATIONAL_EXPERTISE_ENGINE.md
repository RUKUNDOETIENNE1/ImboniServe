# OPERATIONAL EXPERTISE ENGINE

**Platform:** Hospitality Intelligence Platform v2.3.0
**Module:** Hospitality AI Copilot™ v1.0 — Phase 3
**File:** `src/lib/hospitality-ai/copilot/operational-expertise-engine.ts`
**Version:** 1.0.0

---

## 1. Overview

The Operational Expertise Engine implements **dynamic expertise profile selection**. Expertise profiles are **reasoning personas** — NOT separate AI models. All profiles consume the same certified platform architecture.

Selection is driven by user role, operational domain, intent, and question content.

---

## 2. Architecture Position

```text
Intent Classification
      ↓
Operational Domain Engine
      ↓
Operational Expertise Engine  ← THIS MODULE
      ↓
Skill Registry Integration
```

---

## 3. The 8 Expertise Profiles

| Profile | Name | Primary Domains | Primary Intents | Primary Roles | Reasoning Bias |
|---------|------|-----------------|-----------------|---------------|----------------|
| `executive_advisor` | Executive Advisor | management, finance, revenue | operational_review, decision_support, planning, trend_analysis, comparison | owner, executive, general_manager, analyst | Strategic trade-off analysis with emphasis on long-term value and risk |
| `kitchen_advisor` | Kitchen Advisor | kitchen, inventory | problem_diagnosis, optimization, root_cause_analysis, status_check | kitchen_manager, cook | Operational throughput and quality with emphasis on kitchen constraints |
| `service_advisor` | Service Advisor | service, reservations | problem_diagnosis, optimization, status_check, recommendation_request | service_manager, floor_manager, server, host, bartender | Guest experience and service flow with emphasis on speed and warmth |
| `inventory_advisor` | Inventory Advisor | inventory, suppliers | optimization, planning, risk_assessment, problem_diagnosis | inventory_manager, general_manager | Supply continuity and cost control with emphasis on variance reduction |
| `revenue_advisor` | Revenue Advisor | revenue, finance | optimization, trend_analysis, prediction_request, comparison | general_manager, owner, analyst, executive | Topline growth with emphasis on pricing, mix, and conversion |
| `staff_performance_advisor` | Staff Performance Advisor | staff | optimization, trend_analysis, planning, problem_diagnosis | general_manager, service_manager, kitchen_manager, shift_lead | Workforce productivity and well-being with emphasis on sustainable scheduling |
| `customer_experience_advisor` | Customer Experience Advisor | customers, service | trend_analysis, problem_diagnosis, recommendation_request, optimization | service_manager, general_manager, host | Customer lifetime value with emphasis on experience consistency |
| `operational_excellence_advisor` | Operational Excellence Advisor | operations | optimization, problem_diagnosis, root_cause_analysis, operational_review | general_manager, shift_lead, floor_manager, kitchen_manager | Process improvement with emphasis on bottleneck removal and standardization |

---

## 4. Selection Algorithm

Scoring is based on four signals:

| Signal | Weight | Description |
|--------|--------|-------------|
| User role match | +0.40 | Strongest signal — matches user's role to profile's primary roles |
| Primary domain match | +0.35 | Matches detected domain to profile's primary domains |
| Secondary domain match | +0.15 | Partial credit for secondary domain overlap |
| Intent match | +0.20 | Matches classified intent to profile's primary intents |
| Keyword match | +0.05 each | Subtle signal from question keywords |

The highest-scoring profile is selected. Alternatives (score > 0.2) are recorded.

---

## 5. Output: ExpertiseSelection

```typescript
interface ExpertiseSelection {
  requestId: string
  profile: ExpertiseProfile
  confidence: number              // 0..1
  alternativeProfiles: Array<{ profile: ExpertiseProfile; confidence: number }>
  selectionReason: string
  selectionTime: number           // ms
  selectorVersion: string         // "1.0.0"
}
```

---

## 6. API

```typescript
const engine = getOperationalExpertiseEngine()

// Select a profile
const selection = engine.select(request, domain, intent): ExpertiseSelection

// Introspection
engine.listProfiles(): ExpertiseProfile[]                    // Returns 8 profiles
engine.describeProfile(profile): { name, description, reasoningBias } | null
engine.getProfileDefinition(profile): ExpertiseProfileDefinition | null
```

---

## 7. Validation Results

| Test | Result |
|------|--------|
| Executive role selects executive_advisor | ✅ PASS |
| Kitchen manager selects kitchen_advisor | ✅ PASS |
| Service manager selects service_advisor | ✅ PASS |
| All 8 expertise profiles supported | ✅ PASS |
| Returns alternatives and reason | ✅ PASS |

---

## 8. Certification

The Operational Expertise Engine is **certified for production**. It correctly selects from 8 expertise profiles based on user role, domain, and intent.
