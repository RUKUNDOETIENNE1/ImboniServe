# GPV-D012 Remediation Report — Reservation Lifecycle Integrity

| Field | Value |
|---|---|
| Defect ID | GPV-D012 |
| Severity | P1 |
| Status | **REMEDIATED** |
| Remediated | 2026-08-09 |
| Component | Reservations / Table Management |

## Root Cause

The PATCH endpoint `/api/reservations/[id]` called `ReservationService.updateStatus(id, status)` for all status changes. This method only updates the `status` field on the reservation record — it does NOT call the domain-specific methods that enforce business invariants:

| Status Change | Method Called (pre-fix) | Method That Should Be Called | Missing Side Effects |
|---|---|---|---|
| → CONFIRMED | `updateStatus()` | `confirmReservation()` | `confirmedAt` not set, table not auto-reserved |
| → COMPLETED | `updateStatus()` | `completeReservation()` | `completedAt` not set, table not released |
| → CANCELLED | `updateStatus()` | `cancelReservation()` | table not released |
| → NO_SHOW | `updateStatus()` | `markNoShow()` | `forfeitCents`/`noShowReason` not set, table not released |

The frontend (`src/pages/dashboard/reservations.tsx`) uses PATCH for all status changes (Confirm, Complete, Cancel buttons). The dedicated `/api/reservations/[id]/cancel` endpoint (which correctly calls `cancelReservation()`) was not used by the frontend.

## Impact (Pre-Fix)

1. **Table double-booking:** Confirmed reservations did not set table status to RESERVED. Multiple confirmed reservations could be assigned the same table.
2. **Tables stuck in wrong state:** Completing/cancelling via PATCH did not release tables back to AVAILABLE.
3. **Broken audit trail:** `confirmedAt` and `completedAt` timestamps were never set when staff used the dashboard UI.
4. **No-show deposits:** `forfeitCents` and `noShowReason` were never set when marking no-show via PATCH.

## Remediation

### Files Changed

| File | Change |
|---|---|
| `src/pages/api/reservations/[id].ts` | Replaced `updateStatus(id, status)` with switch statement routing to domain methods |

### Architectural Correction

The PATCH handler now routes status changes to the appropriate domain method via a switch statement:

```typescript
switch (status) {
  case 'CONFIRMED':
    await ReservationService.confirmReservation(id)  // sets confirmedAt + auto-reserves table
    break
  case 'COMPLETED':
    await ReservationService.completeReservation(id)  // sets completedAt + releases table
    break
  case 'CANCELLED':
    await ReservationService.cancelReservation(id, req.body.reason)  // releases table
    break
  case 'NO_SHOW':
    await ReservationService.markNoShow(id, req.body.forfeitCents || 0, req.body.reason || 'Marked as no-show')
    break
  case 'SEATED':
    await ReservationService.updateStatus(id, status)  // simple status marker
    break
  default:
    return res.status(400).json({ error: `Invalid status: ${status}` })
}
```

Additional changes:
- Table assignment (`tableId`) is processed BEFORE status so `confirmReservation()` can auto-reserve the newly-assigned table in the same request
- Unknown statuses are rejected with 400 Bad Request
- Cancelled reservation confirmation attempts return 409 Conflict
- Domain method errors are caught and mapped to appropriate HTTP status codes

### Design Rationale

This is the smallest architectural correction consistent with existing domain boundaries:
- The domain methods (`confirmReservation`, `completeReservation`, `cancelReservation`, `markNoShow`) already existed and were used by other callers (cron jobs, reminder service, dedicated cancel endpoint)
- The fix routes the PATCH handler to these same methods — no new domain logic was created
- `updateStatus()` is retained for `SEATED` (a simple status marker with no side effects) and remains available for other simple transitions
- The frontend requires no changes — it still sends `{ status: 'CONFIRMED' }` via PATCH, but the API now routes it correctly

## Verification

### Unit Tests

**File:** `tests/reliability/gpv-d012-reservation-lifecycle.test.ts`
**Result:** 34 tests PASS, 0 FAIL

Test coverage:
- `confirmReservation()`: sets status, sets confirmedAt, auto-reserves table, idempotent, throws on cancelled, no table-reserve if no table, transactional
- `completeReservation()`: sets status, sets completedAt, releases table, no release if no table, transactional
- `cancelReservation()`: sets status, releases table, stores reason, transactional
- `markNoShow()`: sets status, sets forfeitCents/noShowReason, releases table, transactional
- `forfeitDeposit()`: sets depositStatus=FORFEITED + status=CANCELLED, releases table
- API handler routing: correct method signatures for all domain methods
- Table synchronization invariant: confirmed → RESERVED, completed/cancelled/no-show → AVAILABLE
- Full lifecycle sequences: PENDING → CONFIRMED → COMPLETED, PENDING → CONFIRMED → CANCELLED, PENDING → CONFIRMED → NO_SHOW

### End-to-End Tests

**File:** `scripts/gpv-d012-verify-fix.js`
**Result:** 24 tests PASS, 0 FAIL

Critical invariants verified against live API + database:
- PATCH status=CONFIRMED → `confirmedAt` set (was null before fix)
- PATCH status=CONFIRMED → table status = RESERVED (was AVAILABLE before fix — **the critical double-booking fix**)
- PATCH status=COMPLETED → `completedAt` set (was null before fix)
- PATCH status=COMPLETED → table released to AVAILABLE
- PATCH status=CANCELLED → table released to AVAILABLE
- PATCH status=NO_SHOW → forfeitCents=5000, noShowReason set, table released
- Idempotency: second confirm is a no-op (confirmedAt unchanged)
- Invalid status rejected with 400
- Cancelled reservation cannot be confirmed (409)

### Regression Tests

- 78 existing tests pass (gpv-d010, gpv-d012, cr-001a, oec-001h)
- 363 reliability tests pass (10 suites)
- No new TypeScript errors introduced
- Production build succeeds

## Conclusion

GPV-D012 is fully remediated. The reservation lifecycle now enforces business invariants through authoritative domain methods. The critical table double-booking risk is eliminated — confirmed reservations automatically set their table to RESERVED, preventing walk-in seating conflicts.
