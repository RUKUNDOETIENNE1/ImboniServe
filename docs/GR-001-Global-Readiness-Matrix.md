# GR-001 — Global Readiness Matrix

**Phase:** GR-001 — Global Readiness & Localization Certification
**Date:** 2026-08-07
**Status:** Complete

---

## Overview

This matrix evaluates every geographic category against 6 criteria: Current State, Global Ready, Configurable, Rwanda Assumption, Recommendation, and Launch Blocker status.

---

## Global Readiness Matrix

### 1. Currency

| Criterion | Assessment |
|-----------|------------|
| **Current State** | Business.currency field exists (default RWF). CurrencyDisplay component uses LocaleContext. 7 currencies supported. BUT ~80 locations hardcode RWF in APIs, services, and UI. |
| **Global Ready** | ⚠️ Partially — Data model yes, service layer no |
| **Configurable** | ✅ Yes — Business.currency is configurable per business |
| **Rwanda Assumption** | ❌ Yes — 15 APIs, 8 services, 20+ UI components hardcode RWF |
| **Recommendation** | Replace hardcoded 'RWF' with business.currency in all APIs and services. Replace local formatRwf with CurrencyDisplay component. Add currency field to Sale and MarketplaceOrder models. |
| **Launch Blocker** | No (for Rwanda) / Yes (for international) |

### 2. Tax

| Criterion | Assessment |
|-----------|------------|
| **Current State** | TaxConfiguration model with 5 tax types. TaxService with 9 country presets. BUT 15+ locations hardcode 18% VAT. Tax calculation scattered across 6 services. |
| **Global Ready** | ⚠️ Partially — Data model yes, service layer no |
| **Configurable** | ✅ Yes — taxRate, taxMode, TaxConfiguration all configurable |
| **Rwanda Assumption** | ❌ Yes — 15+ hardcoded 18% locations, EBM/RRA references |
| **Recommendation** | Centralize tax calculation through TaxService. Replace hardcoded 18% with business.taxRate. Make EBM formatter pluggable. Call TaxService.createDefaultTaxConfig() during signup. |
| **Launch Blocker** | No (for Rwanda) / Yes (for international) |

### 3. Timezone

| Criterion | Assessment |
|-----------|------------|
| **Current State** | Business.timezone field exists (default Africa/Kigali). SupportedTimezone model exists. Proper timezone utilities exist. BUT 65+ setHours(0,0,0,0) use server local timezone. Manual UTC+2 calculations. SQL hardcoded to Africa/Kigali. |
| **Global Ready** | ❌ No — Day boundary calculation is fundamentally broken for non-UTC+2 timezones |
| **Configurable** | ✅ Yes — Business.timezone is configurable |
| **Rwanda Assumption** | ❌ Yes — 65+ locations use server timezone, 3 manual UTC+2 calculations, 2 SQL hardcoded |
| **Recommendation** | Replace all setHours(0,0,0,0) with timezone-aware day boundaries using business.timezone. Replace manual UTC+2 with Intl.DateTimeFormat. Parameterize SQL timezone. |
| **Launch Blocker** | No (for Rwanda) / Yes (for international) — CRITICAL |

### 4. Locale

| Criterion | Assessment |
|-----------|------------|
| **Current State** | i18n configured (en, fr, rw). Translation files exist. MenuItemTranslation model. BUT most service strings hardcoded English. Date formatting uses hardcoded en-US. |
| **Global Ready** | ⚠️ Partially — UI infrastructure yes, service layer no |
| **Configurable** | ✅ Yes — User.locale and Business.defaultLanguage configurable |
| **Rwanda Assumption** | ❌ Yes — Hardcoded English in notifications, emails, AI, UI strings |
| **Recommendation** | Extract notification/email templates into translatable files. Add language parameter to AI calls. Use user.locale for date formatting. |
| **Launch Blocker** | No (for Rwanda) / No (for international, but poor UX) |

### 5. Payments

| Criterion | Assessment |
|-----------|------------|
| **Current State** | IPaymentProvider interface with factory pattern. 7 provider types defined. 2 implemented (InTouch, IremboPay). BUT providers hardcode RWF. Legacy services still imported. |
| **Global Ready** | ✅ Yes — Architecture supports new providers cleanly |
| **Configurable** | ✅ Yes — PAYMENTS_PROVIDER env var, per-deployment selection |
| **Rwanda Assumption** | ⚠️ Provider constraint — InTouch/IremboPay are Rwanda providers by design |
| **Recommendation** | Complete migration from legacy services. Implement MTN_DIRECT, Stripe, Flutterwave. Add provider-to-country mapping. |
| **Launch Blocker** | No (architecture is ready) |

### 6. Address

| Criterion | Assessment |
|-----------|------------|
| **Current State** | Country field exists (default RW). GPS coordinates supported. LocationAutocomplete uses global OpenStreetMap. BUT city defaults to "Kigali". District is Rwanda-specific naming. No postal/zip code. |
| **Global Ready** | ⚠️ Partially — Country and GPS yes, administrative divisions no |
| **Configurable** | ✅ Yes — Country, city, district are all configurable |
| **Rwanda Assumption** | ⚠️ Yes — City default "Kigali", district naming, no postal code |
| **Recommendation** | Add postal/zip code field. Rename district to region or make it configurable per country. Remove city default. |
| **Launch Blocker** | No |

### 7. Phone

| Criterion | Assessment |
|-----------|------------|
| **Current State** | 12 duplicate normalizePhone functions, ALL hardcoded to +250 Rwanda. No country-aware normalization. Signup placeholder hardcoded to +250 format. |
| **Global Ready** | ❌ No — Phone normalization will produce incorrect results for any non-Rwandan number |
| **Configurable** | ❌ No — Hardcoded in 12 locations |
| **Rwanda Assumption** | ❌ Yes — CRITICAL, all phone normalization is Rwanda-specific |
| **Recommendation** | Create single country-aware normalizePhone function using business.country. Remove 11 duplicates. Use libphonenumber library for robust validation. |
| **Launch Blocker** | No (for Rwanda) / Yes (for international) — CRITICAL |

### 8. Language

| Criterion | Assessment |
|-----------|------------|
| **Current State** | i18n with en, fr, rw. Translation files exist. MenuItemTranslation model. Kinyarwanda termbase. BUT WhatsApp/email/AI hardcoded English. Most UI strings not translatable. |
| **Global Ready** | ⚠️ Partially — Infrastructure yes, content no |
| **Configurable** | ✅ Yes — User.locale and Business.defaultLanguage configurable |
| **Rwanda Assumption** | ❌ Yes — Service-layer content is English-only |
| **Recommendation** | Extract all notification/email templates into translatable files. Add language parameter to AI calls. Audit UI for hardcoded strings. |
| **Launch Blocker** | No |

### 9. Reports

| Criterion | Assessment |
|-----------|------------|
| **Current State** | Reports use business.currency in some places (close-day, export). BUT executive dashboards hardcode RWF or USD. Date ranges use server timezone. |
| **Global Ready** | ❌ No — Reports will show wrong currency and wrong date ranges for non-Rwandan businesses |
| **Configurable** | ⚠️ Partially — Some APIs use business.currency, some hardcode |
| **Rwanda Assumption** | ❌ Yes — Executive dashboards, date ranges, SQL queries |
| **Recommendation** | Fix executive dashboards to use business.currency. Fix date ranges to use business.timezone. Parameterize SQL timezone. |
| **Launch Blocker** | No (for Rwanda) / Yes (for international) |

### 10. Notifications

| Criterion | Assessment |
|-----------|------------|
| **Current State** | WhatsApp (Twilio) and Email (SMTP) configured. BUT all notification templates are hardcoded English. No translation support. |
| **Global Ready** | ❌ No — Notifications are English-only |
| **Configurable** | ⚠️ Partially — Channel is configurable, content is not |
| **Rwanda Assumption** | ❌ Yes — All templates in English |
| **Recommendation** | Extract notification templates into translatable template files. Support business.defaultLanguage for notification language. |
| **Launch Blocker** | No |

### 11. Executive Intelligence

| Criterion | Assessment |
|-----------|------------|
| **Current State** | CEO dashboard hardcodes RWF. CFO dashboard hardcodes USD. AI insights generated in English. |
| **Global Ready** | ❌ No — Executive dashboards show wrong currency and wrong language |
| **Configurable** | ❌ No — Hardcoded in dashboard components |
| **Rwanda Assumption** | ❌ Yes — RWF/USD hardcoded, English-only insights |
| **Recommendation** | Use business.currency in all executive dashboards. Add language parameter to AI insight generation. |
| **Launch Blocker** | No (for Rwanda) / Yes (for international) |

### 12. Financial Intelligence

| Criterion | Assessment |
|-----------|------------|
| **Current State** | Financial ledger uses transaction currency. BUT billing-ledger.service.ts hardcodes RWF. Founder commission hardcodes RWF. |
| **Global Ready** | ⚠️ Partially — Transaction-level yes, platform-level no |
| **Configurable** | ⚠️ Partially |
| **Rwanda Assumption** | ❌ Yes — Platform-level financial services hardcode RWF |
| **Recommendation** | Use transaction or business currency in all financial services. |
| **Launch Blocker** | No (for Rwanda) / Yes (for international) |

### 13. Hospitality Operations

| Criterion | Assessment |
|-----------|------------|
| **Current State** | OutletType enum (9 types), OrganizationType enum (7 types). BUT businessType is free text. "restaurant" in variable names. Kitchen dispatch mandatory for all. Site builder restaurant-only. |
| **Global Ready** | ⚠️ Partially — Enums support diversity, service logic assumes restaurant |
| **Configurable** | ⚠️ Partially — businessType is free text, kitchen dispatch is not optional |
| **Rwanda Assumption** | ❌ No — This is restaurant-specific, not Rwanda-specific |
| **Recommendation** | Convert businessType to enum. Make kitchen dispatch conditional. Add hotel/cafe/bar templates. Rename "restaurant" variables to "business". |
| **Launch Blocker** | No |

---

## Summary Matrix

| Category | Global Ready | Configurable | Rwanda Assumption | Launch Blocker (Intl) |
|----------|-------------|-------------|-------------------|----------------------|
| Currency | ⚠️ Partial | ✅ Yes | ❌ Yes | Yes |
| Tax | ⚠️ Partial | ✅ Yes | ❌ Yes | Yes |
| Timezone | ❌ No | ✅ Yes | ❌ Yes (CRITICAL) | Yes (CRITICAL) |
| Locale | ⚠️ Partial | ✅ Yes | ❌ Yes | No |
| Payments | ✅ Yes | ✅ Yes | ⚠️ By design | No |
| Address | ⚠️ Partial | ✅ Yes | ⚠️ Yes | No |
| Phone | ❌ No | ❌ No | ❌ Yes (CRITICAL) | Yes (CRITICAL) |
| Language | ⚠️ Partial | ✅ Yes | ❌ Yes | No |
| Reports | ❌ No | ⚠️ Partial | ❌ Yes | Yes |
| Notifications | ❌ No | ⚠️ Partial | ❌ Yes | No |
| Executive Intelligence | ❌ No | ❌ No | ❌ Yes | Yes |
| Financial Intelligence | ⚠️ Partial | ⚠️ Partial | ❌ Yes | Yes |
| Hospitality Operations | ⚠️ Partial | ⚠️ Partial | ❌ No (restaurant) | No |

**Overall Global Readiness: 40% — Architecture has the right bones; service layer needs discipline.**
