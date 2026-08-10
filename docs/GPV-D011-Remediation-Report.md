# GPV-D011 Remediation Report — Z-Report GET Reservation Query

| Field | Value |
|---|---|
| Defect ID | GPV-D011 |
| Severity | P2 |
| Status | **REMEDIATED** |
| Remediated | 2026-08-09 |
| Component | Close-Day / Z-Report / Reservations |

## Root Cause

The Z-Report GET endpoint (`GET /api/reports/close-day`) in `src/pages/api/reports/close-day.ts` queried `prisma.reservation.groupBy()` using the field name `date` in the `where` clause. The `Reservation` Prisma model has no field named `date` — the correct field is `reservationDate` (schema line 2033). This caused a `PrismaClientValidationError` with the message "Unknown argument `date`. Did you mean `table`?" which resulted in a 500 error for every Z-Report GET request.

## Impact (Pre-Fix)

1. **Z-Report GET completely broken** — the endpoint returned 500 for every request
2. **Frontend close-day screen non-functional** — the dashboard could not display the Z-Report before closing the day
3. **Workaround existed** — the Close-Day POST endpoint worked (it doesn't query reservations), and direct database queries could retrieve the data, but the standard UI flow was broken

## Investigation

### Exact Error (from server logs)

```
PrismaClientValidationError:
Invalid `prisma.reservation.groupBy()` invocation:
  where: {
    businessId: "cmsk4x4c900026gygb3x5f8r6",
    date: {
    ~~~~
Unknown argument `date`. Did you mean `table`?
```

### Field Name Verification

- **Schema:** `prisma/schema.prisma` line 2033: `reservationDate DateTime` — the canonical field name
- **All other queries:** `reservation.service.ts` uses `reservationDate` in 9 locations (lines 116, 133, 444, 494, etc.)
- **Only the Z-Report GET** used the incorrect `date` field name

### Date Semantics

The Z-Report GET endpoint already correctly computed the timezone-aware day boundary at line 25:
```typescript
const { start: dayStart, end: dayEnd } = getBusinessDayBoundary(targetDate, business?.timezone)
```

This uses the business's configured timezone (e.g., `Africa/Kigali`) to determine the local midnight-to-midnight range, converted to UTC. The fix only needed to change the field name from `date` to `reservationDate` — the date semantics were already correct.

### Timezone Compliance (GR-001A)

The fix respects the business's configured timezone:
- `getBusinessDayBoundary` uses the business's `timezone` field from the database
- The day boundary is computed in the business's local time, then converted to UTC
- This is consistent with GR-001A: "Geography is configuration, never code"
- No Rwanda-specific assumptions are hardcoded

## Remediation

### Files Changed

| File | Change |
|---|---|
| `src/pages/api/reports/close-day.ts` | Changed `date` to `reservationDate` in `reservation.groupBy()` where clause (line 92) |

### The Fix

```diff
- date: { gte: dayStart, lte: dayEnd },
+ reservationDate: { gte: dayStart, lte: dayEnd },
```

This is the smallest possible correct change — a single field name correction. No other logic, queries, or financial calculations were modified.

## Verification

### Unit Tests

**File:** `tests/reliability/gpv-d011-zreport-reservation.test.ts`
**Result:** 16 tests PASS, 0 FAIL

Test coverage:
- Reservation query uses `reservationDate` (not `date`)
- Correct day boundary passed to `reservationDate`
- Business isolation (only this business's reservations)
- Group by status with count by id
- Z-Report response includes reservation data with correct counts
- Empty reservation case handled without error
- Financial totals not affected by reservation fix
- Ledger cross-check still works
- Tax calculation still works
- Timezone-aware day boundary used for both sales and reservations
- Same day boundary used consistently across all queries

### End-to-End Tests

**File:** `scripts/gpv-d011-verify-fix.js`
**Result:** 18 tests PASS, 0 FAIL

Critical invariants verified against live API + database:
- Z-Report GET returns 200 (was 500 before fix)
- Reservation data correctly aggregated by status (COMPLETED: 2, CANCELLED: 3, NO_SHOW: 1)
- Timezone-aware day boundary working (dayStart: 2026-08-08T22:00:00Z = midnight Kigali)
- Financial totals present and correct (totalRevenueCents, ledgerTotalRevenueCents)
- Ledger cross-check match: true, variance: 0
- Outstanding liabilities present
- Payment breakdown present
- Sales list present
- Close-Day POST behavior not regressed
- Z-Report GET after close still works with isClosed: true
- Financial totals unchanged after close

### Regression Tests

- 379 reliability tests pass (11 suites) — no regressions
- No new TypeScript errors in close-day.ts
- Production build succeeds

## Conclusion

GPV-D011 is fully remediated. The Z-Report GET endpoint now correctly queries reservations using the `reservationDate` field. The fix is a single field name correction that preserves all existing financial logic, timezone handling, and close-day behavior.
