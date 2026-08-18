# GR-001 — Customer #1000 Readiness Assessment

**Phase:** GR-001 — Global Readiness & Localization Certification
**Date:** 2026-08-07
**Status:** Complete

---

## Executive Summary

This assessment evaluates whether ImboniServe's architecture can welcome Customer #1000 — a hypothetical hospitality business from any country in the world — without requiring them to "become Rwandan first."

**The strategic question:** "If a hospitality business from any country wanted to use ImboniServe, would our architecture welcome them — or would it ask them to become Rwandan first?"

**The answer:** The architecture has the right data model but inconsistent service-layer discipline. Customer #1 (Rwanda) will work perfectly. Customer #100 (neighboring country) will work with minor issues. Customer #1000 (global) will encounter 5 architecture risks that must be resolved first.

---

## Customer Journey Simulation

### Customer #1: Restaurant in Kigali, Rwanda

| Step | Works? | Notes |
|------|--------|-------|
| Signup | ✅ | Country hardcoded to RW — correct for Rwanda |
| MFA login | ✅ | Phone normalization +250 — correct for Rwanda |
| Setup wizard | ✅ | Default 18% VAT — correct for Rwanda |
| Menu creation | ✅ | AI extraction works in English — acceptable |
| QR ordering | ✅ | Currency RWF — correct for Rwanda |
| Payment | ✅ | InTouch/IremboPay — correct for Rwanda |
| Z-Report | ✅ | Timezone Africa/Kigali — correct for Rwanda |
| Executive dashboard | ✅ | RWF display — correct for Rwanda |

**Verdict: ✅ READY — No issues for a Rwandan business.**

---

### Customer #100: Restaurant in Nairobi, Kenya

| Step | Works? | Notes |
|------|--------|-------|
| Signup | ⚠️ | Country hardcoded to RW — would need fix (IA-5) |
| MFA login | ❌ | Phone normalization +250 — Kenyan +254 numbers would be mangled (IA-2) |
| Setup wizard | ⚠️ | Default 18% VAT — Kenya is 16%, TaxService has preset but signup doesn't call it |
| Menu creation | ✅ | AI extraction works — English is widely used in Kenya |
| QR ordering | ⚠️ | Currency would be RWF — should be KES (IA-3) |
| Payment | ❌ | InTouch/IremboPay are Rwanda-only — need Pesapal or Mpesa integration (BE-6) |
| Z-Report | ⚠️ | Timezone Africa/Kigali — Kenya is Africa/Nairobi (UTC+3, not UTC+2) (IA-1) |
| Executive dashboard | ❌ | Hardcoded RWF — should show KES (IA-4) |

**Verdict: ⚠️ NOT READY — 4 issues must be fixed for a Kenyan business.**
**Required fixes:** IA-2 (phone), IA-3 (currency), IA-4 (dashboard), IA-5 (signup country)
**Also needed:** BE-6 (Pesapal/Mpesa payment provider)

---

### Customer #500: Hotel in Dubai, UAE

| Step | Works? | Notes |
|------|--------|-------|
| Signup | ❌ | Country hardcoded to RW (IA-5) |
| MFA login | ❌ | Phone normalization +250 — UAE +971 numbers would be mangled (IA-2) |
| Setup wizard | ⚠️ | Default 18% VAT — UAE is 5%, TaxService has preset but signup doesn't call it |
| Menu creation | ⚠️ | AI extraction English-only — Arabic not supported (BE-3) |
| QR ordering | ❌ | Currency would be RWF — should be AED (IA-3) |
| Payment | ❌ | No UAE payment provider — need Stripe or local provider (BE-6) |
| Z-Report | ❌ | Timezone Africa/Kigali — UAE is Asia/Dubai (UTC+4) (IA-1) |
| Executive dashboard | ❌ | Hardcoded RWF — should show AED (IA-4) |
| Notifications | ❌ | English-only — Arabic not supported (BE-2) |
| RTL support | ❌ | No right-to-left layout support (PG-5) |

**Verdict: ❌ NOT READY — 6+ issues must be fixed for a UAE business.**
**Required fixes:** IA-1, IA-2, IA-3, IA-4, IA-5 + BE-2, BE-3, BE-6 + PG-5

---

### Customer #1000: Restaurant in New York, USA

| Step | Works? | Notes |
|------|--------|-------|
| Signup | ❌ | Country hardcoded to RW (IA-5) |
| MFA login | ❌ | Phone normalization +250 — US +1 numbers would be mangled (IA-2) |
| Setup wizard | ⚠️ | Default 18% VAT — US uses sales tax (8% avg), TaxService has US preset with SALES_TAX |
| Menu creation | ✅ | AI extraction works in English |
| QR ordering | ❌ | Currency would be RWF — should be USD (IA-3) |
| Payment | ❌ | No US payment provider — need Stripe (BE-6) |
| Z-Report | ❌ | Timezone Africa/Kigali — New York is America/New_York (UTC-5/-4 with DST) (IA-1) |
| Executive dashboard | ❌ | CEO hardcodes RWF, CFO hardcodes USD — inconsistent (IA-4) |
| Tax compliance | ❌ | EBM formatter is Rwanda-specific — US doesn't use EBM (BE-5) |
| Notifications | ⚠️ | English-only — acceptable for US but not translatable |
| Tips | ✅ | Digital tipping supported — common in US |
| Multi-tax | ❌ | No compound tax support (state + local) (PG-4) |

**Verdict: ❌ NOT READY — 7+ issues must be fixed for a US business.**
**Required fixes:** IA-1, IA-2, IA-3, IA-4, IA-5 + BE-5, BE-6 + PG-4

---

## Readiness by Market

| Market | Ready? | Blockers |
|--------|--------|----------|
| Rwanda | ✅ Ready | None |
| Kenya | ⚠️ 4 fixes needed | IA-2, IA-3, IA-4, IA-5 + BE-6 |
| Uganda | ⚠️ 4 fixes needed | IA-2, IA-3, IA-4, IA-5 + BE-6 |
| Tanzania | ⚠️ 4 fixes needed | IA-2, IA-3, IA-4, IA-5 + BE-6 |
| Nigeria | ⚠️ 5 fixes needed | IA-2, IA-3, IA-4, IA-5 + BE-6 |
| South Africa | ⚠️ 5 fixes needed | IA-2, IA-3, IA-4, IA-5 + BE-6 |
| UAE | ❌ 9 fixes needed | IA-1 through IA-5 + BE-2, BE-3, BE-6 + PG-5 |
| UK | ❌ 7 fixes needed | IA-1 through IA-5 + BE-5, BE-6 |
| USA | ❌ 8 fixes needed | IA-1 through IA-5 + BE-5, BE-6 + PG-4 |

---

## Path to Customer #1000

### Phase 1: Regional Expansion (East Africa) — After 5 Immediate Actions
- Target: Kenya, Uganda, Tanzania
- Required: IA-1 through IA-5 + BE-6 (Pesapal/Mpesa integration)
- Timeline: After GR-001 recommendations are implemented

### Phase 2: Pan-African Expansion — After Before-Expansion Items
- Target: Nigeria, South Africa, Egypt, Morocco
- Required: All Immediate + Before Expansion items
- Additional: Arabic support (PG-5 RTL), French localization (already have fr.json)

### Phase 3: Global Expansion — After Post-Growth Items
- Target: UAE, UK, USA, Europe
- Required: All items including Post-Growth
- Additional: Stripe integration, compound tax support, multi-currency settlement

---

## The Strategic Question Answered

> "If a hospitality business from any country wanted to use ImboniServe, would our architecture welcome them — or would it ask them to become Rwandan first?"

**Today's answer:** The architecture would ask them to become Rwandan first. Phone numbers must be Rwandan. Currency must be RWF. Timezone must be Africa/Kigali. Tax must be 18% VAT. Payment must go through Rwandan providers.

**After GR-001 recommendations:** The architecture would welcome them. Phone numbers would be normalized based on country. Currency would be configurable. Timezone would be business-specific. Tax would be country-specific. Payment providers would be matched to country.

**The data model is ready. The service layer needs discipline.**

---

## Conclusion

ImboniServe is ready for Customer #1 in Rwanda. The architecture has the right foundation for global expansion — the data model supports per-business configuration of currency, timezone, tax, language, and country. However, the service layer frequently bypasses this configuration with hardcoded Rwanda assumptions.

With 5 immediate actions (timezones, phone normalization, payment currency, dashboard currency, signup country), the platform would be ready for East African expansion. With 8 additional before-expansion actions, the platform would be ready for pan-African expansion. With 6 post-growth evolutions, the platform would be ready for global expansion.

**The path to Customer #1000 is clear. It requires discipline, not redesign.**
