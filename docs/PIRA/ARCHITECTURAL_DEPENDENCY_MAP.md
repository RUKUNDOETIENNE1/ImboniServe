# Architectural Dependency Map

**Document Type:** Dependency Diagrams  
**Phase:** Design Only  

---

## Purpose

Show current vs target dependencies, highlighting duplicate paths, dead paths, and missing integrations.

---

## 1. Customer Identity Dependencies

### Current

```
                    ┌─────────────────┐
                    │  GuestRecognition│
                    │  Service         │
                    │  (creates        │
                    │   Customer)      │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   Customer      │
                    │   (model)       │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
     ┌──────────────┐ ┌───────────┐ ┌──────────────┐
     │ LoyaltyService│ │ CRM API   │ │ Contact      │
     │ (reads)       │ │ (reads)   │ │ Service      │
     └──────────────┘ └───────────┘ │ (SEPARATE)   │
                                   └──────────────┘

     ┌──────────────────────────────────┐
     │  Reservation                     │
     │  (customerName/phone as strings  │
     │   NO link to Customer)           │
     └──────────────────────────────────┘

     ┌──────────────────────────────────┐
     │  HotelRoom                       │
     │  (guestName/phone as strings     │
     │   NO link to Customer)           │
     └──────────────────────────────────┘
```

**Problems:**
- Contact is a parallel system, no bridge
- Reservation has no FK to Customer
- HotelRoom has no FK to Customer
- GuestRecognitionService creates customers directly instead of via CustomerService

### Target

```
                    ┌─────────────────────┐
                    │  CustomerService    │
                    │  (findOrCreateByPhone│
                    │   sole entry point) │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Customer          │
                    │   (model)           │
                    │   + contactId FK    │
                    └──────────┬──────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
          ▼                    ▼                    ▼
  ┌───────────────┐  ┌──────────────┐  ┌──────────────────┐
  │ LoyaltyService│  │ Contact      │  │ Reservation      │
  │ (earnPoints,  │  │ (bridge via  │  │ (customerId FK)  │
  │  getBalance)  │  │  contactId)  │  │                  │
  └───────────────┘  └──────────────┘  └──────────────────┘
                                              │
          ┌───────────────────────────────────┘
          │
          ▼
  ┌──────────────────┐
  │ HotelRoom        │
  │ (customerId FK)  │
  └──────────────────┘

  GuestRecognitionService
    ├── Calls CustomerService.findOrCreateByPhone (not direct prisma)
    ├── Calls LoyaltyService.earnPoints (not direct increment)
    └── Calls CustomerService.updateVisitStats (not updateCustomerStats)
```

**Changes:**
- ✅ CustomerService is sole customer creation point
- ✅ Contact ↔ Customer bridge via contactId
- ✅ Reservation has customerId FK
- ✅ HotelRoom has customerId FK
- ✅ GuestRecognitionService delegates to CustomerService

---

## 2. Payment Completion Dependencies

### Current

```
┌──────────┐    ┌─────────────────┐    ┌──────────────────────┐
│  CASH    │    │  MoMo Polling   │    │  IremboPay Webhook 1 │
│  Sales   │    │  status API     │    │  /api/payments/irebo │
│  Service │    │                 │    │  /webhook.ts         │
└────┬─────┘    └───────┬─────────┘    └──────────┬───────────┘
     │                  │                        │
     ▼                  ▼                        ▼
  ┌────────┐     ┌──────────────┐     ┌────────────────────┐
  │Dining  │     │processSuccess│     │Update Tx +         │
  │Slip    │     │Payment()     │     │Side Effects        │
  │+ Guest │     │+ Guest Recog │     │+ Guest Recog       │
  │Recog   │     │+ Notif       │     │+ Ledger            │
  │        │     │+ Broadcast   │     │+ Subs              │
  │NO Ledg │     │NO Dining Slip│     │+ Affiliate         │
  │NO Subs │     │NO Ledger     │     │+ Kitchen           │
  │NO Affil│     │NO Subs       │     │NO Dining Slip      │
  └────────┘     └──────────────┘     └────────────────────┘

                        ┌──────────────────────┐
                        │  IremboPay Webhook 2 │
                        │  /api/webhooks/      │
                        │  irembopay.ts        │
                        └──────────┬───────────┘
                                   │
                                   ▼
                        ┌────────────────────┐
                        │Update Tx           │
                        │+ Subs Activation   │
                        │NO Guest Recog      │
                        │NO Ledger           │
                        │NO Idempotency      │
                        └────────────────────┘
```

**Problems:**
- 4 different paths with different side effects
- Dining Slip missing from 3 of 4 paths
- Ledger missing from 2 of 4 paths
- Guest Recognition missing from 1 of 4 paths
- No idempotency on Webhook 2
- Duplicate webhook endpoints

### Target

```
┌──────────┐    ┌─────────────────┐    ┌──────────────────────┐
│  CASH    │    │  MoMo Polling   │    │  IremboPay Webhook   │
│  Sales   │    │  status API     │    │  /api/payments/irebo │
│  Service │    │                 │    │  /webhook.ts         │
└────┬─────┘    └───────┬─────────┘    └──────────┬───────────┘
     │                  │                        │
     └──────────────────┼────────────────────────┘
                        │
                        ▼
          ┌─────────────────────────────┐
          │  PaymentCompletionService   │
          │  (sole orchestrator)        │
          │                             │
          │  onPaymentSuccess():        │
          │  ├── Sale status update     │
          │  ├── Smart Dining Slip      │
          │  ├── Guest Recognition      │
          │  ├── Notification           │
          │  ├── Real-time Broadcast    │
          │  ├── FinancialLedgerEntry   │
          │  ├── Subscription Activation│
          │  ├── Affiliate Commissions  │
          │  ├── Kitchen Release        │
          │  └── Order Token            │
          │                             │
          │  onPaymentFailure():        │
          │  ├── Sale status (FAILED)   │
          │  ├── FinancialLedgerEntry   │
          │  └── Alert Delivery         │
          └─────────────────────────────┘

     /api/webhooks/irembopay.ts → 410 GONE (retired)
```

**Changes:**
- ✅ All paths converge into PaymentCompletionService
- ✅ All side effects covered for all providers
- ✅ All side effects idempotent
- ✅ Duplicate webhook retired
- ✅ Dining Slip generated for every successful payment

---

## 3. Loyalty Points Dependencies

### Current

```
┌─────────────────────┐
│ Order Completed      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│GuestRecognition     │
│Service              │
│.onOrderCompleted()  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────────┐
│CustomerService                  │
│.updateCustomerStats()           │
│  ├── totalSpent: increment      │
│  ├── lifetimeSpendCents: incr   │
│  ├── visitCount: increment      │
│  ├── loyaltyPoints: increment   │ ← PROBLEM: no ledger entry
│  └── lastVisit: new Date()      │
└─────────────────────────────────┘

┌─────────────────────┐     ┌─────────────────────┐
│LoyaltyService       │     │/api/loyalty/issue   │
│.earnPoints()        │     │(manual)             │
│  ├── PointsLedger   │     │  ├── PointsLedger   │
│  └── Customer.      │     │  └── Customer.      │
│     loyaltyPoints   │     │     loyaltyPoints   │
│                     │     │                     │
│  NEVER CALLED       │     │  BYPASSES SERVICE   │
└─────────────────────┘     └─────────────────────┘

┌─────────────────────┐
│LoyaltyService       │
│.getBalance()        │
│  reads PointsLedger │ ← DIVERGES from Customer.loyaltyPoints
└─────────────────────┘
```

### Target

```
┌─────────────────────┐
│ Order Completed      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────┐
│GuestRecognitionService      │
│.onOrderCompleted()          │
└──────────┬──────────────────┘
           │
     ┌─────┴──────┐
     │            │
     ▼            ▼
┌──────────┐  ┌──────────────────────┐
│Customer  │  │LoyaltyService        │
│Service   │  │.earnPoints()         │
│.update   │  │  ├── PointsLedger    │
│VisitStats│  │  └── Customer.       │
│()        │  │     loyaltyPoints    │
│  │       │  │                      │
│  ├──visit│  │  CANONICAL OWNER     │
│  ├──spend│  │  OF LOYALTY POINTS   │
│  └──last │  └──────────────────────┘
└──────────┘

┌─────────────────────┐
│/api/loyalty/issue   │
│  DELEGATES to       │
│  LoyaltyService     │
│  .issueManual()     │
└─────────────────────┘

┌─────────────────────┐
│LoyaltyService       │
│.getBalance()        │
│  reads PointsLedger │ ← MATCHES Customer.loyaltyPoints
└─────────────────────┘
```

**Changes:**
- ✅ LoyaltyService.earnPoints is the sole points mutation path
- ✅ CustomerService no longer touches loyaltyPoints
- ✅ Manual issuance delegates to LoyaltyService
- ✅ getBalance() and Customer.loyaltyPoints are reconciled

---

## 4. VIP Tier Dependencies

### Current

```
┌─────────────────────┐     ┌─────────────────────┐
│GuestRecognition     │     │LoyaltyService       │
│Service              │     │.updateVIPStatus()   │
│.recalculateVIPTier()│     │  spend-only         │
│  visits + spend     │     │  200x higher        │
│  CALLED             │     │  NEVER CALLED       │
└──────────┬──────────┘     └─────────────────────┘
           │                 DEAD CODE
           ▼
┌─────────────────────┐
│Customer.vipTier     │
└─────────────────────┘
```

### Target

```
┌─────────────────────────────┐
│VIPTierConfig (single source)│
│  Loaded from DB or env      │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│GuestRecognitionService      │
│.calculateVIPTier()          │
│.recalculateVIPTier()        │
│  SOLE OWNER                 │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────┐
│Customer.vipTier     │
└──────────┬──────────┘
           │
     ┌─────┼──────┬──────────┐
     │     │      │          │
     ▼     ▼      ▼          ▼
  Waiter  CRM  Reservations  Checkout
  Dashboard     UI           (future)
```

**Changes:**
- ✅ Single threshold config
- ✅ Single calculation function
- ✅ Single update trigger
- ✅ Dead code removed
- ✅ VIP tier visible across all surfaces

---

## 5. Reservation Dependencies

### Current

```
┌──────────────────┐     ┌──────────────────────┐
│ Reservations UI  │────→│ /api/reservations    │
│                  │     │  index.ts + [id].ts  │
└──────────────────┘     └──────────┬───────────┘
                                   │
                                   ▼
                         ┌──────────────────────┐
                         │ prisma.reservation   │
                         │ (direct calls)       │
                         └──────────────────────┘

┌──────────────────────────────────┐
│ ReservationService (258 lines)   │
│  NEVER CALLED                    │
│  DEAD CODE                       │
└──────────────────────────────────┘

         NO LINK TO CUSTOMER
         NO LINK TO GUEST RECOGNITION
         NO LINK TO LOYALTY
         NO DEPOSIT PAYMENT
         NO REAL CONFIRMATION SEND
```

### Target

```
┌──────────────────┐     ┌──────────────────────┐
│ Reservations UI  │────→│ /api/reservations    │
│                  │     │  (thin delegates)    │
└──────────────────┘     └──────────┬───────────┘
                                   │
                                   ▼
                         ┌──────────────────────┐
                         │ ReservationService   │
                         │  (canonical handler) │
                         └──────────┬───────────┘
                                    │
                          ┌─────────┼──────────┐
                          │         │          │
                          ▼         ▼          ▼
                   ┌──────────┐ ┌────────┐ ┌──────────┐
                   │Customer  │ │Notific.│ │Payment   │
                   │Service   │ │Service │ │Completion│
                   │(find or  │ │(confirm│ │Service   │
                   │ create)  │ │ + rem) │ │(deposit) │
                   └──────────┘ └────────┘ └──────────┘
                          │
                          ▼
                   ┌──────────┐
                   │Customer  │
                   │(linked)  │
                   └──────────┘
                          │
                   ┌──────┴──────┐
                   │             │
                   ▼             ▼
              ┌─────────┐  ┌──────────┐
              │Loyalty  │  │Guest     │
              │Service  │  │Recognition│
              └─────────┘  └──────────┘
```

**Changes:**
- ✅ ReservationService is canonical
- ✅ API handlers are thin delegates
- ✅ Reservation links to Customer via customerId
- ✅ Confirmation sent via NotificationService
- ✅ Deposit payment via PaymentCompletionService
- ✅ Guest recognition and loyalty connected

---

## 6. Dead Paths Summary

| Dead Path | Status | Action |
|-----------|--------|--------|
| `LoyaltyService.earnPoints` | Never called | **Activate** — wire into onOrderCompleted |
| `LoyaltyService.redeemPoints` | Never called | **Activate** — wire into checkout redemption |
| `LoyaltyService.updateVIPStatus` | Never called | **Delete** — GuestRecognitionService is canonical |
| `LoyaltyService.getVIPBenefits` | Never called | **Delete** — re-introduce when VIP benefits are productized |
| `LoyaltyService.applyVIPDiscount` | Never called | **Delete** — re-introduce when VIP discounts are productized |
| `CustomerService.getTopCustomers` | Never called | **Delete** — CRM API provides this |
| `CustomerService.redeemLoyaltyPoints` | Never called | **Delete** — LoyaltyService.redeemPoints is canonical |
| `ReservationService` (all methods) | Bypassed | **Activate** — API handlers delegate to it |
| `InTouchService` | Deprecated | **Delete** — legacy payment provider |
| `/api/webhooks/irembopay.ts` | Duplicate | **Retire** — canonical webhook is /api/payments/irembo/webhook.ts |
| `HotelRoomsPluginAdapter` | Empty adapter | **Delete** — no backing functionality |
| `RoomServicePluginAdapter` | Empty adapter | **Delete** — no backing functionality |
| `/dashboard/customers` page | Superseded | **Remove** — CRM is canonical |

---

## 7. Missing Integration Paths

| Missing Path | From | To | Wave |
|-------------|------|----|------|
| Reservation → Customer | ReservationService | CustomerService.findOrCreateByPhone | Wave 1-2 |
| Reservation → Notification | ReservationService | NotificationService.sendWhatsApp | Wave 2 |
| Reservation → Payment | ReservationService | PaymentCompletionService (deposit) | Wave 2 |
| Reservation → Guest Recognition | ReservationService | GuestRecognitionService.onReservationConfirmed | Wave 2 |
| Hotel → Customer | HotelService | CustomerService.findOrCreateByPhone | Wave 2 |
| Hotel → Guest Recognition | HotelService | GuestRecognitionService.onHotelCheckIn | Wave 2 |
| Hotel → Orders | HotelService | SalesService (room service) | Wave 2 (future) |
| Waiter → Guest Intelligence | Waiter Dashboard | GuestRecognitionService.getGuestIntelligence | Wave 2 |
| Recommendations → Guest Intelligence | RecommendationService | GuestRecognitionService.getGuestIntelligence | Wave 2 |
| Contact ↔ Customer bridge | ContactService | CustomerService (auto-create) | Wave 2 |
| CASH → PaymentCompletionService | SalesService | PaymentCompletionService | Wave 1 |
| MoMo → PaymentCompletionService | MoMo status handler | PaymentCompletionService | Wave 1 |
| IremboPay → PaymentCompletionService | IremboPay webhook | PaymentCompletionService | Wave 1 |
| Navigation → CEO Dashboard | DashboardLayout | /dashboard/ceo | Wave 2 |
| Navigation → CFO Dashboard | DashboardLayout | /dashboard/cfo | Wave 2 |
| Navigation → Waiter Dashboard | DashboardLayout | /dashboard/waiter | Wave 2 |
| Navigation → Sales | DashboardLayout | /dashboard/sales | Wave 2 |
