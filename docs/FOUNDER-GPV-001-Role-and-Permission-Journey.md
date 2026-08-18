# FOUNDER-GPV-001 — Role and Permission Journey

| Field | Value |
|---|---|
| Document ID | FOUNDER-GPV-001-ROLE-PERMISSION |
| Date | 2026-08-14 |
| Source | `src/lib/permissions/staff.ts`, `src/components/DashboardLayout.tsx`, page-level `getServerSideProps` guards |

## Overview

This document maps every role in ImboniServe, their permissions, what they can see, create, modify, and where their workflow begins and ends.

## System Roles

Derived from `src/lib/permissions/staff.ts` — `SystemRoleKeys`:

| Key | Name | Base Role | Description |
|---|---|---|---|
| `owner` | Owner | OWNER | Full control of the business account |
| `manager` | Manager | MANAGER | Manage daily operations with limited settings |
| `cashier_front_desk` | Cashier / Front Desk | CASHIER | Process payments and handle front desk operations |
| `waiter_staff` | Waiter / Staff | WAITER | Serve customers and manage assigned tables |
| `kitchen_operations` | Kitchen / Operations | KITCHEN_MANAGER | Manage kitchen operations and order statuses |

Additional roles observed in route guards: `ADMIN`, `SUPERVISOR`, `CHEF`, `KITCHEN_STAFF`, `FRONT_DESK`.

## Permission Matrix

| Permission | Owner | Manager | Cashier | Waiter | Kitchen |
|---|---|---|---|---|---|
| dashboard.view | ✅ | ✅ | ✅ | ✅ | ✅ |
| orders.read | ✅ | ✅ | ✅ | ✅ | ✅ |
| orders.create | ✅ | ✅ | ❌ | ✅ | ❌ |
| orders.update | ✅ | ✅ | ❌ | ✅ | ✅ |
| orders.refund | ✅ | ❌ | ❌ | ❌ | ❌ |
| tables.read | ✅ | ✅ | ✅ | ✅ | ✅ |
| tables.create | ✅ | ✅ | ❌ | ❌ | ❌ |
| tables.update | ✅ | ✅ | ❌ | ✅ | ❌ |
| tables.manageReservations | ✅ | ✅ | ❌ | ❌ | ❌ |
| payments.read | ✅ | ✅ | ✅ | ❌ | ❌ |
| payments.create | ✅ | ✅ | ✅ | ❌ | ❌ |
| payments.refund | ✅ | ❌ | ❌ | ❌ | ❌ |
| reports.view | ✅ | ✅ | ❌ | ❌ | ❌ |
| staff.view | ✅ | ✅ | ❌ | ❌ | ❌ |
| staff.manage | ✅ | ✅ | ❌ | ❌ | ❌ |
| inventory.read | ✅ | ✅ | ❌ | ❌ | ✅ |
| inventory.update | ✅ | ✅ | ❌ | ❌ | ✅ |
| inventory.manage | ✅ | ❌ | ❌ | ❌ | ❌ |
| settings.read | ✅ | ✅ | ❌ | ❌ | ❌ |
| settings.manage | ✅ | ❌ | ❌ | ❌ | ❌ |

## Route Access by Role

Derived from `getServerSideProps` guards in each dashboard page:

| Route | Allowed Roles |
|---|---|
| `/dashboard` | All authenticated users with businessId |
| `/dashboard/kitchen` | OWNER, KITCHEN_MANAGER, CASHIER, SUPERVISOR, FRONT_DESK, ADMIN, MANAGER |
| `/dashboard/tables` | OWNER, ADMIN, MANAGER, WAITER, SUPERVISOR, FRONT_DESK |
| `/dashboard/reservations` | OWNER, ADMIN, MANAGER, FRONT_DESK, SUPERVISOR |
| `/dashboard/waiter` | OWNER, WAITER, SUPERVISOR, FRONT_DESK, ADMIN, MANAGER |
| `/dashboard/operations/service-replay` | OWNER, MANAGER, ADMIN, SUPERVISOR |
| `/dashboard/operations/service-risks` | OWNER, MANAGER, ADMIN, SUPERVISOR, CHEF, KITCHEN_STAFF |
| `/dashboard/invite` | OWNER, ADMIN, MANAGER |
| `/dashboard/referrals` | OWNER, ADMIN, MANAGER |
| `/dashboard/promotions` | OWNER, ADMIN, MANAGER |
| `/dashboard/auto-reorder` | OWNER, ADMIN, MANAGER |
| Admin-only routes | ADMIN only (Payment Monitor, Payment Feedback, Support Inbox, Feature Flags) |

## Role Journey: Where Each Role Begins and Ends

### Owner
- **Begins**: `/signup` → creates business → becomes owner automatically
- **Primary workspace**: `/dashboard` — full access to all sections
- **Can see**: Everything — all operational, financial, settings, staff, reports
- **Can create**: Menu items, tables, QR codes, staff, reservations, inventory, promotions
- **Can modify**: Business settings, tax config, payment settings, staff roles, all operational data
- **Cannot access**: Admin-only routes (platform-level administration)
- **Ends**: `/dashboard/ceo` — executive review of business performance
- **Unique capabilities**: Refunds, settings management, inventory management, staff management

### Manager
- **Begins**: Invited by Owner → receives credentials → `/login`
- **Primary workspace**: `/dashboard` — operational management
- **Can see**: Dashboard, orders, kitchen, tables, reservations, menu, inventory, reports, staff
- **Can create**: Menu items, tables, QR codes, staff (waiters, kitchen), reservations, inventory items
- **Can modify**: Orders, table status, kitchen status, inventory stock, staff assignments
- **Cannot access**: Settings management, refunds, inventory.manage, payment settings (read only)
- **Ends**: `/dashboard/close-day` — operational day close
- **Unique capabilities**: Staff management, reservation management, auto-reorder

### Cashier / Front Desk
- **Begins**: Invited by Owner/Manager → `/login`
- **Primary workspace**: `/dashboard/kitchen` (payment confirmation) or `/dashboard/tables`
- **Can see**: Dashboard, orders (read), tables, reservations, kitchen
- **Can create**: Payments, room check-in/check-out
- **Can modify**: Payment processing, table status
- **Cannot access**: Reports, staff management, inventory, settings, menu creation, refunds
- **Ends**: Payment processing complete — hands off to manager/owner for close-day
- **Unique capabilities**: Payment processing, manual payment confirmation (kitchen page)

### Waiter
- **Begins**: Invited by Owner/Manager → `/login`
- **Primary workspace**: `/dashboard/waiter` — order queue and table service
- **Can see**: Dashboard, orders, tables (read + update), waiter queue
- **Can create**: Orders
- **Can modify**: Order status, table status
- **Cannot access**: Payments, reports, staff, inventory, settings, kitchen display, reservations
- **Ends**: Order delivered — hands off to kitchen/cashier for payment
- **Unique capabilities**: Table service workflow, order creation, guest intelligence

### Kitchen
- **Begins**: Invited by Owner/Manager → `/login`
- **Primary workspace**: `/dashboard/kitchen` — 6-column KDS
- **Can see**: Dashboard, orders (read + update), tables (read), kitchen display
- **Can create**: Nothing (orders come from guests/waiters)
- **Can modify**: Kitchen order status (pending → accepted → preparing → almost_ready → ready → served), inventory (read + update)
- **Cannot access**: Payments, reports, staff, settings, reservations, waiter workflow
- **Ends**: Order served — hands off to waiter/cashier
- **Unique capabilities**: Kitchen status transitions, customer messages (please wait, item unavailable, almost ready, ready), manual payment confirmation

### Guest (Not a Staff Role)
- **Begins**: Scans QR code → `/order?branchId=...&tableId=...&signature=...`
- **Primary workspace**: `/order` — menu browsing and ordering
- **Can see**: Public menu, cart, order confirmation, checkout
- **Can create**: Draft orders, table session participation
- **Can modify**: Cart contents, participant name
- **Cannot access**: Any dashboard route, any API requiring authentication
- **Ends**: Payment complete → receipt (or Tap & Leave checkout complete)
- **Authentication**: None required for in-venue; OTP phone verification for remote (preorder/pickup)

### Admin (Platform-Level)
- **Begins**: `/login` → redirected to `/admin`
- **Primary workspace**: `/admin` — platform administration
- **Can see**: All businesses, payment monitor, support inbox, feature flags
- **Unique capabilities**: Platform-level administration, feature flag management, support management
- **Note**: Admin is a platform operator role, not a business role

## Role Creation Flow

```
OWNER
  │
  ├── Creates MANAGER → /dashboard/staff → assign 'manager' role
  ├── Creates CASHIER → /dashboard/staff → assign 'cashier_front_desk' role
  ├── Creates WAITER → /dashboard/staff → assign 'waiter_staff' role
  └── Creates KITCHEN → /dashboard/staff → assign 'kitchen_operations' role
```

Custom roles can also be created via `StaffRole` model with custom `PermissionMatrix`.

## Business Isolation

All roles are scoped to a single `businessId`. A user belonging to Business A cannot:
- View Business B's orders, sales, menu, tables, or staff
- Access Business B's dashboard routes (enforced by `resolveBusinessContext` in API middleware)
- Scan Business B's QR codes (HMAC signature includes branchId)

Cross-business access requires the user to be explicitly added to multiple businesses.
