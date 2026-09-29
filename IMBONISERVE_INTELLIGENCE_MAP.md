# ImboniServe Intelligence Map (Phase 1.0A)

Date: June 22, 2026
Readiness: 81/100 (GO with monitoring)
Source of Truth: All financial analytics must read from `FinancialLedgerEntry`. Execution/audit tables (e.g., `PaymentTransaction`, `Subscription`, `MarketplaceOrder`, `BillingEvent`) are not to be used for revenue or KPI aggregation.

---

## 1) Executive Intelligence

Goal: Executive-level visibility for growth, health, and risk.

- Revenue Intelligence
  - KPIs: MRR, ARR, GMV, Net Revenue, Growth Rate, ARPA, Expansion/Contraction, Net Revenue Retention
  - Cuts: by segment (hotel/restaurant), plan tier, region, channel
  - Views: trends, cohorts, concentration (top-N customers), forecast overlay (Phase 1.3)

- Payment Intelligence
  - KPIs: Authorization Success Rate, Provider Failure Rate, Latency p50/p95, Refund/Chargeback Rate, Idempotency collisions
  - Provider Health: InTouch vs IremboPay, error code taxonomy, outage detection, retry efficacy
  - Views: last 24h heatmap, weekly trend, incident timeline

- Hotel Performance Intelligence
  - KPIs: Occupancy, ADR (avg daily rate), RevPAR, Booking Lead Time, Length of Stay
  - Cuts: property, region, channel, seasonality
  - Views: daily pickup, pacing vs forecast

- Restaurant Performance Intelligence
  - KPIs: AOV, Orders/Day, Table Turnover, Menu Mix, Repeat Rate, Promo Lift
  - Cuts: service type (dine-in, pickup, delivery), menu category, location
  - Views: peak periods, contribution margin by item (if COGS available)

- Subscription Intelligence
  - KPIs: Active Subs, New/Expansion/Contraction/Churn, MRR delta, Churn %, LTV, Payback
  - Cohorts: acquisition month, plan, channel
  - Views: funnel (trial→activated→retained), grace/past-due aging

- Customer Behavior Intelligence
  - KPIs: Frequency, Recency, Monetary (FRM), LTV, Tenure, Referral Rate
  - Segments: high-value, at-risk, dormant, new
  - Views: lifecycle stage transitions, journey analytics

---

## 2) Operational Intelligence

Goal: Day-to-day operational visibility and actionability.

- Failed Payments & Recovery
  - Signals: provider error spikes, recurring failure codes, long-tail pending
  - Actions: targeted retries, outreach cadences, plan fallback

- Subscription Churn & Grace States
  - Signals: payment failures leading to churn, grace/past-due durations, downgrades
  - Actions: rescue offers, dunning workflows, success routing

- Inactive Customers
  - Signals: FRM thresholds breached, session inactivity windows
  - Actions: engagement campaigns, concierge assistance

- Reconciliation Anomalies
  - Signals: ledger vs execution-layer mismatches, unreconciled > SLA, duplicate/late events
  - Actions: reconciliation job runbooks, exception handling

- Service Disruptions
  - Signals: outage declared (>X% failure/5m), webhook validation failures, increased latency
  - Actions: incident runbook, provider switch, customer comms

- Queue Backlogs
  - Signals: DLQ backlog > 0, backlog growth rate > threshold, time-to-drain SLA breaches
  - Actions: autoscaling signals, job throttling, prioritization

---

## 3) Data Model & Sources

- Primary Financial Source: `FinancialLedgerEntry`
  - Immutable, idempotent, single source for revenue analytics and executive reporting
- Execution/Audit Layers (reference only): `PaymentTransaction`, `Subscription`, `MarketplaceOrder`, `BillingEvent`
- Operational Signals: webhook events, BullMQ metrics (queue depth, DLQ, attempts), cron outcomes, AlertDelivery events
- Dimensional Data: Customer, Business/Property/Location, Plan, Catalog/Menu, Calendar/Holiday

---

## 4) Core Metrics & Thresholds (Initial)

- Webhook Success Rate ≥ 99.5% daily; Validation Failures = 0
- Provider Failure Rate ≤ 1% rolling 1h; Alert on 3x baseline
- Reconciliation SLA: 24h max; Alert on unreconciled > N or age > 24h
- Queue DLQ Backlog: 0; Alert on first DLQ event; Escalate if >5/day
- Subscription Grace Aging: Alert at 3/7/14 days
- Revenue Variance: Alert if |actual - forecast| > 3σ (when forecasting available)

---

## 5) Dashboards & Views (Initial)

- Executive Overview: MRR/ARR/GMV, growth, top risks, provider health summary
- Provider Operations: failure rate by provider/code, latency, incidents, retries
- Ledger Reconciliation: unreconciled volumes/ages, exceptions, job success trend
- Queue Health: backlog, DLQ events, processing rate, time-to-drain
- Subscription Health: churn, expansion/contraction, grace aging, rescue funnel
- Customer Intelligence: FRM segments, dormant cohorts, repeat patterns

---

## 6) Governance & Runbooks

- Invariants: financial reporting uses only `FinancialLedgerEntry`
- Idempotency: enforced via unique `idempotencyKey` in ledger
- Alerting: Slack/Email via AlertDeliveryService; severity mapping and cooldowns
- Runbooks: incident (payments), reconciliation exceptions, DLQ triage, churn rescue
- Data Quality: schema contracts for ledger entries; monitoring for missing/invalid dimensions

---

## 7) Phase Interfaces (Dependency Notes)

- Deferred Work (tracked in docs/DEFERRED_WORK_REGISTRY.md)
  - InTouch/IremboPay live testing; production webhook credentials; watchdog jobs v2; anomaly detection v2
- Phase 1.1: Observability consolidation and watchdog v1 (no external credentials required)
- Phase 1.2: Executive dashboards powered by `FinancialLedgerEntry`
- Phase 1.3: Forecasting & predictive models (offline evaluation then gated rollout)
- Phase 2: Autonomous remediation and advanced recommendations
