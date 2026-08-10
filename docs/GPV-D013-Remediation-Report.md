# GPV-D013 Remediation Report — BigInt JSON Serialization

| Field | Value |
|---|---|
| Defect ID | GPV-D013 |
| Severity | P1 |
| Status | **REMEDIATED** |
| Remediated | 2026-08-09 |
| Component | Supplier Orders / API Serialization |

## Root Cause

The `Business` model has a `storageUsedBytes BigInt` field (schema line 235). Three supplier API endpoints included `business: true` in Prisma queries, which returns the full Business object containing the BigInt field. When Next.js calls `res.json()`, it internally uses `JSON.stringify()` which throws `TypeError: Do not know how to serialize a BigInt`.

| Endpoint | Includes `business: true`? | Result (pre-fix) |
|---|---|---|
| GET /api/supplier/orders (list) | YES — `include: { business: true }` | 500 — BigInt serialization error |
| POST /api/supplier/orders/[id]/deliver | YES — `select: { ..., business: true }` | 500 — BigInt serialization error |
| POST /api/supplier/orders/[id]/status | NO — uses `select` with specific fields | 200 — works |
| POST /api/supplier/orders (create) | NO — includes only items/product | 201 — works |

Additionally, 21 other API endpoints across the codebase include `business: true` and are vulnerable to the same bug if any Business record has a non-zero `storageUsedBytes`.

## Impact (Pre-Fix)

1. **Supplier orders list completely broken** — businesses could not view their supplier orders via the API (500 error)
2. **Delivery confirmation returns 500** — the status update itself succeeded in the DB, but the JSON response failed, causing the frontend to show an error
3. The status transition endpoint worked correctly (it doesn't include `business`)

## Remediation

### Files Changed

| File | Change |
|---|---|
| `src/lib/prisma.ts` | Added `BigInt.prototype.toJSON` patch at Prisma import boundary |
| `tests/utils/setup.ts` | Mirrored the patch for test environments that mock `@/lib/prisma` |

### Architectural Correction

Added a global BigInt serialization patch in `src/lib/prisma.ts` — the central module imported by every API route that uses the database:

```typescript
;(BigInt.prototype as any).toJSON = function () {
  return this.toString()
}
```

This converts BigInt to its string representation for JSON serialization — the correct JSON representation since JSON has no BigInt type. This is the standard Prisma community solution for this exact issue.

### Design Rationale

This is the smallest architectural correction that fixes all affected endpoints:

1. **Single point of fix:** `src/lib/prisma.ts` is imported by every database-touching API route, so the patch is applied before any Prisma query result can reach `JSON.stringify()`.
2. **Fixes all 3 affected supplier endpoints** without modifying any of them individually.
3. **Protects the other 21 endpoints** that include `business: true` from the same bug.
4. **Does not change the underlying data model** — `storageUsedBytes` remains BigInt in the schema and database.
5. **Correct JSON semantics** — BigInt values become strings (e.g., `"1024"`), which is the standard JSON representation since JSON has no BigInt type.
6. **Also protects other BigInt fields** — `PaymentTransaction.webhookTimestamp` and `DailyMetrics.totalRevenueCents`.

The alternative approach (replacing `business: true` with `business: { select: { id: true, name: true, ... } }` in each endpoint) would have been more explicit but would require changing 24 endpoints and would not protect against future endpoints that include `business: true`.

## Verification

### Unit Tests

**File:** `tests/reliability/gpv-d013-bigint-serialization.test.ts`
**Result:** 16 tests PASS, 0 FAIL

Test coverage:
- Basic BigInt serialization: value, string representation, BigInt(0), large BigInt, in object, nested, array
- Business model with storageUsedBytes: non-zero value, zero value
- Supplier order with business relation: list response, deliver response, multiple orders with different BigInt values
- Other BigInt fields (no regression): PaymentTransaction.webhookTimestamp, null BigInt, DailyMetrics.totalRevenueCents
- Complex nested structures with BigInt at multiple levels

### End-to-End Tests

**File:** `scripts/gpv-d013-verify-fix.js`
**Result:** 17 tests PASS, 0 FAIL

Critical invariants verified against live API + database:
- GET /api/supplier/orders returns 200 (was 500 before fix)
- Response is valid JSON with business relation present
- `storageUsedBytes` serializes as string `"0"` (was throwing BigInt error)
- POST /api/supplier/orders/[id]/deliver returns 200 (was 500 before fix)
- Delivery response is valid JSON with business relation
- `storageUsedBytes` in deliver response is string
- No 500 errors on any supplier endpoint (filtered lists, status updates)
- Business data is correct (correct businessId, supplierId, items)
- No regression on other BigInt-bearing APIs (`/api/business/current`)

### Regression Tests

- 78 existing tests pass (gpv-d010, gpv-d012, cr-001a, oec-001h)
- 363 reliability tests pass (10 suites)
- No new TypeScript errors introduced
- Production build succeeds

## Conclusion

GPV-D013 is fully remediated. The supplier orders API endpoints now return correct JSON responses without 500 errors. The global BigInt serialization patch protects all current and future API endpoints that include BigInt-bearing relations in their responses.
