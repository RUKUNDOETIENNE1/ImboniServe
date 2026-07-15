# Heart Pulse Core - Event Backbone Documentation

**Version:** 1.0  
**Status:** Complete  
**Last Updated:** 2026-07-10

---

## Overview

Heart Pulse Core is the standardized event backbone for Heart of House Core operations. It provides consistent event contracts, correlation tracking, delivery monitoring, and observability for all operational workflows.

### Architecture Principles

- **IAS-001 Compliance:** Event-Driven by Default, Observability First
- **IEC-001 Compliance:** Build Core Before Intelligence, Every Release Must Earn Trust
- **SADR-002 Compliance:** Business-First Engineering

---

## Event Contract Standard

Every Heart Pulse event follows a standardized envelope:

```typescript
interface HeartPulseEvent<TPayload> {
  eventId: string              // Unique event instance ID
  eventType: string            // Event type from catalog
  eventVersion: number         // Schema version (currently v1)
  businessId: string           // Business context
  correlationId: string        // Workflow correlation ID
  timestamp: string            // ISO timestamp
  actor?: {                    // Optional actor information
    userId?: string
    userName?: string
    source: 'user' | 'system' | 'api' | 'cron'
  }
  payload: TPayload            // Event-specific data
}
```

---

## Event Catalog

### Order Lifecycle Events

| Event Type | Channel | Publisher | Subscribers |
|---|---|---|---|
| `order.created` | `private-kitchen-{businessId}` | KitchenDispatchService | KDS, Kitchen Board |
| `order.updated` | `private-kitchen-{businessId}` | /api/kitchen/update-status | Kitchen Board |
| `order.completed` | `private-kitchen-{businessId}` | WorkflowEngine | KDS, Kitchen Board |
| `order.canceled` | `private-kitchen-{businessId}` | WorkflowEngine | KDS, Kitchen Board |

### Item Lifecycle Events

| Event Type | Channel | Publisher | Subscribers |
|---|---|---|---|
| `items.routed` | `private-station-{stationId}` | KitchenDispatchService | KDS |
| `item.updated` | `private-kitchen-{businessId}` | /api/station/update-item-status | KDS, Kitchen Board |
| `station.item.updated` | `private-station-{stationId}` | /api/station/update-item-status | KDS |
| `item.status.changed` | `private-order-{orderId}` | /api/station/update-item-status | Customer Order View |

### Kitchen Status Events

| Event Type | Channel | Publisher | Subscribers |
|---|---|---|---|
| `kitchen.status.changed` | `private-order-{orderId}` | /api/kitchen/update-status | Customer Order View |

---

## Channel Naming Convention

Use the `HeartPulseChannel` helpers for consistent channel names:

```typescript
import { HeartPulseChannel } from '@/lib/heart-pulse'

// Kitchen-wide channel
HeartPulseChannel.kitchen(businessId)  // → private-kitchen-{businessId}

// Station-specific channel
HeartPulseChannel.station(stationId)   // → private-station-{stationId}

// Order-specific channel
HeartPulseChannel.order(orderId)       // → private-order-{orderId}

// Business-wide channel
HeartPulseChannel.business(businessId) // → private-business-{businessId}
```

---

## Publishing Events

### Basic Publishing

```typescript
import {
  publishHeartPulseEvent,
  HeartPulseEventType,
  HeartPulseChannel,
  type OrderCreatedPayload,
} from '@/lib/heart-pulse'

const payload: OrderCreatedPayload = {
  orderId: sale.id,
  orderNumber: sale.orderNumber,
  orderSource: sale.orderSource,
  items: [...],
}

const result = await publishHeartPulseEvent(
  HeartPulseChannel.kitchen(businessId),
  HeartPulseEventType.ORDER_CREATED,
  businessId,
  payload,
  {
    correlationId: workflowCorrelationId,
    actor: { userId: ctx.userId, source: 'user' },
  }
)

if (!result.success) {
  console.error('Event publish failed:', result.error)
}
```

### Batch Publishing

For related events in a workflow, use batch publishing with a shared correlation ID:

```typescript
import { publishHeartPulseEventBatch } from '@/lib/heart-pulse'

const correlationId = generateCorrelationId()

const results = await publishHeartPulseEventBatch([
  {
    channel: HeartPulseChannel.station(stationId),
    eventType: HeartPulseEventType.STATION_ITEM_UPDATED,
    businessId,
    payload: itemPayload,
    options: { actor: { userId: ctx.userId, source: 'user' } },
  },
  {
    channel: HeartPulseChannel.kitchen(businessId),
    eventType: HeartPulseEventType.ITEM_UPDATED,
    businessId,
    payload: itemPayload,
    options: { actor: { userId: ctx.userId, source: 'user' } },
  },
], correlationId)
```

---

## Correlation Tracking

Correlation IDs link related events across a workflow:

```typescript
import { generateCorrelationId } from '@/lib/heart-pulse'

// Generate at workflow start
const correlationId = generateCorrelationId()

// Pass to all related event publishes
await publishHeartPulseEvent(channel, eventType, businessId, payload, {
  correlationId,
  actor: { source: 'system' },
})
```

### Correlation Flow Example

```
Customer Order (correlationId: abc-123)
  ↓
Routing (correlationId: abc-123)
  ↓
Kitchen Dispatch (correlationId: abc-123)
  ↓
Item Status Update (correlationId: abc-123)
  ↓
Completion (correlationId: abc-123)
```

All events share the same `correlationId`, enabling end-to-end workflow tracking.

---

## Delivery Monitoring

Heart Pulse provides built-in delivery monitoring:

### Publish Result

```typescript
interface PublishResult {
  success: boolean
  eventId: string
  error?: string
  retryCount?: number
}
```

### Logging

All publishes are logged with structured data:

```
[HeartPulse] Publishing event {
  eventId: "evt_123",
  eventType: "order.created",
  channel: "private-kitchen-abc",
  correlationId: "corr_456"
}

[HeartPulse] ✅ Event published successfully
```

### Retry Logic

Failed publishes are automatically retried with exponential backoff:

```typescript
await publishHeartPulseEvent(channel, eventType, businessId, payload, {
  retries: 2,  // Retry up to 2 times
})
```

---

## Consuming Events

### Frontend (React)

```typescript
import { useRealtimeMulti } from '@/lib/realtime'
import { HeartPulseEventType } from '@/lib/heart-pulse'

useRealtimeMulti([
  {
    channel: `private-station-${stationId}`,
    event: HeartPulseEventType.ITEMS_ROUTED_TO_STATION,
    onData: (event: HeartPulseEvent<ItemsRoutedPayload>) => {
      console.log('Correlation ID:', event.correlationId)
      console.log('Items routed:', event.payload.itemIds)
      fetchOrders()
    },
  },
])
```

### Backend (Pusher Webhooks)

```typescript
// Pusher webhook handler
app.post('/webhooks/pusher', (req, res) => {
  const events = req.body.events
  
  for (const event of events) {
    const heartPulseEvent: HeartPulseEvent = JSON.parse(event.data)
    
    console.log('Event received:', {
      eventId: heartPulseEvent.eventId,
      eventType: heartPulseEvent.eventType,
      correlationId: heartPulseEvent.correlationId,
    })
    
    // Process event
  }
  
  res.status(200).send('OK')
})
```

---

## Event Versioning

All events include `eventVersion` for schema evolution:

- **v1:** Current version (all events)
- **v2+:** Future versions (not yet defined)

When introducing breaking changes:
1. Increment `eventVersion`
2. Update payload types
3. Support both versions during transition
4. Deprecate old version after migration

---

## Observability

### Publish Statistics

```typescript
import { getPublishStats } from '@/lib/heart-pulse'

const stats = getPublishStats()
console.log(stats)
// {
//   totalPublished: 1234,
//   totalFailed: 5,
//   totalRetries: 12
// }
```

### Event Logs

All events are logged to console with structured data for aggregation:

```json
{
  "level": "info",
  "message": "[HeartPulse] Event published successfully",
  "eventId": "evt_abc123",
  "eventType": "order.created",
  "channel": "private-kitchen-business123",
  "correlationId": "corr_xyz789",
  "timestamp": "2026-07-10T16:42:00.000Z"
}
```

---

## Migration Guide

### From Legacy triggerEvent

**Before:**
```typescript
import { triggerEvent } from '@/lib/pusher-server'

await triggerEvent(`private-kitchen-${businessId}`, 'order.created', {
  orderId: sale.id,
  orderNumber: sale.orderNumber,
  timestamp: new Date().toISOString(),
})
```

**After:**
```typescript
import {
  publishHeartPulseEvent,
  HeartPulseEventType,
  HeartPulseChannel,
  type OrderCreatedPayload,
} from '@/lib/heart-pulse'

const payload: OrderCreatedPayload = {
  orderId: sale.id,
  orderNumber: sale.orderNumber,
  orderSource: sale.orderSource,
  items: [...],
}

await publishHeartPulseEvent(
  HeartPulseChannel.kitchen(businessId),
  HeartPulseEventType.ORDER_CREATED,
  businessId,
  payload,
  {
    correlationId: generateCorrelationId(),
    actor: { source: 'system' },
  }
)
```

---

## Best Practices

### DO

✅ Use `HeartPulseEventType` constants for event types  
✅ Use `HeartPulseChannel` helpers for channel names  
✅ Generate correlation IDs at workflow start  
✅ Include actor information when available  
✅ Handle publish failures gracefully  
✅ Log correlation IDs for debugging  

### DON'T

❌ Hard-code event type strings  
❌ Hard-code channel names  
❌ Ignore publish failures  
❌ Skip correlation IDs  
❌ Publish events without payload types  
❌ Create duplicate event types  

---

## Troubleshooting

### Event Not Received

1. Check Pusher configuration (app ID, key, secret)
2. Verify channel name matches subscription
3. Check event type matches subscription
4. Verify business context (private channels require auth)
5. Check browser console for Pusher errors

### Publish Failures

1. Check Pusher credentials
2. Verify network connectivity
3. Check payload size (Pusher limit: 10KB)
4. Review error logs for details
5. Enable retries for transient failures

### Correlation Tracking

1. Generate correlation ID at workflow start
2. Pass to all related event publishes
3. Log correlation ID in all workflow steps
4. Search logs by correlation ID for debugging

---

## Future Enhancements

The following are **not** in scope for PR01 but may be considered in future PRs:

- Event replay capability
- Dead letter queue for failed events
- Event sourcing integration
- Multi-region event synchronization
- Advanced analytics and dashboards
- Webhook delivery for external systems

---

## Support

For questions or issues with Heart Pulse Core:

1. Review this documentation
2. Check event catalog for event types
3. Review logs for correlation IDs
4. Contact engineering team

---

**End of Documentation**
