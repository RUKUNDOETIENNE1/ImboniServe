# EOS-001H User Guide — Executive Intelligence Engine

## Overview

The Executive Intelligence Engine is a unified decision intelligence layer that synthesizes insights from all 6 Executive Operating Centers (CEO, CFO, COO, CMO, Partnership Director, Customer Success Director) into actionable cross-center decisions.

**This is not a dashboard.** It is a reasoning engine that answers the question: "What should the executive team focus on right now, and why?"

---

## Access

- **URL**: `/admin/executive/executive-intelligence`
- **Navigation**: Sidebar → "Executive Intelligence" (Brain icon)
- **Permissions**: CEO, ADMIN, or EXECUTIVE role required

---

## Sections

### 1. Intelligence Pulse
The top-level summary showing:
- **Overall Company Health Score** (0-100, color-coded: green/amber/red)
- **Top Decision** — The most important cross-center decision right now
- **KPI Summary**: Critical items, High priority items, Total risks, Total opportunities

### 2. Center Health Radar
Visual representation of each executive center's health:
- Score bar (visual percentage)
- Status badge (HEALTHY/WARNING/CRITICAL)
- **Drill-down**: Click "Drill down" on any center to navigate to that center's full Operating Center

### 3. Executive Decisions
AI-synthesized decisions that combine evidence from multiple centers:
- **Priority badge** (CRITICAL/HIGH/MEDIUM/LOW)
- **Decision statement** — What to do
- **Center pills** — Which centers contributed evidence
- **Reasoning** — Why this decision was made
- **Confidence bar** — How confident the system is (based on data completeness)
- **Expected Impact** — What will happen if you act
- **Suggested Actions** — Concrete next steps
- **Expandable Evidence** — Click "Show Evidence" to see the raw data from each center

### 4. Priority Queue
A sorted list of items requiring attention, ranked by severity:
- Each item shows which center owns it
- Click the action button to navigate to the relevant operational workspace
- Items are automatically sorted: CRITICAL → HIGH → MEDIUM → LOW

### 5. Trend Explanations
Cross-center explanations for key business trends:
- **Revenue** — Why revenue is up/down/stable (evidence from CFO + CMO + Customer Success)
- **Customer Acquisition** — New business and customer trends
- **Retention** — Churn and retention drivers
- **Platform Adoption** — Usage and feature adoption trends

### 6. Business Risks
Identified risks across the business with:
- Severity rating
- Multi-center evidence
- Specific mitigation actions you can take

### 7. Growth Opportunities
Evidence-based opportunities for growth:
- Expected impact estimates
- Evidence from relevant centers
- Suggested actions to capitalize on each opportunity

### 8. Executive Key Metrics
A 12-card KPI grid showing the most important metrics across all domains:
- Active Businesses, New Businesses, Active Subscriptions
- Retention Rate, Churn Rate, Active Partners
- Active Customers, Adoption Rate
- Grace Period, Past Due, Open Support, QR Enabled
- **Click any KPI** to drill down to the relevant operational page

### 9. Cross-Center Evidence
Raw evidence data from financial and operational systems:
- **Financial Health**: MRR, ARR, Revenue Churn, Net Revenue Retention
- **Operational Health**: Payment, Queue, Reconciliation, Subscription systems

### 10. AI Intelligence Assistant
The unified AI reasoning section showing cross-center insights:
- Each insight includes a question, answer, evidence, centers involved, confidence level, and suggested actions
- Evidence is sourced from multiple centers to provide holistic perspective

---

## How to Use

### Daily Executive Review
1. Open the Intelligence Engine
2. Check the **Intelligence Pulse** for overall health
3. Review the **Priority Queue** — address CRITICAL items first
4. Read the top **Executive Decision** for strategic guidance
5. Drill down into specific centers if needed

### Weekly Strategic Planning
1. Review **Trend Explanations** to understand what's changing
2. Assess **Business Risks** and assign mitigation owners
3. Evaluate **Growth Opportunities** and approve investments
4. Use **Center Health Radar** to identify which center needs attention

### Decision Support
- Every decision card includes **evidence** — click "Show Evidence" to verify the reasoning
- Every KPI includes **drill-down** — click to reach the operational workspace
- Every risk includes **mitigation actions** — assign these to team members

---

## Refresh

Click the "Refresh" button in the top-right corner to reload all data. The footer shows the last update timestamp.

---

## Troubleshooting

| Issue | Resolution |
|-------|-----------|
| "You do not have permission" | Contact admin to assign CEO, ADMIN, or EXECUTIVE role |
| Page shows loading indefinitely | Check network connection; click Refresh |
| Data seems stale | Click Refresh button |
| Score seems wrong | Scores are computed from real-time data across all centers |
