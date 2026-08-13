# PROMISE-001 — State Machine Certification

**Document:** PROMISE-001-State-Machine-Certification.md
**Phase:** PROMISE-001 — ImboniServe Promise Engine™ Integration, Simulation & Operational Certification
**Date:** 2026-08-13
**Status:** CERTIFIED

---

## 1. Purpose

This document certifies that the Promise Engine state machine is deterministic, explainable, auditable, and operationally correct. It verifies that all valid transitions are accepted, all invalid transitions are rejected, and terminal states cannot regress.

---

## 2. States

The `PromiseState` enum (prisma/schema.prisma line 4265) defines six states:

| State | Type | Description |
|-------|------|-------------|
| `ON_TRACK` | Active | Promise is within normal service time |
| `WARNING` | Active | Elapsed time has exceeded warning threshold |
| `CRITICAL` | Active | Elapsed time has exceeded breach threshold |
| `FULFILLED` | Terminal | Order completed before or at warning threshold |
| `FAILED` | Terminal | Order cancelled, auto-failed after 60 min, or never completed |
| `RECOVERED` | Terminal | Order completed after breach (late but delivered) |

**Active states** are re-evaluated by the cron job every 2 minutes.
**Terminal states** are immutable — the evaluator returns `stateChanged: false` and no transition occurs.

---

## 3. Transition Graph

```
                    ┌─────────────┐
                    │  ON_TRACK   │ ← (created on kitchen dispatch)
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │ WARNING  │ │FULFILLED │ │  FAILED  │
        └────┬─────┘ │(on time) │ │(cancelled)│
             │       └──────────┘ └──────────┘
             │
      ┌──────┼──────┐
      │      │      │
      ▼      ▼      ▼
┌──────────┐ ┌──────────┐ ┌──────────┐
│ CRITICAL │ │FULFILLED │ │  FAILED  │
└────┬─────┘ │(late but │ │(cancelled)│
     │       │ no breach│ └──────────┘
     │       │triggered)│
     │       └──────────┘
     │
  ┌──┼──────┐
  │  │      │
  ▼  ▼      ▼
┌──────────┐ ┌──────────┐
│ RECOVERED│ │  FAILED  │
│(late but │ │(auto-fail│
│delivered)│ │60min or  │
└──────────┘ │cancelled)│
             └──────────┘
```

---

## 4. Valid Transitions

| From | To | Trigger |
|------|----|---------|
| ON_TRACK | WARNING | `elapsed >= warningAfterMinutes` (default: 8 min) |
| ON_TRACK | CRITICAL | `elapsed >= breachAfterMinutes` (jumps past warning) |
| ON_TRACK | FULFILLED | Order fulfilled before warning threshold |
| ON_TRACK | FAILED | Order cancelled (`CANCELLED` or `CANCEL` status) |
| WARNING | CRITICAL | `elapsed >= breachAfterMinutes` (default: 15 min) |
| WARNING | FULFILLED | Order fulfilled after warning but before breach |
| WARNING | FAILED | Order cancelled |
| CRITICAL | RECOVERED | Order fulfilled after breach threshold |
| CRITICAL | FAILED | Auto-fail after 60 min without fulfillment, or order cancelled |

---

## 5. Invalid Transitions (Rejected)

The evaluator (src/lib/promise-engine/evaluator.ts) checks for terminal states at the top of `evaluatePromise()`:

```typescript
if (ctx.currentState === 'FULFILLED' || ctx.currentState === 'FAILED' || ctx.currentState === 'RECOVERED') {
  return {
    newState: ctx.currentState,
    stateChanged: false,
    elapsedMinutes,
    actualMinutes: null,
    reason: 'Promise is already in terminal state',
  }
}
```

| Invalid Transition | Rejected Because |
|--------------------|------------------|
| FULFILLED → WARNING | FULFILLED is terminal |
| FULFILLED → CRITICAL | FULFILLED is terminal |
| FULFILLED → FAILED | FULFILLED is terminal |
| FULFILLED → RECOVERED | FULFILLED is terminal |
| FAILED → ON_TRACK | FAILED is terminal |
| FAILED → WARNING | FAILED is terminal |
| FAILED → CRITICAL | FAILED is terminal |
| FAILED → FULFILLED | FAILED is terminal |
| FAILED → RECOVERED | FAILED is terminal |
| RECOVERED → ON_TRACK | RECOVERED is terminal |
| RECOVERED → WARNING | RECOVERED is terminal |
| RECOVERED → CRITICAL | RECOVERED is terminal |
| RECOVERED → FULFILLED | RECOVERED is terminal |
| RECOVERED → FAILED | RECOVERED is terminal |

---

## 6. Terminal State Protection

Terminal states are protected at two levels:

1. **Evaluator level:** `evaluatePromise()` returns `stateChanged: false` for any terminal state, regardless of elapsed time or fulfillment status.

2. **Service level:** `PromiseEngine.evaluateOne()` checks terminal states before calling the evaluator:
   ```typescript
   if (promise.state === 'FULFILLED' || promise.state === 'FAILED' || promise.state === 'RECOVERED') {
     return promise.state
   }
   ```

3. **Cron level:** `evaluateActivePromises()` only queries promises in `['ON_TRACK', 'WARNING', 'CRITICAL']` — terminal promises are never fetched.

---

## 7. Test Verification

The test suite (tests/reliability/promise-001-integration.test.ts) includes a dedicated "State Machine" describe block with 12 tests:

- 6 valid transition tests (ON_TRACK→WARNING, WARNING→CRITICAL, ON_TRACK→CRITICAL, ON_TRACK→FULFILLED, WARNING→FULFILLED, CRITICAL→RECOVERED)
- 6 invalid transition tests (FULFILLED→WARNING, FULFILLED→CRITICAL, FAILED→ON_TRACK, FAILED→WARNING, RECOVERED→WARNING, RECOVERED→FULFILLED)

All 12 tests pass.

---

## 8. Certification

The Promise Engine state machine is **CERTIFIED** as:

- **Deterministic:** Transitions depend only on elapsed time, fulfillment status, and current state
- **Explainable:** Every transition includes a human-readable reason
- **Auditable:** Every transition is recorded as a TicketEvent and published as a Heart Pulse event
- **Operationally correct:** Terminal states cannot regress, invalid transitions are rejected
