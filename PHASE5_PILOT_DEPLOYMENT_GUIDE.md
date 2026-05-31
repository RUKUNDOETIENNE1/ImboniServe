# Phase 5: Live Pilot Deployment Guide

**Purpose:** Deploy ImboniServe in real hospitality environments to validate human adoption under real operational pressure.

**Duration:** 5–7 days per venue  
**Venues:** 1–3 restaurants/hotels  
**Mode:** Shadow observation (non-intrusive)

---

## Pre-Deployment Checklist

### Venue Selection Criteria
- [ ] Has distinct kitchen and bar stations
- [ ] Experiences clear peak rush periods (lunch/dinner)
- [ ] Willing to run system alongside existing workflow
- [ ] Has stable internet connection
- [ ] Staff willing to try new system (no forced adoption)

### Technical Readiness
- [ ] Database migrated (Phases 1–3 schema)
- [ ] Stations created and active (Kitchen, Bar, etc.)
- [ ] Staff accounts created with correct roles
- [ ] Devices ready (1 per station + 1 for expo/manager)
- [ ] Real-time channels tested (Pusher auth verified)
- [ ] Reconnection/snapshot tested on-site

### Staff Preparation
- [ ] 10-minute briefing (not training):
  - "Use the station screen for your station"
  - "Kitchen board shows everything"
  - "If anything blocks you, use verbal—we're just watching"
- [ ] No enforcement, no pressure
- [ ] Observer assigned per shift (non-participatory)

---

## Pilot Execution Protocol

### Day 0: Setup Day
**Morning:**
- Install devices at each station
- Verify network connectivity
- Test Pusher real-time updates
- Create test order and verify routing
- Confirm all stations see their items

**Afternoon:**
- Brief staff (10 minutes max)
- Demonstrate one order flow
- Answer questions
- Emphasize: "Use it if it helps; skip it if it blocks you"

**Evening:**
- Observer familiarizes with venue layout
- Identify peak periods for next day
- Prepare observation sheets

### Days 1–7: Live Observation

#### Pre-Service (30 min before rush)
- [ ] All devices powered on and connected
- [ ] Green WiFi indicator visible on all KDS screens
- [ ] Observer positioned to see all stations
- [ ] Paper observation sheet ready

#### During Service
**Observer Role:**
- Watch, don't coach
- Note timestamps of key moments
- Record verbal coordination instances
- Track wrong-station attempts
- Note hesitation or confusion
- Log any system bypasses

**What NOT to do:**
- Don't interrupt staff
- Don't explain features
- Don't fix workflow issues
- Don't enforce system usage

#### Post-Service (10 min debrief)
- Gather staff for quick feedback:
  - "3 things that helped"
  - "3 things that slowed you down"
  - "1 thing you'd change"
- Record verbatim (don't interpret)
- Thank staff, no pressure

---

## Observation Framework

### What to Track (Silently)

#### 1. Divergence Events
**Ignored Routing:**
- Item assigned to Bar, but updated from Kitchen board
- Station never touched their assigned items

**Skipped States:**
- NEW → READY directly (bypassed PREPARING)
- READY → PREPARING (invalid backward transition)

**Off-System Actions:**
- Order marked Served, but items never marked DELIVERED
- Verbal "it's ready" without system update

**Cross-Station Updates:**
- Kitchen staff updating Bar items
- Manager advancing all items from Kitchen board

#### 2. Trust Signals

**Positive:**
- Staff check their station screen first
- Items updated through system during rush
- No verbal overrides needed
- Station separation respected

**Negative:**
- Staff ignore station screen
- Verbal coordination preferred
- Frequent "I'll fix it later" comments
- System abandoned during peak

#### 3. Confusion Indicators

**Hesitation:**
- >3 seconds before first action
- Repeated filter toggling without action
- Looking around for help

**Wrong Actions:**
- Clicking wrong station's items
- Attempting invalid transitions
- Repeated corrections on same item

**Abandonment:**
- Starting action, then stopping
- Switching to verbal mid-flow
- "This is too slow" comments

#### 4. Workflow Drift

**Expected Flow:**
```
Order Created → Routed to Stations → 
Station Updates (NEW → PREPARING → READY → DELIVERED) → 
Order Served
```

**Common Drifts to Log:**
- Expo-driven: Manager advances order while stations lag
- Batch marking: All items marked READY at once at end
- Verbal pass: "It's ready" said, but not updated
- Station skip: Bar items never touched, finalized at expo

---

## Daily Observation Sheet Template

**Venue:** _______________  
**Date:** _______________  
**Service:** Lunch / Dinner  
**Observer:** _______________  
**Peak Period:** _____ to _____

### Session Metrics

| Metric | Count | Notes |
|--------|-------|-------|
| Total orders | | |
| Items routed to stations | | |
| Station-originated updates | | |
| Cross-station updates | | |
| Invalid transitions attempted | | |
| Verbal overrides | | |
| Wrong-station attempts | | |
| Hesitation events (>3s) | | |
| Abandoned actions | | |

### Workflow Observations

**What worked well:**
1. 
2. 
3. 

**What caused friction:**
1. 
2. 
3. 

**Verbatim staff quotes:**
- 
- 
- 

**Top drift observed:**


**Proposed micro-tweak (if any):**


---

## Adoption Metrics Calculation

### Trust Score (0–100)
```
Trust = (Station-Originated Updates / Total Updates) × 100
      - (Overrides × 5)
      - (Off-System Actions × 10)
```

**Thresholds:**
- ≥80: High trust
- 65–79: Moderate trust
- <65: Low trust

### Compliance Score (0–100)
```
Compliance = (Canonical Path Completions / Total Items) × 100
           - (Invalid Transitions × 3)
           - (Corrections × 2)
```

**Thresholds:**
- ≥80: High compliance
- 65–79: Moderate compliance
- <65: Low compliance

### Confusion Score (0–100, lower is better)
```
Confusion = (Hesitation Events × 2)
          + (Wrong-Station Attempts × 5)
          + (Abandoned Actions × 3)
```

**Thresholds:**
- ≤20: Low confusion
- 21–40: Moderate confusion
- >40: High confusion

### Overall Adoption Readiness (0–100)
```
Adoption = (Trust × 0.4)
         + (Compliance × 0.25)
         + ((100 - Confusion) × 0.15)
         + (Completion Rate × 0.2)
```

**Thresholds:**
- ≥80: Ready to scale
- 65–79: Iterate and re-measure
- <65: Hold scale, simplify top 3 friction points

---

## Daily Roll-Up Report Template

**Day:** ___  
**Venue:** _______________  
**Services Observed:** Lunch / Dinner / Both

### Quantitative Summary

| Metric | Value | Trend |
|--------|-------|-------|
| Trust Score | | ↑ ↓ → |
| Compliance Score | | ↑ ↓ → |
| Confusion Score | | ↑ ↓ → |
| Adoption Readiness | | ↑ ↓ → |

### Qualitative Highlights

**Top 3 Wins:**
1. 
2. 
3. 

**Top 3 Friction Points:**
1. 
2. 
3. 

**Most Common Drift:**


**Staff Sentiment (1 sentence):**


### Recommended Action

**Micro-Tweak Proposed:**
- [ ] UI label change
- [ ] Button prominence adjustment
- [ ] Color/status clarity improvement
- [ ] Click reduction
- [ ] None needed

**Description:**


**Expected Impact:**


---

## Week-End Summary Report

**Venue:** _______________  
**Dates:** _______________ to _______________  
**Total Services Observed:** ___

### Final Scores

| Metric | Average | Trend | Verdict |
|--------|---------|-------|---------|
| Trust | | | ✅ ⚠️ ❌ |
| Compliance | | | ✅ ⚠️ ❌ |
| Confusion | | | ✅ ⚠️ ❌ |
| Adoption | | | ✅ ⚠️ ❌ |

### Top 5 Workflow Drifts

1. **Drift:** _______________  
   **Frequency:** ___  
   **Impact:** High / Medium / Low  
   **Mitigation:** _______________

2. **Drift:** _______________  
   **Frequency:** ___  
   **Impact:** High / Medium / Low  
   **Mitigation:** _______________

3. **Drift:** _______________  
   **Frequency:** ___  
   **Impact:** High / Medium / Low  
   **Mitigation:** _______________

4. **Drift:** _______________  
   **Frequency:** ___  
   **Impact:** High / Medium / Low  
   **Mitigation:** _______________

5. **Drift:** _______________  
   **Frequency:** ___  
   **Impact:** High / Medium / Low  
   **Mitigation:** _______________

### Staff Feedback Summary

**Most Common Positive Comment:**


**Most Common Negative Comment:**


**Surprising Insight:**


### Recommended Next Steps

**If Adoption ≥80:**
- [ ] Scale to additional venues
- [ ] Formalize training materials
- [ ] Plan full rollout

**If Adoption 65–79:**
- [ ] Apply top 3 micro-tweaks
- [ ] Re-run pilot for 2–3 more days
- [ ] Re-measure adoption

**If Adoption <65:**
- [ ] Hold scale deployment
- [ ] Conduct 1-on-1 staff interviews
- [ ] Simplify top confusion points
- [ ] Consider workflow coaching
- [ ] Re-pilot in 2 weeks

---

## Success Criteria (Phase 5 Completion)

Phase 5 is complete when:

✅ **Natural Usage**
- Staff use system without prompting
- No resistance during peak periods
- System preferred over verbal coordination

✅ **Minimal Bypasses**
- <10% override rate during rush
- <5 wrong-station attempts per day
- <3 off-system actions per service

✅ **High Trust**
- ≥80% station-originated updates
- ≥80% canonical path completion
- Staff say: "This helps me move faster"

✅ **Low Confusion**
- <2s average time to first action
- <5 hesitation events per service
- <3 abandoned actions per service

✅ **Workflow Alignment**
- Real workflow matches designed workflow
- Drifts are intentional optimizations, not workarounds
- System enhances existing flow, doesn't fight it

---

## Final Validation Question

> "Would staff be upset if we removed the system tomorrow?"

**If YES:** Phase 5 successful. System is adopted.  
**If NO:** More iteration needed. System not yet natural.

---

**Phase 5 is about human behavior, not software quality.**

The system is technically ready.

Now we validate whether humans naturally adopt it under real pressure.

If they do, ImboniServe becomes invisible infrastructure.

If they don't, we simplify until it disappears into their workflow.
