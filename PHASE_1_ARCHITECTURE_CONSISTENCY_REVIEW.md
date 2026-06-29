# Phase 1 — Architecture Consistency Review (1.1A-V)

Date: June 22, 2026
Type: Architecture Validation Only (No Implementation)
Reviewer: Cascade

---

## 1) Executive Summary

The observability, watchdog, and executive-intelligence architecture is broadly consistent, cohesive, and aligned with the intelligence hierarchy and ledger-first governance. KPI definitions used by scorecards and watchdogs match the KPI Catalog; severity and escalation frameworks are coherent; and the roadmap generally respects dependencies (diagnostic before predictive).

One material inconsistency was identified: the placement of the Executive KPI Watchdog and minimal executive dashboard in Phase 1.1D (Observability Implementation Plan) conflicts with the approved roadmap and prior guidance that positions executive dashboards/monitoring in Phase 1.2. This can be corrected by moving executive monitoring deliverables to Phase 1.2.

With this adjustment, the architecture is mature enough to begin Phase 1.1B (Payment + Queue watchdogs, alert framework, startup guard).

---

## 2) Consistency Score — 93/100

- KPI consistency: 96/100
- Watchdog consistency: 92/100
- Roadmap consistency: 90/100 (due to Exec KPI Watchdog placement)
- Executive reporting consistency: 94/100
- Backlog consistency: 92/100
- Deferred work governance: 98/100

---

## 3) Confirmed Strengths

- **Ledger-first governance**: All financial analytics and KPIs consistently source from `FinancialLedgerEntry`.
- **KPI alignment**: MRR, ARR, GMV, NRR, Churn, ARPA, Occupancy, ADR, RevPAR, AOV definitions are consistent across KPI Catalog, Scorecards, and Executive Watchdog.
- **Severity discipline**: ALERT_SEVERITY_FRAMEWORK defines INFO/WARN/ERROR/CRITICAL with clear routing, cooldowns, and escalation.
- **Watchdog completeness**: Seven watchdogs fully specified with thresholds, cadence, routing, cooldowns, and future evolution.
- **Roadmap structure**: Diagnostic hospitality layer (1.25) precedes forecasting (1.3), preserving causal understanding.
- **No deferred-dependency leaks**: Implementation plan avoids provider testing and production credentials.

---

## 4) Contradictions Found

- **Executive KPI Watchdog placement**
  - OBSERVABILITY_IMPLEMENTATION_PLAN: Places Executive KPI Watchdog + executive summaries + minimal executive dashboard in Phase 1.1D.
  - PHASE_1_EVOLUTION_ROADMAP and EXECUTIVE_SCORECARD_DESIGN: Place Executive KPI Watchdog and dashboards in Phase 1.2.
  - Impact: Breaks roadmap separation of concerns; risks scope creep in 1.1.

- **Occupancy monitoring nuance**
  - BUSINESS_INTELLIGENCE_BACKLOG: Occupancy Watchdog depends on forecasting (Phase 1.3).
  - EXECUTIVE_KPI_WATCHDOG_DESIGN: Includes static occupancy thresholds (no forecasting) for exec visibility.
  - Impact: Not a blocker; requires a clarifying note that exec monitoring uses static thresholds, while the dedicated Occupancy Watchdog (ops) is forecasting-aware and belongs to 1.3.

- **Terminology mapping**
  - EXECUTIVE_SCORECARD_DESIGN uses "Critical/Warning/Healthy" visuals; ALERT_SEVERITY_FRAMEWORK uses INFO/WARN/ERROR/CRITICAL.
  - Impact: Minor; add explicit mapping: Healthy → No alert/INFO, Warning → WARN, Critical → ERROR/CRITICAL (by threshold).

---

## 5) Missing Elements (Genuine Gaps)

- **Data Freshness & Completeness Watchdog**
  - Gap: Quality checks (freshness, completeness, consistency) are referenced in HOSPITALITY_INTELLIGENCE_BLUEPRINT but no dedicated watchdog exists.
  - Recommendation: Add "Data Quality Watchdog" to backlog (1.1C-1.1E candidate) to alert on stale aggregations and null-heavy fields affecting KPIs.

- **Alert delivery heartbeat (non-intrusive)**
  - Gap: Startup channel guard (log) exists; consider a periodic low-noise heartbeat (weekly INFO) to confirm Slack/Email channels function end-to-end.
  - Recommendation: Add to OBSERVABILITY_IMPLEMENTATION_PLAN as INFO-only, routed to #info-alerts.

- (No other gaps identified; watchdog and scorecard portfolios are sufficient for Phase 1 goals.)

---

## 6) Recommended Corrections (Minimal Set)

- **C1 — Align Executive Monitoring to Phase 1.2**
  - Move Executive KPI Watchdog, executive summaries, and minimal executive dashboard from 1.1D to Phase 1.2 in OBSERVABILITY_IMPLEMENTATION_PLAN.
  - Rationale: Matches approved roadmap and maintains 1.1 focus on operational observability.

- **C2 — Clarify Occupancy Monitoring Split**
  - Add note in BUSINESS_INTELLIGENCE_BACKLOG and EXECUTIVE_KPI_WATCHDOG_DESIGN: exec occupancy thresholds are static (Phase 1.2); the dedicated Occupancy Watchdog remains Phase 1.3+ (forecast-aware).

- **C3 — Severity Vocabulary Mapping**
  - In EXECUTIVE_SCORECARD_DESIGN, add a one-line mapping to ALERT_SEVERITY_FRAMEWORK: Healthy → none/INFO; Warning → WARN; Critical → ERROR/CRITICAL.

- **C4 — Add Data Quality Watchdog to Backlog**
  - Add a backlog item under Future Watchdogs: "Data Quality Watchdog" (freshness, completeness, consistency), Priority: Medium, Phase: 1.1E or 1.2.

- **C5 — Optional Heartbeat**
  - Add a weekly INFO-level "Alert Delivery Heartbeat" to OBSERVABILITY_IMPLEMENTATION_PLAN to validate Slack/Email reachability.

---

## 7) Revised Priority Order (Watchdogs)

- **1. Payment Watchdog** (1.1B) — Highest immediate revenue impact
- **2. Queue Watchdog** (1.1B) — Prevents silent failures
- **3. Reconciliation Watchdog** (1.1C) — Financial accuracy and compliance
- **4. Subscription Watchdog** (1.1C) — MRR protection
- **5. Revenue Watchdog** (1.1C) — Strategic revenue trends
- **6. Data Quality Watchdog** (NEW, backlog) — Safeguards KPI trust
- **7. Customer Watchdog** (1.1D/1.2) — Retention focus
- **8. Executive KPI Watchdog** (Move to 1.2) — Strategic visibility for leadership

Note: Executive monitoring intentionally follows operational watchdog maturity.

---

## 8) Go / No-Go for Phase 1.1B Implementation

- **Decision**: GO
- **Rationale**: Identified inconsistencies do not affect Phase 1.1B scope (Payment + Queue + Alert Framework + Startup Guard). They are addressed by moving executive monitoring to Phase 1.2 and adding clarifications.

### Exact Next Implementation Phase
- **Phase 1.1B — Minimal Implementation (Weeks 1-2)**
  - Payment Watchdog (v1): failure rate, webhook validation failures, payment latency p95
  - Queue Watchdog (v1): DLQ counts, backlog growth, time-to-drain, stall detection
  - Alert Severity Framework: standardized alert format, cooldown and escalation logic
  - Startup Channel Guard: Slack/Email presence checks at boot

Dependencies: None (no provider credentials). Data sources are available. No schema changes.

---

## Appendix — Cross-Document Consistency Notes

- **KPI Catalog ↔ Scorecards ↔ Exec Watchdog**: KPI names and formulas align (MRR/ARR/GMV/NRR/Churn/ARPA/Occupancy/ADR/RevPAR/AOV). Thresholds are compatible (WARN/ERROR/CRITICAL vs Warning/Critical visuals).
- **Watchdog Blueprint ↔ Specification ↔ Implementation Plan**: Portfolio, severities, cooldowns, and routing align; only executive placement needs correction.
- **Roadmap**: 1.1 (observability & watchdogs) → 1.2 (exec dashboards + exec watchdog) → 1.25 (diagnostic hospitality) → 1.3 (forecasting) → 2.0 (prescriptive) is preserved after C1.
- **Deferred Work Governance**: No 1.1B-1.1E item requires InTouch/Irembo production testing or credentials; all rely on existing data.
