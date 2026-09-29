# FOUNDER-GPV-001 — Promise Engine Journey

| Field | Value |
|---|---|
| Document ID | FOUNDER-GPV-001-PROMISE-ENGINE |
| Date | 2026-08-14 |
| Certification | PROMISE-001 GREEN |
| Source | `src/lib/promise-engine/promise-engine.service.ts`, `src/pages/dashboard/operations/service-risks.tsx`, `src/pages/dashboard/operations/service-replay.tsx` |

## Overview

The Promise Engine tracks service promises made to customers (e.g., "your food will be ready in 15 minutes") and alerts staff when promises are at risk of being broken. PROMISE-001 is certified GREEN.

## Promise Lifecycle

```
ORDER DISPATCHED TO KITCHEN
     │
     ▼
PromiseEngine.createOrUpdatePromise()
     │
     ├── Creates ServicePromise (idempotent: one per sale+promiseType)
     ├── State: PENDING
     ├── warningAfterMinutes: 8 (default)
     ├── breachAfterMinutes: 15 (default)
     │
     ▼
PENDING (0-8 minutes)
     │  Order is being prepared
     │  No alerts yet
     │
     ▼
WARNING (8-15 minutes)
     │  ⚠️ Order is taking longer than expected
     │  Heart Pulse event published
     │  Staff notification sent (WhatsApp)
     │  Appears in Service Risks dashboard
     │
     ▼
CRITICAL (15+ minutes)
     │  🚨 Promise has been breached
     │  AlertDeliveryService escalation (email/Slack)
     │  Appears in Service Risks dashboard as CRITICAL
     │
     ├── IF KITCHEN MARKS READY
     │    └── State → FULFILLED (promise kept)
     │
     ├── IF 60 MINUTES ELAPSED
     │    └── State → FAILED (auto-fail)
     │
     └── IF ORDER CANCELLED
          └── State → FAILED
```

## Founder-Visible Experience

### What the Founder Sees

| Time | What Happens | Where It's Visible |
|---|---|---|
| 0 min | Order dispatched, promise created | Kitchen display (pending column) |
| 0-8 min | Order being prepared | Kitchen display (accepted → preparing) |
| 8 min | WARNING state triggered | Service Risks dashboard shows WARNING |
| 8 min | Staff WhatsApp notification sent | Staff phone (if Twilio configured) |
| 8 min | Heart Pulse event published | Real-time Pusher event |
| 15 min | CRITICAL state triggered | Service Risks dashboard shows CRITICAL |
| 15 min | Email/Slack escalation sent | Alert email/Slack channel |
| Kitchen ready | FULFILLED state | Promise resolved, removed from active risks |
| 60 min | FAILED (auto-fail) | Promise failed, appears in today's stats |

### Service Risks Dashboard

**Route**: `/dashboard/operations/service-risks`
**Allowed roles**: OWNER, MANAGER, ADMIN, SUPERVISOR, CHEF, KITCHEN_STAFF
**Auto-refresh**: Every 30 seconds

| Display | Description |
|---|---|
| Active risks list | Orders currently in WARNING or CRITICAL state |
| Risk stats | Today: total, fulfilled, failed, recovered, onTimeRate |
| Per-risk detail | orderNumber, promiseType, state, elapsedMinutes, warningAfter, breachAfter, expectedAt, startedAt |

### Service Replay Dashboard

**Route**: `/dashboard/operations/service-replay`
**Allowed roles**: OWNER, MANAGER, ADMIN, SUPERVISOR

| Display | Description |
|---|---|
| Timeline of events | All service events in chronological order |
| Playback controls | Play, pause, skip, speed control |
| Event categories | Orders, kitchen, payments, reservations |
| Statistics | Service performance metrics |
| Time range presets | Today, last hour, custom range |

## Founder Journey Steps

| Step | Action | Route | Expected Result |
|---|---|---|---|
| P-01 | Place an order (as guest) | QR → order | Order dispatched to kitchen |
| P-02 | Open Service Risks | `/dashboard/operations/service-risks` | Active risks visible (initially none or the new order in PENDING) |
| P-03 | Wait 8+ minutes | — | Order transitions to WARNING state |
| P-04 | Check Service Risks | Service Risks dashboard | Order shown with WARNING state, elapsed time |
| P-05 | Wait 15+ minutes | — | Order transitions to CRITICAL state |
| P-06 | Check Service Risks | Service Risks dashboard | Order shown with CRITICAL state |
| P-07 | Mark order ready (kitchen) | Kitchen display → Mark Ready | Promise transitions to FULFILLED |
| P-08 | Check Service Risks | Service Risks dashboard | Risk removed from active list |
| P-09 | Check today's stats | Service Risks dashboard | Stats show: total, fulfilled, onTimeRate |
| P-10 | Open Service Replay | `/dashboard/operations/service-replay` | Timeline shows all events for the service |
| P-11 | Play back the service | Service Replay controls | Events play in chronological order |
| P-12 | Review statistics | Service Replay stats | Service performance metrics visible |

## Important Notes for Founder

1. **Do NOT manipulate clocks or database state** — The Promise Engine uses real time. To see WARNING/CRITICAL states, the founder must either wait or create orders with short thresholds.

2. **Normal operational behavior** — The founder should test normal operational behavior where practical. The deeper deterministic simulation has already been performed by engineering (PROMISE-001 certified).

3. **Promise creation is automatic** — Promises are created automatically by KitchenDispatchService when an order is dispatched to kitchen. No manual action is needed.

4. **Fulfillment is automatic** — When kitchen marks an order as "ready", the promise is automatically marked as FULFILLED.

5. **Recovery** — If a promise was in WARNING/CRITICAL and then the order is marked ready, it transitions to FULFILLED (recovered). The stats track "recovered" count.

## Default Thresholds

| Threshold | Default | Configurable |
|---|---|---|
| Warning | 8 minutes | Yes — via SLAProfile or override |
| Breach (Critical) | 15 minutes | Yes — via SLAProfile or override |
| Auto-fail | 60 minutes | Fixed |

## Customer #1 Relevance

**IMPORTANT** — The Promise Engine is a key differentiator for ImboniServe. It demonstrates operational intelligence that helps staff keep promises to customers. For Customer #1:
- Staff can see which orders are at risk
- Management can review service performance
- The system proactively alerts staff before promises are broken
- Service Replay provides post-service analysis

## Verification Points

1. Promise is created when order is dispatched to kitchen
2. WARNING state appears after threshold (8 min default)
3. CRITICAL state appears after breach threshold (15 min default)
4. FULFILLED state when kitchen marks ready
5. Service Risks dashboard shows correct active risks
6. Service Risks stats are accurate
7. Service Replay shows timeline of events
8. Service Replay playback works
9. Notifications are sent (if Twilio/Slack configured)
10. Heart Pulse events are published (if Pusher configured)
