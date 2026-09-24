# FOUNDER-GPV-001 — Service Replay Journey

| Field | Value |
|---|---|
| Document ID | FOUNDER-GPV-001-SERVICE-REPLAY |
| Date | 2026-08-14 |
| Source | `src/pages/dashboard/operations/service-replay.tsx`, `src/lib/service-replay/`, `src/hooks/useServiceReplay.ts` |

## Overview

Service Replay allows managers to replay any service period and understand exactly what happened. It is described as "watching hospitality operations like replaying a football match."

## Implementation Status

**IMPLEMENTED** — Full Service Replay system with:
- `src/pages/dashboard/operations/service-replay.tsx` (49KB page)
- `src/lib/service-replay/types.ts` — Event types, categories, metadata
- `src/lib/service-replay/time-utils.ts` — Time formatting, presets
- `src/hooks/useServiceReplay.ts` — React hook for replay data

## Route & Access

| Field | Value |
|---|---|
| Route | `/dashboard/operations/service-replay` |
| Allowed roles | OWNER, MANAGER, ADMIN, SUPERVISOR |
| Auth | Server-side `getServerSideProps` check |

## Service Replay Features

### Timeline View
- Chronological list of all service events
- Events categorized by type (orders, kitchen, payments, reservations)
- Color-coded by event category
- Event descriptions with contextual information

### Playback Controls
- Play / Pause
- Skip Back / Skip Forward
- Rewind / Fast Forward
- Playback speed control
- Reset / Restart

### Time Range Selection
- Preset time ranges (today, last hour, custom)
- Calendar date picker
- Custom time range input

### Event Filtering
- Filter by event category
- Search by event type
- Filter by specific order or table

### Statistics
- Total events
- Events by category
- Service duration
- Key milestones

## Event Categories

Derived from `src/lib/service-replay/types.ts`:

| Category | Color | Events |
|---|---|---|
| Orders | Blue | Order created, order updated, order cancelled |
| Kitchen | Orange | Kitchen status transitions, dispatch, routing |
| Payments | Green | Payment initiated, payment success, payment failed |
| Reservations | Purple | Reservation created, confirmed, completed, cancelled, no-show |
| Promises | Red/Yellow | Promise warning, promise critical, promise fulfilled, promise failed |

## Founder Journey Steps

| Step | Action | Expected Result |
|---|---|---|
| SR-01 | Complete at least one service (orders, kitchen, payment) | Service events generated |
| SR-02 | Navigate to Service Replay | `/dashboard/operations/service-replay` loads |
| SR-03 | Select time range | Today's events or custom range selected |
| SR-04 | View timeline | Events displayed chronologically with descriptions |
| SR-05 | Use playback controls | Play, pause, skip through events |
| SR-06 | Filter by category | Only selected category events shown |
| SR-07 | Search for specific event | Matching events highlighted |
| SR-08 | Review statistics | Service performance metrics displayed |
| SR-09 | Select a specific event | Event detail with metadata shown |
| SR-10 | Answer: "What happened during this service?" | Timeline provides complete operational picture |

## What the Founder Should Be Able to Answer

After using Service Replay, the founder should be able to answer:

1. **"What happened during this service?"** — Complete timeline of events
2. **"When was the busiest period?"** — Event density in timeline
3. **"Were there any delays?"** — Promise WARNING/CRITICAL events
4. **"How long did orders take?"** — Order creation to kitchen ready duration
5. **"Were there any payment issues?"** — Payment failed events
6. **"What was the service flow?"** — Order → Kitchen → Ready → Served → Paid

## Data Sources

Service Replay reads from:
- `TicketEvent` — Append-only event log (recorded by TicketEventService)
- `Sale` — Order data
- `FinancialLedgerEntry` — Payment events
- `Reservation` — Reservation events
- `ServicePromise` — Promise state transitions

## Verification Points

1. Service Replay page loads without errors
2. Events from completed service appear in timeline
3. Events are in correct chronological order
4. Event descriptions are meaningful and accurate
5. Playback controls work (play, pause, skip)
6. Filtering by category works
7. Time range selection works
8. Statistics are accurate
9. Event detail view shows metadata
10. The founder can answer "What happened during this service?"

## Customer #1 Relevance

**IMPORTANT** — Service Replay is a key operational intelligence feature. It allows the business owner/manager to:
- Review service performance after the fact
- Identify bottlenecks and delays
- Train staff based on real service data
- Demonstrate operational transparency to stakeholders

## Known Limitations

1. Service Replay requires at least one service to have occurred — empty timeline on first use
2. Real-time Pusher events enhance the experience but are not required (polling fallback exists)
3. The depth of events depends on what services have been run — more services = richer replay
