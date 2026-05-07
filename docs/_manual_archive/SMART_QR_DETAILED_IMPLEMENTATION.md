# Smart QR + Remote Pre-Order: Detailed Implementation Guide

**Status:** Design Complete - Ready for Implementation  
**Last Updated:** February 23, 2026

This document provides the complete technical implementation plan for Smart QR ordering and remote pre-orders, with all policy decisions approved and fraud mitigations defined.

---

## Table of Contents
1. [Architecture Overview](#1-architecture-overview)
2. [Database Schema Changes](#2-database-schema-changes)
3. [Token & Security Implementation](#3-token--security-implementation)
4. [API Contracts](#4-api-contracts)
5. [Fee Calculation Logic](#5-fee-calculation-logic)
6. [Payment Flow](#6-payment-flow)
7. [Kitchen Integration](#7-kitchen-integration)
8. [Notification Flow](#8-notification-flow)
9. [Admin Configuration](#9-admin-configuration)
10. [Implementation Order](#10-implementation-order)
11. [Testing Strategy](#11-testing-strategy)
12. [Monitoring & KPIs](#12-monitoring--kpis)

---

## 1) Architecture Overview

### Non-Disruptive Design Principles
- **Isolation:** Public order flows live under `/order` page and `/api/public/*` routes.
- **Feature Flags:** Per-branch enablement (`enableQRInVenue`, `enableQRRemote`, `requireDepositRemote`).
- **Payment Gating:** Orders only reach kitchen after webhook-confirmed `PAID` status.
- **Existing Flows Untouched:** Waiter/POS workflows continue unchanged.

### System Components
```
┌─────────────────┐
│   Customer      │
│  (QR/Remote)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Public Order   │
│     Page        │ (/order)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Token Service  │ (HMAC + JWT)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Order Draft    │
│     API         │ (/api/public/order/draft)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Payment        │
│  (IremboPay)    │
└────────┬────────┘
         │
         ▼ (webhook PAID)
┌─────────────────┐
│  Kitchen Queue  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Smart Dining   │
│     Slip™       │
└─────────────────┘
```

---

## 2) Database Schema Changes

### 2.1) Extend Sale Model
```prisma
model Sale {
  // ... existing fields ...
  
  // NEW FIELDS
  orderSource       OrderSource  @default(WAITER_POS)
  scheduledAt       DateTime?
  depositCents      Int          @default(0)
  customerPhone     String?
  prepStartedAt     DateTime?    // For refund window tracking
  
  @@index([orderSource])
  @@index([scheduledAt])
}

enum OrderSource {
  WAITER_POS
  QR_IN_VENUE
  QR_REMOTE
}
```

### 2.2) Extend Business Model (Branch Config)
```prisma
model Business {
  // ... existing fields ...
  
  // QR Feature Flags
  enableQRInVenue       Boolean  @default(false)
  enableQRRemote        Boolean  @default(false)
  requireDepositRemote  Boolean  @default(true)
  
  // Slot Capacity Config
  maxRemoteOrdersPerSlot  Int    @default(10)
  slotDurationMinutes     Int    @default(30)
  
  // Deposit & Refund Config
  defaultDepositPercent   Float  @default(50.0)
  prepBufferMinutes       Int    @default(10)
}
```

### 2.3) Add Virtual Table (Optional Approach)
```prisma
model Table {
  // ... existing fields ...
  
  isVirtual  Boolean  @default(false)  // For "REMOTE" table
}
```

**Alternative:** Create one physical table per branch named "REMOTE" (no schema change needed).

### 2.4) Token Replay Prevention
```prisma
model OrderToken {
  id          String    @id @default(cuid())
  jti         String    @unique  // JWT ID for one-time use
  branchId    String
  tableId     String?
  source      String    // QR_IN_VENUE | QR_REMOTE
  used        Boolean   @default(false)
  usedAt      DateTime?
  expiresAt   DateTime
  createdAt   DateTime  @default(now())
  
  @@index([jti])
  @@index([expiresAt])
}
```

### 2.5) OTP Verification Tracking
```prisma
model Customer {
  // ... existing fields ...
  
  phoneVerified      Boolean   @default(false)
  phoneVerifiedAt    DateTime?
  otpAttempts        Int       @default(0)
  lastOtpRequestAt   DateTime?
}
```

---

## 3) Token & Security Implementation

### 3.1) QR URL Format (In-Venue)
```
https://serve.imboni.rw/order?b={branchId}&t={tableId}&v=1&sig={hmac}
```

**HMAC Signature:**
```typescript
const payload = `${branchId}|${tableId}|${version}`;
const sig = HMAC_SHA256(IMBONI_QR_SECRET, payload);
```

**Example:**
```
/order?b=branch_abc123&t=table_5&v=1&sig=a3f8d9e2b1c4...
```

### 3.2) Remote URL Format
```
https://serve.imboni.rw/order?b={branchId}&mode=pickup
```
or
```
https://serve.imboni.rw/order?b={branchId}&mode=preorder
```

### 3.3) Short-Lived Access Token (JWT)
**Issued on first page load after HMAC validation.**

**Claims:**
```json
{
  "jti": "unique-token-id-12345",
  "branchId": "branch_abc123",
  "tableId": "table_5",
  "source": "QR_IN_VENUE",
  "iat": 1708704000,
  "exp": 1708704600
}
```

**TTL:** 10 minutes  
**Storage:** `OrderToken` table with `jti` for replay prevention.

### 3.4) Token Validation Flow
1. Client loads `/order` with QR params.
2. Server validates HMAC signature.
3. Server generates JWT with unique `jti`.
4. Server stores `jti` in `OrderToken` table (`used=false`).
5. Client receives JWT in response.
6. Client includes JWT in all subsequent API calls.
7. On order creation, server marks `jti` as `used=true`.
8. Subsequent attempts with same `jti` are rejected.

### 3.5) Security Checks (Every API Call)
```typescript
function validateOrderToken(token: string, requestBranchId: string) {
  // 1. Verify JWT signature
  const claims = verifyJWT(token);
  
  // 2. Check expiration
  if (claims.exp < Date.now() / 1000) throw new Error('Token expired');
  
  // 3. Check jti not used
  const tokenRecord = await prisma.orderToken.findUnique({ where: { jti: claims.jti } });
  if (!tokenRecord || tokenRecord.used) throw new Error('Token already used');
  
  // 4. Check branch match
  if (claims.branchId !== requestBranchId) throw new Error('Branch mismatch');
  
  return claims;
}
```

---

## 4) API Contracts

### 4.1) GET /api/public/menu
**Purpose:** Fetch public menu for a branch.

**Request:**
```
GET /api/public/menu?branchId=branch_abc123
```

**Response:**
```json
{
  "branchId": "branch_abc123",
  "branchName": "Imboni Kigali Downtown",
  "menu": [
    {
      "id": "item_001",
      "name": "Isombe",
      "description": "Traditional cassava leaves",
      "priceCents": 350000,
      "category": "Main Course",
      "available": true,
      "imageUrl": "https://..."
    }
  ]
}
```

### 4.2) POST /api/public/order/draft
**Purpose:** Create draft order with server-calculated pricing.

**Request:**
```json
{
  "accessToken": "eyJhbGc...",
  "items": [
    {
      "menuItemId": "item_001",
      "quantity": 2,
      "notes": "Extra spicy"
    }
  ],
  "mode": "immediate",
  "scheduledAt": null,
  "phone": "+250788123456",
  "customerName": "Jean Doe"
}
```

**Server Processing:**
1. Validate `accessToken` (JWT + jti check).
2. Rebuild pricing from `menuItemId` (ignore any client-sent prices).
3. Calculate subtotal.
4. Calculate 5% platform fee on subtotal.
5. Calculate VAT on items (18%).
6. Calculate total.
7. Create draft `Sale` (status: PENDING).
8. Create `PaymentTransaction` (status: NEW).
9. Generate IremboPay invoice.
10. Return payment link + order summary.

**Response:**
```json
{
  "orderId": "sale_xyz789",
  "paymentTransactionId": "txn_abc123",
  "paymentLinkUrl": "https://pay.irembopay.com/...",
  "summary": {
    "subtotalCents": 700000,
    "platformFeeCents": 35000,
    "vatCents": 126000,
    "totalCents": 861000,
    "depositCents": 0,
    "items": [
      {
        "name": "Isombe",
        "quantity": 2,
        "unitPriceCents": 350000,
        "totalCents": 700000
      }
    ]
  },
  "eta": "15-20 minutes",
  "scheduledAt": null
}
```

### 4.3) POST /api/public/order/draft (Remote Pre-Order with Deposit)
**Request:**
```json
{
  "accessToken": "eyJhbGc...",
  "items": [...],
  "mode": "preorder",
  "scheduledAt": "2026-02-24T12:00:00Z",
  "phone": "+250788123456",
  "customerName": "Jean Doe"
}
```

**Server Processing:**
1. Same as immediate order.
2. Check slot capacity for `scheduledAt`.
3. If slot full, return error with next available slots.
4. Calculate 50% deposit (or branch default).
5. Create payment for deposit amount only.

**Response:**
```json
{
  "orderId": "sale_xyz789",
  "paymentTransactionId": "txn_abc123",
  "paymentLinkUrl": "https://pay.irembopay.com/...",
  "summary": {
    "subtotalCents": 700000,
    "platformFeeCents": 35000,
    "vatCents": 126000,
    "totalCents": 861000,
    "depositCents": 430500,
    "remainingCents": 430500
  },
  "scheduledAt": "2026-02-24T12:00:00Z",
  "slotAvailable": true
}
```

### 4.4) GET /api/public/order/status
**Request:**
```
GET /api/public/order/status?orderId=sale_xyz789
```

**Response:**
```json
{
  "orderId": "sale_xyz789",
  "status": "PAID",
  "paymentStatus": "COMPLETED",
  "eta": "15-20 minutes",
  "scheduledAt": null,
  "prepStarted": false,
  "readyForPickup": false
}
```

### 4.5) Webhook Handler (Existing - Enhanced)
**Endpoint:** `/api/payments/irembo/webhook`

**Enhanced Logic:**
```typescript
async function handleWebhook(payload) {
  // 1. Verify HMAC signature (existing)
  // 2. Find PaymentTransaction by invoiceNumber
  const txn = await prisma.paymentTransaction.findUnique({...});
  
  // 3. If status = PAID and not already processed
  if (payload.status === 'PAID' && txn.status !== 'PAID') {
    // 4. Update transaction
    await prisma.paymentTransaction.update({
      where: { id: txn.id },
      data: { status: 'PAID', paidAt: new Date() }
    });
    
    // 5. Find related Sale
    const sale = await prisma.sale.findFirst({
      where: { paymentTransactionId: txn.id }
    });
    
    // 6. Mark jti as used
    const token = await prisma.orderToken.findFirst({
      where: { branchId: sale.businessId, used: false }
    });
    if (token) {
      await prisma.orderToken.update({
        where: { id: token.id },
        data: { used: true, usedAt: new Date() }
      });
    }
    
    // 7. Release to kitchen if immediate OR scheduled time approaching
    if (sale.orderSource === 'QR_IN_VENUE' || isScheduledSoon(sale.scheduledAt)) {
      await releaseToKitchen(sale.id);
    }
    
    // 8. Send Smart Dining Slip
    await sendSmartDiningSlip(sale.id);
    
    // 9. Send customer confirmation
    await sendOrderConfirmation(sale.id);
  }
}
```

---

## 5) Fee Calculation Logic

### 5.1) Server-Side Fee Calculator
```typescript
interface OrderPricing {
  subtotalCents: number;
  platformFeeCents: number;
  vatCents: number;
  totalCents: number;
  depositCents: number;
  remainingCents: number;
}

function calculateOrderPricing(
  items: OrderItem[],
  paymentMethod: 'DIGITAL' | 'CASH',
  isRemote: boolean,
  requireDeposit: boolean,
  depositPercent: number = 50
): OrderPricing {
  // 1. Calculate subtotal from menu prices
  const subtotalCents = items.reduce((sum, item) => {
    const menuItem = getMenuItem(item.menuItemId);
    return sum + (menuItem.priceCents * item.quantity);
  }, 0);
  
  // 2. Calculate 5% platform fee (digital payments only)
  const platformFeeCents = paymentMethod === 'DIGITAL' 
    ? Math.round(subtotalCents * 0.05) 
    : 0;
  
  // 3. Calculate VAT on items (18%)
  const vatCents = Math.round(subtotalCents * 0.18);
  
  // 4. Calculate total
  const totalCents = subtotalCents + platformFeeCents + vatCents;
  
  // 5. Calculate deposit if required
  const depositCents = (isRemote && requireDeposit)
    ? Math.round(totalCents * (depositPercent / 100))
    : 0;
  
  const remainingCents = totalCents - depositCents;
  
  return {
    subtotalCents,
    platformFeeCents,
    vatCents,
    totalCents,
    depositCents,
    remainingCents
  };
}
```

### 5.2) Example Calculation
**Scenario:** Remote pre-order, 2x Isombe @ 3,500 RWF each

```
Subtotal:       7,000 RWF
Platform Fee:     350 RWF (5% of subtotal)
VAT:            1,260 RWF (18% of subtotal)
Total:          8,610 RWF
Deposit (50%):  4,305 RWF
Remaining:      4,305 RWF (pay on pickup)
```

**Smart Dining Slip Display:**
```
Subtotal:       7,000 RWF
Platform Fee:     350 RWF
Total to Pay:   8,610 RWF
Deposit Paid:   4,305 RWF
Balance Due:    4,305 RWF
```

---

## 6) Payment Flow

### 6.1) Immediate Order (In-Venue QR)
```
1. Customer scans QR → loads /order page
2. Server validates HMAC → issues JWT
3. Customer selects items → POST /api/public/order/draft
4. Server calculates pricing → creates draft Sale + PaymentTransaction
5. Server returns paymentLinkUrl
6. Customer pays via IremboPay
7. Webhook confirms PAID
8. Order released to kitchen
9. Smart Dining Slip sent to customer
```

### 6.2) Remote Pre-Order with Deposit
```
1. Customer clicks link → loads /order page
2. Server issues JWT (no table)
3. Customer selects items + scheduled time
4. Server checks slot capacity
5. Server calculates 50% deposit
6. Server creates draft Sale + PaymentTransaction (deposit amount)
7. Customer pays deposit
8. Webhook confirms deposit PAID
9. Order scheduled (not yet in kitchen)
10. At scheduled time - X minutes, order released to kitchen
11. Customer notified when ready
12. Customer pays remaining 50% on pickup
```

### 6.3) Payment State Machine
```
Sale Status Flow:
DRAFT → PENDING_PAYMENT → PAID → IN_KITCHEN → READY → COMPLETED

PaymentTransaction Status:
NEW → PAID | EXPIRED | FAILED
```

---

## 7) Kitchen Integration

### 7.1) Kitchen Dashboard UI Changes
**Grouping:**
- **Immediate Orders (Green):** `orderSource = QR_IN_VENUE` or `WAITER_POS` with no `scheduledAt`
- **Scheduled Orders (Blue):** `orderSource = QR_REMOTE` with `scheduledAt` in future

**Display Fields:**
- Order ID
- Table (or "REMOTE")
- Items
- Order Source badge
- ETA / Scheduled Time
- Payment Status
- Prep Started checkbox

**Filters:**
- Order Source (All / Waiter / QR In-Venue / QR Remote)
- Status (Pending / In Progress / Ready)
- Scheduled (Now / Upcoming)

### 7.2) Kitchen Release Logic
```typescript
async function releaseToKitchen(saleId: string) {
  const sale = await prisma.sale.findUnique({ where: { id: saleId } });
  
  // Only release if paid
  const txn = await prisma.paymentTransaction.findFirst({
    where: { id: sale.paymentTransactionId, status: 'PAID' }
  });
  
  if (!txn) {
    throw new Error('Cannot release unpaid order to kitchen');
  }
  
  // Update sale status
  await prisma.sale.update({
    where: { id: saleId },
    data: { 
      status: 'IN_KITCHEN',
      kitchenReleasedAt: new Date()
    }
  });
  
  // Notify kitchen staff
  await notifyKitchen(saleId);
}
```

### 7.3) Scheduled Order Cron Job
```typescript
// Run every 5 minutes
async function processScheduledOrders() {
  const now = new Date();
  const prepBuffer = 10; // minutes
  const releaseTime = new Date(now.getTime() + prepBuffer * 60000);
  
  const orders = await prisma.sale.findMany({
    where: {
      orderSource: 'QR_REMOTE',
      scheduledAt: { lte: releaseTime },
      status: 'PAID',
      kitchenReleasedAt: null
    }
  });
  
  for (const order of orders) {
    await releaseToKitchen(order.id);
  }
}
```

---

## 8) Notification Flow

### 8.1) Customer Notifications (WhatsApp)
**Order Confirmation (After Payment):**
```
✅ Order Confirmed!

Order ID: #12345
Scheduled: Feb 24, 12:00 PM
Branch: Imboni Kigali Downtown

Items:
- 2x Isombe

Total: 8,610 RWF
Paid (Deposit): 4,305 RWF
Balance Due: 4,305 RWF

We'll notify you when your order is ready!
```

**Ready for Pickup:**
```
🍽️ Your order is ready!

Order ID: #12345
Pickup at: Imboni Kigali Downtown

Please pay remaining balance: 4,305 RWF

Thank you for choosing Imboni Serve!
```

### 8.2) Kitchen Notifications
**New Order Alert:**
```
🔔 New QR Order

Order ID: #12345
Type: Remote Pre-Order
Scheduled: 12:00 PM (in 45 min)
Table: REMOTE

Items:
- 2x Isombe

Start prep at: 11:50 AM
```

---

## 9) Admin Configuration

### 9.1) Branch Settings UI
**Location:** `/admin/restaurants/[id]/qr-settings`

**Fields:**
- Enable QR In-Venue (toggle)
- Enable QR Remote (toggle)
- Require Deposit for Remote (toggle)
- Default Deposit Percent (slider: 0-100%)
- Max Orders Per Slot (number input)
- Slot Duration (dropdown: 15/30/60 min)
- Prep Buffer Minutes (number input)

### 9.2) QR Code Generation
**Admin Action:** "Generate QR Codes" button

**Process:**
1. For each table in branch, generate signed URL
2. Create printable PDF with QR codes
3. Include table number and branch name on each QR

**QR Code Content:**
```
https://serve.imboni.rw/order?b=branch_abc&t=table_5&v=1&sig=a3f8d9e2...
```

### 9.3) Slot Capacity Dashboard
**Location:** `/admin/restaurants/[id]/slot-capacity`

**Display:**
- Calendar view of scheduled orders
- Slot utilization % (color-coded: green < 70%, yellow 70-90%, red > 90%)
- Capacity warnings for overbooked slots
- Ability to adjust caps per time window

---

## 10) Implementation Order

### Phase 1: Foundation (Week 1)
- [ ] Database migrations (OrderSource enum, Sale fields, OrderToken table)
- [ ] Token service (HMAC validation, JWT generation, jti tracking)
- [ ] Public menu API (`/api/public/menu`)
- [ ] Basic `/order` page (QR scan → menu display)

### Phase 2: Order Creation (Week 2)
- [ ] Order draft API (`/api/public/order/draft`)
- [ ] Server-side pricing calculator
- [ ] 5% fee logic (no VAT on fee)
- [ ] Payment integration (IremboPay invoice creation)
- [ ] Webhook enhancement (jti marking, kitchen release)

### Phase 3: Remote Pre-Orders (Week 3)
- [ ] Scheduled order support
- [ ] Slot capacity tracking
- [ ] Deposit calculation (50% default)
- [ ] OTP phone verification
- [ ] Scheduled order cron job

### Phase 4: Kitchen & Notifications (Week 4)
- [ ] Kitchen dashboard grouping (Immediate vs Scheduled)
- [ ] Kitchen release logic
- [ ] WhatsApp notifications (order confirmation, ready for pickup)
- [ ] Kitchen staff alerts

### Phase 5: Admin & Rollout (Week 5)
- [ ] Branch QR settings UI
- [ ] QR code generation tool
- [ ] Slot capacity dashboard
- [ ] Feature flag controls
- [ ] Pilot branch enablement

### Phase 6: Testing & Launch (Week 6)
- [ ] End-to-end testing (all flows)
- [ ] Security audit (token replay, price tampering)
- [ ] Load testing (slot capacity, concurrent orders)
- [ ] Pilot launch (1-2 branches)
- [ ] Monitor KPIs and iterate

---

## 11) Testing Strategy

### 11.1) Security Tests
- [ ] QR tampering: Modify branchId/tableId in URL → should reject
- [ ] Token replay: Reuse same JWT for multiple orders → should reject after first use
- [ ] Price manipulation: Send custom prices in API → server should ignore
- [ ] Cross-branch: Use branch A token for branch B order → should reject
- [ ] Expired token: Use token after 10 min TTL → should reject

### 11.2) Payment Tests
- [ ] Unpaid order: Verify order NOT in kitchen before webhook
- [ ] Paid order: Verify order released to kitchen after webhook
- [ ] Deposit flow: Verify 50% charged, remaining tracked
- [ ] Refund before prep: Verify full deposit refunded
- [ ] Refund after prep: Verify deposit forfeited

### 11.3) Capacity Tests
- [ ] Slot full: Attempt 11th order in 10-order slot → should reject
- [ ] Concurrent booking: 2 users book last slot simultaneously → only 1 succeeds
- [ ] Scheduled release: Verify order released X minutes before scheduled time

### 11.4) User Experience Tests
- [ ] QR scan → menu loads < 2 seconds
- [ ] Order placement → payment link generated < 3 seconds
- [ ] Payment → kitchen notification < 10 seconds
- [ ] Smart Dining Slip sent within 30 seconds of payment

---

## 12) Monitoring & KPIs

### 12.1) Operational Metrics
- **Draft → Paid Conversion:** Target > 70%
- **Expired Drafts:** Target < 20%
- **Scheduled No-Shows:** Target < 10%
- **Kitchen On-Time Rate:** Target > 90% (orders ready within ETA)
- **Slot Utilization:** Track peak vs off-peak

### 12.2) Financial Metrics
- **5% Fee Acceptance:** Track orders with fee vs cash
- **Effective Take Rate:** Platform fee - gateway fee
- **Deposit Collection Rate:** % of remote orders with deposit paid
- **Refund Rate:** Target < 5%

### 12.3) Security Metrics
- **Token Replay Attempts:** Should be 0
- **Price Tampering Attempts:** Log and alert
- **Cross-Branch Attempts:** Log and alert
- **OTP Abuse:** Track excessive OTP requests per phone

### 12.4) Alerts
- Slot capacity > 90% → notify branch manager
- Unpaid draft > 10 min → auto-cancel
- Scheduled order not released → alert kitchen
- Refund request → notify admin
- Security violation → immediate alert

---

## Summary

This implementation plan provides:
- ✅ Complete fraud mitigation (signed QR, short-lived tokens, server pricing)
- ✅ Clear 5% fee policy (no VAT, simple display)
- ✅ 50% deposit for remote orders
- ✅ Refund windows (full before prep, forfeit after)
- ✅ OTP verification (5/hour limit)
- ✅ Slot capacity management (10/30min default)
- ✅ Non-disruptive architecture (feature flags, isolated routes)
- ✅ Complete API contracts and examples
- ✅ 6-week phased rollout plan
- ✅ Comprehensive testing and monitoring

**Status:** Ready for implementation approval and resource allocation.
