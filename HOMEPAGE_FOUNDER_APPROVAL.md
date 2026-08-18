# HOMEPAGE_FOUNDER_APPROVAL — Founder Acceptance Checklist

**Date:** 2026-06-30  
**Production URL:** https://imboniserve.com

---

## Instructions

This checklist requires explicit Founder approval before any Homepage changes are implemented.

**Implementation Policy:**
- Nothing will be changed without your approval
- You can approve all, some, or none of the recommendations
- You can request modifications to any recommendation
- Implementation will only begin after you sign off

---

## A) Navigation Decisions (P0)

### 1. Solutions Dropdown
The "Solutions" dropdown currently contains links to dashboard-only routes (`/dashboard/site-builder`, `/dashboard/profile`). First-time visitors hit authentication walls.

**Recommended Action:** Remove dashboard links from Solutions dropdown.

- [ ] **Approve:** Remove `/dashboard/site-builder` and `/dashboard/profile` from public navigation
- [ ] **Reject:** Keep dashboard links (explain why): _______________
- [ ] **Modify:** (describe alternative): _______________

---

### 2. Store Visibility
The "Store" link is currently visible in navigation.

**Question:** Should Store (procurement marketplace) be visible in RC1?

- [ ] **Keep visible** — Store is ready for RC1 deployment
- [ ] **Hide from navigation** — Store is not part of RC1 deployment availability
- [ ] **Undecided** — Need more information

---

### 3. Discover Visibility
The "Discover" link is currently visible in navigation. However, Discover has localization bugs (hardcoded Rwanda cities).

**Question:** Should Discover be visible in RC1?

- [ ] **Keep visible** — Fix localization bugs first, then keep
- [ ] **Hide from navigation** — Discover is not part of RC1 deployment availability
- [ ] **Keep visible as-is** — Hardcoded cities are acceptable for RC1
- [ ] **Undecided** — Need more information

---

### 4. Referral Program Visibility
The "Share & earn rewards" button and referral links are currently visible.

**Question:** Should Referral Program be visible in RC1?

- [ ] **Keep visible** — Referral program is ready for RC1
- [ ] **Hide from navigation** — Referral program is not part of RC1 deployment availability
- [ ] **Undecided** — Need more information

---

### 5. Dashboard Feature Links
Feature cards in "Real-Time Operating System" and "Growth & Retention" sections link to dashboard routes (e.g., `/dashboard/qr-analytics`, `/dashboard/crm`). First-time visitors hit authentication walls.

**Recommended Action:** Remove links from feature cards (make them informational only).

- [ ] **Approve:** Remove all dashboard links from feature cards
- [ ] **Reject:** Keep dashboard links (explain why): _______________
- [ ] **Modify:** Replace with anchor links to feature explanations

---

## B) Content/Messaging Decisions (P0)

### 6. Hardcoded Currency References
The Homepage contains hardcoded "1,000 RWF" references in:
- Smart Dining Slips feature description
- Referral Program feature description
- Pricing section

**Recommended Action:** Remove currency references or make them configurable.

- [ ] **Approve:** Replace "1,000 RWF" with "Earn rewards" (generic)
- [ ] **Approve:** Make reward amounts configurable per deployment
- [ ] **Reject:** Keep "1,000 RWF" (explain why): _______________

---

### 7. Hardcoded Payment Provider References
The Homepage contains "MTN MoMo and Airtel Money" in the Mobile Money Payments feature.

**Recommended Action:** Replace with generic "mobile money payments."

- [ ] **Approve:** Replace "MTN MoMo and Airtel Money" with "mobile money payments"
- [ ] **Reject:** Keep provider names (explain why): _______________

---

### 8. Hardcoded Contact Information
The Homepage contains hardcoded WhatsApp number `wa.me/250735214496`.

**Recommended Action:** Make contact information configurable via environment variable.

- [ ] **Approve:** Make contact information configurable
- [ ] **Reject:** Keep hardcoded number (explain why): _______________

---

### 9. "Book a Demo" CTA
The Homepage prominently displays a "Book a Demo" button.

**Question:** Is demo booking operationally supported in RC1?

- [ ] **Yes** — Keep "Book a Demo" button (demos are supported)
- [ ] **No** — Replace with "Contact Sales" or "Chat with Us"
- [ ] **No** — Remove button entirely
- [ ] **Undecided** — Need to verify demo support

---

### 10. "Explore Businesses Near You" CTA
The Homepage displays an "Explore Businesses Near You" button that links to `/discover`.

**Question:** Should this CTA be visible given Discover's localization bugs?

- [ ] **Remove CTA** — Hide until Discover is fixed
- [ ] **Keep CTA** — Fix Discover first, then keep
- [ ] **Keep CTA as-is** — Acceptable for RC1

---

## C) Trust & Conversion Decisions (P0)

### 11. Trust Signals (Social Proof)
The Homepage currently has no testimonials, customer logos, or social proof.

**Recommended Action:** Add trust signals to improve conversion.

- [ ] **Approve:** Add customer testimonials (if available)
- [ ] **Approve:** Add "Trusted by X restaurants" (if true)
- [ ] **Approve:** Add trust statement: "14-day free trial • No credit card required"
- [ ] **Reject:** No trust signals needed (explain why): _______________
- [ ] **Undecided** — Need to gather testimonials first

---

### 12. "Launch Special" Urgency
The "Launch Special — 50% OFF All Plans" badge has no expiration date or terms.

**Recommended Action:** Add urgency/clarity.

- [ ] **Approve:** Add expiration date (e.g., "Until July 31, 2026")
- [ ] **Approve:** Add customer limit (e.g., "First 100 Customers")
- [ ] **Approve:** Add both
- [ ] **Reject:** Keep as-is (explain why): _______________

---

## D) UX/Polish Decisions (P1)

### 13. Hero Carousel Speed
The hero carousel auto-advances every 5 seconds.

**Recommended Action:** Increase to 7-8 seconds for better readability.

- [ ] **Approve:** Increase to 7 seconds
- [ ] **Approve:** Increase to 8 seconds
- [ ] **Reject:** Keep at 5 seconds

---

### 14. Hero Messaging Differentiation
Current headline: "Turn Every Table Into Faster Revenue"

**Question:** Should we improve differentiation from competitors?

- [ ] **Approve:** Revise headline for stronger differentiation
- [ ] **Reject:** Keep current headline
- [ ] **Undecided** — Need copywriting options

---

### 15. Features Section Length
The Homepage displays 12 feature cards.

**Recommended Action:** Reduce to 6-8 core features to avoid cognitive overload.

- [ ] **Approve:** Reduce to 6-8 core features
- [ ] **Reject:** Keep all 12 features
- [ ] **Modify:** (describe which features to keep): _______________

---

### 16. Advanced Features Readiness
The "Advanced Features" section lists Hotel Mode, Site Builder, AI Menu Builder, Discovery Marketplace, Referral Program.

**Question:** Are all these features ready for RC1?

- [ ] **All ready** — Keep all advanced features
- [ ] **Some not ready** — Remove or label as "Beta" / "Coming Soon"
- [ ] **Undecided** — Need to verify each feature

If "Some not ready," please specify which features to remove/label:
- [ ] Hotel Mode
- [ ] Site Builder
- [ ] AI Menu Builder
- [ ] Discovery Marketplace
- [ ] Referral Program

---

### 17. Pricing Currency Display
Pricing currently shows hardcoded RWF currency.

**Recommended Action:** Make currency configurable or locale-aware.

- [ ] **Approve:** Make currency configurable per deployment
- [ ] **Approve:** Display currency based on user locale
- [ ] **Approve:** Add currency selector
- [ ] **Reject:** Keep hardcoded RWF (explain why): _______________

---

## E) Mobile Experience (P1)

### 18. Mobile Verification
The Homepage has not been verified on actual mobile devices.

**Recommended Action:** Test mobile responsiveness before certification.

- [ ] **Approve:** Test on mobile devices before final certification
- [ ] **Reject:** Desktop review is sufficient

---

## F) Final Approval

### 19. Implementation Authorization

After reviewing all recommendations above:

- [ ] **I approve implementing the selected Homepage changes**
- [ ] **I reject all Homepage changes** (explain why): _______________
- [ ] **I need more information before deciding**

---

### 20. Deployment Authorization

After implementation and verification:

- [ ] **I authorize deploying the updated Homepage to production**
- [ ] **I want to review the updated Homepage in staging first**
- [ ] **I do not authorize deployment yet**

---

## Signature

**Founder Name:** ________________________

**Date:** ________________________

**Signature:** ________________________

---

## Notes / Additional Instructions

(Use this space for any additional guidance, questions, or modifications to the recommendations)

---

*End of Homepage Founder Approval Checklist.*
