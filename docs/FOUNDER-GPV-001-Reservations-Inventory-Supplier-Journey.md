# FOUNDER-GPV-001 — Reservations, Inventory, Supplier Journey

| Field | Value |
|---|---|
| Document ID | FOUNDER-GPV-001-RES-INV-SUP |
| Date | 2026-08-14 |
| Source | `src/lib/services/reservation.service.ts`, `src/pages/dashboard/inventory.tsx`, `src/pages/dashboard/supplier-portal.tsx`, `src/pages/api/reservations/`, `src/pages/api/inventory/` |

## Overview

This document maps three parallel operational branches: Reservations, Inventory, and Suppliers. Each has a different implementation status and dependency profile.

---

## Reservations Journey

### Implementation Status: CERTIFIED

GPV-D012 was previously remediated — PATCH `/api/reservations/[id]` now routes to domain methods instead of bypassing business logic.

### Route & Access

| Field | Value |
|---|---|
| Route | `/dashboard/reservations` |
| Allowed roles | OWNER, ADMIN, MANAGER, FRONT_DESK, SUPERVISOR |
| API | `/api/reservations` (GET, POST), `/api/reservations/[id]` (GET, PATCH) |

### Reservation Lifecycle

```
CREATE (PENDING)
     │
     ├── CONFIRM → table auto-reserved (CONFIRMED)
     │    │
     │    ├── COMPLETE → table released (COMPLETED)
     │    ├── CANCEL → table released (CANCELLED)
     │    └── NO-SHOW → table released + deposit forfeited (NO_SHOW)
     │
     └── CANCEL → (CANCELLED)
```

### Reservation Journey Steps

| Step | Action | API | Expected Result |
|---|---|---|---|
| R-01 | Navigate to reservations | `/dashboard/reservations` | Reservation list displayed |
| R-02 | Create reservation | POST `/api/reservations` | Reservation created with confirmation code, status PENDING |
| R-03 | Verify customer auto-created | — | Customer record auto-created from phone (CustomerService.findOrCreateByPhone) |
| R-04 | Confirm reservation | PATCH `/api/reservations/[id]` → `confirmReservation` | Status → CONFIRMED, table → RESERVED |
| R-05 | Verify table reserved | `/dashboard/tables` | Table shows RESERVED status |
| R-06 | Complete reservation | PATCH → `completeReservation` | Status → COMPLETED, table → AVAILABLE |
| R-07 | Verify table released | `/dashboard/tables` | Table shows AVAILABLE status |
| R-08 | Create another reservation | POST `/api/reservations` | New reservation created |
| R-09 | Mark no-show | PATCH → `markNoShow` | Status → NO_SHOW, table → AVAILABLE, deposit forfeited |
| R-10 | Cancel reservation | PATCH → `cancelReservation` | Status → CANCELLED, table → AVAILABLE |

### Reservation Data Model

| Field | Type | Description |
|---|---|---|
| businessId | String | Business isolation |
| customerId | String? | Auto-resolved from phone |
| customerName | String | Customer name |
| customerPhone | String | Contact phone |
| customerEmail | String? | Contact email |
| reservationDate | DateTime | Date of reservation |
| reservationTime | String | Time (HH:MM) |
| reservedAt | DateTime | Combined date+time |
| partySize | Int | Number of guests |
| tableId | String? | Assigned table |
| confirmationCode | String | Auto-generated (8 hex chars) |
| status | Enum | PENDING, CONFIRMED, COMPLETED, CANCELLED, NO_SHOW |
| specialRequests | String? | Customer notes |

### Verification Points

1. Reservation can be created with customer name, phone, date, time, party size
2. Confirmation code is auto-generated
3. Customer record is auto-created from phone
4. Confirming a reservation auto-reserves the table (table → RESERVED)
5. Completing a reservation releases the table (table → AVAILABLE)
6. Cancelling a reservation releases the table
7. No-show forfeits deposit and releases the table
8. Notifications are sent (WhatsApp/SMS/Email) — if configured
9. Timezone-aware day boundaries used for Z-Report reservation counts

---

## Inventory Journey

### Implementation Status: CERTIFIED

### Route & Access

| Field | Value |
|---|---|
| Route | `/dashboard/inventory` |
| Alerts route | `/dashboard/inventory-alerts` |
| Auto-reorder route | `/dashboard/auto-reorder` |
| API | `/api/inventory` (GET, POST), `/api/inventory/[id]` (PUT, DELETE), `/api/inventory/updates` (POST), `/api/inventory/alerts` (GET) |

### Inventory Journey Steps

| Step | Action | API | Expected Result |
|---|---|---|---|
| I-01 | Navigate to inventory | `/dashboard/inventory` | Inventory list displayed |
| I-02 | Create inventory item | POST `/api/inventory` | Item created with name, category, unit, stock, min level, reorder level, cost |
| I-03 | Edit inventory item | PUT `/api/inventory/[id]` | Item updated |
| I-04 | Adjust stock | POST `/api/inventory/updates` | Stock level adjusted, update record created |
| I-05 | View low-stock alerts | `/dashboard/inventory-alerts` | Items below min stock level shown |
| I-06 | View auto-reorder | `/dashboard/auto-reorder` | Reorder recommendations based on lead time and safety stock |
| I-07 | Delete inventory item | DELETE `/api/inventory/[id]` | Item removed |

### Inventory Data Model

| Field | Type | Description |
|---|---|---|
| name | String | Item name |
| category | String | Category grouping |
| unit | String | Unit of measure (kg, L, pcs) |
| currentStock | Float | Current stock level |
| minStockLevel | Float | Minimum stock before alert |
| reorderLevel | Float | Stock level for reorder recommendation |
| unitCostCents | Int | Cost per unit in cents |

### Kitchen Consumption Engine

| Mode | Behavior |
|---|---|
| `off` (default) | No consumption — no stock changes on kitchen transitions |
| `shadow` | Dry-run — logs only, no actual stock changes |
| `enforce` | Actual inventory consumption on NEW → PREPARING transition |

Configuration: `KITCHEN_CONSUMPTION_ENGINE_MODE` env var + `KITCHEN_CONSUMPTION_PILOT_BUSINESS_IDS` for pilot businesses.

### Verification Points

1. Inventory items can be created with all fields
2. Stock adjustments create update records
3. Low-stock alerts appear for items below min level
4. Auto-reorder recommendations are generated
5. Kitchen consumption engine (if enabled) deducts stock on preparation
6. Inventory is business-isolated (no cross-business visibility)

---

## Supplier Journey

### Implementation Status: NOT IMPLEMENTED (MOCK DATA)

### Critical Finding

The supplier portal at `/dashboard/supplier-portal.tsx` uses **entirely hardcoded mock data**:

```typescript
const suppliers: Supplier[] = [
  { id: '1', name: 'Rwanda Fresh Produce Ltd', ... },
  { id: '2', name: 'Kigali Meat Suppliers', ... }
]

const supplierItems: SupplierItem[] = [
  { id: '1', supplierId: '1', name: 'Fresh Tomatoes', ... },
  ...
]

const orders: Order[] = [
  { id: 'ORD-001', ... },
  { id: 'ORD-002', ... }
]
```

There is NO real supplier API at `/api/suppliers/`. The supplier portal is a UI shell with no backend integration.

### What Does Exist

| Component | Status | Location |
|---|---|---|
| Supplier model (Prisma) | EXISTS | `prisma/schema.prisma` — Supplier model |
| Supplier portal UI | EXISTS (mock) | `/dashboard/supplier-portal.tsx` |
| Marketplace suppliers API | EXISTS | `/api/marketplace/suppliers/nearest` — for discovery, not management |
| Supplier order BigInt fix | REMEDIATED | GPV-D013 — BigInt serialization fixed |
| Purchase Order model | EXISTS | `prisma/schema.prisma` — PurchaseOrder model |
| Goods Received Note | EXISTS | `prisma/schema.prisma` — GoodsReceivedNote model |

### What Does NOT Exist

| Component | Status |
|---|---|
| `/api/suppliers/` CRUD API | DOES NOT EXIST |
| Real supplier data in portal | DOES NOT EXIST (mock data only) |
| Supplier order creation flow | NOT FUNCTIONAL through portal |
| Supplier delivery tracking | NOT FUNCTIONAL through portal |
| Supplier-inventory integration | NOT FUNCTIONAL through portal |

### Classification

**NOT IMPLEMENTED for founder testing.** The supplier portal is a UI mock that cannot be used for real supplier management.

### What the Founder Should Know

1. The supplier portal page EXISTS but displays fake data
2. No actions on the supplier portal affect real data
3. The underlying data models (Supplier, PurchaseOrder, GoodsReceivedNote) exist in the database
4. The marketplace supplier API exists for supplier discovery (nearest suppliers)
5. The BigInt serialization issue (GPV-D013) was fixed for the supplier orders API that does exist elsewhere
6. Real supplier management is a FUTURE implementation item

### Recommendation

Do NOT include supplier portal testing in the founder-led GPV. Document it as a known limitation and future implementation item. The founder should be aware that:
- The page exists but is non-functional
- Real supplier management requires backend API development
- This is not a blocker for Customer #1 (inventory can be managed without the supplier portal)

---

## Dependency Summary

| Branch | Dependencies | Can Run In Parallel With |
|---|---|---|
| Reservations | Business config, tables, staff (FRONT_DESK/MANAGER) | Menu, QR, Guest Order (after tables) |
| Inventory | Business config | Everything after business config |
| Suppliers | N/A (not functional) | N/A |
