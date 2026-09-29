# OEC-001F Daily Operational Lifecycle Assessment

## Simulating a Complete Operational Day

---

## 1. Morning / Opening

### Manager Opens Dashboard

**File**: `src/pages/dashboard/index.tsx`

| Action | System Response |
|--------|----------------|
| Manager logs in | NextAuth authenticates, resolves business context |
| Dashboard loads | Fetches: stats, sales chart, recent transactions, inventory alerts, table status |
| Setup progress checked | Shows banner if setup incomplete |
| Trial status shown | Displays trial pill if in trial period |

### Staff Login

| Action | System Response |
|--------|----------------|
| Staff enters credentials | NextAuth validates |
| Role permissions checked | `requirePermission()` middleware |
| Business context resolved | `resolveBusinessContext()` |
| Last login recorded | `lastLoginAt` updated |

### Table Status Check

| Status | Meaning |
|--------|---------|
| AVAILABLE | Ready for guests |
| OCCUPIED | Currently in use |
| RESERVED | Held for reservation (after OPS-CRIT-001 fix) |
| CLEANING | Being cleaned |

### Inventory Check

- Dashboard shows low stock count
- Inventory alerts API returns items below min/reorder levels
- Alert levels: CRITICAL (0), HIGH (<50% min), MEDIUM (≤min), LOW (≤reorder)

**Assessment: 5/5 — Excellent**

---

## 2. Service Period

### Guest Arrives → Scans QR → Views Menu → Places Order

| Step | System | What Happens |
|------|--------|--------------|
| 1. Scan QR | Token validation | Access token validated |
| 2. View menu | Menu API | Items loaded with A/B testing |
| 3. Add to cart | Client-side | Cart managed locally |
| 4. Place order | `/api/public/order/draft.ts` | Idempotency check, capacity enforcement, transaction-wrapped creation |
| 5. Payment | PaymentTransaction created | CASH → COMPLETED, Digital → PENDING |
| 6. Confirm | `/api/public/order/confirm.ts` | Status → ACTIVE, kitchen dispatched |

### Order Goes to Kitchen

| Step | System | What Happens |
|------|--------|--------------|
| 1. Dispatch | KitchenDispatchService | MANDATORY — items routed to stations |
| 2. Notification | Pusher | `private-kitchen-{businessId}` notified |
| 3. KDS display | Kitchen dashboard | Order appears in Pending column |
| 4. Accept | Kitchen staff | Status → accepted |
| 5. Start preparing | Kitchen staff | Status → preparing, **inventory consumed** |
| 6. Almost ready | Kitchen staff | Status → almost_ready |
| 7. Ready | Kitchen staff | Status → ready, waiter notified |
| 8. Served | Waiter | Status → served |

### Waiter Serves → Payment Processed

| Step | System | What Happens |
|------|--------|--------------|
| 1. Waiter sees ready | Waiter dashboard | Real-time Pusher update |
| 2. Pick up | Expo confirmation | expoStatus → EXPO_CONFIRMED |
| 3. Serve | Waiter marks served | kitchenStatus → served |
| 4. Payment | PaymentCompletionService | Sale → COMPLETED, ledger entry created |
| 5. Real-time | Pusher broadcast | Payment confirmation sent |

### Inventory Consumed → Alerts if Low

| Step | System | What Happens |
|------|--------|--------------|
| 1. PREPARING transition | SaleItemStatusService | Triggers consumption |
| 2. Recipe resolved | ConsumptionEngineService | Ingredients expanded |
| 3. Stock deducted | InventoryLedgerService | Atomic, row-level lock |
| 4. Audit created | InventoryConsumption | What was consumed recorded |
| 5. Alert check | Inventory alerts | If stock ≤ min, alert triggered |

**Assessment: 5/5 — Excellent** — Complete end-to-end flow with real-time updates

---

## 3. Reservations

### Reservation Flow (After OPS-CRIT-001 Fix)

| Step | System | What Happens |
|------|--------|--------------|
| 1. Create | ReservationService | PENDING, confirmation code generated |
| 2. Notify | WhatsApp/SMS/Email | Customer notified |
| 3. Confirm | ReservationService | **Table → RESERVED** (FIXED) |
| 4. Customer arrives | completeReservation | **Table → AVAILABLE** (FIXED) |
| 5. No-show | markNoShow | **Table → AVAILABLE** (FIXED) |
| 6. Cancel | cancelReservation | **Table → AVAILABLE** (FIXED) |

**Assessment: 5/5 — Excellent (After Fix)**

---

## 4. Closing

### Z-Report Generation

**File**: `src/pages/api/reports/close-day.ts`

| Section | What It Shows |
|---------|---------------|
| Total revenue | Sum of COMPLETED sales |
| Total orders | Count of COMPLETED sales |
| Average order value | Revenue / orders |
| Payment breakdown | Cash, MoMo, Card counts and amounts |
| Order source breakdown | QR, POS, etc. |
| Pending orders | Count of PENDING sales |
| Voided orders | Count of VOIDED sales |
| Reservations | Grouped by status |
| VAT collected | Based on tax mode |
| Net revenue | After VAT |

### Day Closing

| Action | System Response |
|--------|----------------|
| Manager clicks "Close Day" | POST to close-day API |
| AuditLog created | action: 'CLOSE_DAY' |
| Duplicate prevention | Checks existing AuditLog |
| Z-Report finalized | Cannot be modified |

**Assessment: 5/5 — Excellent**

---

## 5. Executive Review

### After Closing

| What | Where |
|------|-------|
| Daily revenue | CEO dashboard, CFO dashboard |
| Operational metrics | COO dashboard |
| Customer metrics | CS Director dashboard |
| Cross-center synthesis | Executive Intelligence Engine |
| AI recommendations | All executive AI assistants |

### Data Flow

```
Daily operations → Shared services → Executive APIs → Executive dashboards
                          ↑
                   Single source of truth
```

**Assessment: 5/5 — Excellent**

---

## 6. Continuity Verification

### Workflow Transitions

| Transition | Continuity | Risk |
|-----------|-----------|------|
| Order → Kitchen | ✅ Mandatory dispatch | None |
| Kitchen → Inventory | ✅ Automatic consumption | None |
| Payment → Ledger | ✅ Automatic entry | None |
| Reservation → Table | ✅ Automatic sync (FIXED) | None |
| Daily → Z-Report | ✅ Complete aggregation | None |
| Operations → Executive | ✅ Shared services | None |

### Peak Service Handling

| Factor | Status |
|--------|--------|
| Real-time updates | ✅ Pusher + polling fallback |
| Concurrent orders | ✅ Transactions with row-level locks |
| Kitchen capacity | ✅ Capacity enforcement for scheduled orders |
| Payment processing | ✅ Idempotent, 30s timeout |
| Inventory races | ✅ Row-level locks prevent overselling |

### Assessment

**Score: 5/5 — Excellent** — Complete continuity from opening to closing

---

## Overall Daily Operational Lifecycle Score: 5/5 — Excellent

The platform supports a complete operational day from morning opening through peak service to evening closing and executive review. Every workflow transition is handled, every department is coordinated, and every transaction is recorded.
