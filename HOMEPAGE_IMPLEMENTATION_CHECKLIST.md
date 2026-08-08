# HOMEPAGE_IMPLEMENTATION_CHECKLIST — Founder Acceptance

**Date:** 2026-06-30  
**Purpose:** Practical engineering checklist for Homepage implementation

---

## Pre-Implementation

- [ ] Founder has approved HOMEPAGE_FOUNDER_DECISIONS.md
- [ ] All required decisions have been made
- [ ] Implementation plan has been reviewed
- [ ] Backup/rollback plan is ready

---

## Phase 1: Engineering Fixes (Can Implement After General Approval)

### Quick Wins (30 minutes)

- [ ] **P0-4:** Increase hero carousel interval from 5s to 7s
  - File: `src/pages/index.tsx` line 223
  - Change: `5000` → `7000`
  - Test: Verify carousel advances every 7 seconds

- [ ] **P1-3:** Make "Built for restaurants..." more prominent
  - File: `src/pages/index.tsx`
  - Change: Increase font size and contrast
  - Test: Verify text is more visible

- [ ] **P2-1:** Add tooltip to dark mode toggle
  - File: `src/pages/index.tsx`
  - Add: `title="Toggle Dark Mode"`
  - Test: Hover over button shows tooltip

- [ ] **P2-2:** Add label to language switcher
  - File: `src/components/LanguageSwitcher.tsx`
  - Add: Visual label or flag icons
  - Test: Language switcher is clearer

---

### Remove Dashboard Links (2-3 hours)

- [ ] **P0-1a:** Remove `/dashboard/site-builder` from Solutions dropdown
  - File: `src/pages/index.tsx` lines 418-421
  - Action: Delete link or comment out
  - Test: Solutions dropdown no longer shows Site Builder

- [ ] **P0-1b:** Remove `/dashboard/profile` from Solutions dropdown
  - File: `src/pages/index.tsx` lines 430-433
  - Action: Delete link or comment out
  - Test: Solutions dropdown no longer shows List Your Business

- [ ] **P0-1c:** Remove dashboard links from mobile navigation
  - File: `src/pages/index.tsx` lines 514-518
  - Action: Delete links or comment out
  - Test: Mobile menu no longer shows dashboard links

- [ ] **P1-7:** Remove links from Real-Time OS cards
  - File: `src/pages/index.tsx` lines 247-283
  - Action: Remove `href` attributes or set to `#`
  - Test: Cards are informational only (no authentication walls)

- [ ] **P1-8:** Remove links from Growth & Retention cards
  - File: `src/pages/index.tsx` lines 285-327
  - Action: Remove `href` attributes or set to `#`
  - Test: Cards are informational only (no authentication walls)

---

### Fix Hardcoded Localization (4-5 hours)

#### Currency References

- [ ] **P0-2a-1:** Remove "1,000 RWF" from Smart Dining Slips
  - File: `src/pages/index.tsx` line 99
  - Change: "1,000 RWF per friend" → "Earn rewards for every friend"
  - Test: Feature description is generic

- [ ] **P0-2a-2:** Remove "1,000 RWF" from Referral Program
  - File: `src/pages/index.tsx` line 164
  - Change: "1,000 RWF per referral" → "Earn rewards for every referral"
  - Test: Feature description is generic

- [ ] **P1-6:** Make pricing currency configurable
  - File: `src/pages/index.tsx` lines 58-63
  - Change: Use `formatCurrency()` with locale
  - Test: Pricing displays currency based on locale

#### Payment Providers

- [ ] **P0-2b:** Remove "MTN MoMo and Airtel Money"
  - File: `src/pages/index.tsx` lines 122-124
  - Change: "MTN MoMo and Airtel Money" → "mobile money payments"
  - Test: Feature description is generic

- [ ] **P0-2b-verify:** Search for other provider references
  - Action: Search codebase for "MTN", "Airtel", "MoMo"
  - Fix: Replace any other hardcoded references
  - Test: No hardcoded provider names visible

#### Contact Information

- [ ] **P0-2c-1:** Add environment variable for WhatsApp
  - File: `.env.example`
  - Add: `NEXT_PUBLIC_SUPPORT_WHATSAPP=wa.me/250735214496`
  - Test: Variable is documented

- [ ] **P0-2c-2:** Use env var in Homepage
  - File: `src/pages/index.tsx` line 449
  - Change: Hardcoded URL → `process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP`
  - Test: Contact link uses env var

- [ ] **P0-2c-3:** Update production environment
  - Action: Add env var to Vercel/production
  - Test: Production has correct WhatsApp number

---

### Mobile Verification (2-4 hours)

- [ ] **P1-10a:** Test responsive breakpoints
  - Tool: Chrome DevTools
  - Test: 320px, 375px, 768px, 1024px
  - Verify: Layout works at all sizes

- [ ] **P1-10b:** Test on actual mobile device
  - Device: iPhone or Android
  - Test: Full Homepage scroll
  - Verify: All features work on mobile

- [ ] **P1-10c:** Fix mobile issues (if any)
  - Action: Adjust spacing, font sizes, button sizes
  - Test: Mobile experience is good

- [ ] **P1-10d:** Verify mobile CTAs
  - Test: All buttons are tappable (min 44x44px)
  - Verify: No accidental taps

---

### QA & Compliance (1 hour)

- [ ] **P2-3a:** Verify cookie consent banner
  - Test: Banner shows on first visit
  - Verify: Banner is dismissible

- [ ] **P2-3b:** Verify banner doesn't block CTAs
  - Test: "Start Free Trial" button is accessible
  - Verify: Banner doesn't cover important content

- [ ] **P2-3c:** Test keyboard navigation
  - Test: Tab through all interactive elements
  - Verify: All elements are keyboard-accessible

- [ ] **P2-3d:** Run Lighthouse audit
  - Tool: Chrome DevTools > Lighthouse
  - Test: Accessibility score
  - Verify: Score > 90

---

## Phase 2: Founder-Approved Changes (Awaiting Decisions)

### Trust Signals (If Approved)

- [ ] **P0-3a:** Add trust statement
  - Location: Below hero CTA
  - Content: "14-day free trial • No credit card required • Cancel anytime"
  - Test: Trust statement is visible

- [ ] **P0-3b:** Add customer testimonials (if content provided)
  - Location: After features section
  - Content: (Founder must provide)
  - Test: Testimonials display correctly

- [ ] **P0-3c:** Add "Trusted by X restaurants" (if true)
  - Location: Hero section or after features
  - Content: (Founder must verify number)
  - Test: Statement is factually accurate

---

### Launch Special Urgency (If Approved)

- [ ] **P0-5:** Update Launch Special badge
  - File: `src/pages/index.tsx`
  - Change: Add expiration date or customer limit (per Founder decision)
  - Test: Badge shows urgency

---

### Book Demo CTA (If Decision Made)

- [ ] **P0-6a:** Remove "Book Demo" button (if not supported)
  - File: `src/pages/index.tsx`
  - Action: Remove button from hero CTAs
  - Test: Button no longer visible

- [ ] **P0-6b:** OR Replace with "Contact Sales" (if approved)
  - File: `src/pages/index.tsx`
  - Change: Button text and destination
  - Test: New CTA works correctly

---

### Discover/Store Visibility (If Decision Made)

- [ ] **P1-9a:** Hide Discover link (if approved)
  - File: `src/pages/index.tsx`
  - Action: Remove from navigation
  - Test: Discover link no longer visible

- [ ] **P1-9b:** Hide Store link (if approved)
  - File: `src/pages/index.tsx`
  - Action: Remove from navigation
  - Test: Store link no longer visible

- [ ] **P0-7:** Remove "Explore Businesses" CTA (if Discover hidden)
  - File: `src/pages/index.tsx`
  - Action: Remove CTA button
  - Test: CTA no longer visible

- [ ] **P0-7-alt:** OR Fix Discover localization (if keeping visible)
  - File: `src/pages/discover/index.tsx`
  - Action: Make cities dynamic (not hardcoded)
  - Test: City filter works correctly

---

### Messaging Changes (If Approved)

- [ ] **P1-1:** Update hero headline (if new copy provided)
  - File: `src/pages/index.tsx`
  - Change: Replace headline text
  - Test: New headline displays correctly

- [ ] **P1-2:** Update subheadline (if new copy provided)
  - File: `src/pages/index.tsx`
  - Change: Replace subheadline text
  - Test: New subheadline displays correctly

- [ ] **P1-4:** Reduce features to 6-8 core (if approved)
  - File: `src/pages/index.tsx` lines 65-138
  - Action: Hide/remove features (per Founder decision)
  - Test: Only approved features visible

- [ ] **P1-5:** Label unready advanced features (if approved)
  - File: `src/pages/index.tsx` lines 140-171
  - Action: Add "Beta" or "Coming Soon" badges
  - Test: Labels display correctly

---

### Other Product Decisions (If Approved)

- [ ] **P1-11:** Adjust PWA install placement (if approved)
  - File: `src/pages/index.tsx`
  - Action: Move or hide PWA install prompt
  - Test: Doesn't distract from trial signup

- [ ] **P1-12:** Adjust newsletter placement (if approved)
  - File: `src/pages/index.tsx`
  - Action: Move newsletter signup to footer
  - Test: Doesn't compete with trial CTA

---

## Phase 3: Verification & Deployment

### Pre-Deployment Testing

- [ ] Run full test suite
  - Command: `npm test`
  - Verify: All tests pass

- [ ] Run TypeScript checks
  - Command: `npm run build`
  - Verify: No TypeScript errors

- [ ] Manual QA on localhost
  - Test: All Homepage changes
  - Verify: Everything works as expected

- [ ] Cross-browser testing
  - Test: Chrome, Firefox, Safari
  - Verify: Consistent experience

- [ ] Mobile device testing
  - Test: iPhone, Android
  - Verify: Mobile experience is good

---

### Deployment

- [ ] Commit changes
  - Command: `git add .`
  - Command: `git commit -m "fix(homepage): implement founder-approved changes"`
  - Verify: Commit message is clear

- [ ] Push to release branch
  - Command: `git push origin release/v1.0.0-rc1`
  - Verify: Push successful

- [ ] Verify Vercel preview deployment
  - Check: Preview URL
  - Test: All changes visible on preview

- [ ] Full QA on preview URL
  - Test: Complete Homepage flow
  - Verify: No regressions

- [ ] Merge to main (if approved)
  - Action: Create PR or merge directly
  - Verify: Production deployment triggered

---

### Post-Deployment Verification

- [ ] Verify production Homepage
  - URL: https://imboniserve.com
  - Test: All changes visible

- [ ] Test all CTAs on production
  - Test: Click every button and link
  - Verify: All work correctly

- [ ] Test mobile on production
  - Device: Real iPhone/Android
  - Verify: Mobile experience is good

- [ ] Monitor for errors
  - Check: Error logs, Sentry, etc.
  - Verify: No new errors

- [ ] Monitor conversion metrics
  - Check: Trial signups, bounce rate
  - Verify: No negative impact

---

## Post-Implementation

- [ ] Generate deployment report
  - Document: What was changed
  - Document: What was tested
  - Document: Results

- [ ] Mark Homepage as LOCKED
  - Action: No further Homepage changes without Founder approval
  - Document: Homepage is certified

- [ ] Proceed to next page (Pricing)
  - Wait: For Founder approval to continue
  - Next: Pricing page certification

---

## Rollback Plan (If Needed)

- [ ] Revert commit
  - Command: `git revert <commit-hash>`
  - Action: Push revert to production

- [ ] Verify rollback successful
  - Test: Homepage reverted to previous state
  - Verify: No errors

- [ ] Document rollback reason
  - Action: Create incident report
  - Action: Plan fix

---

*End of Homepage Implementation Checklist.*
