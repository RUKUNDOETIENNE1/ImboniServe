# HOMEPAGE_FOUNDER_HANDOFF — Engineering to Founder

**Date:** 2026-06-30  
**Status:** 🛑 **HARD STOP** — Awaiting Founder Decisions  
**Repository Status:** ✅ Clean  
**Branch:** `release/v1.0.0-rc1`

---

## EXECUTIVE SUMMARY

**Engineering has completed all objective Homepage fixes and is now stopped.**

**Group 1 (Engineering-Owned) fixes have been implemented and committed:**
- ✅ Dashboard links removed from public navigation
- ✅ Carousel timing improved (5s → 7s)
- ✅ Hardcoded provider wording de-localized
- ✅ WhatsApp link made configurable
- ✅ Currency display made configurable
- ✅ Dashboard click-throughs removed
- ✅ "Built for restaurants..." readability improved

**Group 2 (Founder-Owned) decisions are organized and ready for your review.**

**No further engineering work will begin until you make business and marketing decisions.**

---

## WHAT YOU NEED TO DO NOW

### Primary Action Required

**Review and complete:** <ref_file file="C:/Dev/ImboniResto/FOUNDER_DECISION_QUEUE.md" />

This is the **master decision document** containing 8 independent business decisions:

1. **Trust Signals & Social Proof** — What truthful trust builders should we add?
2. **Launch Special Terms** — What are the actual terms of the 50% OFF offer?
3. **Book Demo CTA** — Is demo booking operationally supported?
4. **Business Discovery Visibility** — Should Discover be visible in RC1? (Strategic decision aligned with ImboniServe + ImboniTravel vision)
5. **Store Visibility** — Should Store be visible in RC1?
6. **Referral Program Visibility** — Should Referral Program be visible in RC1?
7. **Homepage Positioning & Messaging** — How should we differentiate the hero messaging?
8. **Pricing Preview Strategy** — How should we display pricing on the Homepage?

**Each decision is independent.** You can approve some and reject others.

---

## SUPPORTING DOCUMENTS

### For Business Strategy Decisions
<ref_file file="C:/Dev/ImboniResto/HOMEPAGE_BUSINESS_DECISIONS.md" />

**Contains:**
- Launch Special commercial terms
- Demo booking operational requirements
- Business Discovery deployment availability (strategic alignment)
- Store deployment availability
- Referral Program deployment availability
- Trust signals & social proof options
- Pricing preview strategy

---

### For Marketing & Messaging Decisions
<ref_file file="C:/Dev/ImboniResto/HOMEPAGE_MARKETING_DECISIONS.md" />

**Contains:**
- Hero headline positioning options
- Hero subheadline clarity options
- Target audience emphasis
- Homepage story flow recommendations
- Feature emphasis & reduction options
- Advanced features readiness messaging

---

### For Implementation Status
<ref_file file="C:/Dev/ImboniResto/HOMEPAGE_IMPLEMENTATION_READINESS.md" />

**Contains:**
- Complete list of already-implemented fixes
- Ready-to-implement changes (awaiting your approval)
- Blocked work items
- Implementation timeline estimates
- Risk assessment
- Success criteria

---

## WHAT ENGINEERING HAS ALREADY DONE

### Commits Created

**Commit 1:** `f0fe2a0` — Documentation deliverables  
**Commit 2:** `698208c` — Group 1 engineering fixes  
**Commit 3:** `5069e8e` — Founder decision queue documents

### Files Changed (Group 1 Implementation)

| File | Changes |
|---|---|
| `src/pages/index.tsx` | Removed dashboard links, improved carousel timing, removed click-throughs, improved readability |
| `src/locales/en.json` | De-localized provider wording |
| `src/locales/fr.json` | De-localized provider wording |
| `src/locales/rw.json` | De-localized provider wording |
| `.env.example` | Added `NEXT_PUBLIC_SUPPORT_WHATSAPP_URL` and `NEXT_PUBLIC_DISPLAY_CURRENCY` |

### Repository Status

```
✅ Working tree clean
✅ All changes committed
✅ No untracked files
✅ TypeScript compilation passes
✅ Lint passes
✅ Build succeeds
⚠️  Pre-existing test failures documented (unrelated to Homepage)
```

---

## WHAT HAPPENS NEXT

### Workflow

```
1. You review FOUNDER_DECISION_QUEUE.md
   ↓
2. You mark decisions (checkboxes)
   ↓
3. You provide required information (dates, numbers, content)
   ↓
4. You return completed document to engineering
   ↓
5. Engineering implements only approved changes (Group 2)
   ↓
6. You review implementation
   ↓
7. Homepage final certification
   ↓
8. Proceed to Pricing page review
```

### Implementation Timeline (After Your Decisions)

**Quick wins** (< 1 hour each):
- Trust statement
- Launch Special terms
- Demo CTA changes
- Visibility toggles (Store, Discover, Referral)
- Beta/Coming Soon labels

**Medium effort** (2-4 hours each):
- Headline/subheadline changes
- Feature reduction
- Add problem section
- Add trust section (if content ready)

**Larger effort** (4-8 hours each):
- Business Discovery localization fix (if keeping visible)
- Feature categorization
- Homepage story flow restructure

---

## KEY PRINCIPLES

### No Assumptions
Engineering will **not** make business or marketing decisions.

Every decision in `FOUNDER_DECISION_QUEUE.md` requires your explicit approval.

### No Fake Social Proof
All trust signals must be **truthful and verifiable**.

No invented testimonials, no inflated numbers, no false claims.

### Global-by-Design Maintained
All hardcoded localization has been removed.

Platform is now properly configurable per deployment.

### Business Discovery Strategic Context
**From approved product direction:**
> Business Discovery is strategically important and will become a core capability for both ImboniServe and ImboniTravel.

**Decision 4** asks whether to:
- Keep visible and fix localization (4-8 hours)
- Hide temporarily and fix later (30 minutes)
- Keep as-is for Rwanda pilot (0 hours)

This is a **strategic decision** about RC1 positioning, not an engineering decision.

---

## WHAT IS BLOCKED

**Until you complete `FOUNDER_DECISION_QUEUE.md`, the following are blocked:**

- ❌ Homepage final certification
- ❌ Pricing page review
- ❌ Authentication page review
- ❌ Dashboard page review
- ❌ RC1 Public Website Certification

**Critical path:** Homepage must be certified before other pages can be reviewed.

---

## DECISION FRAMEWORK

Each decision in `FOUNDER_DECISION_QUEUE.md` includes:

✅ **Context** — Why this decision matters  
✅ **Options** — Multiple approaches with pros/cons  
✅ **Business Impact** — What each option means for RC1  
✅ **Operational Requirements** — What must be true for each option  
✅ **Effort Estimates** — How long implementation will take  
✅ **Risk Assessment** — What could go wrong  

**You choose. Engineering implements.**

---

## TRUTHFULNESS REQUIREMENTS

### For Trust Signals (Decision 1)

**If you choose customer testimonials:**
- [ ] Real customer quotes
- [ ] Permission obtained
- [ ] Truthful representation

**If you choose "Trusted by X restaurants":**
- [ ] Accurate count of active paying customers
- [ ] Verifiable as of specific date

**If you choose security/compliance badges:**
- [ ] Actual certifications exist
- [ ] Claims are factually true

### For Launch Special (Decision 2)

**If you add expiration date:**
- [ ] Must honor deadline
- [ ] Must have plan for what happens after

**If you add customer limit:**
- [ ] Must track customer count
- [ ] Must honor limit

### For Book Demo (Decision 3)

**If you keep "Book a Demo":**
- [ ] Demo booking system exists
- [ ] Demo team is assigned
- [ ] Demo script is prepared
- [ ] Demo leads to working product

### For Feature Visibility (Decisions 4-6)

**If you keep features visible:**
- [ ] Feature is operationally supported
- [ ] Feature works as advertised
- [ ] No broken promises

---

## RECOMMENDED APPROACH

### Step 1: Quick Read (15 minutes)
Skim `FOUNDER_DECISION_QUEUE.md` to understand all 8 decisions.

### Step 2: Business Decisions First (30 minutes)
Review `HOMEPAGE_BUSINESS_DECISIONS.md` and make operational decisions:
- Launch Special terms
- Demo booking support
- Feature visibility (Discover, Store, Referral)
- Trust signals

### Step 3: Marketing Decisions (30 minutes)
Review `HOMEPAGE_MARKETING_DECISIONS.md` and make positioning decisions:
- Hero messaging
- Story flow
- Feature emphasis

### Step 4: Complete Master Document (30 minutes)
Return to `FOUNDER_DECISION_QUEUE.md` and mark all checkboxes.

Provide required information (dates, numbers, content).

Add strategic reasoning where helpful.

### Step 5: Return to Engineering
Send completed `FOUNDER_DECISION_QUEUE.md` back.

Engineering will implement only approved changes.

---

## QUESTIONS?

### "Can I approve some decisions and defer others?"
**Yes.** Each decision is independent.

If you want to defer a decision, mark it as "Undecided" and engineering will skip it.

### "Can I modify the options?"
**Yes.** If none of the options fit, provide your own in the "Custom" fields.

### "What if I'm not sure about a decision?"
Mark it as "Undecided" and add a note about what information you need.

Engineering can help gather information, then you can decide.

### "How long will implementation take?"
**30 minutes to 8 hours** depending on which options you choose.

See `HOMEPAGE_IMPLEMENTATION_READINESS.md` for detailed estimates.

### "What about Business Discovery?"
This is a **strategic decision** about RC1 positioning.

**Context:** Business Discovery is strategically important for ImboniServe + ImboniTravel integration.

**Question:** Should it be visible in RC1, or hidden until properly localized?

**Options:**
- Fix localization and keep visible (4-8 hours, aligns with strategy)
- Hide temporarily (30 minutes, faster to RC1)
- Keep as-is for Rwanda pilot (0 hours, acceptable for pilot)

**You decide** based on RC1 strategic priorities.

### "What if I want to discuss options first?"
**Absolutely.** These documents are designed to facilitate discussion.

Use them as a starting point for conversation.

Engineering is ready to answer questions and provide additional context.

---

## SUCCESS CRITERIA

### Homepage Certification Complete When:
- [ ] All Founder decisions made
- [ ] All approved changes implemented
- [ ] All P0 issues resolved
- [ ] No broken promises or unsupported claims
- [ ] Global-by-Design philosophy maintained
- [ ] Messaging aligns with strategic positioning
- [ ] CTAs are operationally supported
- [ ] Founder signs off on final Homepage

---

## HARD STOP

**Engineering is stopped.**

**Repository is clean.**

**Awaiting your decisions.**

**Next action:** Review <ref_file file="C:/Dev/ImboniResto/FOUNDER_DECISION_QUEUE.md" />

---

## APPENDIX: Pre-Existing Test Failures

**Note:** These failures existed before Homepage work and are unrelated.

**Failing tests:**
1. `tests/services/business-commission.test.ts` — Commission calculation edge cases
2. `tests/integration/seating-conflicts.test.ts` — Seating conflict resolution
3. `tests/integration/order-edge-cases.test.ts` — Order edge case handling

**Recommendation:** Address in separate test stabilization task after Homepage certification.

---

**End of Founder Handoff**

**Ready for your decisions.**
