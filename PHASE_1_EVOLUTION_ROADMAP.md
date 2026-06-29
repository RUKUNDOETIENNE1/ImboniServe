# Phase 1 — Evolution Roadmap

Date: June 22, 2026
Readiness: 81/100 (GO with monitoring)
Dependencies: Consult docs/DEFERRED_WORK_REGISTRY.md before each phase.

---

## Prioritization Criteria

- Business Impact (Revenue, Retention, Risk)
- Implementation Complexity (Effort, Dependencies)
- Operational Value (SLOs, MTTR, On-call burden)

---

## Phase 1.1 — Observability & Watchdogs (4–6 weeks)

Why now: Highest operational leverage without external credentials. Reduces MTTR and improves reliability.

- Watchdog v1 portfolio (Payments, Reconciliation, Queue Backlog, Subscription Grace Aging, Revenue Anomaly)
- Observability consolidation
  - Standardize alert format; add startup channel guard (warn if no Slack/Email)
  - Hourly/daily summaries (cron) for DLQ counts, unreconciled, provider failures
- Executive Overview (read-only)
  - Minimal dashboards powered by `FinancialLedgerEntry` aggregates (no schema changes)
- Success: Reduced incidents’ time-to-detect; consistent alerting; first exec visibility

---

## Phase 1.2 — Executive Intelligence Dashboards (4–6 weeks)

Why now: Business visibility for growth and performance.

- Revenue Intelligence: MRR/ARR/GMV trends, concentration, cohorts
- Provider Health: failure/latency trends & incident timelines
- Subscription Health: churn/expansion/contraction, grace aging, rescue funnel
- Executive Scorecards: CEO, Operations, Finance, Revenue (descriptive intelligence)
- Executive KPI Watchdog: Alert on critical business metric deterioration
- Success: Trusted, ledger-backed dashboards for leadership

---

## Phase 1.25 — Hospitality Intelligence Layer (4–6 weeks) ← NEW

Why now: Diagnostic intelligence must precede forecasting. Understand **why** before predicting **what**.

- Restaurant Intelligence: revenue by category/meal period, product performance, margin, repeat customers
- Hotel Intelligence: occupancy, ADR, RevPAR, guest retention, booking channels
- Customer Intelligence: RFM segmentation, lifecycle stages, health scores, dormancy detection
- Branch Intelligence: performance ranking, risk scores, retention by branch
- Diagnostic Capabilities: drill-downs, cohort analysis, attribution, causal understanding
- Success: Rich diagnostic intelligence enables accurate forecasting in Phase 1.3

---

## Phase 1.3 — Forecasting & Predictive Models (6–8 weeks)

Why now: Move from diagnostic → predictive, with guardrails.

- Revenue forecasting (ledger-based), churn prediction, anomaly detection (providers)
- Offline → shadow → gated rollout
- Add forecast-aware residual checks to watchdogs
- Success: Early-warning signals; improved planning; lower churn and failures

---

## Phase 2.0 — Autonomous Recommendations & Remediation (8–12 weeks)

Why next: Actionability and ROI at scale.

- Remediation advisor suggests actions for payments/queues/reconciliation
- Intelligent recommendations for restaurants (menu, bundles) with margin guardrails
- Time-to-drain forecasting informs autoscaling
- Success: Measurable improvements in conversion, retention, and MTTR

---

## Governance & Continuity

- Always use `FinancialLedgerEntry` for revenue analytics and executive reporting
- Maintain docs/DEFERRED_WORK_REGISTRY.md — update on every deferral
- No production schema or feature changes without readiness checks and rollbacks
- Security and idempotency remain non-negotiable invariants
