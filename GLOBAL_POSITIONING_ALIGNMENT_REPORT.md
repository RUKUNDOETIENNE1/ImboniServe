# GLOBAL_POSITIONING_ALIGNMENT_REPORT — Phase 1 (Public Website)

**Date:** 2026-06-30

This report documents all updates made to Phase 1 deliverables to align with the approved **Global-by-Design Localization Philosophy**.

---

## Official Product Principle

ImboniServe is a **global hospitality platform** with configurable localization.

### Three-Layer Model

| Layer | Description | Examples |
|---|---|---|
| **Core Platform** | Universal restaurant operations — work anywhere, no country assumptions | POS, QR ordering, KDS, inventory, recipes, consumption engine, reporting, AI, CRM, reservations, loyalty, staff management |
| **Localization** | Configuration layer — not hardcoded behavior | Taxes, fiscal compliance, currencies, payment providers, languages, date/time formats, receipt layouts, regional regulations |
| **Deployment Availability** | Current operational integrations — distinct from platform capability | Which payment providers are live, which fiscal integrations are enabled, which languages are translated |

---

## Deliverables Updated

### 1. PUBLIC_WEBSITE_CERTIFICATION.md

**Changes made:**

| Section | Previous wording | Updated wording |
|---|---|---|
| New section | (none) | Added "Architectural Principle (Global-by-Design)" section explaining the three-layer model |
| P0 #3 | "Legal pages contain Rwanda-specific tax/regulatory claims that conflict with the stated goal of a country-agnostic platform" | "Legal pages hardcode country-specific tax/regulatory claims instead of treating these as configurable localization. This conflicts with the Global-by-Design architecture." |
| P1 #4 | "Payments provider references are inconsistent (legal/privacy referencing IremboPay as if primary; RC1 supports InTouch + IremboPay)" | "Payments provider references assume a single provider instead of describing configurable payment integrations" |
| P1 #6 | "Discover page hardcodes Rwanda city list (Kigali, etc.), which is fine for a Rwanda-only launch, but not for a country-agnostic story" | "Discover page hardcodes a single country's city list instead of deriving locations dynamically from business data. This is a localization bug, not a positioning choice." |
| Recommendations #2 | "Make legal pages country-agnostic (or explicitly scope to 'Rwanda pilot' if that is the launch reality)" | "Update legal pages to use Global-by-Design wording — taxes, fiscal compliance, and payment providers are configurable localization, not hardcoded country assumptions" |

**Rwanda-only option removed:** The recommendation to "scope to Rwanda pilot" has been removed. This is no longer a valid option.

---

### 2. CONTENT_ACCURACY_REPORT.md

**Changes made:**

| Section | Previous wording | Updated wording |
|---|---|---|
| New section | (none) | Added "Architectural Principle (Global-by-Design)" section |
| Section A header | "Country-specific tax/regulatory claims (should be country-agnostic)" | "Tax/Regulatory Claims (Localization, not Platform Assumptions)" |
| Tax recommendation | "Replace Rwanda-specific sections with: 'Taxes (VAT/GST/sales tax) may apply depending on your jurisdiction...'" | "Taxes (including VAT, GST, sales tax, or similar indirect taxes) are determined by your business's configured tax settings and applicable local regulations. Tax rates and compliance requirements vary by jurisdiction." |
| Fiscal compliance recommendation | (implicit in tax section) | Explicit new recommendation: "Fiscal compliance integrations (electronic invoicing, fiscal devices) are available where configured for your region. Receipt formats and compliance features depend on your business's localization settings." |
| Section B header | "Payment provider accuracy / consistency" | "Payment Provider References (Localization, not Platform Assumptions)" |
| Payment recommendation | "Payments are processed through our configured payment providers (e.g., mobile money and card gateways). Available methods may vary by country and by merchant configuration." | "Payments are processed through your configured payment providers. Available integrations include mobile money, card gateways, and regional payment methods depending on your business location and enabled payment services." |
| New section | (none) | Added "Currency References (Localization, not Platform Assumptions)" section |
| Section F header | "Rwanda-specific geography/contact" | "Geographic References (Localization, not Platform Assumptions)" |
| City filter recommendation | "If RC1 is Rwanda-only: explicitly label as Rwanda pilot. If country-agnostic: remove city hardcoding and use dynamic locations." | "Derive city filter options from actual business data in the database. Or remove city filter until dynamic data is available." |

**Rwanda-only option removed:** The recommendation to "label as Rwanda pilot" has been removed. This is no longer a valid option.

---

### 3. PUBLIC_NAVIGATION_RECOMMENDATIONS.md

**Changes made:**

| Section | Previous wording | Updated wording |
|---|---|---|
| New section | (none) | Added "Architectural Principle (Global-by-Design)" section explaining how navigation recommendations align with the three-layer model |
| New section | (none) | Added "Global-by-Design Alignment Notes" section clarifying that Discover/Store are core capabilities (not localization), and visibility decisions are deployment availability decisions |
| Contact link | "Replace hardcoded Rwanda WhatsApp number with config-driven value" | Added clarification: "This is a localization concern — contact channels should be configurable." |

**No Rwanda-only options were present in this document.**

---

### 4. FOUNDER_APPROVAL_CHECKLIST.md

**Changes made:**

| Section | Previous wording | Updated wording |
|---|---|---|
| New section | (none) | Added "Architectural Principle (Global-by-Design)" section with explicit statement: "There is no 'Rwanda-only pilot' option — the platform is global by design." |
| Item 7 (Country scope) | "Rwanda-only pilot: legal + pricing may reference Rwanda explicitly" / "Country-agnostic RC1: remove fixed VAT/RRA/EBM wording" | **Removed entirely.** Replaced with explicit tax wording approval item. |
| Item 7 (new) | (none) | "Tax wording (Localization, not platform assumption): Replace hardcoded '18% VAT / RRA / EBM' with configurable localization wording" |
| Item 8 (new) | (none) | "Fiscal compliance wording (Localization, not platform assumption): Replace hardcoded 'RRA-compliant electronic receipts' with configurable localization wording" |
| Item 9 (new) | (none) | "Payments provider wording (Localization, not platform assumption): Replace hardcoded 'IremboPay' with configurable localization wording" |
| Item 10 (new) | (none) | "Data retention wording (Localization, not platform assumption): Replace hardcoded '7 years per RRA' with jurisdiction-agnostic wording" |
| Item 11 (Contact channel) | "Keep WhatsApp-only contact" / "Add email + phone contact options" / "Confirm correct WhatsApp number and branding" | Added option: "Make contact information configurable (recommended)" |
| Item 13 (new) | (none) | "Fix Discover city filter (currently hardcodes single country's cities)" |
| Item 15 (new) | (none) | "Remove JSON-LD SearchAction (points to non-existent /search route)" |
| Approval section | (none) | Added confirmation: "I confirm the Global-by-Design Localization Philosophy is the official product principle." |

**Rwanda-only option removed:** The "Rwanda-only pilot" checkbox has been removed. This is no longer a valid option.

---

### 5. PUBLIC_PAGE_REVIEW_MATRIX.md

**Changes made:**

| Section | Previous wording | Updated wording |
|---|---|---|
| New section | (none) | Added "Architectural Principle (Global-by-Design)" section |
| New column | (none) | Added "Layer" column to matrix (Core / Localization / Deployment) |
| `/terms` reasoning | "Rwanda-specific compliance" | "Hardcoded localization" |
| `/privacy` reasoning | "Inaccurate providers + retention" | "Hardcoded localization" |
| `/discover` reasoning | "Hardcoded cities" | "Hardcoded cities is a localization bug" |
| `/refer` reasoning | "Uses alert" | "Uses alert; hardcoded reward amounts" |
| New section | (none) | Added "Summary by Layer" section categorizing all issues by Core Platform / Localization / Deployment Availability |

**Rwanda-only option removed:** The recommendation to "label as Rwanda pilot" has been removed from the `/discover` row.

---

## Summary of Rwanda-Specific Assumptions Corrected

| Location | Previous assumption | Corrected approach |
|---|---|---|
| Legal pages (terms/privacy/service-terms) | Hardcoded "18% VAT", "RRA", "EBM", "7 years retention" | Configurable localization wording |
| Legal pages (terms/privacy) | Hardcoded "IremboPay" as payment provider | Configurable payment provider wording |
| Discover page | Hardcoded Rwanda city list | Dynamic city data from business profiles |
| Contact link | Hardcoded Rwanda WhatsApp number | Configurable contact information |
| Refer page | Hardcoded reward amounts (implied RWF) | Configurable reward amounts |
| Business profile page | Hardcoded "RWF" currency display | Configurable currency display |
| Positioning options | "Rwanda-only pilot" was offered as valid choice | Removed — platform is global by design |

---

## Remaining Items for Later Phases

The following items should be reviewed in later Founder Acceptance phases:

1. **Dashboard pages** — May contain additional hardcoded localization (currency, tax, fiscal compliance UI).
2. **API responses** — May return hardcoded currency or tax assumptions.
3. **Email templates** — May contain hardcoded localization.
4. **PDF/receipt generation** — May contain hardcoded fiscal compliance assumptions.
5. **Pricing configuration** — Should be reviewed to ensure currency is configurable.
6. **Onboarding flow** — Should collect localization preferences (country, currency, tax settings).

These are out of scope for Phase 1 (Public Website) but should be flagged for Phase 2+ review.

---

## Confirmation

The Phase 1 Public Website Review now aligns with the approved Global-by-Design Localization Philosophy:

- [x] No public website recommendation incorrectly assumes Rwanda-only positioning.
- [x] Core platform capabilities are clearly separated from localization.
- [x] Localization is consistently treated as configuration rather than platform behavior.
- [x] Current deployment availability is distinguished from platform capability.
- [x] Public messaging recommendations accurately represent ImboniServe as a global Restaurant Operating System with configurable localization.

---

*End of alignment report.*
