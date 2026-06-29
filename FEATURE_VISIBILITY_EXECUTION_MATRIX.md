# Feature Visibility Execution Matrix

**Date:** 2026-06-29
**Author:** Principal Release Engineer
**Status:** EXECUTION SPECIFICATION (NOT IMPLEMENTED)

---

## Purpose

This matrix provides the complete specification for every feature's visibility implementation, including dependencies, rollback procedures, and impact analysis.

---

## Matrix Legend

| Column | Description |
|--------|-------------|
| Feature | Display name |
| Path | Route path |
| Current Nav | Currently in navigation (Y/N) |
| V1 Action | Implementation action |
| Method | How to implement |
| Dependencies | What depends on this |
| Rollback | How to revert |
| Risk | Implementation risk level |

---

## TIER 1: VISIBLE (Keep in V1 Navigation)

### Operations Section

| Feature | Path | Current Nav | V1 Action | Method | Dependencies | Rollback | Risk |
|---------|------|-------------|-----------|--------|--------------|----------|------|
| Dashboard | `/dashboard` | Y | KEEP | `v1Visible: true, v1Section: 'OPERATIONS', v1Order: 1` | None | Remove property | LOW |
| Orders | `/dashboard/orders/unified` | Y | KEEP + RENAME | `v1Visible: true, v1Section: 'OPERATIONS', v1Order: 2`, rename to "Orders" | Kitchen, Sales | Remove property | LOW |
| Kitchen | `/dashboard/kitchen` | Y | KEEP | `v1Visible: true, v1Section: 'OPERATIONS', v1Order: 3` | Orders | Remove property | LOW |
| Tables | `/dashboard/tables` | Y | KEEP + RENAME | `v1Visible: true, v1Section: 'OPERATIONS', v1Order: 4`, rename to "Tables" | Reservations, QR | Remove property | LOW |
| Reservations | `/dashboard/reservations` | Y | KEEP | `v1Visible: true, v1Section: 'OPERATIONS', v1Order: 5` | Tables | Remove property | LOW |

### Menu & Inventory Section

| Feature | Path | Current Nav | V1 Action | Method | Dependencies | Rollback | Risk |
|---------|------|-------------|-----------|--------|--------------|----------|------|
| Menu | `/dashboard/menu` | Y (redirect) | KEEP | `v1Visible: true, v1Section: 'MENU_INVENTORY', v1Order: 1` | Orders, QR | Remove property | LOW |
| Inventory | `/dashboard/inventory` | Y | KEEP | `v1Visible: true, v1Section: 'MENU_INVENTORY', v1Order: 2` | DIE, Alerts | Remove property | LOW |
| Inventory Alerts | `/dashboard/inventory-alerts` | Y | KEEP | `v1Visible: true, v1Section: 'MENU_INVENTORY', v1Order: 3` | Inventory | Remove property | LOW |
| OCR Documents | `/dashboard/die` | N | ADD | `v1Visible: true, v1Section: 'MENU_INVENTORY', v1Order: 4`, NEW nav item | Inventory | Remove nav item | LOW |

### QR & Digital Section

| Feature | Path | Current Nav | V1 Action | Method | Dependencies | Rollback | Risk |
|---------|------|-------------|-----------|--------|--------------|----------|------|
| QR Builder | `/dashboard/qr-builder` | Y | KEEP | `v1Visible: true, v1Section: 'QR_DIGITAL', v1Order: 1` | Tables, Menu | Remove property | LOW |
| QR Analytics | `/dashboard/qr-analytics` | Y | KEEP | `v1Visible: true, v1Section: 'QR_DIGITAL', v1Order: 2` | QR Builder | Remove property | LOW |

### Reports Section

| Feature | Path | Current Nav | V1 Action | Method | Dependencies | Rollback | Risk |
|---------|------|-------------|-----------|--------|--------------|----------|------|
| Reports | `/dashboard/reports` | Y | KEEP | `v1Visible: true, v1Section: 'REPORTS', v1Order: 1` | Sales, Orders | Remove property | LOW |
| Menu Performance | `/dashboard/analytics/menu-performance` | Y | KEEP | `v1Visible: true, v1Section: 'REPORTS', v1Order: 2` | Menu, Sales | Remove property | LOW |
| Peak Hours | `/dashboard/analytics/peak-hours` | Y | KEEP | `v1Visible: true, v1Section: 'REPORTS', v1Order: 3` | Orders | Remove property | LOW |
| Payment Analytics | `/dashboard/analytics/payments` | Y | KEEP | `v1Visible: true, v1Section: 'REPORTS', v1Order: 4` | Transactions | Remove property | LOW |

### Team Section

| Feature | Path | Current Nav | V1 Action | Method | Dependencies | Rollback | Risk |
|---------|------|-------------|-----------|--------|--------------|----------|------|
| Staff | `/dashboard/staff` | Y | KEEP | `v1Visible: true, v1Section: 'TEAM', v1Order: 1` | None | Remove property | LOW |

### Financial Section

| Feature | Path | Current Nav | V1 Action | Method | Dependencies | Rollback | Risk |
|---------|------|-------------|-----------|--------|--------------|----------|------|
| Transactions | `/dashboard/transactions` | Y | KEEP | `v1Visible: true, v1Section: 'FINANCIAL', v1Order: 1` | Orders, Payments | Remove property | LOW |
| Payout Summary | `/dashboard/payout-summary` | Y | KEEP | `v1Visible: true, v1Section: 'FINANCIAL', v1Order: 2` | Transactions | Remove property | LOW |
| Payment Settings | `/dashboard/payment-settings` | Y | KEEP | `v1Visible: true, v1Section: 'FINANCIAL', v1Order: 3` | None | Remove property | LOW |

### Settings Section

| Feature | Path | Current Nav | V1 Action | Method | Dependencies | Rollback | Risk |
|---------|------|-------------|-----------|--------|--------------|----------|------|
| Settings | `/dashboard/settings` | Y | KEEP | `v1Visible: true, v1Section: 'SETTINGS', v1Order: 1` | All | Remove property | LOW |
| Profile | `/dashboard/profile` | Y | KEEP + RENAME | `v1Visible: true, v1Section: 'SETTINGS', v1Order: 2`, rename to "Profile" | None | Remove property | LOW |
| Security | `/dashboard/security` | Y | KEEP | `v1Visible: true, v1Section: 'SETTINGS', v1Order: 3` | None | Remove property | LOW |

---

## TIER 2: ADMIN ONLY (Hide from Restaurant Users)

| Feature | Path | Current Nav | V1 Action | Method | Dependencies | Rollback | Risk |
|---------|------|-------------|-----------|--------|--------------|----------|------|
| Payment Monitor | `/dashboard/payments/monitor` | Y | ADMIN ONLY | `v1AdminOnly: true` | Transactions | Remove property | LOW |
| Payment Feedback | `/dashboard/feedback/payments` | Y | ADMIN ONLY | `v1AdminOnly: true` | None | Remove property | LOW |
| Instruction Insights | `/dashboard/analytics/instruction-insights` | Y | ADMIN ONLY | `v1AdminOnly: true` | Orders | Remove property | LOW |
| Support Inbox | `/dashboard/support/inbox` | Y | ADMIN ONLY | `v1AdminOnly: true` | None | Remove property | LOW |
| Canned Replies | `/dashboard/support/canned-replies` | Y | ADMIN ONLY | `v1AdminOnly: true` | Support Inbox | Remove property | LOW |
| Feature Flags | `/dashboard/admin/feature-flags` | Y | ADMIN ONLY | Already `adminOnly: true` | All flags | N/A | NONE |
| CEO Dashboard | `/dashboard/ceo` | N | ADMIN ONLY | `v1AdminOnly: true` | None | Remove property | LOW |
| CFO Dashboard | `/dashboard/cfo` | N | ADMIN ONLY | `v1AdminOnly: true` | None | Remove property | LOW |
| Pilot Observer | `/dashboard/pilot-observer` | N | ADMIN ONLY | `v1AdminOnly: true` | None | Remove property | LOW |
| DIE Operations | `/dashboard/die/operations` | N | ADMIN ONLY | `v1AdminOnly: true` | DIE | Remove property | LOW |
| DIE Analytics | `/dashboard/die/analytics` | N | ADMIN ONLY | `v1AdminOnly: true` | DIE | Remove property | LOW |
| DIE Anomalies | `/dashboard/die/anomalies` | N | ADMIN ONLY | `v1AdminOnly: true` | DIE | Remove property | LOW |
| DIE Reconciliation | `/dashboard/die/reconciliation` | N | ADMIN ONLY | `v1AdminOnly: true` | DIE | Remove property | LOW |
| DIE Control Plane | `/dashboard/die/control-plane` | N | ADMIN ONLY | `v1AdminOnly: true` | DIE | Remove property | LOW |
| DIE Plugins | `/dashboard/die/plugins` | N | ADMIN ONLY | `v1AdminOnly: true` | DIE | Remove property | LOW |

---

## TIER 3: FEATURE FLAG (Controlled by Database)

| Feature | Path | Current Nav | V1 Action | Flag | Method | Dependencies | Rollback | Risk |
|---------|------|-------------|-----------|------|--------|--------------|----------|------|
| Analytics | `/dashboard/analytics` | Y | FEATURE FLAG | `advanced_analytics` | `featureFlag: 'advanced_analytics'` | Reports | Remove property | LOW |
| Menu Builder | `/dashboard/menu-builder` | Y | FEATURE FLAG | `ai_menu_builder` | `featureFlag: 'ai_menu_builder'` | Menu | Remove property | LOW |
| Loyalty | `/dashboard/loyalty` | Y | FEATURE FLAG | `loyalty_system` | `featureFlag: 'loyalty_system'` | Customers | Remove property | LOW |
| Promotions | `/dashboard/promotions` | Y | FEATURE FLAG | `promotions_engine` | `featureFlag: 'promotions_engine'` | Menu | Remove property | LOW |
| Hotel | `/dashboard/hotel` | Y | FEATURE FLAG | `hotel_mode` | `featureFlag: 'hotel_mode'` | Tables | Remove property | LOW |
| Branches | `/dashboard/branches` | Y | FEATURE FLAG | `multi_branch` | `featureFlag: 'multi_branch'` | Settings | Remove property | LOW |
| Outlets | `/dashboard/outlets` | Y | FEATURE FLAG | `multi_branch` | `featureFlag: 'multi_branch'` | Branches | Remove property | LOW |
| CRM | `/dashboard/crm` | Y | FEATURE FLAG | `crm_v1` (NEW) | `featureFlag: 'crm_v1'` | Customers | Remove property | MEDIUM |
| Contacts | `/dashboard/contacts` | Y | FEATURE FLAG | `crm_v1` (NEW) | `featureFlag: 'crm_v1'` | CRM | Remove property | MEDIUM |
| CMS | `/dashboard/cms` | Y | FEATURE FLAG | `cms_v1` | `featureFlag: 'cms_v1'` | None | Remove property | LOW |
| Video Analytics | `/dashboard/video-analytics` | Y | FEATURE FLAG | `cms_v1` | `featureFlag: 'cms_v1'` | CMS | Remove property | LOW |
| AI Insights | `/dashboard/ai` | Y | FEATURE FLAG | `ai_insights_v1` (NEW) | `featureFlag: 'ai_insights_v1'` | Reports | Remove property | MEDIUM |
| Optimization Hub | `/dashboard/optimization` | Y | FEATURE FLAG | `ai_insights_v1` (NEW) | `featureFlag: 'ai_insights_v1'` | AI Insights | Remove property | MEDIUM |

---

## TIER 4: REMOVE FROM NAVIGATION (Route Preserved)

| Feature | Path | Current Nav | V1 Action | Method | Dependencies | Rollback | Risk |
|---------|------|-------------|-----------|--------|--------------|----------|------|
| Sales | `/dashboard/sales` | Y | REMOVE | No v1Visible property | Orders | Add `v1Visible: true` | LOW |
| KDS | `/dashboard/kds` | N | REMOVE | No nav entry | Kitchen | Add nav entry | LOW |
| Staff Performance | `/dashboard/staff-performance` | Y | REMOVE | No v1Visible property | Staff | Add `v1Visible: true` | LOW |
| A/B Testing | `/dashboard/ab-testing` | Y | REMOVE | No v1Visible property | Menu | Add `v1Visible: true` | LOW |
| Campaigns | `/dashboard/campaigns` | Y | REMOVE | No v1Visible property | None | Add `v1Visible: true` | LOW |
| Currency Settings | `/dashboard/currency-settings` | Y | REMOVE | No v1Visible property | Settings | Add `v1Visible: true` | LOW |
| My Referrals | `/dashboard/my-referrals` | Y | REMOVE | No v1Visible property | None | Add `v1Visible: true` | LOW |
| Referrals | `/dashboard/referrals` | Y | REMOVE | No v1Visible property | None | Add `v1Visible: true` | LOW |
| Invite & Earn | `/dashboard/invite` | Y | REMOVE | No v1Visible property | None | Add `v1Visible: true` | LOW |
| Smart Dining Slips | `/dashboard/smart-dining-slips` | Y | REMOVE | No v1Visible property | Orders | Add `v1Visible: true` | LOW |
| Site Builder | `/dashboard/site-builder` | Y | REMOVE | No v1Visible property | None | Add `v1Visible: true` | LOW |
| Templates | `/dashboard/templates` | Y | REMOVE | No v1Visible property | Site Builder | Add `v1Visible: true` | LOW |
| Customer Feedback | `/dashboard/customer-feedback` | N | REMOVE | No nav entry | CRM | Add nav entry | LOW |
| Notifications | `/dashboard/notifications` | Y | REMOVE | No v1Visible property | Settings | Add `v1Visible: true` | LOW |
| Auto Reorder | `/dashboard/auto-reorder` | N | REMOVE | No nav entry | Inventory | Add nav entry | LOW |
| Advanced Reporting | `/dashboard/advanced-reporting` | N | REMOVE | No nav entry | Reports | Add nav entry | LOW |
| Supplier Portal | `/dashboard/supplier-portal` | N | REMOVE | No nav entry | Inventory | Add nav entry | LOW |
| Tablet Ordering | `/dashboard/tablet-ordering` | N | REMOVE | No nav entry | Orders | Add nav entry | LOW |
| Recipe Management | `/dashboard/recipe-management` | N | REMOVE | No nav entry | Menu | Add nav entry | LOW |
| Stations | `/dashboard/stations` | N | REMOVE | No nav entry | Kitchen | Add nav entry | LOW |
| Marketer | `/dashboard/marketer` | N | REMOVE | No nav entry | Campaigns | Add nav entry | LOW |

---

## TIER 5: DEVELOPER ONLY

| Feature | Path | Current Nav | V1 Action | Method | Dependencies | Rollback | Risk |
|---------|------|-------------|-----------|--------|--------------|----------|------|
| Diagnostics | `/dashboard/diagnostics` | N | DEV ONLY | `v1DeveloperOnly: true` | None | Remove property | LOW |
| Test Minimal | `/dashboard/test-minimal` | N | DEV ONLY | `v1DeveloperOnly: true` | None | Remove property | LOW |
| CFO Components | `/dashboard/cfo-power-components` | N | DEV ONLY | `v1DeveloperOnly: true` | CFO | Remove property | LOW |

---

## Dependency Impact Analysis

### Critical Dependencies

| Feature | Depends On | Depended By | Impact if Hidden |
|---------|------------|-------------|------------------|
| Dashboard | None | All | CRITICAL - Cannot hide |
| Orders | Menu, Tables | Kitchen, Reports | CRITICAL - Cannot hide |
| Kitchen | Orders | None | CRITICAL - Cannot hide |
| Menu | None | Orders, QR | CRITICAL - Cannot hide |
| Inventory | None | DIE, Alerts | CRITICAL - Cannot hide |
| DIE | Inventory | None | HIGH - Core OCR flow |
| Reports | Orders, Sales | None | HIGH - Business insights |
| Settings | None | All | CRITICAL - Cannot hide |

### Safe to Hide

| Feature | Reason |
|---------|--------|
| Sales | Redundant with Orders |
| KDS | Duplicate of Kitchen |
| Staff Performance | Test failing, incomplete |
| A/B Testing | No dependencies |
| Campaigns | No dependencies |
| Referrals | No dependencies |
| Site Builder | No dependencies |

---

## API Impact Analysis

### APIs Unaffected by Navigation Changes

All APIs remain functional. Navigation changes do not affect:

- `/api/orders/*`
- `/api/menu/*`
- `/api/inventory/*`
- `/api/die/*`
- `/api/reports/*`
- `/api/staff/*`
- `/api/reservations/*`
- `/api/payments/*`

### No API Changes Required

Navigation visibility is purely a UI concern. No API modifications needed.

---

## Database Impact Analysis

### New Feature Flags Required

| Flag Key | Name | Default | Migration |
|----------|------|---------|-----------|
| `crm_v1` | Customer CRM | `false` | Add to INITIAL_FLAGS |
| `ai_insights_v1` | AI Insights | `false` | Add to INITIAL_FLAGS |
| `optimization_v1` | Optimization Hub | `false` | Add to INITIAL_FLAGS |

### Migration Script

```sql
-- No direct SQL needed
-- Flags are seeded via FeatureFlagService.seedFlags()
```

### Rollback Script

```sql
-- Delete new flags if needed
DELETE FROM "FeatureFlag" WHERE key IN ('crm_v1', 'ai_insights_v1', 'optimization_v1');
DELETE FROM "FeatureFlagBusinessOverride" WHERE "featureFlagId" IN (
  SELECT id FROM "FeatureFlag" WHERE key IN ('crm_v1', 'ai_insights_v1', 'optimization_v1')
);
```

---

## Risk Summary

| Risk Level | Count | Features |
|------------|-------|----------|
| LOW | 52 | Most navigation changes |
| MEDIUM | 4 | New feature flags (CRM, AI) |
| HIGH | 0 | None |
| CRITICAL | 0 | None |

---

## Execution Verification

After implementation, verify:

| Check | Expected | Method |
|-------|----------|--------|
| V1 nav items | 22 | Count in UI |
| Admin nav items | 32 | Admin login, count |
| Feature flag items | 0 (unless enabled) | Check with flags disabled |
| Routes accessible | 157 | Direct URL test |
| APIs functional | All | API test suite |
| Rollback time | < 5 min | Timed test |

---

**HARD STOP: This matrix is the execution specification. No code changes have been made.**
