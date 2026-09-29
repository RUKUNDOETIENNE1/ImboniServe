# Final Launch Blocker Report

**Release:** ImboniServe v1.0  
**Date:** 2025-01-20  
**Verifier:** Independent Release Assessment  

---

## Executive Summary

This report consolidates all findings from the five verification workstreams (Customer Journey, Product, Partnership Programs, AI Readiness, Marketing & Trust) into a single launch readiness assessment.

---

## Launch Blockers

### BLOCKER-1: Affiliate Application Form Non-Functional

| Field | Value |
|-------|-------|
| **Severity** | BLOCKER (for B2B Affiliate Program only) |
| **File** | `src/pages/affiliate/program.tsx:23` |
| **Code** | `// TODO: Implement application submission` |
| **Impact** | Users cannot apply for the B2B Affiliate Program through the public form. The form displays a success message but does not send any data to the backend. |
| **Workaround** | Admins can manually create affiliates via `/api/admin/affiliates` POST endpoint |
| **Fix** | Wire `handleApply` to POST application data to an API endpoint (e.g., `/api/affiliate/apply`) that creates a pending affiliate record |
| **Estimated Effort** | 1-2 hours |
| **Blocks Launch?** | No — the platform can launch without public affiliate applications; admins can onboard affiliates manually. But this must be fixed before public affiliate recruitment. |

---

## Launch Warnings

### WARNING-1: Minimum Order Value Not Verified in Referral Tracking

| Field | Value |
|-------|-------|
| **Severity** | WARNING |
| **File** | `src/pages/api/customer-referrals/track.ts` |
| **Issue** | Service terms state "minimum 5,000 RWF first order" but the tracking API does not verify order value before awarding the 1,000 RWF referral reward |
| **Impact** | Referral rewards may be issued for orders below the stated 5,000 RWF minimum |
| **Fix** | Add order value check in the referral reward qualification flow before crediting |
| **Estimated Effort** | 30 minutes |

### WARNING-2: Homepage Stats Section Duplicate

| Field | Value |
|-------|-------|
| **Severity** | Cosmetic |
| **File** | `src/pages/index.tsx:624-654` |
| **Issue** | Stats section shows "14 days / Free trial, no card needed" in both position 1 and position 3 (duplicate) |
| **Impact** | Minor UI redundancy |
| **Fix** | Replace one of the duplicate stats with a different metric (e.g., "5 plans" or "2 payment methods") |
| **Estimated Effort** | 5 minutes |

### WARNING-3: Homepage Contains "Restaurant" in Hero Slide

| Field | Value |
|-------|-------|
| **Severity** | Cosmetic / Branding |
| **File** | `src/pages/index.tsx:161` |
| **Issue** | Hero slide subtitle says "Run your restaurant, café, hotel, or hospitality business" — uses "restaurant" instead of hospitality-neutral language |
| **Impact** | Inconsistent with hospitality-neutral language updates made to discovery and referral pages |
| **Fix** | Change to "Run your café, hotel, bar, or hospitality business" |
| **Estimated Effort** | 5 minutes |

### WARNING-4: Service Terms Use "Restaurant" Instead of Hospitality-Neutral Language

| Field | Value |
|-------|-------|
| **Severity** | Cosmetic / Branding |
| **File** | `src/pages/service-terms.tsx:135, 143, 152, 156, 340, 348, 357, 362` |
| **Issue** | Service terms reference "restaurants" in multiple places instead of "hospitality businesses" |
| **Impact** | Inconsistent with hospitality-neutral language updates |
| **Fix** | Replace "restaurant" with "hospitality business" throughout service terms |
| **Estimated Effort** | 15 minutes |

### WARNING-5: Founding Program Comment Says "RESTAURANT"

| Field | Value |
|-------|-------|
| **Severity** | Cosmetic / Code Comment |
| **File** | `src/pages/index.tsx:931` |
| **Issue** | HTML comment says `── FOUNDING RESTAURANT PROGRAM ──` but section title says "Founding Hospitality Business Program" |
| **Impact** | Code comment only; not visible to users |
| **Fix** | Update comment to say "FOUNDING HOSPITALITY BUSINESS PROGRAM" |
| **Estimated Effort** | 1 minute |

---

## Non-Blocking Notes

### NOTE-1: Pre-existing TypeScript Errors
- Unrelated scripts and app router files have pre-existing TypeScript errors
- These do not affect the Pages Router production build
- Should be cleaned up but do not block launch

### NOTE-2: OpenAI API Key Dependency
- AI features (Menu Builder, Auto-Reorder) depend on `OPENAI_API_KEY` environment variable
- Graceful error handling is in place; features degrade gracefully if key is missing
- Ensure key is configured in production environment

### NOTE-3: Supplier Marketplace Dependency
- Auto-reorder suggestions depend on marketplace products and suppliers being registered
- If no suppliers/products exist, suggestions return empty (handled gracefully)
- Onboarding first businesses will need supplier data for AI reorder to be useful

### NOTE-4: Supplier Marketplace "Coming Soon"
- Homepage correctly labels supplier marketplace as "Coming Soon — Early Access"
- This is not a misleading claim; the feature is not yet live

---

## Summary Table

| ID | Severity | Description | Blocks Launch? |
|----|----------|-------------|----------------|
| BLOCKER-1 | BLOCKER | Affiliate application form TODO | No (workaround exists) |
| WARNING-1 | WARNING | Referral min order value not verified | No |
| WARNING-2 | Cosmetic | Duplicate stats on homepage | No |
| WARNING-3 | Cosmetic | "Restaurant" in hero slide | No |
| WARNING-4 | Cosmetic | "Restaurant" in service terms | No |
| WARNING-5 | Cosmetic | "Restaurant" in code comment | No |

---

## Recommendations

### Must Fix Before Launch
1. **WARNING-2:** Replace duplicate stat on homepage (5 min)
2. **WARNING-3:** Update hero slide subtitle to hospitality-neutral (5 min)

### Should Fix Within First Week
1. **BLOCKER-1:** Wire affiliate application form to backend (1-2 hours)
2. **WARNING-1:** Add minimum order value check in referral tracking (30 min)
3. **WARNING-4:** Update service terms to hospitality-neutral language (15 min)

### Can Fix Later
1. **WARNING-5:** Update code comment (1 min)
2. **NOTE-1:** Clean up pre-existing TypeScript errors
