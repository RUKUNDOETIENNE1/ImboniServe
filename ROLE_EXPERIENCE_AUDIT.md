# Role Experience Audit

**Date:** 2026-06-29
**Branch:** `release/v1.0.0-rc1`
**Author:** Restaurant Operations Consultant
**Status:** AUDIT COMPLETE

---

## Overview

This audit evaluates the user experience for each supported role in ImboniServe, identifying friction points and opportunities for improvement.

---

## Roles Evaluated

1. Restaurant Owner (OWNER)
2. Manager (MANAGER)
3. Cashier (CASHIER)
4. Waiter (WAITER)
5. Kitchen Staff (KITCHEN_MANAGER)
6. Administrator (ADMIN)
7. Affiliate (AFFILIATE)
8. Support (SUPPORT)

---

## Role 1: Restaurant Owner (OWNER)

### First Day Experience

| Task | Ease | Notes |
|------|------|-------|
| Sign up | Easy | Clear form, trial banner |
| Business setup | Easy | Wizard guides through |
| Navigate dashboard | Easy | 22 items, 7 sections |
| Create menu | Easy | Dynamic editor |
| Generate QR | Easy | Template selection |
| View reports | Easy | Daily/weekly/monthly |
| Invite staff | Medium | Multi-step wizard |
| Configure payments | Easy | Clear tax options |

### Daily Operations

| Task | Ease | Notes |
|------|------|-------|
| Check dashboard | Easy | Key metrics visible |
| View orders | Easy | Unified view |
| Monitor kitchen | Easy | Real-time updates |
| Check inventory | Easy | Stock status clear |
| Upload receipts | Easy | Drag-drop OCR |
| View transactions | Easy | Filtering works |

### Monthly Tasks

| Task | Ease | Notes |
|------|------|-------|
| Review reports | Easy | Multiple periods |
| Check payouts | Easy | Clear breakdown |
| Manage staff | Easy | Role assignment |
| Update menu | Easy | Inline editing |

### Pain Points

1. PDF export shows "coming soon"
2. Some settings use native alerts
3. Staff performance page has issues

### Overall Score: 8.5/10

---

## Role 2: Manager (MANAGER)

### Capabilities

| Feature | Access | Status |
|---------|--------|--------|
| Dashboard | Full | PASS |
| Orders | Full | PASS |
| Kitchen | Full | PASS |
| Inventory | Full | PASS |
| Reports | Full | PASS |
| Staff | View only | PASS |
| Settings | Limited | PASS |

### Experience Notes

- Same navigation as Owner
- Cannot modify business settings
- Can manage day-to-day operations
- Clear role boundaries

### Pain Points

1. Cannot distinguish from Owner in UI
2. No manager-specific dashboard

### Overall Score: 8/10

---

## Role 3: Cashier (CASHIER)

### Capabilities

| Feature | Access | Status |
|---------|--------|--------|
| Dashboard | View | PASS |
| Orders | Create/View | PASS |
| Kitchen | View | PASS |
| Tables | View | PASS |
| Transactions | View | PASS |
| Inventory | No | PASS |
| Reports | No | PASS |

### Experience Notes

- Focused on order processing
- Quick access to POS functions
- Transaction history visible
- Cannot access sensitive data

### Pain Points

1. Full navigation visible (could be simplified)
2. No quick-action shortcuts

### Overall Score: 7.5/10

---

## Role 4: Waiter (WAITER)

### Capabilities

| Feature | Access | Status |
|---------|--------|--------|
| Dashboard | View | PASS |
| Orders | Create/View | PASS |
| Kitchen | View | PASS |
| Tables | View/Update | PASS |
| Reservations | View | PASS |

### Experience Notes

- Table-focused workflow
- Can see order status
- Can update table status
- Limited to front-of-house

### Pain Points

1. No dedicated waiter view
2. Full navigation may be overwhelming

### Overall Score: 7/10

---

## Role 5: Kitchen Staff (KITCHEN_MANAGER)

### Capabilities

| Feature | Access | Status |
|---------|--------|--------|
| Dashboard | View | PASS |
| Kitchen | Full | PASS |
| Orders | View | PASS |
| Inventory | View | PASS |

### Experience Notes

- Kitchen page is primary workspace
- Real-time order updates
- Clear status indicators
- Timer shows urgency

### Kitchen Page Quality

| Feature | Quality |
|---------|---------|
| Order cards | Excellent |
| Status columns | Clear |
| Timer display | Good |
| Action buttons | Clear |
| Notification buttons | Good |

### Pain Points

1. No dedicated KDS mode
2. Full navigation visible

### Overall Score: 8/10

---

## Role 6: Administrator (ADMIN)

### Capabilities

| Feature | Access | Status |
|---------|--------|--------|
| All dashboard features | Full | PASS |
| Admin section | Full | PASS |
| Feature flags | Full | PASS |
| Payment monitor | Full | PASS |
| Support inbox | Full | PASS |

### Admin-Only Features

| Feature | Access | Status |
|---------|--------|--------|
| Payment Monitor | Visible | PASS |
| Payment Feedback | Visible | PASS |
| Support Inbox | Visible | PASS |
| Canned Replies | Visible | PASS |
| Feature Flags | Visible | PASS |
| Instruction Insights | Visible | PASS |

### Experience Notes

- Clear admin section separation
- 28 total navigation items
- Full platform access
- Can manage feature flags

### Pain Points

1. No admin-specific dashboard
2. Mixed with restaurant navigation

### Overall Score: 8/10

---

## Role 7: Affiliate (AFFILIATE)

### Capabilities

| Feature | Access | Status |
|---------|--------|--------|
| Affiliate dashboard | Full | PASS |
| Referral tracking | Full | PASS |
| Earnings | View | PASS |
| Payouts | View | PASS |

### Experience Notes

- Separate layout from restaurant
- Focused on referral metrics
- Clear earnings display
- Payout history visible

### Pain Points

1. Limited documentation
2. No marketing materials

### Overall Score: 7.5/10

---

## Role 8: Support (SUPPORT)

### Capabilities

| Feature | Access | Status |
|---------|--------|--------|
| Support inbox | Full | PASS |
| Canned replies | Full | PASS |
| User lookup | Limited | PASS |

### Experience Notes

- Access to support tools
- Can manage tickets
- Canned replies available

### Pain Points

1. Limited visibility into user accounts
2. No escalation workflow

### Overall Score: 7/10

---

## Cross-Role Analysis

### Navigation Visibility

| Role | Items Visible | Appropriate |
|------|---------------|-------------|
| OWNER | 22 | Yes |
| MANAGER | 22 | Yes |
| CASHIER | 22 | Could reduce |
| WAITER | 22 | Could reduce |
| KITCHEN | 22 | Could reduce |
| ADMIN | 28 | Yes |

### Recommendations

1. **Cashier/Waiter/Kitchen**: Consider role-specific simplified navigation
2. **Manager**: Add manager-specific metrics
3. **Admin**: Add admin dashboard with platform metrics
4. **All roles**: Add role indicator in header

---

## Permission Boundaries

### Verified Restrictions

| Action | OWNER | MANAGER | CASHIER | WAITER | KITCHEN |
|--------|-------|---------|---------|--------|---------|
| Create orders | Yes | Yes | Yes | Yes | No |
| View reports | Yes | Yes | No | No | No |
| Manage staff | Yes | No | No | No | No |
| Change settings | Yes | No | No | No | No |
| View inventory | Yes | Yes | No | No | Yes |
| Manage menu | Yes | Yes | No | No | No |

**Status: All permission boundaries verified**

---

## Summary by Role

| Role | Score | Primary Issue |
|------|-------|---------------|
| Owner | 8.5/10 | PDF export pending |
| Manager | 8/10 | No manager dashboard |
| Cashier | 7.5/10 | Navigation too broad |
| Waiter | 7/10 | No dedicated view |
| Kitchen | 8/10 | No KDS mode |
| Admin | 8/10 | No admin dashboard |
| Affiliate | 7.5/10 | Limited docs |
| Support | 7/10 | Limited visibility |

**Average Score: 7.7/10**

---

## Conclusion

All roles have appropriate access to features. The primary opportunities for improvement are:

1. Role-specific navigation simplification
2. Role-specific dashboards
3. Better role indicators in UI

**Role Experience Audit: PASSED**
