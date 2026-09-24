# Menu Intelligence™ - README

**Version:** 1.0  
**Status:** Production Ready  
**Type:** Fourth Intelligence Consumer

---

## Overview

Menu Intelligence™ is the **fourth production consumer** of the Hospitality Intelligence Platform. It provides strategic menu performance insights to help restaurant owners understand how every menu item contributes to operational success.

**Menu Intelligence™ is NOT:**
- A menu editor
- Inventory management
- Kitchen management

**Menu Intelligence™ IS:**
- A strategic intelligence application
- A menu performance analyzer
- A dish popularity tracker
- A cancellation analyzer

---

## Core Principle

**Menu Intelligence™ does NOT generate intelligence.**

It presents intelligence already produced by HIE together with historical context from IKB.

- No business logic duplication
- No independent analysis engine
- Pure consumer of existing platform capabilities

---

## Architecture

```
Customer Orders
        ↓
Heart Pulse™ (captures order events)
        ↓
Service Replay™ (stores events)
        ↓
HIE (generates intelligence)
        ↓
Structured Intelligence Report
        ↓
IKB (preserves knowledge)
        ↓
Menu Intelligence™ (presents menu intelligence) ← WE ARE HERE
        ↓
Manager (reviews menu performance)
```

**Zero modifications to platform components** ✅

---

## Features

### 13 Dashboard Sections

1. **Menu Overview** - Score, popular items, slow items, cancelled items, trends
2. **Menu Performance Score** - Overall + 5 dimensions (popularity, efficiency, consistency, completion, operational)
3. **Top Performing Dishes** - Most ordered, fastest prep, highest completion, most efficient
4. **Lowest Performing Dishes** - Frequently cancelled, preparation delays, high modification
5. **Preparation Impact** - Average by dish, consistency, variability
6. **Popularity Trends** - Most popular, fastest growing, declining popularity
7. **Cancellation Analysis** - Cancelled dishes, reasons, historical frequency
8. **Modification Analysis** - Most modified dishes, common modifications
9. **Menu Consistency** - Preparation, completion, quality consistency
10. **Cross-Selling Opportunities** - Frequently ordered together, natural combinations
11. **Menu Highlights** - Improving popularity, operational efficiency
12. **Menu Issues** - Preparation bottlenecks, frequent cancellations
13. **Historical Menu Trends** - Long-term popularity, historical performance

---

## Usage

### Basic Usage

```typescript
import { createMenuIntelligenceService, createDashboardBuilder } from '@/lib/menu-intelligence'

const service = createMenuIntelligenceService()

const response = await service.generateReport({
  businessId: 'biz_123',
  reportingPeriod: {
    type: 'this_week',
    label: 'This Week',
    startTime: '2026-07-07T00:00:00Z',
    endTime: '2026-07-14T23:59:59Z',
  },
  includeHistorical: true,
  includeProfitability: true,
  includeSeasonal: true,
})

if (response.success && response.report) {
  const builder = createDashboardBuilder()
  const dashboard = builder.build(response.report)
  
  console.log(dashboard.overviewDisplay.score)
  console.log(dashboard.topPerformingDisplay.mostOrdered)
}
```

### Period Selection

```typescript
// Today
reportingPeriod: { type: 'today', label: 'Today', ... }

// This Week
reportingPeriod: { type: 'this_week', label: 'This Week', ... }

// This Month
reportingPeriod: { type: 'this_month', label: 'This Month', ... }

// Last Month
reportingPeriod: { type: 'last_month', label: 'Last Month', ... }

// Custom
reportingPeriod: { type: 'custom', label: 'Custom Period', ..., customDate: '2026-07-14' }
```

---

## API Routes

### Generate Report

**Endpoint:** `POST /api/menu-intelligence/generate`

**Request:**
```json
{
  "reportingPeriod": {
    "type": "this_week",
    "label": "This Week",
    "startTime": "2026-07-07T00:00:00Z",
    "endTime": "2026-07-14T23:59:59Z"
  },
  "includeHistorical": true,
  "includeProfitability": true,
  "includeSeasonal": true
}
```

**Response:**
```json
{
  "success": true,
  "dashboard": { ... },
  "diagnostics": {
    "reportsRetrieved": 1,
    "historicalQueriesExecuted": 1,
    "evidenceItemsProcessed": 500,
    "totalTime": 380
  }
}
```

---

## Components

```typescript
import {
  MenuDashboard,
  OverviewSection,
  PerformanceSection,
  TopPerformingSection,
  LowestPerformingSection,
  PreparationSection,
  PopularitySection,
  CancellationSection,
  ModificationSection,
  ConsistencySection,
  CrossSellingSection,
  TrendsSection,
  HighlightsSection,
  IssuesSection,
  PeriodSelector,
  SearchAndFilters,
  ExportButton,
  EvidencePanel,
  LoadingState,
  ErrorState,
} from '@/components/menu-intelligence'
```

---

## Evidence Traceability

Every intelligence item includes:
- Evidence count
- Confidence score
- Related events
- Replay references
- Affected dishes

```typescript
const handleViewEvidence = (item) => {
  console.log(`Evidence count: ${item.evidenceCount}`)
  console.log(`Confidence: ${item.confidence}`)
  console.log(`Replay link: ${item.replayLink}`)
}
```

---

## Replay Integration

Every intelligence item can link to Service Replay™:

```typescript
// Replay links automatically generated
highlight.replayLink // → "/dashboard/service-replay?t=2026-07-14T12:30:00Z&context=menu_ribeye"
issue.replayLink     // → "/dashboard/service-replay?t=2026-07-14T13:00:00Z&context=menu_lamb_cancel"
```

---

## Performance

### Target Performance
- **Report Retrieval:** < 100ms
- **Historical Retrieval:** < 200ms
- **Report Building:** < 100ms
- **Total:** < 500ms

---

## Security

- Session-based authentication required
- Role-based access: **Managers & Owners**
- Business isolation enforced
- No cross-tenant data leakage

---

## Accessibility

- ✅ Keyboard navigation support
- ✅ Screen reader compatible
- ✅ Focus management
- ✅ Responsive design
- ✅ High contrast mode support

---

## Testing

### Unit Tests
```bash
npm test src/lib/menu-intelligence/__tests__/service.test.ts
```

### End-to-End Demonstration
```bash
npm test src/lib/menu-intelligence/__tests__/e2e-demo.test.ts
```

---

## File Structure

```
src/lib/menu-intelligence/
├── types.ts                    # Type definitions (1000 lines)
├── service.ts                  # Main service (100 lines)
├── report-builder.ts           # Intelligence → Menu Report (200 lines)
├── dashboard-builder.ts        # Menu Report → Dashboard (300 lines)
├── export.ts                   # Export service (100 lines)
├── index.ts                    # Public API
├── README.md                   # This file
└── __tests__/
    ├── service.test.ts         # Service tests
    └── e2e-demo.test.ts        # End-to-end demonstration

src/components/menu-intelligence/
├── dashboard.tsx               # Main dashboard
├── sections.tsx                # All 13+ sections (800 lines)
└── index.ts                    # Component exports

src/app/api/menu-intelligence/
├── generate/route.ts           # Generate report endpoint
└── export/route.ts             # Export endpoint
```

---

## Comparison with Other Intelligence Consumers

| Aspect | Service Intelligence™ | Daily Briefings™ | Kitchen Intelligence™ | Menu Intelligence™ |
|--------|----------------------|------------------|----------------------|--------------------|
| **Purpose** | Service analysis | Daily check-in | Kitchen performance | Menu performance |
| **Scope** | Service period | Today/Yesterday | Today/Lunch/Dinner | Week/Month |
| **Focus** | Service quality | Quick overview | Kitchen operations | Menu strategy |
| **Sections** | 12 sections | 15 sections | 14 sections | 13 sections |
| **Target User** | Manager | Manager | Kitchen Manager | Owner/Manager |

---

## Known Limitations

1. **PDF Export:** Not yet implemented (Markdown used as fallback)
2. **Real-time Updates:** Dashboard requires manual refresh
3. **Advanced Filters:** Basic filtering only
4. **Profitability Data:** Requires financial integration

---

## Future Enhancements

- Real-time menu updates
- Advanced search and filtering
- Custom dashboard layouts
- Scheduled reports
- Mobile native app
- Multi-location aggregation
- AI-powered recommendations
- Predictive popularity analysis

---

**Menu Intelligence™ - Understanding menu performance through operational intelligence**
