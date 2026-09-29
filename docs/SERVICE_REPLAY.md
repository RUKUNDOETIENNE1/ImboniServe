# Service Replay™

> "Watching restaurant operations like replaying a football match."

## Overview

Service Replay™ is a powerful operational playback feature that allows restaurant owners and managers to visually replay any service period and understand exactly what happened. It transforms existing Heart Pulse events into a chronological timeline that can be played back with full playback controls.

## Features

### Core Functionality

- **Time Range Selection**: Choose from presets (Today Lunch, Today Dinner, Yesterday) or custom time ranges
- **Playback Controls**: Play, Pause, Resume, Restart with variable speed (1x, 2x, 4x, 8x)
- **Timeline Scrubber**: Drag to any point in the replay
- **Live Statistics**: Real-time metrics that update during playback
- **Event Timeline**: Chronological display of all operational events
- **Event Details**: Click any event to see full payload and related events
- **Filtering**: Filter by order, table, waiter, station, event type
- **Search**: Instant search across all events

### Event Categories

Events are color-coded by category:

| Category | Color | Examples |
|----------|-------|----------|
| Order | Blue | Order Created, Order Updated |
| Kitchen | Orange | Item Routed, Item Preparing |
| Waiter | Purple | Order Picked Up, Order Served |
| Payment | Green | Payment Started, Payment Completed |
| Reservation | Violet | Reservation Created, Reservation Seated |
| Table | Cyan | Table Occupied, Session Started |
| Completed | Emerald | Order Completed, Item Ready |
| Failure | Red | Order Canceled, Payment Failed |
| System | Gray | SLA Warning, Reconciliation |

## Architecture

### Data Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Heart Pulse    │────▶│  TicketEvent    │────▶│  Service Replay │
│  Events         │     │  (Database)     │     │  UI             │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

Service Replay reads from the existing `TicketEvent` model, which is an append-only operational event log. It does NOT duplicate events or create parallel event systems.

### Key Components

```
src/
├── lib/service-replay/
│   ├── index.ts           # Main exports
│   ├── types.ts           # Type definitions
│   ├── transformer.ts     # Event transformation
│   ├── statistics.ts      # Statistics calculation
│   └── time-utils.ts      # Time utilities
├── hooks/
│   └── useServiceReplay.ts # React hook for replay state
├── pages/
│   ├── api/service-replay/
│   │   ├── events.ts      # Events API
│   │   ├── search.ts      # Search API
│   │   ├── filters.ts     # Filters API
│   │   └── event/[id].ts  # Event detail API
│   └── dashboard/operations/
│       └── service-replay.tsx # Main UI page
└── tests/service-replay/
    └── service-replay.test.ts # Test suite
```

## API Reference

### GET /api/service-replay/events

Retrieves operational events for replay playback.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| startTime | ISO string | Yes | Start of time range |
| endTime | ISO string | Yes | End of time range |
| cursor | string | No | Pagination cursor |
| limit | number | No | Results per page (default: 100, max: 500) |
| orderId | string | No | Filter by order ID |
| tableId | string | No | Filter by table ID |
| stationId | string | No | Filter by station ID |
| waiterId | string | No | Filter by waiter ID |
| eventTypes | string | No | Comma-separated event types |
| categories | string | No | Comma-separated categories |

**Response:**

```typescript
{
  events: ReplayEvent[]
  totalCount: number
  hasMore: boolean
  nextCursor?: string
  statistics: ReplayStatistics
}
```

### GET /api/service-replay/search

Full-text search across replay events.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| q | string | Yes | Search query |
| startTime | ISO string | Yes | Start of time range |
| endTime | ISO string | Yes | End of time range |
| limit | number | No | Results limit (default: 50, max: 100) |

**Response:**

```typescript
{
  events: ReplayEvent[]
  totalCount: number
  query: string
}
```

### GET /api/service-replay/filters

Returns available filter options for a time range.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| startTime | ISO string | Yes | Start of time range |
| endTime | ISO string | Yes | End of time range |

**Response:**

```typescript
{
  orders: FilterOption[]
  tables: FilterOption[]
  waiters: FilterOption[]
  stations: FilterOption[]
  eventTypes: FilterOption[]
  timeRange: {
    start: string
    end: string
    totalEvents: number
  }
}
```

### GET /api/service-replay/event/[id]

Retrieves full details for a single event.

**Response:**

```typescript
{
  event: ReplayEvent
  relatedEvents: ReplayEvent[]
  orderDetails?: OrderDetails
}
```

## Type Definitions

### ReplayEvent

```typescript
interface ReplayEvent {
  id: string
  timestamp: string
  eventType: ReplayEventType
  category: ReplayEventCategory
  description: string
  
  // Associated entities
  orderId?: string
  orderNumber?: string
  tableId?: string
  tableNumber?: string
  waiterId?: string
  waiterName?: string
  stationId?: string
  stationName?: string
  customerId?: string
  customerName?: string
  paymentId?: string
  reservationId?: string
  
  // State tracking
  previousState?: string
  newState?: string
  
  // Actor information
  actorId?: string
  actorName?: string
  actorSource?: 'user' | 'system' | 'api' | 'cron'
  
  // Correlation
  correlationId?: string
  
  // Full metadata
  metadata?: Record<string, unknown>
}
```

### ReplayStatistics

```typescript
interface ReplayStatistics {
  replayTime: string
  currentEvent?: ReplayEvent
  
  // Order metrics
  ordersActive: number
  ordersCompleted: number
  ordersCanceled: number
  
  // Table metrics
  tablesOccupied: number
  tablesAvailable: number
  
  // Kitchen metrics
  kitchenQueue: number
  itemsPreparing: number
  itemsReady: number
  
  // Payment metrics
  paymentsCompleted: number
  paymentsPending: number
  
  // Reservation metrics
  reservationsActive: number
  reservationsSeated: number
}
```

## Usage

### Basic Usage

```tsx
import { useServiceReplay } from '@/hooks/useServiceReplay'

function MyComponent() {
  const {
    session,
    statistics,
    play,
    pause,
    setPreset,
    fetchEvents,
  } = useServiceReplay({ timezone: 'Africa/Kigali' })
  
  // Select time range
  setPreset('today_lunch')
  
  // Load events
  await fetchEvents()
  
  // Start playback
  play()
  
  // Pause playback
  pause()
}
```

### With Filters

```tsx
const { setFilters, fetchEvents } = useServiceReplay()

// Filter by specific order
setFilters({ orderId: 'order-123' })
await fetchEvents()

// Filter by event types
setFilters({ eventTypes: ['ORDER_CREATED', 'ORDER_COMPLETED'] })
await fetchEvents()
```

### Search

```tsx
const { setSearchQuery, searchResults, isSearching } = useServiceReplay()

// Search for events
setSearchQuery('Table 5')

// Results are automatically updated
console.log(searchResults)
```

## Security

- **Role-Based Access**: Only OWNER, MANAGER, ADMIN, and SUPERVISOR roles can access Service Replay
- **Business Isolation**: Users can only replay events from their own business
- **No Cross-Tenant Access**: Business ID is enforced on all queries

## Performance

- **Pagination**: Events are loaded in batches (default 100, max 500)
- **Cursor-Based**: Efficient pagination using cursor tokens
- **Indexed Queries**: Database queries use optimized indexes
- **Incremental Statistics**: Statistics are calculated incrementally during playback

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Space | Play/Pause |
| R | Restart |
| Home | Jump to Start |
| End | Jump to End |
| 1-4 | Set speed (1x, 2x, 4x, 8x) |
| Escape | Close detail panel |

## Future Extensions

The architecture is designed to support future capabilities:

- **Floor Map Replay**: Visual representation of table activity
- **Kitchen Station Visualization**: Real-time station load display
- **AI Narration**: Automated commentary on operations
- **Bottleneck Detection**: Automatic identification of delays
- **Video Export**: Export replay as video file
- **Replay Sharing**: Share replay links with team members

## Troubleshooting

### No Events Found

- Verify the time range contains operational activity
- Check that TicketEvents are being recorded
- Ensure the user has access to the business

### Slow Performance

- Reduce the time range
- Apply filters to narrow results
- Check database indexes on TicketEvent table

### Playback Issues

- Ensure events are sorted chronologically
- Check for gaps in event timestamps
- Verify event data integrity

## Related Documentation

- [Heart Pulse Core](./HEART_PULSE_CORE.md) - Event system architecture
- [Operational Coordination](./OPERATIONAL_COORDINATION.md) - Kitchen and station events
