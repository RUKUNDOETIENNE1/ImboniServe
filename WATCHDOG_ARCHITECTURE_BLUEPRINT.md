# Watchdog Architecture Blueprint (Phase 1.0A)

Date: June 22, 2026
Principles: Minimal operational burden, clear SLOs, alerts with context, progressive escalation, no noisy paging.

---

## 1) Watchdog Portfolio (v1 → v2)

- Payment Watchdog (v1)
  - Inputs: webhook validation failures, provider failure rates (rolling 5m/1h), latency p95
  - Rules: alert on >1% failure or 3× baseline for 5m; high latency > p95 threshold
  - Actions: route to ops; tag provider; attach last N errors and incident timeline
  - v2: automatic provider failover recommendation, rate-limited retries

- Reconciliation Watchdog (v1)
  - Inputs: unreconciled count/age, reconciliation job failures
  - Rules: alert if unreconciled > N or max age > 24h; on job failure emit error alert
  - v2: auto-queue reconciler for targeted accounts; exception classification

- Queue Backlog Watchdog (v1)
  - Inputs: queue depth, DLQ count/day, processing rate
  - Rules: alert on first DLQ event; warn on backlog growth > threshold; error if time-to-drain > SLA
  - v2: autoscaling signals; anomaly-based thresholds

- Subscription Churn Watchdog (v1)
  - Inputs: grace/past-due aging, churn events, rescue funnel drop-offs
  - Rules: alert at 3/7/14-day marks for grace; weekly churn spike > baseline
  - v2: recommend targeted rescue campaigns and offers

- Revenue Anomaly Watchdog (v1)
  - Inputs: ledger-based revenue trend vs rolling baseline
  - Rules: alert on >3σ deviation after seasonality adjustment
  - v2: add forecast-aware residual checks

- Customer Churn Watchdog (v1)
  - Inputs: FRM segments crossing inactivity thresholds
  - Rules: alert on high-value customers turning dormant
  - v2: predictive churn model with early-warning risk scores

---

## 2) Event Model & Contracts

- Source-of-Truth: `FinancialLedgerEntry` for revenue events
- Operational Events: webhook events, queue metrics, cron outcomes, alert-delivery outcomes
- Contract: immutable event stream; idempotent processing by derived systems; schema registered in a central catalog

---

## 3) Implementation Plan (Non-invasive v1)

- Collection
  - Expose minimal endpoints/cron to compute rolling metrics (failure rates, queue depth, unreconciled counts)
  - Emit periodic summaries (hourly/daily) to Slack/email
- Detection
  - Threshold-based rules with cooldown (e.g., do not alert more than once per 30m per rule)
  - Severity mapping: warn (early), error (sustained), critical (persistent or high-impact)
- Delivery
  - Reuse AlertDeliveryService; add channel guard at boot (warn if both channels disabled)
- Storage (optional)
  - Append-only log of watchdog events for auditing and tuning thresholds

---

## 4) SLOs & Thresholds (Initial)

- Payments: provider failure rate ≤ 1% in rolling 1h; latency p95 under defined provider SLO
- Reconciliation: backlog age ≤ 24h; exceptions cleared within 48h
- Queues: DLQ backlog = 0; time-to-drain under SLA per queue
- Subscriptions: grace aging alerts at 3/7/14d; churn within expected baseline
- Revenue: daily trend variance within 3σ of rolling baseline

---

## 5) Escalation Policy

- Tier 0: Warn to Slack/email with context + links (no paging)
- Tier 1: Error with retry suggestion or playbook link
- Tier 2: Critical after persistence across 2–3 windows; include exec visibility summary

---

## 6) Future (v2+)

- Anomaly-based dynamic thresholds (seasonality-aware)
- Forecast-aware alerting (compare to predicted residuals)
- Automated remediation suggestions (e.g., queue scale-up, targeted reconciles)
- Unified incident timeline across providers and queues
