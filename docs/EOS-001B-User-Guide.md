# EOS-001B — CEO Operating Center User Guide

## Overview

The CEO Operating Center is your daily command center. It is not a reporting dashboard — it is designed to help you make decisions quickly and calmly.

**Access**: Navigate to `/admin/executive/ceo` or click "CEO Command Center" in the admin sidebar.

**Who can access**: Users with roles CEO, ADMIN, or EXECUTIVE.

## Sections

### 1. CEO Focus Card
The first thing you see. Provides:
- **Greeting** with time-aware salutation
- **Yesterday summary** — One-line revenue and operations summary
- **Company health** — Overall health score out of 100
- **Top priorities** — Numbered list of the 3 most important items
- **Critical alerts** — Red-flagged items requiring immediate attention
- **AI recommendation** — One-sentence strategic suggestion

Click the header to collapse/expand.

### 2. Executive Daily Brief
Detailed breakdown of:
- **Yesterday** — Revenue, change %, new subscriptions, failed renewals
- **Today** — Pending applications, payouts, expiring agreements
- **Risks** — Items that could negatively impact the business
- **Opportunities** — Items worth investing in
- **Pending Approvals** — Applications and payouts awaiting your decision
- **Founder Activity** — Partner highlights
- **Restaurant Activity** — Business highlights
- **Financial Summary** — MRR and ARR snapshot
- **Strategic Recommendation** — One actionable suggestion

### 3. Company Health Overview
Seven domain scores (0-100) plus an overall score:
- **Growth** — Revenue trend + customer net change + growth rate status
- **Revenue** — MRR status + NRR + churn
- **Operations** — Payment, queue, and reconciliation health
- **Founder Ecosystem** — Active partners, suspended, high-risk
- **Restaurant Ecosystem** — Active businesses, failed renewals
- **Customer Success** — At-risk customers, subscription health
- **Financial Health** — MRR, churn, NRR combined

Each score includes an explanation of what drives it. Scores ≥70 are HEALTHY (green), 40-69 WARNING (amber), <40 CRITICAL (red).

### 4. Strategic KPI Center
Four key metrics with trend indicators and drill-down:
- **MRR Growth** → links to Revenue Analytics
- **Active Businesses** → links to Restaurants
- **Active Partners** → links to Founder Partners
- **Revenue (30d)** → links to Revenue Operations

### 5. Growth Snapshot
- **Revenue Growth %** — Week-over-week with trend icon
- **Net New Customers** — New vs churned
- **Subscription Churn** — Rate with new/cancelled counts
- **Regional Performance** — Top regions by partner count and revenue

### 6. Revenue Snapshot
- **MRR** — Monthly recurring revenue with change %
- **ARR** — Annual recurring revenue with change %
- **GMV (30d)** — Gross merchandise value
- **Outstanding Liability** — Pending commission payouts
- **Revenue Churn** — Rate and status
- **Net Revenue Retention** — Rate and status
- **Growth Rate (30d)** — Revenue growth rate
- **MRR Trend Sparkline** — 6-month visual trend

### 7. Founder Ecosystem
- **Active Partners** count → links to Founder Partners
- **Pending Applications** → links to Applications
- **Commission Liability** → links to Payout Control
- **Top Founder Partners** — Ranked by revenue
- **Top Campaigns** — Ranked by conversions
- **Expiring Agreements** — Within 30 days, with review links

### 8. Restaurant Ecosystem
- **Active Businesses** → links to Restaurants
- **New Subscriptions** → links to Subscriptions
- **At-Risk Customers** — Percentage of customers in at-risk/critical state
- **Branch Performance** — Top and bottom performers with health scores
- **Customer Health Distribution** — Visual bar showing Excellent/Healthy/At Risk/Critical breakdown
- **Failed Renewals** — Warning if >0 in last 24 hours

### 9. Attention Center
A single prioritized list of **only actionable items**. Sorted by severity:
- **CRITICAL** (red) — Escalate immediately
- **HIGH** (orange) — Review today
- **MEDIUM** (amber) — Review this week
- **LOW** (blue) — Monitor

Each item has a description and an action link to the relevant workspace.

If empty: "No items requiring attention. All systems operational."

### 10. AI Executive Assistant
Deterministic, evidence-based recommendations. Each recommendation includes:
- **Question** — What it answers (e.g., "What changed overnight?")
- **Answer** — Concise response
- **Evidence** — Supporting data points
- **Confidence** — Percentage with color-coded bar (green ≥75%, amber 50-74%, red <50%)
- **Suggested Actions** — Concrete next steps

**Important**: Recommendations are rule-based, not fabricated. Every conclusion is backed by verifiable data.

## Drill-Down Navigation

Every metric that can be investigated links to its operational source:

| Metric | Links To |
|--------|----------|
| Revenue / MRR / ARR | `/admin/revenue-analytics` |
| GMV | `/admin/revenue-operations` |
| Active Businesses | `/admin/restaurants` |
| Active Partners | `/admin/founder-partners` |
| Applications | `/admin/partnership-applications` |
| Payouts | `/admin/payout-control` |
| Subscriptions | `/admin/subscriptions` |
| Operations alerts | `/admin/operations-intelligence` |

## Tips

- **Start at the top**: The Focus Card gives you the 30-second overview. Only scroll down if you need detail.
- **Use the Attention Center** for your daily action list. Items are already sorted by priority.
- **Click any KPI** to drill into the operational workspace for investigation.
- **Collapse sections** you don't need daily (Focus Card, Daily Brief) to reduce visual load.
- **Check the AI Assistant** for strategic recommendations, but always review the evidence before acting.
