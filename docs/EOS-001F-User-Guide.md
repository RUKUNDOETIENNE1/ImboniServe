# EOS-001F — Partnership Director Operating Center User Guide

## Overview

The Partnership Director Operating Center is the Partnership Director's daily command center for managing the complete lifecycle of strategic partners and growing the ImboniServe partnership ecosystem. It is accessible at `/admin/executive/partnership-director` and requires the PARTNERSHIP_DIRECTOR, ADMIN, PARTNERSHIP_MANAGER, or EXECUTIVE role.

This is not a CRM. This is not a partnership dashboard. It is the executive operating environment from which the Partnership Director manages partner discovery, applications, reviews, approvals, agreements, onboarding, activation, campaigns, founder codes, performance, commissions, payouts, relationship health, renewals, and expansion.

Every section answers one question: "How healthy is our partnership ecosystem, and what should I do today to grow it?"

---

## Getting Started

1. Navigate to **Partnership Command Center** in the admin sidebar
2. The page loads automatically with current partnership intelligence
3. Click **Refresh** to update data at any time

---

## Sections

### 1. Partnership Pulse
Your signature overview. Shows:
- **Partnership Health Score** (0-100) — composite of active ratio, suspension rate, campaign activity, agreement stability, and partner health grades
- **Total Partners** — all partnerships in the ecosystem
- **Active Partners** — currently active partnerships with % of total
- **New Applications** — submitted + under review applications
- **Pending Approvals** — applications awaiting your decision
- **Active Campaigns** — campaigns currently driving acquisition
- **Active Founder Codes** — codes available for redemption
- **Relationship Health** — HEALTHY / WARNING / CRITICAL
- **Ecosystem Score** — composite score with explanation
- **Today's Summary** — narrative overview of ecosystem state

Click any KPI card to drill into the relevant workspace.

### 2. Partnership Daily Brief
Your morning briefing with:
- **Yesterday** — active partners, new businesses (7d), active campaigns
- **Today's Priorities** — pending applications, pending payouts, expiring agreements
- **New Applications** — submitted, under review, approved counts
- **Upcoming Renewals** — agreements expiring soon with dates
- **Campaign Highlights** — top campaigns with conversions and rates
- **Commission Highlights** — liability, paid (30d), pending payouts
- **Risks** — critical and high-severity attention items
- **Recommendations** — AI-suggested actions

Click the header to collapse/expand.

### 3. Partnership Pipeline
Visualize the complete partnership lifecycle:
- Prospect → Applied → Under Review → Approved → Onboarded → Agreements → Active → Campaigns → Suspended → Terminated
- **Bottleneck indicator** — highlights the stage with the highest count
- **SLA & Aging** — pending applications, under review, active agreements, active campaigns counts
- Click any stage to drill into the relevant workspace

### 4. Partner Portfolio
Display partners by:
- **By Partner Type** — table with partner count, signups, conversions, revenue per type
- **By Region** — cards showing partner count, signups, conversions per region
- **Partner Health** — health grades (A-F) with trend indicators (up/down/flat) and status badges
- Click any partner or region to drill into Founder Partners workspace

### 5. Agreement Center
Manage partnership agreements:
- **Active** — currently active agreements
- **Draft** — agreements in draft state
- **Pending Signature** — agreements sent for signature
- **Expired** — expired agreements
- **Terminated** — terminated agreements
- **Upcoming Expirations (30 days)** — agreements expiring with days-left countdown and critical 7-day flagging
- Click any agreement to drill into Founder Partners workspace

### 6. Campaign Intelligence
Track campaign performance:
- **Active Campaigns** — count of active campaigns
- **Total Signups** — sum across all campaigns
- **Avg Conversion** — average conversion rate
- **Total Revenue** — sum of campaign revenue
- **Top Campaigns** — list with signups, conversions, conversion rate per campaign
- **Founder Code Usage** — active, total, exhausted, expired code counts
- Click any campaign to drill into Founder Partners workspace

### 7. Partner Performance
Track partner performance:
- **Top Partners by Hospitality Business Acquisition** — ranked list with signups, conversions, revenue
- **Lifetime Value by Partner Type** — table with partner count, total revenue, avg/partner, commissions
- **Customer Acquisition Cost by Partner Type** — cards with CAC per conversion and conversion/signup counts
- Click any partner or type to drill into Founder Partners workspace

### 8. Commission & Payout Overview
Manage financial obligations:
- **Outstanding Liability** — total commission liability and commission count
- **Paid (All Time)** — total commissions paid
- **Paid (30d)** — payouts in last 30 days with count
- **Failed Payouts** — count of failed payouts (highlighted red if > 0)
- **Commission by Status** — breakdown by status (PENDING, VALIDATED, APPROVED, PAID, VOID, CLAWED_BACK)
- **Pending Payout Approval Queue** — payouts awaiting approval with amount and method
- **Recent Payouts** — recent paid/failed payouts with status badges
- Click any payout to drill into Payout Control workspace

### 9. Partnership Opportunities
Automatically identified growth opportunities:
- **PARTNER_TYPE_EXPANSION** — untapped partner types available
- **REGIONAL_EXPANSION** — underpenetrated regions with growth potential
- **CAMPAIGN_LAUNCH** — draft campaigns ready for launch
- **PIPELINE_CONVERSION** — prospects and applied partnerships in pipeline
- **TOP_PARTNER_EXPANSION** — top-performing partners ready for expanded terms
- Every opportunity includes a description, expected impact, and recommended action
- Click any opportunity to drill into the relevant workspace

### 10. Partnership Attention Center
Actionable items only — no informational cards:
- Sorted by severity (CRITICAL → HIGH → MEDIUM → LOW)
- Each item includes title, description, and specific action
- Sources: expiring agreements, suspended partners, low health (Grade D/F), high risk, pending payouts, failed payouts, inactive codes, paused campaigns
- Green status when no items need attention
- Click any item to drill into the relevant workspace

### 11. AI Partnership Assistant
Deterministic, rule-based recommendations:
- Each recommendation includes:
  - **Question** — what partnership decision to address
  - **Answer** — data-driven response
  - **Evidence** — supporting data points
  - **Confidence** — percentage confidence level (color-coded bar)
  - **Expected Impact** — anticipated outcome
  - **Suggested Actions** — specific actions to take
- Recommendations are never fabricated — all based on real data
- 6 recommendation types: ecosystem health, campaign performance, partner expansion, commission/payout health, partner health/risk, code utilization

---

## Drill-Down Navigation

Every KPI and metric links to an existing workspace:
- **Founder Partners** — `/admin/founder-partners`
- **Partnership Applications** — `/admin/partnership-applications`
- **Founder Codes** — `/admin/founder-codes`
- **Payout Control** — `/admin/payout-control`
- **Operations Intelligence** — `/admin/operations-intelligence`

No dead-end metrics.

---

## Tips

- Start with the **Partnership Pulse** to get a 30-second overview of ecosystem health
- Check **Partnership Attention Center** for urgent items requiring action
- Review **Partnership Opportunities** for growth actions you can take today
- Use **AI Partnership Assistant** for strategic partnership decisions
- Monitor **Agreement Center** for upcoming expirations and renewals
- Check **Commission & Payout Overview** for pending financial obligations
- Refresh data before making decisions
