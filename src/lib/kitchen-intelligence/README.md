# Kitchen Intelligence™ - README

**Version:** 1.0  
**Status:** Production Ready  
**Type:** Third Intelligence Consumer

---

## Overview

Kitchen Intelligence™ is the **third production consumer** of the Hospitality Intelligence Platform. It is dedicated to understanding kitchen performance, not managing it.

**Kitchen Intelligence™ is NOT:**
- A kitchen management system
- A kitchen display system
- An order management system

**Kitchen Intelligence™ IS:**
- An operational intelligence application
- A performance analysis tool
- A bottleneck detector
- A recovery analyzer

---

## Core Principle

**Kitchen Intelligence™ does NOT generate intelligence.**

It presents intelligence already produced by HIE together with historical context from IKB.

- No business logic duplication
- No independent analysis engine
- Pure consumer of existing platform capabilities

---

## Architecture

```
Restaurant Operations
        ↓
Heart Pulse™ (captures kitchen events)
        ↓
Service Replay™ (stores events)
        ↓
HIE (generates intelligence)
        ↓
Structured Intelligence Report
        ↓
IKB (preserves knowledge)
        ↓
Kitchen Intelligence™ (presents kitchen intelligence) ← WE ARE HERE
        ↓
Kitchen Manager (reviews performance)
```

**Zero modifications to platform components** ✅

---

## Features

### 14 Dashboard Sections

1. **Kitchen Overview** - Score, preparation, completion, orders, delays, recovery
2. **Kitchen Performance Score** - Overall score with 5 dimensions (speed, consistency, quality, recovery, efficiency)
3. **Station Health** - Status, preparation, queue, utilization, recovery for each station
4. **Queue Analysis** - Growth, reduction, longest queue, peak queue, historical comparison
5. **Preparation Analysis** - Average, fastest, slowest, trend, distribution
6. **Bottlenecks** - Station, duration, severity, impact, historical frequency, root cause
7. **Recovery Analysis** - Recovery events, average time, fastest/slowest recovery
8. **Kitchen Workload** - Station workload, balance, overloaded/idle stations
9. **Recipe Performance** - Fastest/slowest recipes, delaying recipes, frequently modified
10. **Ingredient Consumption** - Highest consumption, unexpected consumption, low-stock impact
11. **Historical Kitchen Trends** - Improving/declining metrics, recurring bottlenecks/successes
12. **Peak Load Analysis** - Utilization over time, rush periods, high-pressure windows
13. **Kitchen Highlights** - Excellent recovery, fast preparation, improved performance
14. **Kitchen Issues** - Preparation delays, queue congestion, station overload, recipe delays

---

## Usage

### Basic Usage

```typescript
import { createKitchenIntelligenceService, createDashboardBuilder } from '@/lib/kitchen-intelligence'

// Create service
const service = createKitchenIntelligenceService()

// Generate report
const response = await service.generateReport({
  businessId: 'biz_123',
  reportingPeriod: {
    type: 'lunch',
    label: 'Lunch',
    startTime: '2026-07-14T12:00:00Z',
    endTime: '2026-07-14T15:00:00Z',
  },
  includeHistorical: true,
  includeIngredients: true,
})

// Build dashboard
if (response.success && response.report) {
  const builder = createDashboardBuilder()
  const dashboard = builder.build(response.report)
  
  // Display to kitchen manager
  console.log(dashboard.overviewDisplay.score)
  console.log(dashboard.stationsDisplay)
}
```

### Period Selection

```typescript
// Today
reportingPeriod: { type: 'today', label: 'Today', startTime: ..., endTime: ... }

// Lunch
reportingPeriod: { type: 'lunch', label: 'Lunch', startTime: ..., endTime: ... }

// Dinner
reportingPeriod: { type: 'dinner', label: 'Dinner', startTime: ..., endTime: ... }

// Yesterday
reportingPeriod: { type: 'yesterday', label: 'Yesterday', startTime: ..., endTime: ... }

// Custom
reportingPeriod: { type: 'custom', label: 'Custom Period', startTime: ..., endTime: ..., customDate: '2026-07-14' }
```

### Export

```typescript
import { createExporter } from '@/lib/kitchen-intelligence'

const exporter = createExporter()

// Export as JSON
const jsonExport = await exporter.export(dashboard, report, {
  reportId: report.id,
  format: 'json',
})

// Export as Markdown
const mdExport = await exporter.export(dashboard, report, {
  reportId: report.id,
  format: 'markdown',
  includeEvidence: true,
  includeReplayLinks: true,
})
```

---

## API Routes

### Generate Report

**Endpoint:** `POST /api/kitchen-intelligence/generate`

**Request:**
```json
{
  "reportingPeriod": {
    "type": "lunch",
    "label": "Lunch",
    "startTime": "2026-07-14T12:00:00Z",
    "endTime": "2026-07-14T15:00:00Z"
  },
  "includeHistorical": true,
  "includeIngredients": true
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
    "evidenceItemsProcessed": 150,
    "totalTime": 420
  }
}
```

### Export Report

**Endpoint:** `POST /api/kitchen-intelligence/export`

**Request:**
```json
{
  "reportId": "report_123",
  "format": "markdown",
  "includeEvidence": true,
  "includeReplayLinks": true
}
```

---

## Components

### React Components

```typescript
import {
  KitchenDashboard,
  OverviewSection,
  PerformanceSection,
  StationsSection,
  QueueSection,
  PreparationSection,
  BottlenecksSection,
  RecoverySection,
  WorkloadSection,
  RecipeSection,
  IngredientSection,
  TrendsSection,
  PeakLoadSection,
  HighlightsSection,
  IssuesSection,
  PeriodSelector,
  SearchAndFilters,
  ExportButton,
  EvidencePanel,
  LoadingState,
  ErrorState,
} from '@/components/kitchen-intelligence'
```

### Main Dashboard

```tsx
<KitchenDashboard dashboard={dashboard} />
```

### Individual Sections

```tsx
<OverviewSection overview={dashboard.overviewDisplay} />
<StationsSection stations={dashboard.stationsDisplay} onViewEvidence={handleViewEvidence} />
<BottlenecksSection bottlenecks={dashboard.bottlenecksDisplay} onViewEvidence={handleViewEvidence} />
```

---

## Evidence Traceability

Every intelligence item includes:
- Evidence count
- Confidence score
- Related events
- Replay references
- Affected stations
- Affected recipes

```typescript
// View evidence for any item
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
// Replay links are automatically generated
bottleneck.replayLink // → "/dashboard/service-replay?t=2026-07-14T12:30:00Z&context=kitchen_grill"
highlight.replayLink  // → "/dashboard/service-replay?t=2026-07-14T13:00:00Z&context=kitchen_recovery"
```

**Features:**
- One-click navigation
- Opens at exact timestamp
- Shows related kitchen events
- Enables drill-down

---

## Historical Context

Kitchen Intelligence retrieves historical context from IKB:

```typescript
// Historical trends
{
  improving: [
    { metric: 'Average preparation time', currentValue: 180, historicalAverage: 210, change: -14.3 }
  ],
  recurringBottlenecks: [
    { description: 'Grill queue during lunch rush', frequency: 3, pattern: 'Weekday lunch 12:30-13:30' }
  ]
}
```

---

## Performance

### Target Performance
- **Report Retrieval:** < 100ms (database query)
- **Historical Retrieval:** < 200ms (IKB query)
- **Report Building:** < 100ms (transformation)
- **Total:** < 500ms

### Optimization
- Cache intelligence reports in database
- Query by business ID + time range
- Lazy load historical context
- Paginate search results

---

## Security

### Authentication & Authorization
- Session-based authentication required
- Role-based access: **Kitchen Managers, Managers & Owners**
- Business isolation enforced
- No cross-tenant data leakage

### API Security
- Secure endpoints
- Input validation
- Error handling
- Rate limiting (recommended)

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
npm test src/lib/kitchen-intelligence/__tests__/service.test.ts
```

### End-to-End Demonstration
```bash
npm test src/lib/kitchen-intelligence/__tests__/e2e-demo.test.ts
```

---

## File Structure

```
src/lib/kitchen-intelligence/
├── types.ts                    # Type definitions
├── service.ts                  # Main service (HIE + IKB consumer)
├── report-builder.ts           # Intelligence Report → Kitchen Report
├── dashboard-builder.ts        # Kitchen Report → Dashboard
├── export.ts                   # Export service
├── index.ts                    # Public API
├── README.md                   # This file
└── __tests__/
    ├── service.test.ts         # Service tests
    └── e2e-demo.test.ts        # End-to-end demonstration

src/components/kitchen-intelligence/
├── dashboard.tsx               # Main dashboard
├── sections.tsx                # All 14+ sections
└── index.ts                    # Component exports

src/app/api/kitchen-intelligence/
├── generate/route.ts           # Generate report endpoint
└── export/route.ts             # Export endpoint
```

---

## Comparison with Other Intelligence Consumers

| Aspect | Service Intelligence™ | Daily Briefings™ | Kitchen Intelligence™ |
|--------|----------------------|------------------|----------------------|
| **Purpose** | Analyze service period | Daily operational check-in | Kitchen performance analysis |
| **Scope** | Full service | Today/Yesterday/Week | Today/Lunch/Dinner |
| **Focus** | Service quality | Quick overview | Kitchen operations |
| **Sections** | 12 sections | 15 sections | 14 sections |
| **Target User** | Manager | Manager | Kitchen Manager |

---

## Known Limitations

1. **PDF Export:** Not yet implemented (Markdown used as fallback)
2. **Real-time Updates:** Dashboard requires manual refresh
3. **Advanced Filters:** Basic filtering only
4. **Ingredient Details:** Requires inventory integration

---

## Future Enhancements

- Real-time kitchen updates (WebSocket)
- Advanced search and filtering
- Custom dashboard layouts
- Scheduled reports (email delivery)
- Mobile native app
- Multi-location aggregation
- AI-powered recommendations
- Predictive bottleneck detection

---

## Developer Guide

### Adding a New Section

1. **Define types** in `types.ts`
2. **Build data** in `report-builder.ts`
3. **Transform for UI** in `dashboard-builder.ts`
4. **Create component** in `sections.tsx`
5. **Add to dashboard** in `dashboard.tsx`

### Extending Export Formats

```typescript
// In export.ts
private exportCustomFormat(dashboard, report, options): KitchenExportResult {
  // Your custom export logic
  return {
    success: true,
    data: customFormattedData,
    filename: `kitchen-${options.reportId}.custom`,
  }
}
```

---

## Support

For questions or issues:
1. Check this README
2. Review implementation guide
3. Run end-to-end demonstration
4. Check Service Intelligence™ documentation (similar pattern)

---

## License

Proprietary - Imboni Serve Platform

---

**Kitchen Intelligence™ - Understanding kitchen performance through operational intelligence**
