# DGS-001 Change Matrix

## Current → Standardized: Every Required Change

---

## Overview

| Layer | Changes | High Priority | Medium Priority | Low Priority |
|-------|---------|--------------|-----------------|-------------|
| Database | 5 | 1 | 2 | 2 |
| Services | 8 | 2 | 4 | 2 |
| Pages | 7 | 3 | 3 | 1 |
| Components | 5 | 2 | 2 | 1 |
| Executive OS | 23 | 12 | 5 | 6 |
| **Total** | **48** | **20** | **16** | **12** |

---

## Database Layer Changes

### DB-001: Business Model Table Mapping
- **Priority**: HIGH
- **File**: prisma/schema.prisma
- **Line**: 288
- **Current**: `@@map("Restaurant")`
- **Standard**: `@@map("Business")`
- **Effort**: 20-30 hours (requires migration + downtime coordination)
- **Risk**: HIGH (database migration, all queries using "Restaurant" table must update)
- **Dependencies**: SVC-003 (credit-analytics SQL JOIN), all raw SQL queries
- **Testing**: Full regression suite, data integrity verification
- **Rollback**: Revert migration script

### DB-002: Default Outlet Type
- **Priority**: MEDIUM
- **File**: prisma/schema.prisma
- **Line**: 1628
- **Current**: `type OutletType @default(RESTAURANT)`
- **Standard**: Remove default or use `@default(GENERAL_SERVICE)` (requires adding enum value)
- **Effort**: 2-4 hours
- **Risk**: MEDIUM (existing outlets may rely on default)
- **Dependencies**: None
- **Testing**: Outlet creation tests
- **Rollback**: Restore default

### DB-003: UserRole.WAITER
- **Priority**: MEDIUM
- **File**: prisma/schema.prisma
- **Line**: 2198
- **Current**: `WAITER` in UserRole enum
- **Standard**: `SERVER` or `SERVICE_STAFF`
- **Effort**: 10-15 hours (requires migration + update all references)
- **Risk**: MEDIUM (role-based access control affected)
- **Dependencies**: All code referencing UserRole.WAITER
- **Testing**: Role-based access tests, authentication tests
- **Rollback**: Revert enum change

### DB-004: cuisineTypes Field
- **Priority**: MEDIUM
- **File**: prisma/schema.prisma
- **Line**: 1870
- **Current**: `cuisineTypes` in BusinessProfile
- **Standard**: `categoryTypes` or `serviceTypes`
- **Effort**: 4-6 hours
- **Risk**: LOW (field rename with migration)
- **Dependencies**: All code referencing cuisineTypes
- **Testing**: Profile management tests
- **Rollback**: Revert field name

### DB-005: Comment Update
- **Priority**: LOW
- **File**: prisma/schema.prisma
- **Line**: 3059
- **Current**: `CLIENT // Restaurant/Hotel customer`
- **Standard**: `CLIENT // Hospitality business customer`
- **Effort**: 0.5 hours
- **Risk**: NONE (comment only)
- **Dependencies**: None
- **Testing**: None
- **Rollback**: N/A

---

## Services Layer Changes

### SVC-001: admin.service.ts Method Names
- **Priority**: HIGH
- **File**: src/lib/services/admin.service.ts
- **Lines**: 6, 47, 62, 80, 115, 261
- **Current**: `totalRestaurants`, `getRestaurants()`, `updateRestaurantStatus()`
- **Standard**: `totalBusinesses`, `getBusinesses()`, `updateBusinessStatus()`
- **Effort**: 4-6 hours
- **Risk**: MEDIUM (API consumers may reference method names)
- **Dependencies**: All callers of these methods
- **Testing**: Service unit tests, API integration tests

### SVC-002: smart-dining-slip.service.ts Method Names
- **Priority**: HIGH
- **File**: src/lib/services/smart-dining-slip.service.ts
- **Lines**: 253, 280, 383, 396
- **Current**: `getRestaurantSlips()`, `setRestaurantTemplate()`, `getRestaurantTemplate()`
- **Standard**: `getBusinessSlips()`, `setBusinessTemplate()`, `getBusinessTemplate()`
- **Effort**: 3-5 hours
- **Risk**: MEDIUM
- **Dependencies**: All callers
- **Testing**: Smart dining slip tests

### SVC-003: credit-analytics.service.ts SQL
- **Priority**: MEDIUM
- **File**: src/lib/services/credits/credit-analytics.service.ts
- **Lines**: 210, 234
- **Current**: `JOIN "Restaurant" b`
- **Standard**: `JOIN "Business" b`
- **Effort**: 1-2 hours
- **Risk**: HIGH (depends on DB-001 table rename)
- **Dependencies**: DB-001 must complete first
- **Testing**: Credit analytics tests

### SVC-004: feature-flag.service.ts Feature Name
- **Priority**: MEDIUM
- **File**: src/lib/services/feature-flag.service.ts
- **Line**: 77
- **Current**: "Restaurant Discovery"
- **Standard**: "Hospitality Discovery"
- **Effort**: 1-2 hours
- **Risk**: LOW (feature flag name change, need migration for existing flags)
- **Dependencies**: None
- **Testing**: Feature flag tests

### SVC-005: site-builder.service.ts Template Category
- **Priority**: MEDIUM
- **File**: src/lib/services/site-builder.service.ts
- **Lines**: 70-99
- **Current**: Template category "Restaurant", template IDs with "restaurant-" prefix
- **Standard**: Broader hospitality categories ("Dining", "Hospitality", specific types)
- **Effort**: 4-6 hours
- **Risk**: MEDIUM (existing templates may use old IDs)
- **Dependencies**: None
- **Testing**: Site builder tests

### SVC-006: notification.service.ts Messages
- **Priority**: LOW
- **File**: src/lib/services/notification.service.ts
- **Current**: User-facing messages with "restaurant"
- **Standard**: Use "business" or "hospitality business"
- **Effort**: 2-3 hours
- **Risk**: LOW
- **Dependencies**: None
- **Testing**: Notification tests

### SVC-007: slip-pdf-generator.service.ts CSS Classes
- **Priority**: LOW
- **File**: src/lib/services/slip-pdf-generator.service.ts
- **Current**: CSS classes with "restaurant-name"
- **Standard**: CSS classes with "business-name"
- **Effort**: 1-2 hours
- **Risk**: LOW
- **Dependencies**: None
- **Testing**: PDF generation tests

### SVC-008: revenue-notification.service.ts Templates
- **Priority**: LOW
- **File**: src/lib/services/revenue-notification.service.ts
- **Current**: Email templates mentioning "restaurants"
- **Standard**: Use "hospitality businesses"
- **Effort**: 1-2 hours
- **Risk**: LOW
- **Dependencies**: None
- **Testing**: Email template tests

---

## Pages Layer Changes

### PAGE-001: portal/businesses.tsx
- **Priority**: HIGH
- **File**: src/pages/portal/businesses.tsx
- **Line**: 95
- **Current**: "No businesses yet. Share your Founder Code to start acquiring restaurants."
- **Standard**: "No businesses yet. Share your Founder Code to start acquiring hospitality businesses."
- **Effort**: 0.5 hours
- **Risk**: NONE
- **Testing**: Manual UI review

### PAGE-002: portal/codes.tsx
- **Priority**: HIGH
- **File**: src/pages/portal/codes.tsx
- **Line**: 62
- **Current**: "Share your codes with restaurants to earn commissions."
- **Standard**: "Share your codes with hospitality businesses to earn commissions."
- **Effort**: 0.5 hours
- **Risk**: NONE
- **Testing**: Manual UI review

### PAGE-003: dashboard/partner.tsx
- **Priority**: HIGH
- **File**: src/pages/dashboard/partner.tsx
- **Line**: 154
- **Current**: placeholder="e.g. 500+ restaurant owners"
- **Standard**: placeholder="e.g. 500+ hospitality business owners"
- **Effort**: 0.5 hours
- **Risk**: NONE
- **Testing**: Manual UI review

### PAGE-004: admin/users.tsx
- **Priority**: MEDIUM
- **File**: src/pages/admin/users.tsx
- **Line**: 164
- **Current**: `{user.restaurant?.name || 'N/A'}`
- **Standard**: `{user.business?.name || 'N/A'}`
- **Effort**: 1-2 hours (requires API response update)
- **Risk**: MEDIUM (data structure change)
- **Dependencies**: API must return `business` instead of `restaurant`
- **Testing**: Admin users page tests

### PAGE-005: admin/subscriptions.tsx
- **Priority**: MEDIUM
- **File**: src/pages/admin/subscriptions.tsx
- **Line**: 137
- **Current**: `{sub.restaurant?.name || 'N/A'}`
- **Standard**: `{sub.business?.name || 'N/A'}`
- **Effort**: 1-2 hours
- **Risk**: MEDIUM
- **Dependencies**: API must return `business` instead of `restaurant`
- **Testing**: Subscriptions page tests

### PAGE-006: admin/marketplace.tsx
- **Priority**: MEDIUM
- **File**: src/pages/admin/marketplace.tsx
- **Line**: 143
- **Current**: `{order.restaurant?.name || 'N/A'}`
- **Standard**: `{order.business?.name || 'N/A'}`
- **Effort**: 1-2 hours
- **Risk**: MEDIUM
- **Dependencies**: API must return `business` instead of `restaurant`
- **Testing**: Marketplace page tests

### PAGE-007: affiliate/index.tsx
- **Priority**: LOW
- **File**: src/pages/affiliate/index.tsx
- **Line**: 171
- **Current**: `{comm.business?.name || comm.restaurant?.name || 'N/A'}`
- **Standard**: `{comm.business?.name || 'N/A'}`
- **Effort**: 0.5 hours
- **Risk**: LOW (removing fallback)
- **Dependencies**: API must consistently return `business`
- **Testing**: Affiliate page tests

---

## Components Layer Changes

### COMP-001: RestaurantSupplier.tsx Rename
- **Priority**: MEDIUM
- **File**: src/components/RestaurantSupplier.tsx
- **Current**: Component named `RestaurantSupplier`
- **Standard**: Rename to `BusinessSupplier.tsx`
- **Effort**: 3-5 hours (rename + update all imports)
- **Risk**: MEDIUM (import paths throughout codebase)
- **Dependencies**: All files importing RestaurantSupplier
- **Testing**: Supplier integration tests

### COMP-002: AchievementBadge.tsx Icon Keys
- **Priority**: HIGH
- **File**: src/components/AchievementBadge.tsx (and MilestoneCard.tsx)
- **Lines**: 14-17
- **Current**: `first_restaurant`, `ten_restaurants`, `fifty_restaurants`, `hundred_restaurants`
- **Standard**: `first_business`, `ten_businesses`, `fifty_businesses`, `hundred_businesses`
- **Effort**: 2-3 hours (update icon keys + data sources)
- **Risk**: MEDIUM (achievement data must use new keys)
- **Dependencies**: Database/data source that provides achievement keys
- **Testing**: Achievement system tests

### COMP-003: MilestoneCard.tsx Icon Keys
- **Priority**: HIGH
- **File**: src/components/MilestoneCard.tsx
- **Lines**: 26-29
- **Current**: Same as COMP-002
- **Standard**: Same as COMP-002
- **Effort**: 1-2 hours
- **Risk**: MEDIUM
- **Dependencies**: COMP-002
- **Testing**: Milestone tests

### COMP-004: Multi-Location Dashboard Data Property
- **Priority**: MEDIUM
- **File**: src/components/multi-location-intelligence/ (dashboard component)
- **Line**: 46
- **Current**: `restaurantCount`
- **Standard**: `businessCount`
- **Effort**: 1-2 hours (update property + API response)
- **Risk**: MEDIUM
- **Dependencies**: API must return `businessCount`
- **Testing**: Multi-location dashboard tests

### COMP-005: AdminLayout URL/Label
- **Priority**: LOW
- **File**: src/components/AdminLayout.tsx
- **Line**: 37
- **Current**: Label "Businesses" but URL `/admin/restaurants`
- **Standard**: ACCEPTABLE — label is correct, URL is legacy
- **Effort**: 0 hours (document as acceptable)
- **Risk**: NONE
- **Note**: URL rename would break bookmarks and external links. Keep as-is.

---

## Executive Operating System Changes

### EOS-001 through EOS-012: User-Visible Text (HIGH PRIORITY)

| ID | File | Line | Current | Standard | Effort |
|----|------|------|---------|----------|--------|
| EOS-001 | src/pages/admin/executive/ceo.tsx | 227 | "Restaurants currently active on platform" | "Hospitality Businesses currently active on platform" | 0.5h |
| EOS-002 | src/pages/admin/executive/cmo.tsx | 457 | "Restaurant acquisition has stalled." | "Hospitality Business acquisition has stalled." | 0.5h |
| EOS-003 | src/pages/api/admin/executive/cmo.ts | 457 | "Restaurant acquisition has stalled." | "Hospitality Business acquisition has stalled." | 0.5h |
| EOS-004 | src/pages/api/admin/executive/coo.ts | 154 | "Restaurant Operations" | "Hospitality Business Operations" | 0.5h |
| EOS-005 | src/pages/api/admin/executive/coo.ts | 224 | "Restaurant Signup → Active" | "Hospitality Business Signup → Active" | 0.5h |
| EOS-006 | src/components/executive/GrowthPulse.tsx | 77 | "Restaurant Growth (7d)" | "Hospitality Business Growth (7d)" | 0.5h |
| EOS-007 | src/components/executive/RestaurantEcosystem.tsx | 42 | "Restaurant ecosystem data unavailable" | "Hospitality Business ecosystem data unavailable" | 0.5h |
| EOS-008 | src/components/executive/RestaurantEcosystem.tsx | 56 | "Restaurant Ecosystem" | "Hospitality Business Ecosystem" | 0.5h |
| EOS-009 | src/components/executive/RestaurantOperations.tsx | 38 | "Restaurant operations data unavailable" | "Hospitality Business operations data unavailable" | 0.5h |
| EOS-010 | src/components/executive/RestaurantOperations.tsx | 45 | "Restaurant Operations" | "Hospitality Business Operations" | 0.5h |
| EOS-011 | src/components/executive/AcquisitionFunnel.tsx | 56 | "Interested Restaurant" | "Interested Hospitality Business" | 0.5h |
| EOS-012 | src/components/executive/RegionalGrowthIntelligence.tsx | 92 | "Restaurant Density by City" | "Hospitality Business Density by City" | 0.5h |

### EOS-013 through EOS-015: Comments (LOW PRIORITY)

| ID | File | Line | Current | Standard | Effort |
|----|------|------|---------|----------|--------|
| EOS-013 | src/pages/api/admin/executive/cmo.ts | 148 | "// Restaurant Growth" | "// Hospitality Business Growth" | 0.25h |
| EOS-014 | src/pages/api/admin/executive/coo.ts | 435 | "// Restaurant Operations" | "// Hospitality Business Operations" | 0.25h |
| EOS-015 | src/pages/admin/executive/coo.tsx | 172 | "// Section 4: Restaurant Operations" | "// Section 4: Hospitality Business Operations" | 0.25h |

### EOS-016 through EOS-017: Component Renames (LOW PRIORITY)

| ID | File | Current | Standard | Effort |
|----|------|---------|----------|--------|
| EOS-016 | src/components/executive/RestaurantEcosystem.tsx | RestaurantEcosystem | HospitalityBusinessEcosystem | 4-6h |
| EOS-017 | src/components/executive/RestaurantOperations.tsx | RestaurantOperations | HospitalityBusinessOperations | 4-6h |

### EOS-018 through EOS-023: Variable Renames (LOW PRIORITY)

| ID | File | Current Variable | Standard Variable | Effort |
|----|------|-----------------|-------------------|--------|
| EOS-018 | cmo.ts, cmo.tsx | restaurantGrowth | businessGrowth | 1-2h |
| EOS-019 | coo.ts, coo.tsx | restaurantOps | businessOps | 1-2h |
| EOS-020 | ceo.ts | restaurantEcosystem | businessEcosystem | 1h |
| EOS-021 | ceo.ts | restaurantActivity | businessActivity | 1h |
| EOS-022 | cmo.ts, AcquisitionFunnel.tsx | interestedRestaurant | interestedBusiness | 1-2h |
| EOS-023 | ceo.ts | computeRestaurantScore | computeBusinessScore | 1h |

### EOS-024: AI Assistant Structure Standardization (MEDIUM PRIORITY)

| AI Assistant | Missing Fields | Effort |
|-------------|---------------|--------|
| CEO (AIAssistant) | expectedImpact | 2h |
| CFO (AIFinancialAssistant) | expectedImpact | 2h |
| COO (AIOperationsAssistant) | expectedImpact | 2h |
| CMO (AIMarketingAssistant) | suggestedActions | 2h |
| Partnership (AIPartnershipAssistant) | suggestedActions | 2h |
| Customer Success (AICustomerSuccessAssistant) | suggestedActions | 2h |
| Executive Intelligence (AIIntelligenceAssistant) | expectedImpact + suggestedActions | 3h |

---

## Summary Tables

### By Priority

| Priority | Count | Total Effort |
|----------|-------|-------------|
| HIGH | 20 | 40-60 hours |
| MEDIUM | 16 | 30-50 hours |
| LOW | 12 | 20-30 hours |
| **Total** | **48** | **90-140 hours** |

### By Layer

| Layer | Count | Effort |
|-------|-------|--------|
| Database | 5 | 36-55 hours |
| Services | 8 | 13-22 hours |
| Pages | 7 | 5-9 hours |
| Components | 5 | 7-12 hours |
| Executive OS | 23 | 25-40 hours |
| **Total** | **48** | **86-138 hours** |

### By Risk

| Risk | Count |
|------|-------|
| HIGH | 2 (DB-001, SVC-003) |
| MEDIUM | 18 |
| LOW | 20 |
| NONE | 8 |

---

## Implementation Order

### Phase 1: DGS-001A (User-Facing, LOW Risk)
1. EOS-001 through EOS-012 (executive text)
2. PAGE-001, PAGE-002, PAGE-003 (portal/dashboard text)
3. COMP-002, COMP-003 (achievement icon keys)
4. DB-005 (comment update)
5. EOS-013 through EOS-015 (comment updates)

### Phase 2: DGS-001B (Backend, MEDIUM-HIGH Risk)
1. DB-001 (table rename — CRITICAL PATH)
2. SVC-001, SVC-002, SVC-003 (service methods)
3. SVC-004, SVC-005 (feature flags, templates)
4. PAGE-004 through PAGE-007 (data property changes)
5. COMP-001, COMP-004 (component rename, data property)

### Phase 3: DGS-001C (Refinement, LOW Risk)
1. EOS-016, EOS-017 (executive component renames)
2. EOS-018 through EOS-023 (variable renames)
3. EOS-024 (AI assistant structure)
4. DB-002, DB-003, DB-004 (schema refinements)
5. SVC-006, SVC-007, SVC-008 (template refinements)
