# Multi-location Intelligence™ - README

**Version:** 1.0  
**Status:** Production Ready  
**Type:** Fifth Intelligence Consumer

---

## Overview

Multi-location Intelligence™ is the **fifth production consumer** of the Hospitality Intelligence Platform. It provides executive portfolio performance insights for organizations operating multiple restaurants.

**Multi-location Intelligence™ is NOT:**
- A multi-tenant administration system
- Restaurant management
- Operational control system

**Multi-location Intelligence™ IS:**
- An executive intelligence application
- A portfolio performance analyzer
- A location comparison tool
- A best practices identifier

---

## Core Principle

**Multi-location Intelligence™ does NOT generate intelligence.**

It presents intelligence already produced by HIE together with historical context from IKB.

- No business logic duplication
- No independent analysis engine
- Pure consumer of existing platform capabilities

---

## Architecture

```
Multiple Restaurants
        ↓
Heart Pulse™ (captures events)
        ↓
Service Replay™ (stores events)
        ↓
HIE (generates intelligence)
        ↓
Structured Intelligence Reports
        ↓
IKB (preserves knowledge)
        ↓
Multi-location Intelligence™ (presents portfolio intelligence) ← WE ARE HERE
        ↓
Executive (reviews portfolio performance)
```

**Zero modifications to platform components** ✅

---

## Features

### 14 Dashboard Sections

1. **Portfolio Overview** - Restaurant count, overall score, averages, trend
2. **Portfolio Performance Score** - Overall + 5 dimensions
3. **Restaurant Ranking** - All locations ranked by performance
4. **Performance Distribution** - Top/middle/attention categories
5. **Location Comparison** - Side-by-side restaurant comparison
6. **Operational Trends** - Portfolio-wide patterns
7. **Service Comparison** - Service quality across locations
8. **Kitchen Comparison** - Kitchen performance across locations
9. **Menu Comparison** - Menu performance across locations
10. **Growth Trends** - Historical improvement trajectories
11. **Portfolio Highlights** - Positive observations
12. **Portfolio Issues** - Locations requiring attention
13. **Best Practices** - Observed successful patterns
14. **Historical Portfolio Trends** - Long-term evolution

---

## Usage

### Basic Usage

```typescript
import { createPortfolioIntelligenceService, createDashboardBuilder } from '@/lib/multi-location-intelligence'

const service = createPortfolioIntelligenceService()

const response = await service.generateReport({
  organizationId: 'org_123',
  reportingPeriod: {
    type: 'this_month',
    label: 'This Month',
    startTime: '2026-07-01T00:00:00Z',
    endTime: '2026-07-31T23:59:59Z',
  },
  includeHistorical: true,
  includeComparisons: true,
})

if (response.success && response.report) {
  const builder = createDashboardBuilder()
  const dashboard = builder.build(response.report)
  
  console.log(dashboard.overviewDisplay.score)
  console.log(dashboard.rankingDisplay.restaurants)
}
```

---

## API Routes

### Generate Report

**Endpoint:** `POST /api/multi-location-intelligence/generate`

**Request:**
```json
{
  "reportingPeriod": {
    "type": "this_month",
    "label": "This Month",
    "startTime": "2026-07-01T00:00:00Z",
    "endTime": "2026-07-31T23:59:59Z"
  },
  "includeHistorical": true,
  "includeComparisons": true
}
```

**Response:**
```json
{
  "success": true,
  "dashboard": { ... },
  "diagnostics": {
    "reportsRetrieved": 3,
    "restaurantsProcessed": 3,
    "evidenceItemsProcessed": 1200,
    "totalTime": 350
  }
}
```

---

## Components

```typescript
import {
  PortfolioDashboard,
  PeriodSelector,
  ExportButton,
  EvidencePanel,
  LoadingState,
  ErrorState,
} from '@/components/multi-location-intelligence'
```

---

## Evidence Traceability

Every intelligence item includes:
- Evidence count
- Confidence score
- Related reports
- Replay references
- Affected restaurants

---

## Replay Integration

Every intelligence item can link to Service Replay™:

```typescript
highlight.replayLink // → "/dashboard/service-replay?t=2026-07-14T12:30:00Z&context=portfolio_improvement"
```

---

## Performance

### Target Performance
- **Report Retrieval:** < 100ms per restaurant
- **Historical Retrieval:** < 200ms
- **Report Building:** < 100ms
- **Total:** < 500ms

---

## Security

- Session-based authentication required
- Role-based access: **Owners, Operations Directors, Regional Managers**
- Organization isolation enforced
- Users only see authorized locations

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
npm test src/lib/multi-location-intelligence/__tests__/service.test.ts
```

### End-to-End Demonstration
```bash
npm test src/lib/multi-location-intelligence/__tests__/e2e-demo.test.ts
```

---

## File Structure

```
src/lib/multi-location-intelligence/
├── types.ts                    # Type definitions (1100 lines)
├── service.ts                  # Main service (100 lines)
├── report-builder.ts           # Intelligence → Portfolio Report (250 lines)
├── dashboard-builder.ts        # Portfolio Report → Dashboard (300 lines)
├── export.ts                   # Export service (100 lines)
├── index.ts                    # Public API
├── README.md                   # This file
└── __tests__/
    ├── service.test.ts         # Service tests
    └── e2e-demo.test.ts        # End-to-end demonstration

src/components/multi-location-intelligence/
├── dashboard.tsx               # Main dashboard (500 lines, all 14 sections)
└── index.ts                    # Component exports

src/app/api/multi-location-intelligence/
├── generate/route.ts           # Generate report endpoint
└── export/route.ts             # Export endpoint
```

---

## Comparison with Other Intelligence Consumers

| Aspect | Service Intelligence™ | Daily Briefings™ | Kitchen Intelligence™ | Menu Intelligence™ | Multi-location Intelligence™ |
|--------|----------------------|------------------|----------------------|--------------------|------------------------------|
| **Purpose** | Service analysis | Daily check-in | Kitchen performance | Menu performance | Portfolio management |
| **Scope** | Service period | Today/Yesterday | Today/Lunch/Dinner | Week/Month | Month/Quarter/Year |
| **Focus** | Service quality | Quick overview | Kitchen operations | Menu strategy | Portfolio strategy |
| **Sections** | 12 sections | 15 sections | 14 sections | 13 sections | 14 sections |
| **Target User** | Manager | Manager | Kitchen Manager | Owner/Manager | Executive/Owner |

---

## Known Limitations

1. **PDF Export:** Not yet implemented (Markdown used as fallback)
2. **Real-time Updates:** Dashboard requires manual refresh
3. **Advanced Filters:** Basic filtering only
4. **Region Support:** Requires organizational structure

---

**Multi-location Intelligence™ - Understanding portfolio performance through operational intelligence**
