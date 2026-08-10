# EOS-001C — CFO Operating Center User Guide

## Overview

The CFO Operating Center is your financial command center. It is not a dashboard — it is your daily operating environment for monitoring, explaining, reconciling, forecasting, and acting on financial events.

**Access:** Navigate to **CFO Command Center** in the admin sidebar.  
**Roles:** CFO, ADMIN, FINANCE, EXECUTIVE  
**URL:** `/admin/executive/cfo`

---

## The 10 Sections

### 1. Financial Focus Card
**Purpose:** Understand your financial position in 30 seconds.

- **Greeting** — Time-aware greeting (Good morning/afternoon/evening)
- **Revenue Yesterday** — Yesterday's GMV with trend indicator
- **Collections (30d)** — Total collected in last 30 days
- **Outstanding Liabilities** — Total commission liability in RWF
- **Integrity Score** — 0-100 confidence score (green ≥80, amber ≥50, red <50)
- **Critical Alerts** — Top urgent financial items requiring attention
- **AI Summary** — Plain-English financial position summary

**Drill-down:** Click any alert to navigate to the relevant operational workspace.

### 2. Financial Daily Brief
**Purpose:** Get a structured briefing for your day.

- **Yesterday** — Revenue, MRR, change percentage
- **Today** — Pending payouts, failed payments, payment health
- **Collections** — Collected amount, failed impact, refunds
- **Forecast** — Expected MRR, growth rate, confidence
- **Outstanding Liabilities** — Commission, payouts, refunds
- **Cash Outlook** — Narrative assessment of cash position
- **Pending Approvals** — Payouts and commissions awaiting action
- **Risks** — Top financial risks from the priority engine
- **Recommendations** — Growth opportunities and optimization actions

**Interaction:** Click the header to collapse/expand.

### 3. Financial Integrity Center
**Purpose:** Answer "Can I trust these numbers?"

- **Confidence Score** — Overall financial integrity (0-100)
- **Reconciliation** — Reconciliation rate with entry counts
- **Payment System** — Payment system health status
- **Data Quality** — Data quality score based on reconciled entries

**Drill-down:** Click any row to navigate to the relevant operational workspace (Reconciliation, Operations Intelligence, Revenue Operations).

### 4. Revenue Overview
**Purpose:** Understand revenue composition and trends.

- **MRR** — Monthly Recurring Revenue with trend
- **ARR** — Annual Recurring Revenue with trend
- **GMV (30d)** — Gross Merchandise Value with trend
- **Growth Rate** — 30-day growth rate with status
- **Revenue by Source** — Subscription, Marketplace, Direct Sales breakdown
- **Forecast Variance** — 30d vs 90d growth rate comparison
- **MRR Trend** — 6-month sparkline

**Drill-down:** Click any KPI or "View Revenue Operations" to investigate.

### 5. Cash & Collections
**Purpose:** Monitor cash flow and collection health.

- **Collected (30d)** — Total collected revenue
- **Expected Inflow** — MRR-based expected inflow
- **Failed Payments** — Count with severity indicator
- **Pending Payouts** — Count awaiting approval
- **Failed Payment Impact** — Revenue impact in RWF
- **Refund Alerts** — Refund amount and count

**Drill-down:** Click "View Revenue Operations" for transaction-level detail.

### 6. Liability Center
**Purpose:** Track all outstanding financial obligations.

- **Commission Liability** — Total outstanding commission in RWF
- **Pending Commissions** — Count of pending commission entries
- **Pending Payouts** — Count of payouts awaiting processing
- **Refund Obligations** — Total refund amount outstanding
- **Largest Liabilities** — Top 5 partners by outstanding amount
- **Aging Buckets** — 0-30d, 31-60d, 61-90d, 90d+ breakdown

**Drill-down:** Click "View Payout Operations" for payout management.

### 7. Forecast Center
**Purpose:** Plan ahead with deterministic forecasts.

- **Expected MRR** — Next month MRR projection
- **Expected ARR** — Projected ARR
- **Growth Rate (30d/90d)** — Current growth rates with status
- **MRR Trend** — 6-month sparkline
- **Scenario Comparison** — Conservative (-10%), Base Case, Optimistic (+10%)
- **Forecast Confidence** — 0-100 confidence based on data volume and trend history

**Drill-down:** Click "View Revenue Intelligence" for detailed analysis.

### 8. Revenue Quality Center
**Purpose:** Assess revenue sustainability and diversification.

- **Revenue Mix** — Subscription, Marketplace, Direct Sales distribution
- **Concentration Risk** — Top 10 customer revenue percentage with status
- **Revenue Drivers** — New customer, expansion, churned, contraction
- **Top Contributors** — Top 5 customers with revenue and growth
- **Segment Distribution** — Top 10%, Middle 40%, Bottom 50% breakdown

**Drill-down:** Click "View Revenue Intelligence" for detailed analysis.

### 9. Financial Attention Center
**Purpose:** See only actionable items requiring your attention.

Items are sorted by severity:
- **CRITICAL** — Immediate action required (revenue risk, system failure)
- **HIGH** — Action required this week (pending approvals, concentration)
- **MEDIUM** — Monitor closely (refund patterns, subscription health)
- **LOW** — Opportunity (growth signals)

**Drill-down:** Click any item to navigate to the relevant operational workspace.

### 10. AI Financial Assistant
**Purpose:** Get evidence-based financial recommendations.

Each recommendation includes:
- **Question** — What financial question is being answered
- **Answer** — Plain-English conclusion
- **Evidence** — Supporting metrics and data points
- **Confidence** — 0-100 confidence score
- **Suggested Actions** — Clickable actions linking to operational workspaces

**Important:** All recommendations are deterministic and evidence-based. No conclusions are fabricated.

---

## Drill-down Navigation Map

| Metric | Drill-down Destination |
|--------|----------------------|
| Revenue | Revenue Operations (`/admin/revenue-operations`) |
| MRR/ARR | Revenue Analytics (`/admin/revenue-analytics`) |
| Commissions | Payout Control (`/admin/payout-control`) |
| Payouts | Payout Control (`/admin/payout-control`) |
| Payment Failures | Operations Intelligence (`/admin/operations-intelligence`) |
| Reconciliation | Reconciliation (`/admin/reconciliation`) |
| Subscriptions | Subscriptions (`/admin/subscriptions`) |
| Refunds | Revenue Operations (`/admin/revenue-operations`) |

---

## Tips

1. **Start at the top** — The Financial Focus Card gives you the 30-second overview.
2. **Check integrity first** — If the integrity score is low, investigate before relying on numbers.
3. **Action before analysis** — The Financial Attention Center shows only actionable items. Start there.
4. **Trust the evidence** — Every AI recommendation includes evidence. Review it before acting.
5. **Use drill-down** — Nothing ends at a number. Click through to investigate.
