# FOUNDER_APPROVAL_CHECKLIST — Phase 1 (Public Website)

**Date:** 2026-06-30

This checklist requires explicit Founder approval before any implementation changes are made.

---

## Architectural Principle (Global-by-Design)

ImboniServe is a **global hospitality platform** with configurable localization.

All checklist items below align with this principle. There is no "Rwanda-only pilot" option — the platform is global by design.

---

## A) Visibility Decisions (Public Navigation)

1. **Store / Procurement Marketplace** (`/store`, `/store/*`)
   - [ ] Keep visible in public nav (core platform capability)
   - [ ] Remove from nav (route preserved) — deployment availability decision
   - [ ] Feature flag / hide until post-pilot

2. **Discover Directory** (`/discover`)
   - [ ] Keep visible in public nav (core platform capability)
   - [ ] Remove from nav (route preserved) — deployment availability decision
   - [ ] Feature flag / hide until post-pilot

3. **Discovery Feed** (`/discover/feed`)
   - [ ] Keep visible
   - [ ] Hide (route preserved)

4. **Referral Program** (`/refer`)
   - [ ] Keep visible as RC1 capability
   - [ ] Hide (route preserved)

5. **Affiliate Program** (`/affiliate/program`)
   - [ ] Hide until functional
   - [ ] Keep visible but mark "Coming soon"

6. **Solutions dropdown** in public header
   - [ ] Keep, but only link to public pages (remove dashboard links)
   - [ ] Remove entirely

---

## B) Legal/Content Wording Decisions (Global-by-Design Alignment)

7. **Tax wording** (Localization, not platform assumption)
   - [ ] Replace hardcoded "18% VAT / RRA / EBM" with configurable localization wording:
     > "Taxes (including VAT, GST, sales tax, or similar indirect taxes) are determined by your business's configured tax settings and applicable local regulations."

8. **Fiscal compliance wording** (Localization, not platform assumption)
   - [ ] Replace hardcoded "RRA-compliant electronic receipts" with configurable localization wording:
     > "Fiscal compliance integrations (electronic invoicing, fiscal devices) are available where configured for your region."

9. **Payments provider wording** (Localization, not platform assumption)
   - [ ] Replace hardcoded "IremboPay" with configurable localization wording:
     > "Payments are processed through your configured payment providers. Available integrations include mobile money, card gateways, and regional payment methods."

10. **Data retention wording** (Localization, not platform assumption)
    - [ ] Replace hardcoded "7 years per RRA" with jurisdiction-agnostic wording:
      > "We retain transaction records for as long as required by applicable law and legitimate business needs."

11. **Contact channel** (Localization concern)
    - [ ] Keep WhatsApp-only contact (hardcoded number)
    - [ ] Make contact information configurable (recommended)
    - [ ] Add email + phone contact options

---

## C) Experience/Polish Decisions

12. **Fix FAQ rendering** (currently likely shows translation keys)
    - [ ] Approve a fix to display real questions/answers

13. **Fix Discover city filter** (currently hardcodes single country's cities)
    - [ ] Approve deriving city options dynamically from business data
    - [ ] Approve removing city filter until dynamic data is available

14. **Remove native `alert()` on public pages**
    - [ ] Approve replacing with toast/modal patterns

15. **Remove JSON-LD SearchAction** (points to non-existent `/search` route)
    - [ ] Approve removing SearchAction from schema

---

## D) Approval

- [ ] I approve implementing the agreed changes for Phase 1 Public Website.
- [ ] I understand no routes will be deleted; visibility/navigation may change.
- [ ] I confirm the Global-by-Design Localization Philosophy is the official product principle.

**Founder name:** ________________________  
**Date:** ________________________

---

*End of checklist (aligned with Global-by-Design philosophy).*
