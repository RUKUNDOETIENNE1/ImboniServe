**Daily Briefings™ - README**

**Version:** 1.0  
**Status:** Production Ready  
**Type:** Second Intelligence Consumer

---

## Overview

Daily Briefings™ is the **second production consumer** of the Hospitality Intelligence Platform. Unlike Service Intelligence™ which analyzes selected service periods, Daily Briefings answers one simple question:

**"What changed since I last checked?"**

The briefing is designed to be readable in under five minutes, providing managers with a quick operational overview to start their day.

---

## Core Principle

**Daily Briefings do NOT generate intelligence.**

They present intelligence already produced by HIE together with historical context from IKB.

- No business logic duplication
- No independent analysis engine
- Pure consumer of existing platform capabilities

---

## Architecture

```
Restaurant Operations
        ↓
Heart Pulse™ (captures events)
        ↓
Service Replay™ (stores events)
        ↓
HIE (generates intelligence)
        ↓
Structured Intelligence Report
        ↓
IKB (preserves knowledge)
        ↓
Daily Briefings™ (presents intelligence) ← WE ARE HERE
        ↓
Manager (reads briefing in < 5 min)
```

**Zero modifications to platform components** ✅

---

## Features

### 15 Dashboard Sections

1. **Good Morning Header** - Date, status, overall health
2. **Today's Snapshot** - Orders, timing, customer flow, score
3. **Yesterday Compared** - Key metrics vs previous day
4. **Operational Highlights** - Positive changes and improvements
5. **Things That Need Attention** - Issues requiring action
6. **Historical Changes** - Has this happened before?
7. **Performance Trends** - Score, prep time, completion rate trends
8. **Staff Summary** - Top improvements, workload balance, overload
9. **Kitchen Summary** - Station performance, queue changes, recovery
10. **Menu Summary** - Popular dishes, preparation changes, cancellations
11. **Replay Moments** - Today's moments worth watching
12. **Evidence Panel** - View evidence for any intelligence item
13. **Search** - Search across all sections
14. **Filters** - Filter by date, service, confidence, severity
15. **Export** - JSON, Markdown, CSV, PDF (planned)

---

## Usage

### Basic Usage

```typescript
import { createDailyBriefingService, createDashboardBuilder } from '@/lib/daily-briefings'

// Create service
const service = createDailyBriefingService()

// Generate briefing
const response = await service.generateBriefing({
  businessId: 'biz_123',
  selection: {
    period: 'today',
    label: 'Today',
  },
  includeComparison: true,  // Compare with yesterday
  includeHistorical: true,  // Include historical context from IKB
})

// Build dashboard
if (response.success && response.briefing) {
  const builder = createDashboardBuilder()
  const dashboard = builder.build(response.briefing)
  
  // Display to manager
  console.log(dashboard.headerDisplay.greeting)
  console.log(dashboard.snapshotDisplay.score.value)
}
```

### Period Selection

```typescript
// Today
selection: { period: 'today', label: 'Today' }

// Yesterday
selection: { period: 'yesterday', label: 'Yesterday' }

// Last 7 Days
selection: { period: 'last_7_days', label: 'Last 7 Days' }

// Specific Date
selection: {
  period: 'specific_date',
  label: 'July 14, 2026',
  specificDate: '2026-07-14'
}
```

### Export

```typescript
import { createExporter } from '@/lib/daily-briefings'

const exporter = createExporter()

// Export as JSON
const jsonExport = await exporter.export(dashboard, briefing, {
  briefingId: briefing.id,
  format: 'json',
})

// Export as Markdown
const mdExport = await exporter.export(dashboard, briefing, {
  briefingId: briefing.id,
  format: 'markdown',
  sections: ['header', 'snapshot', 'highlights', 'attention'],
  includeEvidence: true,
  includeReplayLinks: true,
})
```

---

## API Routes

### Generate Briefing

**Endpoint:** `POST /api/daily-briefings/generate`

**Request:**
```json
{
  "selection": {
    "period": "today",
    "label": "Today"
  },
  "includeComparison": true,
  "includeHistorical": true
}
```

**Response:**
```json
{
  "success": true,
  "dashboard": { ... },
  "diagnostics": {
    "reportsRetrieved": 2,
    "historicalQueriesExecuted": 1,
    "comparisonPerformed": true,
    "totalTime": 450
  }
}
```

### Export Briefing

**Endpoint:** `POST /api/daily-briefings/export`

**Request:**
```json
{
  "briefingId": "briefing_123",
  "format": "markdown",
  "sections": ["header", "snapshot", "highlights"],
  "includeEvidence": true,
  "includeReplayLinks": true
}
```

---

## Components

### React Components

```typescript
import {
  DailyBriefingsDashboard,
  BriefingHeader,
  TodaySnapshotSection,
  YesterdayComparisonSection,
  HighlightsSection,
  AttentionSection,
  HistoricalChangesSection,
  PerformanceTrendsSection,
  StaffSummarySection,
  KitchenSummarySection,
  MenuSummarySection,
  ReplayMomentsSection,
  EvidencePanel,
  BriefingPeriodSelector,
  SearchAndFilters,
  ExportButton,
  LoadingState,
  ErrorState,
} from '@/components/daily-briefings'
```

### Main Dashboard

```tsx
<DailyBriefingsDashboard dashboard={dashboard} />
```

### Individual Sections

```tsx
<BriefingHeader header={dashboard.headerDisplay} />
<TodaySnapshotSection snapshot={dashboard.snapshotDisplay} />
<YesterdayComparisonSection comparison={dashboard.comparisonDisplay} />
<HighlightsSection 
  highlights={dashboard.highlightsDisplay}
  onViewEvidence={handleViewEvidence}
/>
```

---

## Evidence Traceability

Every intelligence item includes:
- Evidence count
- Confidence score
- Related events
- Replay references
- Affected entities

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
highlight.replayLink // → "/dashboard/service-replay?t=2026-07-14T12:30:00Z"
moment.replayLink    // → "/dashboard/service-replay?t=2026-07-14T13:00:00Z"
```

**Features:**
- One-click navigation
- Opens at exact timestamp
- Shows related events in context
- Enables drill-down

---

## Historical Context

Daily Briefings retrieves historical context from IKB:

```typescript
// Historical changes
{
  hasHappenedBefore: true,
  frequency: 'occasional',  // first_time | rare | occasional | frequent | always
  trend: 'improving',       // improving | stable | declining
  previousOccurrences: 5,
  lastOccurrence: '2026-07-10T12:00:00Z'
}
```

---

## Performance

### Target Performance
- **Report Retrieval:** < 100ms (database query)
- **Historical Retrieval:** < 200ms (IKB query)
- **Briefing Building:** < 100ms (transformation)
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
- Role-based access: **Managers & Owners only**
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
npm test src/lib/daily-briefings/__tests__/service.test.ts
```

### End-to-End Demonstration
```bash
npm test src/lib/daily-briefings/__tests__/e2e-demo.test.ts
```

---

## File Structure

```
src/lib/daily-briefings/
├── types.ts                    # Type definitions
├── service.ts                  # Main service (HIE + IKB consumer)
├── briefing-builder.ts         # Report → Briefing transformation
├── dashboard-builder.ts        # Briefing → Dashboard transformation
├── export.ts                   # Export service
├── index.ts                    # Public API
├── README.md                   # This file
└── __tests__/
    ├── service.test.ts         # Service tests
    └── e2e-demo.test.ts        # End-to-end demonstration

src/components/daily-briefings/
├── dashboard.tsx               # Main dashboard
├── header.tsx                  # Header component
├── core-sections.tsx           # Snapshot, Comparison, Highlights, Attention
├── additional-sections.tsx     # Historical, Trends, Staff, Kitchen, Menu, Moments
├── utility-components.tsx      # Period selector, Search, Evidence, States, Export
└── index.ts                    # Component exports

src/app/api/daily-briefings/
├── generate/route.ts           # Generate briefing endpoint
└── export/route.ts             # Export endpoint
```

---

## Comparison with Service Intelligence™

| Aspect | Service Intelligence™ | Daily Briefings™ |
|--------|----------------------|------------------|
| **Purpose** | Analyze service period | Daily operational check-in |
| **Scope** | Single service period | Today/Yesterday/Last 7 days |
| **Focus** | Deep analysis | Quick overview (< 5 min) |
| **Comparison** | Optional | Built-in (Yesterday Compared) |
| **Format** | Detailed dashboard | Executive briefing |
| **Use Case** | Post-service analysis | Morning routine |
| **Target Time** | Anytime | Start of day |

---

## Known Limitations

1. **PDF Export:** Not yet implemented (Markdown used as fallback)
2. **Real-time Updates:** Dashboard requires manual refresh
3. **Advanced Filters:** Basic filtering only
4. **Mobile App:** Web-only (responsive design implemented)

---

## Future Enhancements

- Real-time intelligence updates (WebSocket)
- Advanced search and filtering
- Custom dashboard layouts
- Scheduled briefings (email delivery)
- Mobile native app
- Multi-location aggregation
- AI-powered summaries (optional LLM layer)
- Predictive analytics
- Automated recommendations

---

## Developer Guide

### Adding a New Section

1. **Define types** in `types.ts`
2. **Build data** in `briefing-builder.ts`
3. **Transform for UI** in `dashboard-builder.ts`
4. **Create component** in `components/daily-briefings/`
5. **Add to dashboard** in `dashboard.tsx`

### Extending Export Formats

```typescript
// In export.ts
private exportCustomFormat(dashboard, briefing, options): BriefingExportResult {
  // Your custom export logic
  return {
    success: true,
    data: customFormattedData,
    filename: `briefing-${options.briefingId}.custom`,
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

**Daily Briefings™ - Your daily operational overview in under 5 minutes**
