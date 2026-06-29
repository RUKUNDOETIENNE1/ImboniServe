# Intelligence Terminology Standard

Date: June 23, 2026
Phase: 1.2A.5
Version: 1.0
Status: ✅ Approved

---

## Purpose

This document establishes approved terminology for all intelligence systems, ensuring consistency across KPIs, dashboards, watchdogs, forecasting models, and executive reports.

**Core Principle**: *One concept, one term. No synonyms, no ambiguity.*

---

## 1. Revenue Terminology

### 1.1 Approved Terms

| Term | Definition | Usage | Prohibited Synonyms |
|------|------------|-------|---------------------|
| **Revenue** | Total money earned from all sources | General revenue discussions | Income, Earnings, Sales |
| **MRR** | Monthly Recurring Revenue from subscriptions | Subscription revenue only | Monthly Revenue, Recurring Revenue |
| **ARR** | Annual Recurring Revenue (MRR × 12) | Subscription revenue only | Annual Revenue, Yearly Revenue |
| **GMV** | Gross Merchandise Value (total transaction value) | All payment transactions | Total Revenue, Gross Revenue |
| **Revenue Growth Rate** | Period-over-period revenue change % | Trend analysis | Growth Rate, Revenue Increase |
| **Revenue Churn Rate** | % of MRR lost from cancellations | Subscription churn only | Churn Rate, MRR Churn |
| **Revenue at Risk** | Revenue from grace period subscriptions | At-risk revenue only | Risk Revenue, Grace Revenue |
| **Revenue Concentration** | % of revenue from top N customers | Concentration analysis | Customer Concentration |
| **Expansion Revenue** | Revenue from upgrades/upsells | Growth analysis | Expansion MRR, Upgrade Revenue |
| **Contraction Revenue** | Revenue from downgrades | Contraction analysis | Contraction MRR, Downgrade Revenue |

### 1.2 Disambiguation

**"Revenue" vs "MRR" vs "GMV"**:
- **Revenue**: Generic term, avoid in KPI names
- **MRR**: Subscription revenue only
- **GMV**: All transaction revenue (subscriptions + one-time payments)

**Always specify**: MRR, ARR, or GMV — never just "Revenue"

---

## 2. Churn Terminology

### 2.1 Approved Terms

| Term | Definition | Usage | Prohibited Synonyms |
|------|------------|-------|---------------------|
| **Revenue Churn Rate** | % of MRR lost from cancellations | Subscription revenue loss | Churn Rate, MRR Churn |
| **Customer Churn Rate** | % of customers lost (no activity in 90d) | Customer retention | Churn Rate, Attrition Rate |
| **Churn Risk** | Predictive signal (grace period, failed payments) | Leading indicator | At-Risk, Churn Probability |
| **Churn Spike** | Sudden increase in churn (2× or 3× baseline) | Anomaly detection | Churn Surge, Churn Jump |

### 2.2 Disambiguation

**"Churn Rate" is AMBIGUOUS** — always specify:
- **Revenue Churn Rate**: % of MRR lost
- **Customer Churn Rate**: % of customers lost

**Never use "Churn Rate" alone** — always specify revenue or customer

---

## 3. Health Terminology

### 3.1 Approved Terms

| Term | Definition | Usage | Prohibited Synonyms |
|------|------------|-------|---------------------|
| **Health Score** | 0-100 numeric score | Customer Health Score, Branch Health Score | Health, Score |
| **Health Status** | HEALTHY/WARNING/CRITICAL enum | System health (payment, queue, reconciliation) | Health, Status |
| **Health Category** | EXCELLENT/HEALTHY/AT_RISK/CRITICAL | Health score categorization | Health Tier, Health Level |
| **Customer Health Score** | 0-100 customer engagement score | Customer intelligence | Customer Score, Customer Health |
| **Branch Health Score** | 0-100 branch performance score | Branch intelligence | Branch Score, Branch Health |
| **Payment Health Status** | HEALTHY/WARNING/CRITICAL payment system status | Operational monitoring | Payment Health, Payment Status |
| **Queue Health Status** | HEALTHY/WARNING/CRITICAL queue status | Operational monitoring | Queue Health, Queue Status |
| **Reconciliation Health Status** | HEALTHY/WARNING/CRITICAL reconciliation status | Financial operations | Reconciliation Health, Reconciliation Status |

### 3.2 Disambiguation

**"Health Score" vs "Health Status"**:
- **Health Score**: 0-100 numeric score (Customer, Branch)
- **Health Status**: HEALTHY/WARNING/CRITICAL enum (Payment, Queue, Reconciliation)

**Never use "Health" alone** — always specify Score or Status

---

## 4. Customer Terminology

### 4.1 Approved Terms

| Term | Definition | Usage | Prohibited Synonyms |
|------|------------|-------|---------------------|
| **Active Customer** | Customer with activity in last 30 days | Customer segmentation | Active, Current Customer |
| **Dormant Customer** | Customer with no activity in 30-90 days | Churn risk | Inactive Customer, Lapsed Customer |
| **Churned Customer** | Customer with no activity in 90+ days | Churn analysis | Lost Customer, Inactive Customer |
| **High-Value Customer** | Customer in top 10% by LTV | VIP segmentation | VIP Customer, Top Customer |
| **Customer Retention Rate** | % of customers retained in period | Retention analysis | Retention Rate, Customer Retention |
| **Customer Lifetime Value (LTV)** | Total revenue from customer | Customer value | LTV, Lifetime Value, CLV |
| **Customer Health Score** | 0-100 customer engagement score | Customer intelligence | Customer Score, Health Score |
| **Customer Health Distribution** | % in each health category | Health analysis | Health Distribution |

### 4.2 Disambiguation

**"Customer Retention" vs "Customer Retention Rate"**:
- **Customer Retention**: Generic term, avoid
- **Customer Retention Rate**: Specific KPI with formula

**Always use full term**: "Customer Retention Rate"

---

## 5. Subscription Terminology

### 5.1 Approved Terms

| Term | Definition | Usage | Prohibited Synonyms |
|------|------------|-------|---------------------|
| **Active Subscription** | Subscription in ACTIVE or GRACE_PERIOD status | Subscription count | Active, Current Subscription |
| **New Subscription** | Subscription created in period | Growth analysis | New, Added Subscription |
| **Churned Subscription** | Subscription in CANCELLED or EXPIRED status | Churn analysis | Cancelled Subscription, Lost Subscription |
| **Grace Period Subscription** | Subscription in GRACE_PERIOD status | At-risk analysis | Grace Subscription, At-Risk Subscription |
| **Grace Period Aging** | Days in GRACE_PERIOD status | Escalation analysis | Grace Aging, Days in Grace |
| **Failed Renewal** | Subscription renewal payment failed | Operational monitoring | Renewal Failure, Failed Payment |
| **Grace Period Aging Distribution** | Count by days in grace (0-3d, 4-7d, 8-14d, 15+d) | Aging analysis | Grace Distribution, Aging Buckets |

### 5.2 Disambiguation

**"Active Subscription" includes GRACE_PERIOD**:
- **Active Subscription**: ACTIVE or GRACE_PERIOD
- **Healthy Subscription**: ACTIVE only (not GRACE_PERIOD)

**Always specify**: Active (includes grace) or Healthy (excludes grace)

---

## 6. Payment Terminology

### 6.1 Approved Terms

| Term | Definition | Usage | Prohibited Synonyms |
|------|------------|-------|---------------------|
| **Payment Success Rate** | % of successful payments | Overall payment health | Success Rate, Payment Rate |
| **Provider Failure Rate** | % of failed payments by provider | Provider health | Failure Rate, Provider Rate |
| **Payment Latency** | Time from initiation to completion | Performance monitoring | Latency, Payment Time |
| **Webhook Success Rate** | % of successful webhook validations | Webhook monitoring | Webhook Rate, Validation Rate |
| **Settlement Time** | Time from payment to settlement | Cash flow monitoring | Settlement Delay, Settlement Duration |
| **Refund Rate** | % of payments refunded | Refund monitoring | Refund Percentage |

### 6.2 Disambiguation

**"Payment Success Rate" vs "Provider Failure Rate"**:
- **Payment Success Rate**: Overall success (all providers)
- **Provider Failure Rate**: Failure by specific provider (MTN, AIRTEL)

**Always specify**: Overall (Payment Success Rate) or by provider (Provider Failure Rate)

---

## 7. Reconciliation Terminology

### 7.1 Approved Terms

| Term | Definition | Usage | Prohibited Synonyms |
|------|------------|-------|---------------------|
| **Reconciliation SLA** | 24-hour reconciliation target | SLA monitoring | Reconciliation Target, SLA |
| **Reconciliation SLA Compliance** | % of entries reconciled within SLA | Compliance monitoring | SLA Compliance, Reconciliation Rate |
| **Unreconciled Entry** | FinancialLedgerEntry not yet reconciled | Backlog monitoring | Unreconciled, Pending Entry |
| **Unreconciled Count** | Count of unreconciled entries | Backlog size | Backlog Count, Pending Count |
| **Reconciliation Aging** | Time since entry creation | Aging analysis | Entry Age, Backlog Age |
| **Reconciliation Aging Distribution** | Count by age (0-6h, 6-12h, 12-24h, 24-48h, 48h+) | Aging analysis | Aging Buckets, Age Distribution |

### 7.2 Disambiguation

**"Reconciliation SLA" vs "Reconciliation SLA Compliance"**:
- **Reconciliation SLA**: 24-hour target
- **Reconciliation SLA Compliance**: % meeting target

**Always specify**: SLA (target) or SLA Compliance (%)

---

## 8. Alert Terminology

### 8.1 Approved Terms

| Term | Definition | Usage | Prohibited Synonyms |
|------|------------|-------|---------------------|
| **INFO** | Informational alert (no action required) | Low-priority alerts | Information, Info Alert |
| **WARN** | Warning alert (attention recommended) | Medium-priority alerts | Warning, Warn Alert |
| **ERROR** | Error alert (action required within hours) | High-priority alerts | Error Alert, High Priority |
| **CRITICAL** | Critical alert (immediate action required) | Urgent alerts | Critical Alert, Urgent |
| **Alert Severity** | INFO/WARN/ERROR/CRITICAL | Severity classification | Severity, Priority |
| **Alert Threshold** | Value triggering alert | Threshold definition | Threshold, Trigger |
| **Alert Cooldown** | Time before re-alerting | Cooldown period | Cooldown, Suppression |

### 8.2 Disambiguation

**"ERROR" vs "CRITICAL"**:
- **ERROR**: Action required within hours
- **CRITICAL**: Immediate action required

**Never use "High Priority" or "Urgent"** — use ERROR or CRITICAL

---

## 9. Branch Terminology

### 9.1 Approved Terms

| Term | Definition | Usage | Prohibited Synonyms |
|------|------------|-------|---------------------|
| **Branch Health Score** | 0-100 branch performance score | Branch intelligence | Branch Score, Branch Health |
| **Branch Ranking** | Rank by health score | Leaderboard | Branch Rank, Branch Position |
| **Top Performer** | Branch with highest health score | Leaderboard | Top Branch, Best Branch |
| **Bottom Performer** | Branch with lowest health score | Leaderboard | Bottom Branch, Worst Branch |
| **At-Risk Branch** | Branch with health score < 70 | Risk monitoring | Risk Branch, Low-Performing Branch |

### 9.2 Disambiguation

**"Top Performer" vs "High-Value Branch"**:
- **Top Performer**: Highest health score
- **High-Value Branch**: Highest revenue (different concept)

**Always specify**: Performer (health score) or Value (revenue)

---

## 10. Operational Terminology

### 10.1 Approved Terms

| Term | Definition | Usage | Prohibited Synonyms |
|------|------------|-------|---------------------|
| **Queue Backlog** | Count of pending jobs in queue | Queue monitoring | Backlog, Pending Jobs |
| **DLQ** | Dead Letter Queue (failed jobs) | Error monitoring | Dead Letter Queue, Failed Queue |
| **DLQ Count** | Count of jobs in DLQ | Error monitoring | DLQ Size, Failed Count |
| **Queue Stall** | No progress in 30 minutes | Stall detection | Stalled Queue, Frozen Queue |
| **Worker Failure Rate** | % of failed job executions | Worker monitoring | Failure Rate, Job Failure Rate |
| **Cron Job Success Rate** | % of successful cron executions | Cron monitoring | Cron Success, Job Success Rate |

### 10.2 Disambiguation

**"Queue Backlog" vs "DLQ Count"**:
- **Queue Backlog**: Pending jobs (will be processed)
- **DLQ Count**: Failed jobs (require manual intervention)

**Always specify**: Backlog (pending) or DLQ (failed)

---

## 11. Time Period Terminology

### 11.1 Approved Terms

| Term | Definition | Usage | Prohibited Synonyms |
|------|------------|-------|---------------------|
| **MoM** | Month-over-Month | Period comparison | Month-over-Month, Monthly |
| **YoY** | Year-over-Year | Period comparison | Year-over-Year, Yearly |
| **WoW** | Week-over-Week | Period comparison | Week-over-Week, Weekly |
| **DoD** | Day-over-Day | Period comparison | Day-over-Day, Daily |
| **Last 24 Hours** | Previous 24-hour period | Time window | 24h, Yesterday |
| **Last 7 Days** | Previous 7-day period | Time window | 7d, Last Week |
| **Last 30 Days** | Previous 30-day period | Time window | 30d, Last Month |
| **Last 90 Days** | Previous 90-day period | Time window | 90d, Last Quarter |

### 11.2 Disambiguation

**"Last Month" vs "Last 30 Days"**:
- **Last Month**: Calendar month (e.g., May 1-31)
- **Last 30 Days**: Rolling 30-day window

**Always specify**: Calendar month or rolling days

---

## 12. Metric Type Terminology

### 12.1 Approved Terms

| Term | Definition | Usage | Prohibited Synonyms |
|------|------------|-------|---------------------|
| **KPI** | Key Performance Indicator | Strategic metrics | Metric, Indicator |
| **Metric** | Measurable value | General measurements | KPI, Indicator |
| **Signal** | Leading indicator | Predictive signals | Indicator, Predictor |
| **Threshold** | Value triggering action | Alert thresholds | Limit, Trigger |
| **Baseline** | Historical average | Comparison baseline | Average, Normal |
| **Target** | Goal value | Performance targets | Goal, Objective |

### 12.2 Disambiguation

**"KPI" vs "Metric"**:
- **KPI**: Strategic, executive-level (MRR, ARR, Churn Rate)
- **Metric**: Operational, detailed (Queue Backlog, DLQ Count)

**Not all metrics are KPIs** — KPIs are strategic subset

---

## 13. Dashboard Terminology

### 13.1 Approved Terms

| Term | Definition | Usage | Prohibited Synonyms |
|------|------------|-------|---------------------|
| **Widget** | Dashboard component displaying KPI | Dashboard design | Component, Card, Panel |
| **Drill-Down** | Navigate to detailed view | Navigation | Drill Down, Detail View |
| **Refresh Cadence** | How often data updates | Update frequency | Refresh Rate, Update Frequency |
| **Real-Time** | Updates every 5 minutes | High-frequency updates | Live, Instant |
| **Near-Real-Time** | Updates every 15-60 minutes | Medium-frequency updates | Near-Live, Frequent |
| **Daily** | Updates once per day | Low-frequency updates | Once Daily, Daily Update |

### 13.2 Disambiguation

**"Real-Time" vs "Near-Real-Time"**:
- **Real-Time**: Every 5 minutes
- **Near-Real-Time**: Every 15-60 minutes

**Always specify**: Real-Time (5 min) or Near-Real-Time (15-60 min)

---

## 14. Prohibited Terms

### 14.1 Ambiguous Terms (Never Use)

| Prohibited Term | Why Prohibited | Use Instead |
|-----------------|----------------|-------------|
| **Churn Rate** | Ambiguous (revenue or customer?) | Revenue Churn Rate, Customer Churn Rate |
| **Health** | Ambiguous (score or status?) | Health Score, Health Status |
| **Revenue** | Too generic | MRR, ARR, GMV |
| **Retention** | Incomplete | Customer Retention Rate |
| **Active** | Context-dependent | Active Customer, Active Subscription |
| **Success Rate** | Context-dependent | Payment Success Rate, Webhook Success Rate |
| **Failure Rate** | Context-dependent | Provider Failure Rate, Worker Failure Rate |
| **Backlog** | Context-dependent | Queue Backlog, Reconciliation Backlog |

### 14.2 Deprecated Terms (Phase Out)

| Deprecated Term | Replacement | Phase Out Date |
|-----------------|-------------|----------------|
| **Churn** | Revenue Churn Rate, Customer Churn Rate | June 30, 2026 |
| **Health** | Health Score, Health Status | June 30, 2026 |
| **Retention** | Customer Retention Rate | June 30, 2026 |
| **Active** | Active Customer, Active Subscription | June 30, 2026 |

---

## 15. Naming Conventions

### 15.1 KPI Names

**Format**: `[Metric] [Type] [Qualifier]`

**Examples**:
- ✅ **Revenue Churn Rate** (Metric: Revenue Churn, Type: Rate)
- ✅ **Customer Health Score** (Metric: Customer Health, Type: Score)
- ✅ **Payment Success Rate** (Metric: Payment Success, Type: Rate)
- ❌ **Churn Rate** (Missing qualifier: revenue or customer?)
- ❌ **Health Score** (Missing qualifier: customer or branch?)

### 15.2 Dashboard Widget Names

**Format**: `[KPI Name] Card` or `[KPI Name] Chart`

**Examples**:
- ✅ **MRR Card**
- ✅ **Revenue Trend Chart**
- ✅ **Customer Health Distribution Chart**
- ❌ **Revenue Card** (Too generic)
- ❌ **Health Chart** (Missing qualifier)

### 15.3 Watchdog Names

**Format**: `[Domain] Watchdog`

**Examples**:
- ✅ **Payment Watchdog**
- ✅ **Reconciliation Watchdog**
- ✅ **Subscription Watchdog**
- ❌ **Churn Watchdog** (Ambiguous domain)

---

## 16. Enforcement

### 16.1 Code Review Checklist

**Before merging any PR**:
- [ ] All KPI names use approved terminology
- [ ] No ambiguous terms (Churn Rate, Health, Revenue)
- [ ] All metric types specified (Rate, Score, Count, etc.)
- [ ] All qualifiers included (Revenue/Customer, Active/Healthy, etc.)
- [ ] No prohibited synonyms used

### 16.2 Documentation Requirements

**Every KPI definition must include**:
- **Approved Term**: From this document
- **Disambiguation**: If term could be ambiguous
- **Prohibited Synonyms**: List of terms NOT to use

**Example**:
```markdown
### Revenue Churn Rate

**Approved Term**: Revenue Churn Rate  
**Disambiguation**: This is revenue churn, not customer churn  
**Prohibited Synonyms**: Churn Rate, MRR Churn, Subscription Churn  
```

---

## 17. Terminology Index

### 17.1 Alphabetical Index

| Term | Category | Section |
|------|----------|---------|
| Active Customer | Customer | 4.1 |
| Active Subscription | Subscription | 5.1 |
| Alert Cooldown | Alert | 8.1 |
| Alert Severity | Alert | 8.1 |
| Alert Threshold | Alert | 8.1 |
| ARR | Revenue | 1.1 |
| At-Risk Branch | Branch | 9.1 |
| Baseline | Metric Type | 12.1 |
| Bottom Performer | Branch | 9.1 |
| Branch Health Score | Branch | 9.1 |
| Branch Ranking | Branch | 9.1 |
| Churn Risk | Churn | 2.1 |
| Churn Spike | Churn | 2.1 |
| Churned Customer | Customer | 4.1 |
| Churned Subscription | Subscription | 5.1 |
| Contraction Revenue | Revenue | 1.1 |
| CRITICAL | Alert | 8.1 |
| Cron Job Success Rate | Operational | 10.1 |
| Customer Churn Rate | Churn | 2.1 |
| Customer Health Distribution | Customer | 4.1 |
| Customer Health Score | Customer | 4.1 |
| Customer Lifetime Value (LTV) | Customer | 4.1 |
| Customer Retention Rate | Customer | 4.1 |
| Daily | Dashboard | 13.1 |
| DLQ | Operational | 10.1 |
| DLQ Count | Operational | 10.1 |
| DoD | Time Period | 11.1 |
| Dormant Customer | Customer | 4.1 |
| Drill-Down | Dashboard | 13.1 |
| ERROR | Alert | 8.1 |
| Expansion Revenue | Revenue | 1.1 |
| Failed Renewal | Subscription | 5.1 |
| GMV | Revenue | 1.1 |
| Grace Period Aging | Subscription | 5.1 |
| Grace Period Aging Distribution | Subscription | 5.1 |
| Grace Period Subscription | Subscription | 5.1 |
| Health Category | Health | 3.1 |
| Health Score | Health | 3.1 |
| Health Status | Health | 3.1 |
| High-Value Customer | Customer | 4.1 |
| INFO | Alert | 8.1 |
| KPI | Metric Type | 12.1 |
| Last 24 Hours | Time Period | 11.1 |
| Last 30 Days | Time Period | 11.1 |
| Last 7 Days | Time Period | 11.1 |
| Last 90 Days | Time Period | 11.1 |
| Metric | Metric Type | 12.1 |
| MoM | Time Period | 11.1 |
| MRR | Revenue | 1.1 |
| Near-Real-Time | Dashboard | 13.1 |
| New Subscription | Subscription | 5.1 |
| Payment Health Status | Health | 3.1 |
| Payment Latency | Payment | 6.1 |
| Payment Success Rate | Payment | 6.1 |
| Provider Failure Rate | Payment | 6.1 |
| Queue Backlog | Operational | 10.1 |
| Queue Health Status | Health | 3.1 |
| Queue Stall | Operational | 10.1 |
| Real-Time | Dashboard | 13.1 |
| Reconciliation Aging | Reconciliation | 7.1 |
| Reconciliation Aging Distribution | Reconciliation | 7.1 |
| Reconciliation Health Status | Health | 3.1 |
| Reconciliation SLA | Reconciliation | 7.1 |
| Reconciliation SLA Compliance | Reconciliation | 7.1 |
| Refund Rate | Payment | 6.1 |
| Refresh Cadence | Dashboard | 13.1 |
| Revenue | Revenue | 1.1 |
| Revenue at Risk | Revenue | 1.1 |
| Revenue Churn Rate | Churn | 2.1 |
| Revenue Concentration | Revenue | 1.1 |
| Revenue Growth Rate | Revenue | 1.1 |
| Settlement Time | Payment | 6.1 |
| Signal | Metric Type | 12.1 |
| Target | Metric Type | 12.1 |
| Threshold | Metric Type | 12.1 |
| Top Performer | Branch | 9.1 |
| Unreconciled Count | Reconciliation | 7.1 |
| Unreconciled Entry | Reconciliation | 7.1 |
| WARN | Alert | 8.1 |
| Webhook Success Rate | Payment | 6.1 |
| Widget | Dashboard | 13.1 |
| WoW | Time Period | 11.1 |
| Worker Failure Rate | Operational | 10.1 |
| YoY | Time Period | 11.1 |

---

## 18. Approval & Sign-Off

**Approved By**:
- Engineering Leadership: ✅
- Product Intelligence: ✅
- Executive Team: ✅

**Effective Date**: June 23, 2026

**Review Schedule**: Quarterly

**Next Review**: September 23, 2026

---

## Summary

**Core Principle**: *One concept, one term. No synonyms, no ambiguity.*

**Key Rules**:
1. ✅ Always specify qualifiers (Revenue/Customer, Active/Healthy, Score/Status)
2. ✅ Never use ambiguous terms (Churn Rate, Health, Revenue)
3. ✅ Use approved terms only (see index)
4. ❌ Never use prohibited synonyms
5. ❌ Never use deprecated terms after phase-out date

**Enforcement**:
- Code review checklist
- Documentation requirements
- Quarterly terminology audit

**Future Phases**: All new KPIs, dashboards, watchdogs, and forecasting models must use approved terminology only.
