# DOMAIN_CONSTITUTION_MAP

**Document:** Business Domain Traceability to Commercial Constitution  
**Date:** 2026-07-04  
**Purpose:** Map every business domain to constitutional principles  
**Authority:** Commercial Constitution v1.1

---

## TRACEABILITY OVERVIEW

This document creates explicit traceability between:

```
Business Capability
    ↓
Commercial Constitution
    ↓
Implementation (Endpoints)
    ↓
Testing & Verification
    ↓
Certification
```

Every business domain references the constitutional sections that govern it.

---

## DOMAIN 1: ORDERS

### Constitutional Authority

| Section | Principle | Application |
|---------|-----------|-------------|
| **6.2** | STARTER Plan Entitlements | Orders are core STARTER capability |
| **7** | Progressive Commercial Discovery | Orders visible to all plans |
| **8** | Guided Professional Trial | Trial users can create orders |

### Protected Endpoints

| Endpoint | Middleware | Constitution Reference |
|----------|------------|------------------------|
| `/api/orders` | `requiresFeature('hasOrders')` | Section 6.2 |
| `/api/orders/[id]` | `requiresFeature('hasOrders')` | Section 6.2 |
| `/api/orders/[id]/status` | `requiresFeature('hasOrders')` | Section 6.2 |
| `/api/orders/[id]/cancel` | `requiresFeature('hasOrders')` | Section 6.2 |
| `/api/orders/[id]/refund` | `requiresFeature('hasOrders')` | Section 6.2 |
| `/api/orders/stats` | `requiresFeature('hasOrders')` | Section 6.2 |
| `/api/orders/export` | `requiresFeature('hasOrders')` | Section 6.2 |
| `/api/orders/bulk-update` | `requiresFeature('hasOrders')` | Section 6.2 |
| `/api/orders/search` | `requiresFeature('hasOrders')` | Section 6.2 |
| `/api/orders/timeline` | `requiresFeature('hasOrders')` | Section 6.2 |
| `/api/orders/analytics` | `requiresFeature('hasOrders')` | Section 6.2 |
| `/api/orders/notifications` | `requiresFeature('hasOrders')` | Section 6.2 |
| `/api/orders/print` | `requiresFeature('hasOrders')` | Section 6.2 |
| `/api/orders/batch` | `requiresFeature('hasOrders')` | Section 6.2 |

### Coverage Status

- **Endpoints Protected:** 0 / 14
- **Capabilities Covered:** 0 / 8
- **Regression:** ⏳ Pending
- **Certification:** ❌ Not Certified

---

## DOMAIN 2: KITCHEN OPERATIONS

### Constitutional Authority

| Section | Principle | Application |
|---------|-----------|-------------|
| **6.2** | STARTER Plan Entitlements | Kitchen Tickets are core STARTER capability |
| **6.4** | BUSINESS Plan Entitlements | KDS requires BUSINESS plan |
| **6.5** | PREMIUM Plan Entitlements | KDS Advanced, Prep Plans, Forecasting require PREMIUM |
| **7** | Progressive Commercial Discovery | KDS visible to Professional users as upgrade opportunity |

### Protected Endpoints

| Endpoint | Middleware | Constitution Reference |
|----------|------------|------------------------|
| `/api/kitchen/tickets` | `requiresFeature('hasKitchenTickets')` | Section 6.2 |
| `/api/kitchen/tickets/[id]` | `requiresFeature('hasKitchenTickets')` | Section 6.2 |
| `/api/kitchen/tickets/[id]/status` | `requiresFeature('hasKitchenTickets')` | Section 6.2 |
| `/api/kitchen/kds` | `requiresFeature('hasKDS')` | Section 6.4 |
| `/api/kitchen/kds/advanced` | `requiresFeature('hasKDSAdvanced')` | Section 6.5 |
| `/api/kitchen/stations` | `requiresFeature('hasKitchenTickets')` | Section 6.2 |
| `/api/kitchen/prep-plans` | `requiresFeature('hasPrepPlans')` | Section 6.5 |
| `/api/kitchen/forecasting` | `requiresFeature('hasForecasting')` | Section 6.5 |

### Coverage Status

- **Endpoints Protected:** 0 / 8
- **Capabilities Covered:** 0 / 5
- **Regression:** ⏳ Pending
- **Certification:** ❌ Not Certified

---

## DOMAIN 3: TABLES

### Constitutional Authority

| Section | Principle | Application |
|---------|-----------|-------------|
| **6.2** | STARTER Plan Entitlements | Tables are core STARTER capability |
| **7** | Progressive Commercial Discovery | Tables visible to all plans |

### Protected Endpoints

| Endpoint | Middleware | Constitution Reference |
|----------|------------|------------------------|
| `/api/tables` | `requiresFeature('hasTables')` | Section 6.2 |
| `/api/tables/[id]` | `requiresFeature('hasTables')` | Section 6.2 |
| `/api/tables/[id]/status` | `requiresFeature('hasTables')` | Section 6.2 |
| `/api/tables/layout` | `requiresFeature('hasTables')` | Section 6.2 |
| `/api/tables/availability` | `requiresFeature('hasTables')` | Section 6.2 |
| `/api/tables/merge` | `requiresFeature('hasTables')` | Section 6.2 |

### Coverage Status

- **Endpoints Protected:** 0 / 6
- **Capabilities Covered:** 0 / 4
- **Regression:** ⏳ Pending
- **Certification:** ❌ Not Certified

---

## DOMAIN 4: RESERVATIONS

### Constitutional Authority

| Section | Principle | Application |
|---------|-----------|-------------|
| **6.3** | PROFESSIONAL Plan Entitlements | Reservations require PROFESSIONAL plan |
| **7** | Progressive Commercial Discovery | Reservations visible to STARTER users as upgrade opportunity |
| **8** | Guided Professional Trial | Trial users can create reservations |

### Protected Endpoints

| Endpoint | Middleware | Constitution Reference |
|----------|------------|------------------------|
| `/api/reservations` | `requiresFeature('hasReservations')` | Section 6.3 |
| `/api/reservations/[id]` | `requiresFeature('hasReservations')` | Section 6.3 |
| `/api/reservations/[id]/cancel` | `requiresFeature('hasReservations')` | Section 6.3 |
| `/api/reservations/[id]/deposit/initiate` | `requiresFeature('hasReservations')` | Section 6.3 |

### Coverage Status

- **Endpoints Protected:** 1 / 4 (25%)
- **Capabilities Covered:** 2 / 5 (40% partial)
- **Regression:** ⏳ Pending
- **Certification:** ❌ Not Certified

---

## DOMAIN 5: MENU MANAGEMENT

### Constitutional Authority

| Section | Principle | Application |
|---------|-----------|-------------|
| **6.2** | STARTER Plan Entitlements | Menu is core STARTER capability |
| **6.3** | PROFESSIONAL Plan Entitlements | Menu Performance, AI Menu Builder require PROFESSIONAL |
| **6.4** | BUSINESS Plan Entitlements | Menu Performance by Branch requires BUSINESS |
| **6.5** | PREMIUM Plan Entitlements | Recipe Management requires PREMIUM |
| **7** | Progressive Commercial Discovery | Advanced menu features visible as upgrade opportunities |

### Protected Endpoints

| Endpoint | Middleware | Constitution Reference |
|----------|------------|------------------------|
| `/api/menu` | `requiresFeature('hasMenu')` | Section 6.2 |
| `/api/menu/items` | `requiresFeature('hasMenu')` | Section 6.2 |
| `/api/menu/items/[id]` | `requiresFeature('hasMenu')` | Section 6.2 |
| `/api/menu/categories` | `requiresFeature('hasMenu')` | Section 6.2 |
| `/api/menu/categories/[id]` | `requiresFeature('hasMenu')` | Section 6.2 |
| `/api/menu/modifiers` | `requiresFeature('hasMenu')` | Section 6.2 |
| `/api/menu/pricing` | `requiresFeature('hasMenu')` | Section 6.2 |
| `/api/menu/availability` | `requiresFeature('hasMenu')` | Section 6.2 |
| `/api/menu/performance` | `requiresFeature('hasMenuPerformance')` | Section 6.3 |
| `/api/menu/performance/branch` | `requiresFeature('hasMenuPerformanceByBranch')` | Section 6.4 |
| `/api/ai/menu-builder` | `requiresFeature('hasAIMenuBuilder')` | Section 6.3 |
| `/api/menu/recipes` | `requiresFeature('hasRecipeManagement')` | Section 6.5 |

### Coverage Status

- **Endpoints Protected:** 0 / 12
- **Capabilities Covered:** 0 / 7
- **Regression:** ⏳ Pending
- **Certification:** ❌ Not Certified

---

## DOMAIN 6: INVENTORY

### Constitutional Authority

| Section | Principle | Application |
|---------|-----------|-------------|
| **6.2** | STARTER Plan Entitlements | Basic Inventory is core STARTER capability |
| **6.3** | PROFESSIONAL Plan Entitlements | Inventory Alerts require PROFESSIONAL |
| **6.5** | PREMIUM Plan Entitlements | Inventory Auto-Reorder requires PREMIUM |
| **7** | Progressive Commercial Discovery | Advanced inventory features visible as upgrade opportunities |

### Protected Endpoints

| Endpoint | Middleware | Constitution Reference |
|----------|------------|------------------------|
| `/api/inventory` | `requiresFeature('hasBasicInventory')` | Section 6.2 |
| `/api/inventory/items` | `requiresFeature('hasBasicInventory')` | Section 6.2 |
| `/api/inventory/items/[id]` | `requiresFeature('hasBasicInventory')` | Section 6.2 |
| `/api/inventory/count` | `requiresFeature('hasBasicInventory')` | Section 6.2 |
| `/api/inventory/alerts` | `requiresFeature('hasInventoryAlerts')` | Section 6.3 |
| `/api/inventory/auto-reorder` | `requiresFeature('hasInventoryAutoReorder')` | Section 6.5 |
| `/api/inventory/transfers` | `requiresFeature('hasBasicInventory')` | Section 6.2 |
| `/api/inventory/adjustments` | `requiresFeature('hasBasicInventory')` | Section 6.2 |
| `/api/inventory/consumption` | `requiresFeature('hasBasicInventory')` | Section 6.2 |
| `/api/inventory/valuation` | `requiresFeature('hasBasicInventory')` | Section 6.2 |

### Coverage Status

- **Endpoints Protected:** 0 / 10
- **Capabilities Covered:** 0 / 6
- **Regression:** ⏳ Pending
- **Certification:** ❌ Not Certified

---

## DOMAIN 7: PROCUREMENT

### Constitutional Authority

| Section | Principle | Application |
|---------|-----------|-------------|
| **6.2** | STARTER Plan Entitlements | Basic Supplier Orders are core STARTER capability |
| **6.3** | PROFESSIONAL Plan Entitlements | Procurement Workflow requires PROFESSIONAL |
| **6.4** | BUSINESS Plan Entitlements | Supplier Portal, Delivery Confirmation require BUSINESS |
| **7** | Progressive Commercial Discovery | Advanced procurement features visible as upgrade opportunities |

### Protected Endpoints

| Endpoint | Middleware | Constitution Reference |
|----------|------------|------------------------|
| `/api/procurement` | `requiresFeature('hasBasicSupplierOrders')` | Section 6.2 |
| `/api/procurement/[id]` | `requiresFeature('hasBasicSupplierOrders')` | Section 6.2 |
| `/api/procurement/workflow` | `requiresFeature('hasProcurementWorkflow')` | Section 6.3 |
| `/api/procurement/suppliers` | `requiresFeature('hasBasicSupplierOrders')` | Section 6.2 |
| `/api/procurement/supplier-portal` | `requiresFeature('hasSupplierPortal')` | Section 6.4 |
| `/api/procurement/delivery-confirmation` | `requiresFeature('hasDeliveryConfirmation')` | Section 6.4 |

### Coverage Status

- **Endpoints Protected:** 0 / 6
- **Capabilities Covered:** 0 / 4
- **Regression:** ⏳ Pending
- **Certification:** ❌ Not Certified

---

## DOMAIN 8: QR ORDERING

### Constitutional Authority

| Section | Principle | Application |
|---------|-----------|-------------|
| **6.2** | STARTER Plan Entitlements | 5 QR codes included in STARTER |
| **6.3** | PROFESSIONAL Plan Entitlements | 20 QR codes included in PROFESSIONAL |
| **6.4** | BUSINESS Plan Entitlements | Unlimited QR codes, QR Analytics in BUSINESS |
| **7** | Progressive Commercial Discovery | QR Analytics visible to Professional users as upgrade opportunity |

### Protected Endpoints

| Endpoint | Middleware | Constitution Reference |
|----------|------------|------------------------|
| `/api/qr` | `requiresResourceLimit('qrCodes', getQRCount)` | Section 6.2, 6.3, 6.4 |
| `/api/qr/[id]` | `requiresFeature('hasQRCodes')` | Section 6.2 |
| `/api/qr/generate` | `requiresResourceLimit('qrCodes', getQRCount)` | Section 6.2, 6.3, 6.4 |
| `/api/qr/analytics` | `requiresFeature('hasQRAnalytics')` | Section 6.4 |
| `/api/qr/analytics/deep-dive` | `requiresFeature('hasQRAnalyticsDeepDive')` | Section 6.4 |

### Coverage Status

- **Endpoints Protected:** 0 / 5
- **Capabilities Covered:** 0 / 3
- **Regression:** ⏳ Pending
- **Certification:** ❌ Not Certified

---

## DOMAIN 9: PAYMENTS

### Constitutional Authority

| Section | Principle | Application |
|---------|-----------|-------------|
| **6.2** | STARTER Plan Entitlements | Payments are core STARTER capability |
| **6.3** | PROFESSIONAL Plan Entitlements | Payment Monitor, Payment Analytics require PROFESSIONAL |
| **6.4** | BUSINESS Plan Entitlements | Payment Analytics Pro, Payout Reconciliation require BUSINESS |
| **6.5** | PREMIUM Plan Entitlements | Revenue Intelligence requires PREMIUM |
| **7** | Progressive Commercial Discovery | Advanced payment features visible as upgrade opportunities |

### Protected Endpoints

| Endpoint | Middleware | Constitution Reference |
|----------|------------|------------------------|
| `/api/payments` | `requiresFeature('hasPayments')` | Section 6.2 |
| `/api/payments/monitor` | `requiresFeature('hasPaymentMonitor')` | Section 6.3 |
| `/api/payments/analytics` | `requiresFeature('hasPaymentAnalytics')` | Section 6.3 |
| `/api/payments/analytics/pro` | `requiresFeature('hasPaymentAnalyticsPro')` | Section 6.4 |
| `/api/payments/payout-reconciliation` | `requiresFeature('hasPayoutReconciliation')` | Section 6.4 |
| `/api/payments/revenue-intelligence` | `requiresFeature('hasRevenueIntelligence')` | Section 6.5 |
| `/api/payments/transactions` | `requiresFeature('hasPayments')` | Section 6.2 |

### Coverage Status

- **Endpoints Protected:** 0 / 7 (webhook excluded)
- **Capabilities Covered:** 0 / 6
- **Regression:** ⏳ Pending
- **Certification:** ❌ Not Certified

---

## DOMAIN 10: REPORTS & ANALYTICS

### Constitutional Authority

| Section | Principle | Application |
|---------|-----------|-------------|
| **6.2** | STARTER Plan Entitlements | Basic Reports are core STARTER capability |
| **6.3** | PROFESSIONAL Plan Entitlements | Peak Hours, Menu Performance, Payment Analytics require PROFESSIONAL |
| **6.4** | BUSINESS Plan Entitlements | QR Analytics requires BUSINESS |
| **6.5** | PREMIUM Plan Entitlements | Advanced Reports require PREMIUM |
| **7** | Progressive Commercial Discovery | Advanced analytics visible as upgrade opportunities |

### Protected Endpoints

| Endpoint | Middleware | Constitution Reference |
|----------|------------|------------------------|
| `/api/analytics/dashboard` | `requiresFeature('hasBasicReports')` | Section 6.2 |
| `/api/analytics/insights` | `requiresFeature('hasBasicReports')` | Section 6.2 |
| `/api/analytics/peak-hours` | `requiresFeature('hasPeakHoursAnalytics')` | Section 6.3 |
| `/api/analytics/menu-performance` | `requiresFeature('hasMenuPerformance')` | Section 6.3 |
| `/api/analytics/payments` | `requiresFeature('hasPaymentAnalytics')` | Section 6.3 |
| `/api/analytics/qr` | `requiresFeature('hasQRAnalytics')` | Section 6.4 |
| `/api/analytics/advanced` | `requiresFeature('hasAdvancedReports')` | Section 6.5 |

### Coverage Status

- **Endpoints Protected:** 0 / 7
- **Capabilities Covered:** 0 / 6
- **Regression:** ⏳ Pending
- **Certification:** ❌ Not Certified

---

## DOMAIN 11: AI FEATURES

### Constitutional Authority

| Section | Principle | Application |
|---------|-----------|-------------|
| **6.2** | STARTER Plan Entitlements | 20 AI credits/month in STARTER |
| **6.3** | PROFESSIONAL Plan Entitlements | 50 AI credits/month, AI Menu Builder in PROFESSIONAL |
| **6.4** | BUSINESS Plan Entitlements | 200 AI credits/month in BUSINESS |
| **6.5** | PREMIUM Plan Entitlements | Unlimited AI credits in PREMIUM |
| **7** | Progressive Commercial Discovery | AI features visible with credit limits |

### Protected Endpoints

| Endpoint | Middleware | Constitution Reference |
|----------|------------|------------------------|
| `/api/ai/menu-builder` | `requiresFeature('hasAIMenuBuilder')` | Section 6.3 |
| `/api/ai/brand-assistant` | `requiresResourceLimit('aiCredits', getAICreditsUsed)` | Section 6.2, 6.3, 6.4, 6.5 |
| `/api/ai/cost-anomalies` | `requiresResourceLimit('aiCredits', getAICreditsUsed)` | Section 6.2, 6.3, 6.4, 6.5 |
| `/api/ai/reorder` | `requiresResourceLimit('aiCredits', getAICreditsUsed)` | Section 6.2, 6.3, 6.4, 6.5 |

### Coverage Status

- **Endpoints Protected:** 0 / 4
- **Capabilities Covered:** 0 / 4
- **Regression:** ⏳ Pending
- **Certification:** ❌ Not Certified

---

## DOMAIN 12: STAFF & ROLES

### Constitutional Authority

| Section | Principle | Application |
|---------|-----------|-------------|
| **6.3** | PROFESSIONAL Plan Entitlements | Staff Management, Role-Based Access require PROFESSIONAL |
| **6.6** | ENTERPRISE Plan Entitlements | Custom Roles require ENTERPRISE |
| **7** | Progressive Commercial Discovery | Staff features visible to STARTER users as upgrade opportunity |

### Protected Endpoints

| Endpoint | Middleware | Constitution Reference |
|----------|------------|------------------------|
| `/api/staff` | `requiresFeature('hasStaffManagement')` | Section 6.3 |
| `/api/staff/[id]` | `requiresFeature('hasStaffManagement')` | Section 6.3 |
| `/api/staff/roles` | `requiresFeature('hasRoleBasedAccess')` | Section 6.3 |
| `/api/staff/custom-roles` | `requiresFeature('hasCustomRoles')` | Section 6.6 |

### Coverage Status

- **Endpoints Protected:** 0 / 4
- **Capabilities Covered:** 0 / 3
- **Regression:** ⏳ Pending
- **Certification:** ❌ Not Certified

---

## DOMAIN 13: BUSINESS SETTINGS

### Constitutional Authority

| Section | Principle | Application |
|---------|-----------|-------------|
| **6.2** | STARTER Plan Entitlements | 1 branch, 1 outlet in STARTER |
| **6.3** | PROFESSIONAL Plan Entitlements | 1 branch, unlimited outlets in PROFESSIONAL |
| **6.4** | BUSINESS Plan Entitlements | 3 branches, Multi-Branch Dashboard in BUSINESS |
| **6.5** | PREMIUM Plan Entitlements | Unlimited branches, White-Label, API Access in PREMIUM |
| **7** | Progressive Commercial Discovery | Multi-branch features visible as upgrade opportunities |

### Protected Endpoints

| Endpoint | Middleware | Constitution Reference |
|----------|------------|------------------------|
| `/api/business` | `requiresActiveSubscription` | Section 6.2 |
| `/api/business/branches` | `requiresResourceLimit('branches', getBranchCount)` | Section 6.2, 6.3, 6.4, 6.5 |
| `/api/business/branches/[id]` | `requiresFeature('hasBranches')` | Section 6.2 |
| `/api/business/multi-branch-dashboard` | `requiresFeature('hasMultiBranchDashboard')` | Section 6.4 |
| `/api/business/white-label` | `requiresFeature('hasWhiteLabelOptions')` | Section 6.5 |
| `/api/business/api-access` | `requiresFeature('hasAPIAccess')` | Section 6.5 |

### Coverage Status

- **Endpoints Protected:** 0 / 6
- **Capabilities Covered:** 0 / 5
- **Regression:** ⏳ Pending
- **Certification:** ❌ Not Certified

---

## DOMAIN 14: ADMINISTRATION

### Constitutional Authority

| Section | Principle | Application |
|---------|-----------|-------------|
| **6.6** | ENTERPRISE Plan Entitlements | Audit Exports, SSO require ENTERPRISE |
| **N/A** | Admin Role | Admin endpoints bypass commercial restrictions |

### Protected Endpoints

| Endpoint | Middleware | Constitution Reference |
|----------|------------|------------------------|
| `/api/admin/*` | Admin role check | N/A (Admin bypass) |
| `/api/audit-logs` | `requiresFeature('hasAuditExports')` | Section 6.6 |
| `/api/sso` | `requiresFeature('hasSSO')` | Section 6.6 |

### Coverage Status

- **Endpoints Protected:** 0 / 3
- **Capabilities Covered:** 0 / 3
- **Regression:** ⏳ Pending
- **Certification:** ❌ Not Certified

---

## DOMAIN 15-19: REMAINING DOMAINS

*[Similar structure for remaining domains]*

---

## TRACEABILITY SUMMARY

**Total Domains:** 19  
**Domains Mapped:** 14 (detailed above)  
**Domains Pending:** 5  
**Constitution Sections Referenced:** 6.2, 6.3, 6.4, 6.5, 6.6, 7, 8

---

## CERTIFICATION TRACEABILITY

For each domain to be certified, verify:

1. ✅ Constitutional authority identified
2. ✅ All endpoints mapped to constitution sections
3. ✅ All capabilities aligned with constitutional entitlements
4. ✅ Enforcement middleware matches constitutional requirements
5. ✅ Testing verifies constitutional compliance
6. ✅ Regression confirms no constitutional violations

---

**Last Updated:** 2026-07-04 09:00 UTC  
**Maintained By:** Engineering  
**Authority:** Commercial Constitution v1.1

---

**END OF CONSTITUTION MAP**
