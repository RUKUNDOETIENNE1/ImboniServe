# EOS-001I Future DGS-001 Candidates

## Terminology, Naming, and Language Improvements Deferred to DGS-001

Per EOS-001I phase instructions: "Do not redesign terminology during this phase." The following items are documented for DGS-001 review.

---

## 1. User-Visible "Restaurant" Text (12 instances)

These are user-visible strings that should use "Hospitality Business" instead of "restaurant":

### High Priority (User-Visible Labels and Headings)

| # | File | Line | Current Text | Recommended Text |
|---|------|------|-------------|-----------------|
| 1 | src/pages/admin/executive/ceo.tsx | 227 | "Restaurants currently active on platform" | "Hospitality Businesses currently active on platform" |
| 2 | src/pages/api/admin/executive/cmo.ts | 457 | "Restaurant acquisition has stalled." | "Hospitality Business acquisition has stalled." |
| 3 | src/pages/api/admin/executive/coo.ts | 154 | "Restaurant Operations" | "Hospitality Business Operations" |
| 4 | src/pages/api/admin/executive/coo.ts | 224 | "Restaurant Signup → Active" | "Hospitality Business Signup → Active" |
| 5 | src/components/executive/GrowthPulse.tsx | 77 | "Restaurant Growth (7d)" | "Hospitality Business Growth (7d)" |
| 6 | src/components/executive/RestaurantEcosystem.tsx | 42 | "Restaurant ecosystem data unavailable" | "Hospitality Business ecosystem data unavailable" |
| 7 | src/components/executive/RestaurantEcosystem.tsx | 56 | "Restaurant Ecosystem" | "Hospitality Business Ecosystem" |
| 8 | src/components/executive/RestaurantOperations.tsx | 38 | "Restaurant operations data unavailable" | "Hospitality Business operations data unavailable" |
| 9 | src/components/executive/RestaurantOperations.tsx | 45 | "Restaurant Operations" | "Hospitality Business Operations" |
| 10 | src/components/executive/AcquisitionFunnel.tsx | 56 | "Interested Restaurant" | "Interested Hospitality Business" |
| 11 | src/components/executive/RegionalGrowthIntelligence.tsx | 92 | "Restaurant Density by City" | "Hospitality Business Density by City" |
| 12 | src/pages/admin/executive/cmo.tsx | 457 | "Restaurant acquisition has stalled." | "Hospitality Business acquisition has stalled." |

### Medium Priority (Code Comments)

| # | File | Line | Current | Recommended |
|---|------|------|---------|-------------|
| 13 | src/pages/api/admin/executive/cmo.ts | 148 | "// Restaurant Growth" | "// Hospitality Business Growth" |
| 14 | src/pages/api/admin/executive/coo.ts | 435 | "// Restaurant Operations" | "// Hospitality Business Operations" |
| 15 | src/pages/admin/executive/coo.tsx | 172 | "// Section 4: Restaurant Operations" | "// Section 4: Hospitality Business Operations" |

---

## 2. Legacy Component Names (Not User-Visible)

These component names use "Restaurant" but are only visible in code. Renaming would be a larger refactoring effort:

| Component | Used By | Recommendation |
|-----------|---------|----------------|
| RestaurantEcosystem.tsx | CEO page | Rename to HospitalityBusinessEcosystem (DGS-001) |
| RestaurantOperations.tsx | COO page | Rename to HospitalityBusinessOperations (DGS-001) |

**Note**: These are internal code identifiers. They do not appear in the UI except through the user-visible text issues listed above.

---

## 3. Legacy Variable Names (Not User-Visible)

| Variable | Files | Recommendation |
|----------|-------|----------------|
| restaurantGrowth | cmo.ts, cmo.tsx | Rename to businessGrowth (DGS-001) |
| restaurantOps | coo.ts, coo.tsx | Rename to businessOps (DGS-001) |
| restaurantEcosystem | ceo.ts | Rename to businessEcosystem (DGS-001) |
| restaurantActivity | ceo.ts | Rename to businessActivity (DGS-001) |
| interestedRestaurant | cmo.ts, AcquisitionFunnel.tsx | Rename to interestedBusiness (DGS-001) |
| computeRestaurantScore | ceo.ts | Rename to computeBusinessScore (DGS-001) |

---

## 4. URL Route Paths (Acceptable)

The following URL paths use "restaurants" but are route identifiers, not user-visible labels. The AdminLayout correctly labels this route as "Businesses":

| Route | Sidebar Label | Status |
|-------|--------------|--------|
| /admin/restaurants | "Businesses" | ✅ Correct label, route is acceptable |

**Recommendation**: No change needed. Route paths are technical identifiers.

---

## 5. `expectedImpact` Field Consistency

Noted in EOS-001G and EOS-001H: The `expectedImpact` field appears in CMO and Executive Intelligence AI assistants but not in all center AI assistants.

| Center | Has expectedImpact? |
|--------|-------------------|
| CEO | No |
| CFO | No |
| COO | No |
| CMO | Yes |
| Partnership Director | No |
| Customer Success Director | No |
| Executive Intelligence | Yes |

**Recommendation**: Standardize `expectedImpact` across all AI assistants in DGS-001.

---

## 6. Error UI Pattern Standardization

Three error UI patterns exist across pages. DGS-001 should standardize to one:

| Pattern | Centers Using | Description |
|---------|--------------|-------------|
| A | CEO, Executive Intelligence | rounded-2xl, centered, full button |
| B | CFO | rounded-xl, underline retry |
| C | COO, CMO, Partnership, Customer Success | rounded-xl, AlertCircle icon, conditional retry |

**Recommendation**: Adopt Pattern C (with icon and conditional retry) as the standard in DGS-001.

---

## 7. SSR Auth Pattern Standardization

Two SSR session check patterns exist:

| Pattern | Centers Using | Code |
|---------|--------------|------|
| A | CEO, CFO, Executive Intelligence | `if (!session \|\| !session.user)` |
| B | COO, CMO, Partnership, Customer Success | `if (!session)` |

**Recommendation**: Standardize to Pattern A (checks both session and user) in DGS-001.

---

## 8. Page Wrapper Class Standardization

Three wrapper class patterns exist:

| Pattern | Centers Using | Classes |
|---------|--------------|---------|
| A | CEO, Executive Intelligence | `p-4 md:p-6 max-w-7xl mx-auto space-y-6` |
| B | CFO | `px-4 py-6 md:px-6 md:py-8 max-w-7xl mx-auto space-y-6` |
| C | COO, CMO, Partnership, Customer Success | `min-h-screen bg-slate-50` + `max-w-7xl mx-auto px-4 py-6 space-y-6` |

**Recommendation**: Standardize to one pattern in DGS-001.

---

## Summary

| Category | Count | Priority |
|----------|-------|----------|
| User-visible "restaurant" text | 12 | High — DGS-001 |
| Code comments with "restaurant" | 3 | Medium — DGS-001 |
| Legacy component names | 2 | Low — DGS-001 (refactoring) |
| Legacy variable names | 6 | Low — DGS-001 (refactoring) |
| expectedImpact inconsistency | 1 | Medium — DGS-001 |
| Error UI patterns | 3 | Low — DGS-001 |
| SSR auth patterns | 2 | Low — DGS-001 |
| Page wrapper patterns | 3 | Low — DGS-001 |

**Total DGS-001 candidates**: 31 items

None of these block operational readiness. All are improvements for future standardization.
