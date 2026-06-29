# Phase 1.1A — Observability, Watchdogs & Executive Monitoring Planning (COMPLETE)

Date: June 22, 2026
Type: Planning & Specification Phase (No Implementation)
Status: ✅ Complete

---

## Mission Accomplished

Phase 1.1A successfully defined the complete monitoring, alerting, escalation, and executive-observability architecture before implementation begins. All watchdogs, alert severity framework, executive monitoring, and implementation roadmap are fully specified.

---

## Deliverables Produced

### 1. WATCHDOG_SPECIFICATION.md ✅
Complete specification for 7 watchdogs:
- **Payment Watchdog**: Provider failure rate, webhook validation, latency, settlement delays
- **Reconciliation Watchdog**: Unreconciled entries, SLA breaches, job failures, ledger mismatches
- **Queue Watchdog**: DLQ events, backlog growth, time-to-drain, worker failures
- **Subscription Watchdog**: Grace aging, churn spikes, renewal failures, rescue funnel
- **Revenue Watchdog**: Revenue anomalies, trend deterioration, concentration risk
- **Customer Watchdog**: Inactivity, high-value churn risk, health score decline
- **Executive KPI Watchdog**: MRR/ARR decline, churn spikes, provider degradation, branch underperformance, hospitality deterioration

Each watchdog includes:
- Data sources and monitoring targets
- Alert conditions with thresholds
- Severity levels (WARN, ERROR, CRITICAL)
- Cooldown policies (5 min to monthly)
- Escalation rules (first, repeated, persistent)
- Routing matrix (Slack, Email, SMS future)
- Future evolution paths (Phase 1.3+)

### 2. ALERT_SEVERITY_FRAMEWORK.md ✅
Complete alert governance framework:
- **4 Severity Levels**: INFO, WARN, ERROR, CRITICAL (clearly defined with examples)
- **Alert Routing**: Slack channels, Email recipients, SMS (future), WhatsApp (future)
- **Escalation Policies**: First alert, repeated alert, persistent incident, executive visibility
- **Cooldown Policies**: By severity (5 min to 24 hours), by metric cadence (real-time to monthly)
- **Alert Fatigue Prevention**: Threshold tuning, cooldown discipline, severity discipline, context over volume
- **Governance**: Alert ownership, lifecycle, audit trail, tuning process

### 3. EXECUTIVE_KPI_WATCHDOG_DESIGN.md ✅
Detailed design for strategic-level monitoring:
- **5 Monitoring Domains**: Revenue, Churn, Hospitality, Branch, Customer
- **15+ KPIs Monitored**: MRR, ARR, GMV, Revenue Growth, Revenue/Customer Churn, NRR, Occupancy, ADR, RevPAR, AOV, Branch Health, High-Value Customer Dormancy, Payment Success
- **Thresholds & Escalation**: WARN and CRITICAL thresholds for each KPI, escalation to CEO/CFO/COO
- **Reporting Cadence**: Daily, weekly, monthly, quarterly summaries
- **Unified Executive Summaries**: Daily (if alerts), Weekly (always), Monthly (email + deck), Quarterly (deck + meeting)
- **Governance**: Alert ownership, threshold tuning, alert fatigue prevention

### 4. OBSERVABILITY_IMPLEMENTATION_PLAN.md ✅
Phased implementation roadmap (7-8 weeks):
- **Phase 1.1B (Week 1-2)**: Minimal Implementation — Payment Watchdog, Queue Watchdog, Alert Framework, Startup Guard
- **Phase 1.1C (Week 3-4)**: Advanced Watchdogs — Reconciliation, Subscription, Revenue Watchdogs, Hourly/Daily Summaries
- **Phase 1.1D (Week 5-6)**: Executive Monitoring — Executive KPI Watchdog, Customer Watchdog, Exec Summaries, Dashboard
- **Phase 1.1E (Week 7-8)**: Unified Incident Timeline — Correlation, Timeline, Post-Incident, Tuning Dashboard

Each phase includes:
- Objectives and scope
- Deliverables (cron jobs, summaries, dashboards)
- Expected outcomes
- Estimated effort
- Dependencies
- Success metrics

Technical architecture, rollout strategy, risk mitigation, and governance defined.

### 5. STRATEGIC_DECISIONS_LOG.md ✅
Permanent architecture decision record:
- **Revenue Source of Truth**: FinancialLedgerEntry is authoritative
- **Intelligence Hierarchy**: Descriptive → Diagnostic → Predictive → Prescriptive
- **Phase 1.25 Addition**: Hospitality Intelligence Layer required before Forecasting
- **Executive KPI Watchdog Approval**: Strategic monitoring layer approved
- **Deferred Work Governance**: DEFERRED_WORK_REGISTRY.md must be consulted
- **Intelligence Governance**: BUSINESS_INTELLIGENCE_BACKLOG.md maintained permanently
- **Alert Severity Discipline**: Reserve CRITICAL for emergencies
- **Cooldown Policies**: Prevent alert storms

Each decision includes: date, status, decision makers, context, rationale, alternatives, implications, review date.

---

## Required Analysis & Recommendations

### Which watchdog should be implemented first?
**Recommendation: Payment Watchdog**

**Ranking (by implementation priority):**
1. **Payment Watchdog** — Immediate revenue impact; provider degradation affects all customers
2. **Queue Watchdog** — Operational reliability; prevents silent failures
3. **Reconciliation Watchdog** — Financial accuracy; critical for finance team
4. **Subscription Watchdog** — Revenue protection; early churn detection
5. **Revenue Watchdog** — Strategic visibility; trend detection
6. **Customer Watchdog** — Retention focus; high-value customer protection
7. **Executive KPI Watchdog** — Strategic monitoring; requires other watchdogs first

**Rationale**: Payment Watchdog has highest operational urgency (revenue at risk), lowest implementation complexity (data already available), and immediate business value (reduce payment failures).

---

### Which watchdog delivers highest business value?
**Recommendation: Executive KPI Watchdog**

**Ranking (by business value):**
1. **Executive KPI Watchdog** — Strategic visibility for leadership; early warning on business deterioration
2. **Revenue Watchdog** — Direct revenue impact; anomaly detection prevents leakage
3. **Subscription Watchdog** — MRR protection; churn prevention
4. **Payment Watchdog** — Revenue realization; provider reliability
5. **Customer Watchdog** — LTV protection; high-value customer retention
6. **Reconciliation Watchdog** — Financial accuracy; compliance
7. **Queue Watchdog** — Operational reliability; prevents silent failures

**Rationale**: Executive KPI Watchdog provides strategic-level visibility that drives business decisions, while other watchdogs focus on operational/tactical issues.

---

### Which watchdog reduces operational risk most?
**Recommendation: Reconciliation Watchdog**

**Ranking (by risk reduction):**
1. **Reconciliation Watchdog** — Financial accuracy risk; compliance risk; audit risk
2. **Payment Watchdog** — Revenue risk; provider outage risk; customer experience risk
3. **Queue Watchdog** — System reliability risk; silent failure risk; data loss risk
4. **Subscription Watchdog** — Revenue leakage risk; churn risk
5. **Revenue Watchdog** — Strategic risk; trend deterioration risk
6. **Customer Watchdog** — Retention risk; LTV risk
7. **Executive KPI Watchdog** — Strategic risk; business health risk

**Rationale**: Reconciliation Watchdog protects financial accuracy (non-negotiable for finance/audit), prevents compliance issues, and ensures ledger integrity.

---

### Which watchdog should never page executives?
**Recommendation: Queue Watchdog, Reconciliation Watchdog (operational issues)**

**Guidance:**
- **Never Page Executives**:
  - Queue Watchdog (operational, not strategic)
  - Reconciliation Watchdog (finance team issue, not exec-level unless CRITICAL ledger mismatch)
  - Customer Watchdog (CS team issue, not exec-level unless mass churn)

- **Rarely Page Executives** (only CRITICAL):
  - Payment Watchdog (only if provider outage > 30 min or payment success < 90%)
  - Subscription Watchdog (only if churn spike > 3× baseline)
  - Revenue Watchdog (only if MRR decline > 10% or ledger mismatch)

- **Always Route to Executives** (WARN and above):
  - Executive KPI Watchdog (designed for exec visibility)

**Rationale**: Executives should only be paged for strategic issues or severe operational incidents with business impact. Operational noise should be filtered by ops/finance teams.

---

### Which watchdog should always reach executives?
**Recommendation: Executive KPI Watchdog**

**Guidance:**
- **Always Reach Executives** (WARN and above):
  - Executive KPI Watchdog (MRR/ARR decline, churn spikes, branch underperformance, hospitality deterioration)

- **Reach Executives on CRITICAL Only**:
  - Payment Watchdog (payment success < 90%, provider outage > 30 min)
  - Revenue Watchdog (MRR decline > 10%, ledger mismatch)
  - Subscription Watchdog (churn spike > 3× baseline)
  - Reconciliation Watchdog (ledger mismatch detected)

- **Never Reach Executives Directly** (ops/finance teams handle):
  - Queue Watchdog (operational issue)
  - Customer Watchdog (CS team issue, unless mass churn)

**Rationale**: Executive KPI Watchdog is designed for strategic visibility and should always reach executives. Other watchdogs should only escalate to executives for severe incidents with business impact.

---

## Context Review Summary

### Deferred Work Affected
- **Future Monitoring (Deferred)**: Phase 1.1 will implement v1 of watchdog jobs, payment anomaly detection, advanced observability
  - Status: Moving from deferred to active implementation in Phase 1.1B-E
  - Advanced features (ML-based anomaly detection, forecast-aware alerts) remain deferred to Phase 1.3+

### Intelligence Backlog Affected
- **Future Watchdogs**: Executive KPI Watchdog promoted to Phase 1.1D
  - Status: Branch Health, Menu Performance, Occupancy, Enhanced Customer Churn remain in backlog for Phase 1.25+

### Dependencies Confirmed
- AlertDeliveryService (Slack + Email) — exists ✅
- `FinancialLedgerEntry` as revenue source of truth — established ✅
- BullMQ queue metrics — accessible ✅
- Reconciliation job logs — available ✅
- Payment transaction data — complete ✅
- No external credentials required ✅
- No schema changes required ✅

### Assumptions Validated
- Reuse existing cron infrastructure ✅
- Reuse existing AlertDeliveryService ✅
- No new infrastructure (Redis, queues) required ✅
- All data sources available ✅

---

## Strategic Alignment

### Roadmap Confirmation
- Phase 1.1 (Observability & Watchdogs) — fully specified ✅
- Phase 1.2 (Executive Dashboards) — ready for planning after 1.1 ✅
- Phase 1.25 (Hospitality Intelligence Layer) — approved and sequenced ✅
- Phase 1.3 (Forecasting & Predictive Models) — dependent on 1.25 ✅
- Phase 2.0 (Autonomous Recommendations) — dependent on 1.3 ✅

### Governance Established
- DEFERRED_WORK_REGISTRY.md — consulted ✅
- BUSINESS_INTELLIGENCE_BACKLOG.md — consulted ✅
- STRATEGIC_DECISIONS_LOG.md — created ✅
- All major decisions recorded ✅

---

## Success Criteria Met

✅ Full watchdog specification (7 watchdogs)  
✅ Alert severity governance (4 levels, routing, escalation, cooldown)  
✅ Executive KPI Watchdog design (5 domains, 15+ KPIs, summaries)  
✅ Observability implementation roadmap (4 phases, 7-8 weeks)  
✅ Strategic decisions log (permanent record)  
✅ Prioritized implementation sequence (Payment → Queue → Reconciliation → Subscription → Revenue → Customer → Executive KPI)  
✅ Clear escalation and alerting policies  
✅ Watchdog ranking by priority, business value, risk reduction  
✅ Executive paging guidance  
✅ No code written, no schemas modified, no implementations created  

---

## Key Insights

### Operational Excellence
- Payment Watchdog is highest priority (revenue impact + low complexity)
- Reconciliation Watchdog reduces most operational risk (financial accuracy)
- Queue Watchdog prevents silent failures (operational reliability)

### Strategic Visibility
- Executive KPI Watchdog delivers highest business value (strategic decisions)
- Revenue Watchdog provides early warning on trends (anomaly detection)
- Subscription Watchdog protects MRR (churn prevention)

### Alert Discipline
- Reserve CRITICAL for emergencies (prevent alert fatigue)
- Cooldowns prevent alert storms (balance urgency and noise)
- Progressive escalation (WARN → ERROR → CRITICAL) allows time for resolution

### Executive Engagement
- Executive KPI Watchdog always reaches executives (strategic visibility)
- Operational watchdogs rarely page executives (filter noise)
- CRITICAL alerts from any watchdog escalate to executives (severe incidents)

---

## Next Steps

### Immediate (User Decision)
- Review and approve Phase 1.1A planning deliverables
- Confirm implementation sequence and timeline
- Approve Phase 1.1B kickoff (Payment Watchdog + Queue Watchdog)

### Phase 1.1B (Week 1-2) — Ready to Implement
- Deploy Payment Watchdog (highest priority)
- Deploy Queue Watchdog (operational reliability)
- Implement Alert Severity Framework
- Add Startup Channel Guard
- No blockers; all dependencies exist

### Phase 1.1C (Week 3-4) — Dependent on 1.1B
- Deploy Reconciliation, Subscription, Revenue Watchdogs
- Add Hourly/Daily Summaries
- Tune thresholds based on 1.1B feedback

### Phase 1.1D (Week 5-6) — Dependent on 1.1C
- Deploy Executive KPI Watchdog
- Deploy Customer Watchdog
- Add Daily/Weekly/Monthly Executive Summaries
- Build minimal Executive Dashboard

### Phase 1.1E (Week 7-8) — Dependent on 1.1D
- Build Unified Incident Timeline
- Add Incident Correlation Engine
- Automate Post-Incident Reviews
- Build Alert Tuning Dashboard

---

## Final Summary

Phase 1.1A successfully established the complete monitoring and alerting architecture for ImboniServe. All 7 watchdogs are fully specified with clear thresholds, severities, cooldowns, escalations, and routing. Alert governance framework ensures discipline and prevents fatigue. Executive KPI Watchdog provides strategic visibility. Implementation roadmap is sequenced, scoped, and ready for execution.

Key outcomes:
- 7 watchdogs fully specified (Payment, Queue, Reconciliation, Subscription, Revenue, Customer, Executive KPI)
- Alert severity framework established (INFO, WARN, ERROR, CRITICAL)
- Executive monitoring designed (daily/weekly/monthly summaries)
- Implementation roadmap defined (4 phases, 7-8 weeks)
- Strategic decisions recorded (permanent architecture log)
- Watchdog rankings provided (priority, business value, risk reduction)
- Executive paging guidance clear (always, rarely, never)

The platform is now positioned to implement world-class observability and executive monitoring without external dependencies or credentials.

**Status: Phase 1.1A COMPLETE ✅**  
**Next: Await approval for Phase 1.1B implementation kickoff**
