# OEC-001F Cross-Department Coordination Report

## Do All Departments Work Together as One System?

---

## 1. Department Map

| Department | Primary System | Key Components |
|------------|---------------|----------------|
| Front of House (FOH) | Waiter POS, Table Service | dashboard/waiter.tsx, tables.tsx |
| Kitchen | Kitchen Display System | dashboard/kitchen.tsx, kitchen-dispatch.service.ts |
| Inventory | Inventory Management | dashboard/inventory.tsx, consumption-engine.service.ts |
| Finance | Revenue Operations | admin/revenue-operations.tsx, billing-ledger.service.ts |
| Management | Dashboard, Reports | dashboard/index.tsx, close-day.tsx |
| Partnerships | Partnership Platform | partnership-commission.service.ts, portal/ |
| Customer Success | CS Director Center | executive/customer-success-director.tsx |

---

## 2. FOH ↔ Kitchen Coordination

### Order Flow

1. Waiter creates order (POS) or customer orders via QR
2. `KitchenDispatchService.dispatchToKitchen()` — MANDATORY for all orders
3. Kitchen receives real-time Pusher notification on `private-kitchen-{businessId}`
4. Kitchen sees order in Kitchen Display System (KDS)
5. Kitchen updates status: pending → accepted → preparing → almost_ready → ready
6. Waiter sees status updates in real-time
7. Waiter picks up order (expo confirmation)
8. Waiter marks as served

### Communication Channels

| Channel | Direction | Implementation |
|---------|-----------|----------------|
| Pusher events | Kitchen → Waiter | `order.updated` on kitchen channel |
| Pusher events | Kitchen → Customer | `status.changed` on order channel |
| Kitchen messages | Kitchen → Customer | Predefined templates (PLEASE_WAIT, ITEM_UNAVAILABLE, etc.) |
| Waiter calls | Customer → Staff | Real-time notifications via Pusher/polling |

### Assessment

**Score: 5/5 — Excellent** — Full bidirectional real-time communication

---

## 3. Kitchen ↔ Inventory Coordination

### Consumption Flow

1. Kitchen marks item as PREPARING
2. `SaleItemStatusService.transitionTx()` triggers consumption
3. `ConsumptionEngineService.consumeForSaleItem()` resolves recipe
4. Ingredients expanded (including sub-recipes up to 3 levels)
5. `InventoryLedgerService.applyMutation()` deducts stock atomically
6. `InventoryConsumption` audit row created
7. If stock drops below threshold, alert triggered

### Reversal Flow

1. Item cancelled while PREPARING or READY
2. `ConsumptionEngineService.reverseForSaleItem()` creates compensating additions
3. `InventoryLedgerService.reverseConsumption()` restores stock
4. Consumption state marked as REVERSED

### Assessment

**Score: 5/5 — Excellent** — Automatic, transactional, audited

---

## 4. Inventory ↔ Supplier Coordination

### Current State

| Feature | Status |
|---------|--------|
| Supplier product catalog | ✅ Exists |
| Purchase order creation | ✅ Manual |
| Supplier order confirmation | ✅ Supplier portal |
| Delivery status tracking | ✅ PENDING → DELIVERED |
| Auto-reorder from low stock | ⚠️ Suggestions only, not automatic |
| Inventory auto-restock on delivery | ⚠️ Shadow events emitted, not automatic |

### Gap

Low stock alerts don't automatically create supplier orders. The auto-reorder system provides AI-powered suggestions but doesn't execute orders without manual approval.

### Assessment

**Score: 3/5 — Moderate** — Manual coordination, no automatic ordering

---

## 5. Finance ↔ Operations Coordination

### Order → Finance Flow

1. Order created → PaymentTransaction created
2. Payment succeeds → `PaymentCompletionService.onPaymentSuccess()`
3. Sale → COMPLETED, PaymentTransaction → SUCCESS
4. `BillingLedgerService.logBillingEvent()` → FinancialLedgerEntry created
5. Real-time payment confirmation broadcast
6. Revenue operations dashboard updates

### Refund → Finance Flow

1. Refund initiated → InTouch deposit request
2. PaymentTransaction → REFUNDED, Sale → REFUNDED
3. `ensurePaymentLedgerEvent()` → PAYMENT_REFUNDED ledger entry
4. Audit log: PAYMENT_REFUND_INITIATED
5. Z-Report correctly excludes refunded sales

### Assessment

**Score: 5/5 — Excellent** — Full integration, idempotent, audited

---

## 6. Reservations ↔ Tables Coordination (After OPS-CRIT-001 Fix)

### Before Fix

| Coordination | Status |
|-------------|--------|
| Reservation → Table status | ❌ No automatic update |
| Cancellation → Table release | ❌ No automatic release |
| No-show → Table release | ❌ No automatic release |
| Completion → Table release | ❌ No automatic release |

### After Fix

| Coordination | Status |
|-------------|--------|
| Reservation confirm → Table RESERVED | ✅ Automatic, transactional |
| Cancellation → Table AVAILABLE | ✅ Automatic, transactional |
| No-show → Table AVAILABLE | ✅ Automatic, transactional |
| Completion → Table AVAILABLE | ✅ Automatic, transactional |
| Forfeit deposit → Table AVAILABLE | ✅ Automatic, transactional |

### Assessment

**Score: 5/5 — Excellent (After Fix)**

---

## 7. Management ↔ All Departments

### Operational Visibility

| What | Where | Real-Time? |
|------|-------|------------|
| Today's sales | Dashboard stats | ✅ Polls every 5s |
| Active orders | Recent transactions | ✅ |
| Table status | Tables API | ✅ |
| Kitchen status | Kitchen orders API | ✅ Pusher |
| Inventory alerts | Dashboard stats | ✅ |
| Staff count | Dashboard stats | ✅ |
| Live metrics | LiveMetricsTicker | ✅ Polls every 5s |
| Waiter calls | Real-time notifications | ✅ Pusher/polling |

### Daily Closing

- Z-Report aggregates all daily activity
- Payment method breakdown
- Order source breakdown
- Reservation summary
- VAT calculation
- Prevents duplicate closing

### Assessment

**Score: 5/5 — Excellent**

---

## 8. Partnerships ↔ Operations Coordination

### Commission Flow

1. Business signs up using partner code
2. `PartnershipCodeRedemption` links code to business
3. Business converts to paid subscription
4. Commission accrued to partner (PENDING)
5. Commission validated after lock period
6. Commission approved
7. Commission paid via payout batch

### Coordination Points

| Point | Status |
|-------|--------|
| Attribution tracking | ✅ Full tracking from code to business |
| Commission accrual | ✅ On subscription payment |
| Commission payout | ✅ Atomic transaction |
| Commission reversal | ⚠️ Manual void/clawback |
| Revenue operations view | ✅ Commission liability tracked |

### Assessment

**Score: 4/5 — Strong** — Good integration, manual reversal is a gap

---

## 9. Isolated Departments

### Potential Data Silos

| Department | Isolation Risk | Impact |
|------------|---------------|--------|
| Supplier Management | Moderate | No automatic ordering from low stock |
| Staff Scheduling | Moderate | No shift management integration |
| Marketing | Low | Campaigns tracked but no automated follow-ups |

### Well-Integrated Areas

| Integration | Quality |
|-------------|---------|
| Orders ↔ Kitchen ↔ Inventory | Excellent — consumption engine |
| Payments ↔ Financial Ledger | Excellent — single source of truth |
| Reservations ↔ Tables | Excellent (after fix) — automatic sync |
| Partnerships ↔ Revenue | Strong — commission tracking |
| Real-time communications | Excellent — Pusher + polling fallback |

---

## Overall Cross-Department Coordination Score: 4.3/5 — Strong

**Strengths**: Excellent FOH-kitchen communication, automatic inventory consumption, full finance-operations integration, reservation-table synchronization (fixed), real-time visibility  
**Gaps**: No automatic supplier ordering from low stock, no shift scheduling, manual commission reversal on refunds
