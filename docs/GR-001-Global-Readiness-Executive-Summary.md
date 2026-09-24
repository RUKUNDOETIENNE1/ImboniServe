# GR-001 — Global Readiness Executive Summary

**Phase:** GR-001 — Global Readiness & Localization Certification
**Date:** 2026-08-07
**Status:** Complete
**Governance Rule Introduced:** EGR-016 — Geography must be configuration, never code.

---

## Executive Summary

GR-001 verified whether ImboniServe's architecture supports global evolution — not whether every country is operational today, but whether today's architecture would prevent or complicate tomorrow's international expansion.

The review examined 10 phases across the entire platform: currency, tax, timezone, locale, address, payments, language, regulatory, hospitality domain neutrality, and global architecture. Every finding is supported by evidence from the implementation.

**The strategic question:** "If a hospitality business from any country wanted to use ImboniServe, would our architecture welcome them — or would it ask them to become Rwandan first?"

**The answer:** The architecture has the right bones but inconsistent discipline. The data model is globally capable. The service layer frequently bypasses it.

---

## Key Distinction

| Global Architecture | Global Operations |
|---------------------|-------------------|
| The platform is architecturally capable of supporting hospitality businesses in any country. | The platform currently integrates with country-specific providers and regulations. |
| **Status: PARTIALLY READY** — Data model supports it; service layer frequently bypasses it. | **Status: RWANDA-OPERATIONAL** — InTouch, IremboPay, Twilio configured for Rwanda. |

This certification evaluates **Global Architecture**, not worldwide operational rollout.

---

## Architecture Health by Phase

| Phase | Focus | Findings | Health |
|-------|-------|----------|--------|
| 1 | Currency | 836 RWF occurrences; ~80 hardcoded in APIs/services/UI; CurrencyDisplay component properly implemented; LocaleContext properly manages per-business currency | ⚠️ MIXED |
| 2 | Tax | TaxConfiguration model exists with 5 tax types; TaxService has country-specific presets; BUT 15+ hardcoded 18% locations; tax calculation scattered, not centralized | ⚠️ MIXED |
| 3 | Timezone | Business.timezone field exists; SupportedTimezone model exists; BUT 65+ setHours(0,0,0,0) using server local timezone; manual UTC+2 offset calculations; SQL hardcoded to Africa/Kigali | 🔴 RISK |
| 4 | Locale | i18n configured (en, fr, rw); translation files exist; BUT most strings hardcoded English; date formatting uses browser locale not user locale | ⚠️ MIXED |
| 5 | Address | Country field exists; GPS supported; LocationAutocomplete uses global OpenStreetMap; BUT no postal code field; city defaults to "Kigali"; district is Rwanda-specific | ⚠️ MIXED |
| 6 | Payments | IPaymentProvider interface well-designed; PaymentProviderFactory pattern; 7 provider types defined (including future Stripe, Flutterwave); BUT payment gateways hardcode RWF currency | ✅ GOOD |
| 7 | Language | Translation infrastructure exists; MenuItemTranslation model; BUT WhatsApp/email templates hardcoded English; AI responses English-only; most UI strings not translatable | ⚠️ MIXED |
| 8 | Regulatory | TIN field exists; BUT EBM formatter is Rwanda-specific; RRA references hardcoded; WHT (15%) hardcoded; invoice format assumes Rwanda tax rates | 🔴 RISK |
| 9 | Hospitality | OutletType enum includes 9 types (RESTAURANT, BAR, POOL_BAR, CAFE, ROOM_SERVICE, LOUNGE, SPA, TERRACE, BEACH_BAR); OrganizationType includes HOTEL, SUPPLIER; BUT businessType is free text; "restaurant" in variable names; kitchen dispatch mandatory for all | ⚠️ MIXED |
| 10 | Global Assessment | Data model is globally capable; service layer frequently bypasses it with hardcoded defaults | ⚠️ MIXED |

---

## What Is Already Global (Architecture Strengths)

1. **Business model has `currency`, `timezone`, `country`, `taxMode`, `taxRate`, `defaultLanguage` fields** — the data model supports per-business geographic configuration.
2. **CurrencyDisplay component** properly uses LocaleContext for per-business currency display.
3. **CurrencyExchangeService** with DB-backed exchange rates and multi-currency support.
4. **TaxConfiguration model** supports 5 tax types (VAT, SERVICE_CHARGE, TOURISM_LEVY, SALES_TAX, CITY_TAX) with inclusive/exclusive modes and priority ordering.
5. **TaxService** has country-specific presets for 9 countries (RW, KE, UG, TZ, ZA, NG, US, GB, AE).
6. **IPaymentProvider interface** with factory pattern — 7 provider types defined including future Stripe, Flutterwave, Pesapal.
7. **SupportedTimezone model** exists with IANA timezone identifiers.
8. **i18n configured** with 3 locales (en, fr, rw) and MenuItemTranslation model for multilingual menus.
9. **GPS coordinates** supported on Business, User, Branch, and Outlet models.
10. **LocationAutocomplete** uses OpenStreetMap Nominatim API (global, not Rwanda-specific).
11. **OutletType enum** includes 9 hospitality types (restaurant, bar, pool bar, cafe, room service, lounge, spa, terrace, beach bar).
12. **OrganizationType enum** includes HOTEL, SUPPLIER, DISTRIBUTOR, MANUFACTURER, SERVICE_PROVIDER.

---

## What Is Rwanda-Specific by Assumption (Architecture Risks)

1. **Phone normalization** — 12 duplicate `normalizePhone` functions, all hardcoded to +250 Rwanda country code. No country-aware normalization.
2. **Day boundaries** — 65+ `setHours(0,0,0,0)` calls use server local timezone instead of business timezone. Close-day, sales reports, and reservation queries will be incorrect for businesses in other timezones.
3. **Hardcoded 18% VAT** — 15+ locations hardcode 18% tax rate instead of reading from business.taxRate or TaxConfiguration.
4. **Hardcoded RWF currency** — ~80 locations hardcode 'RWF' instead of reading from business.currency.
5. **EBM/RRA fiscal compliance** — EBM formatter hardcodes Rwanda receipt format with 18% VAT and Rwanda tax codes.
6. **SQL queries hardcoded to Africa/Kigali** — Analytics queries use `AT TIME ZONE 'Africa/Kigali'` instead of business timezone.
7. **Manual UTC+2 offset calculations** — Several services manually calculate Kigali time using `getTimezoneOffset() + 2 * 3600000` instead of using IANA timezone.
8. **Signup hardcodes country to 'RW'** — Business creation always sets country to Rwanda.
9. **WhatsApp/email templates hardcoded English** — Notification messages are not translatable.
10. **Kitchen dispatch mandatory for all orders** — Assumes all businesses have a kitchen, which may not apply to all hospitality types.
11. **Executive dashboards hardcode currency** — CEO dashboard uses RWF, CFO dashboard uses USD, neither uses business.currency.
12. **No postal/zip code field** — Cannot support postal code-based features for international addresses.

---

## Classification of Findings

| Classification | Count | Description |
|----------------|-------|-------------|
| Already Global | 12 | Architecture properly supports global evolution |
| Configurable | 8 | Feature exists but defaults to Rwanda |
| Rwanda-Specific by Design | 3 | Intentional (EBM compliance, InTouch/IremboPay integration) |
| Rwanda-Specific Assumption | 12 | Accidental hardcoding that should be configuration |
| Immediate Architecture Risk | 5 | Would break for a non-Rwandan business today |
| Future Evolution | 4 | Needed for scale but not blocking |

---

## Go-Live Impact

**For Customer #1 (Rwanda):** No impact. All hardcoded Rwanda assumptions are correct for a Rwandan business. The platform will work perfectly.

**For Customer #100 (neighboring country):** Tax and currency would work (TaxService has presets for KE, UG, TZ). Phone normalization would fail. Payment gateways would need new providers.

**For Customer #1000 (global):** Timezone handling would produce incorrect reports. Phone normalization would fail. EBM compliance would be irrelevant. Executive dashboards would show wrong currency. Language would be English-only.

---

## EGR-016

> "Geography must be configuration, never code. A hospitality business should define its country, currency, timezone, locale, tax configuration, regional formatting, and payment providers through configuration rather than application code. The platform must adapt to the business. The business should never have to adapt to the platform."

---

## Final Decision

### CERTIFIED WITH ARCHITECTURE RECOMMENDATIONS

The platform's **data model** is globally capable. The platform's **service layer** has Rwanda-specific assumptions that must be addressed before international expansion.

**For Customer #1 (Rwanda):** No blockers. The platform is ready.
**For international expansion:** 5 immediate architecture risks must be resolved first.

The platform advances to Guided Platform Verification (GPV) with the understanding that GR-001 recommendations will be addressed before Customer #2 in a non-Rwandan market.

---

## Deliverables

| Document | Description |
|----------|-------------|
| GR-001-Global-Readiness-Executive-Summary.md | This summary |
| GR-001-Currency-Architecture-Assessment.md | Currency findings and recommendations |
| GR-001-Tax-Fiscal-Architecture-Assessment.md | Tax findings and recommendations |
| GR-001-Timezone-Localization-Assessment.md | Timezone, locale, address findings |
| GR-001-Payment-Architecture-Assessment.md | Payment provider architecture |
| GR-001-Internationalization-Localization-Report.md | Language and i18n findings |
| GR-001-Global-Readiness-Matrix.md | Comprehensive matrix of all categories |
| GR-001-Architecture-Evolution-Recommendations.md | Prioritized recommendations |
| GR-001-Customer-1000-Readiness-Assessment.md | Future customer readiness |
| GR-001-Final-Certification-Report.md | Final certification report |
