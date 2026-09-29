# Release Validation Checklist

**Date:** 2026-06-29
**Author:** Production Deployment Reviewer
**Status:** VALIDATION SPECIFICATION (NOT EXECUTED)

---

## Purpose

This checklist defines the complete validation procedure after implementing V1 navigation changes. Every item must pass before the release is considered complete.

---

## Pre-Implementation Validation

### Code Review

- [ ] All changes are in a feature branch
- [ ] No files deleted
- [ ] No routes removed
- [ ] No APIs disabled
- [ ] TypeScript compiles without errors
- [ ] ESLint passes without errors
- [ ] No console.log statements added
- [ ] No hardcoded values
- [ ] i18n keys added for new labels

### Backup Verification

- [ ] Current `DashboardLayout.tsx` backed up
- [ ] Git commit hash recorded: `______________`
- [ ] Rollback script tested locally

---

## Post-Implementation Validation

### Build Verification

- [ ] `npm run build` completes successfully
- [ ] No TypeScript errors
- [ ] No build warnings related to navigation
- [ ] Bundle size within acceptable range

### Unit Test Verification

- [ ] All existing tests pass
- [ ] No test regressions
- [ ] Navigation filter function tested
- [ ] Section grouping function tested

---

## Role-Based Validation

### Restaurant Owner (OWNER role)

**Navigation Visibility**

| Section | Expected Items | Verified |
|---------|----------------|----------|
| Operations | Dashboard, Orders, Kitchen, Tables, Reservations | [ ] |
| Menu & Inventory | Menu, Inventory, Inventory Alerts, OCR Documents | [ ] |
| QR & Digital | QR Builder, QR Analytics | [ ] |
| Reports | Reports, Menu Performance, Peak Hours, Payment Analytics | [ ] |
| Team | Staff | [ ] |
| Financial | Transactions, Payout Summary, Payment Settings | [ ] |
| Settings | Settings, Profile, Security | [ ] |

**Total:** 22 items

**Hidden Items (should NOT appear)**

- [ ] Sales (hidden)
- [ ] Staff Performance (hidden)
- [ ] A/B Testing (hidden)
- [ ] Campaigns (hidden)
- [ ] CEO Dashboard (hidden)
- [ ] CFO Dashboard (hidden)
- [ ] Feature Flags (hidden)
- [ ] Support Inbox (hidden)
- [ ] AI Insights (hidden unless flagged)
- [ ] Loyalty (hidden unless flagged)
- [ ] Promotions (hidden unless flagged)

### Manager (MANAGER role)

**Navigation Visibility**

- [ ] Same 22 items as Owner
- [ ] No additional items visible

### Waiter (WAITER role)

**Navigation Visibility**

- [ ] Same 22 items as Owner
- [ ] No additional items visible

### Kitchen Staff (KITCHEN role)

**Navigation Visibility**

- [ ] Same 22 items as Owner
- [ ] Kitchen page accessible and functional

### Administrator (ADMIN role)

**Navigation Visibility**

| Section | Expected Items | Verified |
|---------|----------------|----------|
| Operations | Dashboard, Orders, Kitchen, Tables, Reservations | [ ] |
| Menu & Inventory | Menu, Inventory, Inventory Alerts, OCR Documents | [ ] |
| QR & Digital | QR Builder, QR Analytics | [ ] |
| Reports | Reports, Menu Performance, Peak Hours, Payment Analytics | [ ] |
| Team | Staff | [ ] |
| Financial | Transactions, Payout Summary, Payment Settings | [ ] |
| Settings | Settings, Profile, Security | [ ] |
| Admin | Payment Monitor, Payment Feedback, Support Inbox, Canned Replies, Feature Flags, Instruction Insights | [ ] |

**Total:** 22 + 6 = 28 items (plus any enabled feature flags)

### Developer (Development Mode)

**Navigation Visibility**

- [ ] All V1 visible items
- [ ] All admin items
- [ ] Developer-only items (Diagnostics, Test Minimal, CFO Components)

---

## Feature Flag Validation

### Flag Disabled State

For each feature flag, verify item is hidden when flag is disabled:

| Flag | Feature | Hidden When Disabled |
|------|---------|---------------------|
| `advanced_analytics` | Analytics | [ ] |
| `ai_menu_builder` | Menu Builder | [ ] |
| `loyalty_system` | Loyalty | [ ] |
| `promotions_engine` | Promotions | [ ] |
| `hotel_mode` | Hotel | [ ] |
| `multi_branch` | Branches, Outlets | [ ] |
| `crm_v1` | CRM, Contacts | [ ] |
| `cms_v1` | CMS, Video Analytics | [ ] |
| `ai_insights_v1` | AI Insights, Optimization Hub | [ ] |

### Flag Enabled State

For each feature flag, verify item appears when flag is enabled:

| Flag | Feature | Visible When Enabled |
|------|---------|---------------------|
| `advanced_analytics` | Analytics | [ ] |
| `ai_menu_builder` | Menu Builder | [ ] |
| `loyalty_system` | Loyalty | [ ] |
| `promotions_engine` | Promotions | [ ] |
| `hotel_mode` | Hotel | [ ] |
| `multi_branch` | Branches, Outlets | [ ] |
| `crm_v1` | CRM, Contacts | [ ] |
| `cms_v1` | CMS, Video Analytics | [ ] |
| `ai_insights_v1` | AI Insights, Optimization Hub | [ ] |

---

## Deep Link Validation

All routes must remain accessible via direct URL:

### Core Routes

| Route | Accessible | Page Loads |
|-------|------------|------------|
| `/dashboard` | [ ] | [ ] |
| `/dashboard/orders/unified` | [ ] | [ ] |
| `/dashboard/kitchen` | [ ] | [ ] |
| `/dashboard/tables` | [ ] | [ ] |
| `/dashboard/reservations` | [ ] | [ ] |
| `/dashboard/menu` | [ ] | [ ] |
| `/dashboard/inventory` | [ ] | [ ] |
| `/dashboard/inventory-alerts` | [ ] | [ ] |
| `/dashboard/die` | [ ] | [ ] |
| `/dashboard/qr-builder` | [ ] | [ ] |
| `/dashboard/qr-analytics` | [ ] | [ ] |
| `/dashboard/reports` | [ ] | [ ] |
| `/dashboard/analytics/menu-performance` | [ ] | [ ] |
| `/dashboard/analytics/peak-hours` | [ ] | [ ] |
| `/dashboard/analytics/payments` | [ ] | [ ] |
| `/dashboard/staff` | [ ] | [ ] |
| `/dashboard/transactions` | [ ] | [ ] |
| `/dashboard/payout-summary` | [ ] | [ ] |
| `/dashboard/payment-settings` | [ ] | [ ] |
| `/dashboard/settings` | [ ] | [ ] |
| `/dashboard/profile` | [ ] | [ ] |
| `/dashboard/security` | [ ] | [ ] |

### Hidden Routes (Still Accessible)

| Route | Accessible | Page Loads |
|-------|------------|------------|
| `/dashboard/sales` | [ ] | [ ] |
| `/dashboard/staff-performance` | [ ] | [ ] |
| `/dashboard/ab-testing` | [ ] | [ ] |
| `/dashboard/campaigns` | [ ] | [ ] |
| `/dashboard/currency-settings` | [ ] | [ ] |
| `/dashboard/my-referrals` | [ ] | [ ] |
| `/dashboard/referrals` | [ ] | [ ] |
| `/dashboard/invite` | [ ] | [ ] |
| `/dashboard/smart-dining-slips` | [ ] | [ ] |
| `/dashboard/site-builder` | [ ] | [ ] |
| `/dashboard/templates` | [ ] | [ ] |
| `/dashboard/notifications` | [ ] | [ ] |
| `/dashboard/ceo` | [ ] | [ ] |
| `/dashboard/cfo` | [ ] | [ ] |
| `/dashboard/diagnostics` | [ ] | [ ] |

---

## Mobile Navigation Validation

### Mobile Menu (< 768px)

- [ ] Hamburger menu visible
- [ ] Menu opens on tap
- [ ] All 22 V1 items visible
- [ ] Section headers visible
- [ ] Menu closes after selection
- [ ] Active item highlighted

### Tablet (768px - 1024px)

- [ ] Sidebar collapsed by default
- [ ] Icons visible
- [ ] Tooltips on hover
- [ ] Expand button functional

### Desktop (> 1024px)

- [ ] Sidebar expanded by default
- [ ] Section headers visible
- [ ] All 22 V1 items visible
- [ ] Collapse button functional

---

## Demo Flow Validation

The official V1 demo flow must work without interruption:

### Step 1: Restaurant Signup

- [ ] `/signup` accessible
- [ ] Registration completes
- [ ] Redirects to setup

### Step 2: Business Setup

- [ ] `/setup` accessible
- [ ] Wizard completes
- [ ] Redirects to dashboard

### Step 3: Generate QR

- [ ] QR Builder in navigation
- [ ] QR generation works
- [ ] QR code displays

### Step 4: Create Menu

- [ ] Menu in navigation
- [ ] Menu editor loads
- [ ] Items can be added

### Step 5: Simulate Order

- [ ] QR scan works
- [ ] Order page loads
- [ ] Order can be placed

### Step 6: Kitchen Execution

- [ ] Kitchen in navigation
- [ ] Order appears in queue
- [ ] Order can be completed

### Step 7: Inventory Check

- [ ] Inventory in navigation
- [ ] Stock levels visible
- [ ] Consumption recorded

### Step 8: Upload Supplier Receipt

- [ ] OCR Documents in navigation
- [ ] Upload works
- [ ] Document processes

### Step 9: OCR Extraction

- [ ] Extraction completes
- [ ] Items extracted correctly
- [ ] Review page accessible

### Step 10: Approve Inventory

- [ ] Approval works
- [ ] Inventory updated
- [ ] Ledger entry created

### Step 11: Reports

- [ ] Reports in navigation
- [ ] Daily report loads
- [ ] Data accurate

### Step 12: Financial Truth

- [ ] Payment Analytics in navigation
- [ ] Revenue accurate
- [ ] COGS accurate (from consumption)

---

## Performance Validation

### Navigation Render Time

- [ ] Initial render < 100ms
- [ ] Filter function < 10ms
- [ ] No layout shift

### Memory Usage

- [ ] No memory leaks
- [ ] Navigation array not duplicated
- [ ] Filter results cached appropriately

---

## Accessibility Validation

### Keyboard Navigation

- [ ] Tab through navigation items
- [ ] Enter activates item
- [ ] Focus visible
- [ ] Skip link works

### Screen Reader

- [ ] Section headers announced
- [ ] Item names announced
- [ ] Active state announced

### Color Contrast

- [ ] Section headers readable
- [ ] Active item distinguishable
- [ ] Hover state visible

---

## Error Handling Validation

### Network Errors

- [ ] Navigation loads without feature flag API
- [ ] Graceful degradation if API fails
- [ ] No console errors

### Invalid Routes

- [ ] 404 page displays for truly invalid routes
- [ ] Hidden routes do NOT show 404

### Session Expiry

- [ ] Navigation handles session expiry
- [ ] Redirects to login appropriately

---

## Rollback Validation

### Rollback Test

1. [ ] Deploy V1 navigation
2. [ ] Verify changes
3. [ ] Execute rollback
4. [ ] Verify original navigation restored
5. [ ] Time rollback: `____` minutes

### Rollback Acceptance Criteria

- [ ] Rollback completes in < 5 minutes
- [ ] No data loss
- [ ] No user impact beyond brief downtime
- [ ] All routes functional after rollback

---

## Support Readiness

### Documentation Updated

- [ ] User guide updated
- [ ] FAQ updated
- [ ] Support scripts updated

### Support Team Notified

- [ ] Support team briefed on changes
- [ ] Common questions documented
- [ ] Escalation path defined

---

## Sign-Off

### Pre-Release

| Role | Name | Date | Signature |
|------|------|------|-----------|
| QA Lead | | | |
| Engineering Lead | | | |
| Product Manager | | | |

### Post-Release

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Release Engineer | | | |
| Support Lead | | | |
| Product Owner | | | |

---

## Monitoring (First 24 Hours)

### Metrics to Watch

- [ ] Error rate (should not increase)
- [ ] Support ticket volume (< 5 navigation-related)
- [ ] Page load times (should not increase)
- [ ] User session duration (should not decrease)

### Rollback Triggers

If any of the following occur, initiate rollback:

- [ ] > 10 support tickets about navigation
- [ ] Critical bug discovered
- [ ] Admin loses access to features
- [ ] Demo flow broken

---

**HARD STOP: This checklist is for validation after implementation. No code changes have been made.**
