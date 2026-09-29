## Service Intelligence™ V2

**Status:** ✅ Production Ready  
**Version:** 2.0.0  
**Platform:** Hospitality Intelligence Platform

## Overview

Service Intelligence™ is the first production application built on the Hospitality Intelligence Platform. It transforms hundreds of operational events into actionable intelligence for restaurant managers.

## Core Principle

**Service Intelligence™ consumes intelligence. It does NOT produce intelligence.**

All intelligence generation is handled by:
- **HIE** (Hospitality Intelligence Engine)
- **IKB** (Intelligence Knowledge Base)

Service Intelligence™ is purely a presentation layer.

## Architecture

```
Restaurant Operations
        ↓
Heart Pulse™ (captures events)
        ↓
Service Replay™ (visualizes events)
        ↓
Service Intelligence™ (requests intelligence)
        ↓
HIE (generates intelligence)
        ↓
Structured Intelligence Report
        ↓
IKB (preserves knowledge)
        ↓
Service Intelligence™ Dashboard
        ↓
Manager
```

## Data Flow

### 1. Event Collection

```typescript
// Heart Pulse captures operational events
const heartPulseEvents: HeartPulseEvent[] = [...]

// Service Replay stores them
const replayEvents: ReplayEvent[] = [...]
```

### 2. Event Transformation

```typescript
// Service Intelligence transforms to operational events
const transformer = createEventTransformer()
const operationalEvents = transformer.transform(replayEvents)
```

### 3. Intelligence Generation

```typescript
// Service Intelligence requests intelligence from HIE
const service = createServiceIntelligence()
const response = await service.generateIntelligence(request, replayEvents)
```

### 4. Dashboard Rendering

```typescript
// Build dashboard view model
const builder = createDashboardBuilder()
const dashboard = builder.build(response.report, response.historicalContext)
```

### 5. User Interaction

```typescript
// Manager views dashboard
<ServiceIntelligenceDashboard dashboard={dashboard} />

// Manager clicks replay
<ReplayButton link={highlight.replayLink} />
```

## Usage

### Basic Usage

```typescript
import { createServiceIntelligence } from '@/lib/service-intelligence/v2'

// Create service
const service = createServiceIntelligence()

// Generate intelligence
const response = await service.generateIntelligence(
  {
    businessId: 'biz_123',
    selection: {
      period: 'today_lunch',
      label: 'Today Lunch',
    },
    includeHistoricalContext: true,
    includeComparison: true,
  },
  replayEvents
)

if (response.success) {
  console.log('Report:', response.report)
  console.log('Historical Context:', response.historicalContext)
}
```

### Dashboard Building

```typescript
import { createDashboardBuilder } from '@/lib/service-intelligence/v2'

const builder = createDashboardBuilder()
const dashboard = builder.build(
  response.report,
  response.historicalContext
)

// Dashboard contains:
// - Executive Summary
// - Overall Score
// - Key Metrics
// - Highlights
// - Issues
// - Recommendations
// - Historical Context
// - Timeline
// - Staff Insights
// - Kitchen Insights
// - Customer Journey
// - Patterns
// - Comparisons
```

### Export

```typescript
import { createExporter } from '@/lib/service-intelligence/v2'

const exporter = createExporter()

// Export as JSON
const jsonResult = await exporter.export(dashboard, report, {
  reportId: report.metadata.id,
  format: 'json',
})

// Export as Markdown
const mdResult = await exporter.export(dashboard, report, {
  reportId: report.metadata.id,
  format: 'markdown',
  sections: ['summary', 'score', 'highlights', 'issues'],
})

// Export as CSV
const csvResult = await exporter.export(dashboard, report, {
  reportId: report.metadata.id,
  format: 'csv',
})
```

## Service Periods

Service Intelligence™ supports predefined service periods:

- **Today Lunch** - 11:00 AM to 3:00 PM
- **Today Dinner** - 5:00 PM to 10:00 PM
- **Yesterday** - Full day
- **Last 7 Days** - Rolling week
- **Last 30 Days** - Rolling month
- **Custom** - User-defined range

## Dashboard Components

### Executive Summary

High-level operational overview:
- Total orders
- Completion rate
- Average service time
- Issue count
- Highlight count
- Overall trend

### Overall Score

Performance scoring:
- Overall score (0-100)
- Grade (A-F)
- Trend (improving/stable/declining)
- Confidence level
- Dimension scores

### Key Metrics

Operational metrics:
- Orders (total, completed, cancelled)
- Timing (prep, service, payment)
- Performance (completion rate, on-time rate, efficiency)

### Highlights

Positive operational findings:
- Title
- Description
- Value
- Confidence
- Evidence count
- Replay link

### Operational Issues

Problems detected:
- Title
- Description
- Severity
- Impact
- Root cause
- Confidence
- Evidence count
- Replay link

### Recommendations

Actionable recommendations:
- Action
- Priority
- Category
- Expected impact
- Reason
- Evidence count
- Replay link
- Timeframe
- Effort

### Historical Context

IKB-powered insights:
- Has this happened before?
- Occurrence frequency
- Trend analysis (improving/declining)
- Historical evidence

### Timeline

Critical operational moments:
- Timestamp
- Title
- Description
- Category
- Confidence
- Replay link

### Staff Insights

Staff performance:
- Total staff
- Average workload
- Top performer
- Workload distribution
- Insights
- Replay link

### Kitchen Insights

Kitchen performance:
- Overall utilization
- Peak utilization
- Average queue size
- Bottlenecks
- Insights
- Replay link

### Customer Journey

Customer experience:
- Average duration
- Journey stages
- Bottlenecks
- Insights
- Replay link

### Patterns

Recurring patterns:
- Title
- Description
- Type
- Frequency
- Occurrences
- Confidence
- Predictability
- Replay link

### Comparisons

Historical comparisons:
- Period
- Metrics
- Improvements
- Regressions
- Summary

## Evidence Panel

**Every intelligence card supports evidence viewing.**

Evidence panel displays:
- Related events
- Evidence count
- Confidence
- Replay references
- Affected entities (orders, staff, stations)

**Nothing exists without evidence.**

## Replay Integration

**Every intelligence card includes a replay button.**

Clicking replay:
1. Opens Service Replay™
2. Jumps to the exact timestamp
3. Shows related events
4. Enables drill-down

Integration is seamless.

## Search & Filters

### Search

Search across:
- Highlights
- Issues
- Recommendations
- Patterns
- Staff
- Kitchen
- Timeline
- Evidence
- Historical insights

### Filters

Filter by:
- Date range
- Service period
- Staff
- Kitchen stations
- Category
- Confidence level
- Severity
- Pattern type

## Export Formats

Supported formats:
- **JSON** - Full structured report
- **Markdown** - Human-readable report
- **CSV** - Tabular data
- **PDF** - (Planned)

## Configuration

### Scoring Configuration

Service-specific dimensions:
- Preparation Time (25% weight)
- Service Time (25% weight)
- Kitchen Utilization (15% weight)
- Completion Rate (20% weight)
- Payment Time (15% weight)

### Problem Thresholds

Service-specific thresholds:
- Prep delay: 15min warning, 30min critical
- Service delay: 40min warning, 60min critical
- Kitchen bottleneck: 5 orders warning, 10 critical
- Payment delay: 5min warning, 10min critical
- Order cancellation: 5% warning, 10% critical

### Pattern Detection

- Minimum occurrences: 3
- Minimum confidence: 0.7

## Performance

Typical performance:
- Event transformation: <50ms
- Intelligence generation: ~500ms
- Knowledge ingestion: ~150ms
- Dashboard building: <100ms
- **Total: ~800ms**

## Security

- Managers and Owners only
- Tenant isolation enforced
- Authorization respected
- No cross-business data leakage

## Accessibility

- Keyboard navigation
- Focus management
- Screen reader support
- Responsive design
- High contrast mode

## Testing

Comprehensive test coverage:
- Dashboard rendering
- Replay integration
- Evidence navigation
- Historical context
- Exports
- Filtering
- Search
- Permissions
- Performance
- Large datasets

## Integration Points

### With HIE

```typescript
// Service Intelligence uses HIE
const engine = createIntelligenceEngineV2(SERVICE_SCORING_CONFIG)
const result = await engine.generateReport(context, events)
```

### With IKB

```typescript
// Service Intelligence uses IKB
const kb = createKnowledgeBase()
await kb.ingest(result.report)
const history = await kb.getInsightHistory(businessId, insightType)
```

### With Service Replay™

```typescript
// Service Intelligence links to Replay
const replayLink = `/dashboard/service-replay?t=${timestamp}&business=${businessId}`
```

## Developer Guide

### Adding a New Dashboard Section

1. Add section type to `types.ts`
2. Add builder method to `dashboard-builder.ts`
3. Add export support to `export.ts`
4. Create UI component
5. Add to dashboard layout

### Adding a New Export Format

1. Add format to `ExportFormat` type
2. Implement export method in `export.ts`
3. Add UI button
4. Test with various reports

### Adding a New Service Period

1. Add period to `SERVICE_PERIODS` in `config.ts`
2. Add to `ServicePeriod` type
3. Implement time range logic
4. Add UI option

## Future Enhancements

- [ ] Real-time intelligence updates
- [ ] Custom dashboard layouts
- [ ] Advanced filtering
- [ ] Saved searches
- [ ] Scheduled reports
- [ ] Email delivery
- [ ] Mobile app
- [ ] Multi-location aggregation
- [ ] AI-powered summaries (optional LLM layer)

## Related Documentation

- [HIE Documentation](../../intelligence/README.md)
- [IKB Documentation](../../intelligence/knowledge/README.md)
- [Pipeline Documentation](../../intelligence/PIPELINE.md)
- [Service Replay™](../../service-replay/README.md)

---

**Service Intelligence™ is production-ready and fully integrated with the Hospitality Intelligence Platform.**

All intelligence is generated by HIE, preserved by IKB, and presented by Service Intelligence™.

No architectural changes required.
