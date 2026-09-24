# Watchdog Specification (Phase 1.1A)

Date: June 22, 2026
Type: Planning & Specification (No Implementation)
Purpose: Complete watchdog architecture for Phase 1.1 implementation

---

## Context Review

### Deferred Work Affected
- **Future Monitoring (Deferred)**: Watchdog jobs, payment anomaly detection, advanced observability
  - Status: Phase 1.1 will implement v1 of these items; advanced features remain deferred to Phase 1.3+
- **Payment Testing (Deferred)**: Not affected; watchdogs will monitor existing payment infrastructure
- **Production Configuration (Deferred)**: Not affected; watchdogs work with or without InTouch credentials

### Intelligence Backlog Affected
- **Future Watchdogs**: Executive KPI, Branch Health, Menu Performance, Occupancy, Enhanced Customer Churn
  - Status: Executive KPI Watchdog promoted to Phase 1.2; others remain in backlog for Phase 1.25+

### Assumptions
- AlertDeliveryService (Slack + Email) already exists and functional
- `FinancialLedgerEntry` is authoritative for revenue metrics
- BullMQ queue metrics are accessible
- Reconciliation job outcomes are logged
- Payment transaction data is complete and timestamped

---

## Watchdog Portfolio (v1)

### 1. Payment Watchdog

**Purpose**: Detect payment system degradation and provider issues before revenue impact

**Monitor:**
- Payment failure rate (by provider, error code, time window)
- Provider degradation (latency spikes, timeout increases)
- Settlement delays (time from `paidAt` to settlement)
- Webhook validation failures (signature, auth, idempotency)

**Data Sources:**
- `PaymentTransaction` (status, provider, timestamps, error codes)
- Webhook event logs (validation outcomes, latency)
- AlertDeliveryService delivery logs (webhook failure alerts)

**Alert Conditions:**

| Condition | Threshold | Severity | Cooldown | Escalation |
|-----------|-----------|----------|----------|------------|
| Provider failure rate > 1% (1h rolling) | > 1% | WARN | 30 min | Ops |
| Provider failure rate > 3% or 3× baseline | > 3% | ERROR | 15 min | Ops + On-call |
| Webhook validation failures | > 0 | ERROR | 1 hour | Ops |
| Payment latency p95 > 2× SLA | > 2× SLA | WARN | 1 hour | Ops |
| Settlement delay > provider SLA + 1 day | > SLA + 1d | WARN | 24 hours | Finance |
| Provider failure spike (5× baseline in 5 min) | 5× baseline | CRITICAL | 5 min | Ops + Exec |

**Cooldown Policies:**
- WARN: 30 min (prevents alert storm during transient issues)
- ERROR: 15 min (faster escalation for persistent issues)
- CRITICAL: 5 min (immediate escalation, minimal cooldown)

**Escalation:**
- **First Alert (WARN)**: Slack ops channel
- **Repeated Alert (ERROR)**: Slack ops + Email on-call
- **Persistent Incident (CRITICAL)**: Slack ops + Email on-call + Exec summary (if > 30 min)

**Future Evolution (Phase 1.3+):**
- Anomaly-based thresholds (seasonality-aware)
- Automatic provider failover recommendations
- Forecast-aware residual checks
- ML-based error code classification

---

### 2. Reconciliation Watchdog

**Purpose**: Ensure financial accuracy and timely reconciliation

**Monitor:**
- Unreconciled entry count and age
- Reconciliation SLA breaches (> 24 hours)
- Reconciliation job failures
- Ledger vs execution-layer mismatches

**Data Sources:**
- `FinancialLedgerEntry` (reconciliation status, timestamps)
- Reconciliation cron job logs (success/failure, duration)
- `PaymentTransaction`, `Subscription`, `Sale` (execution layers for comparison)

**Alert Conditions:**

| Condition | Threshold | Severity | Cooldown | Escalation |
|-----------|-----------|----------|----------|------------|
| Unreconciled count > 10 | > 10 | WARN | 1 hour | Finance |
| Unreconciled count > 50 | > 50 | ERROR | 30 min | Finance + Ops |
| Max unreconciled age > 24h | > 24h | ERROR | 6 hours | Finance + Ops |
| Reconciliation job failure | Any failure | ERROR | 1 hour | Ops |
| Reconciliation SLA compliance < 99% | < 99% | WARN | 24 hours | Finance |
| Ledger mismatch detected | Any mismatch | CRITICAL | Immediate | Finance + Exec |

**Cooldown Policies:**
- WARN: 1 hour (daily reconciliation cycles)
- ERROR: 30 min (persistent issues need attention)
- CRITICAL: Immediate (financial accuracy is non-negotiable)

**Escalation:**
- **First Alert (WARN)**: Slack finance channel
- **Repeated Alert (ERROR)**: Slack finance + Email finance team
- **Persistent Incident (CRITICAL)**: Slack finance + Email finance + Exec summary

**Future Evolution (Phase 1.3+):**
- Auto-queue targeted reconciliation for specific accounts
- Exception classification (transient vs systemic)
- Predictive SLA breach warnings

---

### 3. Queue Watchdog

**Purpose**: Ensure background job processing health and prevent backlog buildup

**Monitor:**
- Queue backlog depth (die_extract, die_intelligence)
- DLQ event count (permanent failures)
- Time-to-drain estimates
- Worker failure rates
- Processing rate trends

**Data Sources:**
- BullMQ queue metrics (backlog, active, completed, failed)
- DLQ counts (`die_extract_dlq`, `die_intelligence_dlq`)
- Worker event logs (job completion, failure, retry)

**Alert Conditions:**

| Condition | Threshold | Severity | Cooldown | Escalation |
|-----------|-----------|----------|----------|------------|
| DLQ event (first of day) | > 0 | WARN | 1 hour | Ops |
| DLQ events > 5/day | > 5 | ERROR | 6 hours | Ops |
| Backlog growth > 100 jobs/hour | > 100/h | WARN | 30 min | Ops |
| Time-to-drain > 4 hours | > 4h | ERROR | 1 hour | Ops |
| Worker failure rate > 10% | > 10% | ERROR | 30 min | Ops |
| Queue stalled (no progress in 30 min) | 30 min | CRITICAL | 15 min | Ops + On-call |

**Cooldown Policies:**
- WARN: 30 min to 1 hour (allow for transient spikes)
- ERROR: 30 min to 1 hour (persistent backlog needs intervention)
- CRITICAL: 15 min (stalled queue is urgent)

**Escalation:**
- **First Alert (WARN)**: Slack ops channel
- **Repeated Alert (ERROR)**: Slack ops + Email on-call
- **Persistent Incident (CRITICAL)**: Slack ops + Email on-call + Autoscaling recommendation

**Future Evolution (Phase 1.3+):**
- Time-to-drain forecasting (ML-based)
- Autoscaling triggers based on backlog trends
- Job priority classification and queue routing

---

### 4. Subscription Watchdog

**Purpose**: Detect subscription churn risks and revenue leakage early

**Monitor:**
- Grace period aging (subscriptions in GRACE/PAST_DUE)
- Churn spikes (cancellations above baseline)
- Renewal failures (payment failures at renewal)
- Rescue funnel drop-offs (grace → cancelled without intervention)

**Data Sources:**
- `Subscription` (status, timestamps, plan changes)
- `PaymentTransaction` (renewal payment outcomes)
- `FinancialLedgerEntry` (MRR changes, churn events)

**Alert Conditions:**

| Condition | Threshold | Severity | Cooldown | Escalation |
|-----------|-----------|----------|----------|------------|
| Subs in grace ≥ 3 days | > 10 subs | WARN | Daily | Revenue Ops |
| Subs in grace ≥ 7 days | > 5 subs | ERROR | Daily | Revenue Ops |
| Subs in grace ≥ 14 days | > 2 subs | ERROR | Daily | Revenue Ops + Finance |
| Churn spike (> 2× baseline) | > 2× baseline | WARN | Weekly | Revenue Ops |
| Churn spike (> 3× baseline) | > 3× baseline | ERROR | Weekly | Revenue Ops + Exec |
| Renewal failure rate > 5% | > 5% | WARN | Daily | Revenue Ops |

**Cooldown Policies:**
- WARN: Daily (grace aging is a daily check)
- ERROR: Daily to Weekly (churn trends need time to confirm)

**Escalation:**
- **First Alert (WARN)**: Slack revenue-ops channel
- **Repeated Alert (ERROR)**: Slack revenue-ops + Email revenue team
- **Persistent Incident (ERROR)**: Slack revenue-ops + Email revenue + Exec summary (weekly)

**Future Evolution (Phase 1.3+):**
- Churn prediction model (propensity scoring)
- Automated rescue campaign triggers
- Offer optimization based on churn risk

---

### 5. Revenue Watchdog

**Purpose**: Detect revenue anomalies and trend deterioration

**Monitor:**
- Revenue anomalies (vs rolling baseline)
- Trend deterioration (MRR/ARR/GMV decline)
- Revenue concentration risk (top-N customers)
- Unusual revenue patterns (spikes, drops, seasonality deviations)

**Data Sources:**
- `FinancialLedgerEntry` (revenue aggregates by period, segment, customer)
- Historical baselines (rolling 30/60/90-day averages)

**Alert Conditions:**

| Condition | Threshold | Severity | Cooldown | Escalation |
|-----------|-----------|----------|----------|------------|
| Daily revenue < 3σ below baseline | < -3σ | WARN | Daily | Finance |
| Weekly revenue decline > 10% | > 10% | WARN | Weekly | Finance + Exec |
| MRR decline > 5% MoM | > 5% | WARN | Monthly | Finance + Exec |
| MRR decline > 10% MoM | > 10% | ERROR | Monthly | Finance + Exec |
| Revenue concentration > 50% (top 10) | > 50% | WARN | Monthly | Finance + Exec |
| Unusual spike (> 3σ above baseline) | > +3σ | INFO | Daily | Finance (investigate) |

**Cooldown Policies:**
- WARN: Daily to Monthly (depends on metric cadence)
- ERROR: Monthly (strategic metric, avoid noise)
- INFO: Daily (spikes are informational, not urgent)

**Escalation:**
- **First Alert (WARN)**: Slack finance channel + Email finance
- **Repeated Alert (ERROR)**: Slack finance + Email finance + Exec summary
- **Persistent Incident (ERROR)**: Escalate to CEO/CFO (monthly review)

**Future Evolution (Phase 1.3+):**
- Forecast-aware residual checks (compare to predicted revenue)
- Seasonality-adjusted thresholds
- Causal attribution (why revenue changed)

---

### 6. Customer Watchdog

**Purpose**: Detect customer health deterioration and retention risks

**Monitor:**
- Customer inactivity (dormancy thresholds)
- High-value customer churn risk
- Customer health score decline
- Activation funnel drop-offs

**Data Sources:**
- `Customer` activity logs (last transaction, frequency)
- `FinancialLedgerEntry` (customer LTV, spend trends)
- Customer health scores (if computed)

**Alert Conditions:**

| Condition | Threshold | Severity | Cooldown | Escalation |
|-----------|-----------|----------|----------|------------|
| High-value customer dormant (60 days) | Top 10% LTV | WARN | Weekly | Customer Success |
| High-value customer dormant (90 days) | Top 10% LTV | ERROR | Weekly | Customer Success + Exec |
| Customer churn rate > 10% MoM | > 10% | WARN | Monthly | Customer Success |
| Customer churn rate > 20% MoM | > 20% | ERROR | Monthly | Customer Success + Exec |
| Activation rate < 60% | < 60% | WARN | Weekly | Customer Success |

**Cooldown Policies:**
- WARN: Weekly (customer trends need time to confirm)
- ERROR: Weekly to Monthly (strategic metric)

**Escalation:**
- **First Alert (WARN)**: Slack customer-success channel
- **Repeated Alert (ERROR)**: Slack customer-success + Email CS team + Exec summary

**Future Evolution (Phase 1.3+):**
- Predictive churn model (propensity scoring)
- Automated re-engagement campaigns
- Customer journey analytics

---

### 7. Executive KPI Watchdog (NEW)

**Purpose**: Strategic-level monitoring for leadership visibility

**Monitor:**
- MRR/ARR decline
- Churn spikes (revenue and customer)
- Provider degradation (strategic impact)
- Branch underperformance
- Hospitality performance deterioration (occupancy, AOV)

**Data Sources:**
- `FinancialLedgerEntry` (MRR, ARR, GMV)
- `Subscription` (churn events)
- `PaymentTransaction` (provider health)
- Branch-level aggregates (revenue, retention)
- Hospitality metrics (occupancy, ADR, AOV)

**Alert Conditions:**

| Condition | Threshold | Severity | Cooldown | Escalation |
|-----------|-----------|----------|----------|------------|
| MRR decline > 5% MoM | > 5% | WARN | Monthly | Exec |
| MRR decline > 10% MoM | > 10% | CRITICAL | Monthly | CEO/CFO |
| ARR decline > 10% YoY | > 10% | CRITICAL | Quarterly | CEO/CFO |
| Revenue churn > 10% | > 10% | CRITICAL | Monthly | CEO/CFO |
| Customer churn > 20% | > 20% | CRITICAL | Monthly | CEO/CFO |
| Payment success < 90% | < 90% | CRITICAL | Daily | CEO/COO |
| Branch health < 50 (any branch) | < 50 | ERROR | Weekly | COO |
| Occupancy < 40% (any property) | < 40% | WARN | Weekly | COO |

**Cooldown Policies:**
- WARN: Weekly to Monthly (strategic metrics, avoid noise)
- CRITICAL: Monthly to Quarterly (only for severe deterioration)

**Escalation:**
- **First Alert (WARN)**: Email exec team + Slack exec channel
- **Repeated Alert (CRITICAL)**: Email CEO/CFO/COO + Slack exec + Incident summary
- **Persistent Incident (CRITICAL)**: Escalate to board (if > 2 consecutive periods)

**Reporting Cadence:**
- **Daily**: Payment success, provider health (if critical)
- **Weekly**: Branch health, occupancy, customer activity
- **Monthly**: MRR/ARR, churn, revenue trends
- **Quarterly**: Strategic review summary

**Future Evolution (Phase 1.3+):**
- Forecast-aware alerts (compare to predicted KPIs)
- Automated root-cause analysis
- Recommended interventions

---

## Watchdog Governance

### Implementation Principles
- **No Noisy Paging**: Use cooldowns to prevent alert storms
- **Context Over Volume**: Include actionable context in every alert
- **Progressive Escalation**: WARN → ERROR → CRITICAL with increasing urgency
- **Severity Discipline**: Not every issue is CRITICAL; reserve for true emergencies

### Alert Routing Matrix

| Watchdog | WARN | ERROR | CRITICAL |
|----------|------|-------|----------|
| Payment | Ops Slack | Ops Slack + On-call Email | Ops + Exec |
| Reconciliation | Finance Slack | Finance Slack + Finance Email | Finance + Exec |
| Queue | Ops Slack | Ops Slack + On-call Email | Ops + On-call |
| Subscription | Revenue Ops Slack | Revenue Ops + Revenue Email | Revenue + Exec |
| Revenue | Finance Slack + Email | Finance + Exec Email | CEO/CFO |
| Customer | CS Slack | CS Slack + CS Email | CS + Exec |
| Executive KPI | Exec Email + Slack | Exec Email + Slack | CEO/CFO/COO |

### Cooldown Strategy
- **Transient Issues**: 30 min to 1 hour cooldown (payments, queues)
- **Daily Cycles**: 1 hour to 24 hour cooldown (reconciliation, subscriptions)
- **Strategic Metrics**: Weekly to Monthly cooldown (revenue, churn, executive KPIs)

### Future Enhancements (Phase 1.3+)
- Unified incident timeline (correlate alerts across watchdogs)
- Anomaly-based dynamic thresholds
- Forecast-aware alerting
- Automated remediation suggestions
- Alert fatigue monitoring and tuning

---

## Success Criteria

- All 7 watchdogs fully specified
- Alert conditions, thresholds, and severities defined
- Cooldown and escalation policies clear
- Routing matrix established
- Future evolution paths identified
- No implementation; planning only
