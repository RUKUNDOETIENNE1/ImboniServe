# Operational Skill Registry — Architecture

**Platform:** Hospitality Intelligence Platform v2.3.0  
**Module:** Operational Skill Registry v1.0  
**Status:** CERTIFIED — PRODUCTION READY  

---

## 1. Executive Summary

The Operational Skill Registry is the capability layer of the Hospitality AI Copilot's Operational Expertise Framework. It provides a reusable, governed, and validated set of operational skills that Expertise Profiles use to analyze evidence retrieved from the certified architecture.

The registry is NOT a reasoning engine, chatbot, or LLM wrapper. It is a structured catalog of analytical capabilities that:
- Retrieve evidence from Knowledge, Memory, and Events
- Apply domain-specific analysis
- Produce structured findings, metrics, and explanations
- Never bypass the certified architecture or generate business facts

---

## 2. Architectural Position

```
Heart Pulse™ → Hospitality Memory™ → Hospitality Knowledge™ →
Hospitality AI Copilot™ →
  [Intent Classification] →
  [Operational Domain Detection] →
  [Expertise Profile Selection] →
  [Operational Skill Registry] ← THIS MODULE
    [Skill Discovery] → [Skill Orchestration] → [Skill Execution] →
  [Reasoning] → [Recommendation] → [Explainability] → Final Response
```

The Skill Registry sits between the Expertise Engine and the Context Engine. Expertise Profiles decide WHEN to use skills; the registry provides the skills themselves.

---

## 3. Core Principles

1. **Skills are capabilities, not reasoning engines.** Skills analyze evidence; they do not generate facts or perform independent reasoning.
2. **Never bypass the certified architecture.** Skills must retrieve evidence from Knowledge, Memory, and Events — never from external sources or internal state.
3. **Every output is explainable.** Every finding, metric, and recommendation must trace back to specific evidence items.
4. **Confidence reflects evidence quality.** Confidence scores are computed from evidence quality, consistency, and recency — never guessed.
5. **Skills are governed.** Every skill has a lifecycle, version, owner, and audit trail.
6. **Skills are validated.** Every skill must pass functional, integration, performance, edge-case, failure, confidence, and explainability tests.

---

## 4. Module Structure

```
src/lib/hospitality-ai/skill-registry/
├── index.ts                      # Public API barrel
├── types.ts                      # Domain model (all TypeScript types)
├── utils.ts                      # Utility helpers (hashing, math, text)
├── registry.ts                   # Core registry (registration, lookup, catalog)
├── skill-executor-base.ts        # Builder helpers for skill definitions and executors
├── skill-registration.ts         # Registers all 57 skills with the registry
├── discovery-engine.ts           # Selects relevant skills for a request
├── orchestration-engine.ts       # Plans and executes multi-skill workflows
├── governance-engine.ts          # Lifecycle, versioning, audit, compliance
├── validation-framework.ts       # 7-type skill validation
├── validation-suite.ts           # Production validation suite (33 tests)
├── api.ts                        # Unified API (8 endpoints)
└── skills/
    ├── operational-analysis.ts       # 8 skills
    ├── financial-analysis.ts         # 7 skills
    ├── customer-intelligence.ts      # 7 skills
    ├── staff-intelligence.ts         # 7 skills
    ├── inventory-intelligence.ts     # 7 skills
    ├── kitchen-intelligence.ts       # 7 skills
    ├── executive-intelligence.ts     # 7 skills
    └── continuous-improvement.ts     # 7 skills
```

**Total: 57 skills across 8 categories, 12 core files, 8 skill files.**

---

## 5. Skill Domain Model

The core entity is `OperationalSkill`, which defines:
- **Identity:** id, name, description, category, version
- **Lifecycle:** status (draft → experimental → validated → production → deprecated → retired)
- **Ownership:** owner, tags
- **Applicability:** supportedDomains, supportedExpertiseProfiles, supportedIntents, supportedReasoningStrategies
- **Evidence Requirements:** requiredKnowledgeCategories, requiredMemoryTypes, requiredEventTypes
- **Interface:** inputs, outputs
- **Quality:** confidenceRules, explainabilityRules, validationRules
- **Metadata:** estimatedCost, dependencies
- **Audit:** createdAt, updatedAt, approvedAt, approvedBy, changeHistory

---

## 6. Skill Categories

| Category | Count | Description |
|----------|-------|-------------|
| operational_analysis | 8 | Bottleneck detection, capacity, queue, throughput, wait time, peak hours, efficiency, resource utilization |
| financial_analysis | 7 | Revenue, margin, cost, profit opportunity, revenue trends, pricing, payment flow |
| customer_intelligence | 7 | Satisfaction, loyalty, complaints, flow, segmentation, repeat customers, experience quality |
| staff_intelligence | 7 | Productivity, workload, coaching, shift performance, utilization, trends, training needs |
| inventory_intelligence | 7 | Forecast, waste, reorder, supplier reliability, stock levels, shortage risk, turnover |
| kitchen_intelligence | 7 | Station load, bottlenecks, ticket flow, prep efficiency, capacity, food quality, staff performance |
| executive_intelligence | 7 | Executive summary, operational health, risk dashboard, weekly review, strategic opportunities, cross-department, scorecard |
| continuous_improvement | 7 | Process optimization, friction detection, business rule validation, improvement opportunities, performance gaps, best practices, improvement tracking |

---

## 7. Skill Lifecycle

```
draft → experimental → validated → production → deprecated → retired
                ↓           ↓          ↓
            retired      retired    retired
                                      ↑
                              deprecated (can reactivate to production)
```

| From | Allowed Transitions |
|------|-------------------|
| draft | experimental, retired |
| experimental | validated, deprecated, retired |
| validated | production, deprecated, retired |
| production | deprecated, retired |
| deprecated | retired, production (reactivation) |
| retired | (terminal state) |

---

## 8. Integration Points

```
                    ┌──────────────────┐
                    │  Skill Registry  │
                    │   (registry.ts)  │
                    └────────┬─────────┘
                             │
           ┌─────────────────┼─────────────────┐
           ↓                 ↓                 ↓
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │  Discovery   │  │ Orchestration│  │ Governance   │
    │   Engine     │  │   Engine     │  │   Engine     │
    └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
           │                 │                 │
           └────────┬────────┘                 │
                    ↓                          │
            ┌──────────────┐                   │
            │  Validation  │←──────────────────┘
            │  Framework   │
            └──────────────┘
```

- **Discovery Engine** selects skills based on intent, domain, profile, strategy, and evidence availability
- **Orchestration Engine** plans and executes multi-skill workflows (sequential, parallel, pipeline, fan-out/fan-in)
- **Governance Engine** manages lifecycle, versioning, approvals, compliance, and health
- **Validation Framework** runs 7 test types per skill
- **API** wraps all engines into 8 unified endpoints

---

## 9. Design Decisions

1. **Singleton pattern for all engines** — Ensures single source of truth and consistent state across the application.
2. **Builder pattern for skill definitions** — `createSkillDefinition()` fills in defaults (requiredContext, confidenceRules, etc.) so skill authors only specify what's unique.
3. **Evidence-first design** — Every skill executor starts with `extractEvidence(context)` and ends with `buildExplainability(context, ...)`. This enforces the architectural constraint that skills never bypass evidence.
4. **Scoring-based discovery** — Skills are scored on 5 dimensions (intent 30%, domain 25%, profile 20%, strategy 15%, evidence 10%) rather than hard matching, allowing partial matches and cross-domain skills.
5. **Deduplication in orchestration** — Combined findings are deduplicated by title to prevent redundant alerts when multiple skills identify the same issue.
6. **Auto-initialization** — The API auto-initializes the registry on first use, registering all 57 skills.

---

## 10. Constraints and Guarantees

### Guarantees
- Every skill execution produces structured findings, metrics, evidence, and explainability
- Confidence is always in [0, 1] and computed from evidence quality
- Every skill has a complete audit trail
- Discovery completes in <100ms
- Single skill execution completes in <5ms
- Orchestration of 3 skills completes in <10ms

### Prohibitions
- Skills MUST NOT generate business facts
- Skills MUST NOT bypass Knowledge, Memory, or Events
- Skills MUST NOT store hidden state between executions
- Skills MUST NOT perform independent reasoning beyond their defined analysis
- Skills MUST NOT access external APIs or databases directly
- Recommendations MUST be traceable to specific evidence items

---

## Certification

**Status:** CERTIFIED — PRODUCTION READY  
**Validation:** 33/33 tests passed (100% pass rate)  
**Skills:** 57 registered, 57 compliant, 8 categories  
**Date:** 2026-07-23
