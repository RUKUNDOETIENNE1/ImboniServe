# OEC-001E Cross-Center Decision Consistency Report

## Do the 7 Executive Centers Feel Like One Brain?

---

## 1. Shared Metrics Reconciliation

### Metrics Used Across Centers

| Metric | CEO | CFO | COO | CMO | Partnership | CS Director | Exec Intel |
|--------|-----|-----|-----|-----|-------------|-------------|------------|
| MRR | ✅ | ✅ | — | ✅ | — | — | ✅ |
| ARR | ✅ | ✅ | — | ✅ | — | — | ✅ |
| GMV | ✅ | ✅ | — | — | — | — | ✅ |
| Revenue | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Churn | ✅ | ✅ | — | — | — | ✅ | ✅ |
| Commission | ✅ | ✅ | — | — | ✅ | — | ✅ |
| Active Businesses | ✅ | — | ✅ | ✅ | — | ✅ | ✅ |
| Active Partners | ✅ | — | ✅ | ✅ | ✅ | — | ✅ |

### Reconciliation Verification

**Finding: Metrics are calculated CONSISTENTLY across centers using shared services.**

All executive centers import the same shared services:
- `FinancialHealthService` — single source of truth for MRR, ARR, GMV
- `PartnershipOperationalQueryService` — single source of truth for partnership metrics
- `PaymentWatchdogService` — single source of truth for payment health
- `ReconciliationWatchdogService` — single source of truth for reconciliation
- `SubscriptionWatchdogService` — single source of truth for subscription health

**Score: 5/5 — Excellent**

---

## 2. Decision Consistency

### Do Decisions Contradict?

**Finding: No contradictions detected.** Because all centers use the same shared services for core metrics, their recommendations are based on the same underlying data. The AI recommendations are deterministic and rule-based, so they won't generate contradictory advice.

### Do Centers Reinforce One Another?

**Finding: Yes — centers reinforce through the Executive Intelligence Engine.** The engine composes data from all centers and generates cross-center decisions that explicitly reference multiple centers. For example:
- A CMO conversion rate drop + Partnership Director partner churn = Executive Intelligence decision about partner retention
- A CFO failed payment + COO support queue spike = Executive Intelligence risk about customer satisfaction

**Score: 4/5 — Strong** (No explicit contradiction detection, but shared services prevent contradictions)

---

## 3. Terminology Consistency

### Entity Naming

| Term | Usage | Consistency |
|------|-------|-------------|
| partner | CEO, CFO, Partnership Director | ✅ Consistent |
| founder partner | CEO, Partnership Director | ✅ Consistent |
| business | CEO, COO, Customer Success | ⚠️ Mixed with "restaurant" |
| restaurant | CEO, COO, CMO | ⚠️ Mixed with "business" |
| hospitality business | COO | ⚠️ Unique variant |
| customer | CEO, Customer Success | ✅ Consistent |

### Metric Naming

| Metric | All Centers | Consistency |
|--------|-------------|-------------|
| MRR | Same name everywhere | ✅ |
| ARR | Same name everywhere | ✅ |
| GMV | Same name everywhere | ✅ |
| Revenue | Same name everywhere | ✅ |
| Churn | Same name everywhere | ✅ |
| Commission | Same name everywhere | ✅ |

### Severity Levels

| Level | Color | All Centers | Consistency |
|-------|-------|-------------|-------------|
| CRITICAL | red | ✅ All use same | ✅ Perfect |
| HIGH | orange | ✅ All use same | ✅ Perfect |
| MEDIUM | amber | ✅ All use same | ✅ Perfect |
| LOW | blue | ✅ All use same | ✅ Perfect |

**Score: 4/5 — Strong** (Severity perfect; entity naming has business/restaurant inconsistency)

---

## 4. Executive Confidence Preservation

### Does the System Maintain Executive Confidence?

| Factor | Status | Notes |
|--------|--------|-------|
| Consistent metrics | ✅ | Shared services ensure same numbers |
| Consistent severity | ✅ | 4-level system everywhere |
| Evidence-based recommendations | ✅ | All AI assistants show evidence |
| Confidence scores | ✅ | All AI assistants show confidence % |
| Deterministic recommendations | ✅ | Rule-based, not random |
| Source attribution | ✅ | Executive Intelligence shows source per data point |
| Replay links | ✅ | Recommendations link to source events |

**Score: 5/5 — Excellent**

---

## 5. Navigation Consistency

### Center Naming in Navigation

| Navigation Label | File | Consistency |
|-----------------|------|-------------|
| CEO Command Center | ceo.tsx | ✅ |
| CFO Command Center | cfo.tsx | ✅ |
| COO Command Center | coo.tsx | ✅ |
| CMO Command Center | cmo.tsx | ✅ |
| Partnership Command Center | partnership-director.tsx | ⚠️ "Command Center" vs "Operating Center" |
| Customer Success Center | customer-success-director.tsx | ⚠️ "Center" vs "Command Center" |
| Executive Intelligence | executive-intelligence.tsx | ✅ |

### Cross-Center Navigation

**Finding: LIMITED cross-center navigation.** Most centers navigate to operational admin pages, not to other executive centers. Only the Executive Intelligence Engine provides cross-center navigation via the Center Health Radar.

**Score: 3/5 — Moderate** (Limited cross-center links)

---

## 6. Overall Cross-Center Consistency Score: 4.2/5 — Strong

**Strengths**: Shared services ensure metric consistency, perfect severity consistency, deterministic recommendations, source attribution, evidence-based  
**Gaps**: Business/restaurant terminology inconsistency, limited cross-center navigation, no explicit contradiction detection
