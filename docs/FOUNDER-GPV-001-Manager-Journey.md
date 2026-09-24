# FOUNDER-GPV-001 — Manager Journey

| Field | Value |
|---|---|
| Document ID | FOUNDER-GPV-001-MANAGER-JOURNEY |
| Date | 2026-08-14 |
| Role | Manager |
| Source | `src/lib/permissions/staff.ts`, route guards |

## Overview

The Manager handles daily operations with limited settings access. The Manager can do almost everything the Owner can except: process refunds, manage business settings, and manage inventory configuration.

## Manager Journey

### Phase 1: Account Access

| Step | Action | Route/API | Expected Result |
|---|---|---|---|
| M-01 | Receive invitation | Owner creates via `/dashboard/staff` | Manager account created with 'manager' role |
| M-02 | Login | `/login` → credentials → OTP → MFA confirm | Session created, redirected to `/dashboard` |
| M-03 | Dashboard loads | `/dashboard` | Manager sees operational dashboard (not setup wizard — setup already complete) |

### Phase 2: Daily Operations

| Step | Action | Route/API | Expected Result |
|---|---|---|---|
| M-04 | View orders | `/dashboard/orders/unified` | All business orders visible |
| M-05 | Monitor kitchen | `/dashboard/kitchen` | Kitchen display with order columns |
| M-06 | Manage tables | `/dashboard/tables` | Table list with status (AVAILABLE, OCCUPIED, RESERVED) |
| M-07 | Manage reservations | `/dashboard/reservations` | Reservation list with status (PENDING, CONFIRMED, COMPLETED, CANCELLED, NO_SHOW) |
| M-08 | Create reservation | POST `/api/reservations` | Reservation created with confirmation code, table auto-reserved |
| M-09 | Confirm reservation | PATCH `/api/reservations/[id]` → `confirmReservation` | Status → CONFIRMED, table → RESERVED |
| M-10 | Complete reservation | PATCH `/api/reservations/[id]` → `completeReservation` | Status → COMPLETED, table → AVAILABLE |

### Phase 3: Staff Coordination

| Step | Action | Route/API | Expected Result |
|---|---|---|---|
| M-11 | View staff | `/dashboard/staff` | Staff list visible |
| M-12 | Create waiter | POST `/api/staff` | Waiter invited (Manager CAN manage staff) |
| M-13 | Create kitchen staff | POST `/api/staff` | Kitchen staff invited |
| M-14 | Assign tables to waiters | Table management | Waiter assigned to specific tables |

### Phase 4: Menu & Inventory

| Step | Action | Route/API | Expected Result |
|---|---|---|---|
| M-15 | Edit menu | `/dashboard/menu/dynamic-edit` | Menu items can be created/edited |
| M-16 | Update inventory | `/dashboard/inventory` | Stock levels can be updated (inventory.update = true) |
| M-17 | View inventory alerts | `/dashboard/inventory-alerts` | Low-stock alerts visible |
| M-18 | Auto-reorder | `/dashboard/auto-reorder` | Reorder recommendations visible |

### Phase 5: Service Monitoring

| Step | Action | Route/API | Expected Result |
|---|---|---|---|
| M-19 | Service risks | `/dashboard/operations/service-risks` | Active promise risks visible (WARNING/CRITICAL) |
| M-20 | Service replay | `/dashboard/operations/service-replay` | Service timeline replay available |
| M-21 | Waiter workflow | `/dashboard/waiter` | Waiter queue visible (Manager has access) |

### Phase 6: Reports & Close Day

| Step | Action | Route/API | Expected Result |
|---|---|---|---|
| M-22 | View reports | `/dashboard/reports` | Operational reports visible (reports.view = true) |
| M-23 | Close day | `/dashboard/close-day` | Z-Report generated |
| M-24 | Verify Z-Report | Z-Report | Sales, payment breakdown, tax, ledger cross-check visible |
| M-25 | Post close-day | POST `/api/reports/close-day` | Day closed, audit log created |

## Manager Boundaries (What Manager CANNOT Do)

| Capability | Owner | Manager |
|---|---|---|
| Process refunds | ✅ | ❌ |
| Manage business settings | ✅ | ❌ |
| Manage inventory config | ✅ | ❌ (can update stock, not manage) |
| Configure payment settings | ✅ | ❌ (read only) |
| Manage rooms | ✅ | ❌ (can check-in/out, not manage) |

## Verification Points

The founder (acting as Owner) should verify:
1. Manager can login and see the dashboard
2. Manager can create/edit menu items
3. Manager can manage reservations (create, confirm, complete, cancel)
4. Manager can view and update inventory
5. Manager can view reports and close the day
6. Manager CANNOT process refunds (UI should not show refund option)
7. Manager CANNOT change business settings (settings page should be read-only)
8. Manager CANNOT access admin-only routes
