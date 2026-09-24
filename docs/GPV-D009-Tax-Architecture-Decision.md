# GPV-D009 Tax Architecture Decision

**Status:** DECISION MADE — READY FOR IMPLEMENTATION
**Prerequisite:** GPV-D009-Tax-Semantics-Analysis.md

## Decision

**Option E** from the Tax Semantics Analysis: Fix country defaults for new signups + sync settings updates + document the inactive TaxConfiguration system. Do NOT force-migrate existing businesses.

## Rationale

### Why not Option D (force-migrate all RW/UG/TZ businesses to INCLUSIVE)?

1. **Business decision, not engineering decision:** Whether menu prices include VAT or not depends on how the business owner entered them. A forced migration could undercharge customers if prices were entered as pre-VAT.

2. **Customer #1 is a test environment:** The GPV Test Restaurant has test data (50 RWF burgers). Changing its taxMode doesn't provide meaningful verification value — the test data doesn't represent real pricing decisions.

3. **Reversibility:** A business owner can change their taxMode via settings (`PUT /api/business/[id]/settings`). A forced migration is harder to reverse than a settings update.

4. **Regulatory compliance is the business's responsibility:** The system should provide the correct DEFAULT (INCLUSIVE for Rwanda) and let the business owner confirm or change it. Forcing a change without the owner's confirmation could create liability.

### Why Option E is the right scope for GPV-D009

GPV-D009 is classified as P2 — "Tax config mismatch: isInclusive vs taxMode." The mismatch has two parts:

1. **`country-config.ts` vs `tax.service.ts` disagree for RW/UG/TZ** — This is a code bug. Fix it.
2. **`business.taxMode` vs `TaxConfiguration.isInclusive` disagree in the DB** — This is a data inconsistency. Fix the sync mechanism so future changes stay consistent.

The fix does NOT need to change existing business financial calculations. The `TaxConfiguration` system is inactive (dead code), so the DB inconsistency has zero production impact.

## Changes to Implement

### Change 1: Fix `country-config.ts` — RW, UG, TZ → INCLUSIVE

**File:** `src/lib/utils/country-config.ts`

```diff
- RW: { currency: 'RWF', timezone: 'Africa/Kigali', taxRate: 18.0, taxMode: 'EXCLUSIVE' },
+ RW: { currency: 'RWF', timezone: 'Africa/Kigali', taxRate: 18.0, taxMode: 'INCLUSIVE' },
- UG: { currency: 'UGX', timezone: 'Africa/Kampala', taxRate: 18.0, taxMode: 'EXCLUSIVE' },
+ UG: { currency: 'UGX', timezone: 'Africa/Kampala', taxRate: 18.0, taxMode: 'INCLUSIVE' },
- TZ: { currency: 'TZS', timezone: 'Africa/Dar_es_Salaam', taxRate: 18.0, taxMode: 'EXCLUSIVE' },
+ TZ: { currency: 'TZS', timezone: 'Africa/Dar_es_Salaam', taxRate: 18.0, taxMode: 'INCLUSIVE' },
```

**Rationale:** Rwanda, Uganda, and Tanzania all have inclusive VAT for consumer-facing prices. This is confirmed by RRA for Rwanda, and is standard practice for URA (Uganda) and TRA (Tanzania). New signups in these countries will default to INCLUSIVE, matching their VAT law.

**Impact on existing businesses:** NONE. This only affects new signups. Existing businesses keep their current `taxMode` in the DB.

### Change 2: Sync `TaxConfiguration.isInclusive` when `business.taxMode` changes

**File:** `src/pages/api/business/[id]/settings.ts`

When `taxMode` is updated via PUT, also update all `TaxConfiguration` records for that business to set `isInclusive = (taxMode === 'INCLUSIVE')`.

```typescript
// After updating business.taxMode, sync TaxConfiguration.isInclusive
if (taxMode) {
  await prisma.taxConfiguration.updateMany({
    where: { businessId: sessionBusinessId, taxType: 'VAT' },
    data: { isInclusive: taxMode === 'INCLUSIVE' }
  })
}
```

**Rationale:** Prevents future mismatches when a business owner changes their tax mode in settings.

**Impact:** Only affects businesses whose owner explicitly changes taxMode via settings. Does not affect existing businesses that don't change their settings.

### Change 3: Document `TaxConfiguration` as inactive

**No code change.** The Tax Semantics Analysis document already records that `TaxService.calculateTaxes()` is dead code. This is documented for future developers.

### What we are NOT changing

1. **NOT migrating existing businesses** — Existing RW/UG/TZ businesses keep `taxMode: EXCLUSIVE` until the owner changes it via settings.
2. **NOT removing `TaxService.calculateTaxes()`** — It's dead code but removing it is a larger refactor outside GPV-D009 scope.
3. **NOT changing the `TaxConfiguration` schema** — The `isInclusive` field stays as-is.
4. **NOT changing `tax.service.ts` country configs** — They already have `isInclusive: true` for RW/UG/TZ, which is correct. No change needed.

## Test Scenarios

### Scenario A: New RW signup defaults to INCLUSIVE
- Create a new business with country=RW
- Verify `business.taxMode === 'INCLUSIVE'`
- Verify `TaxConfiguration.isInclusive === true` for VAT
- Verify they match

### Scenario B: New UG signup defaults to INCLUSIVE
- Same as A but with country=UG

### Scenario C: New TZ signup defaults to INCLUSIVE
- Same as A but with country=TZ

### Scenario D: New KE signup defaults to INCLUSIVE (unchanged)
- Verify KE still defaults to INCLUSIVE (was already correct)

### Scenario E: New US signup defaults to EXCLUSIVE (unchanged)
- Verify US still defaults to EXCLUSIVE (was already correct)

### Scenario F: Settings update syncs TaxConfiguration
- Update a business's taxMode from EXCLUSIVE to INCLUSIVE via settings API
- Verify `TaxConfiguration.isInclusive` is updated to `true`
- Update back to EXCLUSIVE
- Verify `TaxConfiguration.isInclusive` is updated to `false`

### Scenario G: Existing business taxMode unchanged
- Verify existing businesses' `taxMode` is NOT changed by the country-config fix
- The fix only affects new signups

### Scenario H: Z-Report still works with both modes
- Z-Report GET with EXCLUSIVE business → correct EXCLUSIVE VAT calculation
- Z-Report GET with INCLUSIVE business → correct INCLUSIVE VAT calculation

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| New signups get INCLUSIVE when they want EXCLUSIVE | LOW | MEDIUM | Business owner can change via settings |
| Existing businesses affected by change | NONE | NONE | Change only affects new signups |
| Settings sync breaks existing TaxConfiguration | LOW | LOW | Only updates VAT type, preserves other fields |
| Z-Report calculation changes | NONE | NONE | Z-Report reads business.taxMode from DB, not country-config |

## Verification Plan

1. Unit tests for all 8 scenarios (A-H)
2. Verify existing businesses' taxMode unchanged via DB query
3. Verify new signup flow creates consistent taxMode + isInclusive
4. Verify settings update syncs TaxConfiguration
5. Verify Z-Report still works for both EXCLUSIVE and INCLUSIVE modes
6. Run full regression suite (379 tests)
7. TypeScript compilation check
8. Production build check
