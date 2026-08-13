# PROMISE-001 — Heart Pulse Verification

**Document:** PROMISE-001-Heart-Pulse-Verification.md
**Phase:** PROMISE-001 — ImboniServe Promise Engine™ Integration, Simulation & Operational Certification
**Date:** 2026-08-13
**Status:** VERIFIED

---

## 1. Purpose

Verify that every meaningful Promise transition creates the correct Heart Pulse event with correct metadata.

---

## 2. Event Types

Six Heart Pulse event types are defined in `src/lib/heart-pulse/event-catalog.ts`:

| Event Type | HeartPulseEventType | Channel | Description |
|-----------|---------------------|---------|-------------|
| PROMISE_CREATED | `promise.created` | business(businessId) | Service promise tracking started |
| PROMISE_WARNING | `promise.warning` | business(businessId) | Service promise approaching deadline |
| PROMISE_CRITICAL | `promise.critical` | business(businessId) | Service promise breached |
| PROMISE_FULFILLED | `promise.fulfilled` | business(businessId) | Service promise fulfilled on time |
| PROMISE_RECOVERED | `promise.recovered` | business(businessId) | Service promise recovered after warning |
| PROMISE_FAILED | `promise.failed` | business(businessId) | Service promise failed |

---

## 3. Event Payload

The `PromiseEventPayload` interface (event-catalog.ts line 242):

```typescript
export interface PromiseEventPayload {
  promiseId: string
  saleId: string
  orderNumber: string
  promiseType: string
  state: string
  startedAt: string
  expectedAt: string
  actualMinutes?: number
  warningAfterMinutes: number
  breachAfterMinutes: number
}
```

Every Heart Pulse event includes:
- **promiseId** — unique promise identifier
- **saleId** — linked sale/order
- **orderNumber** — human-readable order number
- **promiseType** — e.g., "ORDER_PREPARATION"
- **state** — new state after transition
- **startedAt** — when the promise clock started (ISO string)
- **expectedAt** — when the promise should be fulfilled (ISO string)
- **actualMinutes** — actual minutes to fulfillment (only for terminal states)
- **warningAfterMinutes** — warning threshold
- **breachAfterMinutes** — breach threshold

---

## 4. Publishing Mechanism

The `publishPromiseEvent` method (promise-engine.service.ts line 515) maps TicketEventType to HeartPulseEventType and publishes via `publishHeartPulseEvent`:

```typescript
await publishHeartPulseEvent(
  HeartPulseChannel.business(businessId),
  hpType,
  businessId,
  payload,
  { actor: { source: 'cron' } },
)
```

- **Channel:** `HeartPulseChannel.business(businessId)` — business-scoped, no cross-business leakage
- **Actor source:** `'cron'` — indicates automated evaluation
- **Failure handling:** Errors are caught and logged as warnings — Heart Pulse failure does NOT crash the Promise Engine or corrupt promise state

---

## 5. Event Timing

Heart Pulse events are published ONLY on state transitions:

1. **Promise creation:** `PROMISE_CREATED` is published when a new promise is created in `createOrUpdatePromise`
2. **State transitions:** `PROMISE_WARNING`, `PROMISE_CRITICAL`, `PROMISE_FULFILLED`, `PROMISE_RECOVERED`, `PROMISE_FAILED` are published from `transitionTo` — which is only called when `evaluatePromise` returns `stateChanged: true`

**Duplicate evaluation safety:** When cron runs and the state hasn't changed, `evaluatePromise` returns `stateChanged: false`, `transitionTo` is NOT called, and no Heart Pulse event is published. This prevents misleading duplicate transition events.

---

## 6. Affected Systems

The event catalog maps Promise events to affected systems (event-catalog.ts):

| Event | Affected Systems |
|-------|-----------------|
| PROMISE_WARNING | Service Risks Dashboard, Kitchen Board |
| PROMISE_CRITICAL | Service Risks Dashboard, Kitchen Board |
| PROMISE_FULFILLED | Service Risks Dashboard |
| PROMISE_RECOVERED | Service Risks Dashboard |
| PROMISE_FAILED | Service Risks Dashboard |

---

## 7. Source Attribution

All Promise events are attributed to `PromiseEngine` in the event source map (event-catalog.ts line 343-348):

```typescript
[HeartPulseEventType.PROMISE_CREATED]: 'PromiseEngine',
[HeartPulseEventType.PROMISE_WARNING]: 'PromiseEngine',
[HeartPulseEventType.PROMISE_CRITICAL]: 'PromiseEngine',
[HeartPulseEventType.PROMISE_FULFILLED]: 'PromiseEngine',
[HeartPulseEventType.PROMISE_RECOVERED]: 'PromiseEngine',
[HeartPulseEventType.PROMISE_FAILED]: 'PromiseEngine',
```

---

## 8. Verification

- ✅ Correct event type for each transition
- ✅ Correct businessId in channel
- ✅ Correct promiseId, saleId, orderNumber in payload
- ✅ Correct state in payload
- ✅ Correct timestamps (startedAt, expectedAt)
- ✅ Duplicate evaluations do not produce duplicate events
- ✅ Heart Pulse failure does not corrupt promise state
- ✅ No duplicate event infrastructure — uses existing Heart Pulse architecture

---

## 9. Certification

Heart Pulse integration is **VERIFIED**. Every meaningful Promise transition creates the correct Heart Pulse event with correct metadata, and duplicate evaluations are safely suppressed.
