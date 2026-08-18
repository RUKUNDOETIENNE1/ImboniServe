# FOUNDER-GPV-001 — Session Plan

| Field | Value |
|---|---|
| Document ID | FOUNDER-GPV-001-SESSION-PLAN |
| Date | 2026-08-14 |
| Source | Dependency graph, feature readiness matrix |

## Overview

The complete founder journey is divided into sessions based on actual dependencies. Each session has a clear objective, starting state, prerequisites, and completion criteria.

## Session Division

### SESSION A: Owner Setup

| Field | Value |
|---|---|
| Objective | Create business account, configure it, prepare for operations |
| Starting State | Application running, environment configured |
| Prerequisites | SMTP, Twilio, database configured; env vars set |
| Estimated Duration | 30-45 minutes |
| Completion Criteria | Owner can login, business is configured, setup wizard shows progress |

**Steps**:
1. Signup (name, email, password, phone, business, country, plan)
2. Welcome page
3. Login (credentials → OTP → MFA confirm)
4. Setup wizard (check progress)
5. Business profile configuration
6. Payment settings (tax mode, rate, currency)
7. Business settings (QR enable)

**Restart Point**: Login → `/setup` shows current progress

---

### SESSION B: Team & Permissions

| Field | Value |
|---|---|
| Objective | Create staff, assign roles, verify permission boundaries |
| Starting State | Session A complete (owner can login, business configured) |
| Prerequisites | SMTP for staff invites |
| Estimated Duration | 30-45 minutes |
| Completion Criteria | Manager, Waiter, Kitchen staff created; role boundaries verified |

**Steps**:
1. Navigate to staff management
2. Create Manager (invite + role)
3. Create Waiter (invite + role)
4. Create Kitchen Staff (invite + role)
5. Login as Manager — verify access and restrictions
6. Login as Waiter — verify access and restrictions
7. Login as Kitchen — verify access and restrictions
8. Verify Manager CANNOT refund or change settings
9. Verify Waiter CANNOT access kitchen or payments
10. Verify Kitchen CANNOT access payments or reports

**Restart Point**: Login as Owner → `/dashboard/staff` shows created staff

---

### SESSION C: Menu, Tables & QR

| Field | Value |
|---|---|
| Objective | Create menu, tables, and QR codes for guest ordering |
| Starting State | Session A complete (business configured) |
| Prerequisites | None beyond Session A |
| Estimated Duration | 30-45 minutes |
| Completion Criteria | Menu has items, tables created, QR codes generated and tested |

**Steps**:
1. Navigate to menu editor
2. Create categories
3. Create menu items (name, price, cost, category, availability)
4. Add translations (optional)
5. Navigate to tables
6. Create tables (number, capacity)
7. Navigate to QR builder
8. Generate QR codes for tables
9. Test QR scan with phone (or browser URL)
10. Verify menu loads on /order page

**Restart Point**: Login as Owner → `/dashboard/menu` and `/dashboard/tables`

---

### SESSION D: Guest Dining

| Field | Value |
|---|---|
| Objective | Experience the guest journey from QR scan to order placement |
| Starting State | Session C complete (menu, tables, QR exist) |
| Prerequisites | QR code accessible (phone or URL) |
| Estimated Duration | 20-30 minutes |
| Completion Criteria | Guest can scan QR, browse menu, place order, see confirmation |

**Steps**:
1. Scan QR code (or open URL with QR params)
2. Token exchange (automatic)
3. Browse menu
4. Add items to cart
5. Set participant name
6. Place order
7. View order confirmation
8. Check order status (polling)
9. Add more items (second order)
10. Verify running bill on checkout page

**Restart Point**: Scan QR → `/order` page loads with menu

---

### SESSION E: Kitchen & Promise Engine

| Field | Value |
|---|---|
| Objective | Process orders through kitchen, observe Promise Engine in action |
| Starting State | Session D complete (orders placed) |
| Prerequisites | Orders in kitchen display |
| Estimated Duration | 20-30 minutes |
| Completion Criteria | Orders processed through all KDS columns, Promise Engine observed |

**Steps**:
1. Login as Kitchen Staff (or Owner)
2. Open kitchen display
3. View incoming orders
4. Accept order (pending → accepted)
5. Start prep (accepted → preparing)
6. Mark almost ready (preparing → almost_ready)
7. Mark ready (almost_ready → ready) — Promise FULFILLED
8. Mark served (ready → served)
9. Send customer message (e.g., "Almost ready")
10. Check Service Risks dashboard
11. Check Service Replay

**Restart Point**: Login → `/dashboard/kitchen` shows pending orders

---

### SESSION F: Payment & Tap & Leave

| Field | Value |
|---|---|
| Objective | Complete payment via Tap & Leave, verify financial truth |
| Starting State | Session D/E complete (orders placed, kitchen processed) |
| Prerequisites | InTouch config fixed (FGPV-D002–D005), ngrok tunnel, test MoMo phone |
| Estimated Duration | 20-30 minutes |
| Completion Criteria | Payment successful, financial records created |

**Steps**:
1. Navigate to checkout (/order/checkout?sessionId=...)
2. View live order summary (running bill)
3. Enter Mobile Money phone number
4. View fee information
5. Tap & Leave (trigger payment)
6. Approve USSD prompt on phone
7. Verify payment success
8. Check dashboard transactions
9. Check sale status (COMPLETED)
10. ⚠️ Note: Receipt page will 404 (FGPV-D001)

**Restart Point**: Login → `/dashboard/transactions` shows payment status

---

### SESSION G: Financial Truth & Close Day

| Field | Value |
|---|---|
| Objective | Verify financial truth chain and close the operational day |
| Starting State | Session F complete (payment successful) |
| Prerequisites | Completed sales exist |
| Estimated Duration | 15-20 minutes |
| Completion Criteria | Z-Report verified, variance = 0, day closed |

**Steps**:
1. Check dashboard revenue (matches payment)
2. View transactions (payment listed as SUCCESS)
3. Navigate to close-day
4. View Z-Report (sales, payment breakdown, tax)
5. Verify ledger cross-check (ledgerVarianceCents = 0)
6. Close the day
7. Verify double-close prevention

**Restart Point**: Login → `/dashboard/close-day` shows Z-Report

---

### SESSION H: Executive Review

| Field | Value |
|---|---|
| Objective | Review business performance through executive dashboards |
| Starting State | Session G complete (day closed, financial data exists) |
| Prerequisites | Financial data from completed sales |
| Estimated Duration | 15-20 minutes |
| Completion Criteria | CEO/CFO dashboards reviewed, reports verified |

**Steps**:
1. Open CEO dashboard
2. Review business health score
3. Review revenue metrics
4. Review customer metrics
5. Open CFO dashboard
6. Review financial metrics
7. Open reports
8. Review analytics (menu performance, peak hours, payments)
9. Verify metrics match Z-Report

**Restart Point**: Login → `/dashboard/ceo`

---

### SESSION I: Security & Failure (Parallel)

| Field | Value |
|---|---|
| Objective | Verify security boundaries and failure behavior |
| Starting State | Sessions A-B complete (multiple roles exist) |
| Prerequisites | Multiple staff roles, test data |
| Estimated Duration | 30-45 minutes |
| Completion Criteria | Security boundaries verified, failure scenarios tested |

**Steps**:
1. Verify business isolation (Owner sees only their business)
2. Verify Manager cannot refund
3. Verify Waiter cannot access kitchen
4. Verify Kitchen cannot access payments
5. Test invalid QR (wrong signature → rejected)
6. Test payment failure (no revenue created)
7. Test duplicate webhook (no double effect)
8. Test cancelled reservation (table released)
9. Test logout (session destroyed)

**Restart Point**: Can run in parallel with any session after B

---

## Parallel Sessions

| Session | Can Run After | Can Run In Parallel With |
|---|---|---|
| Reservations | Session C (tables exist) | D, E, F, G |
| Inventory | Session A (business exists) | B, C, D, E, F, G |
| Security & Failure | Session B (roles exist) | C, D, E, F, G, H |
| Mobile/PWA | Session D (guest journey) | E, F, G, H |

## Session Dependency Graph

```
A (Owner Setup)
├── B (Team) ──────────────────┐
├── C (Menu/Tables/QR) ────────┤
│   ├── D (Guest Dining)       │
│   │   ├── E (Kitchen)        ├── I (Security/Failure)
│   │   │   └── F (Payment)    │
│   │   │       └── G (Close Day)
│   │   │           └── H (Executive)
│   │   │
│   ├── Reservations (parallel)
│   └── Inventory (parallel)
```

## Total Estimated Duration

| Session | Duration |
|---|---|
| A: Owner Setup | 30-45 min |
| B: Team & Permissions | 30-45 min |
| C: Menu, Tables & QR | 30-45 min |
| D: Guest Dining | 20-30 min |
| E: Kitchen & Promise Engine | 20-30 min |
| F: Payment & Tap & Leave | 20-30 min |
| G: Financial Truth & Close Day | 15-20 min |
| H: Executive Review | 15-20 min |
| I: Security & Failure | 30-45 min |
| **Total** | **3.5 - 5.5 hours** |

Sessions can be spread across multiple days. Each session has a clear restart point if interrupted.
