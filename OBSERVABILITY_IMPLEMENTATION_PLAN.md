# Observability Implementation Plan (Phase 1.1A)

Date: June 22, 2026
Type: Implementation Roadmap (Planning Only)
Purpose: Phased implementation plan for watchdogs, alerts, and executive monitoring

---

## Context Review

### Deferred Work Affected
- **Future Monitoring (Deferred)**: Phase 1.1 will implement v1 of watchdog jobs, payment anomaly detection, and advanced observability
  - Status: Moving from deferred to active implementation
  - Advanced features (ML-based anomaly detection, forecast-aware alerts) remain deferred to Phase 1.3+

### Intelligence Backlog Affected
- **Future Watchdogs**: Executive KPI Watchdog promoted to Phase 1.1D
  - Status: Branch Health, Menu Performance, Occupancy, Enhanced Customer Churn remain in backlog for Phase 1.25+

### Dependencies
- AlertDeliveryService (Slack + Email) — already exists
- `FinancialLedgerEntry` as revenue source of truth — already established
- BullMQ queue metrics — already accessible
- Reconciliation job logs — already available
- Payment transaction data — already complete

### Assumptions
- No external credentials required (InTouch/IremboPay testing deferred)
- No schema changes required
- No new infrastructure (Redis, queues) required
- Reuse existing cron infrastructure for watchdog jobs
- Reuse existing AlertDeliveryService for all alerts

---

## Implementation Phases

### Phase 1.1B — Minimal Implementation (Week 1-2)

**Objective**: Deploy foundational watchdogs with immediate operational value

**Scope:**
- Payment Watchdog (v1)
- Queue Watchdog (v1)
- Alert Severity Framework implementation
- Startup channel guard (warn if no Slack/Email configured)

**Deliverables:**
1. **Payment Watchdog Cron Job**
   - Runs: Every 5 minutes
   - Monitors: Provider failure rate (1h rolling), webhook validation failures, payment latency p95
   - Alerts: WARN if > 1%, ERROR if > 3%, CRITICAL if > 10% or 5× baseline
   - Cooldown: 30 min (WARN), 15 min (ERROR), 5 min (CRITICAL)
   - Routing: Slack ops channel + Email on-call (ERROR/CRITICAL)

2. **Queue Watchdog Cron Job**
   - Runs: Every 10 minutes
   - Monitors: DLQ counts, backlog depth, time-to-drain estimates
   - Alerts: WARN on first DLQ event, ERROR if > 5/day, CRITICAL if queue stalled
   - Cooldown: 1 hour (WARN), 30 min (ERROR), 15 min (CRITICAL)
   - Routing: Slack ops channel + Email on-call (ERROR/CRITICAL)

3. **Alert Severity Framework**
   - Implement severity levels (INFO, WARN, ERROR, CRITICAL)
   - Standardize alert format (title, details, context, recommended actions)
   - Implement cooldown logic (per watchdog, per severity)
   - Implement escalation logic (first, repeated, persistent)

4. **Startup Channel Guard**
   - Check at application boot: `ALERT_EMAIL_TO` or `SLACK_WEBHOOK_URL` configured?
   - If neither: Log strong warning to console
   - If only one: Log info message indicating single-channel mode
   - If both: Log success message

**Expected Outcomes:**
- Reduced MTTR for payment and queue issues
- Consistent alert format across all watchdogs
- No silent failures (alerts always routed if channels configured)
- Operational confidence in alert delivery

**Estimated Effort:** 1-2 weeks (1 engineer)

**Dependencies:** None (all prerequisites exist)

**Success Metrics:**
- Payment Watchdog detects provider degradation within 5 min
- Queue Watchdog detects DLQ events within 10 min
- Alert format is consistent and actionable
- No alert storms (cooldowns effective)

---

### Phase 1.1C — Advanced Watchdogs (Week 3-4)

**Objective**: Deploy financial and subscription watchdogs for revenue protection

**Scope:**
- Reconciliation Watchdog (v1)
- Subscription Watchdog (v1)
- Revenue Watchdog (v1)
- Hourly/daily summary crons

**Deliverables:**
1. **Reconciliation Watchdog Cron Job**
   - Runs: Every hour
   - Monitors: Unreconciled count/age, reconciliation job failures, SLA compliance
   - Alerts: WARN if > 10 unreconciled, ERROR if > 50 or age > 24h, CRITICAL on ledger mismatch
   - Cooldown: 1 hour (WARN), 30 min (ERROR), immediate (CRITICAL)
   - Routing: Slack finance channel + Email finance team (ERROR/CRITICAL)

2. **Subscription Watchdog Cron Job**
   - Runs: Daily (8:00 AM)
   - Monitors: Grace period aging, churn spikes, renewal failures
   - Alerts: WARN at 3/7 days grace, ERROR at 14 days, ERROR on churn spike > 2× baseline
   - Cooldown: Daily
   - Routing: Slack revenue-ops channel + Email revenue team (ERROR)

3. **Revenue Watchdog Cron Job**
   - Runs: Daily (9:00 AM)
   - Monitors: Daily revenue vs baseline, MRR/GMV trends, revenue concentration
   - Alerts: WARN if < 3σ below baseline, ERROR if weekly decline > 10%
   - Cooldown: Daily (WARN), Weekly (ERROR)
   - Routing: Slack finance channel + Email finance + exec (ERROR)

4. **Hourly Summary Cron**
   - Runs: Every hour
   - Aggregates: DLQ counts, unreconciled counts, provider failure rates
   - Output: Slack info channel (passive, no mentions)
   - Purpose: Historical record and trend visibility

5. **Daily Summary Cron**
   - Runs: Daily (8:00 AM)
   - Aggregates: Payment success, reconciliation status, subscription grace aging, revenue summary
   - Output: Slack info channel + Email ops team (summary only, no alerts)
   - Purpose: Daily operational snapshot

**Expected Outcomes:**
- Financial accuracy protected (reconciliation alerts)
- Revenue leakage detected early (subscription/revenue alerts)
- Daily operational visibility (summaries)
- Reduced manual checking (automated monitoring)

**Estimated Effort:** 2 weeks (1 engineer)

**Dependencies:** Phase 1.1B complete (alert framework in place)

**Success Metrics:**
- Reconciliation issues detected within 1 hour
- Subscription churn risks identified daily
- Revenue anomalies detected within 24 hours
- Daily summaries provide actionable insights

---

### Phase 1.1D — Executive Monitoring (Week 5-6)

**Objective**: Deploy Executive KPI Watchdog and executive summaries

**Scope:**
- Executive KPI Watchdog (v1)
- Customer Watchdog (v1)
- Daily/weekly/monthly executive summaries
- Executive dashboard (read-only, minimal)

**Deliverables:**
1. **Executive KPI Watchdog Cron Job**
   - Runs: Daily (7:00 AM) for daily metrics, Weekly (Monday 7:00 AM) for weekly, Monthly (1st day 7:00 AM) for monthly
   - Monitors: MRR/ARR decline, churn spikes, payment success, occupancy, AOV, branch health
   - Alerts: WARN/CRITICAL based on thresholds (see EXECUTIVE_KPI_WATCHDOG_DESIGN.md)
   - Cooldown: Daily to Monthly (cadence-aware)
   - Routing: Email exec team + Slack exec channel (WARN/CRITICAL)

2. **Customer Watchdog Cron Job**
   - Runs: Weekly (Monday 8:00 AM)
   - Monitors: High-value customer dormancy, customer retention rate, activation rate
   - Alerts: WARN if top 10% LTV dormant > 60 days, ERROR if > 90 days
   - Cooldown: Weekly
   - Routing: Slack customer-success channel + Email CS team (ERROR)

3. **Daily Executive Summary Email**
   - Runs: Daily (8:00 AM)
   - Contents: Payment success, GMV, critical alerts from prior 24h
   - Recipients: CEO, CFO, COO
   - Condition: Only send if alerts or key metrics breach thresholds

4. **Weekly Executive Summary Email**
   - Runs: Monday (8:00 AM)
   - Contents: Revenue summary, hospitality summary, branch leaderboard, high-value customer health, alerts from prior week
   - Recipients: CEO, CFO, COO, leadership team
   - Always sent (even if no alerts)

5. **Monthly Executive Summary Email + Deck**
   - Runs: 1st business day of month (8:00 AM)
   - Contents: MRR/ARR/Growth, churn analysis, NRR, hospitality performance, branch review, customer trends, provider scorecard
   - Recipients: CEO, CFO, COO, leadership team
   - Format: Email summary + PDF deck attachment

6. **Executive Dashboard (Minimal)**
   - Read-only dashboard powered by `FinancialLedgerEntry` aggregates
   - KPIs: MRR, ARR, GMV, Churn, Occupancy, AOV, Payment Success
   - Trends: 12-month sparklines
   - No schema changes; aggregations computed on-demand or cached hourly
   - Access: Exec team only

**Expected Outcomes:**
- Executive visibility into business health
- Early warning on strategic issues
- Reduced manual reporting burden
- Data-driven decision support

**Estimated Effort:** 2 weeks (1 engineer)

**Dependencies:** Phase 1.1C complete (revenue/subscription watchdogs in place)

**Success Metrics:**
- Executives receive timely alerts on strategic issues
- Daily/weekly/monthly summaries are actionable
- Executive dashboard provides single-pane business view
- No manual reporting required for standard KPIs

---

### Phase 1.1E — Unified Incident Timeline (Week 7-8)

**Objective**: Correlate alerts across watchdogs and build incident timeline

**Scope:**
- Incident correlation engine
- Unified incident timeline
- Post-incident review automation
- Alert tuning dashboard

**Deliverables:**
1. **Incident Correlation Engine**
   - Correlate related alerts (e.g., payment failure spike + queue backlog + revenue drop)
   - Group alerts into incidents
   - Assign incident IDs and severity
   - Track incident lifecycle (triggered, acknowledged, investigated, resolved, closed)

2. **Unified Incident Timeline**
   - Chronological view of all incidents
   - Show correlated alerts, actions taken, resolution notes
   - Filter by severity, watchdog, date range
   - Export for post-incident review

3. **Post-Incident Review Automation**
   - For CRITICAL incidents: auto-generate post-incident review template
   - Include: timeline, root cause, impact, resolution, action items
   - Distribute to relevant teams for completion

4. **Alert Tuning Dashboard**
   - Track alert frequency by watchdog and severity
   - Identify noisy watchdogs (high alert volume, low action rate)
   - Recommend threshold adjustments
   - Monitor alert-to-action ratio

**Expected Outcomes:**
- Faster incident resolution (correlated context)
- Improved post-incident learning
- Reduced alert fatigue (tuning based on data)
- Historical incident analysis for trends

**Estimated Effort:** 2 weeks (1 engineer)

**Dependencies:** Phase 1.1D complete (all watchdogs deployed)

**Success Metrics:**
- Incidents are correlated and grouped correctly
- Post-incident reviews completed within 48 hours (CRITICAL)
- Alert tuning reduces noise by 20%+
- Incident timeline provides clear audit trail

---

## Implementation Sequence Summary

| Phase | Duration | Focus | Key Deliverables |
|-------|----------|-------|------------------|
| 1.1B | Week 1-2 | Minimal Implementation | Payment Watchdog, Queue Watchdog, Alert Framework, Startup Guard |
| 1.1C | Week 3-4 | Advanced Watchdogs | Reconciliation, Subscription, Revenue Watchdogs, Summaries |
| 1.1D | Week 5-6 | Executive Monitoring | Executive KPI Watchdog, Customer Watchdog, Exec Summaries, Dashboard |
| 1.1E | Week 7-8 | Unified Incident Timeline | Correlation, Timeline, Post-Incident, Tuning Dashboard |

**Total Duration:** 7-8 weeks (1 engineer full-time)

---

## Technical Architecture (High-Level)

### Watchdog Cron Jobs
- **Framework**: Next.js API routes with cron triggers (Vercel Cron or self-hosted cron)
- **Data Sources**: `FinancialLedgerEntry`, `PaymentTransaction`, `Subscription`, `Sale`, `Reservation`, BullMQ metrics
- **Aggregations**: Computed on-demand or cached in Redis (hourly/daily)
- **Alert Delivery**: Reuse `AlertDeliveryService` (Slack + Email)
- **Cooldown Storage**: Redis (key = watchdog:severity:condition, TTL = cooldown duration)
- **Incident Storage**: Postgres table `Incident` (id, watchdog, severity, condition, timestamp, status, resolution)

### Alert Format (Standardized)
```typescript
interface Alert {
  id: string
  watchdog: string
  severity: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL'
  title: string
  condition: string
  threshold: number
  currentValue: number
  context: {
    trend: string // sparkline or comparison
    breakdown: Record<string, any> // segment, provider, etc.
    comparison: string // vs baseline, prior period
  }
  recommendedActions: string[]
  timestamp: Date
  incidentId?: string // if part of incident
}
```

### Cooldown Logic
```typescript
async function shouldAlert(watchdog: string, severity: string, condition: string): Promise<boolean> {
  const key = `cooldown:${watchdog}:${severity}:${condition}`
  const exists = await redis.exists(key)
  if (exists) return false // still in cooldown
  
  // Set cooldown
  const cooldownSeconds = getCooldownDuration(watchdog, severity)
  await redis.setex(key, cooldownSeconds, '1')
  return true
}
```

### Escalation Logic
```typescript
async function handleAlert(alert: Alert) {
  const occurrenceCount = await getAlertOccurrenceCount(alert.watchdog, alert.condition)
  
  if (occurrenceCount === 1) {
    // First alert
    await deliverAlert(alert, getPrimaryChannel(alert.watchdog, alert.severity))
  } else if (occurrenceCount === 2) {
    // Repeated alert: escalate severity
    alert.severity = escalateSeverity(alert.severity)
    await deliverAlert(alert, getEscalatedChannel(alert.watchdog, alert.severity))
  } else {
    // Persistent incident: declare incident
    const incident = await createIncident(alert)
    await notifyExecTeam(incident)
  }
}
```

---

## Rollout Strategy

### Phase 1.1B (Week 1-2)
- Deploy Payment Watchdog to staging
- Test alert delivery (Slack + Email)
- Verify cooldown logic
- Deploy Queue Watchdog to staging
- Test end-to-end flow (condition → alert → delivery → cooldown)
- Deploy to production with WARN severity only (no ERROR/CRITICAL initially)
- Monitor for 3 days, tune thresholds
- Enable ERROR/CRITICAL severities

### Phase 1.1C (Week 3-4)
- Deploy Reconciliation Watchdog to staging
- Test with simulated unreconciled entries
- Deploy Subscription Watchdog to staging
- Test with simulated grace aging
- Deploy Revenue Watchdog to staging
- Test with simulated revenue anomalies
- Deploy to production with WARN only
- Monitor for 5 days, tune thresholds
- Enable ERROR/CRITICAL severities

### Phase 1.1D (Week 5-6)
- Deploy Executive KPI Watchdog to staging
- Test with simulated MRR decline, churn spike
- Deploy Customer Watchdog to staging
- Generate daily/weekly/monthly summaries (dry-run, no email)
- Review summaries with exec team for feedback
- Deploy to production with exec opt-in (summaries only, no alerts initially)
- Monitor for 1 week, gather feedback
- Enable alerts with exec approval

### Phase 1.1E (Week 7-8)
- Deploy incident correlation engine to staging
- Test with simulated multi-watchdog incidents
- Build unified incident timeline UI
- Deploy to production
- Monitor for 1 week, tune correlation logic
- Enable post-incident review automation

---

## Risk Mitigation

### Risk: Alert Fatigue
- **Mitigation**: Strict cooldown enforcement, threshold tuning based on baseline, severity discipline
- **Monitoring**: Track alert frequency and alert-to-action ratio weekly

### Risk: False Positives
- **Mitigation**: Baseline-aware thresholds, seasonality adjustments, manual override capability
- **Monitoring**: Track false positive rate via post-alert feedback

### Risk: Missed Alerts (False Negatives)
- **Mitigation**: Conservative thresholds initially, gradual tuning, redundant monitoring (multiple watchdogs)
- **Monitoring**: Track incidents detected manually vs by watchdogs

### Risk: Channel Failures (Slack/Email down)
- **Mitigation**: Startup channel guard, fallback channels (SMS future), retry logic
- **Monitoring**: Track alert delivery success rate

### Risk: Performance Impact (Cron jobs)
- **Mitigation**: Optimize aggregations, cache results in Redis, limit cron frequency
- **Monitoring**: Track cron job duration and resource usage

---

## Success Criteria (Overall Phase 1.1)

- All 7 watchdogs deployed and operational
- Alert severity framework implemented and enforced
- Cooldown and escalation logic functional
- Executive summaries delivered on schedule
- Incident timeline provides clear audit trail
- MTTR reduced by 30%+ (vs pre-watchdog baseline)
- Alert-to-action ratio > 70% (most alerts lead to action)
- No alert storms (cooldowns effective)
- Executive satisfaction with summaries and alerts

---

## Post-Phase 1.1 (Future Enhancements)

### Phase 1.3+ (Deferred)
- ML-based anomaly detection (replace static thresholds)
- Forecast-aware alerting (compare to predicted values)
- Automated remediation suggestions
- SMS and WhatsApp alert channels
- Advanced incident correlation (causal analysis)
- Customer-facing status page (for outages)

### Continuous Improvement
- Quarterly threshold tuning based on business growth
- Monthly alert quality review
- Weekly alert-to-action ratio monitoring
- Annual watchdog portfolio review (add/remove/merge watchdogs)

---

## Governance

### Ownership
- **Phase 1.1B-C**: Ops team (implementation and monitoring)
- **Phase 1.1D**: Exec team (requirements and feedback)
- **Phase 1.1E**: Ops + Product (incident management)

### Review Cadence
- **Weekly**: Alert frequency and quality review (Ops team)
- **Monthly**: Threshold tuning and watchdog effectiveness (Ops + Finance + Revenue Ops)
- **Quarterly**: Strategic watchdog portfolio review (Exec team)

### Documentation
- All watchdogs documented in WATCHDOG_SPECIFICATION.md
- Alert severity framework in ALERT_SEVERITY_FRAMEWORK.md
- Executive KPI Watchdog in EXECUTIVE_KPI_WATCHDOG_DESIGN.md
- Implementation plan in OBSERVABILITY_IMPLEMENTATION_PLAN.md (this document)

---

## Conclusion

Phase 1.1 implementation is scoped, sequenced, and ready for execution. The phased approach (1.1B → 1.1C → 1.1D → 1.1E) ensures incremental value delivery, risk mitigation, and continuous feedback. No external dependencies or credentials required. All prerequisites exist. Estimated 7-8 weeks for full deployment.

**Status: Planning Complete ✅**
**Next: Await approval for Phase 1.1B implementation kickoff**
