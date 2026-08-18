# Product Polish Backlog

> **Validation Phase:** Product Readiness Validation (PRV)  
> **Date:** July 25, 2026  
> **Workstream:** WS9 — Product Polish

---

## Methodology

Identified polish opportunities through code inspection of UI components, page layouts, wording, icons, default values, onboarding flow, discoverability, workflow simplification, and user guidance. Items are prioritized by impact and effort.

---

## P0 — High Impact, Low Effort (Do Before Launch)

| # | Item | File(s) | Effort | Impact |
|---|------|---------|--------|--------|
| 1 | Re-enable environment validation | `next.config.js:1-11` | 30 min | Prevents silent production failures |
| 2 | Remove `test-minimal.tsx` from dashboard | `src/pages/dashboard/test-minimal.tsx` | 5 min | Clean up test artifacts |
| 3 | Remove `index.tsx.backup` from dashboard | `src/pages/dashboard/index.tsx.backup` | 5 min | Clean up backup files |
| 4 | Fix "Export PDF" placeholder | `src/pages/dashboard/reports.tsx:42` | 2 hrs | Replace "coming soon" toast with actual PDF generation |
| 5 | Add payment setup to onboarding wizard | `src/pages/setup/index.tsx` | 1 hr | New businesses configure payment before first sale |
| 6 | Create `.env.example` file | Root directory | 30 min | Standard deployment documentation |
| 7 | Standardize toast system | Multiple files | 2 hrs | Pick one (react-hot-toast or useToast), migrate all pages |

---

## P1 — High Impact, Medium Effort (Do Post-Launch)

| # | Item | File(s) | Effort | Impact |
|---|------|---------|--------|--------|
| 8 | Add empty state illustrations for list pages | Tables, Reservations, Orders, Transactions | 3 hrs | Better first impression for new businesses |
| 9 | Add "Close Day" / Z-Report workflow | New page + API | 4 hrs | Formal daily closing for restaurant operations |
| 10 | Show feature-flagged items as "Locked" with upgrade CTA | `DashboardLayout.tsx` | 3 hrs | Users discover premium features |
| 11 | Add table status colors on tables page | `src/pages/dashboard/tables.tsx` | 1 hr | Visual operational awareness |
| 12 | Add low-credit warning banner on AI pages | `src/pages/dashboard/ai.tsx` | 1 hr | Prevents unexpected AI credit exhaustion |
| 13 | Add discount/coupon management | New page + API | 6 hrs | Common restaurant promotion need |
| 14 | Ensure all API error catches show user-facing feedback | Multiple files | 2 hrs | Users know when something fails |
| 15 | Document status of hidden dashboard pages | CEO, CFO, Site Builder, Campaigns, A/B Testing | 1 hr | Clarify GA vs Beta vs Deprecated |

---

## P2 — Medium Impact, Low Effort (Quick Wins)

| # | Item | File(s) | Effort | Impact |
|---|------|---------|--------|--------|
| 16 | Add ARIA labels to icon-only buttons | Multiple files | 2 hrs | Accessibility improvement |
| 17 | Add skip-to-content link | `DashboardLayout.tsx` | 30 min | Accessibility |
| 18 | Add keyboard shortcuts for waiter/cashier | Waiter, Orders pages | 3 hrs | Power user speed |
| 19 | Show estimated AI credit cost before triggering | AI pages | 2 hrs | Cost transparency |
| 20 | Add "Welcome to your dashboard" empty state | `src/pages/dashboard/index.tsx` | 1 hr | Better first-time experience |
| 21 | Add table floor plan visual view | Tables page | 4 hrs | Visual restaurant management |
| 22 | Add tip/gratuity field on checkout | `src/pages/order/checkout.tsx` | 1 hr | Optional tipping support |

---

## P3 — Low Priority (Backlog)

| # | Item | Effort | Impact |
|---|------|--------|--------|
| 23 | Add thermal printer support (WebUSB/Bluetooth) | 8 hrs | Hardware compatibility |
| 24 | Add offline order caching (Service Worker) | 8 hrs | Resilience to internet drops |
| 25 | Add delivery management module | 12 hrs | Growing delivery market |
| 26 | Add bar-specific features (tabs, happy hour) | 8 hrs | Bar segment fit |
| 27 | Add catering module | 8 hrs | Catering segment fit |
| 28 | Add multi-currency support | 4 hrs | Regional expansion |
| 29 | Screen reader testing and optimization | 4 hrs | Full accessibility compliance |
| 30 | Add third-party integration marketplace | 20 hrs | Extensibility |

---

## Wording Issues

| # | Location | Current | Suggested | Priority |
|---|----------|---------|-----------|----------|
| 1 | Reports export button | "PDF export coming soon" | Remove button until implemented, or implement | P0 |
| 2 | Setup wizard | "Welcome to ImboniServe! 🎉" | Professional but welcoming — keep as is | — |
| 3 | Smart Dining Slips | "Smart Dining Slips™" | ™ symbol may confuse users — consider removing | P2 |
| 4 | Staff delete | "Deactivate Staff Member" | Correct — not "Delete" which would be misleading | — |
| 5 | Kitchen roles | "Kitchen / Operations" | Consistent across UI — good | — |
| 6 | AI page | "Hospitality AI" | Clear and branded — good | — |

---

## Default Values

| Setting | Current Default | Assessment | Recommendation |
|---------|----------------|------------|----------------|
| Currency | RWF | ✅ Correct for Rwanda | — |
| Tax mode | EXCLUSIVE | ✅ Standard for Rwanda | — |
| Tax rate | 18% | ✅ Correct (VAT in Rwanda) | — |
| WhatsApp owner reports | Enabled | ✅ Good default | — |
| WhatsApp client slips | Disabled | ✅ Good default (opt-in) | — |
| Daily report time | 07:30 | ✅ Good default | — |
| Timezone | Africa/Kigali | ✅ Correct | — |
| Staff role | CASHIER | ✅ Safe default | — |
| QR type | table | ✅ Most common use case | — |
| Split payment fee | 5% | ⚠️ Verify this is intentional | Document fee structure |

---

## Icon Consistency

| Area | Icon Library | Status |
|------|-------------|--------|
| Dashboard | Lucide | ✅ Consistent |
| Navigation | Lucide | ✅ Consistent |
| Forms | Lucide | ✅ Consistent |
| Tables | Lucide | ✅ Consistent |
| Kitchen | Lucide | ✅ Consistent |
| AI | Lucide | ✅ Consistent |
| Settings | Lucide | ✅ Consistent |

**Verdict**: ✅ Icon usage is consistent throughout the platform.

---

## Layout Issues

| # | Page | Issue | Priority |
|---|------|-------|----------|
| 1 | Dashboard | Stats cards use hardcoded "+12%", "+8%" change indicators that don't reflect real data | P1 |
| 2 | Transactions | Stats cards show hardcoded change percentages | P1 |
| 3 | Staff | Stats grid is good but "Owners" count may always be 1 | P2 |
| 4 | Reports | No date picker for custom date ranges | P2 |
| 5 | Settings | Tab navigation is clear but could use icons | P3 |

---

## Onboarding Flow Assessment

| Step | Present | Clear | Notes |
|------|---------|-------|-------|
| Account creation (signup) | ✅ | ✅ | Name, email, password, business name, type |
| Plan selection | ✅ | ✅ | 5 plans with feature comparison |
| Terms agreement | ✅ | ✅ | Checkbox for terms |
| Language selection | ✅ | ✅ | EN/FR/RW on signup page |
| Setup wizard | ✅ | ✅ | Progress bar, step cards, next action |
| Add menu | ✅ | ✅ | Links to menu builder |
| Configure tables | ✅ | ✅ | Links to tables page |
| Invite staff | ✅ | ✅ | Links to staff page |
| Payment configuration | ❌ | ❌ | **Missing from wizard** |
| First sale | ✅ | ✅ | Tracked and celebrated |

### Recommendation
Add "Configure Payment Methods" as step 2 in the setup wizard, between "Add Menu" and "Configure Tables". This ensures new businesses can accept payments before their first sale.

---

## Summary

| Priority | Count | Total Effort |
|----------|-------|-------------|
| P0 (Before Launch) | 7 | ~6 hours |
| P1 (Post-Launch) | 8 | ~23 hours |
| P2 (Quick Wins) | 7 | ~13 hours |
| P3 (Backlog) | 8 | ~80 hours |
| **Total** | **30** | **~122 hours** |

The P0 items are the minimum required for a polished product launch. They are low-effort, high-impact changes that significantly improve the first impression and operational reliability.
