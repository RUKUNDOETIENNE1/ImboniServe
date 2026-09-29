# GR-001 — Architecture Evolution Recommendations

**Phase:** GR-001 — Global Readiness & Localization Certification
**Date:** 2026-08-07
**Status:** Complete

---

## Overview

This document provides prioritized recommendations for evolving ImboniServe from a Rwanda-operational platform to a globally-architected platform. Recommendations are classified by urgency:

- **Immediate Action** — Must be done before any non-Rwandan business can use the platform
- **Before International Expansion** — Must be done before actively marketing in a new country
- **Post-Growth Evolution** — Needed for scale but not blocking initial expansion

---

## Immediate Actions (5 items)

These are the 5 architecture risks that would break for a non-Rwandan business today.

### IA-1: Timezone-Aware Day Boundaries
**Problem:** 65+ `setHours(0,0,0,0)` calls use server local timezone (UTC on Vercel) instead of business timezone. Close-day reports, sales reports, reservation queries, and analytics will be incorrect for businesses in any timezone other than UTC.

**Solution:**
1. Create a `getDayBoundary(date: Date, timezone: string): { start: Date, end: Date }` utility in `src/lib/utils/timezone.ts`
2. Replace all 65+ `setHours(0,0,0,0)` calls with this utility, passing `business.timezone`
3. Replace manual UTC+2 offset calculations in `src/lib/cron.ts` and `src/lib/services/insight.service.ts` with `Intl.DateTimeFormat` using business timezone
4. Parameterize SQL queries in `src/lib/services/analytics.service.ts` to use business timezone instead of hardcoded 'Africa/Kigali'

**Files Affected:** 25+ files across services, APIs, and cron jobs
**Effort:** Medium (mechanical replacement with a utility function)
**Risk:** Low (utility already exists, just needs adoption)

### IA-2: Country-Aware Phone Normalization
**Problem:** 12 duplicate `normalizePhone` functions, all hardcoded to Rwanda +250. Any phone number starting with "07" or "0" will be treated as Rwandan, even for Kenyan (+254), Ugandan (+256), or other numbers.

**Solution:**
1. Create a single `normalizePhone(phone: string, countryCode?: string): string` function in a new `src/lib/utils/phone.ts`
2. Use the `libphonenumber-js` library for robust international phone validation
3. Default country code from `business.country` if not provided in the phone number
4. Remove all 11 duplicate `normalizePhone` functions
5. Update all imports to use the single canonical function

**Files Affected:** 12 files with duplicate functions + all files that import them
**Effort:** Medium (library integration + refactoring)
**Risk:** Low (improves correctness)

### IA-3: Currency in Payment Initiation
**Problem:** 15 API endpoints hardcode `currency: 'RWF'` when creating payment transactions, even though the Business model has a configurable currency field. If a business has currency set to USD, payments will still be created in RWF.

**Solution:**
1. Replace `currency: 'RWF'` with `currency: business.currency` in all 15 API endpoints
2. Add currency validation per payment provider — if the provider doesn't support the business currency, return a clear error
3. Add `currency` field to Sale and MarketplaceOrder models

**Files Affected:** 15 API endpoints + 2 Prisma model updates
**Effort:** Low (mechanical replacement)
**Risk:** Low

### IA-4: Executive Dashboard Currency
**Problem:** CEO dashboard hardcodes `RWF ${amount.toLocaleString()}`. CFO dashboard hardcodes `Intl.NumberFormat('en-US', { currency: 'USD' })`. Neither uses business.currency.

**Solution:**
1. Load business.currency in executive dashboard pages
2. Replace hardcoded currency formatting with CurrencyDisplay component or business.currency
3. Ensure all executive dashboards use the same currency source

**Files Affected:** 7 executive dashboard files
**Effort:** Low (replace formatting functions)
**Risk:** Low

### IA-5: Signup Country Configuration
**Problem:** Signup API hardcodes `country: 'RW'` and `currency: 'RWF'`. This means every new business is created as a Rwandan business, regardless of where the user actually is.

**Solution:**
1. Accept `country` as a signup input field (with dropdown selection)
2. Set `currency` based on country (using a country-to-currency mapping)
3. Set `timezone` based on country (using a country-to-timezone mapping)
4. Call `TaxService.createDefaultTaxConfig(businessId, countryCode)` during signup
5. Update the signup form UI to include country selection

**Files Affected:** `src/pages/api/auth/signup.ts`, `src/pages/signup.tsx`
**Effort:** Low-Medium (add input field + mappings)
**Risk:** Low

---

## Before International Expansion (8 items)

### BE-1: Centralize Tax Calculation
**Problem:** Tax calculation is scattered across 6 services, each implementing its own logic. Some use TaxService, some use business.taxRate, some hardcode 18%.

**Solution:**
1. All tax calculation must go through `TaxService.calculateTaxes()`
2. Remove duplicate tax logic from smart-dining-slip, qr-order, split-payment, close-day
3. Replace hardcoded `VAT_RATE = 0.18` in subscriptions, marketplace, and irembopay with TaxService call

**Effort:** Medium (refactoring across services)
**Risk:** Medium (changes financial calculations — requires thorough testing)

### BE-2: Translatable Notification Templates
**Problem:** WhatsApp and email notification templates are hardcoded English strings in service code.

**Solution:**
1. Extract all notification templates into template files (e.g., `src/templates/notifications/`)
2. Support business.defaultLanguage for template selection
3. Use translation keys instead of hardcoded strings

**Effort:** Medium-High (template system + translation)
**Risk:** Low

### BE-3: AI Language Support
**Problem:** AI services (menu extraction, site builder, executive insights) use English-only prompts and generate English-only content.

**Solution:**
1. Add language parameter to OpenAI API calls
2. Use business.defaultLanguage to determine AI response language
3. Translate system prompts for menu extraction and content generation

**Effort:** Medium
**Risk:** Low

### BE-4: UI String Audit and Translation
**Problem:** Many UI strings are hardcoded English, not using the `t()` translation function.

**Solution:**
1. Audit all pages for hardcoded English strings
2. Replace with `t()` translation function calls
3. Add missing translation keys to en.json, fr.json, rw.json
4. Consolidate duplicate locale files (src/locales vs public/locales)

**Effort:** High (many files to audit)
**Risk:** Low

### BE-5: Pluggable Fiscal Formatter
**Problem:** EBM formatter is Rwanda-specific with hardcoded 18% VAT and Rwanda tax codes.

**Solution:**
1. Create a `IFiscalFormatter` interface
2. Implement `EBMFormatter` for Rwanda (current code)
3. Implement `GenericFormatter` for countries without fiscal requirements
4. Select formatter based on business country

**Effort:** Medium
**Risk:** Low

### BE-6: Provider-to-Country Mapping
**Problem:** Payment provider selection is via environment variable, not based on business country. A business in Kenya would still try to use InTouch (Rwanda-only).

**Solution:**
1. Create a country-to-provider mapping (e.g., RW → InTouch/IremboPay, KE → Pesapal/Mpesa, US → Stripe)
2. Filter available payment methods based on business country
3. Allow override via environment variable for testing

**Effort:** Medium
**Risk:** Low

### BE-7: Hospitality Domain Generalization
**Problem:** "restaurant" terminology in service logic, kitchen dispatch mandatory for all orders, site builder restaurant-only templates.

**Solution:**
1. Rename "restaurant" variables to "business" in service logic
2. Make kitchen dispatch conditional based on business type (restaurants have kitchen, spas don't)
3. Add hotel, cafe, and bar templates to site builder
4. Convert businessType from free text to enum

**Effort:** Medium
**Risk:** Low

### BE-8: Address Model Enhancement
**Problem:** No postal/zip code field. District is Rwanda-specific naming. City defaults to "Kigali".

**Solution:**
1. Add `postalCode` field to Business model
2. Rename `district` to `region` (or make it configurable per country)
3. Remove city default ("Kigali")
4. Add `state` or `province` field for countries that use them

**Effort:** Low (schema migration)
**Risk:** Low

---

## Post-Growth Evolution (6 items)

### PG-1: Multi-Currency Settlement
Allow businesses to receive payments in one currency and settle in another.

### PG-2: Per-Item Tax Rates
Add taxRate field to MenuItem and SaleItem models for different tax rates on different items (e.g., food vs alcohol).

### PG-3: Tax Exemption Support
Add isTaxExempt field to MenuItem for tax-exempt items.

### PG-4: Compound Tax Support
Support compound taxes (e.g., US state sales tax + local city tax).

### PG-5: RTL Support
Add right-to-left (RTL) layout support for Arabic and other RTL languages.

### PG-6: Business Model Table Rename
Rename Business model table from "Restaurant" to "Business" (requires database migration).

---

## Priority Matrix

| ID | Recommendation | Urgency | Effort | Impact |
|----|---------------|---------|--------|--------|
| IA-1 | Timezone-aware day boundaries | Immediate | Medium | Critical |
| IA-2 | Country-aware phone normalization | Immediate | Medium | Critical |
| IA-3 | Currency in payment initiation | Immediate | Low | High |
| IA-4 | Executive dashboard currency | Immediate | Low | Medium |
| IA-5 | Signup country configuration | Immediate | Low-Medium | High |
| BE-1 | Centralize tax calculation | Before Expansion | Medium | High |
| BE-2 | Translatable notification templates | Before Expansion | Medium-High | Medium |
| BE-3 | AI language support | Before Expansion | Medium | Medium |
| BE-4 | UI string audit and translation | Before Expansion | High | Medium |
| BE-5 | Pluggable fiscal formatter | Before Expansion | Medium | Medium |
| BE-6 | Provider-to-country mapping | Before Expansion | Medium | High |
| BE-7 | Hospitality domain generalization | Before Expansion | Medium | Medium |
| BE-8 | Address model enhancement | Before Expansion | Low | Low |
| PG-1 | Multi-currency settlement | Post-Growth | High | Low |
| PG-2 | Per-item tax rates | Post-Growth | Medium | Medium |
| PG-3 | Tax exemption support | Post-Growth | Low | Low |
| PG-4 | Compound tax support | Post-Growth | Medium | Low |
| PG-5 | RTL support | Post-Growth | High | Low |
| PG-6 | Business model table rename | Post-Growth | Low | Low |

---

## Implementation Principle

> **EGR-016:** Geography must be configuration, never code. A hospitality business should define its country, currency, timezone, locale, tax configuration, regional formatting, and payment providers through configuration rather than application code. The platform must adapt to the business. The business should never have to adapt to the platform.

Every recommendation in this document serves one purpose: moving geography from code to configuration.
