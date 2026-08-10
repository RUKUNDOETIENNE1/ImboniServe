# GPV-D009 Verification Report — Tax Configuration Consistency

| Field | Value |
|---|---|
| Defect ID | GPV-D009 |
| Severity | P2 |
| Verification Date | 2026-08-09 |
| Result | **PASS** |

## Verification Summary

| Category | Tests | Pass | Fail |
|---|---|---|---|
| Unit Tests (GPV-D009) | 24 | 24 | 0 |
| Full Regression Suite | 403 | 403 | 0 |
| TypeScript | 0 new errors | — | — |
| **Total** | **427** | **427** | **0** |

## Pre-Fix Evidence

### Country Config Mismatch

```
country-config.ts:
  RW: { taxMode: 'EXCLUSIVE' }  ← Wrong (Rwanda VAT is inclusive)
  UG: { taxMode: 'EXCLUSIVE' }  ← Wrong (Uganda VAT is inclusive)
  TZ: { taxMode: 'EXCLUSIVE' }  ← Wrong (Tanzania VAT is inclusive)

tax.service.ts:
  RW: { isInclusive: true }  ← Correct
  UG: { isInclusive: true }  ← Correct
  TZ: { isInclusive: true }  ← Correct

→ country-config.ts and tax.service.ts disagreed for RW, UG, TZ
```

### Database State

```
GPV Test Restaurant [RW]:
  business.taxMode = EXCLUSIVE
  TaxConfiguration.isInclusive = true
  → MISMATCH
```

### Settings Update Didn't Sync

```
PUT /api/business/[id]/settings { taxMode: "INCLUSIVE" }
→ business.taxMode updated to INCLUSIVE
→ TaxConfiguration.isInclusive remained true (happened to match)
→ But changing to EXCLUSIVE would leave TaxConfiguration.isInclusive = true
→ New mismatch created
```

## Post-Fix Evidence

### Country Config (RW, UG, TZ → INCLUSIVE)

```
country-config.ts:
  RW: { taxMode: 'INCLUSIVE' }  ✓ Fixed
  UG: { taxMode: 'INCLUSIVE' }  ✓ Fixed
  TZ: { taxMode: 'INCLUSIVE' }  ✓ Fixed

tax.service.ts:
  RW: { isInclusive: true }  ✓ Already correct
  UG: { isInclusive: true }  ✓ Already correct
  TZ: { isInclusive: true }  ✓ Already correct

→ Both systems now agree for RW, UG, TZ
```

### Settings Update Syncs TaxConfiguration

```
PUT /api/business/[id]/settings { taxMode: "INCLUSIVE" }
→ business.taxMode updated to INCLUSIVE
→ TaxConfiguration.isInclusive updated to true  ✓ Synced

PUT /api/business/[id]/settings { taxMode: "EXCLUSIVE" }
→ business.taxMode updated to EXCLUSIVE
→ TaxConfiguration.isInclusive updated to false  ✓ Synced
```

## Test Details

### Unit Tests (24 tests)

#### Scenario A-C: Country defaults for RW, UG, TZ (10 tests)
- RW defaults to INCLUSIVE with taxRate 18.0, currency RWF, timezone Africa/Kigali
- UG defaults to INCLUSIVE with taxRate 18.0, currency UGX, timezone Africa/Kampala
- TZ defaults to INCLUSIVE with taxRate 18.0, currency TZS, timezone Africa/Dar_es_Salaam
- KE still defaults to INCLUSIVE (unchanged)
- US still defaults to EXCLUSIVE (unchanged)
- getTaxModeForCountry returns INCLUSIVE for RW, UG, TZ
- getTaxModeForCountry returns EXCLUSIVE for US
- RW fallback for unknown countries is INCLUSIVE

#### Scenario F: Settings update syncs TaxConfiguration (7 tests)
- Syncs isInclusive=true when taxMode changes to INCLUSIVE
- Syncs isInclusive=false when taxMode changes to EXCLUSIVE
- Does NOT sync when taxMode is not in the update body
- Returns 200 even if TaxConfiguration sync fails (graceful degradation)
- Rejects invalid taxMode with 400
- Rejects taxRate > 100 with 400
- Rejects taxRate < 0 with 400

#### Scenario G: Existing businesses not affected (1 test)
- country-config change is a static config file — does not touch the database
- Existing businesses keep their current taxMode from the DB

#### Scenario H: Z-Report VAT calculation works for both modes (4 tests)
- EXCLUSIVE: 11800 cents → VAT 2124 cents (118 × 0.18)
- INCLUSIVE: 10000 cents → VAT 1525 cents (100 - 100/1.18)
- INCLUSIVE with 0% tax → 0 VAT
- EXCLUSIVE with 0% tax → 0 VAT

#### Tax calculation consistency (2 tests)
- 100 RWF menu item in EXCLUSIVE mode → customer pays 118 RWF
- 100 RWF menu item in INCLUSIVE mode → customer pays 100 RWF

### Full Regression Suite (403 tests)

All 12 reliability test suites pass:
- gpv-d009-tax-config-consistency.test.ts (24 tests) — NEW
- gpv-d011-zreport-reservation.test.ts (16 tests)
- gpv-d013-bigint-serialization.test.ts (16 tests)
- gpv-d012-reservation-lifecycle.test.ts (34 tests)
- gpv-d010-financial-truth-chain.test.ts
- oec-001c-remediation.test.ts
- oec-001d-remediation.test.ts
- oec-001e-remediation.test.ts
- oec-001f-remediation.test.ts
- oec-001g-remediation.test.ts
- oec-001h-remediation.test.ts
- oec-001i-remediation.test.ts

**No regressions introduced.**

## Verification of No Forced Migration

The fix does NOT migrate existing businesses. Verified by design:

1. `country-config.ts` is a static configuration module — it provides defaults for new signups only
2. `getCountryDefaults()` is a pure function with no side effects
3. The settings PUT endpoint is the only way to change an existing business's `taxMode`
4. No database migration script was created or run

Existing businesses (Nyama Cafe Kigali, ICTHubs, GPV Test Restaurant) retain their `taxMode: EXCLUSIVE` in the DB until the owner changes it via settings.

## Conclusion

GPV-D009 is verified remediated. The tax configuration systems are now consistent for new signups in RW, UG, and TZ (both `country-config.ts` and `tax.service.ts` agree on INCLUSIVE). The settings update endpoint now syncs `TaxConfiguration.isInclusive` with `business.taxMode`, preventing future mismatches. No regressions were introduced, and existing businesses are not affected.
