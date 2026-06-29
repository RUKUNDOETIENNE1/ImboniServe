# Alert Severity Framework (Phase 1.1A)

Date: June 22, 2026
Type: Alert Governance Specification
Purpose: Standardize alert severity, routing, escalation, and cooldown policies

---

## Severity Levels

### INFO
**Meaning**: Informational event; no action required; awareness only

**Examples:**
- Unusual revenue spike (> 3σ above baseline) — investigate for data quality
- Queue processing completed successfully after backlog
- Reconciliation job completed with all entries reconciled
- New customer activation milestone reached
- Successful provider failover test

**Routing:**
- Slack info channel (low-priority, async review)
- No email
- No paging

**Escalation Behavior:**
- No escalation
- Logged for historical analysis

**Cooldown:**
- 24 hours (prevent info spam)

**When to Use:**
- Positive events worth noting
- Anomalies that require investigation but not urgent action
- System health confirmations

---

### WARN
**Meaning**: Early warning; issue detected but not yet critical; proactive attention recommended

**Examples:**
- Payment failure rate > 1% (1h rolling)
- Unreconciled entries > 10
- DLQ event (first of day)
- Subscriptions in grace ≥ 3 days
- Daily revenue < 3σ below baseline
- High-value customer dormant (60 days)
- MRR decline > 5% MoM
- Occupancy < 60%

**Routing:**
- Slack ops/finance/revenue channel (depending on domain)
- Email to relevant team (optional, based on domain)
- No paging

**Escalation Behavior:**
- **First Alert**: Slack notification
- **Repeated Alert** (2nd occurrence within cooldown): Email to team lead
- **Persistent** (3+ occurrences): Escalate to ERROR severity

**Cooldown:**
- 30 min to 24 hours (depending on metric cadence)
- Transient issues: 30 min to 1 hour
- Daily metrics: 24 hours
- Strategic metrics: Weekly

**When to Use:**
- Threshold breached but not yet impacting business
- Trend moving in wrong direction
- Early signal that may resolve on its own
- Proactive monitoring (catch issues before they become critical)

---

### ERROR
**Meaning**: Issue requires immediate attention; business impact likely; action needed

**Examples:**
- Payment failure rate > 3% or 3× baseline
- Webhook validation failures
- Unreconciled entries > 50 or age > 24h
- Reconciliation job failure
- DLQ events > 5/day
- Time-to-drain > 4 hours
- Subscriptions in grace ≥ 7 days
- MRR decline > 10% MoM
- Customer churn rate > 20% MoM
- Branch health score < 50

**Routing:**
- Slack ops/finance/revenue channel (urgent)
- Email to on-call or team lead
- SMS (optional, for critical domains like payments)

**Escalation Behavior:**
- **First Alert**: Slack + Email
- **Repeated Alert** (2nd occurrence within cooldown): Email on-call + Slack mention
- **Persistent** (3+ occurrences or > 30 min): Escalate to CRITICAL severity + Exec summary

**Cooldown:**
- 15 min to 1 hour (depending on urgency)
- Payment/Queue issues: 15-30 min
- Financial issues: 30 min to 1 hour
- Strategic metrics: Daily to Weekly

**When to Use:**
- Business impact confirmed or imminent
- SLA breach
- System degradation affecting users
- Financial accuracy at risk
- Revenue leakage detected

---

### CRITICAL
**Meaning**: Severe issue; immediate action required; executive visibility; potential revenue/customer impact

**Examples:**
- Payment failure spike (5× baseline in 5 min)
- Provider failure rate > 10% sustained
- Ledger mismatch detected (financial accuracy compromised)
- Queue stalled (no progress in 30 min)
- Payment success < 90%
- MRR decline > 10% MoM (sustained)
- ARR decline > 10% YoY
- Revenue churn > 10%
- Customer churn > 20%
- Data corruption or integrity issue

**Routing:**
- Slack ops/exec channel (urgent, @channel mention)
- Email to on-call + exec team
- SMS to on-call (immediate)
- WhatsApp (future, for exec team)

**Escalation Behavior:**
- **First Alert**: Slack + Email + SMS (immediate)
- **Repeated Alert** (2nd occurrence): Exec summary + Incident declared
- **Persistent** (> 30 min): CEO/CFO/COO notified + Incident runbook activated

**Cooldown:**
- 5 min to 15 min (minimal cooldown; urgency required)
- Payment/Queue: 5 min
- Financial: 15 min
- Strategic: Immediate (no cooldown for first alert)

**When to Use:**
- System outage or severe degradation
- Financial accuracy compromised
- Revenue at risk
- Customer-facing impact
- Security breach or data integrity issue
- Strategic business metric deterioration

---

## Alert Routing

### Slack
**Channels:**
- `#ops-alerts`: Payment, Queue, Reconciliation (WARN, ERROR)
- `#finance-alerts`: Reconciliation, Revenue (WARN, ERROR)
- `#revenue-ops-alerts`: Subscription, Customer (WARN, ERROR)
- `#exec-alerts`: Executive KPI, CRITICAL alerts from all watchdogs
- `#info-alerts`: INFO severity (low-priority, async)

**Mention Strategy:**
- WARN: No mentions (passive notification)
- ERROR: @here (active team members)
- CRITICAL: @channel (all team members)

**Message Format:**
```
[SEVERITY] [Watchdog] Alert Title
Details: { key metrics, thresholds, current values }
Context: { trend, comparison to baseline, affected segments }
Recommended Action: { investigation steps, runbook link }
Timestamp: { ISO 8601 }
```

---

### Email
**Recipients:**
- **Ops Team**: Payment, Queue alerts (ERROR, CRITICAL)
- **Finance Team**: Reconciliation, Revenue alerts (ERROR, CRITICAL)
- **Revenue Ops Team**: Subscription, Customer alerts (ERROR, CRITICAL)
- **Exec Team**: Executive KPI alerts (WARN, ERROR, CRITICAL)
- **On-call**: CRITICAL alerts from all watchdogs

**Subject Line Format:**
```
[SEVERITY] [Watchdog] Alert Title — Action Required
```

**Email Body:**
- Alert summary (1-2 sentences)
- Key metrics and thresholds
- Trend context (sparkline or comparison)
- Recommended actions
- Runbook link (if available)
- Timestamp and alert ID

**Frequency:**
- WARN: Once per cooldown period
- ERROR: Immediate + repeat if persistent
- CRITICAL: Immediate + escalation summary

---

### SMS (Future)
**Use Cases:**
- CRITICAL alerts only
- On-call rotation
- Payment/Queue outages
- Financial accuracy issues

**Message Format:**
```
[CRITICAL] [Watchdog] Brief Title
Details: [URL to full alert]
```

**Cooldown:**
- 15 min (prevent SMS spam)

---

### WhatsApp (Future)
**Use Cases:**
- Executive KPI alerts (CRITICAL)
- Strategic business deterioration
- Board-level visibility

**Message Format:**
- Rich media (charts, trends)
- Executive summary
- Recommended actions

---

## Escalation Policies

### First Alert
**Behavior:**
- Route to primary channel (Slack/Email based on severity)
- Include full context and recommended actions
- Start cooldown timer

**Example:**
- WARN: Slack ops channel
- ERROR: Slack ops + Email on-call
- CRITICAL: Slack ops + Email on-call + SMS

---

### Repeated Alert
**Trigger**: Same alert fires again within cooldown period

**Behavior:**
- Escalate severity (WARN → ERROR, ERROR → CRITICAL)
- Add escalation context (e.g., "2nd occurrence in 30 min")
- Notify team lead or on-call
- Extend cooldown (prevent alert storm)

**Example:**
- 2nd WARN: Escalate to ERROR, email team lead
- 2nd ERROR: Escalate to CRITICAL, email on-call + exec summary

---

### Persistent Incident
**Trigger**: Alert fires 3+ times or persists > 30 min (ERROR) or > 15 min (CRITICAL)

**Behavior:**
- Declare incident
- Escalate to exec team (if CRITICAL)
- Activate incident runbook
- Create incident timeline
- Notify stakeholders (customers if user-facing)

**Example:**
- Payment failure CRITICAL persists > 30 min → CEO/COO notified, incident declared, runbook activated

---

### Executive Visibility
**Trigger:**
- CRITICAL alert from any watchdog
- ERROR alert from Executive KPI Watchdog
- Persistent incident (> 30 min for CRITICAL, > 1 hour for ERROR)

**Behavior:**
- Email exec team with summary
- Slack exec channel with context
- Include business impact assessment
- Recommend strategic actions

**Example:**
- MRR decline > 10% MoM → CEO/CFO emailed with trend, cohort analysis, recommended interventions

---

## Cooldown Policies

### Purpose
- Prevent alert storms
- Reduce alert fatigue
- Allow time for investigation and remediation
- Balance urgency with noise reduction

### Cooldown by Severity

| Severity | Cooldown Range | Rationale |
|----------|----------------|-----------|
| INFO | 24 hours | Low urgency; informational only |
| WARN | 30 min to 24 hours | Early warning; allow time to investigate |
| ERROR | 15 min to 1 hour | Action required; balance urgency and noise |
| CRITICAL | 5 min to 15 min | Immediate action; minimal cooldown |

### Cooldown by Metric Cadence

| Metric Type | Cooldown | Rationale |
|-------------|----------|-----------|
| Real-time (payments, queues) | 5-30 min | Fast-moving; need rapid feedback |
| Hourly (provider health) | 1 hour | Allow time for transient issues to resolve |
| Daily (reconciliation, subscriptions) | 24 hours | Daily cycles; avoid intra-day noise |
| Weekly (customer trends) | 1 week | Strategic trends; need time to confirm |
| Monthly (MRR, churn) | 1 month | Strategic metrics; avoid mid-month noise |

### Cooldown Overrides
- **Escalation**: Repeated alerts bypass cooldown and escalate severity
- **Severity Increase**: If condition worsens (e.g., failure rate 1% → 5%), bypass cooldown and re-alert
- **Manual Override**: Ops team can manually trigger alert (e.g., for testing or urgent investigation)

---

## Alert Fatigue Prevention

### Strategies
- **Threshold Tuning**: Adjust thresholds based on baseline and business context
- **Cooldown Discipline**: Enforce cooldowns to prevent alert storms
- **Severity Discipline**: Reserve CRITICAL for true emergencies
- **Context Over Volume**: Include actionable context in every alert
- **Alert Consolidation**: Group related alerts into single summary (future)

### Monitoring
- Track alert frequency by watchdog and severity
- Identify noisy watchdogs and tune thresholds
- Measure alert-to-action ratio (how many alerts lead to action?)
- Survey on-call team for alert quality feedback

### Tuning Process
- **Weekly Review**: Review alert frequency and quality
- **Monthly Tuning**: Adjust thresholds based on baseline shifts
- **Quarterly Audit**: Comprehensive review of all watchdogs and severities

---

## Governance

### Alert Ownership
- **Payment Watchdog**: Ops team
- **Reconciliation Watchdog**: Finance team
- **Queue Watchdog**: Ops team
- **Subscription Watchdog**: Revenue Ops team
- **Revenue Watchdog**: Finance team
- **Customer Watchdog**: Customer Success team
- **Executive KPI Watchdog**: Exec team (CEO/CFO/COO)

### Alert Lifecycle
1. **Triggered**: Condition met, alert generated
2. **Routed**: Sent to appropriate channels (Slack/Email/SMS)
3. **Acknowledged**: Team acknowledges receipt
4. **Investigated**: Team investigates root cause
5. **Resolved**: Condition cleared or remediated
6. **Closed**: Alert closed with resolution notes
7. **Reviewed**: Post-incident review (for CRITICAL alerts)

### Alert Audit Trail
- All alerts logged with: timestamp, watchdog, severity, condition, routing, acknowledgment, resolution
- Retention: 90 days (operational), 1 year (CRITICAL)
- Used for: alert tuning, incident review, compliance

---

## Success Criteria

- 4 severity levels clearly defined (INFO, WARN, ERROR, CRITICAL)
- Routing matrix established (Slack, Email, SMS, WhatsApp)
- Escalation policies defined (first, repeated, persistent, executive)
- Cooldown policies defined (by severity and metric cadence)
- Alert fatigue prevention strategies outlined
- Governance and ownership established
