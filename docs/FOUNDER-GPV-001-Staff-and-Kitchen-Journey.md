# FOUNDER-GPV-001 — Staff and Kitchen Journey

| Field | Value |
|---|---|
| Document ID | FOUNDER-GPV-001-STAFF-KITCHEN-JOURNEY |
| Date | 2026-08-14 |
| Roles | Waiter, Kitchen Staff, Cashier/Front Desk |
| Source | `src/pages/dashboard/kitchen.tsx`, `src/pages/dashboard/waiter.tsx`, `src/lib/permissions/staff.ts` |

## Overview

This document maps the journey for operational staff roles: Waiter, Kitchen Staff, and Cashier/Front Desk. Each role has a focused workspace and limited permissions.

## Kitchen Staff Journey

### Entry
- **Login**: `/login` → credentials → OTP → MFA confirm → redirect to `/dashboard`
- **Primary workspace**: `/dashboard/kitchen` — 6-column Kitchen Display System (KDS)
- **Allowed roles**: OWNER, KITCHEN_MANAGER, CASHIER, SUPERVISOR, FRONT_DESK, ADMIN, MANAGER

### Kitchen Display Columns

| Column | Status | Action Available |
|---|---|---|
| Pending | `pending` | Accept → moves to Accepted |
| Accepted | `accepted` | Start Prep → moves to Preparing |
| Preparing | `preparing` | Almost Ready → moves to Almost Ready |
| Almost Ready | `almost_ready` | Mark Ready → moves to Ready |
| Ready | `ready` | Serve → moves to Served |
| Served | `served` | (terminal — no action) |

### Kitchen Journey Steps

| Step | Action | API | Expected Result |
|---|---|---|---|
| K-01 | Login | `/login` → MFA | Session created, redirected to `/dashboard` |
| K-02 | Open kitchen display | `/dashboard/kitchen` | KDS loads with 6 columns, real-time connection indicator |
| K-03 | View incoming order | KDS — Pending column | New order appears with order number, table number, items, elapsed time |
| K-04 | Accept order | POST `/api/kitchen/update-status` → `accepted` | Order moves to Accepted column |
| K-05 | Start preparation | POST `/api/kitchen/update-status` → `preparing` | Order moves to Preparing; inventory consumption triggered if engine enabled |
| K-06 | Mark almost ready | POST `/api/kitchen/update-status` → `almost_ready` | Order moves to Almost Ready |
| K-07 | Mark ready | POST `/api/kitchen/update-status` → `ready` | Order moves to Ready; Promise Engine marks promise as FULFILLED |
| K-08 | Mark served | POST `/api/kitchen/update-status` → `served` | Order moves to Served (terminal) |
| K-09 | Send customer message | POST `/api/kitchen/messages` | Message sent: "Please wait", "Item unavailable", "Almost ready", or "Ready" |
| K-10 | Manual payment confirmation | Kitchen page — ManualPaymentConfirmation component | For cash/MoMo orders: confirm payment received |

### Kitchen Real-Time

- **Pusher channel**: `private-kitchen-${businessId}` — events: `order.created`, `order.updated`, `order.ready`
- **Polling fallback**: Every 5 seconds (if Pusher not connected) or 15 seconds (if connected)
- **New order sound**: Audio beep on new order arrival
- **Urgent indicator**: Orders older than 10 minutes show red border + "URGENT" label

### Kitchen Staff Boundaries

| Capability | Kitchen Staff |
|---|---|
| View kitchen display | ✅ |
| Update order status | ✅ |
| Send customer messages | ✅ |
| Manual payment confirmation | ✅ |
| View orders | ✅ (read) |
| Create orders | ❌ |
| View payments | ❌ |
| View reports | ❌ |
| Manage staff | ❌ |
| Manage settings | ❌ |
| Update inventory | ✅ (inventory.update) |

## Waiter Journey

### Entry
- **Login**: `/login` → credentials → OTP → MFA confirm → redirect to `/dashboard`
- **Primary workspace**: `/dashboard/waiter` — Waiter Operational Dashboard
- **Allowed roles**: OWNER, WAITER, SUPERVISOR, FRONT_DESK, ADMIN, MANAGER

### Waiter Workflow Stages

| Stage | Description |
|---|---|
| Waiting for Preparation | Order sent to kitchen, waiting for kitchen to prepare |
| Preparing | Kitchen is actively preparing the order |
| Ready for Pickup | Kitchen marked order as ready, waiter needs to pick up |
| Picked Up | Waiter has picked up the order from kitchen |
| Delivered | Waiter has delivered the order to the table |

### Waiter Journey Steps

| Step | Action | API | Expected Result |
|---|---|---|---|
| W-01 | Login | `/login` → MFA | Session created, redirected to `/dashboard` |
| W-02 | Open waiter dashboard | `/dashboard/waiter` | Order queue displayed with station progress |
| W-03 | View assigned tables | Waiter dashboard | Tables assigned to this waiter visible |
| W-04 | View order queue | Waiter dashboard | Orders grouped by status (waiting, preparing, ready, picked up, delivered) |
| W-05 | View station progress | Waiter dashboard | Per-station readiness progress for multi-station orders |
| W-06 | Pick up ready order | Waiter dashboard action | Order status → picked_up |
| W-07 | Deliver order | Waiter dashboard action | Order status → delivered |
| W-08 | View guest intelligence | StaffGuestIntelligence component | Customer information, preferences, visit history |

### Waiter Real-Time

- **Pusher channels**: `private-kitchen-${businessId}` for order updates
- **Heart Pulse integration**: Live updates via Heart Pulse system

### Waiter Boundaries

| Capability | Waiter |
|---|---|
| View dashboard | ✅ |
| View/create orders | ✅ |
| Update orders | ✅ |
| Update tables | ✅ |
| View payments | ❌ |
| View reports | ❌ |
| Manage staff | ❌ |
| View inventory | ❌ |
| Manage settings | ❌ |
| Access kitchen display | ❌ (only waiter workflow) |
| Manage reservations | ❌ |

## Cashier / Front Desk Journey

### Entry
- **Login**: `/login` → credentials → OTP → MFA confirm → redirect to `/dashboard`
- **Primary workspaces**: `/dashboard/kitchen` (payment confirmation), `/dashboard/tables`, `/dashboard/reservations`
- **Allowed roles**: OWNER, ADMIN, MANAGER, FRONT_DESK, SUPERVISOR

### Cashier Journey Steps

| Step | Action | Route/API | Expected Result |
|---|---|---|---|
| C-01 | Login | `/login` → MFA | Session created |
| C-02 | View orders | `/dashboard/orders/unified` | Orders visible (read only — cannot create) |
| C-03 | Process payment | Kitchen page — ManualPaymentConfirmation | Cash/MoMo payment confirmed |
| C-04 | View tables | `/dashboard/tables` | Table status visible |
| C-05 | Manage reservations | `/dashboard/reservations` | Create, confirm, complete reservations |
| C-06 | Room check-in/check-out | Hotel features (if enabled) | Room management available |

### Cashier Boundaries

| Capability | Cashier |
|---|---|
| View dashboard | ✅ |
| View orders | ✅ (read only) |
| Create orders | ❌ |
| Process payments | ✅ |
| Process refunds | ❌ |
| View tables | ✅ |
| View reports | ❌ |
| Manage staff | ❌ |
| View inventory | ❌ |
| Manage settings | ❌ |

## Verification Points

The founder should verify for each staff role:
1. **Login works**: Each role can login with MFA
2. **Correct dashboard**: Each role sees their appropriate workspace
3. **Permission boundaries**: Each role CANNOT access restricted functions
4. **Kitchen workflow**: Orders flow through all 6 KDS columns
5. **Waiter workflow**: Orders flow through waiter delivery stages
6. **Real-time updates**: New orders appear without manual refresh (if Pusher configured)
7. **Customer messages**: Kitchen can send messages to guest order page
8. **Manual payment**: Cash/MoMo payments can be confirmed from kitchen page
