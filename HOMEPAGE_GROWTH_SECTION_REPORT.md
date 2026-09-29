# HOMEPAGE_GROWTH_SECTION_REPORT

**Date:** 2026-07-02  
**Page:** Homepage (`/`)  
**Section:** Built for Growth  
**Status:** Complete

---

## Purpose

Implement the final Founder-approved refinement of the **Built for Growth** section so it communicates a clear business growth journey, not a miscellaneous feature list.

---

## Previous Version

### Section Supporting Text (Previous)

`Advanced capabilities to scale your hospitality business — all built into the platform.`

### Cards (Previous)

1. **Hotel Operations**  
   `Room management, service areas, and front desk operations for hospitality businesses.`

2. **AI Menu Builder**  
   `Upload a photo or document and let AI build your menu for you.`

3. **Business Discovery**  
   `Help customers discover your business through the Imboni ecosystem.`

4. **Staff & Roles**  
   `Granular role permissions: waiter, cashier, supervisor, manager, and more.`

---

## Final Version

### Section Supporting Text (Final)

`Everything you need to grow from a single location to a modern hospitality business—all from one intelligent platform.`

### Cards (Final)

1. **AI Menu Builder**  
   `Turn menus into digital experiences in minutes. Upload a photo or document and let AI create a professional digital menu ready for ordering.`

2. **Business Discovery**  
   `Help more customers discover your business through the Imboni ecosystem with searchable business profiles, promotions, and digital visibility.`

3. **Procurement & Inventory**  
   `Manage purchasing, suppliers, stock levels, and food costs with complete operational visibility from delivery to consumption.`

4. **Staff & Roles**  
   `Control who can access what with flexible roles and permissions for every member of your team.`

5. **Multi-Branch Operations**  
   `Run multiple branches from one platform with centralized reporting, inventory visibility, and operational consistency.`

6. **Business Intelligence**  
   `Monitor sales, customer trends, inventory, and financial performance with real-time insights that support better business decisions.`

---

## What Changed and Why

### 1) Supporting text rewritten for growth narrative
- **Changed from:** generic “advanced capabilities” positioning.
- **Changed to:** explicit journey from single location to modern hospitality business.
- **Why:** frames the section around customer progression and platform continuity.

### 2) Hotel Operations removed
- **Reason:** Founder guidance clarified this can imply full property management scope not intended for RC1 messaging.
- **Replacement:** **Procurement & Inventory**, which is one of ImboniServe’s strongest operational truths.

### 3) AI Menu Builder message upgraded
- **Changed from:** utility task (“let AI build your menu”).
- **Changed to:** business outcome (“digital experiences in minutes,” “professional,” “ready for ordering”).

### 4) Business Discovery message refined
- **Removed emphasis on:** directory/listing framing.
- **Added emphasis on:** customer growth and digital visibility outcomes.

### 5) Staff & Roles message simplified
- **Changed from:** feature inventory style (“granular role permissions…”).
- **Changed to:** direct owner benefit (“control who can access what”).

### 6) Multi-Branch Operations added
- **Purpose:** communicate growth beyond single-location operation.
- **Outcome framing:** centralized reporting, visibility, and consistency.

### 7) Business Intelligence added
- **Purpose:** complete the growth arc with better decisions.
- **Outcome framing:** real-time insight for business performance decisions.

### 8) Rendering structure improved
- The section now uses a single `advancedFeatures` data structure and maps cards from one source.
- This keeps narrative order explicit and easier to maintain over future Founder iterations.

---

## Final Narrative Flow Validation

The section now follows the Founder-specified growth sequence:

**AI** → **Customer Growth** → **Operations** → **People** → **Expansion** → **Better Decisions**

This is represented by card order:

1. AI Menu Builder  
2. Business Discovery  
3. Procurement & Inventory  
4. Staff & Roles  
5. Multi-Branch Operations  
6. Business Intelligence

---

## Constitution Alignment

The refined section better aligns with Homepage Constitution principles:

1. **Operating System for Hospitality**  
   - Moves from “extra features” tone to “one intelligent platform” growth journey.

2. **Operational Truth**  
   - Replaces potentially misleading Hotel Operations emphasis with concrete Procurement & Inventory operational capability.

3. **Customer-First Value Messaging**  
   - Each card now communicates owner outcomes (growth, control, consistency, decisions) rather than raw feature taxonomy.

4. **Narrative Consistency**  
   - Section now supports the same story arc used across homepage: unified operations + growth + decision confidence.

---

## Files Updated

1. `src/pages/index.tsx`  
   - Updated growth section subtitle  
   - Replaced 4-card static block with 6-card ordered narrative cards  
   - Updated card copy and sequence

2. `src/locales/en.json`  
3. `src/locales/rw.json`  
4. `src/locales/fr.json`  
   - Updated `homepage.advanced` subtitle and card descriptions  
   - Added keys for `procurement`, `multi_branch`, and `business_intelligence`

---

## Certification Note

This completes the final Founder-requested Homepage content refinement for the Built for Growth section.  
Per instruction, workflow now proceeds immediately into **Pricing Page Founder Certification (review-only, no implementation)**.
