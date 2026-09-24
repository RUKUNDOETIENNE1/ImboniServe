# GPV-D009 Tax Semantics Analysis

**Status:** ANALYSIS COMPLETE — NO CODE CHANGES MADE YET
**Purpose:** Document the complete tax architecture before making any corrections

## Executive Summary

The codebase contains **two parallel tax configuration systems** that are contradictory for Rwanda. However, only one of them (`Business.taxMode`) is actually used in production tax calculations. The other (`TaxConfiguration.isInclusive`) is stored in the database but never read by any production code path. The real issue is deeper than a mismatch: `country-config.ts` sets Rwanda to `EXCLUSIVE` when Rwanda VAT law (confirmed by RRA) requires `INCLUSIVE` pricing.

---

## 1. The Two Tax Systems

### System A: `Business.taxMode` + `Business.taxRate` — **ACTIVE**

| Property | Schema Location | Type | Default |
|---|---|---|---|
| `taxMode` | `Business` model, line 218 | `TaxMode` enum (INCLUSIVE \| EXCLUSIVE) | `EXCLUSIVE` |
| `taxRate` | `Business` model, line 219 | `Float` | `18.0` |

**Where it's set:**
- During signup: `src/pages/api/auth/signup.ts` — derived from `getCountryDefaults(country)` in `country-config.ts`
- Via settings: `PUT /api/business/[id]/settings` — owner can change `taxMode` and `taxRate`

**Where it's used (PRODUCTION CODE):**

| File | Line(s) | Usage |
|---|---|---|
| `src/pages/api/reports/close-day.ts` | 100-106 | Z-Report VAT calculation |
| `src/lib/services/smart-dining-slip.service.ts` | 92-102 | Receipt VAT calculation (sales) |
| `src/lib/services/smart-dining-slip.service.ts` | 339-346 | Receipt VAT calculation (procurement) |
| `src/lib/services/dining-session-slip.service.ts` | 97-107 | Running slip totals (reads `slip.taxMode` which is copied from `business.taxMode`) |
| `src/pages/api/session/initialize.ts` | 108 | Copies `business.taxMode` to dining session slip |
| `src/pages/api/dev/bootstrap-tap-leave.ts` | 66 | Copies `business.taxMode` to dining session slip |

**Calculation formulas used:**
```
EXCLUSIVE:  vat = subtotal × (taxRate / 100);           total = subtotal + vat
INCLUSIVE:  vat = total × taxRate / (100 + taxRate);    subtotal = total - vat
```

### System B: `TaxConfiguration.isInclusive` + `TaxConfiguration.rate` — **INACTIVE**

| Property | Schema Location | Type | Default |
|---|---|---|---|
| `isInclusive` | `TaxConfiguration` model, line 1997 | `Boolean` | `true` |
| `rate` | `TaxConfiguration` model, line 1996 | `Float` | — |
| `taxType` | `TaxConfiguration` model, line 1994 | `TaxType` enum | — |
| `priority` | `TaxConfiguration` model, line 1999 | `Int` | `0` |

**Where it's set:**
- During signup: `TaxService.createDefaultTaxConfig(businessId, countryCode)` in `tax.service.ts` lines 91-140
- Via admin API: `POST /api/tax/configure` with `action: 'init'`

**Where it's used:**
- `TaxService.calculateTaxes()` in `tax.service.ts` lines 28-89 — **NEVER CALLED in production code**
- `TaxService.getActiveTaxes()` — only called from `GET/POST /api/tax/configure` (admin settings UI)

**Critical finding:** `TaxService.calculateTaxes()` is defined but has ZERO callers in the entire codebase. It is dead code. The `TaxConfiguration` table is written to during signup but never read for actual tax calculations.

---

## 2. The Mismatch

### Configuration Values for Rwanda (RW)

| Source | Field | Value | Meaning |
|---|---|---|---|
| `country-config.ts` line 27 | `taxMode` | `'EXCLUSIVE'` | Tax added on top of prices |
| `tax.service.ts` line 94 | `isInclusive` | `true` | Tax included in prices |
| `Business` table (DB) | `taxMode` | `'EXCLUSIVE'` | Copied from country-config at signup |
| `TaxConfiguration` table (DB) | `isInclusive` | `true` | Created by TaxService at signup |

**The contradiction:** `EXCLUSIVE` ≠ `isInclusive: true`. These are semantically opposite.

### Database State (verified 2026-08-09)

```
Nyama Cafe Kigali [RW]:     business.taxMode=EXCLUSIVE, TaxConfig=[] (empty)
ICTHubs [RW]:               business.taxMode=EXCLUSIVE, TaxConfig=[] (empty)
GPV Test Restaurant [RW]:   business.taxMode=EXCLUSIVE, TaxConfig=[{VAT, isInclusive:true}] *** MISMATCH ***
```

- 2 of 3 businesses have NO `TaxConfiguration` records (signup tax init failed silently or they predate the feature)
- Only GPV Test Restaurant has a `TaxConfiguration` record, and it contradicts `business.taxMode`

### Other Countries in `tax.service.ts` vs `country-config.ts`

| Country | country-config.ts taxMode | tax.service.ts isInclusive | Match? |
|---|---|---|---|
| RW | EXCLUSIVE | true | **NO** |
| KE | INCLUSIVE | true | YES |
| UG | EXCLUSIVE | true | **NO** |
| TZ | EXCLUSIVE | true | **NO** |
| ZA | INCLUSIVE | true | YES |
| NG | INCLUSIVE | true | YES |
| US | EXCLUSIVE | false | YES |
| GB | INCLUSIVE | true | YES |
| AE | INCLUSIVE | true | YES |

**3 of 9 countries have mismatches:** RW, UG, TZ — all set to EXCLUSIVE in country-config but isInclusive=true in tax.service.

---

## 3. Rwanda VAT Law (Authoritative Source)

**Source:** Rwanda Revenue Authority (RRA), official statement:

> "VAT is the tax paid by the consumer at the rate of 18% **inclusive** on an invoice handed to them by the VAT registered taxpayer."
> — RRA, October 2018 enforcement notice

**Source:** RRA VAT documentation (2025):

> "the taxable value is the fair Market value **exclusive of** the value added tax"

This means:
- **Consumer prices are INCLUSIVE** — the price displayed to customers includes VAT
- **EBM invoices break down the VAT** — showing subtotal (ex-VAT), VAT amount, and total (inclusive)
- **Rwanda VAT is legally INCLUSIVE** for consumer-facing pricing

### Implications for the System

With `taxMode: EXCLUSIVE` (current setting):
- Menu item priced at 10,000 RWF → customer charged 11,800 RWF (10,000 + 1,800 VAT)
- This **overcharges customers** if the menu price was intended to be the final price

With `taxMode: INCLUSIVE` (correct per Rwanda law):
- Menu item priced at 10,000 RWF → customer charged 10,000 RWF
- Receipt shows: subtotal 8,475 RWF, VAT 1,525 RWF, total 10,000 RWF
- This is the **legally correct** behavior for Rwanda

### Current Test Data Behavior

```
Menu item: "GPV Test Burger" at 50 RWF (5,000 cents)
Current (EXCLUSIVE):  subtotal=50, VAT=9, total=59 RWF → customer pays 59
Correct (INCLUSIVE):  subtotal=42, VAT=8, total=50 RWF → customer pays 50

Completed sales show: 5,900 cents (59 RWF) and 11,800 cents (118 RWF)
→ System is currently using EXCLUSIVE calculation (adding VAT on top)
```

---

## 4. Impact Assessment

### 4.1 Impact of the Mismatch (isInclusive vs taxMode)

**Severity: LOW (in practice)**

The `TaxConfiguration.isInclusive` field is never read by any production tax calculation. `TaxService.calculateTaxes()` is dead code. Therefore, the mismatch between `isInclusive: true` and `taxMode: EXCLUSIVE` has **zero functional impact** on actual tax calculations, Z-Report values, receipt totals, or any financial output.

The only place `TaxConfiguration` is read is the admin tax settings UI (`GET /api/tax/configure`), which displays the configured taxes. A business owner seeing `isInclusive: true` in the admin UI while the system actually calculates as `EXCLUSIVE` could be confusing, but it doesn't affect calculations.

### 4.2 Impact of Wrong `taxMode` for Rwanda

**Severity: HIGH (financial correctness)**

`country-config.ts` sets RW to `EXCLUSIVE`, but Rwanda VAT law requires `INCLUSIVE`. This means:

1. **Customer overcharging:** If a business enters menu prices as the price they want customers to pay (the normal Rwanda practice), the system adds 18% VAT on top, overcharging customers by 18%.

2. **EBM receipt non-compliance:** Rwanda EBM invoices must show VAT-inclusive pricing. The system's EXCLUSIVE calculation produces receipts that don't match EBM requirements.

3. **Z-Report VAT inflation:** The Z-Report calculates `vatCollected = totalRevenue × (taxRate/100)`. With EXCLUSIVE mode, `totalRevenue` already includes the VAT added on top, so the VAT calculation double-counts: it calculates VAT on the VAT-inclusive total, not the actual pre-VAT subtotal.

4. **Same issue for UG and TZ:** Uganda and Tanzania also have inclusive VAT but are set to EXCLUSIVE.

### 4.3 What's Actually Correct

| System | Field | Correct Value for RW | Reason |
|---|---|---|---|
| `country-config.ts` | `taxMode` | `INCLUSIVE` | Rwanda VAT law |
| `tax.service.ts` | `isInclusive` | `true` | Already correct — matches Rwanda VAT law |
| `Business` table | `taxMode` | `INCLUSIVE` | Should match country-config |
| `TaxConfiguration` table | `isInclusive` | `true` | Already correct — matches Rwanda VAT law |

**The `TaxConfiguration.isInclusive: true` is CORRECT. The `Business.taxMode: EXCLUSIVE` is WRONG.**

---

## 5. Architecture Observations

### 5.1 Dead Code: `TaxService.calculateTaxes()`

`TaxService.calculateTaxes()` (tax.service.ts lines 28-89) is a sophisticated multi-tax calculation engine that supports:
- Multiple tax types (VAT, SERVICE_CHARGE, TOURISM_LEVY)
- Priority-based application order
- Inclusive/exclusive modes per tax
- Running totals for compound taxes

**But it is never called.** All production code uses inline calculations with `business.taxMode` and `business.taxRate`. This means:
- The multi-tax capability is unused
- Service charges and tourism levies configured via `TaxConfiguration` are never applied to actual sales
- The `TaxConfiguration` table is a write-only artifact of signup

### 5.2 Tax Calculation Duplication

Tax calculation logic is duplicated across 4+ locations:

| Location | Formula |
|---|---|
| `close-day.ts` lines 100-106 | Inline EXCLUSIVE/INCLUSIVE |
| `smart-dining-slip.service.ts` lines 92-102 | Inline EXCLUSIVE/INCLUSIVE |
| `smart-dining-slip.service.ts` lines 339-346 | Inline EXCLUSIVE/INCLUSIVE (procurement) |
| `dining-session-slip.service.ts` lines 97-107 | Inline EXCLUSIVE/INCLUSIVE (reads slip.taxMode) |
| `irembopay.service.ts` lines 195-208 | INCLUSIVE only (platform fees) |
| `subscriptions/initiate-payment.ts` lines 109-113 | INCLUSIVE only (platform fees) |
| `marketplace/orders/pay.ts` lines 68-72 | INCLUSIVE only (marketplace) |
| `reorder-autopilot.service.ts` line 363 | EXCLUSIVE only (purchase orders) |
| `sales.service.ts` line 12 | No VAT calculation (just item sum + convenience fee) |

**Note:** `sales.service.ts` (the main sale creation path) does NOT calculate VAT at all. It just sums item prices and adds a convenience fee. VAT is only calculated later when generating receipts/slips.

### 5.3 Settings Update Doesn't Sync

`PUT /api/business/[id]/settings` updates `business.taxMode` but does NOT update `TaxConfiguration.isInclusive` to match. This means a business owner changing their tax mode in settings would create a new mismatch.

---

## 6. Remediation Options

### Option A: Fix `country-config.ts` only (RW → INCLUSIVE)
- **What:** Change RW from EXCLUSIVE to INCLUSIVE in country-config.ts
- **Pros:** Aligns new signups with Rwanda VAT law
- **Cons:** Existing businesses still have EXCLUSIVE in DB; doesn't fix `TaxConfiguration` mismatch
- **Migration needed:** Yes — update existing RW businesses to INCLUSIVE
- **Risk:** Changes how menu prices are interpreted for new businesses

### Option B: Fix `tax.service.ts` only (RW → isInclusive: false)
- **What:** Change RW from isInclusive: true to isInclusive: false
- **Pros:** Makes the two systems consistent (both EXCLUSIVE)
- **Cons:** Both would be wrong for Rwanda law; doesn't fix the actual tax calculation bug
- **Migration needed:** Update existing TaxConfiguration records
- **Risk:** Low (no production impact since TaxConfiguration is unused)

### Option C: Remove `TaxConfiguration` system entirely
- **What:** Delete TaxService.calculateTaxes(), stop creating TaxConfiguration at signup
- **Pros:** Single source of truth (Business.taxMode); eliminates confusion
- **Cons:** Loses planned multi-tax support; larger refactor
- **Risk:** Medium (need to update signup, admin UI, tax configure API)

### Option D: Fix both systems to be correct and consistent (RECOMMENDED)
- **What:**
  1. Fix `country-config.ts`: RW, UG, TZ → INCLUSIVE (matches their VAT laws)
  2. Fix `tax.service.ts`: RW, UG, TZ → `isInclusive: true` (already correct, no change needed)
  3. Migrate existing businesses: `UPDATE business SET taxMode = 'INCLUSIVE' WHERE country IN ('RW', 'UG', 'TZ')`
  4. Sync settings update: when `business.taxMode` changes, update `TaxConfiguration.isInclusive` to match
- **Pros:** Both systems correct and consistent; aligns with VAT law; fixes actual overcharging
- **Cons:** Changes financial calculations for existing RW/UG/TZ businesses
- **Migration needed:** Yes — DB migration for existing businesses
- **Risk:** HIGH — changes what customers are charged

### Option E: Fix `country-config.ts` + sync settings + leave existing businesses as-is
- **What:**
  1. Fix `country-config.ts`: RW, UG, TZ → INCLUSIVE (for new signups only)
  2. Sync settings update: when `business.taxMode` changes, update `TaxConfiguration.isInclusive` to match
  3. Do NOT migrate existing businesses — let them switch via settings when ready
- **Pros:** New businesses get correct config; existing businesses can switch when ready; no forced migration
- **Cons:** Existing businesses still have wrong config until they manually switch
- **Risk:** LOW — no forced change to existing financial calculations

---

## 7. Recommendation

**Option E is recommended for Customer #1 readiness** because:

1. **Customer #1 (GPV Test Restaurant) is a test environment** — its menu prices (50 RWF for a burger) are clearly test data, not real prices. The EXCLUSIVE vs INCLUSIVE distinction doesn't matter for test data.

2. **Forcing INCLUSIVE on existing businesses is a business decision** — the business owner must decide whether their menu prices include VAT or not. Some may have entered prices as pre-VAT (exclusive), in which case switching to INCLUSIVE would undercharge.

3. **New signups should get the correct default** — Rwanda VAT is legally inclusive, so new businesses should default to INCLUSIVE.

4. **The settings sync fix prevents future mismatches** — when a business owner changes taxMode in settings, the TaxConfiguration should be updated to match.

5. **The `TaxConfiguration` system should be documented as inactive** — future developers need to know that `TaxService.calculateTaxes()` is dead code and all production calculations use `business.taxMode`.

### For Customer #1 specifically:
- GPV Test Restaurant has `taxMode: EXCLUSIVE` in the DB
- This is a test environment with test data
- Switching to INCLUSIVE would change test sale totals from 59 RWF to 50 RWF
- This can be done via the settings API (`PUT /api/business/[id]/settings` with `taxMode: "INCLUSIVE"`)
- No code change is needed for this specific business — just a settings update

---

## 8. Files Investigated

| File | Lines | Role |
|---|---|---|
| `src/lib/utils/country-config.ts` | 1-101 | Country defaults including taxMode |
| `src/lib/services/tax.service.ts` | 1-169 | TaxService (calculateTaxes = dead code) |
| `src/pages/api/reports/close-day.ts` | 98-106 | Z-Report VAT calculation (uses business.taxMode) |
| `src/lib/services/smart-dining-slip.service.ts` | 86-102, 327-346 | Receipt VAT (uses business.taxMode) |
| `src/lib/services/dining-session-slip.service.ts` | 91-107 | Slip totals (uses slip.taxMode, copied from business) |
| `src/pages/api/session/initialize.ts` | 105-110 | Copies business.taxMode to slip |
| `src/pages/api/dev/bootstrap-tap-leave.ts` | 63-68 | Copies business.taxMode to slip |
| `src/pages/api/business/[id]/settings.ts` | 60-110 | Settings update (doesn't sync TaxConfiguration) |
| `src/pages/api/auth/signup.ts` | 170-178 | Signup (creates both Business.taxMode and TaxConfiguration) |
| `src/pages/api/tax/configure.ts` | 1-46 | Admin tax config API (only reads TaxConfiguration) |
| `src/lib/services/sales.service.ts` | 11-106 | Sale creation (no VAT calculation) |
| `src/lib/services/irembopay.service.ts` | 195-208 | Platform fee VAT (INCLUSIVE only) |
| `src/pages/api/subscriptions/initiate-payment.ts` | 109-113 | Subscription VAT (INCLUSIVE only) |
| `src/pages/api/marketplace/orders/pay.ts` | 68-72 | Marketplace VAT (INCLUSIVE only) |
| `src/lib/services/reorder-autopilot.service.ts` | 359-364 | PO VAT (EXCLUSIVE only) |
| `prisma/schema.prisma` | 218-219, 1991-2004, 2203-2206 | Schema definitions |
