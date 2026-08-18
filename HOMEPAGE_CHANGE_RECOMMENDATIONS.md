# HOMEPAGE_CHANGE_RECOMMENDATIONS — Founder Acceptance

**Date:** 2026-06-30  
**Production URL:** https://imboniserve.com  
**Total Recommendations:** 22 (7 P0, 12 P1, 3 P2)

---

## P0 Recommendations (Must-Fix Before Certification)

### P0-1: Remove Dashboard Links from Public Navigation

**Current Behavior:**  
"Solutions" dropdown contains links to `/dashboard/site-builder` and `/dashboard/profile`.

**Issue:**  
First-time visitors click these links and hit authentication walls, breaking trust.

**Recommended Change:**  
**Option A (Recommended):** Remove dashboard links entirely from public navigation.  
**Option B:** Replace with public landing pages explaining these features (requires new pages).  
**Option C:** Add "Sign up to access" messaging before redirecting to login.

**Implementation:**  
Edit `src/pages/index.tsx` lines 418-433:
- Remove `/dashboard/site-builder` link
- Remove `/dashboard/profile` link
- Keep `/discover`, `/store`, `/refer` (if approved for RC1 visibility)

**Priority:** P0  
**Effort:** Low (1-2 hours)

---

### P0-2: Fix Hardcoded Rwanda-Specific Content

**Current Behavior:**  
- "1,000 RWF per referral" appears in multiple places
- "MTN MoMo and Airtel Money" is hardcoded
- WhatsApp number `wa.me/250735214496` is hardcoded

**Issue:**  
Violates Global-by-Design philosophy. Implies geographic restriction.

**Recommended Changes:**

#### A) Referral Rewards
**Current:** "1,000 RWF per referral"  
**Replace with:** "Earn rewards for every referral" (remove currency)  
**Or:** Make reward amount configurable per deployment

**Locations:**
- Line 99: Smart Dining Slips description
- Line 164: Referral Program advanced feature

#### B) Payment Providers
**Current:** "Accept MTN MoMo and Airtel Money natively"  
**Replace with:** "Accept mobile money payments natively"

**Location:** Line 122-124

#### C) Contact Information
**Current:** Hardcoded `wa.me/250735214496`  
**Replace with:** Environment variable `NEXT_PUBLIC_SUPPORT_WHATSAPP`

**Location:** Line 449

**Priority:** P0  
**Effort:** Medium (2-4 hours)

---

### P0-3: Add Trust Signals (Social Proof)

**Current Behavior:**  
No testimonials, customer logos, case studies, or trust badges visible.

**Issue:**  
Restaurant owners are risk-averse. Without social proof, conversion rates suffer.

**Recommended Changes:**

**Option A (Minimum):**  
Add trust statement below hero CTA:
> "14-day free trial • No credit card required • Cancel anytime"

**Option B (Better):**  
Add testimonial section after features:
```
"ImboniServe helped us reduce wait times by 40% and increase table turnover."
— [Customer Name], [Restaurant Name]
```

**Option C (Best):**  
Add all of:
- Customer testimonials (2-3)
- "Trusted by X restaurants" (if true)
- Security badge ("Bank-level encryption")
- Compliance badge (if applicable)

**Priority:** P0  
**Effort:** Medium (3-6 hours, depends on content availability)

---

### P0-4: Increase Hero Carousel Interval

**Current Behavior:**  
Carousel auto-advances every 5 seconds.

**Issue:**  
Users may not finish reading slide 1 before it advances.

**Recommended Change:**  
Increase interval to 7-8 seconds.

**Implementation:**  
Edit `src/pages/index.tsx` line 223:
```typescript
// Current
const timer = setInterval(() => {
  setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
}, 5000) // 5 seconds

// Recommended
}, 7000) // 7 seconds
```

**Priority:** P0  
**Effort:** Trivial (5 minutes)

---

### P0-5: Add Urgency to "Launch Special" Badge

**Current Behavior:**  
Badge says "Launch Special — 50% OFF All Plans" with no expiration or terms.

**Issue:**  
Visitors don't know if this is limited-time or permanent. Reduces urgency.

**Recommended Changes:**

**Option A:** Add expiration date  
> "Launch Special — 50% OFF Until July 31, 2026"

**Option B:** Add customer limit  
> "Launch Special — 50% OFF for First 100 Customers"

**Option C:** Add both  
> "Launch Special — 50% OFF • First 100 Customers • Ends July 31"

**Implementation:**  
Edit hero badge text in `src/pages/index.tsx` (search for "Launch Special").

**Priority:** P0  
**Effort:** Trivial (10 minutes)

---

### P0-6: Verify "Book a Demo" CTA is Supported

**Current Behavior:**  
"Book a Demo" button is prominently displayed.

**Issue:**  
If demos are not operationally supported (no demo team, no calendar, no script), this creates a broken promise.

**Required Verification:**
- [ ] Is there a demo booking system?
- [ ] Is there a demo team/person assigned?
- [ ] Is there a demo script/flow?

**Recommended Actions:**

**If demos ARE supported:**  
Keep the button. Verify it leads to a working booking flow.

**If demos are NOT supported:**  
**Option A:** Replace with "Contact Sales" (generic)  
**Option B:** Replace with "Chat with Us" (live chat)  
**Option C:** Remove button entirely (keep only "Start Free Trial")

**Priority:** P0  
**Effort:** Low (1 hour to verify + implement change)

---

### P0-7: Remove or Fix "Explore Businesses Near You" CTA

**Current Behavior:**  
CTA links to `/discover` page, which hardcodes Rwanda city list.

**Issue:**  
Discover page has localization bugs (hardcoded cities). If this CTA is visible, it implies geographic restriction.

**Recommended Actions:**

**Option A (Recommended):** Remove CTA until Discover is fixed  
**Option B:** Fix Discover to derive cities dynamically from business data  
**Option C:** Keep CTA but add disclaimer: "Currently available in select regions"

**Priority:** P0  
**Effort:** Low (remove CTA) or High (fix Discover)

---

## P1 Recommendations (Should-Fix for Credible RC1)

### P1-1: Improve Hero Messaging Differentiation

**Current:** "Turn Every Table Into Faster Revenue"

**Issue:**  
Generic. Competitors say similar things.

**Recommended Alternatives:**
- "The Restaurant OS Built for Real-Time Operations"
- "QR Ordering + AI Insights + Mobile Money — All in One"
- "From Order to Profit in Real-Time"
- "The Only Platform That Tracks Every Sale, Every Table, Every Action — Live"

**Priority:** P1  
**Effort:** Low (copywriting only, 1-2 hours)

---

### P1-2: Clarify Subheadline

**Current:** "Be Seen. Get Orders. Grow Fast."

**Issue:**  
Too abstract. Doesn't explain *how*.

**Recommended Replacement:**  
"Reduce wait times, serve more customers, and streamline your operations—QR ordering, POS, and AI insights in one platform."

(This is already in the description — move it up to subheadline position)

**Priority:** P1  
**Effort:** Trivial (10 minutes)

---

### P1-3: Make "Built for restaurants, hotels, bars, and cafés" More Prominent

**Current:** Small text, low contrast, easy to miss.

**Issue:**  
Critical positioning ("who is this for?") is buried.

**Recommended Change:**  
- Increase font size (from text-sm to text-base or text-lg)
- Increase contrast (from text-white/70 to text-white/90)
- Or move closer to headline

**Priority:** P1  
**Effort:** Trivial (5 minutes)

---

### P1-4: Reduce Features Section to 6-8 Core Features

**Current:** 12 feature cards displayed.

**Issue:**  
Cognitive overload. Visitors won't read all 12.

**Recommended Change:**  
Show only 6-8 core features:
- QR Code Ordering
- Inventory & Procurement
- Reports & Analytics
- AI-Powered Insights
- WhatsApp Integration
- Mobile Money Payments
- Multi-Branch Control
- Role-Based Access

Move others to "Advanced Features" or remove.

**Priority:** P1  
**Effort:** Low (1 hour)

---

### P1-5: Remove or Label Unready "Advanced Features"

**Current:** Lists Hotel Mode, Site Builder, AI Menu Builder, Discovery Marketplace, Referral Program.

**Issue:**  
If these are not fully functional in RC1, this creates broken promises.

**Recommended Actions:**

**For each feature, verify:**
- [ ] Hotel Mode: Ready for RC1?
- [ ] Site Builder: Ready for RC1?
- [ ] AI Menu Builder: Ready for RC1?
- [ ] Discovery Marketplace: Ready for RC1?
- [ ] Referral Program: Ready for RC1?

**Then:**
- Remove features not ready
- Or add "Beta" or "Coming Soon" labels

**Priority:** P1  
**Effort:** Medium (2-4 hours, depends on verification)

---

### P1-6: Make Pricing Currency Configurable

**Current:** Hardcoded RWF currency.

**Issue:**  
Violates Global-by-Design philosophy.

**Recommended Change:**  
Display currency based on:
- User locale (browser language)
- Or business configuration
- Or add currency selector

**Implementation:**  
Update pricing display logic to use `formatCurrency()` with locale-aware currency.

**Priority:** P1  
**Effort:** Medium (3-5 hours)

---

### P1-7: Replace Dashboard Links in "Real-Time Operating System" Section

**Current:** Cards link to `/dashboard/qr-analytics`, `/dashboard/tables`, etc.

**Issue:**  
First-time visitors hit authentication walls.

**Recommended Changes:**

**Option A:** Remove links (make cards informational only)  
**Option B:** Replace with anchor links to feature explanations  
**Option C:** Add "Sign up to access" messaging before redirect

**Priority:** P1  
**Effort:** Low (1-2 hours)

---

### P1-8: Replace Dashboard Links in "Growth & Retention" Section

**Current:** Cards link to `/dashboard/crm`, `/dashboard/campaigns`, `/dashboard/ab-testing`, etc.

**Issue:**  
Same as P1-7 — authentication walls.

**Recommended Change:**  
Same options as P1-7.

**Priority:** P1  
**Effort:** Low (1-2 hours)

---

### P1-9: Decide Store/Discover Visibility for RC1

**Current:** Navigation shows "Store" and "Discover" links.

**Issue:**  
If these are not part of RC1 deployment availability, they should be hidden.

**Required Decision:**
- [ ] Is Store visible in RC1?
- [ ] Is Discover visible in RC1?

**If NO:**  
Remove from navigation (but preserve routes).

**If YES:**  
Verify they work correctly and align with Global-by-Design philosophy.

**Priority:** P1  
**Effort:** Low (1 hour to hide) or High (to fix)

---

### P1-10 through P1-12: Mobile Verification, PWA Install, Newsletter Placement

(See full details in HOMEPAGE_CERTIFICATION_REPORT.md)

**Priority:** P1  
**Effort:** Medium (2-4 hours for mobile testing)

---

## P2 Recommendations (Nice-to-Have)

### P2-1: Add Tooltip to Dark Mode Toggle

**Current:** Sun/moon icon with no label.

**Recommended Change:**  
Add tooltip: "Toggle Dark Mode"

**Priority:** P2  
**Effort:** Trivial (10 minutes)

---

### P2-2: Improve Language Switcher Visibility

**Current:** "EN" dropdown may be missed by non-English speakers.

**Recommended Change:**  
Add flag icons for visual clarity.

**Priority:** P2  
**Effort:** Low (1 hour)

---

### P2-3: Verify Cookie Consent Banner

**Current:** Not visible in screenshots.

**Recommended Action:**  
Verify banner shows on first visit and doesn't block CTAs.

**Priority:** P2  
**Effort:** Low (30 minutes)

---

## Implementation Priority Order

1. **P0-4:** Increase carousel interval (5 min)
2. **P0-5:** Add urgency to Launch Special (10 min)
3. **P0-1:** Remove dashboard links from navigation (1-2 hours)
4. **P0-6:** Verify/fix Book Demo CTA (1 hour)
5. **P0-7:** Remove/fix Explore Businesses CTA (1 hour)
6. **P0-2:** Fix hardcoded localization (2-4 hours)
7. **P0-3:** Add trust signals (3-6 hours)
8. **P1-1 through P1-12:** Address P1 issues (10-20 hours total)
9. **P2-1 through P2-3:** Address P2 issues (2-3 hours total)

**Total Estimated Effort:** 20-40 hours

---

*End of Homepage Change Recommendations.*
