# Strategic Decisions Log

Purpose: Permanent architecture decision record to prevent future architectural drift. All major strategic decisions must be recorded here with rationale, alternatives considered, and implications.

Created: June 22, 2026
Owner: Engineering Leadership

---

## Decision Template

```markdown
### [Decision Title]
**Date**: YYYY-MM-DD
**Status**: Approved | Proposed | Superseded
**Decision Makers**: [Names/Roles]
**Context**: [Why this decision was needed]
**Decision**: [What was decided]
**Rationale**: [Why this decision was made]
**Alternatives Considered**: [Other options and why they were rejected]
**Implications**: [Impact on architecture, operations, business]
**Related Decisions**: [Links to related decisions]
**Review Date**: [When to revisit this decision]
```

---

## Foundational Decisions

### Revenue Source of Truth: FinancialLedgerEntry
**Date**: June 22, 2026
**Status**: Approved
**Decision Makers**: Engineering Leadership, Finance Team
**Context**: Multiple data sources existed for revenue analytics (PaymentTransaction, Subscription, MarketplaceOrder, BillingEvent), leading to inconsistencies and reconciliation issues.

**Decision**: `FinancialLedgerEntry` is the single source of truth for all revenue analytics, executive reporting, and financial KPIs. Execution/audit tables (PaymentTransaction, Subscription, MarketplaceOrder, BillingEvent) are reference-only and must not be used for revenue or KPI aggregation.

**Rationale**:
- Immutable, append-only ledger ensures auditability
- Idempotency enforced via unique `idempotencyKey`
- Single source eliminates reconciliation discrepancies
- Supports complex revenue scenarios (refunds, adjustments, multi-currency)
- Aligns with accounting best practices

**Alternatives Considered**:
- Continue using PaymentTransaction as primary source → Rejected: lacks subscription and marketplace revenue
- Use multiple sources with reconciliation layer → Rejected: adds complexity and error-prone
- Build materialized views → Rejected: still requires source-of-truth decision

**Implications**:
- All revenue dashboards must read from FinancialLedgerEntry
- All financial KPIs computed from FinancialLedgerEntry
- Execution tables used only for operational queries (e.g., payment status lookup)
- Reconciliation jobs ensure ledger completeness

**Related Decisions**: Intelligence Hierarchy, Phase 1.25 Addition
**Review Date**: Annually (or if major schema changes)

---

### Intelligence Hierarchy: Descriptive → Diagnostic → Predictive → Prescriptive
**Date**: June 22, 2026
**Status**: Approved
**Decision Makers**: Product Intelligence, Engineering Leadership

**Context**: Risk of building forecasting models without understanding causal drivers, leading to inaccurate predictions and low business value.

**Decision**: Intelligence capabilities must evolve in sequence:
1. **Descriptive**: What happened? (dashboards, KPIs, trends)
2. **Diagnostic**: Why did it happen? (drill-downs, cohorts, attribution)
3. **Predictive**: What will happen? (forecasting, churn prediction)
4. **Prescriptive**: What should we do? (recommendations, autonomous actions)

**Rationale**:
- Forecasting requires causal understanding (diagnostic intelligence)
- Skipping diagnostic layer leads to "black box" models with low trust
- Business stakeholders need to understand "why" before trusting "what"
- Diagnostic intelligence provides feature engineering for predictive models

**Alternatives Considered**:
- Jump directly to forecasting (Phase 1.2 → 1.3) → Rejected: lacks causal understanding
- Build all layers in parallel → Rejected: resource-intensive, low focus
- Start with prescriptive (recommendations) → Rejected: requires predictive models first

**Implications**:
- Phase 1.25 (Hospitality Intelligence Layer) inserted before Phase 1.3 (Forecasting)
- Diagnostic capabilities (drill-downs, cohorts, attribution) prioritized
- Forecasting models will have richer feature sets from diagnostic layer
- Prescriptive intelligence deferred to Phase 2.0

**Related Decisions**: Phase 1.25 Addition, Revenue Source of Truth
**Review Date**: After Phase 1.3 completion

---

### Phase 1.25 Addition: Hospitality Intelligence Layer
**Date**: June 22, 2026
**Status**: Approved
**Decision Makers**: Product Intelligence, Engineering Leadership, Executive Team

**Context**: Original roadmap jumped from Executive Dashboards (Phase 1.2) to Forecasting (Phase 1.3) without diagnostic intelligence layer.

**Decision**: Insert Phase 1.25 (Hospitality Intelligence Layer) between Phase 1.2 and Phase 1.3, focusing on:
- Restaurant Intelligence (revenue by category, product performance, margin)
- Hotel Intelligence (occupancy, ADR, RevPAR, guest retention)
- Customer Intelligence (RFM segmentation, lifecycle stages, health scores)
- Branch Intelligence (performance ranking, risk scores, retention)
- Diagnostic capabilities (drill-downs, cohort analysis, attribution)

**Rationale**:
- Forecasting requires understanding of "why" (causal drivers)
- Hospitality-specific intelligence provides context for accurate forecasting
- Diagnostic capabilities enable feature engineering for predictive models
- Business stakeholders need causal understanding before trusting forecasts

**Alternatives Considered**:
- Keep Phase 1.3 as-is (forecasting without diagnostic layer) → Rejected: low forecast accuracy
- Merge diagnostic capabilities into Phase 1.2 → Rejected: too much scope for one phase
- Defer diagnostic intelligence to Phase 2.0 → Rejected: forecasting would be inaccurate

**Implications**:
- Phase 1.3 delayed by 4-6 weeks (Phase 1.25 duration)
- Forecasting models will have richer feature sets
- Business stakeholders will have causal understanding before forecasts
- Roadmap now: 1.1 → 1.2 → 1.25 → 1.3 → 2.0

**Related Decisions**: Intelligence Hierarchy, Revenue Source of Truth
**Review Date**: After Phase 1.25 completion

---

### Executive KPI Watchdog Approval
**Date**: June 22, 2026
**Status**: Approved
**Decision Makers**: Executive Team, Engineering Leadership

**Context**: Existing watchdogs focused on operational issues (payments, queues, reconciliation) but no strategic-level monitoring for business health.

**Decision**: Add Executive KPI Watchdog to Phase 1.2, monitoring:
- MRR/ARR decline
- Churn spikes (revenue and customer)
- Provider degradation (strategic impact)
- Branch underperformance
- Hospitality performance deterioration (occupancy, AOV)

**Rationale**:
- Executive team needs early warning on strategic business deterioration
- Operational watchdogs don't surface business-level issues
- Strategic issues require different escalation (CEO/CFO/COO vs ops team)
- Complements operational monitoring with strategic layer

**Alternatives Considered**:
- Rely on manual executive reporting → Rejected: slow, reactive
- Use operational watchdogs for strategic alerts → Rejected: wrong audience, wrong cadence
- Defer to Phase 1.3 → Rejected: strategic visibility needed earlier

**Implications**:
- Daily/weekly/monthly executive summaries required
- Alert routing to exec team (Slack + Email)
- Threshold tuning requires exec input
- Cadence-aware alerting (daily, weekly, monthly)

**Related Decisions**: Deferred Work Governance, Intelligence Governance
**Review Date**: After Phase 1.2 completion

---

### Deferred Work Governance: DEFERRED_WORK_REGISTRY.md
**Date**: June 22, 2026
**Status**: Approved
**Decision Makers**: Engineering Leadership

**Context**: Risk of deferred work being forgotten across sessions and phases, leading to incomplete implementations and technical debt.

**Decision**: Maintain permanent `docs/DEFERRED_WORK_REGISTRY.md` with:
- All intentionally postponed work
- Governance rules: every deferred task added immediately, consulted before each phase
- Categories: Payment Testing, Production Configuration, Future Monitoring

**Rationale**:
- Prevents deferred work from disappearing
- Ensures future phases consider deferred dependencies
- Provides audit trail for postponed decisions
- Reduces risk of incomplete implementations

**Alternatives Considered**:
- Use GitHub issues for deferred work → Rejected: issues get closed/forgotten
- Rely on memory/documentation → Rejected: not reliable across sessions
- No formal tracking → Rejected: high risk of forgotten work

**Implications**:
- Every future phase must consult registry before planning
- Deferred items may be reclassified only after verification/implementation
- Registry updated immediately when work is deferred

**Related Decisions**: Intelligence Governance
**Review Date**: Quarterly

---

### Intelligence Governance: BUSINESS_INTELLIGENCE_BACKLOG.md
**Date**: June 22, 2026
**Status**: Approved
**Decision Makers**: Product Intelligence, Engineering Leadership

**Context**: Risk of intelligence opportunities being forgotten or deprioritized across phases.

**Decision**: Maintain permanent `BUSINESS_INTELLIGENCE_BACKLOG.md` with:
- All future intelligence opportunities (dashboards, watchdogs, forecasting, AI systems)
- Each item: description, business value, complexity, dependencies, priority
- Governance rules: consult before each phase, update priorities as business evolves

**Rationale**:
- Prevents intelligence opportunities from being forgotten
- Provides prioritized backlog for future phases
- Ensures business value drives intelligence roadmap
- Complements DEFERRED_WORK_REGISTRY.md for infrastructure work

**Alternatives Considered**:
- Use product backlog for intelligence work → Rejected: intelligence is strategic, not feature-level
- No formal tracking → Rejected: high risk of forgotten opportunities
- Spreadsheet tracking → Rejected: not version-controlled, not accessible

**Implications**:
- Every future phase must consult backlog before planning
- Intelligence opportunities added immediately upon identification
- Priorities updated quarterly based on business needs

**Related Decisions**: Deferred Work Governance, Phase 1.25 Addition
**Review Date**: Quarterly

---

### Alert Severity Discipline: Reserve CRITICAL for Emergencies
**Date**: June 22, 2026
**Status**: Approved
**Decision Makers**: Engineering Leadership, Operations Team

**Context**: Risk of alert fatigue if CRITICAL severity is overused, leading to desensitization and missed true emergencies.

**Decision**: Strict severity discipline:
- **INFO**: Informational only, no action required
- **WARN**: Early warning, proactive attention recommended
- **ERROR**: Immediate attention required, business impact likely
- **CRITICAL**: Severe issue, executive visibility, potential revenue/customer impact

**Rationale**:
- Prevents alert fatigue and desensitization
- Ensures CRITICAL alerts receive immediate attention
- Clear severity definitions reduce ambiguity
- Progressive escalation (WARN → ERROR → CRITICAL) allows time for resolution

**Alternatives Considered**:
- Two severity levels (WARN, CRITICAL) → Rejected: insufficient granularity
- Five+ severity levels → Rejected: too complex, ambiguous
- No severity levels (all alerts equal) → Rejected: no prioritization

**Implications**:
- All watchdogs must follow severity framework
- Threshold tuning required to maintain severity discipline
- Escalation policies tied to severity
- Quarterly review of severity usage

**Related Decisions**: Executive KPI Watchdog Approval
**Review Date**: Quarterly

---

### Cooldown Policies: Prevent Alert Storms
**Date**: June 22, 2026
**Status**: Approved
**Decision Makers**: Engineering Leadership, Operations Team

**Context**: Risk of alert storms (repeated alerts for same condition) causing alert fatigue and operational burden.

**Decision**: Enforce cooldown periods per watchdog, per severity:
- **INFO**: 24 hours
- **WARN**: 30 min to 24 hours (depending on metric cadence)
- **ERROR**: 15 min to 1 hour
- **CRITICAL**: 5 min to 15 min

**Rationale**:
- Prevents alert storms during transient issues
- Allows time for investigation and remediation
- Balances urgency with noise reduction
- Cadence-aware (daily metrics = daily cooldown)

**Alternatives Considered**:
- No cooldowns → Rejected: high risk of alert storms
- Fixed cooldown for all severities → Rejected: not flexible enough
- Manual cooldown override only → Rejected: requires constant intervention

**Implications**:
- Cooldown logic implemented in alert delivery system
- Cooldown storage in Redis (TTL-based)
- Repeated alerts escalate severity (bypass cooldown)
- Cooldown tuning based on alert frequency

**Related Decisions**: Alert Severity Discipline
**Review Date**: Monthly (tuning), Quarterly (policy review)

---

---

### Phase 1.1B Implementation: Payment & Queue Watchdogs
**Date**: June 22, 2026
**Status**: Approved
**Decision Makers**: Engineering Leadership

**Context**: Operational observability foundation required before executive dashboards and intelligence layers.

**Decision**: Implement Payment Watchdog v1 and Queue Watchdog v1 as first operational watchdogs, with standardized alert severity framework and startup channel guard.

**Rationale**:
- Payment Watchdog has highest immediate revenue impact (provider failures affect all customers)
- Queue Watchdog prevents silent failures (operational reliability)
- Alert severity framework ensures consistent alerting across all future watchdogs
- Startup channel guard prevents silent alert delivery failures

**Alternatives Considered**:
- Start with Executive KPI Watchdog → Rejected: requires operational watchdogs first (data sources)
- Implement all watchdogs at once → Rejected: too much scope, no incremental feedback
- Skip alert framework → Rejected: would lead to inconsistent alerting

**Implications**:
- Payment and queue issues detected within 5-10 minutes
- Standardized alert format for all future watchdogs
- Cooldown logic prevents alert storms
- Startup guard ensures alert channels configured

**Related Decisions**: Alert Severity Discipline, Cooldown Policies
**Review Date**: After Phase 1.1C completion

---

### Phase 1.1C Implementation: Financial Integrity & Revenue Protection
**Date**: June 22, 2026
**Status**: Approved
**Decision Makers**: Engineering Leadership

**Context**: Operational observability foundation (Payment, Queue) complete. Financial integrity monitoring required before executive dashboards.

**Decision**: Implement Reconciliation Watchdog v1, Subscription Watchdog v1, and Revenue Watchdog v1, with root-cause-first suppression and DLQ threshold tuning.

**Rationale**:
- Reconciliation Watchdog protects financial accuracy (SLA compliance, ledger integrity)
- Subscription Watchdog protects MRR (grace aging, churn detection)
- Revenue Watchdog provides strategic visibility (daily/weekly trends, concentration risk)
- Suppression rules prevent cascade alert storms (Payment CRITICAL suppresses Queue alerts)
- DLQ threshold lowered (>5 → >3) for earlier systemic failure detection

**Alternatives Considered**:
- Implement Executive KPI Watchdog first → Rejected: requires financial watchdogs as data sources
- Skip suppression rules → Rejected: would cause alert fatigue during payment outages
- Keep DLQ threshold at >5 → Rejected: misses 2-4 DLQ events/hour (systemic failures)

**Implications**:
- Financial accuracy monitored hourly (reconciliation SLA breaches detected within 1 hour)
- Subscription churn risks detected daily (3d, 7d, 14d grace aging milestones)
- Revenue anomalies detected daily (daily/weekly decline, concentration risk)
- Alert fatigue reduced (suppression prevents 2-3 symptom alerts per payment outage)
- Systemic queue failures detected earlier (DLQ > 3 instead of > 5)

**Related Decisions**: Alert Severity Discipline, Cooldown Policies, Phase 1.1B Implementation
**Review Date**: After Phase 1.1D completion

---

### Phase 1.1D Implementation: Customer & Operational Intelligence
**Date**: June 22, 2026
**Status**: Approved
**Decision Makers**: Engineering Leadership

**Context**: Financial watchdogs operational (Phase 1.1C). Customer intelligence and executive visibility required before strategic KPI monitoring.

**Decision**: Implement Customer Watchdog v1, Customer Health Score, Branch Health Score, and Executive Summary Engine. Complete schema validation without blocking roadmap progress.

**Rationale**:
- Customer Watchdog protects high-value customer retention (early dormancy detection)
- Customer Health Score provides foundation for churn prediction and retention campaigns
- Branch Health Score enables benchmarking and performance management
- Executive Summary Engine automates strategic intelligence delivery
- Schema validation approach: document mismatches, continue roadmap (non-blocking)

**Alternatives Considered**:
- Block roadmap until schema perfect → Rejected: schema evolution can happen in parallel
- Skip customer intelligence, go straight to Executive KPI Watchdog → Rejected: customer data needed for executive KPIs
- Implement ML-based churn prediction → Rejected: premature, need baseline data first

**Implications**:
- High-value customer churn detected within 7 days (30d/60d/90d dormancy thresholds)
- Customer health quantified (0-100 score, 4 categories)
- Branch performance benchmarked (health scores, rankings)
- Executive intelligence automated (daily/weekly summaries, 2-minute read time)
- Schema adjustments deferred (non-blocking, documented in MANUAL_ACTION_REQUIRED.md)

**Related Decisions**: Phase 1.1B Implementation, Phase 1.1C Implementation, FinancialLedgerEntry as Revenue Source of Truth
**Review Date**: After Phase 1.2 completion

---

## Future Decisions (To Be Recorded)

### Pending Decisions
- ML-based anomaly detection thresholds (Phase 1.3)
- Forecast-aware alerting strategy (Phase 1.3)
- Automated remediation guardrails (Phase 2.0)
- Customer-facing status page design (Phase 2.0+)
- Multi-region deployment strategy (future)

### Decision Review Schedule
- **Monthly**: Alert threshold tuning, cooldown adjustments
- **Quarterly**: Severity usage review, watchdog portfolio review, backlog prioritization
- **Annually**: Foundational decisions review (Revenue Source of Truth, Intelligence Hierarchy)

---

## Governance

### Decision Recording Process
1. Proposal: Decision proposed with context, rationale, alternatives
2. Review: Stakeholders review and provide feedback
3. Approval: Decision makers approve or reject
4. Recording: Decision recorded in this log with all details
5. Communication: Decision communicated to relevant teams
6. Implementation: Decision implemented in code/process
7. Review: Decision reviewed on schedule

### Decision Authority
- **Foundational Decisions**: Engineering Leadership + Executive Team
- **Technical Decisions**: Engineering Leadership
- **Product Decisions**: Product Intelligence + Engineering Leadership
- **Operational Decisions**: Operations Team + Engineering Leadership

### Decision Lifecycle
- **Proposed**: Under consideration
- **Approved**: Accepted and active
- **Superseded**: Replaced by newer decision (with reference)
- **Deprecated**: No longer applicable (with reason)

---

## Success Criteria

- All major strategic decisions recorded
- Decision template followed consistently
- Decisions reviewed on schedule
- No architectural drift (decisions enforced)
- Stakeholders aware of and aligned with decisions
