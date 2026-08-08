# Dashboard Architecture Blueprint

Date: June 23, 2026
Phase: 1.2A
Type: Architecture Design (No Implementation)
Status: Complete

---

## Executive Summary

This blueprint defines the architecture for 4 executive dashboards (CEO, CFO, COO, Operations) with detailed widget specifications, KPI mappings, drill-down paths, refresh cadences, and permissions. **No implementation** — architecture and planning only.

**Design Principles**:
- Single-screen visibility (no scrolling)
- Real-time or near-real-time data
- Clear drill-down paths for investigation
- Role-based access control
- Mobile-responsive design

---

## 1. CEO Dashboard

### Purpose
Strategic business health overview for executive decision-making

### Audience
- CEO
- Board members (read-only)
- Investors (read-only, limited)

### Refresh Cadence
- **Real-time**: Payment success rate, active alerts
- **Hourly**: GMV, payment metrics
- **Daily**: Revenue, subscriptions, customers, branches
- **Monthly**: MRR, ARR, churn rates, NRR

---

### Layout (Single Screen, 3 Sections)

```
┌─────────────────────────────────────────────────────────────┐
│ HEADER: ImboniServe CEO Dashboard | Last Updated: [time]   │
│ Alerts: [2 CRITICAL] [5 ERROR] [12 WARN]                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ SECTION 1: GROWTH & REVENUE (40% height)                   │
├─────────────────────────────────────────────────────────────┤
│ [MRR Card] [ARR Card] [GMV Card] [Growth Rate Card]        │
│ [Revenue Trend Chart - 12 months]                          │
│ [NRR Card] [Churn Rate Card]                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ SECTION 2: CUSTOMER HEALTH (30% height)                    │
├─────────────────────────────────────────────────────────────┤
│ [Active Customers] [Customer Health Distribution Chart]     │
│ [High-Value Customers] [Customer Churn Rate]               │
│ [Customer LTV] [Retention Rate]                            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ SECTION 3: OPERATIONAL HEALTH (30% height)                 │
├─────────────────────────────────────────────────────────────┤
│ [Payment Success] [Provider Health] [Webhook Success]      │
│ [Reconciliation SLA] [Active Subscriptions]                │
│ [Branch Leaderboard - Top 3 / Bottom 3]                    │
└─────────────────────────────────────────────────────────────┘
```

---

### Widgets Specification

#### Widget 1: MRR Card
**KPI**: Monthly Recurring Revenue  
**Data Source**: `FinancialLedgerEntry` WHERE `eventType = 'SUBSCRIPTION_CHARGE'`  
**Display**:
- Large number: Current MRR (e.g., "RWF 12.5M")
- Change indicator: MoM % (e.g., "+5.2%" in green)
- Sparkline: 12-month trend
- Alert indicator: Red if decline > 10%, Yellow if decline > 5%

**Drill-Down**:
- Click → MRR Breakdown (by plan tier, segment, region)
- Click trend → MRR History (24 months, cohort analysis)

**Refresh**: Daily at 6:00 AM

---

#### Widget 2: ARR Card
**KPI**: Annual Recurring Revenue  
**Data Source**: Derived from MRR (MRR × 12)  
**Display**:
- Large number: Current ARR (e.g., "RWF 150M")
- Change indicator: YoY % (e.g., "+12.3%" in green)
- Target indicator: Progress to annual target (if set)

**Drill-Down**:
- Click → ARR Breakdown (by segment, cohort)
- Click trend → ARR History (36 months)

**Refresh**: Daily at 6:00 AM

---

#### Widget 3: GMV Card
**KPI**: Gross Merchandise Value  
**Data Source**: `FinancialLedgerEntry` WHERE `eventType = 'PAYMENT_SUCCESS'`  
**Display**:
- Large number: Current month GMV (e.g., "RWF 45M")
- Change indicator: MoM % (e.g., "-2.1%" in yellow)
- Sparkline: 12-week trend
- Alert indicator: Red if decline > 20%, Yellow if decline > 10%

**Drill-Down**:
- Click → GMV Breakdown (by domain: hotel, restaurant, marketplace)
- Click trend → GMV History (52 weeks, seasonality view)

**Refresh**: Hourly

---

#### Widget 4: Revenue Growth Rate Card
**KPI**: Revenue Growth Rate  
**Data Source**: `FinancialLedgerEntry` period-over-period  
**Display**:
- Large number: MoM % (e.g., "+8.5%")
- Secondary: YoY % (e.g., "+15.2%")
- Trend indicator: Arrow (up/down/flat)
- Alert indicator: Red if < -5%, Yellow if < 0%

**Drill-Down**:
- Click → Growth Decomposition (new revenue, expansion, contraction, churn)
- Click trend → Growth History (24 months)

**Refresh**: Monthly

---

#### Widget 5: Revenue Trend Chart
**KPI**: Revenue over time  
**Data Source**: `FinancialLedgerEntry` aggregated monthly  
**Display**:
- Line chart: 12-month revenue trend
- Stacked area: Breakdown by domain (hotel, restaurant, marketplace)
- Annotations: Major events (promotions, launches, incidents)

**Drill-Down**:
- Click data point → Month detail (daily breakdown, top customers)
- Click domain → Domain-specific trend

**Refresh**: Daily at 6:00 AM

---

#### Widget 6: NRR Card
**KPI**: Net Revenue Retention  
**Data Source**: `FinancialLedgerEntry` cohort analysis  
**Display**:
- Large number: Current NRR % (e.g., "105%")
- Change indicator: MoM change (e.g., "+2pp" in green)
- Sparkline: 6-month trend
- Alert indicator: Red if < 90%, Yellow if < 100%

**Drill-Down**:
- Click → NRR Breakdown (expansion, contraction, churn)
- Click trend → NRR History (24 months, cohort view)

**Refresh**: Monthly

---

#### Widget 7: Churn Rate Card
**KPI**: Revenue Churn Rate  
**Data Source**: `Subscription` status transitions, `FinancialLedgerEntry`  
**Display**:
- Large number: Current churn % (e.g., "3.2%")
- Change indicator: MoM change (e.g., "+0.5pp" in yellow)
- Sparkline: 12-month trend
- Alert indicator: Red if > 10%, Yellow if > 5%

**Drill-Down**:
- Click → Churn Analysis (by plan tier, tenure, reason)
- Click trend → Churn History (24 months, cohort curves)

**Refresh**: Monthly

---

#### Widget 8: Active Customers Card
**KPI**: Active Customer Count  
**Data Source**: `Customer` WHERE `lastVisit` within 30 days  
**Display**:
- Large number: Active count (e.g., "12,450")
- Change indicator: MoM % (e.g., "+3.2%" in green)
- Sparkline: 12-month trend

**Drill-Down**:
- Click → Customer Segmentation (by domain, tenure, value)
- Click trend → Customer Growth History (24 months)

**Refresh**: Daily at 6:00 AM

---

#### Widget 9: Customer Health Distribution Chart
**KPI**: Customer Health Score Distribution  
**Data Source**: `CustomerHealthScoreService.getScoreDistribution()`  
**Display**:
- Donut chart: % in each category (EXCELLENT, HEALTHY, AT_RISK, CRITICAL)
- Color coding: Green (EXCELLENT), Blue (HEALTHY), Yellow (AT_RISK), Red (CRITICAL)
- Center number: Average health score (e.g., "78")

**Drill-Down**:
- Click segment → Customer list in that category
- Click center → Health score trends (12 months)

**Refresh**: Daily at 6:00 AM

---

#### Widget 10: High-Value Customers Card
**KPI**: High-Value Customer Count  
**Data Source**: `Customer` WHERE `lifetimeSpendCents` >= p90  
**Display**:
- Large number: High-value count (e.g., "1,245")
- Change indicator: MoM % (e.g., "-2.1%" in yellow)
- Secondary: Total LTV of high-value customers

**Drill-Down**:
- Click → High-value customer list (sortable by LTV, health score)
- Click trend → High-value customer history (24 months)

**Refresh**: Daily at 6:00 AM

---

#### Widget 11: Customer Churn Rate Card
**KPI**: Customer Churn Rate  
**Data Source**: `Customer` activity analysis  
**Display**:
- Large number: Current churn % (e.g., "8.5%")
- Change indicator: MoM change (e.g., "+1.2pp" in yellow)
- Sparkline: 12-month trend
- Alert indicator: Red if > 20%, Yellow if > 10%

**Drill-Down**:
- Click → Churn Analysis (by segment, tenure, reason)
- Click trend → Churn History (24 months, cohort curves)

**Refresh**: Monthly

---

#### Widget 12: Customer LTV Card
**KPI**: Customer Lifetime Value (Median)  
**Data Source**: `FinancialLedgerEntry` aggregated by customer  
**Display**:
- Large number: Median LTV (e.g., "RWF 125k")
- Change indicator: MoM % (e.g., "+5.2%" in green)
- Sparkline: 12-month trend

**Drill-Down**:
- Click → LTV Distribution (histogram, by cohort)
- Click trend → LTV History (24 months, cohort analysis)

**Refresh**: Monthly

---

#### Widget 13: Customer Retention Rate Card
**KPI**: Customer Retention Rate  
**Data Source**: `Customer` activity analysis  
**Display**:
- Large number: Current retention % (e.g., "85%")
- Change indicator: MoM change (e.g., "-2pp" in yellow)
- Sparkline: 6-month trend
- Alert indicator: Red if < 70%, Yellow if < 80%

**Drill-Down**:
- Click → Retention Analysis (by segment, cohort)
- Click trend → Retention Curves (cohort retention over time)

**Refresh**: Monthly

---

#### Widget 14: Payment Success Card
**KPI**: Payment Success Rate  
**Data Source**: `PaymentTransaction.status`  
**Display**:
- Large number: Success rate % (e.g., "96.5%")
- Change indicator: 24h change (e.g., "-0.5pp" in yellow)
- Sparkline: 7-day trend
- Alert indicator: Red if < 90%, Yellow if < 95%

**Drill-Down**:
- Click → Payment Analysis (by provider, error code)
- Click trend → Payment Success History (30 days)

**Refresh**: Hourly

---

#### Widget 15: Provider Health Card
**KPI**: Provider Failure Rate (by provider)  
**Data Source**: `PaymentTransaction` by `paymentProvider`  
**Display**:
- List: Provider name + failure rate (e.g., "MTN: 1.2%", "AIRTEL: 2.5%")
- Color coding: Green (< 1%), Yellow (1-3%), Red (> 3%)
- Alert indicator: Red if any provider > 3%

**Drill-Down**:
- Click provider → Provider Scorecard (latency, error codes, settlement time)
- Click trend → Provider History (30 days)

**Refresh**: Hourly

---

#### Widget 16: Webhook Success Card
**KPI**: Webhook Success Rate  
**Data Source**: `PaymentTransaction.webhookVerified`  
**Display**:
- Large number: Success rate % (e.g., "99.8%")
- Change indicator: 24h change (e.g., "-0.1pp" in green)
- Sparkline: 7-day trend
- Alert indicator: Red if < 95%, Yellow if < 99.5%

**Drill-Down**:
- Click → Webhook Analysis (by provider, error type)
- Click trend → Webhook Success History (30 days)

**Refresh**: Hourly

---

#### Widget 17: Reconciliation SLA Card
**KPI**: Reconciliation SLA Compliance  
**Data Source**: `FinancialLedgerEntry` reconciliation status  
**Display**:
- Large number: SLA compliance % (e.g., "99.2%")
- Secondary: Unreconciled count (e.g., "12 entries")
- Sparkline: 30-day trend
- Alert indicator: Red if < 95%, Yellow if < 99%

**Drill-Down**:
- Click → Reconciliation Dashboard (aging distribution, job history)
- Click trend → Reconciliation SLA History (90 days)

**Refresh**: Daily at 6:00 AM

---

#### Widget 18: Active Subscriptions Card
**KPI**: Active Subscription Count  
**Data Source**: `Subscription` WHERE `status` IN ('ACTIVE', 'GRACE_PERIOD')  
**Display**:
- Large number: Active count (e.g., "5,240")
- Change indicator: MoM % (e.g., "+2.5%" in green)
- Sparkline: 12-month trend

**Drill-Down**:
- Click → Subscription Breakdown (by plan tier, status)
- Click trend → Subscription Growth History (24 months)

**Refresh**: Daily at 6:00 AM

---

#### Widget 19: Branch Leaderboard
**KPI**: Branch Health Score Rankings  
**Data Source**: `BranchHealthScoreService.getBranchRankings()`  
**Display**:
- Table: Top 3 branches (name, score, trend)
- Table: Bottom 3 branches (name, score, trend)
- Color coding: Green (EXCELLENT), Blue (HEALTHY), Yellow (AT_RISK), Red (CRITICAL)

**Drill-Down**:
- Click branch → Branch Dashboard (full scorecard)
- Click "View All" → Full Branch Leaderboard (all branches)

**Refresh**: Weekly

---

### Permissions

**CEO**: Full access (all widgets, all drill-downs)  
**Board Members**: Read-only (no drill-downs to customer-level data)  
**Investors**: Limited (MRR, ARR, GMV, Growth Rate only)

---

### Mobile Responsiveness

**Layout Adaptation**:
- Desktop (> 1200px): 3-column layout
- Tablet (768-1200px): 2-column layout
- Mobile (< 768px): Single-column, collapsible sections

**Widget Priority** (Mobile):
1. MRR, ARR, GMV (always visible)
2. Alerts (expandable)
3. Customer Health Distribution (expandable)
4. Branch Leaderboard (expandable)
5. Other widgets (scroll to view)

---

## 2. CFO Dashboard

### Purpose
Financial accuracy, cash flow, and revenue operations monitoring

### Audience
- CFO
- Finance team
- Accounting team

### Refresh Cadence
- **Real-time**: Reconciliation status
- **Hourly**: Settlement tracking
- **Daily**: Revenue, subscriptions, refunds
- **Monthly**: MRR, ARR, churn, financial close

---

### Layout (Single Screen, 3 Sections)

```
┌─────────────────────────────────────────────────────────────┐
│ HEADER: ImboniServe CFO Dashboard | Last Updated: [time]   │
│ Alerts: [Reconciliation] [Settlement] [Refunds]            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ SECTION 1: REVENUE METRICS (40% height)                    │
├─────────────────────────────────────────────────────────────┤
│ [MRR Card] [ARR Card] [GMV Card] [Growth Rate Card]        │
│ [Revenue Composition Chart - New/Expansion/Contraction]    │
│ [Revenue Concentration Card]                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ SECTION 2: SUBSCRIPTION METRICS (30% height)               │
├─────────────────────────────────────────────────────────────┤
│ [Active Subscriptions] [New Subscriptions] [Churn Rate]    │
│ [Expansion MRR] [Contraction MRR] [Grace Period Aging]     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ SECTION 3: CASH FLOW & RECONCILIATION (30% height)         │
├─────────────────────────────────────────────────────────────┤
│ [Reconciliation SLA] [Unreconciled Count] [Aging Chart]    │
│ [Settlement Time] [Refund Rate] [Payment Success]          │
└─────────────────────────────────────────────────────────────┘
```

---

### Widgets Specification

#### Widget 1-4: MRR, ARR, GMV, Growth Rate Cards
**Same as CEO Dashboard** (see above)

---

#### Widget 5: Revenue Composition Chart
**KPI**: Revenue Breakdown (New, Expansion, Contraction, Churn)  
**Data Source**: `FinancialLedgerEntry` + `Subscription` status transitions  
**Display**:
- Waterfall chart: Starting MRR → New → Expansion → Contraction → Churn → Ending MRR
- Color coding: Green (New, Expansion), Red (Contraction, Churn)
- Net change indicator: MoM MRR change

**Drill-Down**:
- Click segment → Customer list in that category
- Click trend → Revenue Composition History (12 months)

**Refresh**: Monthly

---

#### Widget 6: Revenue Concentration Card
**KPI**: Top 10 Customer Revenue Concentration  
**Data Source**: `FinancialLedgerEntry` aggregated by customer  
**Display**:
- Large number: Top 10 % of total revenue (e.g., "35%")
- Alert indicator: Red if > 50%, Yellow if > 40%
- Secondary: Top customer revenue (e.g., "RWF 2.5M")

**Drill-Down**:
- Click → Top Customer List (sortable by revenue, LTV)
- Click trend → Concentration History (12 months)

**Refresh**: Monthly

---

#### Widget 7: Active Subscriptions Card
**Same as CEO Dashboard** (see above)

---

#### Widget 8: New Subscriptions Card
**KPI**: New Subscription Count  
**Data Source**: `Subscription` WHERE `createdAt` IN current_month  
**Display**:
- Large number: New count (e.g., "245")
- Change indicator: MoM % (e.g., "+12%" in green)
- Sparkline: 12-month trend

**Drill-Down**:
- Click → New Subscription Breakdown (by plan tier, channel)
- Click trend → New Subscription History (24 months)

**Refresh**: Daily at 6:00 AM

---

#### Widget 9: Subscription Churn Rate Card
**KPI**: Subscription Churn Rate  
**Data Source**: `Subscription` status transitions  
**Display**:
- Large number: Churn % (e.g., "3.5%")
- Change indicator: MoM change (e.g., "+0.8pp" in yellow)
- Sparkline: 12-month trend
- Alert indicator: Red if > 10%, Yellow if > 5%

**Drill-Down**:
- Click → Churn Analysis (by plan tier, tenure, reason)
- Click trend → Churn History (24 months)

**Refresh**: Monthly

---

#### Widget 10: Expansion MRR Card
**KPI**: Expansion MRR (from upgrades)  
**Data Source**: `Subscription` plan change events, `FinancialLedgerEntry`  
**Display**:
- Large number: Expansion MRR (e.g., "RWF 250k")
- Change indicator: MoM % (e.g., "+15%" in green)
- Sparkline: 12-month trend

**Drill-Down**:
- Click → Expansion Analysis (by plan tier, customer segment)
- Click trend → Expansion History (24 months)

**Refresh**: Monthly

---

#### Widget 11: Contraction MRR Card
**KPI**: Contraction MRR (from downgrades)  
**Data Source**: `Subscription` plan change events, `FinancialLedgerEntry`  
**Display**:
- Large number: Contraction MRR (e.g., "RWF 80k")
- Change indicator: MoM % (e.g., "-5%" in green)
- Sparkline: 12-month trend
- Alert indicator: Yellow if increase > 20%

**Drill-Down**:
- Click → Contraction Analysis (by plan tier, reason)
- Click trend → Contraction History (24 months)

**Refresh**: Monthly

---

#### Widget 12: Grace Period Aging Chart
**KPI**: Grace Period Aging Distribution  
**Data Source**: `Subscription` WHERE `status = 'GRACE_PERIOD'`  
**Display**:
- Bar chart: Count by days in grace (0-3d, 4-7d, 8-14d, 15+d)
- Color coding: Yellow (0-7d), Orange (8-14d), Red (15+d)
- Total: Total subscriptions in grace

**Drill-Down**:
- Click bar → Subscription list in that aging bucket
- Click trend → Grace Aging History (30 days)

**Refresh**: Daily at 6:00 AM

---

#### Widget 13: Reconciliation SLA Card
**Same as CEO Dashboard** (see above)

---

#### Widget 14: Unreconciled Count Card
**KPI**: Unreconciled Entry Count  
**Data Source**: `FinancialLedgerEntry` WHERE reconciliation pending  
**Display**:
- Large number: Unreconciled count (e.g., "12")
- Alert indicator: Red if > 50, Yellow if > 10
- Secondary: Oldest age (e.g., "18 hours")

**Drill-Down**:
- Click → Unreconciled Entry List (sortable by age, amount)
- Click trend → Unreconciled Count History (30 days)

**Refresh**: Hourly

---

#### Widget 15: Reconciliation Aging Chart
**KPI**: Unreconciled Entry Aging Distribution  
**Data Source**: `FinancialLedgerEntry` WHERE reconciliation pending  
**Display**:
- Bar chart: Count by age (0-6h, 6-12h, 12-24h, 24-48h, 48h+)
- Color coding: Green (0-12h), Yellow (12-24h), Orange (24-48h), Red (48h+)
- SLA line: 24-hour SLA threshold

**Drill-Down**:
- Click bar → Entry list in that aging bucket
- Click trend → Aging Distribution History (30 days)

**Refresh**: Hourly

---

#### Widget 16: Settlement Time Card
**KPI**: Median Settlement Time  
**Data Source**: `PaymentTransaction` (settlementDate - paidAt)  
**Display**:
- Large number: Median days (e.g., "2.5 days")
- Change indicator: 7d change (e.g., "+0.3 days" in yellow)
- Breakdown: By provider (MTN: 2d, AIRTEL: 3d)
- Alert indicator: Yellow if > SLA + 1 day

**Drill-Down**:
- Click → Settlement Analysis (by provider, amount)
- Click trend → Settlement Time History (90 days)

**Refresh**: Daily at 6:00 AM

---

#### Widget 17: Refund Rate Card
**KPI**: Refund Rate  
**Data Source**: `PaymentTransaction` WHERE `status = 'REFUNDED'`  
**Display**:
- Large number: Refund rate % (e.g., "1.2%")
- Change indicator: MoM change (e.g., "+0.3pp" in yellow)
- Secondary: Total refunded amount (e.g., "RWF 500k")
- Alert indicator: Red if > 5%, Yellow if > 2%

**Drill-Down**:
- Click → Refund Analysis (by reason, customer)
- Click trend → Refund Rate History (12 months)

**Refresh**: Daily at 6:00 AM

---

#### Widget 18: Payment Success Card
**Same as CEO Dashboard** (see above)

---

### Permissions

**CFO**: Full access (all widgets, all drill-downs)  
**Finance Team**: Full access (all widgets, limited drill-downs)  
**Accounting Team**: Limited (reconciliation, settlement, refunds only)

---

## 3. COO Dashboard

### Purpose
Operational health, branch performance, and hospitality metrics monitoring

### Audience
- COO
- Operations team
- Branch managers

### Refresh Cadence
- **Real-time**: Payment success, queue health, alerts
- **Hourly**: Payment metrics, provider health
- **Daily**: Branch performance, hospitality metrics
- **Weekly**: Branch rankings, operational trends

---

### Layout (Single Screen, 3 Sections)

```
┌─────────────────────────────────────────────────────────────┐
│ HEADER: ImboniServe COO Dashboard | Last Updated: [time]   │
│ Alerts: [2 CRITICAL] [5 ERROR] [12 WARN]                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ SECTION 1: OPERATIONAL HEALTH (40% height)                 │
├─────────────────────────────────────────────────────────────┤
│ [Payment Success] [Provider Health] [Webhook Success]      │
│ [Queue Health] [Reconciliation SLA] [Cron Job Success]     │
│ [Active Alerts Panel]                                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ SECTION 2: BRANCH PERFORMANCE (30% height)                 │
├─────────────────────────────────────────────────────────────┤
│ [Branch Leaderboard - Full List]                          │
│ [At-Risk Branches Panel]                                   │
│ [Branch Health Distribution Chart]                         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ SECTION 3: HOSPITALITY METRICS (30% height)                │
├─────────────────────────────────────────────────────────────┤
│ [Occupancy Rate] [ADR] [RevPAR] [AOV]                     │
│ [Repeat Customer Rate] [Table Turnover]                    │
└─────────────────────────────────────────────────────────────┘
```

---

### Widgets Specification

#### Widget 1-3: Payment Success, Provider Health, Webhook Success Cards
**Same as CEO Dashboard** (see above)

---

#### Widget 4: Queue Health Card
**KPI**: Queue Backlog and DLQ Status  
**Data Source**: BullMQ queue metrics  
**Display**:
- Backlog count: Extract queue (e.g., "25"), Intelligence queue (e.g., "12")
- DLQ count: Extract DLQ (e.g., "0"), Intelligence DLQ (e.g., "2")
- Status indicator: Green (DLQ = 0), Yellow (DLQ 1-3), Red (DLQ > 3)

**Drill-Down**:
- Click queue → Queue Dashboard (backlog trend, job history)
- Click DLQ → DLQ Job List (error details, retry options)

**Refresh**: Real-time (every 5 minutes)

---

#### Widget 5: Reconciliation SLA Card
**Same as CEO Dashboard** (see above)

---

#### Widget 6: Cron Job Success Card
**KPI**: Cron Job Success Rate (last 24h)  
**Data Source**: Cron job logs  
**Display**:
- Large number: Success rate % (e.g., "100%")
- Failed jobs: List of failed jobs (if any)
- Alert indicator: Yellow if any failure

**Drill-Down**:
- Click → Cron Job Dashboard (all jobs, history, logs)
- Click failed job → Job detail (error, logs, retry)

**Refresh**: Hourly

---

#### Widget 7: Active Alerts Panel
**KPI**: Active Alerts by Severity  
**Data Source**: Alert delivery logs  
**Display**:
- Count by severity: CRITICAL (e.g., "2"), ERROR (e.g., "5"), WARN (e.g., "12")
- Recent alerts: Last 5 alerts (time, severity, message)
- Color coding: Red (CRITICAL), Orange (ERROR), Yellow (WARN)

**Drill-Down**:
- Click severity → Alert list (all alerts in that severity)
- Click alert → Alert detail (context, recommended actions)

**Refresh**: Real-time (every 5 minutes)

---

#### Widget 8: Branch Leaderboard (Full List)
**KPI**: Branch Health Score Rankings  
**Data Source**: `BranchHealthScoreService.getBranchRankings()`  
**Display**:
- Table: All branches (name, score, rank, trend)
- Sortable: By score, revenue, customer health, growth
- Color coding: Green (EXCELLENT), Blue (HEALTHY), Yellow (AT_RISK), Red (CRITICAL)

**Drill-Down**:
- Click branch → Branch Dashboard (full scorecard)
- Click column header → Sort by that metric

**Refresh**: Weekly

---

#### Widget 9: At-Risk Branches Panel
**KPI**: Branches with Health Score < 70  
**Data Source**: `BranchHealthScoreService.getBranchRankings()` filtered  
**Display**:
- List: Branch name, score, primary issue (e.g., "Low revenue", "High churn")
- Alert indicator: Red if score < 50, Yellow if score < 70
- Action button: "View Details" → Branch Dashboard

**Drill-Down**:
- Click branch → Branch Dashboard (full scorecard)
- Click "View All" → Full Branch Leaderboard

**Refresh**: Weekly

---

#### Widget 10: Branch Health Distribution Chart
**KPI**: Branch Health Score Distribution  
**Data Source**: `BranchHealthScoreService.getBranchRankings()`  
**Display**:
- Bar chart: Count by category (EXCELLENT, HEALTHY, AT_RISK, CRITICAL)
- Color coding: Green, Blue, Yellow, Red
- Percentage: % in each category

**Drill-Down**:
- Click bar → Branch list in that category
- Click trend → Distribution History (12 weeks)

**Refresh**: Weekly

---

#### Widget 11-16: Hospitality Metrics (Occupancy, ADR, RevPAR, AOV, Repeat Rate, Turnover)
**Status**: ⚠️ **NOT IMPLEMENTED** (Phase 1.25 scope)

**Placeholder Display**:
- Card: "Coming Soon - Phase 1.25"
- Description: Brief explanation of metric
- Expected date: "Q3 2026"

---

### Permissions

**COO**: Full access (all widgets, all drill-downs)  
**Operations Team**: Full access (all widgets, limited drill-downs)  
**Branch Managers**: Limited (own branch only, no other branches)

---

## 4. Operations Dashboard

### Purpose
Real-time operational monitoring and incident response

### Audience
- Operations team
- On-call engineers
- DevOps team

### Refresh Cadence
- **Real-time**: All metrics (5-minute refresh)
- **No daily/monthly aggregations** (real-time focus)

---

### Layout (Single Screen, 4 Sections)

```
┌─────────────────────────────────────────────────────────────┐
│ HEADER: ImboniServe Operations Dashboard | [LIVE]          │
│ Alerts: [2 CRITICAL] [5 ERROR] [12 WARN] | [Incident Mode] │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ SECTION 1: SYSTEM HEALTH (30% height)                      │
├─────────────────────────────────────────────────────────────┤
│ [Payment Success] [Provider Health] [Webhook Success]      │
│ [Payment Latency p95] [Queue Health] [Cron Job Success]    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ SECTION 2: FINANCIAL OPERATIONS (25% height)               │
├─────────────────────────────────────────────────────────────┤
│ [Reconciliation SLA] [Unreconciled Count] [Settlement Time] │
│ [Refund Rate] [Payment Success Rate]                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ SECTION 3: ALERTS & INCIDENTS (25% height)                 │
├─────────────────────────────────────────────────────────────┤
│ [Active Alerts Panel - Expanded]                           │
│ [Recent Incidents - Last 5 with MTTR]                      │
│ [Provider Status Indicators]                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ SECTION 4: QUEUE & BACKGROUND JOBS (20% height)            │
├─────────────────────────────────────────────────────────────┤
│ [Extract Queue Status] [Intelligence Queue Status]         │
│ [DLQ Status] [Worker Health] [Job Failure Rate]            │
└─────────────────────────────────────────────────────────────┘
```

---

### Widgets Specification

#### All Widgets: Real-Time Focus
- **Refresh**: Every 5 minutes (real-time)
- **Time Windows**: 1h, 6h, 24h (no monthly/yearly)
- **Drill-Down**: Immediate action (retry, escalate, investigate)

---

### Permissions

**Operations Team**: Full access (all widgets, all actions)  
**On-Call Engineers**: Full access (all widgets, all actions)  
**DevOps Team**: Full access (all widgets, all actions)  
**Other Roles**: Read-only (no actions)

---

## 5. Cross-Dashboard Features

### Global Navigation
- Dashboard switcher: CEO | CFO | COO | Operations
- Role-based: Only show dashboards user has access to
- Breadcrumb: Current dashboard > Current drill-down

### Global Search
- Search by: Customer name, Branch name, Transaction ID, Alert ID
- Quick jump: To customer detail, branch detail, transaction detail

### Global Filters
- Date range: Last 7d, Last 30d, Last 90d, Custom
- Branch filter: All branches, Specific branch, Branch group
- Domain filter: All domains, Hotel, Restaurant, Marketplace

### Global Alerts
- Alert bell icon: Shows unread alert count
- Click → Alert panel (all alerts, filterable by severity)
- Dismiss action: Mark alert as read

### Export Functionality
- Export to CSV: Any table or chart
- Export to PDF: Full dashboard or specific section
- Schedule export: Daily/weekly email with dashboard snapshot

---

## 6. Technical Architecture

### Frontend Stack
- **Framework**: Next.js (React)
- **UI Library**: shadcn/ui (Radix UI + Tailwind CSS)
- **Charts**: Recharts or Chart.js
- **State Management**: React Query (server state) + Zustand (client state)
- **Real-Time**: WebSocket or Server-Sent Events (SSE)

### Backend Stack
- **API**: Next.js API routes
- **Services**: Existing intelligence services (CustomerHealthScoreService, BranchHealthScoreService, ExecutiveSummaryService)
- **Caching**: Redis (dashboard data cache, 5-minute TTL)
- **Database**: Prisma + PostgreSQL

### Data Flow
```
User → Dashboard UI → API Route → Service Layer → Prisma → Database
                                 ↓
                              Redis Cache (5-min TTL)
```

### Performance Targets
- **Initial Load**: < 2 seconds
- **Refresh**: < 500ms (cached data)
- **Drill-Down**: < 1 second
- **Real-Time Update**: < 5 seconds (WebSocket)

---

## 7. Implementation Phases

### Phase 1.2B: CEO Dashboard (Week 1-2)
- Implement all CEO Dashboard widgets
- Test with sample data
- Deploy to staging

### Phase 1.2C: CFO Dashboard (Week 3)
- Implement all CFO Dashboard widgets
- Integrate with reconciliation services
- Deploy to staging

### Phase 1.2D: COO Dashboard (Week 4)
- Implement all COO Dashboard widgets (excluding hospitality metrics)
- Integrate with branch health services
- Deploy to staging

### Phase 1.2E: Operations Dashboard (Week 5)
- Implement all Operations Dashboard widgets
- Add real-time WebSocket updates
- Deploy to staging

### Phase 1.2F: Production Deployment (Week 6)
- User acceptance testing (UAT)
- Performance testing
- Production deployment
- User training

---

## 8. Success Metrics

### Adoption Metrics
- **Daily Active Users**: > 80% of target audience
- **Session Duration**: > 5 minutes (engaged usage)
- **Drill-Down Rate**: > 30% (users exploring data)

### Performance Metrics
- **Load Time**: < 2 seconds (p95)
- **Refresh Time**: < 500ms (p95)
- **Uptime**: > 99.9%

### Business Impact Metrics
- **MTTR Reduction**: 30% reduction in mean time to resolution
- **Decision Speed**: 50% faster executive decision-making
- **Alert Actionability**: > 80% of alerts result in action

---

## 9. Risks & Mitigations

### Risk 1: Data Freshness
**Risk**: Stale data reduces dashboard value  
**Mitigation**: Redis caching with 5-minute TTL, real-time WebSocket for critical metrics

### Risk 2: Performance Degradation
**Risk**: Complex queries slow down dashboard  
**Mitigation**: Pre-aggregated tables, indexed queries, caching strategy

### Risk 3: Alert Fatigue
**Risk**: Too many alerts reduce dashboard usability  
**Mitigation**: Alert filtering, severity-based routing, alert snooze functionality

### Risk 4: Mobile Usability
**Risk**: Dashboards not usable on mobile  
**Mitigation**: Mobile-responsive design, progressive disclosure, touch-friendly UI

---

## 10. Next Steps

1. ✅ **Validate architecture** with stakeholders (CEO, CFO, COO)
2. ✅ **Prioritize widgets** based on business value
3. ✅ **Create detailed wireframes** for each dashboard
4. ✅ **Estimate implementation effort** (6 weeks)
5. ✅ **Proceed to Phase 1.2B** (CEO Dashboard implementation)

**Status**: Architecture complete, ready for implementation planning
