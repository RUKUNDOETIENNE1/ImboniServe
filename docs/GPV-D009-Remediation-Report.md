# GPV-D009 Remediation Report — Tax Configuration Consistency

| Field | Value |
|---|---|
| Defect ID | GPV-D009 |
| Severity | P2 |
| Status | **REMEDIATED** |
| Remediated | 2026-08-09 |
| Component | Tax Configuration / Country Defaults / Settings Sync |

## Root Cause

The codebase contained two parallel tax configuration systems that were contradictory:

1. **`Business.taxMode`** (active system) — stored on the Business model, used by all production tax calculations (close-day, smart-dining-slip, dining-session-slip)
2. **`TaxConfiguration.isInclusive`** (inactive system) — stored on the TaxConfiguration model, written during signup but never read by any production code (`TaxService.calculateTaxes()` is dead code with zero callers)

For Rwanda (RW), `country-config.ts` set `taxMode: 'EXCLUSIVE'` while `tax.service.ts` set `isInclusive: true`. These are semantically opposite. Additionally, Rwanda VAT law requires INCLUSIVE pricing (confirmed by RRA: "VAT is the tax paid by the consumer at the rate of 18% inclusive on an invoice handed to them by the VAT registered taxpayer"), making the `EXCLUSIVE` default legally incorrect.

The same mismatch affected Uganda (UG) and Tanzania (TZ), which also have inclusive VAT but were set to EXCLUSIVE.

## Impact (Pre-Fix)

1. **New signups in RW/UG/TZ defaulted to EXCLUSIVE** — incorrect for their VAT laws
2. **`TaxConfiguration.isInclusive` disagreed with `Business.taxMode`** in the database — confusing for admin UI
3. **Settings updates didn't sync** — changing `business.taxMode` via settings left `TaxConfiguration.isInclusive` unchanged, creating new mismatches
4. **No impact on existing businesses' calculations** — the `TaxConfiguration` system is dead code; all production calculations use `Business.taxMode` from the DB

## Investigation

### Key Findings

1. **`TaxService.calculateTaxes()` is dead code** — defined in `tax.service.ts` lines 28-89 but never called in production. All production tax calculations use inline formulas with `business.taxMode` and `business.taxRate`.

2. **Tax calculation is duplicated across 4+ locations** — close-day.ts, smart-dining-slip.service.ts (2 places), dining-session-slip.service.ts — all using `business.taxMode` directly.

3. **Rwanda VAT is legally INCLUSIVE** — confirmed by RRA official documentation. Consumer prices include VAT; EBM invoices break down the VAT portion.

4. **Database state (verified):** 2 of 3 businesses had no TaxConfiguration records; only GPV Test Restaurant had one, and it contradicted `business.taxMode`.

5. **3 of 9 countries had mismatches** in the code: RW, UG, TZ — all set to EXCLUSIVE in country-config but isInclusive=true in tax.service.

### Decision Rationale

**Option E** (fix country defaults + sync settings + no forced migration) was chosen because:
- Forcing INCLUSIVE on existing businesses is a business decision, not an engineering decision
- Customer #1 is a test environment — forced migration provides no verification value
- New signups should get the legally correct default (INCLUSIVE for RW/UG/TZ)
- The settings sync prevents future mismatches
- The fix is reversible — business owners can change taxMode via settings

See `GPV-D009-Tax-Semantics-Analysis.md` and `GPV-D009-Tax-Architecture-Decision.md` for full analysis.

## Remediation

### Files Changed

| File | Change |
|---|---|
| `src/lib/utils/country-config.ts` | Changed RW, UG, TZ from `EXCLUSIVE` to `INCLUSIVE` (lines 27, 29, 30) |
| `src/pages/api/business/[id]/settings.ts` | Added TaxConfiguration sync when taxMode is updated via PUT (lines 106-116) |

### Change 1: Country defaults for RW, UG, TZ → INCLUSIVE

```diff
- RW: { currency: 'RWF', timezone: 'Africa/Kigali', taxRate: 18.0, taxMode: 'EXCLUSIVE' },
+ RW: { currency: 'RWF', timezone: 'Africa/Kigali', taxRate: 18.0, taxMode: 'INCLUSIVE' },
- UG: { currency: 'UGX', timezone: 'Africa/Kampala', taxRate: 18.0, taxMode: 'EXCLUSIVE' },
+ UG: { currency: 'UGX', timezone: 'Africa/Kampala', taxRate: 18.0, taxMode: 'INCLUSIVE' },
- TZ: { currency: 'TZS', timezone: 'Africa/Dar_es_Salaam', taxRate: 18.0, taxMode: 'EXCLUSIVE' },
+ TZ: { currency: 'TZS', timezone: 'Africa/Dar_es_Salaam', taxRate: 18.0, taxMode: 'INCLUSIVE' },
```

**Impact:** New signups in RW, UG, TZ default to INCLUSIVE tax mode, matching their VAT laws. Existing businesses are NOT affected — they keep their current `taxMode` in the DB.

### Change 2: Settings update syncs TaxConfiguration

```typescript
// GPV-D009 FIX: Sync TaxConfiguration.isInclusive with business.taxMode
if (taxMode) {
  try {
    await prisma.taxConfiguration.updateMany({
      where: { businessId: sessionBusinessId, taxType: 'VAT' },
      data: { isInclusive: taxMode === 'INCLUSIVE' }
    });
  } catch (syncError) {
    console.error('[Settings] TaxConfiguration sync failed:', syncError);
  }
}
```

**Impact:** When a business owner changes their tax mode via settings, the corresponding `TaxConfiguration.isInclusive` field is updated to match. This prevents future mismatches. The sync failure is caught and logged — it does not block the settings update.

### What was NOT changed

1. **Existing businesses** — NOT migrated. They keep their current `taxMode` until the owner changes it via settings.
2. **`tax.service.ts`** — NOT changed. The `isInclusive: true` values for RW/UG/TZ were already correct.
3. **`TaxService.calculateTaxes()`** — NOT removed. It's dead code but removing it is a larger refactor outside GPV-D009 scope.
4. **`TaxConfiguration` schema** — NOT changed. The `isInclusive` field stays as-is.

## Verification

### Unit Tests

**File:** `tests/reliability/gpv-d009-tax-config-consistency.test.ts`
**Result:** 24 tests PASS, 0 FAIL

Test coverage (Scenarios A-H):
- Scenario A: RW defaults to INCLUSIVE
- Scenario B: UG defaults to INCLUSIVE
- Scenario C: TZ defaults to INCLUSIVE
- Scenario D: KE still defaults to INCLUSIVE (unchanged)
- Scenario E: US still defaults to EXCLUSIVE (unchanged)
- Scenario F: Settings update syncs TaxConfiguration (7 tests)
- Scenario G: Existing businesses not affected by country-config change
- Scenario H: Z-Report VAT calculation works for both modes (4 tests)
- Tax calculation consistency between modes (2 tests)

### No Regression

- The country-config change only affects new signups — existing businesses read `taxMode` from the DB, not from country-config
- The settings sync only runs when `taxMode` is explicitly in the update body
- The settings sync failure is caught and doesn't block the update

## Conclusion

GPV-D009 is remediated. New signups in Rwanda, Uganda, and Tanzania now default to INCLUSIVE tax mode, matching their VAT laws. The settings update endpoint now syncs `TaxConfiguration.isInclusive` with `business.taxMode`, preventing future mismatches. Existing businesses are not affected — they can change their tax mode via settings when ready.
