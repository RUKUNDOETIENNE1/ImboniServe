# Executive Summary Engine Design

Date: June 22, 2026
Phase: 1.1D
Version: 1.0

---

## Overview

The Executive Summary Engine generates automated operational and strategic summaries at hourly, daily, and weekly cadences. These summaries provide executives with actionable intelligence without requiring dashboard navigation or manual report compilation.

---

## Summary Types

### 1. Hourly Operations Summary

**Purpose**: Real-time operational health snapshot  
**Audience**: Operations team, on-call engineers  
**Cadence**: Every hour  
**Delivery**: Slack (ops channel), optional email

**Content**:
```typescript
{
  timestamp: Date
  period: 'hourly'
  queueHealth: {
    extractBacklog: number
    intelligenceBacklog: number
    extractDLQ: number
    intelligenceDLQ: number
    status: 'HEALTHY' | 'WARNING' | 'CRITICAL'
  }
  paymentHealth: {
    transactionsLastHour: number
    failureRate: number
    status: 'HEALTHY' | 'WARNING' | 'CRITICAL'
  }
  reconciliationHealth: {
    unreconciledCount: number
    oldestAgeHours: number
    status: 'HEALTHY' | 'WARNING' | 'CRITICAL'
  }
}
```

**Status Thresholds**:
- **Payment Health**: CRITICAL (≥10% failure), WARNING (≥3%), HEALTHY (<3%)
- **Reconciliation**: CRITICAL (≥48h age), WARNING (≥50 unreconciled), HEALTHY (otherwise)
- **Queue**: CRITICAL (DLQ > 10), WARNING (DLQ > 3), HEALTHY (otherwise)

### 2. Daily Executive Summary

**Purpose**: Business health overview for strategic decision-making  
**Audience**: Executives, management team  
**Cadence**: Daily at 7:00 AM  
**Delivery**: Email + Slack (exec channel)

**Content**:
```typescript
{
  date: Date
  period: 'daily'
  revenue: {
    yesterday: number
    dayBeforeYesterday: number
    changePercent: number
    trend: 'UP' | 'DOWN' | 'FLAT'
  }
  subscriptions: {
    new: number
    failedRenewals: number
    inGrace: number
    revenueAtRisk: number
  }
  customers: {
    activeCount: number
    healthDistribution: {
      excellent: number
      healthy: number
      atRisk: number
      critical: number
    }
  }
  branches: {
    topPerformer: { id, name, score } | null
    bottomPerformer: { id, name, score } | null
  }
  alerts: {
    critical: number
    error: number
    warn: number
    topIssues: string[]
  }
  recommendedActions: string[]
}
```

**Recommended Actions Logic**:
- Failed renewals > 5 → "Review failed renewal patterns"
- Revenue decline > 15% → "Investigate revenue decline"
- Grace subscriptions > 10 → "Initiate rescue campaigns"

### 3. Weekly Executive Summary

**Purpose**: Strategic trends and KPI highlights  
**Audience**: Executives, board members  
**Cadence**: Weekly (Monday 8:00 AM)  
**Delivery**: Email (formatted report)

**Content**:
```typescript
{
  weekStart: Date
  weekEnd: Date
  period: 'weekly'
  revenue: {
    thisWeek: number
    lastWeek: number
    changePercent: number
    trend: 'UP' | 'DOWN' | 'FLAT'
  }
  customers: {
    newCustomers: number
    churnedCustomers: number
    netChange: number
  }
  subscriptions: {
    newSubscriptions: number
    cancellations: number
    churnRate: number
  }
  operationalIncidents: {
    paymentFailures: number
    queueStalls: number
    reconciliationIssues: number
  }
  kpiHighlights: string[]
}
```

**KPI Highlights Examples**:
- "Revenue increased by 12.3%"
- "45 new customers acquired"
- "Churn rate elevated at 6.2%"

---

## Implementation

**Service**: `ExecutiveSummaryService`  
**Location**: `src/lib/services/intelligence/executive-summary.service.ts`

**Key Methods**:
```typescript
// Generate hourly operations summary
generateHourlySummary(): Promise<HourlyOperationsSummary>

// Generate daily executive summary
generateDailySummary(businessId?: string): Promise<DailyExecutiveSummary>

// Generate weekly executive summary
generateWeeklySummary(businessId?: string): Promise<WeeklyExecutiveSummary>
```

**Cron Jobs**:
- Hourly: `/api/cron/summary-hourly` (not implemented yet)
- Daily: `/api/cron/summary-daily` (7:00 AM)
- Weekly: `/api/cron/summary-weekly` (not implemented yet)

---

## Data Sources

**Primary Sources** (per FinancialLedgerEntry governance):
- `FinancialLedgerEntry` (revenue, all financial metrics)
- `Customer` (active count, health distribution)
- `Subscription` (new, grace, cancelled)
- `PaymentTransaction` (failure rates, operational health)
- `Branch` (via BranchHealthScoreService)

**Derived Metrics**:
- Revenue trends (period-over-period)
- Customer health distribution (via CustomerHealthScoreService)
- Branch rankings (via BranchHealthScoreService)
- Alert counts (from watchdog system)

---

## Delivery Mechanisms

### Email Format

**Subject Line**:
- Hourly: "ImboniServe Operations Health - [timestamp]"
- Daily: "Daily Executive Summary - [date]"
- Weekly: "Weekly Executive Summary - [week of date]"

**Body Structure**:
```
# [Summary Type] - [Date/Time]

## Key Metrics
[Metric 1]: [Value] ([Change])
[Metric 2]: [Value] ([Change])
...

## Highlights
- [Highlight 1]
- [Highlight 2]
...

## Recommended Actions
1. [Action 1]
2. [Action 2]
...

## Details
[Detailed breakdown by section]
```

### Slack Format

**Channel Routing**:
- Hourly → #ops-health
- Daily → #exec-daily
- Weekly → #exec-weekly

**Message Structure**:
```
🔔 *[Summary Type]* - [Date/Time]

📊 *Key Metrics*
• Revenue: [Value] ([Trend emoji])
• Customers: [Value]
• Alerts: [Count] CRITICAL, [Count] ERROR

⚠️ *Attention Required*
• [Issue 1]
• [Issue 2]

✅ *Recommended Actions*
1. [Action 1]
2. [Action 2]
```

**Emoji Legend**:
- 📈 UP trend
- 📉 DOWN trend
- ➡️ FLAT trend
- ✅ HEALTHY status
- ⚠️ WARNING status
- 🚨 CRITICAL status

---

## Executive Briefing Format

**2-Minute Read Goal**: Executives should understand business health in < 2 minutes

**Daily Briefing Sections**:

1. **Revenue Snapshot** (30 seconds)
   - Yesterday's revenue vs day before
   - Trend indicator
   - Notable changes

2. **Subscription Health** (30 seconds)
   - New subscriptions
   - Failed renewals
   - Revenue at risk

3. **Customer Health** (20 seconds)
   - Active customer count
   - Health distribution (% in each category)

4. **Branch Performance** (20 seconds)
   - Top performer (name + score)
   - Bottom performer (name + score)

5. **Operational Alerts** (20 seconds)
   - Critical/Error alert count
   - Top 3 issues

6. **Recommended Actions** (20 seconds)
   - 2-3 prioritized actions
   - Clear, actionable language

---

## Scheduling & Automation

**Cron Configuration**:
```json
{
  "crons": [
    {
      "path": "/api/cron/summary-hourly",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/cron/summary-daily",
      "schedule": "0 7 * * *"
    },
    {
      "path": "/api/cron/summary-weekly",
      "schedule": "0 8 * * 1"
    }
  ]
}
```

**Timezone Handling**:
- All summaries use Africa/Kigali timezone (UTC+2)
- Daily summary at 7:00 AM local time
- Weekly summary Monday 8:00 AM local time

---

## Future Enhancements

### Phase 1.2
- Add monthly executive summary
- Add custom summary templates
- Add recipient preferences (email vs Slack)

### Phase 1.3
- Add predictive insights ("Revenue likely to decline next week")
- Add anomaly detection ("Unusual spike in cancellations")
- Add comparative benchmarks ("20% above industry average")

### Phase 2.0
- Add natural language generation (AI-written summaries)
- Add interactive dashboards (click-through from summary)
- Add voice briefings (audio summaries)

---

## Success Metrics

**Engagement**:
- Email open rate > 80%
- Slack message read rate > 90%
- Action item completion rate > 60%

**Accuracy**:
- Metric accuracy > 99%
- Trend prediction accuracy > 85%
- Recommended action relevance > 90%

**Timeliness**:
- Summary delivery within 5 minutes of scheduled time
- Data freshness < 1 hour old

---

## Governance

**Owner**: Executive Team  
**Review Cadence**: Monthly  
**Content Updates**: As needed (new metrics, format changes)  
**Delivery Preferences**: Configurable per recipient

**Change Control**:
- Metric additions require Exec approval
- Format changes require Exec + Product approval
- Delivery schedule changes require Exec approval
