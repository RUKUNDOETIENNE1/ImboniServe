# DGS-001 Implementation Priority Matrix

## Sprint Plan for Domain Governance Standardization

---

## Overview

| Sprint | Focus | Items | Effort | Risk | Duration |
|--------|-------|-------|--------|------|----------|
| DGS-001A | User-Facing Changes | 18 | 20-30h | LOW | 1-2 weeks |
| DGS-001B | Backend Changes | 13 | 50-75h | MEDIUM-HIGH | 3-4 weeks |
| DGS-001C | Refinement | 17 | 25-40h | LOW | 2-3 weeks |
| **Total** | | **48** | **95-145h** | | **6-9 weeks** |

---

## Sprint 1: DGS-001A — Immediate User-Facing Changes

**Priority**: HIGH | **Risk**: LOW | **User Impact**: HIGH | **Prerequisites**: None

### Group 1A: Executive Operating System User-Visible Text (12 items)

| Item ID | File | Change | Effort |
|---------|------|--------|--------|
| EOS-001 | ceo.tsx:227 | "Restaurants" → "Hospitality Businesses" | 0.5h |
| EOS-002 | cmo.tsx:457 | "Restaurant acquisition" → "Hospitality Business acquisition" | 0.5h |
| EOS-003 | cmo.ts:457 | Same as above (API) | 0.5h |
| EOS-004 | coo.ts:154 | "Restaurant Operations" → "Hospitality Business Operations" | 0.5h |
| EOS-005 | coo.ts:224 | "Restaurant Signup" → "Hospitality Business Signup" | 0.5h |
| EOS-006 | GrowthPulse.tsx:77 | "Restaurant Growth" → "Hospitality Business Growth" | 0.5h |
| EOS-007 | RestaurantEcosystem.tsx:42 | "Restaurant ecosystem" → "Hospitality Business ecosystem" | 0.5h |
| EOS-008 | RestaurantEcosystem.tsx:56 | "Restaurant Ecosystem" → "Hospitality Business Ecosystem" | 0.5h |
| EOS-009 | RestaurantOperations.tsx:38 | "Restaurant operations" → "Hospitality Business operations" | 0.5h |
| EOS-010 | RestaurantOperations.tsx:45 | "Restaurant Operations" → "Hospitality Business Operations" | 0.5h |
| EOS-011 | AcquisitionFunnel.tsx:56 | "Interested Restaurant" → "Interested Hospitality Business" | 0.5h |
| EOS-012 | RegionalGrowthIntelligence.tsx:92 | "Restaurant Density" → "Hospitality Business Density" | 0.5h |

**Subtotal**: 6 hours | **Testing**: 141 existing executive tests must pass + manual UI review

### Group 1B: Portal and Dashboard User-Facing Text (6 items)

| Item ID | File | Change | Effort |
|---------|------|--------|--------|
| PAGE-001 | portal/businesses.tsx:95 | "acquiring restaurants" → "acquiring hospitality businesses" | 0.5h |
| PAGE-002 | portal/codes.tsx:62 | "with restaurants" → "with hospitality businesses" | 0.5h |
| PAGE-003 | dashboard/partner.tsx:154 | "restaurant owners" → "hospitality business owners" | 0.5h |
| PAGE-004 | admin/users.tsx:164 | user.restaurant → user.business | 2h |
| PAGE-005 | admin/subscriptions.tsx:137 | sub.restaurant → sub.business | 2h |
| PAGE-006 | admin/marketplace.tsx:143 | order.restaurant → order.business | 2h |

**Subtotal**: 7.5 hours | **Testing**: Manual UI review + page smoke tests

### Group 1C: Component User-Facing Text (3 items)

| Item ID | File | Change | Effort |
|---------|------|--------|--------|
| COMP-002 | AchievementBadge.tsx | Icon keys: first_restaurant → first_business | 2h |
| COMP-003 | MilestoneCard.tsx | Same icon key updates | 1h |
| COMP-004 | Multi-Location Dashboard | restaurantCount → businessCount | 2h |

**Subtotal**: 5 hours | **Testing**: Achievement system tests + dashboard tests

### Group 1D: Comments and Documentation (4 items)

| Item ID | File | Change | Effort |
|---------|------|--------|--------|
| DB-005 | schema.prisma:3059 | Comment update | 0.5h |
| EOS-013 | cmo.ts:148 | Comment update | 0.25h |
| EOS-014 | coo.ts:435 | Comment update | 0.25h |
| EOS-015 | coo.tsx:172 | Comment update | 0.25h |

**Subtotal**: 1.25 hours | **Testing**: None

### Sprint 1 Summary

| Metric | Value |
|--------|-------|
| Total items | 25 |
| Total effort | 19.75 hours (≈ 3 days) |
| Risk level | LOW |
| User impact | HIGH (immediate visible improvement) |
| Testing effort | 4-6 hours |
| Approval gate | Product owner review of UI changes |

### Sprint 1 Success Criteria

- [ ] All 12 executive text changes deployed and verified
- [ ] All 6 portal/dashboard text changes deployed and verified
- [ ] All 3 component changes deployed and verified
- [ ] 141 executive tests pass
- [ ] No new TypeScript errors
- [ ] Next.js build passes
- [ ] Product owner sign-off

---

## Sprint 2: DGS-001B — Strategic Backend Changes

**Priority**: HIGH-MEDIUM | **Risk**: MEDIUM-HIGH | **User Impact**: MEDIUM | **Prerequisites**: Sprint 1 complete

### Group 2A: Database Table Rename (1 item, CRITICAL PATH)

| Item ID | File | Change | Effort | Risk |
|---------|------|--------|--------|------|
| DB-001 | schema.prisma:288 | @@map("Restaurant") → @@map("Business") | 20-30h | HIGH |

**Detailed Steps**:
1. Create Prisma migration script
2. Test migration on staging database
3. Update all raw SQL queries (SVC-003)
4. Deploy migration with downtime window
5. Verify data integrity
6. Update application code
7. Run full regression suite

**Subtotal**: 20-30 hours | **Testing**: Full regression + data integrity checks

### Group 2B: Service Method Renames (5 items)

| Item ID | File | Change | Effort |
|---------|------|--------|--------|
| SVC-001 | admin.service.ts | getRestaurants() → getBusinesses() etc. | 4-6h |
| SVC-002 | smart-dining-slip.service.ts | getRestaurantSlips() → getBusinessSlips() etc. | 3-5h |
| SVC-003 | credit-analytics.service.ts | SQL JOIN "Restaurant" → "Business" | 1-2h |
| SVC-004 | feature-flag.service.ts | "Restaurant Discovery" → "Hospitality Discovery" | 1-2h |
| SVC-005 | site-builder.service.ts | Template category "Restaurant" → broader | 4-6h |

**Subtotal**: 13-21 hours | **Testing**: Service unit tests + API integration tests

### Group 2C: Schema Field Renames (3 items)

| Item ID | File | Change | Effort |
|---------|------|--------|--------|
| DB-002 | schema.prisma:1628 | Default OutletType | 2-4h |
| DB-003 | schema.prisma:2198 | UserRole.WAITER → SERVER | 10-15h |
| DB-004 | schema.prisma:1870 | cuisineTypes → categoryTypes | 4-6h |

**Subtotal**: 16-25 hours | **Testing**: Role-based access tests + profile tests

### Group 2D: Component Rename (1 item)

| Item ID | File | Change | Effort |
|---------|------|--------|--------|
| COMP-001 | RestaurantSupplier.tsx | Rename to BusinessSupplier.tsx | 3-5h |

**Subtotal**: 3-5 hours | **Testing**: Supplier integration tests

### Sprint 2 Summary

| Metric | Value |
|--------|-------|
| Total items | 10 |
| Total effort | 52-81 hours (≈ 7-11 days) |
| Risk level | MEDIUM-HIGH (database migration) |
| User impact | MEDIUM (internal changes, some visible) |
| Testing effort | 15-20 hours |
| Approval gate | CTO + DevOps approval for migration |

### Sprint 2 Risk Mitigation

- **Database migration**: Test on staging first, prepare rollback script, schedule downtime window
- **Service renames**: Update all callers in same PR, use deprecation aliases temporarily
- **Schema changes**: Create migration with both old and new fields, backfill data, then remove old

### Sprint 2 Success Criteria

- [ ] Database migration completed and verified
- [ ] All service method renames complete
- [ ] All schema field renames complete
- [ ] Component rename complete
- [ ] Full regression suite passes
- [ ] No data loss
- [ ] CTO sign-off

---

## Sprint 3: DGS-001C — Refinement and Consistency

**Priority**: MEDIUM-LOW | **Risk**: LOW | **User Impact**: LOW | **Prerequisites**: Sprint 2 complete

### Group 3A: Executive Component Renames (2 items)

| Item ID | File | Change | Effort |
|---------|------|--------|--------|
| EOS-016 | RestaurantEcosystem.tsx | → HospitalityBusinessEcosystem.tsx | 4-6h |
| EOS-017 | RestaurantOperations.tsx | → HospitalityBusinessOperations.tsx | 4-6h |

**Subtotal**: 8-12 hours | **Testing**: Executive center tests (141 tests)

### Group 3B: Variable Renames (6 items)

| Item ID | File | Change | Effort |
|---------|------|--------|--------|
| EOS-018 | cmo.ts, cmo.tsx | restaurantGrowth → businessGrowth | 1-2h |
| EOS-019 | coo.ts, coo.tsx | restaurantOps → businessOps | 1-2h |
| EOS-020 | ceo.ts | restaurantEcosystem → businessEcosystem | 1h |
| EOS-021 | ceo.ts | restaurantActivity → businessActivity | 1h |
| EOS-022 | cmo.ts, AcquisitionFunnel.tsx | interestedRestaurant → interestedBusiness | 1-2h |
| EOS-023 | ceo.ts | computeRestaurantScore → computeBusinessScore | 1h |

**Subtotal**: 6-10 hours | **Testing**: Affected feature tests

### Group 3C: AI Assistant Structure Standardization (7 items)

| AI Assistant | Missing Fields | Effort |
|-------------|---------------|--------|
| CEO (AIAssistant) | Add expectedImpact | 2h |
| CFO (AIFinancialAssistant) | Add expectedImpact | 2h |
| COO (AIOperationsAssistant) | Add expectedImpact | 2h |
| CMO (AIMarketingAssistant) | Add suggestedActions | 2h |
| Partnership (AIPartnershipAssistant) | Add suggestedActions | 2h |
| Customer Success (AICustomerSuccessAssistant) | Add suggestedActions | 2h |
| Executive Intelligence (AIIntelligenceAssistant) | Add both fields | 3h |

**Subtotal**: 15 hours | **Testing**: AI assistant response validation tests

### Group 3D: Template Refinements (3 items)

| Item ID | File | Change | Effort |
|---------|------|--------|--------|
| SVC-006 | notification.service.ts | Update messages | 2-3h |
| SVC-007 | slip-pdf-generator.service.ts | Update CSS classes | 1-2h |
| SVC-008 | revenue-notification.service.ts | Update email templates | 1-2h |

**Subtotal**: 4-7 hours | **Testing**: Notification and template tests

### Sprint 3 Summary

| Metric | Value |
|--------|-------|
| Total items | 18 |
| Total effort | 33-44 hours (≈ 5-6 days) |
| Risk level | LOW |
| User impact | LOW (internal consistency) |
| Testing effort | 6-8 hours |
| Approval gate | Engineering lead review |

### Sprint 3 Success Criteria

- [ ] All executive component renames complete
- [ ] All variable renames complete
- [ ] All AI assistants have standardized structure
- [ ] All template refinements complete
- [ ] 141 executive tests pass
- [ ] No new TypeScript errors
- [ ] Next.js build passes
- [ ] Engineering lead sign-off

---

## Critical Path Analysis

```
Sprint 1 (DGS-001A) ──────── Sprint 2 (DGS-001B) ──────── Sprint 3 (DGS-001C)
   1-2 weeks                   3-4 weeks                    2-3 weeks
      │                           │                             │
      │  User-facing text         │  DB migration               │  Component renames
      │  Comments                 │  Service renames            │  Variable renames
      │  Icon keys                │  Schema changes             │  AI standardization
      │                           │  Component rename           │  Template refinements
      ▼                           ▼                             ▼
   [PO Approval]             [CTO Approval]              [Eng Lead Approval]
```

**Critical Path**: Sprint 2 Group 2A (DB-001: Table Rename)
- This is the highest-risk, highest-effort single item
- All raw SQL queries depend on it
- Requires downtime coordination
- Must be completed before Sprint 3

---

## Resource Requirements

| Role | Sprint 1 | Sprint 2 | Sprint 3 | Total |
|------|----------|----------|----------|-------|
| Frontend Developer | 1 | 1 | 1 | 1 |
| Backend Developer | 0.5 | 1 | 0.5 | 1 |
| DevOps Engineer | 0 | 0.5 | 0 | 0.25 |
| QA Engineer | 0.5 | 1 | 0.5 | 0.5 |
| Product Owner | 0.25 | 0.25 | 0 | 0.25 |

**Total team size**: 3-4 people
**Total duration**: 6-9 weeks (with parallel work)

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Database migration failure | Test on staging, prepare rollback, schedule downtime |
| Service rename breaks callers | Use deprecation aliases, update all callers in same PR |
| Achievement icon key mismatch | Coordinate with data source, migrate existing achievement records |
| AI assistant structure change | Add fields as optional first, then require after migration |
| Template category change | Map old categories to new, maintain backward compatibility |

---

## Approval Gates

| Gate | Approver | Criteria |
|------|----------|----------|
| Sprint 1 Start | Product Owner | User-facing text changes approved |
| Sprint 1 End | Product Owner | UI changes verified, tests pass |
| Sprint 2 Start | CTO + DevOps | Migration plan approved, downtime scheduled |
| Sprint 2 End | CTO | Migration complete, no data loss, tests pass |
| Sprint 3 Start | Engineering Lead | Refinement plan approved |
| Sprint 3 End | Engineering Lead | All renames complete, tests pass |
| DGS-001 Complete | CEO + CTO | All 48 items resolved, platform speaks one language |

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| User-visible "restaurant" instances | 0 (except business type options) | grep audit |
| AI assistants with standard structure | 7/7 | Interface audit |
| Executive tests passing | 141/141 | jest run |
| TypeScript errors | 0 | tsc --noEmit |
| Next.js build | PASS | npm run build |
| Identity Misalignment Score | < 5% (from 36%) | Platform audit |

---

## Conclusion

This Implementation Priority Matrix provides a clear, actionable path from the current 36% identity misalignment to a unified Hospitality Intelligence Operating System identity. The 3-sprint approach minimizes risk by front-loading low-risk user-facing changes, handling high-risk backend changes in a controlled sprint, and finishing with low-risk refinements.

**Total effort**: 95-145 hours over 6-9 weeks with a team of 3-4 people.
