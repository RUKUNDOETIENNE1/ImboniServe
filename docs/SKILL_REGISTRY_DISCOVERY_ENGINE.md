# Operational Skill Registry — Discovery Engine

**Platform:** Hospitality Intelligence Platform v2.3.0  
**Module:** Operational Skill Registry v1.0  

---

## 1. Overview

The Discovery Engine selects the most relevant skills for a given request. It evaluates all production-eligible skills against the request's intent, domain, expertise profile, reasoning strategy, and available evidence, then returns a ranked list of matching skills.

The Discovery Engine never bypasses the certified architecture. It only selects skills — it does not generate facts or perform reasoning.

---

## 2. Discovery Process

```
SkillDiscoveryRequest
        │
        ↓
┌───────────────────┐
│ Get all skills    │
│ from registry     │
└────────┬──────────┘
         │
         ↓
┌───────────────────┐
│ Filter to         │
│ production-eligible│
│ (validated +      │
│  production)      │
└────────┬──────────┘
         │
         ↓
┌───────────────────┐
│ Evaluate each     │
│ skill against     │
│ request criteria  │
└────────┬──────────┘
         │
         ↓
┌───────────────────┐
│ Score and rank    │
│ by relevance      │
└────────┬──────────┘
         │
         ↓
SkillDiscoveryResult
(selected + rejected)
```

---

## 3. Scoring Algorithm

Each skill is scored on 5 components:

| Component | Weight | Score Range | Description |
|-----------|--------|-------------|-------------|
| Intent match | 30% | 0, 0.5, or 1.0 | 1.0 if skill supports the intent; 0.5 if it supports a related intent; 0 otherwise |
| Domain match | 25% | 0, 0.4, 0.7, or 1.0 | 1.0 if direct match; 0.7 if cross_domain; 0.4 if related domain; 0 otherwise |
| Profile match | 20% | 0, 0.5, or 1.0 | 1.0 if direct match; 0.5 for executive_advisor on any skill; 0 otherwise |
| Strategy match | 15% | 0.3 or 1.0 | 1.0 if direct match; 0.3 partial credit otherwise |
| Evidence availability | 10% | 0..1.0 | Ratio of required knowledge categories that are available |

**Total score** = sum of weighted component scores, clamped to [0, 1].  
**Eligibility threshold** = 0.3 (skills scoring below 0.3 are rejected).

---

## 4. Intent Relationships

Related intents provide partial credit when an exact match isn't found:

| Intent | Related Intents |
|--------|----------------|
| status_check | operational_review, trend_analysis |
| operational_review | status_check, trend_analysis, decision_support |
| trend_analysis | status_check, operational_review |
| problem_diagnosis | root_cause_analysis, risk_assessment |
| root_cause_analysis | problem_diagnosis, risk_assessment |
| optimization | recommendation_request, planning |
| recommendation_request | optimization, decision_support, planning |
| prediction_request | trend_analysis, planning |
| risk_assessment | problem_diagnosis, root_cause_analysis |
| planning | prediction_request, recommendation_request, optimization |
| decision_support | recommendation_request, operational_review |
| comparison | trend_analysis, operational_review |
| explanation | information_request |
| information_request | explanation, status_check |
| learning_training | explanation, information_request |

---

## 5. Domain Relationships

| Domain | Related Domains |
|--------|----------------|
| kitchen | operations |
| service | operations, customers |
| reservations | service, customers |
| inventory | operations, suppliers |
| finance | revenue, operations |
| revenue | finance, operations |
| customers | service, marketing |
| staff | operations, management |
| management | operations, cross_domain |
| marketing | customers |
| suppliers | inventory |
| operations | kitchen, service, staff |
| cross_domain | (none — matches all partially) |

---

## 6. API Methods

```typescript
// Main discovery
discover(request: SkillDiscoveryRequest): SkillDiscoveryResult

// Discovery from execution context
discoverForContext(context: Partial<SkillExecutionContext>): SkillDiscoveryResult

// Top N skills
discoverTop(request: SkillDiscoveryRequest, limit: number): SkillDiscoveryResult
```

---

## 7. Integration

The Discovery Engine is used by:
- **Orchestration Engine** — calls `discover()` to find skills for orchestration plans
- **API** — exposes `discoverSkills()` endpoint
- **Expertise Profiles** — query discovery to determine available capabilities

---

## 8. Performance Characteristics

- Discovery completes in <100ms for 57 skills
- No I/O operations — pure in-memory computation
- Scales linearly with skill count

---

## 9. Validation Results

| Test | Result | Details |
|------|--------|---------|
| discovery_operational_review | PASS | Found 53 skills |
| discovery_kitchen | PASS | Found 8 kitchen skills |
| discovery_finance | PASS | Found 6 financial skills |
| discovery_with_context | PASS | Found 53 skills for context |
| discovery_top_n | PASS | Top 3 skills returned |

**All 5 discovery tests passed.**

---

## Certification

**Status:** CERTIFIED — PRODUCTION READY  
**Tests:** 5/5 passed  
**Date:** 2026-07-23
