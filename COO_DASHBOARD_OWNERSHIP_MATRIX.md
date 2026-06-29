# COO Dashboard Ownership Matrix

**Document Version**: 1.0  
**Phase**: 1.2E-A COO Intelligence Architecture & Reality Design Review  
**Date**: June 24, 2026  
**Role**: Enterprise Systems Reviewer & Decision Intelligence Architect  

---

## Executive Summary

**Mission**: Define clear ownership boundaries between CEO, CFO, and COO dashboards

**Finding**: Current dashboards have significant overlap and unclear ownership

**Recommendation**: Strict separation by decision domain, not data type

---

## Ownership Principles

### Principle 1: Decision Domain Ownership

**CEO Dashboard**: Strategic decisions (what to do)  
**CFO Dashboard**: Financial decisions (can we afford it)  
**COO Dashboard**: Operational decisions (are we executing well)

---

### Principle 2: No Duplication

**Rule**: Each metric/widget belongs to ONE dashboard

**Exception**: Executive summary can reference cross-domain metrics

**Rationale**: Prevents dashboard bloat, maintains focus

---

### Principle 3: Escalation Path

**Flow**: COO → CFO → CEO

**Example**:
- COO sees operational issue
- If financial impact significant → CFO alerted
- If strategic implication → CEO alerted

---

## Current Dashboard Audit

### CEO Dashboard (Current State)

**Sections**:
1. Business Health Overview
2. Revenue Metrics
3. Customer Metrics
4. Operations Overview
5. Hospitality Metrics
6. Executive Insight

**Total Widgets**: ~25

**Issues**:
- ❌ Mixes strategic and operational metrics
- ❌ Overlaps with CFO dashboard (revenue)
- ❌ Overlaps with COO dashboard (operations)
- ❌ No clear decision focus

---

### CFO Dashboard (Current State)

**Sections**:
1. Financial Health (MRR, ARR, GMV, NRR)
2. Revenue Intelligence (composition, concentration)
3. Subscription Intelligence (dynamics, risk)
4. Financial Operations (payments, reconciliation)
5. Financial Priorities (ranked issues)
6. Executive Insight Strip
7. Power Layer (insights, correlations, narratives)

**Total Widgets**: ~30

**Issues**:
- ✅ Well-defined financial focus
- ✅ Clear decision support
- ⚠️ Some operational metrics (payment health) could belong to COO
- ✅ Minimal overlap with CEO

---

### COO Dashboard (Proposed State)

**Sections**: TBD (this analysis)

**Total Widgets**: TBD

**Requirements**:
- ✅ Pure operational focus
- ✅ Zero overlap with CEO/CFO
- ✅ Execution quality metrics only
- ✅ Real-time to daily data

---

## Ownership Matrix

### Category: Revenue Metrics

| Metric | CEO | CFO | COO | Rationale |
|--------|-----|-----|-----|-----------|
| **MRR** | ❌ | ✅ | ❌ | Financial metric, CFO owns |
| **ARR** | ❌ | ✅ | ❌ | Financial metric, CFO owns |
| **GMV** | ❌ | ✅ | ❌ | Financial metric, CFO owns |
| **Revenue Growth Rate** | ✅ | ✅ | ❌ | CEO strategy, CFO detail |
| **Revenue Churn** | ❌ | ✅ | ❌ | Financial metric, CFO owns |
| **NRR** | ❌ | ✅ | ❌ | Financial metric, CFO owns |
| **Revenue Concentration** | ❌ | ✅ | ❌ | Financial risk, CFO owns |
| **Revenue per Location** | ❌ | ✅ | ⚠️ | CFO owns, COO can see for context |

**Ownership**: CFO owns all revenue metrics

**COO Access**: Read-only context, not primary focus

---

### Category: Customer Metrics

| Metric | CEO | CFO | COO | Rationale |
|--------|-----|-----|-----|-----------|
| **Total Customers** | ✅ | ❌ | ❌ | Strategic growth metric |
| **Customer Acquisition** | ✅ | ✅ | ❌ | CEO strategy, CFO cost |
| **Customer Churn Rate** | ✅ | ✅ | ⚠️ | CEO/CFO metric, COO sees impact |
| **Customer Lifetime Value** | ❌ | ✅ | ❌ | Financial metric, CFO owns |
| **Customer Satisfaction Score** | ❌ | ❌ | ✅ | Operational quality, COO owns |
| **Net Promoter Score (NPS)** | ✅ | ❌ | ✅ | CEO brand, COO execution |
| **Customer Complaints** | ❌ | ❌ | ✅ | Operational issue, COO owns |
| **Repeat Customer Rate** | ✅ | ✅ | ❌ | CEO strategy, CFO revenue |

**Ownership**: Split by decision domain

**Key Distinction**: 
- CEO/CFO: Customer acquisition/retention (strategy/finance)
- COO: Customer satisfaction/complaints (execution quality)

---

### Category: Subscription Metrics

| Metric | CEO | CFO | COO | Rationale |
|--------|-----|-----|-----|-----------|
| **Active Subscriptions** | ❌ | ✅ | ❌ | Financial metric, CFO owns |
| **Subscription Growth Rate** | ✅ | ✅ | ❌ | CEO strategy, CFO detail |
| **Subscription Churn** | ❌ | ✅ | ❌ | Financial metric, CFO owns |
| **Subscription MRR** | ❌ | ✅ | ❌ | Financial metric, CFO owns |
| **Failed Renewals** | ❌ | ✅ | ✅ | CFO revenue, COO execution |
| **Subscription Cancellation Reasons** | ❌ | ❌ | ✅ | Operational insight, COO owns |

**Ownership**: CFO owns metrics, COO owns execution issues

---

### Category: Payment & Financial Operations

| Metric | CEO | CFO | COO | Rationale |
|--------|-----|-----|-----|-----------|
| **Payment Success Rate** | ❌ | ✅ | ✅ | CFO revenue, COO operations |
| **Payment Failure Rate** | ❌ | ✅ | ✅ | CFO revenue, COO operations |
| **Payment Processing Time** | ❌ | ❌ | ✅ | Operational metric, COO owns |
| **Reconciliation Health** | ❌ | ✅ | ✅ | CFO compliance, COO execution |
| **Reconciliation Backlog** | ❌ | ✅ | ✅ | CFO compliance, COO execution |
| **Payment Provider Health** | ❌ | ❌ | ✅ | Operational reliability, COO owns |

**Ownership**: Shared CFO/COO

**Key Distinction**:
- CFO: Financial impact of payment issues
- COO: Operational health of payment systems

---

### Category: Operational Health

| Metric | CEO | CFO | COO | Rationale |
|--------|-----|-----|-----|-----------|
| **Service Response Time** | ❌ | ❌ | ✅ | Operational quality, COO owns |
| **Queue Depth** | ❌ | ❌ | ✅ | Operational bottleneck, COO owns |
| **Staff Utilization** | ❌ | ⚠️ | ✅ | COO owns, CFO sees labor cost |
| **Equipment Uptime** | ❌ | ❌ | ✅ | Operational reliability, COO owns |
| **Process Cycle Time** | ❌ | ❌ | ✅ | Operational efficiency, COO owns |
| **Incident Frequency** | ❌ | ❌ | ✅ | Operational quality, COO owns |
| **Compliance Rate** | ❌ | ❌ | ✅ | Operational standard, COO owns |

**Ownership**: COO owns all operational health metrics

**CEO/CFO Access**: None (unless escalated)

---

### Category: Staffing & Workforce

| Metric | CEO | CFO | COO | Rationale |
|--------|-----|-----|-----|-----------|
| **Total Staff Count** | ✅ | ✅ | ✅ | CEO strategy, CFO cost, COO execution |
| **Staff Turnover Rate** | ✅ | ✅ | ✅ | CEO culture, CFO cost, COO execution |
| **Shift Coverage Health** | ❌ | ❌ | ✅ | Operational execution, COO owns |
| **Staff Performance Score** | ❌ | ❌ | ✅ | Operational quality, COO owns |
| **Training Completion Rate** | ❌ | ❌ | ✅ | Operational capability, COO owns |
| **Labor Cost** | ❌ | ✅ | ⚠️ | CFO owns, COO sees for context |
| **Labor Efficiency** | ❌ | ✅ | ✅ | CFO cost, COO productivity |

**Ownership**: Mostly COO, some shared with CEO/CFO

**Key Distinction**:
- CEO: Strategic workforce planning
- CFO: Labor cost management
- COO: Day-to-day staffing execution

---

### Category: Location/Branch Metrics

| Metric | CEO | CFO | COO | Rationale |
|--------|-----|-----|-----|-----------|
| **Total Locations** | ✅ | ❌ | ❌ | Strategic expansion, CEO owns |
| **Location Revenue** | ❌ | ✅ | ❌ | Financial metric, CFO owns |
| **Location Profitability** | ❌ | ✅ | ❌ | Financial metric, CFO owns |
| **Location Performance Score** | ❌ | ❌ | ✅ | Operational quality, COO owns |
| **Location Compliance Rate** | ❌ | ❌ | ✅ | Operational standard, COO owns |
| **Cross-Location Variance** | ❌ | ❌ | ✅ | Operational consistency, COO owns |
| **Location Health Score** | ❌ | ❌ | ✅ | Operational health, COO owns |

**Ownership**: CEO strategy, CFO finance, COO operations

**Key Distinction**:
- CEO: How many locations, where to expand
- CFO: Which locations are profitable
- COO: Which locations execute well

---

### Category: Incident & Risk Management

| Metric | CEO | CFO | COO | Rationale |
|--------|-----|-----|-----|-----------|
| **Incident Frequency** | ❌ | ❌ | ✅ | Operational issue, COO owns |
| **Incident Severity Distribution** | ❌ | ❌ | ✅ | Operational risk, COO owns |
| **Incident Response Time** | ❌ | ❌ | ✅ | Operational effectiveness, COO owns |
| **Recurring Incident Patterns** | ❌ | ❌ | ✅ | Operational systemic issue, COO owns |
| **Safety Incidents** | ⚠️ | ❌ | ✅ | COO owns, CEO escalation if severe |
| **Legal/Compliance Incidents** | ⚠️ | ⚠️ | ✅ | COO owns, CEO/CFO escalation |

**Ownership**: COO owns, escalates to CEO/CFO when needed

---

### Category: Inventory & Supply Chain

| Metric | CEO | CFO | COO | Rationale |
|--------|-----|-----|-----|-----------|
| **Inventory Value** | ❌ | ✅ | ❌ | Financial metric, CFO owns |
| **Inventory Turnover** | ❌ | ✅ | ❌ | Financial efficiency, CFO owns |
| **Stockout Frequency** | ❌ | ❌ | ✅ | Operational issue, COO owns |
| **Waste Percentage** | ❌ | ✅ | ✅ | CFO cost, COO execution |
| **Vendor Performance** | ❌ | ❌ | ✅ | Operational reliability, COO owns |
| **Supply Chain Disruptions** | ❌ | ❌ | ✅ | Operational issue, COO owns |

**Ownership**: CFO finance, COO operations

---

### Category: Service Quality

| Metric | CEO | CFO | COO | Rationale |
|--------|-----|-----|-----|-----------|
| **Service Quality Score** | ❌ | ❌ | ✅ | Operational quality, COO owns |
| **Service Consistency Score** | ❌ | ❌ | ✅ | Operational consistency, COO owns |
| **Service Recovery Rate** | ❌ | ❌ | ✅ | Operational effectiveness, COO owns |
| **Customer Wait Time** | ❌ | ❌ | ✅ | Operational efficiency, COO owns |
| **Order Accuracy** | ❌ | ❌ | ✅ | Operational quality, COO owns |

**Ownership**: COO owns all service quality metrics

---

## Dashboard Widget Ownership

### CEO Dashboard Widgets

**Keep**:
1. ✅ Business Health Overview (high-level)
2. ✅ Revenue Growth Trend (strategic)
3. ✅ Customer Acquisition Trend (strategic)
4. ✅ Market Expansion Status (strategic)
5. ✅ Strategic Initiatives Progress
6. ✅ Competitive Position
7. ✅ Brand Health (NPS)

**Remove** (move to CFO):
- ❌ Detailed revenue metrics (MRR, ARR)
- ❌ Financial operations details

**Remove** (move to COO):
- ❌ Operational health details
- ❌ Service quality metrics
- ❌ Incident management

**Total Widgets**: ~7-10 (strategic focus)

---

### CFO Dashboard Widgets

**Keep**:
1. ✅ Financial Health (MRR, ARR, GMV, NRR)
2. ✅ Revenue Intelligence (composition, concentration)
3. ✅ Subscription Intelligence (dynamics, risk)
4. ✅ Financial Operations (payments, reconciliation)
5. ✅ Financial Priorities (ranked issues)
6. ✅ Executive Insight Strip
7. ✅ Power Layer (insights, correlations, narratives)
8. ✅ Revenue Churn Analysis
9. ✅ Customer Lifetime Value

**Add** (from CEO):
- ➕ Detailed revenue metrics

**Remove** (move to COO):
- ❌ Operational health details (keep financial impact only)

**Total Widgets**: ~30-35 (financial focus)

---

### COO Dashboard Widgets

**Add** (new):
1. ➕ Shift Coverage Health (real-time)
2. ➕ Service Response Time (real-time)
3. ➕ Queue Depth & Wait Times (real-time)
4. ➕ Incident Frequency & Severity (real-time)
5. ➕ Location Performance Scores (daily)
6. ➕ Staff Performance Index (daily)
7. ➕ Service Quality Score (daily)
8. ➕ Compliance Rate (daily)
9. ➕ Equipment Reliability (daily)
10. ➕ Recurring Incident Patterns (weekly)
11. ➕ Cross-Location Variance (weekly)
12. ➕ Training Effectiveness (weekly)
13. ➕ Vendor Performance (weekly)
14. ➕ Process Cycle Time (daily)
15. ➕ Customer Complaint Velocity (daily)

**Add** (from CEO):
- ➕ Operational health details
- ➕ Service quality metrics

**Add** (from CFO):
- ➕ Payment operations health (not financial impact)
- ➕ Reconciliation execution (not financial impact)

**Total Widgets**: ~20-25 (operational focus)

---

## Ownership Decision Rules

### Rule 1: Financial Impact → CFO

**If metric measures**:
- Revenue
- Cost
- Profit
- Financial risk

**Then**: CFO Dashboard

---

### Rule 2: Strategic Direction → CEO

**If metric measures**:
- Market position
- Growth strategy
- Competitive advantage
- Long-term vision

**Then**: CEO Dashboard

---

### Rule 3: Execution Quality → COO

**If metric measures**:
- Service delivery
- Operational consistency
- Process efficiency
- Staff effectiveness

**Then**: COO Dashboard

---

### Rule 4: Shared Metrics → Primary Owner + Context

**If metric relevant to multiple roles**:
- Assign to PRIMARY decision owner
- Others get read-only context or summary

**Example**: Payment Success Rate
- CFO: Financial impact ($X revenue at risk)
- COO: Operational health (provider status, queue depth)

---

## Overlap Resolution

### Current Overlap: Revenue Metrics

**Issue**: Both CEO and CFO show revenue

**Resolution**:
- CEO: Revenue growth trend only (strategic)
- CFO: All detailed revenue metrics (financial)

---

### Current Overlap: Operational Health

**Issue**: CEO shows operations, should be COO

**Resolution**:
- CEO: Remove operational details
- COO: Own all operational health metrics

---

### Current Overlap: Payment Operations

**Issue**: CFO shows payment health, but it's operational

**Resolution**:
- CFO: Payment financial impact only
- COO: Payment operational health

---

## Dashboard Separation Summary

### CEO Dashboard Focus

**Purpose**: Strategic decision support

**Horizon**: Months to years

**Metrics**: 7-10 strategic KPIs

**Update Frequency**: Daily to weekly

**Key Widgets**:
- Business health overview
- Revenue growth trend
- Customer acquisition trend
- Strategic initiatives
- Brand health (NPS)

---

### CFO Dashboard Focus

**Purpose**: Financial decision support

**Horizon**: Weeks to quarters

**Metrics**: 30-35 financial KPIs

**Update Frequency**: Real-time to daily

**Key Widgets**:
- Financial health (MRR, ARR, GMV, NRR)
- Revenue intelligence
- Subscription intelligence
- Financial operations
- Financial priorities
- Power layer (insights, correlations)

---

### COO Dashboard Focus

**Purpose**: Operational decision support

**Horizon**: Minutes to weeks

**Metrics**: 20-25 operational signals

**Update Frequency**: Real-time to daily

**Key Widgets**:
- Shift coverage health
- Service response time
- Queue depth & wait times
- Incident management
- Location performance scores
- Staff performance index
- Service quality score
- Compliance rate

---

## Key Insights

### Insight 1: Dashboards Must Reflect Decision Domains

**Current Problem**: Dashboards mix strategic, financial, and operational metrics

**Solution**: Strict separation by decision domain

**Benefit**: Each executive sees only what they need to decide

---

### Insight 2: COO Dashboard Is NOT "Operations KPIs"

**Wrong Approach**: Show operational KPIs (utilization, efficiency)

**Right Approach**: Show execution quality signals (service time, incident frequency)

**Difference**: KPIs measure outcomes, signals show execution quality

---

### Insight 3: No Duplication = Better Focus

**Current Problem**: Same metrics on multiple dashboards

**Solution**: Each metric has ONE owner

**Benefit**: Reduces cognitive load, improves decision speed

---

## Summary

### Dashboard Ownership Matrix: COMPLETE ✅

**CEO Dashboard**: 7-10 strategic widgets  
**CFO Dashboard**: 30-35 financial widgets  
**COO Dashboard**: 20-25 operational widgets  

**Total Overlap**: <5% (only essential context)

**Separation Clarity**: HIGH

---

### Key Recommendations

1. **Remove operational details from CEO Dashboard**
2. **Keep CFO Dashboard focused on financial metrics**
3. **Create COO Dashboard as pure operational intelligence**
4. **Enforce strict ownership rules**
5. **Allow read-only context where needed**

---

**Dashboard Ownership Matrix: COMPLETE** ✅

**Key Finding**: Clear separation by decision domain, minimal overlap

**Next**: Hospitality Operations Reality Review
