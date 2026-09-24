# CONTENT_ACCURACY_REPORT — Phase 1 (Public Website)

**Date:** 2026-06-30

This report lists **statements on public pages that conflict with the Global-by-Design Localization Philosophy** and provides recommended wording aligned with the approved architecture.

---

## Architectural Principle (Global-by-Design)

ImboniServe is a **global hospitality platform** with configurable localization.

- **Core Platform:** Universal restaurant operations — work anywhere, no country assumptions.
- **Localization Layer:** Taxes, fiscal compliance, currencies, payment providers, languages, date/time formats, receipt layouts, regional regulations — these are **configuration**, not hardcoded behavior.
- **Deployment Availability:** Current operational integrations — distinct from platform capability.

All recommended wording below aligns with this principle.

---

## A) Tax/Regulatory Claims (Localization, not Platform Assumptions)

### 1) Terms: fixed VAT 18% + RRA + EBM assertions
Evidence:
- "subject to 18% VAT … per Rwanda Revenue Authority (RRA)" <ref_snippet file="C:/Dev/ImboniResto/src/pages/terms.tsx" lines="79-104" />
- "All transactions generate RRA-compliant electronic receipts" <ref_snippet file="C:/Dev/ImboniResto/src/pages/terms.tsx" lines="96-104" />

**Issue (Global-by-Design):**
- Tax rates and fiscal compliance are **localization configuration**, not platform constants.
- Hardcoding "18% VAT" or "RRA/EBM" implies the platform only works in one country.

**Recommended wording:**
> "Taxes (including VAT, GST, sales tax, or similar indirect taxes) are determined by your business's configured tax settings and applicable local regulations. Tax rates and compliance requirements vary by jurisdiction."

> "Fiscal compliance integrations (electronic invoicing, fiscal devices) are available where configured for your region. Receipt formats and compliance features depend on your business's localization settings."

### 2) Privacy: retention "7 years per Rwanda Revenue Authority requirements"
Evidence: <ref_snippet file="C:/Dev/ImboniResto/src/pages/privacy.tsx" lines="102-108" />

**Issue (Global-by-Design):**
- Data retention requirements vary by jurisdiction.
- Hardcoding a single country's retention period implies geographic restriction.

**Recommended wording:**
> "We retain transaction records for as long as required by applicable law and legitimate business needs (e.g., accounting, tax, and audit obligations). Retention periods vary by jurisdiction."

---

## B) Payment Provider References (Localization, not Platform Assumptions)

### 1) Terms: "Payments are processed through … (IremboPay)"
Evidence: <ref_snippet file="C:/Dev/ImboniResto/src/pages/terms.tsx" lines="107-113" />

**Issue (Global-by-Design):**
- Payment providers are **localization configuration**.
- The platform supports multiple providers (InTouch, IremboPay, and future integrations).
- Naming a single provider implies geographic or provider lock-in.

**Recommended wording:**
> "Payments are processed through your configured payment providers. Available integrations include mobile money, card gateways, and regional payment methods depending on your business location and enabled payment services."

### 2) Privacy: "Payment processors (IremboPay), cloud hosting (AWS)"
Evidence: <ref_snippet file="C:/Dev/ImboniResto/src/pages/privacy.tsx" lines="64-74" />

**Issue (Global-by-Design):**
- Provider names should not be hardcoded in legal text.
- Infrastructure providers may vary by deployment.

**Recommended wording:**
> "Service Providers: Payment processors (configured per business), cloud hosting providers (e.g., Vercel, Supabase, or equivalent), analytics tools."

---

## C) Currency References (Localization, not Platform Assumptions)

### 1) Menu price display in RWF
Evidence: <ref_snippet file="C:/Dev/ImboniResto/src/pages/discover/[slug].tsx" lines="144" />

**Issue (Global-by-Design):**
- Currency is **localization configuration**.
- Hardcoding "RWF" in display logic implies geographic restriction.

**Recommended approach:**
- Currency should be derived from business configuration or user locale.
- Display logic should use a currency formatter that respects the configured currency.

---

## D) Geographic References (Localization, not Platform Assumptions)

### 1) Discover page hardcodes city list
Evidence: <ref_snippet file="C:/Dev/ImboniResto/src/pages/discover/index.tsx" lines="17-20" />

**Issue (Global-by-Design):**
- City/location data should be derived dynamically from business profiles or geolocation.
- Hardcoding a single country's cities implies geographic restriction.

**Recommended approach:**
- Derive city filter options from actual business data in the database.
- Or remove city filter until dynamic data is available.

### 2) Contact WhatsApp number is hardcoded
Evidence: <ref_snippet file="C:/Dev/ImboniResto/src/components/PublicLayout.tsx" lines="132-134" />

**Issue (Global-by-Design):**
- Contact channels should be configurable.
- A single hardcoded phone number implies single-region support.

**Recommended approach:**
- Pull contact information from configuration/environment.
- Consider region-aware contact routing or multiple contact options.

---

## E) Public Meta/SEO Accuracy

### 1) PublicLayout meta description key is missing (but fallback text is provided)
Evidence: <ref_snippet file="C:/Dev/ImboniResto/src/components/PublicLayout.tsx" lines="21-34" />

**Issue:**
- `public.meta.description` is not present in locale JSON, but fallback text is provided.
- Missing translation keys reduce localization quality.

**Recommended approach:**
- Add `public.meta.description` to all locale JSON files for consistent localized SEO copy.

### 2) PublicLayout JSON-LD SearchAction points to `/search`
Evidence: SearchAction target includes `/search?q=...`

**Issue:**
- No `/search` route exists in the codebase.

**Recommended approach:**
- Remove SearchAction from JSON-LD schema until `/search` is implemented.

---

## F) Public Navigation (Architectural Consistency)

### Public nav links to dashboard-only routes
Evidence: `/dashboard/site-builder` and `/dashboard/profile` in public dropdown. <ref_snippet file="C:/Dev/ImboniResto/src/components/PublicLayout.tsx" lines="98-116" />

**Issue:**
- First-time visitors will click and hit auth walls.
- This is a UX issue, not a localization issue.

**Recommended approach:**
- Replace dashboard links with public feature explanation pages or remove from public nav.

---

## G) FAQ Content Rendering

### FAQ uses i18n keys instead of `faqs[]` strings
Evidence: <ref_snippet file="C:/Dev/ImboniResto/src/pages/faq.tsx" lines="118-146" />

**Issue:**
- Questions/answers likely render as `faq.items.0.q` etc.
- This is a rendering bug, not a localization philosophy issue.

**Recommended approach:**
- Render the `faqs[]` array directly per locale OR add real translation keys in locale JSON.

---

## H) UI Polish Consistency

### Public pages still use native `alert()`
Evidence:
- Referral copy fallback uses `alert()` <ref_snippet file="C:/Dev/ImboniResto/src/pages/refer/index.tsx" lines="54-57" />
- Discovery feed share uses `alert()` <ref_snippet file="C:/Dev/ImboniResto/src/pages/discover/feed.tsx" lines="86-94" />

**Issue:**
- Native `alert()` breaks platform polish and accessibility.
- This is a UX issue, not a localization philosophy issue.

**Recommended approach:**
- Replace with toast/modal patterns consistent with the rest of the platform.

---

*End of content accuracy report (aligned with Global-by-Design philosophy).*
