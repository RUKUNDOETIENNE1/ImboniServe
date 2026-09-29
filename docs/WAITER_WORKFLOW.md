# Waiter Operational Workflow Core

**PR02 Implementation Documentation**

---

## Overview

The Waiter Operational Workflow enables restaurant staff to manage the complete customer order journey from kitchen preparation to table delivery using real-time operational information.

**Objective:** Enable waiters to confidently complete customer orders without asking kitchen or bar for status updates.

---

## Business Workflow

```
Customer places order
         ↓
Heart Pulse publishes events
         ↓
Kitchen prepares food
         ↓
Bar prepares drinks
         ↓
Stations update progress
         ↓
Waiter receives live updates
         ↓
Waiter collects completed items
         ↓
Waiter serves customer
         ↓
Order marked delivered
```

---

## Workflow Stages

### 1. Waiting for Preparation
**Status:** `kitchenStatus: 'pending' | 'accepted'`

Orders that have been dispatched to kitchen but not yet started.

**Waiter Action:** None (informational only)

---

### 2. Preparing
**Status:** `kitchenStatus: 'preparing' | 'almost_ready'`

Orders actively being prepared by kitchen/bar stations.

**Waiter Action:** Monitor progress

**Display:**
- Station-level progress (e.g., Kitchen: 3/5 items ready)
- Wait time
- Priority indicators (normal/urgent/delayed)

---

### 3. Ready for Pickup
**Status:** `kitchenStatus: 'ready'` AND `expoStatus: 'READY_FOR_EXPO'`

All stations have completed their items. Order is ready for waiter collection.

**Waiter Action:** Mark as "Picked Up"

**Triggers:**
- Visual priority indicator
- Urgent notification if waiting > 15 minutes
- Delayed alert if waiting > 30 minutes

---

### 4. Picked Up
**Status:** `expoStatus: 'EXPO_CONFIRMED'`

Waiter has collected the order and is en route to customer table.

**Waiter Action:** Mark as "Delivered"

---

### 5. Delivered
**Status:** `kitchenStatus: 'served'` AND `expoStatus: 'SERVED_CONFIRMED'`

Order successfully delivered to customer. Workflow complete.

**Waiter Action:** None (completed)

---

## Heart Pulse Events

### Events Consumed

| Event | Purpose |
|---|---|
| `order.created` | New order enters queue |
| `order.updated` | Kitchen status changes |
| `kitchen.status.changed` | Order progresses through stages |
| `item.status.changed` | Individual item updates |
| `order.ready_for_pickup` | Order becomes ready |
| `order.picked_up` | Another waiter picked up order |
| `order.delivered` | Order completed |

### Events Published

| Event | Trigger | Payload |
|---|---|---|
| `order.ready_for_pickup` | Kitchen marks order as 'ready' | `OrderReadyForPickupPayload` |
| `order.picked_up` | Waiter marks order as picked up | `OrderPickedUpPayload` |
| `order.delivered` | Waiter marks order as delivered | `OrderDeliveredPayload` |

---

## API Endpoints

### GET `/api/waiter/queue`

Returns real-time waiter queue grouped by workflow stage.

**Response:**
```json
{
  "success": true,
  "queue": {
    "waitingForPreparation": [...],
    "preparing": [...],
    "readyForPickup": [...],
    "pickedUp": [...],
    "delivered": [...]
  },
  "summary": {
    "total": 15,
    "readyForPickup": 3,
    "urgent": 2,
    "delayed": 1
  }
}
```

---

### POST `/api/waiter/pickup-order`

Marks an order as picked up by waiter.

**Request:**
```json
{
  "orderId": "clx..."
}
```

**Workflow:**
1. Validates order is ready (`kitchenStatus: 'ready'`)
2. Updates `expoStatus` to `EXPO_CONFIRMED`
3. Sets `expoConfirmedAt` timestamp
4. Publishes `order.picked_up` event via Heart Pulse
5. Notifies all connected interfaces

---

### POST `/api/waiter/deliver-order`

Marks an order as delivered to customer.

**Request:**
```json
{
  "orderId": "clx..."
}
```

**Workflow:**
1. Validates order has been picked up
2. Updates `kitchenStatus` to `'served'`
3. Updates `expoStatus` to `SERVED_CONFIRMED`
4. Sets `servedAt` and `servedConfirmedAt` timestamps
5. Updates all items to `DELIVERED` status
6. Publishes `order.delivered` event via Heart Pulse
7. Completes operational workflow

---

## Priority Indicators

### Normal
**Condition:** Wait time < 15 minutes

**Display:** White background, gray border

---

### Urgent
**Condition:** Wait time ≥ 15 minutes AND < 30 minutes

**Display:** Orange background, orange border, "URGENT" badge

**Purpose:** Alert waiter to prioritize pickup

---

### Delayed
**Condition:** Wait time ≥ 30 minutes OR ready for pickup > 15 minutes

**Display:** Red background, red border, "DELAYED" badge (animated pulse)

**Purpose:** Critical attention required

---

## Live Synchronization

All workflow changes automatically update across:

- **Waiter Dashboard** (`/dashboard/waiter`)
- **Kitchen Display** (`/dashboard/kitchen`)
- **Station Displays** (`/dashboard/kds`)
- **Customer Order View** (QR order tracking)

**Mechanism:** Heart Pulse events via Pusher WebSocket

**Channels:**
- `private-business-{businessId}` - Business-wide updates
- `private-order-{orderId}` - Order-specific updates
- `private-kitchen-{businessId}` - Kitchen updates

**No polling. No manual refresh required.**

---

## Station Progress Tracking

Each order displays station-level completion:

```
Kitchen: 3/5 items ✓
Bar: 2/2 items ✓
Grill: 1/3 items ⏱
```

**Purpose:** Enable partial pickup decisions and visibility into preparation bottlenecks.

---

## User Experience Principles

The dashboard answers four operational questions:

1. **What needs my attention now?**
   → Ready for Pickup section with priority indicators

2. **What is ready?**
   → Station progress with checkmarks

3. **What am I currently delivering?**
   → Picked Up section

4. **What has already been completed?**
   → Delivered section (collapsed)

---

## Architectural Integration

### Reuses Existing Infrastructure

- Heart Pulse Core (PR01)
- Existing `Sale` and `SaleItem` models
- Existing `expoStatus` field
- Existing station routing
- Existing authentication
- Existing Pusher transport

### No Architectural Changes

- No new database tables
- No parallel communication mechanisms
- No duplicated business logic
- No redesigned workflows

---

## Backward Compatibility

✅ **All existing workflows preserved:**

- QR ordering workflow unchanged
- Kitchen dispatch workflow unchanged
- Station routing workflow unchanged
- Kitchen Display System unchanged
- Kitchen Consumption Engine unchanged
- Real-time customer notifications unchanged

**No breaking changes introduced.**

---

## Files Created

### Backend APIs
1. `src/pages/api/waiter/queue.ts` - Waiter queue endpoint
2. `src/pages/api/waiter/pickup-order.ts` - Pickup workflow
3. `src/pages/api/waiter/deliver-order.ts` - Delivery workflow

### Frontend
4. `src/pages/dashboard/waiter.tsx` - Waiter dashboard UI

### Infrastructure
5. `src/lib/heart-pulse/event-catalog.ts` - Extended with waiter events
6. `src/lib/heart-pulse/index.ts` - Exported new payload types

### Documentation
7. `docs/WAITER_WORKFLOW.md` - This file

---

## Files Modified

1. `src/pages/api/kitchen/update-status.ts`
   - Added `ORDER_READY_FOR_PICKUP` event emission
   - Updates `expoStatus` to `READY_FOR_EXPO` when order becomes ready
   - Includes station summary in ready event

---

## Acceptance Criteria

| Criterion | Status | Evidence |
|---|---|---|
| Waiters receive live operational updates | ✅ PASS | Heart Pulse integration via Pusher |
| Orders automatically move through workflow stages | ✅ PASS | Event-driven state transitions |
| Partial station completion is clearly represented | ✅ PASS | Station progress display with checkmarks |
| Pickup updates propagate through Heart Pulse | ✅ PASS | `order.picked_up` event published |
| Delivery updates propagate through Heart Pulse | ✅ PASS | `order.delivered` event published |
| No manual refresh is required | ✅ PASS | WebSocket-based live updates |
| Existing customer workflows remain unchanged | ✅ PASS | No breaking changes |
| No architectural duplication is introduced | ✅ PASS | Reuses Heart Pulse Core |

**Overall:** ✅ **8/8 PASS**

---

## Testing Validation

### Manual Validation Performed

1. ✅ Queue loads correctly with grouped orders
2. ✅ Priority indicators display based on wait time
3. ✅ Station progress shows accurate completion status
4. ✅ Pickup workflow updates order status and publishes events
5. ✅ Delivery workflow completes order and updates all items
6. ✅ Live updates refresh queue automatically
7. ✅ Multiple waiters see synchronized state
8. ✅ Customer view receives delivery notifications

### Build Status

- TypeScript compilation: ✅ No errors in new files
- Lint status: ✅ Clean
- Heart Pulse integration: ✅ All events properly typed

---

## Operational Usage

### For Waiters

1. Open `/dashboard/waiter`
2. Monitor "Ready for Pickup" section
3. When order is ready, click "Mark as Picked Up"
4. Collect items from kitchen/bar
5. Deliver to customer table
6. Click "Mark as Delivered"

### For Kitchen Staff

No changes to existing workflow. Kitchen continues to:
1. Accept orders
2. Update status to "preparing"
3. Mark items as ready
4. Update order to "ready"

Waiter workflow automatically receives updates.

---

## Success Metrics

**Success is achieved when:**

A waiter can confidently complete an entire customer order—from preparation to table service—using real-time operational information without needing to ask the kitchen or bar for status updates.

**Operational excellence over feature count.**

---

## Out of Scope (Future PRs)

The following were explicitly excluded from PR02:

- Manager analytics
- Waiter performance metrics
- AI recommendations
- Route optimization
- Staff scheduling
- Predictive delays
- Heat maps
- Historical analytics
- Restaurant Health™
- Multi-branch coordination

These belong to the Strategic Vision and may be considered in future PRs.

---

## Next Steps

PR02 is complete. Awaiting:

1. Engineering review
2. Merge approval
3. Production deployment authorization

**No further implementation authorized until explicit PR approval.**

---

**Implementation Date:** 2026-07-10  
**Status:** Complete  
**PR:** PR02 - Waiter Operational Workflow Core
