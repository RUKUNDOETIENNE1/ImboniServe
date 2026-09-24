# HOMEPAGE_IMPLEMENTATION_PLAN — Founder Acceptance

**Date:** 2026-06-30  
**Purpose:** Exact implementation order for Homepage changes after Founder approval

---

## Implementation Strategy

**Phase 1:** Engineering Fixes Only (Group 1)  
**Phase 2:** Founder-Approved Changes (Group 2)  
**Phase 3:** Verification & Deployment

---

## Phase 1: Engineering Fixes (12-20 hours)

These are objective fixes that can be implemented immediately after general Founder approval.

### Step 1: Quick Wins (30 minutes)

**Objective:** Fix trivial issues first for immediate improvement.

| Task | File | Change | Time |
|---|---|---|---:|
| 1.1 | `src/pages/index.tsx` line 223 | Change carousel interval from 5000ms to 7000ms | 5min |
| 1.2 | `src/pages/index.tsx` | Increase "Built for restaurants..." font size and contrast | 5min |
| 1.3 | `src/pages/index.tsx` | Add tooltip to dark mode toggle button | 10min |
| 1.4 | `src/pages/index.tsx` | Add tooltip/label to language switcher | 10min |

**Verification:**
- [ ] Carousel advances every 7 seconds
- [ ] "Built for restaurants..." is more visible
- [ ] Dark mode toggle shows tooltip on hover
- [ ] Language switcher is clearer

---

### Step 2: Remove Dashboard Links (2-3 hours)

**Objective:** Fix broken navigation that leads to authentication walls.

| Task | File | Change | Time |
|---|---|---|---:|
| 2.1 | `src/pages/index.tsx` lines 418-433 | Remove `/dashboard/site-builder` link from Solutions dropdown | 15min |
| 2.2 | `src/pages/index.tsx` lines 430-433 | Remove `/dashboard/profile` link from Solutions dropdown | 15min |
| 2.3 | `src/pages/index.tsx` lines 514-518 | Remove same links from mobile navigation | 15min |
| 2.4 | `src/pages/index.tsx` lines 247-283 | Remove links from Real-Time OS cards (make informational only) | 1h |
| 2.5 | `src/pages/index.tsx` lines 285-327 | Remove links from Growth & Retention cards (make informational only) | 1h |

**Implementation Notes:**
- Keep card UI intact
- Remove `href` attributes or replace with `#` (no-op)
- Remove hover effects that imply clickability
- Or replace with anchor links to feature explanations (if available)

**Verification:**
- [ ] Solutions dropdown no longer shows dashboard links
- [ ] Real-Time OS cards are informational only
- [ ] Growth & Retention cards are informational only
- [ ] No public navigation leads to authentication walls

---

### Step 3: Fix Hardcoded Localization (4-5 hours)

**Objective:** Align with Global-by-Design philosophy.

#### 3.1: Remove Hardcoded Currency (2-3 hours)

| Task | File | Change | Time |
|---|---|---|---:|
| 3.1.1 | `src/pages/index.tsx` line 99 | Replace "1,000 RWF per friend" with "Earn rewards for every friend" | 10min |
| 3.1.2 | `src/pages/index.tsx` line 164 | Replace "1,000 RWF per referral" with "Earn rewards for every referral" | 10min |
| 3.1.3 | `src/pages/index.tsx` lines 58-63 | Update pricing display to use locale-aware currency | 2-3h |

**Implementation for 3.1.3:**
```typescript
// Current (hardcoded RWF)
const plans = PRICING_PLANS.map(p => ({
  ...p,
  monthlyPrice: p.monthlyPriceRWF,
  annualMonthly: p.annualMonthlyRWF,
  annualTotal: p.annualTotalRWF
}))

// Recommended (locale-aware)
const plans = PRICING_PLANS.map(p => ({
  ...p,
  monthlyPrice: formatCurrency(p.monthlyPriceRWF, locale),
  annualMonthly: formatCurrency(p.annualMonthlyRWF, locale),
  annualTotal: formatCurrency(p.annualTotalRWF, locale)
}))
```

**Verification:**
- [ ] No hardcoded "RWF" references in feature descriptions
- [ ] Pricing displays currency based on locale
- [ ] Reward amounts are generic ("earn rewards" not "1,000 RWF")

---

#### 3.2: Remove Hardcoded Payment Providers (1 hour)

| Task | File | Change | Time |
|---|---|---|---:|
| 3.2.1 | `src/pages/index.tsx` lines 122-124 | Replace "MTN MoMo and Airtel Money" with "mobile money payments" | 10min |
| 3.2.2 | Review other pages for similar references | Search codebase for "MTN", "Airtel", "MoMo" | 30min |
| 3.2.3 | Update any other hardcoded provider references | As needed | 20min |

**Verification:**
- [ ] No hardcoded "MTN MoMo" or "Airtel Money" references
- [ ] Mobile money feature description is generic

---

#### 3.3: Make Contact Information Configurable (1 hour)

| Task | File | Change | Time |
|---|---|---|---:|
| 3.3.1 | `.env.example` | Add `NEXT_PUBLIC_SUPPORT_WHATSAPP=wa.me/250735214496` | 5min |
| 3.3.2 | `src/pages/index.tsx` line 449 | Replace hardcoded WhatsApp URL with `process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP` | 10min |
| 3.3.3 | Verify other pages use same env var | Check PublicLayout, footer, contact pages | 30min |
| 3.3.4 | Update deployment env vars | Add to Vercel/production environment | 15min |

**Verification:**
- [ ] Contact WhatsApp number is configurable via environment variable
- [ ] All public pages use the same env var
- [ ] Production deployment has correct value set

---

### Step 4: Mobile Verification & Fixes (2-4 hours)

**Objective:** Ensure Homepage works correctly on mobile devices.

| Task | Tool | Action | Time |
|---|---|---|---:|
| 4.1 | Chrome DevTools | Test responsive breakpoints (320px, 375px, 768px, 1024px) | 1h |
| 4.2 | Actual mobile device | Test on iPhone/Android | 1h |
| 4.3 | Fix any mobile issues | Adjust spacing, font sizes, button sizes as needed | 1-2h |

**Test Checklist:**
- [ ] Hero section readable on mobile
- [ ] CTAs are tappable (min 44x44px)
- [ ] Navigation menu works on mobile
- [ ] Feature cards stack correctly
- [ ] Pricing table is responsive
- [ ] Footer links are accessible
- [ ] No horizontal scroll
- [ ] Images load correctly

---

### Step 5: QA & Compliance (1 hour)

**Objective:** Verify cookie banner and accessibility.

| Task | Action | Time |
|---|---|---:|
| 5.1 | Verify cookie consent banner shows on first visit | 15min |
| 5.2 | Verify banner doesn't block CTAs | 15min |
| 5.3 | Test keyboard navigation | 15min |
| 5.4 | Run Lighthouse accessibility audit | 15min |

**Verification:**
- [ ] Cookie banner visible on first visit
- [ ] Banner dismissible
- [ ] Banner doesn't block "Start Free Trial" button
- [ ] All interactive elements keyboard-accessible
- [ ] Lighthouse accessibility score > 90

---

## Phase 2: Founder-Approved Changes (Variable Time)

**These changes require explicit Founder decisions before implementation.**

### Step 6: Trust Signals (2-6 hours, depends on content)

**Awaiting Founder Decision:**
- [ ] Which trust signals to add?
- [ ] Content for testimonials?
- [ ] Placement?

**If Approved:**

| Task | Change | Time |
|---|---|---:|
| 6.1 | Add trust statement below hero CTA | "14-day free trial • No credit card required" | 30min |
| 6.2 | Add testimonial section after features | Customer testimonials (requires content) | 2-4h |
| 6.3 | Add "Trusted by X restaurants" | If factually true | 30min |

---

### Step 7: Launch Special Urgency (10 minutes)

**Awaiting Founder Decision:**
- [ ] Add expiration date? (when?)
- [ ] Add customer limit? (how many?)
- [ ] Keep as-is?

**If Approved:**

| Task | Change | Time |
|---|---|---:|
| 7.1 | Update badge text | Add expiration or limit | 10min |

---

### Step 8: Book Demo CTA (1 hour or N/A)

**Awaiting Founder Decision:**
- [ ] Keep button (demos are supported)?
- [ ] Remove button?
- [ ] Replace with "Contact Sales"?

**If Removal Approved:**

| Task | Change | Time |
|---|---|---:|
| 8.1 | Remove "Book Demo" button from hero CTAs | 15min |
| 8.2 | Adjust CTA layout | 15min |
| 8.3 | Update mobile CTAs | 15min |
| 8.4 | Test conversion flow | 15min |

---

### Step 9: Discover/Store Visibility (1-8 hours)

**Awaiting Founder Decision:**
- [ ] Keep Discover visible?
- [ ] Keep Store visible?
- [ ] Hide both?

**If Hiding Approved:**

| Task | Change | Time |
|---|---|---:|
| 9.1 | Remove Discover link from navigation | 15min |
| 9.2 | Remove Store link from navigation | 15min |
| 9.3 | Remove "Explore Businesses" CTA | 15min |
| 9.4 | Update mobile navigation | 15min |

**If Keeping Visible:**

| Task | Change | Time |
|---|---|---:|
| 9.5 | Fix Discover localization bugs (dynamic cities) | 4-8h |

---

### Step 10: Messaging Changes (1-3 hours)

**Awaiting Founder Decision:**
- [ ] New hero headline?
- [ ] New subheadline?
- [ ] Which features to emphasize?

**If Approved:**

| Task | Change | Time |
|---|---|---:|
| 10.1 | Update hero headline | Replace text | 10min |
| 10.2 | Update subheadline | Replace text | 10min |
| 10.3 | Reduce features to 6-8 core | Hide/remove features | 1h |
| 10.4 | Label unready advanced features | Add "Beta" or "Coming Soon" badges | 1h |

---

## Phase 3: Verification & Deployment (2-3 hours)

### Step 11: Pre-Deployment Verification

| Task | Action | Time |
|---|---|---:|
| 11.1 | Run full test suite | `npm test` | 15min |
| 11.2 | Run TypeScript checks | `npm run build` | 15min |
| 11.3 | Manual QA on localhost | Test all changes | 1h |
| 11.4 | Cross-browser testing | Chrome, Firefox, Safari | 30min |
| 11.5 | Mobile device testing | iPhone, Android | 30min |

**Verification Checklist:**
- [ ] All tests pass
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] All CTAs work correctly
- [ ] Navigation works correctly
- [ ] Mobile experience is good
- [ ] No broken links
- [ ] No hardcoded localization visible

---

### Step 12: Deployment

| Task | Action | Time |
|---|---|---:|
| 12.1 | Commit changes | `git commit -m "fix(homepage): implement founder-approved changes"` | 5min |
| 12.2 | Push to release branch | `git push origin release/v1.0.0-rc1` | 5min |
| 12.3 | Verify Vercel deployment | Check preview URL | 10min |
| 12.4 | Test deployed preview | Full QA on preview URL | 30min |
| 12.5 | Merge to main (if approved) | Deploy to production | 10min |

---

### Step 13: Post-Deployment Verification

| Task | Action | Time |
|---|---|---:|
| 13.1 | Verify production Homepage | Test https://imboniserve.com | 15min |
| 13.2 | Test all CTAs on production | Click through every button/link | 15min |
| 13.3 | Test mobile on production | Real device testing | 15min |
| 13.4 | Monitor for errors | Check error logs | 15min |

---

## Total Time Estimates

| Phase | Minimum | Maximum |
|---|---:|---:|
| **Phase 1: Engineering Fixes** | 12h | 20h |
| **Phase 2: Founder-Approved Changes** | 3h | 15h |
| **Phase 3: Verification & Deployment** | 2h | 3h |
| **TOTAL** | **17h** | **38h** |

---

## Implementation Order (Recommended)

1. ✅ **Quick wins** (30min) — immediate visible improvement
2. ✅ **Remove dashboard links** (2-3h) — fix broken navigation
3. ✅ **Fix hardcoded localization** (4-5h) — architectural compliance
4. ✅ **Mobile verification** (2-4h) — ensure mobile works
5. ✅ **QA & compliance** (1h) — cookie banner, accessibility
6. ⏸️ **Await Founder decisions** — STOP HERE until approved
7. ✅ **Implement approved changes** (3-15h) — trust signals, messaging, etc.
8. ✅ **Verification & deployment** (2-3h) — test and deploy

---

## Risk Mitigation

### High-Risk Changes
- Pricing currency display (affects all pricing)
- Removing CTAs (affects conversion)
- Messaging changes (affects positioning)

**Mitigation:**
- Test thoroughly on staging
- Have rollback plan ready
- Monitor conversion metrics post-deployment

### Medium-Risk Changes
- Navigation changes (affects discoverability)
- Feature section changes (affects comprehension)

**Mitigation:**
- A/B test if possible
- Monitor bounce rates

### Low-Risk Changes
- Carousel timing (minor UX improvement)
- Tooltip additions (progressive enhancement)
- Visual prominence (CSS only)

**Mitigation:**
- None needed

---

*End of Homepage Implementation Plan.*
