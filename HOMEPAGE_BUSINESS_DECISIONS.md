# HOMEPAGE_BUSINESS_DECISIONS — Business Strategy Summary

**Date:** 2026-06-30  
**Purpose:** Isolate business decisions from engineering and marketing decisions

---

## OVERVIEW

This document contains **only the business strategy decisions** required for Homepage certification.

**Business decisions** = Decisions about:
- Sales process
- Pricing strategy
- Launch offers
- Operational capabilities
- Feature availability
- Market positioning

**NOT included here:**
- Engineering fixes (already completed)
- Marketing copy/messaging (see HOMEPAGE_MARKETING_DECISIONS.md)

---

## BUSINESS DECISION 1: Launch Special Terms

### Current State
Homepage displays:
> "Launch Special — 50% OFF All Plans"

**Issue:** No terms, no expiration, no limit.

### Business Question
**What are the actual commercial terms of the Launch Special?**

### Options

| Option | Description | Business Impact | Operational Requirement |
|---|---|---|---|
| **A** | Add expiration date | Creates urgency; must honor deadline | Must decide when to end |
| **B** | Add customer limit | Creates scarcity; rewards early adopters | Must track customer count |
| **C** | Both (date + limit) | Maximum urgency | Must track both |
| **D** | Convert to free trial emphasis | Reduces friction; industry standard | Must support trial workflow |
| **E** | Remove entirely | Simplifies messaging | None |
| **F** | Keep as-is | No urgency | None |

### Required from Founder

- [ ] **Decision:** (Choose A-F above)
- [ ] **If A/C:** Expiration date: _______________
- [ ] **If B/C:** Customer limit: _______________
- [ ] **Tracking method:** _______________

---

## BUSINESS DECISION 2: Demo Booking Operational Support

### Current State
Homepage prominently displays "Book a Demo" CTA.

### Business Question
**Is demo booking operationally supported in RC1?**

### Operational Requirements for "YES"

- [ ] Demo booking system exists (calendar, form, etc.)
- [ ] Demo team/person is assigned and available
- [ ] Demo script/flow is prepared
- [ ] Demo leads to working product walkthrough

### Options if NOT Supported

| Option | CTA Change | Business Impact |
|---|---|---|
| **A** | Remove button entirely | Focus on self-service trial only |
| **B** | Replace with "Contact Sales" | Generic sales contact |
| **C** | Replace with "Chat with Us" | Live chat support |
| **D** | Replace with "Watch Video Demo" | Pre-recorded demo |

### Required from Founder

- [ ] **Demos ARE supported** — Keep "Book a Demo" (confirm requirements above)
- [ ] **Demos are NOT supported** — Choose alternative: _______________

---

## BUSINESS DECISION 3: Business Discovery Deployment Availability

### Strategic Context
From approved product direction:
> Business Discovery is strategically important and will become a core capability for both ImboniServe and ImboniTravel.

### Current Technical State
- Discover page exists but hardcodes Rwanda cities
- Violates Global-by-Design philosophy
- Would require 4-8 hours to fix

### Business Question
**Should Business Discovery be visible in RC1 deployment?**

### Options

| Option | Action | Business Impact | Engineering Effort |
|---|---|---|---|
| **A** | Keep visible — fix first | Shows full platform capability; aligns with strategy | 4-8 hours |
| **B** | Hide from RC1 — fix later | Faster to RC1; allows proper fix later | 30 minutes |
| **C** | Keep as-is (Rwanda pilot) | Shows capability; acceptable for pilot | None |

### Strategic Considerations

**For ImboniServe:**
- Does Discovery support restaurant customer acquisition?
- Is Discovery part of the RC1 value proposition?

**For ImboniTravel integration:**
- Does hiding Discovery delay strategic vision?
- Can we launch without it and add later?

### Required from Founder

- [ ] **Decision:** (Choose A-C above)
- [ ] **Strategic reasoning:** _______________

---

## BUSINESS DECISION 4: Store (Procurement Marketplace) Deployment Availability

### Current State
"Store" link is visible in navigation.

### Business Question
**Should Store be visible in RC1 deployment?**

### Operational Requirements for "YES"

- [ ] Store has active suppliers
- [ ] Store has products listed
- [ ] Store checkout flow works
- [ ] Store fulfillment is operational

### Options

| Option | Action | Business Impact |
|---|---|---|
| **A** | Keep visible | Store is ready for RC1 deployment |
| **B** | Hide from RC1 | Store is not part of RC1 deployment availability |

### Required from Founder

- [ ] **Decision:** (Choose A or B above)
- [ ] **If A:** Confirm operational requirements above

---

## BUSINESS DECISION 5: Referral Program Deployment Availability

### Current State
"Share & earn rewards" button and referral links are visible.

### Business Question
**Should Referral Program be visible in RC1 deployment?**

### Operational Requirements for "YES"

- [ ] Referral tracking works
- [ ] Referral rewards are operational
- [ ] Referral payout process exists

### Options

| Option | Action | Business Impact |
|---|---|---|
| **A** | Keep visible | Referral program is ready for RC1 deployment |
| **B** | Hide from RC1 | Referral program is not part of RC1 deployment availability |

### Required from Founder

- [ ] **Decision:** (Choose A or B above)
- [ ] **If A:** Confirm operational requirements above

---

## BUSINESS DECISION 6: Trust Signals & Social Proof

### Current State
No testimonials, customer logos, case studies, or trust badges visible.

### Business Question
**What truthful trust signals should we add?**

### Options

| Option | Content | Business Impact | Operational Requirement |
|---|---|---|---|
| **A** | Trust statement only | Minimal; reduces friction | None |
| **B** | Customer testimonials | Strongest trust signal | Requires real testimonials + permission |
| **C** | "Trusted by X restaurants" | Quantifiable proof | Requires accurate customer count |
| **D** | Security/compliance badges | Technical trust | Requires actual certifications |
| **E** | All of the above | Maximum trust | All requirements above |
| **F** | None | No claims yet | None |

### Truthfulness Requirements

**If Option B (Testimonials):**
- [ ] Real customer quotes
- [ ] Permission obtained
- [ ] Truthful representation

**If Option C ("Trusted by X"):**
- [ ] Accurate count of active paying customers
- [ ] Number: _______________
- [ ] As of date: _______________

**If Option D (Badges):**
- [ ] We have bank-level encryption
- [ ] We are PCI compliant
- [ ] We are GDPR compliant
- [ ] We have ISO certification
- [ ] Other: _______________

### Required from Founder

- [ ] **Decision:** (Choose A-F above)
- [ ] **Provide required content/verification** (see above)

---

## BUSINESS DECISION 7: Homepage Pricing Preview Strategy

### Current State
Homepage includes pricing preview section.

**Note:** This is ONLY about Homepage preview.  
**Full Pricing page review will happen separately.**

### Business Question
**Should the Homepage pricing preview remain as-is?**

### Options

| Option | Display | Business Impact |
|---|---|---|
| **A** | Keep as-is | Full transparency on Homepage |
| **B** | Simplify to "Plans starting from..." | Drives traffic to Pricing page |
| **C** | Remove from Homepage | Focuses on value, not price |
| **D** | Defer to Pricing page review | No changes now |

### Required from Founder

- [ ] **Decision:** (Choose A-D above)

---

## SUMMARY OF BUSINESS DECISIONS REQUIRED

| Decision | Type | Urgency | Blocks |
|---|---|---|---|
| 1. Launch Special Terms | Pricing Strategy | High | Homepage certification |
| 2. Demo Booking Support | Sales Process | High | Homepage certification |
| 3. Business Discovery Visibility | Deployment Availability | High | Homepage certification |
| 4. Store Visibility | Deployment Availability | Medium | Homepage certification |
| 5. Referral Program Visibility | Deployment Availability | Medium | Homepage certification |
| 6. Trust Signals | Conversion Optimization | High | Homepage certification |
| 7. Pricing Preview | Pricing Strategy | Low | Homepage certification |

---

## IMPLEMENTATION IMPACT

### After Business Decisions Are Made

**Quick wins** (< 1 hour each):
- Trust statement
- Launch Special terms
- Demo CTA change
- Store visibility
- Referral visibility

**Medium effort** (2-4 hours):
- Customer testimonials (if content is ready)

**Larger effort** (4-8 hours):
- Business Discovery localization fix (if keeping visible)

---

## NEXT STEPS

1. **Review each business decision above**
2. **Confirm operational requirements** where applicable
3. **Provide required information** (dates, numbers, content)
4. **Return to engineering** for implementation

**After your decisions:**
- Engineering will implement approved changes only
- No operational promises will be made without your confirmation
- Each decision will be implemented exactly as specified

---

## HARD STOP

**No Homepage business changes will be made until you complete these decisions.**

See also:
- `FOUNDER_DECISION_QUEUE.md` — Master decision document
- `HOMEPAGE_MARKETING_DECISIONS.md` — Marketing/messaging decisions
- `HOMEPAGE_IMPLEMENTATION_READINESS.md` — Implementation status
